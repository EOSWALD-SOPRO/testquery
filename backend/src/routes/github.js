import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  initRepository,
  getCurrentBranch,
  getBranches,
  createBranch,
  checkoutBranch,
  commitChanges,
  pushChanges,
  getCommitHistory,
  getFileDiff,
  createPullRequest,
  getPullRequestStatus,
  listPullRequests,
  mergePullRequest,
  getCollaborators
} from '../services/github.js';

const router = Router();

/**
 * POST /api/github/init
 * Initialize the git repository
 */
router.post('/init', asyncHandler(async (req, res) => {
  await initRepository();
  res.json({ message: 'Repository initialized' });
}));

/**
 * GET /api/github/branches
 * Get list of branches
 */
router.get('/branches', asyncHandler(async (req, res) => {
  const current = await getCurrentBranch();
  const branches = await getBranches();
  res.json({ current, branches });
}));

/**
 * POST /api/github/branches
 * Create a new branch
 */
router.post('/branches', asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Branch name is required' });
  }

  // Sanitize branch name
  const sanitized = name.replace(/[^a-zA-Z0-9-_/]/g, '-');
  const branch = await createBranch(sanitized);
  res.status(201).json({ branch });
}));

/**
 * POST /api/github/checkout
 * Switch to a branch
 */
router.post('/checkout', asyncHandler(async (req, res) => {
  const { branch } = req.body;

  if (!branch) {
    return res.status(400).json({ error: 'Branch name is required' });
  }

  await checkoutBranch(branch);
  res.json({ branch });
}));

/**
 * POST /api/github/commit
 * Commit changes
 */
router.post('/commit', asyncHandler(async (req, res) => {
  const { message, files } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Commit message is required' });
  }

  const result = await commitChanges(message, files || []);
  res.json(result);
}));

/**
 * POST /api/github/push
 * Push changes to remote
 */
router.post('/push', asyncHandler(async (req, res) => {
  const { branch } = req.body;
  const currentBranch = branch || await getCurrentBranch();

  await pushChanges(currentBranch);
  res.json({ message: 'Changes pushed successfully', branch: currentBranch });
}));

/**
 * GET /api/github/history
 * Get commit history
 */
router.get('/history', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const history = await getCommitHistory(limit);
  res.json(history);
}));

/**
 * GET /api/github/diff/:folder/:file
 * Get diff for a file
 */
router.get('/diff/:folder/:file', asyncHandler(async (req, res) => {
  const filePath = `${req.params.folder}/${req.params.file}`;
  const diff = await getFileDiff(filePath);
  res.json({ filePath, diff });
}));

/**
 * GET /api/github/pull-requests
 * List pull requests
 */
router.get('/pull-requests', asyncHandler(async (req, res) => {
  const state = req.query.state || 'open';
  const prs = await listPullRequests(state);
  res.json(prs);
}));

/**
 * POST /api/github/pull-requests
 * Create a pull request
 */
router.post('/pull-requests', asyncHandler(async (req, res) => {
  const { title, body, branch, baseBranch, reviewers } = req.body;

  if (!title || !branch) {
    return res.status(400).json({
      error: 'Title and branch are required'
    });
  }

  // First push the branch
  try {
    await pushChanges(branch);
  } catch (err) {
    // Branch might already be pushed, continue
    console.log('Push warning:', err.message);
  }

  const pr = await createPullRequest({
    title,
    body: body || '',
    branch,
    baseBranch: baseBranch || 'main',
    reviewers: reviewers || []
  });

  res.status(201).json(pr);
}));

/**
 * GET /api/github/pull-requests/:number/status
 * Get PR status including checks
 */
router.get('/pull-requests/:number/status', asyncHandler(async (req, res) => {
  const prNumber = parseInt(req.params.number);

  if (isNaN(prNumber)) {
    return res.status(400).json({ error: 'Invalid PR number' });
  }

  const status = await getPullRequestStatus(prNumber);
  res.json(status);
}));

/**
 * POST /api/github/pull-requests/:number/merge
 * Merge a pull request
 */
router.post('/pull-requests/:number/merge', asyncHandler(async (req, res) => {
  const prNumber = parseInt(req.params.number);
  const { mergeMethod } = req.body;

  if (isNaN(prNumber)) {
    return res.status(400).json({ error: 'Invalid PR number' });
  }

  const result = await mergePullRequest(prNumber, mergeMethod || 'squash');
  res.json(result);
}));

/**
 * GET /api/github/collaborators
 * Get repository collaborators for reviewer selection
 */
router.get('/collaborators', asyncHandler(async (req, res) => {
  const collaborators = await getCollaborators();
  res.json(collaborators);
}));

export default router;
