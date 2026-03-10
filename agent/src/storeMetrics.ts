// Simple metrics storage utility for family plugins

interface MetricEntry {
    ts: number;
    positive: number;
    negative: number;
    health: number;
}

// In-memory storage for metrics (could be extended to use database)
const metricsStore: MetricEntry[] = [];

export function storeMetrics(metrics: {
    positive: number;
    negative: number;
    health: number;
}) {
    const entry: MetricEntry = {
        ts: Date.now(),
        positive: metrics.positive,
        negative: metrics.negative,
        health: metrics.health,
    };
    
    metricsStore.push(entry);
    
    // Keep only last 1000 entries to prevent memory issues
    if (metricsStore.length > 1000) {
        metricsStore.shift();
    }
    
    console.log(`[Metrics] Stored: positive=${metrics.positive}, negative=${metrics.negative}, health=${metrics.health}`);
}

export function getMetrics(): MetricEntry[] {
    return [...metricsStore];
}

export function getLatestMetrics(): MetricEntry | null {
    return metricsStore.length > 0 ? metricsStore[metricsStore.length - 1] : null;
}