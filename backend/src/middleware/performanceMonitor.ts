import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface RequestPerformance {
  method: string;
  path: string;
  startTime: number;
  endTime: number;
  duration: number;
  statusCode: number;
  memoryUsage: NodeJS.MemoryUsage;
}

class PerformanceMonitor {
  private metrics: RequestPerformance[] = [];
  private maxMetrics = 1000;
  private slowRequestThreshold = 1000; // 1 second

  logRequest(req: Request, res: Response, duration: number) {
    const metric: RequestPerformance = {
      method: req.method,
      path: req.path,
      startTime: Date.now() - duration,
      endTime: Date.now(),
      duration,
      statusCode: res.statusCode,
      memoryUsage: process.memoryUsage(),
    };

    // Add to metrics array
    this.metrics.push(metric);
    
    // Keep only the last N metrics to prevent memory leaks
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log slow requests
    if (duration > this.slowRequestThreshold) {
      logger.warn(`Slow request detected: ${req.method} ${req.path} took ${duration}ms`);
    }

    // Log memory warnings
    const memoryUsage = metric.memoryUsage;
    const memoryUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    if (memoryUsedMB > 100) { // Warn if using more than 100MB
      logger.warn(`High memory usage: ${memoryUsedMB.toFixed(2)}MB heap used`);
    }
  }

  getStats() {
    if (this.metrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        slowRequests: 0,
        errorRate: 0,
        memoryUsage: process.memoryUsage(),
      };
    }

    const totalRequests = this.metrics.length;
    const averageResponseTime = this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests;
    const slowRequests = this.metrics.filter(m => m.duration > this.slowRequestThreshold).length;
    const errorRequests = this.metrics.filter(m => m.statusCode >= 400).length;
    const errorRate = (errorRequests / totalRequests) * 100;

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime),
      slowRequests,
      errorRate: Math.round(errorRate * 100) / 100,
      memoryUsage: process.memoryUsage(),
      slowestEndpoints: this.getSlowestEndpoints(),
    };
  }

  private getSlowestEndpoints() {
    const endpointStats = new Map<string, { totalTime: number; count: number }>();

    this.metrics.forEach(metric => {
      const key = `${metric.method} ${metric.path}`;
      const existing = endpointStats.get(key) || { totalTime: 0, count: 0 };
      existing.totalTime += metric.duration;
      existing.count += 1;
      endpointStats.set(key, existing);
    });

    return Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        averageTime: Math.round(stats.totalTime / stats.count),
        requestCount: stats.count,
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 5); // Top 5 slowest
  }

  reset() {
    this.metrics = [];
    logger.info('Performance metrics reset');
  }
}

const performanceMonitor = new PerformanceMonitor();

export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Override the res.end method to capture when the response is sent
  const originalEnd = res.end.bind(res);
  
  res.end = function(chunk?: any, encoding?: any, cb?: any): Response {
    const duration = Date.now() - startTime;
    performanceMonitor.logRequest(req, res, duration);
    
    // Call the original end method and return its result
    return originalEnd(chunk, encoding, cb);
  };

  next();
};

export const getPerformanceStats = () => performanceMonitor.getStats();
export const resetPerformanceStats = () => performanceMonitor.reset();

export default performanceMonitor;