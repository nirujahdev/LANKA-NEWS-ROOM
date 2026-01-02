/**
 * Real-time Metrics Collection for Parallel Processing
 */

export interface ProcessingMetrics {
  fetch: {
    totalSources: number;
    successfulSources: number;
    failedSources: number;
    totalArticles: number;
    byLanguage: {
      en: { sources: number; articles: number };
      si: { sources: number; articles: number };
      ta: { sources: number; articles: number };
    };
    duration: number;
    rate: number; // articles per second
  };
  processing: {
    clustersProcessed: number;
    successful: number;
    failed: number;
    summariesGenerated: number;
    translationsGenerated: number;
    seoGenerated: number;
    imagesSelected: number;
    categoriesAssigned: number;
    duration: number;
    rate: number; // clusters per second
  };
  tasks: {
    summary: { total: number; successful: number; failed: number; avgDuration: number };
    translation: { total: number; successful: number; failed: number; avgDuration: number };
    seo: { total: number; successful: number; failed: number; avgDuration: number };
    image: { total: number; successful: number; failed: number; avgDuration: number };
    category: { total: number; successful: number; failed: number; avgDuration: number };
  };
  errors: Array<{
    stage: string;
    clusterId?: string;
    sourceId?: string;
    message: string;
    timestamp: number;
  }>;
  startTime: number;
  endTime?: number;
  totalDuration: number;
}

/**
 * Metrics Collector
 */
export class MetricsCollector {
  private metrics: ProcessingMetrics;
  
  constructor() {
    this.metrics = {
      fetch: {
        totalSources: 0,
        successfulSources: 0,
        failedSources: 0,
        totalArticles: 0,
        byLanguage: {
          en: { sources: 0, articles: 0 },
          si: { sources: 0, articles: 0 },
          ta: { sources: 0, articles: 0 },
      },
        duration: 0,
        rate: 0,
      },
      processing: {
        clustersProcessed: 0,
        successful: 0,
        failed: 0,
        summariesGenerated: 0,
        translationsGenerated: 0,
        seoGenerated: 0,
        imagesSelected: 0,
        categoriesAssigned: 0,
        duration: 0,
        rate: 0,
      },
      tasks: {
        summary: { total: 0, successful: 0, failed: 0, avgDuration: 0 },
        translation: { total: 0, successful: 0, failed: 0, avgDuration: 0 },
        seo: { total: 0, successful: 0, failed: 0, avgDuration: 0 },
        image: { total: 0, successful: 0, failed: 0, avgDuration: 0 },
        category: { total: 0, successful: 0, failed: 0, avgDuration: 0 },
      },
      errors: [],
      startTime: Date.now(),
      totalDuration: 0,
    };
  }
  
  /**
   * Record fetch metrics
   */
  recordFetch(stats: {
    totalSources: number;
    successfulSources: number;
    failedSources: number;
    totalArticles: number;
    byLanguage: {
      en: { sources: number; articles: number };
      si: { sources: number; articles: number };
      ta: { sources: number; articles: number };
    };
    duration: number;
  }): void {
    this.metrics.fetch = {
      ...stats,
      rate: stats.totalArticles / (stats.duration / 1000), // articles per second
    };
  }
  
  /**
   * Record processing metrics
   */
  recordProcessing(stats: {
    clustersProcessed: number;
    successful: number;
    failed: number;
    summariesGenerated: number;
    translationsGenerated: number;
    seoGenerated: number;
    imagesSelected: number;
    categoriesAssigned: number;
    duration: number;
  }): void {
    this.metrics.processing = {
      ...stats,
      rate: stats.clustersProcessed / (stats.duration / 1000), // clusters per second
    };
  }
  
  /**
   * Record task completion
   */
  recordTask(
    taskType: 'summary' | 'translation' | 'seo' | 'image' | 'category',
    success: boolean,
    duration: number
  ): void {
    const task = this.metrics.tasks[taskType];
    task.total++;
    if (success) {
      task.successful++;
    } else {
      task.failed++;
    }
    
    // Update average duration
    const totalDuration = task.avgDuration * (task.total - 1) + duration;
    task.avgDuration = totalDuration / task.total;
  }
  
  /**
   * Record error
   */
  recordError(stage: string, message: string, clusterId?: string, sourceId?: string): void {
    this.metrics.errors.push({
      stage,
      clusterId,
      sourceId,
      message,
      timestamp: Date.now(),
    });
  }
  
  /**
   * Finalize metrics
   */
  finalize(): ProcessingMetrics {
    this.metrics.endTime = Date.now();
    this.metrics.totalDuration = this.metrics.endTime - this.metrics.startTime;
    return this.getMetrics();
  }
  
  /**
   * Get current metrics
   */
  getMetrics(): ProcessingMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Print metrics summary
   */
  printSummary(): void {
    const m = this.metrics;
    
    console.log('\n📊 Processing Metrics Summary');
    console.log('═'.repeat(60));
    
    console.log('\n📥 Fetch Stage:');
    console.log(`  Sources: ${m.fetch.successful}/${m.fetch.totalSources} successful`);
    console.log(`  Articles: ${m.fetch.totalArticles} total`);
    console.log(`  By Language: EN(${m.fetch.byLanguage.en.articles}), SI(${m.fetch.byLanguage.si.articles}), TA(${m.fetch.byLanguage.ta.articles})`);
    console.log(`  Duration: ${(m.fetch.duration / 1000).toFixed(2)}s`);
    console.log(`  Rate: ${m.fetch.rate.toFixed(2)} articles/sec`);
    
    console.log('\n⚙️  Processing Stage:');
    console.log(`  Clusters: ${m.processing.successful}/${m.processing.clustersProcessed} successful`);
    console.log(`  Summaries: ${m.processing.summariesGenerated}`);
    console.log(`  Translations: ${m.processing.translationsGenerated}`);
    console.log(`  SEO: ${m.processing.seoGenerated}`);
    console.log(`  Images: ${m.processing.imagesSelected}`);
    console.log(`  Categories: ${m.processing.categoriesAssigned}`);
    console.log(`  Duration: ${(m.processing.duration / 1000).toFixed(2)}s`);
    console.log(`  Rate: ${m.processing.rate.toFixed(2)} clusters/sec`);
    
    console.log('\n🔧 Task Performance:');
    Object.entries(m.tasks).forEach(([type, stats]) => {
      const successRate = stats.total > 0 ? ((stats.successful / stats.total) * 100).toFixed(1) : '0';
      console.log(`  ${type}: ${stats.successful}/${stats.total} (${successRate}%) - avg ${stats.avgDuration.toFixed(0)}ms`);
    });
    
    if (m.errors.length > 0) {
      console.log('\n❌ Errors:');
      m.errors.slice(0, 10).forEach(err => {
        console.log(`  [${err.stage}] ${err.message}`);
      });
      if (m.errors.length > 10) {
        console.log(`  ... and ${m.errors.length - 10} more errors`);
      }
    }
    
    console.log(`\n⏱️  Total Duration: ${(m.totalDuration / 1000).toFixed(2)}s`);
    console.log('═'.repeat(60));
  }
}

