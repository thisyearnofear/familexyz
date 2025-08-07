import {
  PerformanceConfig,
  BatchOperation,
  HederaFamilyMetrics,
  HederaServiceResponse
} from '../types/index.js';
import type { HederaService } from '../services/HederaService.js';

export class HederaPerformanceOptimizer {
  private batchQueue: Map<string, HederaFamilyMetrics[]> = new Map();
  private batchTimers: Map<string, NodeJS.Timeout> = new Map();
  private operationMetrics: Map<string, PerformanceMetric> = new Map();
  private isDisposed = false;

  constructor(
    private hederaService: HederaService,
    private config: PerformanceConfig
  ) {
    this.startPerformanceMonitoring();
  }

  /**
   * Add metrics to batch queue for optimized processing
   */
  async queueMetrics(
    familyId: string,
    metrics: HederaFamilyMetrics
  ): Promise<string> {
    if (this.isDisposed) {
      throw new Error('Performance optimizer has been disposed');
    }

    const batchId = `batch_${familyId}_${Date.now()}`;

    // Initialize queue for family if not exists
    if (!this.batchQueue.has(familyId)) {
      this.batchQueue.set(familyId, []);
    }

    // Add to queue
    const queue = this.batchQueue.get(familyId)!;
    queue.push(metrics);

    // Start batch timer if not already running
    if (!this.batchTimers.has(familyId)) {
      this.startBatchTimer(familyId);
    }

    // Force flush if batch is full
    if (queue.length >= this.config.batchSize) {
      await this.flushBatch(familyId);
    }

    return batchId;
  }

  /**
   * Force flush all pending batches
   */
  async flushAllBatches(): Promise<void> {
    const familyIds = Array.from(this.batchQueue.keys());
    const flushPromises = familyIds.map(familyId => this.flushBatch(familyId));
    await Promise.allSettled(flushPromises);
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    totalOperations: number;
    averageLatency: number;
    batchEfficiency: number;
    errorRate: number;
    queueSizes: Record<string, number>;
  } {
    let totalOps = 0;
    let totalLatency = 0;
    let totalErrors = 0;
    let totalBatches = 0;

    for (const [, metric] of this.operationMetrics) {
      totalOps += metric.operations;
      totalLatency += metric.totalLatency;
      totalErrors += metric.errors;
      totalBatches += metric.batches;
    }

    const queueSizes: Record<string, number> = {};
    for (const [familyId, queue] of this.batchQueue) {
      queueSizes[familyId] = queue.length;
    }

    return {
      totalOperations: totalOps,
      averageLatency: totalOps > 0 ? totalLatency / totalOps : 0,
      batchEfficiency: totalBatches > 0 ? (totalOps - totalErrors) / totalOps : 0,
      errorRate: totalOps > 0 ? totalErrors / totalOps : 0,
      queueSizes
    };
  }

  /**
   * Clear all caches and reset metrics
   */
  clearCaches(): void {
    const cache = this.hederaService.getCache();
    cache.consensusMessages.clear();
    cache.accountBalances.clear();
    cache.tokenInfo.clear();
    cache.lastUpdated.clear();

    this.operationMetrics.clear();
    console.log('✅ All caches cleared');
  }

  /**
   * Optimize cache based on usage patterns
   */
  optimizeCache(): void {
    const cache = this.hederaService.getCache();
    const now = Date.now();
    const cacheTimeout = this.config.cacheTimeout;

    // Remove expired cache entries
    let removed = 0;
    for (const [key, timestamp] of cache.lastUpdated) {
      if (now - timestamp > cacheTimeout) {
        cache.consensusMessages.delete(key);
        cache.accountBalances.delete(key);
        cache.tokenInfo.delete(key);
        cache.lastUpdated.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`🧹 Cleaned up ${removed} expired cache entries`);
    }
  }

  /**
   * Start batch timer for a specific family
   */
  private startBatchTimer(familyId: string): void {
    const timer = setTimeout(() => {
      this.flushBatch(familyId).catch(error => {
        console.error(`Batch flush failed for family ${familyId}:`, error);
      });
    }, this.config.batchInterval);

    this.batchTimers.set(familyId, timer);
  }

