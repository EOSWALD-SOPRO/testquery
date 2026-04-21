// Query execution API — SQL Server backend
// Set VITE_API_URL in .env and uncomment the real calls below

import { apiFetch } from './client';
import { QUERIES as MOCK_QUERIES, RESULT_COLUMNS, RESULT_ROWS } from '../data/mockData';

/**
 * Execute a SQL query against TRN or PRD.
 * Returns { columns: string[], rows: any[][], took: number, plan: string }
 *
 * Backend expected: POST /api/queries/execute
 *   Body: { sql: string, env: "TRN" | "PRD" }
 *   The backend should connect to the appropriate SQL Server instance
 *   and return the result set along with execution metadata.
 */
export async function executeQuery(sql, env) {
  // TODO: uncomment once backend is ready
  // return apiFetch('/queries/execute', {
  //   method: 'POST',
  //   body: JSON.stringify({ sql, env }),
  // });

  // Mock — simulate network + query time
  const delay = env === 'PRD' ? 620 : 460;
  await new Promise(r => setTimeout(r, delay));
  return {
    columns: RESULT_COLUMNS,
    rows: RESULT_ROWS,
    took: env === 'PRD' ? 62 : 46,
    plan: 'Clustered Index Seek + Hash Match Join',
  };
}

/**
 * Fetch the full query library from the repository.
 * Returns QUERIES[] as defined in mockData.js
 *
 * Backend expected: GET /api/queries
 */
export async function fetchQueries() {
  // TODO: uncomment once backend is ready
  // return apiFetch('/queries');

  return MOCK_QUERIES;
}

/**
 * Save a query buffer back to its file in the repository.
 *
 * Backend expected: PUT /api/queries/:id
 *   Body: { sql: string }
 */
export async function saveQuery(id, sql) {
  // TODO: uncomment once backend is ready
  // return apiFetch(`/queries/${id}`, {
  //   method: 'PUT',
  //   body: JSON.stringify({ sql }),
  // });

  console.info('[API stub] saveQuery', id, sql.slice(0, 60) + '…');
}
