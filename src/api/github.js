// GitHub integration — commit, push, and open pull requests
import { apiFetch } from './client';

// Set to true to use mock data instead of real backend
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

/**
 * Commit the current query, push the branch, and open a GitHub pull request.
 * Returns { number: number, url: string, status: string }
 */
export async function createPullRequest({ branch, title, body, reviewers, file }) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 1800));
    return {
      number: 247,
      url: 'https://github.com/soprofen/production-screens/pull/247',
      status: 'open',
    };
  }

  return apiFetch('/github/pull-requests', {
    method: 'POST',
    body: JSON.stringify({ branch, title, body, reviewers, file }),
  });
}

/**
 * Fetch live GitHub Actions status for a pull request.
 * Returns { checks: [{ name, status, url }] }
 */
export async function getPullRequestStatus(number) {
  if (USE_MOCK) {
    return {
      number,
      checks: [
        { name: 'deploy-trn',   status: 'running', url: null },
        { name: 'merge-to-prd', status: 'waiting', url: null },
      ],
    };
  }

  return apiFetch(`/github/pull-requests/${number}/status`);
}

/**
 * Get list of branches
 */
export async function getBranches() {
  if (USE_MOCK) {
    return { current: 'main', branches: ['main', 'feature/new-query'] };
  }

  return apiFetch('/github/branches');
}

/**
 * Create a new branch
 */
export async function createBranch(name) {
  if (USE_MOCK) {
    return { branch: name };
  }

  return apiFetch('/github/branches', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

/**
 * Commit changes
 */
export async function commitChanges(message, files = []) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 500));
    return { commit: 'abc123', summary: { changes: 1 } };
  }

  return apiFetch('/github/commit', {
    method: 'POST',
    body: JSON.stringify({ message, files }),
  });
}

/**
 * Get commit history
 */
export async function getCommitHistory(limit = 20) {
  if (USE_MOCK) {
    return [
      { hash: 'abc123', message: 'Update query', author: 'User', date: new Date().toISOString() }
    ];
  }

  return apiFetch(`/github/history?limit=${limit}`);
}

/**
 * Get repository collaborators for reviewer selection
 */
export async function getCollaborators() {
  if (USE_MOCK) {
    return [
      { login: 'alice', name: 'Alice' },
      { login: 'bob', name: 'Bob' }
    ];
  }

  return apiFetch('/github/collaborators');
}
