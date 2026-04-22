import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { executeQuery } from '../services/database.js';
import {
  getAllQueries,
  getQueryById,
  saveQuery,
  createQuery,
  deleteQuery
} from '../services/queryRepository.js';

const router = Router();

/**
 * GET /api/queries
 * Get all queries from the repository
 */
router.get('/', asyncHandler(async (req, res) => {
  const queries = await getAllQueries();
  res.json(queries);
}));

/**
 * GET /api/queries/:id
 * Get a single query by ID
 */
router.get('/:folder/:file', asyncHandler(async (req, res) => {
  const id = `${req.params.folder}/${req.params.file}`;
  const query = await getQueryById(id);

  if (!query) {
    return res.status(404).json({ error: 'Query not found' });
  }

  res.json(query);
}));

/**
 * POST /api/queries/execute
 * Execute a SQL query
 */
router.post('/execute', asyncHandler(async (req, res) => {
  const { sql, env } = req.body;

  // Validate input
  if (!sql || typeof sql !== 'string') {
    return res.status(400).json({
      error: 'Missing or invalid SQL query',
      code: 'INVALID_SQL'
    });
  }

  if (!env || !['TRN', 'PRD'].includes(env)) {
    return res.status(400).json({
      error: 'Invalid environment. Must be TRN or PRD.',
      code: 'INVALID_ENV'
    });
  }

  // Check for empty query
  if (sql.trim().length === 0) {
    return res.status(400).json({
      error: 'SQL query cannot be empty',
      code: 'EMPTY_SQL'
    });
  }

  try {
    const result = await executeQuery(sql, env);
    res.json(result);
  } catch (err) {
    // Handle SQL errors specifically
    if (err.sqlMessage) {
      return res.status(400).json({
        error: 'SQL execution error',
        message: err.sqlMessage,
        code: 'SQL_ERROR',
        took: err.took || 0
      });
    }
    throw err;
  }
}));

/**
 * PUT /api/queries/:folder/:file
 * Update a query
 */
router.put('/:folder/:file', asyncHandler(async (req, res) => {
  const id = `${req.params.folder}/${req.params.file}`;
  const { sql } = req.body;

  if (!sql || typeof sql !== 'string') {
    return res.status(400).json({
      error: 'Missing or invalid SQL content',
      code: 'INVALID_SQL'
    });
  }

  const query = await saveQuery(id, sql);
  res.json(query);
}));

/**
 * POST /api/queries
 * Create a new query
 */
router.post('/', asyncHandler(async (req, res) => {
  const { folder, name, sql } = req.body;

  if (!folder || !name || !sql) {
    return res.status(400).json({
      error: 'Missing required fields: folder, name, sql',
      code: 'MISSING_FIELDS'
    });
  }

  // Ensure .sql extension
  const fileName = name.endsWith('.sql') ? name : `${name}.sql`;

  const query = await createQuery(folder, fileName, sql);
  res.status(201).json(query);
}));

/**
 * DELETE /api/queries/:folder/:file
 * Delete a query
 */
router.delete('/:folder/:file', asyncHandler(async (req, res) => {
  const id = `${req.params.folder}/${req.params.file}`;

  // Check if query exists
  const query = await getQueryById(id);
  if (!query) {
    return res.status(404).json({ error: 'Query not found' });
  }

  await deleteQuery(id);
  res.json({ message: 'Query deleted successfully' });
}));

export default router;
