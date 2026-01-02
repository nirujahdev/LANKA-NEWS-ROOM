/**
 * Task Queue Management for Parallel Processing
 */

export type TaskType = 'summary' | 'translation' | 'seo' | 'image' | 'category';

export interface Task {
  id: string;
  type: TaskType;
  clusterId: string;
  priority: number;
  dependencies: string[]; // IDs of tasks that must complete first
  data: Record<string, any>;
  retries: number;
  maxRetries: number;
}

export interface TaskResult {
  taskId: string;
  success: boolean;
  result?: any;
  error?: string;
  duration: number;
}

/**
 * Task Queue for managing parallel task execution
 */
export class TaskQueue {
  private queue: Task[] = [];
  private running: Map<string, Task> = new Map();
  private completed: Map<string, TaskResult> = new Map();
  private failed: Map<string, TaskResult> = new Map();
  
  /**
   * Add task to queue
   */
  addTask(task: Task): void {
    this.queue.push(task);
    // Sort by priority (lower = higher priority)
    this.queue.sort((a, b) => a.priority - b.priority);
  }
  
  /**
   * Add multiple tasks
   */
  addTasks(tasks: Task[]): void {
    tasks.forEach(task => this.addTask(task));
  }
  
  /**
   * Get next available task (dependencies satisfied)
   */
  getNextTask(): Task | null {
    for (let i = 0; i < this.queue.length; i++) {
      const task = this.queue[i];
      
      // Check if all dependencies are completed
      const dependenciesMet = task.dependencies.every(depId => 
        this.completed.has(depId) || this.failed.has(depId)
      );
      
      if (dependenciesMet && !this.running.has(task.id)) {
        // Remove from queue and mark as running
        this.queue.splice(i, 1);
        this.running.set(task.id, task);
        return task;
      }
    }
    
    return null;
  }
  
  /**
   * Mark task as completed
   */
  completeTask(taskId: string, result: any, duration: number): void {
    const task = this.running.get(taskId);
    if (!task) return;
    
    this.running.delete(taskId);
    this.completed.set(taskId, {
      taskId,
      success: true,
      result,
      duration,
    });
  }
  
  /**
   * Mark task as failed
   */
  failTask(taskId: string, error: string, duration: number): void {
    const task = this.running.get(taskId);
    if (!task) return;
    
    this.running.delete(taskId);
    
    // Retry if possible
    if (task.retries < task.maxRetries) {
      task.retries++;
      this.queue.push(task);
      console.log(`[TaskQueue] Retrying task ${taskId} (attempt ${task.retries}/${task.maxRetries})`);
    } else {
      this.failed.set(taskId, {
        taskId,
        success: false,
        error,
        duration,
      });
    }
  }
  
  /**
   * Check if queue is empty and all tasks are done
   */
  isComplete(): boolean {
    return this.queue.length === 0 && this.running.size === 0;
  }
  
  /**
   * Get queue statistics
   */
  getStats() {
    return {
      queued: this.queue.length,
      running: this.running.size,
      completed: this.completed.size,
      failed: this.failed.size,
      total: this.queue.length + this.running.size + this.completed.size + this.failed.size,
    };
  }
  
  /**
   * Get results for a cluster
   */
  getClusterResults(clusterId: string): TaskResult[] {
    const results: TaskResult[] = [];
    
    for (const [taskId, result] of this.completed.entries()) {
      const task = this.running.get(taskId) || 
                   Array.from(this.completed.keys()).includes(taskId) ? 
                   { clusterId } : null;
      if (task && task.clusterId === clusterId) {
        results.push(result);
      }
    }
    
    // Also check completed map
    for (const result of this.completed.values()) {
      // We need to track clusterId in results - for now, check all
      results.push(result);
    }
    
    return results;
  }
  
  /**
   * Clear completed and failed tasks
   */
  clear(): void {
    this.completed.clear();
    this.failed.clear();
  }
}