  /**
   * Flush batch for specific family
   */
  private async flushBatch(familyId: string): Promise<void> {
    const queue = this.batchQueue.get(familyId);
    if (!queue || queue.length === 0) return;

    const batch = queue.splice(0, this.config.batchSize);
    const startTime = Date.now();

    try {
      // Clear timer
      const timer = this.batchTimers.get(familyId);
      if (timer) {
        clearTimeout(timer);
        this.batchTimers.delete(familyId);
      }

      // Process batch through consensus service
      const promises = batch.map(metrics =>
        this.hederaService.consensus.submitInteractionDirect(
          this.hederaService.getConfig().familyTopicId || '',
          metrics
        )
      );

      const results = await Promise.allSettled(promises);

      // Calculate metrics
      const latency = Date.now() - startTime;
      let successful = 0;
      let failed = 0;

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.success) {
          successful++;
        } else {
          failed++;
        }
      }

      // Update operation metrics
      this.updateOperationMetrics(familyId, {
        operations: batch.length,
        latency,
        errors: failed,
        batches: 1
      });

      console.log(`✅ Batch processed for ${familyId}: ${successful} successful, ${failed} failed (${latency}ms)`);

      // If there are failures and retries are enabled, re-queue failed items
      if (failed > 0 && this.config.maxRetries > 0) {
        const failedItems = batch.slice(successful);
        queue.unshift(...failedItems);

        // Restart timer for retry
        if (queue.length > 0) {
          this.startBatchTimer(familyId);
        }
      }

    } catch (error) {
      console.error(`Batch processing error for family ${familyId}:`, error);

      // Re-queue all items on error
      queue.unshift(...batch);

      // Update error metrics
      this.updateOperationMetrics(familyId, {
        operations: 0,
        latency: Date.now() - startTime,
        errors: batch.length,
        batches: 0
      });

      // Restart timer for retry with backoff
      setTimeout(() => {
        if (queue.length > 0) {
          this.startBatchTimer(familyId);
        }
      }, this.config.retryDelay);
    }
  }

  /**
   * Update operation metrics for a family
   */
  private updateOperationMetrics(
    familyId: string,
    update: {
      operations: number;
      latency: number;
      errors: number;
      batches: number;
    }
  ): void {
    const existing = this.operationMetrics.get(familyId) || {
      operations: 0,
      totalLatency: 0,
      errors: 0,
      batches: 0,
      lastUpdated: Date.now()
    };

    existing.operations += update.operations;
    existing.totalLatency += update.latency;
    existing.errors += update.errors;
    existing.batches += update.batches;
    existing.lastUpdated = Date.now();

    this.operationMetrics.set(familyId, existing);

    // Update global service metrics
    const avgLatency = existing.operations > 0 ? existing.totalLatency / existing.operations : 0;
    const errorRate = existing.operations > 0 ? existing.errors / existing.operations : 0;
    const efficiency = existing.operations > 0 ? (existing.operations - existing.errors) / existing.operations : 0;

    this.hederaService.updatePerformanceMetrics({
      averageLatency: avgLatency,
      errorRate: errorRate,
      batchEfficiency: efficiency,
      operationsPerSecond: existing.operations / ((Date.now() - existing.lastUpdated) / 1000)
    });
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    const monitorInterval = setInterval(() => {
      if (this.isDisposed) {
        clearInterval(monitorInterval);
        return;
      }

      // Optimize caches periodically
      this.optimizeCache();

      // Log performance stats
      const stats = this.getPerformanceStats();
      if (stats.totalOperations > 0) {
        console.log(`📊 Performance Stats: ${stats.totalOperations} ops, ${stats.averageLatency.toFixed(2)}ms avg latency, ${(stats.errorRate * 100).toFixed(2)}% error rate`);
      }

    }, 60000); // Every minute
  }

  /**
   * Dispose of the optimizer and clean up resources
   */
  async dispose(): Promise<void> {
    if (this.isDisposed) return;

    this.isDisposed = true;

    // Flush all pending batches
    console.log('🔄 Flushing pending batches before disposal...');
    await this.flushAllBatches();

    // Clear all timers
    for (const [familyId, timer] of this.batchTimers) {
      clearTimeout(timer);
    }
    this.batchTimers.clear();

    // Clear queues
    this.batchQueue.clear();

    // Final performance report
    const finalStats = this.getPerformanceStats();
    console.log('📊 Final Performance Report:', finalStats);

    console.log('✅ HederaPerformanceOptimizer disposed');
  }
}

interface PerformanceMetric {
  operations: number;
  totalLatency: number;
  errors: number;
  batches: number;
  lastUpdated: number;
}
