// Query execution API — SQL Server backend
import { apiFetch } from './client';
import {
  QUERIES as MOCK_QUERIES,
  RESULT_COLUMNS,
  RESULT_ROWS,
  WORKCENTERS as MOCK_WORKCENTERS,
  ATTRIBUTE_MODELS as MOCK_ATTRIBUTE_MODELS,
} from '../data/mockData';

// Set to true to use mock data instead of real backend
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

/**
 * Execute a SQL query against TRN or PRD.
 *
 * @param {string}      sql      SQL script to execute.
 * @param {'TRN'|'PRD'} env      Target environment.
 * @param {number|null} rowLimit Max rows to return. Null = no limit (can crash the browser
 *                               on large result sets — exposed in the UI as "Tout").
 *
 * @returns {Promise<{
 *   columns: string[], rows: any[][], rowCount: number,
 *   took: number, plan: string,
 *   truncated: boolean, appliedLimit: number|null
 * }>}
 */
export async function executeQuery(sql, env, rowLimit = null) {
  if (USE_MOCK) {
    const delay = env === 'PRD' ? 620 : 460;
    await new Promise(r => setTimeout(r, delay));

    // Simulate the truncation behaviour of the real backend so the UI can be exercised
    // against the mock. We multiply the canned rows up so a 100-row limit is meaningful.
    const expanded = [];
    while (expanded.length < (rowLimit ?? 10_000)) {
      expanded.push(...RESULT_ROWS);
      if (expanded.length >= RESULT_ROWS.length * 800) break;
    }
    const sliced   = rowLimit ? expanded.slice(0, rowLimit) : expanded;
    const truncated = rowLimit != null && expanded.length > rowLimit;

    return {
      columns: RESULT_COLUMNS,
      rows: sliced,
      rowCount: sliced.length,
      took: env === 'PRD' ? 62 : 46,
      plan: 'Clustered Index Seek + Hash Match Join',
      truncated,
      appliedLimit: rowLimit,
    };
  }

  return apiFetch('/queries/execute', {
    method: 'POST',
    body: JSON.stringify({ sql, env, rowLimit }),
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

/**
 * Fetch the WorkCenter catalog (dbo.WorkCenter).
 * Returns WORKCENTERS[] array — same shape as the mock.
 */
export async function fetchWorkCenters() {
  if (USE_MOCK) {
    return MOCK_WORKCENTERS;
  }

  return apiFetch('/queries/workcenters');
}

/**
 * Fetch the AttributeModel catalog (dbo.AttributeModel).
 * Returns ATTRIBUTE_MODELS[] array — same shape as the mock.
 */
export async function fetchAttributeModels() {
  if (USE_MOCK) {
    return MOCK_ATTRIBUTE_MODELS;
  }

  return apiFetch('/queries/attribute-models');
}
