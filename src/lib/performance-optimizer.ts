import { db } from './db';
import { cache } from './cache-manager';

/**
 * Database Query Performance Optimizer
 * Provides intelligent query optimization, connection pooling, and performance monitoring
 */

export interface QueryOptions {
  enableCache?: boolean;
  cacheTTL?: number;
  maxRetries?: number;
  timeout?: number;
  optimizeSelects?: boolean;
}

export interface PerformanceMetrics {
  queryTime: number;
  cacheHit: boolean;
  rowsReturned: number;
  query: string;
  timestamp: Date;
}

class PerformanceOptimizer {
  private metrics: PerformanceMetrics[] = [];
  private slowQueryThreshold = 1000; // 1 second

  /**
   * Execute optimized database query with performance monitoring
   */
  async executeQuery<T>(
    queryFn: () => Promise<T>,
    cacheKey?: string,
    options: QueryOptions = {}
  ): Promise<T> {
    const startTime = Date.now();
    let cacheHit = false;
    let result: T;

    try {
      // Try cache first if enabled
      if (options.enableCache && cacheKey) {
        const cached = await cache.get(cacheKey);
        if (cached) {
          cacheHit = true;
          result = cached as T;
          this.recordMetrics(cacheKey, Date.now() - startTime, true, 0);
          return result;
        }
      }

      // Execute query with timeout
      const queryPromise = queryFn();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), options.timeout || 30000);
      });

      result = await Promise.race([queryPromise, timeoutPromise]) as T;

      // Cache result if enabled
      if (options.enableCache && cacheKey && result) {
        await cache.set(cacheKey, result, options.cacheTTL || 300);
      }

      const queryTime = Date.now() - startTime;
      this.recordMetrics(cacheKey || 'unknown', queryTime, false, Array.isArray(result) ? result.length : 1);

      // Log slow queries
      if (queryTime > this.slowQueryThreshold) {
        console.warn(`Slow query detected: ${cacheKey}, took ${queryTime}ms`);
      }

      return result;
    } catch (error) {
      console.error('Query execution failed:', error);
      throw error;
    }
  }

  /**
   * Optimized product listing with intelligent caching and pagination
   */
  async getOptimizedProducts(params: {
    page: number;
    limit: number;
    category?: string;
    search?: string;
    priceRange?: { min?: number; max?: number };
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { page, limit, category, search, priceRange, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const skip = (page - 1) * limit;

    const cacheKey = `products:optimized:${JSON.stringify(params)}`;

    return this.executeQuery(
      async () => {
        // Build optimized where clause
        const where: any = { isPublished: true, isDeleted: false };

        if (category) {
          where.category = { slug: category };
        }

        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { tags: { contains: search, mode: 'insensitive' } }
          ];
        }

        if (priceRange) {
          where.price = {};
          if (priceRange.min) where.price.gte = priceRange.min;
          if (priceRange.max) where.price.lte = priceRange.max;
        }

        // Execute optimized parallel queries
        const [products, total] = await Promise.all([
          db.product.findMany({
            where,
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              compareAtPrice: true,
              inventory: true,
              isFeatured: true,
              isPublished: true,
              createdAt: true,
              images: {
                take: 1,
                orderBy: { position: 'asc' },
                select: { url: true, alt: true }
              },
              category: {
                select: { name: true, slug: true }
              },
              _count: {
                select: { reviews: true }
              }
            },
            orderBy: { [sortBy]: sortOrder },
            skip,
            take: limit
          }),
          db.product.count({ where })
        ]);

        return {
          products,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasMore: skip + products.length < total
          }
        };
      },
      cacheKey,
      { enableCache: true, cacheTTL: 600 } // 10 minutes cache
    );
  }

  /**
   * Optimized order analytics with aggregation
   */
  async getOptimizedOrderAnalytics(params: {
    startDate: Date;
    endDate: Date;
    userId?: string;
    vendorId?: string;
  }) {
    const { startDate, endDate, userId, vendorId } = params;
    const cacheKey = `analytics:orders:${startDate.toISOString()}:${endDate.toISOString()}:${userId || 'all'}:${vendorId || 'all'}`;

    return this.executeQuery(
      async () => {
        const where: any = {
          createdAt: { gte: startDate, lte: endDate },
          status: { not: 'CANCELLED' }
        };

        if (userId) where.userId = userId;
        if (vendorId) {
          where.items = {
            some: {
              product: { vendorId }
            }
          };
        }

        // Parallel execution of analytics queries
        const [
          totalSales,
          orderCount,
          averageOrderValue,
          topProducts,
          salesByDay
        ] = await Promise.all([
          // Total sales
          db.order.aggregate({
            where,
            _sum: { total: true }
          }),

          // Order count
          db.order.count({ where }),

          // Average order value
          db.order.aggregate({
            where,
            _avg: { total: true }
          }),

          // Top products by revenue
          db.orderItem.groupBy({
            by: ['productId'],
            where: {
              order: where
            },
            _sum: { total: true },
            _count: { productId: true },
            orderBy: { _sum: { total: 'desc' } },
            take: 10
          }),

          // Sales by day
          this.getSalesByDay(startDate, endDate, where)
        ]);

        return {
          totalSales: totalSales._sum.total || 0,
          orderCount,
          averageOrderValue: averageOrderValue._avg.total || 0,
          topProducts,
          salesByDay
        };
      },
      cacheKey,
      { enableCache: true, cacheTTL: 300 } // 5 minutes cache
    );
  }

  /**
   * Optimized user analytics with batch processing
   */
  async getOptimizedUserAnalytics(params: {
    startDate: Date;
    endDate: Date;
    role?: string;
  }) {
    const { startDate, endDate, role } = params;
    const cacheKey = `analytics:users:${startDate.toISOString()}:${endDate.toISOString()}:${role || 'all'}`;

    return this.executeQuery(
      async () => {
        const where: any = {
          createdAt: { gte: startDate, lte: endDate }
        };

        if (role) where.role = role;

        const [
          newUsers,
          activeUsers,
          usersByDay,
          topCustomers
        ] = await Promise.all([
          // New users count
          db.user.count({ where }),

          // Active users (users who placed orders)
          db.user.count({
            where: {
              ...where,
              orders: {
                some: {
                  createdAt: { gte: startDate, lte: endDate }
                }
              }
            }
          }),

          // Users by day
          this.getUsersByDay(startDate, endDate, role),

          // Top customers by order value
          db.user.findMany({
            where: {
              role: 'CUSTOMER',
              orders: {
                some: {
                  createdAt: { gte: startDate, lte: endDate },
                  status: { not: 'CANCELLED' }
                }
              }
            },
            select: {
              id: true,
              name: true,
              email: true,
              orders: {
                where: {
                  createdAt: { gte: startDate, lte: endDate },
                  status: { not: 'CANCELLED' }
                },
                select: { total: true }
              }
            },
            take: 10
          })
        ]);

        // Calculate top customers
        const processedTopCustomers = topCustomers.map(user => ({
          ...user,
          totalSpent: user.orders.reduce((sum, order) => sum + order.total, 0),
          orderCount: user.orders.length,
          orders: undefined // Remove orders from response
        })).sort((a, b) => b.totalSpent - a.totalSpent);

        return {
          newUsers,
          activeUsers,
          usersByDay,
          topCustomers: processedTopCustomers
        };
      },
      cacheKey,
      { enableCache: true, cacheTTL: 600 } // 10 minutes cache
    );
  }

  /**
   * Batch update inventory with transaction safety
   */
  async batchUpdateInventory(updates: { productId: string; variantId?: string; quantity: number; action: string }[]) {
    return this.executeQuery(
      async () => {
        return db.$transaction(async (tx) => {
          const results: any[] = [];

          for (const update of updates) {
            if (update.variantId) {
              // Update variant inventory
              const result = await tx.productVariant.update({
                where: { id: update.variantId },
                data: { inventory: { increment: update.quantity } }
              });
              results.push(result);
            } else {
              // Update product inventory
              const result = await tx.product.update({
                where: { id: update.productId },
                data: { inventory: { increment: update.quantity } }
              });
              results.push(result);
            }

            // Log inventory history
            await tx.inventoryHistory.create({
              data: {
                productId: update.productId,
                variantId: update.variantId,
                previousValue: 0, // Would need to fetch current value first
                newValue: update.quantity,
                action: update.action
              }
            });
          }

          return results;
        });
      },
      undefined,
      { timeout: 10000 }
    );
  }

  /**
   * Get sales breakdown by day
   */
  private async getSalesByDay(startDate: Date, endDate: Date, orderWhere: any) {
    const days: { date: string; sales: number; orders: number; }[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const dayWhere = {
        ...orderWhere,
        createdAt: { gte: dayStart, lte: dayEnd }
      };

      const dayData = await db.order.aggregate({
        where: dayWhere,
        _sum: { total: true },
        _count: { id: true }
      });

      days.push({
        date: currentDate.toISOString().split('T')[0],
        sales: dayData._sum.total || 0,
        orders: dayData._count.id || 0
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }

  /**
   * Get user registrations by day
   */
  private async getUsersByDay(startDate: Date, endDate: Date, role?: string) {
    const days: { date: string; users: number; }[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const where: any = {
        createdAt: { gte: dayStart, lte: dayEnd }
      };

      if (role) where.role = role;

      const dayCount = await db.user.count({ where });

      days.push({
        date: currentDate.toISOString().split('T')[0],
        users: dayCount
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }

  /**
   * Record performance metrics
   */
  private recordMetrics(query: string, queryTime: number, cacheHit: boolean, rowsReturned: number) {
    this.metrics.push({
      query,
      queryTime,
      cacheHit,
      rowsReturned,
      timestamp: new Date()
    });

    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * Get performance report
   */
  getPerformanceReport() {
    const recentMetrics = this.metrics.filter(
      m => Date.now() - m.timestamp.getTime() < 60 * 60 * 1000 // Last hour
    );

    const slowQueries = recentMetrics.filter(m => m.queryTime > this.slowQueryThreshold);
    const cacheHitRate = recentMetrics.length > 0
      ? (recentMetrics.filter(m => m.cacheHit).length / recentMetrics.length) * 100
      : 0;

    const averageQueryTime = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.queryTime, 0) / recentMetrics.length
      : 0;

    return {
      totalQueries: recentMetrics.length,
      slowQueries: slowQueries.length,
      cacheHitRate: Math.round(cacheHitRate),
      averageQueryTime: Math.round(averageQueryTime),
      slowestQueries: slowQueries
        .sort((a, b) => b.queryTime - a.queryTime)
        .slice(0, 5)
        .map(q => ({ query: q.query, time: q.queryTime }))
    };
  }

  /**
   * Clean up old metrics
   */
  cleanup() {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    this.metrics = this.metrics.filter(m => m.timestamp.getTime() > oneHourAgo);
  }
}

export const performanceOptimizer = new PerformanceOptimizer();

// Memory-leak safe cleanup - only in server environment
let performanceCleanupInterval: NodeJS.Timeout | null = null;

if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  // Cleanup metrics every hour - properly managed interval
  performanceCleanupInterval = setInterval(() => {
    try {
      performanceOptimizer.cleanup();
    } catch (error) {
      console.warn('Performance optimizer cleanup failed:', error);
    }
  }, 60 * 60 * 1000);
}

// Export cleanup function for proper memory management
export const cleanupPerformanceInterval = () => {
  if (performanceCleanupInterval) {
    clearInterval(performanceCleanupInterval);
    performanceCleanupInterval = null;
    console.log('🧹 Performance cleanup interval cleared');
  }
};
