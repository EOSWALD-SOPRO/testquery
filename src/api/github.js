// GitHub integration — commit, push, and open pull requests
// Set VITE_API_URL in .env and uncomment the real calls below

import { apiFetch } from './client';

/**
 * Commit the current query, push the branch, and open a GitHub pull request.
 * Returns { number: number, url: string, status: string }
 *
 * Backend expected: POST /api/github/pull-requests
 *   Body: { branch, title, body, reviewers, file }
 *   The backend should:
 *     1. git commit -m "<title>" sql/<path>/<file>
 *     2. git push origin <branch>
 *     3. Call GitHub API to open the PR
 */
export async function createPullRequest({ branch, title, body, reviewers, file }) {
  // TODO: uncomment once backend is ready
  // return apiFetch('/github/pull-requests', {
  //   method: 'POST',
  //   body: JSON.stringify({ branch, title, body, reviewers, file }),
  // });

  // Mock — simulate git + GitHub API latency
  await new Promise(r => setTimeout(r, 1800));
  return {
    number: 247,
    url: 'https://github.com/soprofen/production-screens/pull/247',
    status: 'open',
  };
}

/**
 * Fetch live GitHub Actions status for a pull request.
 * Returns { checks: [{ name, status, url }] }
 *
 * Backend expected: GET /api/github/pull-requests/:number/status
 */
export async function getPullRequestStatus(number) {
  // TODO: uncomment once backend is ready
  // return apiFetch(`/github/pull-requests/${number}/status`);

  return {
    number,
    checks: [
      { name: 'deploy-trn',   status: 'running', url: null },
      { name: 'merge-to-prd', status: 'waiting', url: null },
    ],
  };
}
