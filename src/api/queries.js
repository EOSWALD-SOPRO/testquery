// Query execution API — SQL Server backend
import { apiFetch } from './client';
import { QUERIES as MOCK_QUERIES, RESULT_COLUMNS, RESULT_ROWS } from '../data/mockData';

// Set to true to use mock data instead of real backend
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

/**
 * Execute a SQL query against TRN or PRD.
 * Returns { columns: string[], rows: any[][], took: number, plan: string }
 */
export async function executeQuery(sql, env) {
  if (USE_MOCK) {
    const delay = env === 'PRD' ? 620 : 460;
    await new Promise(r => setTimeout(r, delay));
    return {
      columns: RESULT_COLUMNS,
      rows: RESULT_ROWS,
      took: env === 'PRD' ? 62 : 46,
      plan: 'Clustered Index Seek + Hash Match Join',
    };
  }

  return apiFetch('/queries/execute', {
    method: 'POST',
    body: JSON.stringify({ sql, env }),
  });
}

/**
 * Fetch the full query library from the repository.
 * Returns QUERIES[] array
 */
export async function fetchQueries() {
  if (USE_MOCK) {
    return MOCK_QUERIES;
  }

  return apiFetch('/queries');
}

/**
 * Save a query buffer back to its file in the repository.
 */
export async function saveQuery(id, sql) {
  if (USE_MOCK) {
    console.info('[API stub] saveQuery', id, sql.slice(0, 60) + '...');
    return;
  }

  return apiFetch(`/queries/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ sql }),
  });
}
