import { Router } from 'express';
import { getPool } from '../services/database.js';

const router = Router();

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      api: 'healthy'
    }
  };

  // Check TRN database connection
  try {
    const pool = await getPool('TRN');
    await pool.request().query('SELECT 1 AS check');
    health.services.database_trn = 'healthy';
  } catch (err) {
    health.services.database_trn = 'unhealthy';
    health.status = 'degraded';
  }

  // Check PRD database connection
  try {
    const pool = await getPool('PRD');
    await pool.request().query('SELECT 1 AS check');
    health.services.database_prd = 'healthy';
  } catch (err) {
    health.services.database_prd = 'unhealthy';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;
