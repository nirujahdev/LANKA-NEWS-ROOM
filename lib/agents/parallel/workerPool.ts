/**
 * Worker Pool for Parallel Cluster Processing
 */

import { TaskQueue, Task, TaskResult } from './taskQueue';

export interface WorkerConfig {
  maxConcurrency: number;
  timeout: number;
  retries: number;
}

export type TaskExecutor = (task: Task) => Promise<any>;

/**
 * Worker Pool for executing tasks in parallel
 */
export class WorkerPool {
  private queue: TaskQueue;
  private executor: TaskExecutor;
  private config: WorkerConfig;
  private workers: Promise<void>[] = [];
  private isRunning = false;
  
  constructor(
    queue: TaskQueue,
    executor: TaskExecutor,
    config: WorkerConfig
  ) {
    this.queue = queue;
    this.executor = executor;
    this.config = config;
  }
  
  /**
   * Start worker pool
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Worker pool is already running');
    }
    
    this.isRunning = true;
    this.workers = [];
    
    // Create workers
    for (let i = 0; i < this.config.maxConcurrency; i++) {
      this.workers.push(this.worker(i));
    }
    
    console.log(`[WorkerPool] Started ${this.config.maxConcurrency} workers`);
  }
  
  /**
   * Stop worker pool and wait for completion
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    await Promise.all(this.workers);
    console.log('[WorkerPool] All workers stopped');
  }
  
  /**
   * Worker function
   */
  private async worker(workerId: number): Promise<void> {
    while (this.isRunning || !this.queue.isComplete()) {
      const task = this.queue.getNextTask();
      
      if (!task) {
        // No available tasks, wait a bit
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }
      
      const startTime = Date.now();
      
      try {
        // Execute task with timeout
        const result = await Promise.race([
          this.executor(task),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Task timeout')), this.config.timeout)
          ),
        ]);
        
        const duration = Date.now() - startTime;
        this.queue.completeTask(task.id, result, duration);
        
        console.log(`[WorkerPool:${workerId}] ✅ Completed task ${task.id} (${task.type}) in ${duration}ms`);
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.queue.failTask(task.id, errorMessage, duration);
        
        console.error(`[WorkerPool:${workerId}] ❌ Failed task ${task.id} (${task.type}): ${errorMessage}`);
      }
    }
  }
  
  /**
   * Wait for all tasks to complete
   */
  async waitForCompletion(): Promise<void> {
    while (!this.queue.isComplete()) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const stats = this.queue.getStats();
      if (stats.queued > 0 || stats.running > 0) {
        console.log(`[WorkerPool] Progress: ${stats.completed} completed, ${stats.running} running, ${stats.queued} queued, ${stats.failed} failed`);
      }
    }
  }
  
  /**
   * Get current statistics
   */
  getStats() {
    return this.queue.getStats();
  }
}

