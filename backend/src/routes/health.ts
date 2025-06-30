import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @route GET /api/health
 * @desc Health check endpoint
 * @access Public
 */
router.get('/', (req: Request, res: Response) => {
  const healthStatus = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    services: {
      booqable: 'connected', // Will be updated with actual checks
      whipAround: 'connected',
      stripe: 'connected'
    }
  };

  logger.info('Health check requested', { 
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(200).json({
    success: true,
    data: healthStatus
  });
});

/**
 * @route GET /api/health/detailed
 * @desc Detailed health check with service status
 * @access Public
 */
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    // TODO: Add actual service health checks
    // For now, we'll just return basic status
    
    const detailedHealth = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      system: {
        memory: {
          used: process.memoryUsage().heapUsed / 1024 / 1024,
          total: process.memoryUsage().heapTotal / 1024 / 1024,
          external: process.memoryUsage().external / 1024 / 1024
        },
        cpu: {
          usage: process.cpuUsage()
        }
      },
      services: {
        booqable: {
          status: 'connected',
          endpoint: process.env.BOOQABLE_API_URL,
          lastCheck: new Date().toISOString()
        },
        whipAround: {
          status: 'connected',
          endpoint: process.env.WHIP_AROUND_API_URL,
          lastCheck: new Date().toISOString()
        },
        stripe: {
          status: 'connected',
          environment: 'sandbox',
          lastCheck: new Date().toISOString()
        }
      }
    };

    res.status(200).json({
      success: true,
      data: detailedHealth
    });
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(503).json({
      success: false,
      error: {
        message: 'Service temporarily unavailable',
        code: 'HEALTH_CHECK_FAILED'
      }
    });
  }
});

export default router; 