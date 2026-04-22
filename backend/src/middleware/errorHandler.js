/**
 * Global error handler middleware
 */
export function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // SQL Server errors
  if (err.code === 'ETIMEOUT') {
    return res.status(504).json({
      error: 'Database timeout',
      message: 'Query execution took too long. Please optimize your query.',
      code: 'QUERY_TIMEOUT'
    });
  }

  if (err.code === 'ELOGIN') {
    return res.status(503).json({
      error: 'Database connection failed',
      message: 'Unable to connect to the database. Please check credentials.',
      code: 'DB_CONNECTION_FAILED'
    });
  }

  // GitHub API errors
  if (err.status === 401 && err.message?.includes('GitHub')) {
    return res.status(401).json({
      error: 'GitHub authentication failed',
      message: 'Invalid GitHub token. Please check your configuration.',
      code: 'GITHUB_AUTH_FAILED'
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      message: err.message,
      code: 'VALIDATION_ERROR'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR'
  });
}

/**
 * Async route wrapper to catch errors
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
