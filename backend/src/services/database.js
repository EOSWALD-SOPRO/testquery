import sql from 'mssql';

// Connection pools for each environment
const pools = {
  TRN: null,
  PRD: null
};

/**
 * SQL Server configuration for each environment
 */
function getConfig(env) {
  const baseConfig = {
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    options: {
      encrypt: process.env.SQL_ENCRYPT === 'true',
      trustServerCertificate: process.env.SQL_TRUST_CERT !== 'false',
      enableArithAbort: true,
      connectTimeout: 30000,
      requestTimeout: 60000
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  };

  if (env === 'TRN') {
    return {
      ...baseConfig,
      server: process.env.SQL_SERVER_TRN || 'sql-trn.soprofen.local',
      database: process.env.SQL_DATABASE_TRN || 'Production'
    };
  } else if (env === 'PRD') {
    return {
      ...baseConfig,
      server: process.env.SQL_SERVER_PRD || 'sql-prd.soprofen.local',
      database: process.env.SQL_DATABASE_PRD || 'Production'
    };
  }

  throw new Error(`Unknown environment: ${env}`);
}

/**
 * Get or create a connection pool for the specified environment
 */
export async function getPool(env) {
  if (!['TRN', 'PRD'].includes(env)) {
    throw new Error(`Invalid environment: ${env}. Must be TRN or PRD.`);
  }

  if (!pools[env]) {
    const config = getConfig(env);
    pools[env] = await sql.connect(config);
    console.log(`Connected to SQL Server (${env}): ${config.server}`);
  }

  return pools[env];
}

/**
 * Execute a SQL query in the specified environment
 * @param {string} sqlQuery - The SQL query to execute
 * @param {string} env - Environment: 'TRN' or 'PRD'
 * @returns {Object} - Query results with columns, rows, and metadata
 */
export async function executeQuery(sqlQuery, env) {
  // Validate SQL is read-only (SELECT only)
  const normalizedSql = sqlQuery.trim().toUpperCase();
  const dangerousKeywords = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'TRUNCATE', 'EXEC', 'EXECUTE', 'MERGE'];

  for (const keyword of dangerousKeywords) {
    // Check if keyword appears at start of statement or after semicolon
    const regex = new RegExp(`(^|;\\s*)${keyword}\\s`, 'i');
    if (regex.test(sqlQuery)) {
      throw new Error(`Query contains forbidden keyword: ${keyword}. Only SELECT queries are allowed.`);
    }
  }

  const startTime = Date.now();
  const pool = await getPool(env);

  try {
    const result = await pool.request().query(sqlQuery);
    const took = Date.now() - startTime;

    // Extract column names
    const columns = result.recordset?.columns
      ? Object.keys(result.recordset.columns)
      : (result.recordset?.[0] ? Object.keys(result.recordset[0]) : []);

    // Convert rows to array format
    const rows = result.recordset?.map(row => columns.map(col => row[col])) || [];

    return {
      columns,
      rows,
      rowCount: result.rowsAffected?.[0] || rows.length,
      took,
      plan: `Executed on ${env} in ${took}ms`
    };
  } catch (err) {
    const took = Date.now() - startTime;
    throw {
      ...err,
      took,
      sqlState: err.state,
      sqlMessage: err.originalError?.message || err.message
    };
  }
}

/**
 * Close all database connections
 */
export async function closeAllPools() {
  for (const [env, pool] of Object.entries(pools)) {
    if (pool) {
      await pool.close();
      pools[env] = null;
      console.log(`Disconnected from SQL Server (${env})`);
    }
  }
}

// Cleanup on process exit
process.on('SIGINT', async () => {
  await closeAllPools();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeAllPools();
  process.exit(0);
});
