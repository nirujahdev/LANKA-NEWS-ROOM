/**
 * Progress Tracker for Real-time Monitoring
 */

export interface ProgressUpdate {
  stage: 'fetch' | 'insert' | 'process';
  progress: number; // 0-100
  current: number;
  total: number;
  message?: string;
  timestamp: number;
}

export type ProgressCallback = (update: ProgressUpdate) => void;

/**
 * Progress Tracker
 */
export class ProgressTracker {
  private callbacks: ProgressCallback[] = [];
  private updates: ProgressUpdate[] = [];
  
  /**
   * Register progress callback
   */
  onProgress(callback: ProgressCallback): void {
    this.callbacks.push(callback);
  }
  
  /**
   * Remove progress callback
   */
  offProgress(callback: ProgressCallback): void {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }
  
  /**
   * Emit progress update
   */
  emit(stage: 'fetch' | 'insert' | 'process', current: number, total: number, message?: string): void {
    const progress = total > 0 ? Math.round((current / total) * 100) : 0;
    const update: ProgressUpdate = {
      stage,
      progress,
      current,
      total,
      message,
      timestamp: Date.now(),
    };
    
    this.updates.push(update);
    
    // Call all callbacks
    this.callbacks.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error('[ProgressTracker] Callback error:', error);
      }
    });
    
    // Log progress
    console.log(`[ProgressTracker] ${stage}: ${current}/${total} (${progress}%)${message ? ` - ${message}` : ''}`);
  }
  
  /**
   * Get all updates
   */
  getUpdates(): ProgressUpdate[] {
    return [...this.updates];
  }
  
  /**
   * Get latest update for a stage
   */
  getLatest(stage?: 'fetch' | 'insert' | 'process'): ProgressUpdate | null {
    const filtered = stage 
      ? this.updates.filter(u => u.stage === stage)
      : this.updates;
    
    return filtered.length > 0 ? filtered[filtered.length - 1] : null;
  }
  
  /**
   * Clear updates
   */
  clear(): void {
    this.updates = [];
  }
}

