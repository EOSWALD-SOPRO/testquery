// Load config FIRST (initializes dotenv)
import { config } from './config.js';

import express from 'express';
import cors from 'cors';

import queriesRouter from './routes/queries.js';
import githubRouter from './routes/github.js';
import healthRouter from './routes/health.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = config.port;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/queries', queriesRouter);
app.use('/api/github', githubRouter);
app.use('/api/health', healthRouter);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  SOPROFEN Production Query Editor - Backend API            ║
╠════════════════════════════════════════════════════════════╣
║  Server running on http://localhost:${PORT}                   ║
║  Environment: ${process.env.NODE_ENV || 'development'}                              ║
╚════════════════════════════════════════════════════════════╝
  `);
});

export default app;
