import { Octokit } from '@octokit/rest';
import simpleGit from 'simple-git';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../config.js';

// Initialize Octokit with GitHub token
let octokit = null;

function getOctokit() {
  if (!octokit) {
    const token = config.githubToken;
    if (!token) {
      throw new Error('GITHUB_TOKEN environment variable is not set');
    }
    console.log('[GitHub] Initializing Octokit with token:', token.substring(0, 10) + '...');
    octokit = new Octokit({ auth: token });
  }
  return octokit;
}

// Get repository info from environment
function getRepoInfo() {
  const repo = config.githubRepo;
  if (!repo) {
    throw new Error('GITHUB_REPO environment variable is not set (format: owner/repo)');
  }
  const [owner, repoName] = repo.split('/');
  if (!owner || !repoName) {
    throw new Error('GITHUB_REPO must be in format: owner/repo');
  }
  return { owner, repo: repoName };
}

// Git repository path
const GIT_REPO_PATH = path.resolve(process.cwd(), config.gitRepoPath);

/**
 * Get a simple-git instance for the queries repository
 */
function getGit() {
  return simpleGit(GIT_REPO_PATH);
}

/**
 * Initialize or update the local git repository
 */
export async function initRepository() {
  const git = getGit();

  try {
    // Check if it's already a git repo
    await git.status();
    console.log('Git repository already initialized at:', GIT_REPO_PATH);
  } catch {
    // Initialize new repo
    await git.init();
    console.log('Initialized new git repository at:', GIT_REPO_PATH);
  }
}

/**
 * Get the current branch name
 */
export async function getCurrentBranch() {
  const git = getGit();
  const status = await git.status();
  return status.current;
}

/**
 * Get list of branches
 */
export async function getBranches() {
  const git = getGit();
  const branches = await git.branchLocal();
  return branches.all;
}

/**
 * Create a new branch
 */
export async function createBranch(branchName) {
  const git = getGit();
  await git.checkoutLocalBranch(branchName);
  return branchName;
}

/**
 * Switch to a branch
 */
export async function checkoutBranch(branchName) {
  const git = getGit();
  await git.checkout(branchName);
  return branchName;
}

/**
 * Commit changes
 * @param {string} message - Commit message
 * @param {string[]} files - List of files to commit (optional, commits all if empty)
 */
export async function commitChanges(message, files = []) {
  const git = getGit();

  if (files.length > 0) {
    await git.add(files);
  } else {
    await git.add('.');
  }

  const result = await git.commit(message);
  return {
    commit: result.commit,
    summary: result.summary
  };
}

/**
 * Push changes to remote
 */
export async function pushChanges(branch) {
  const git = getGit();
  await git.push('origin', branch, ['--set-upstream']);
}

/**
 * Get commit history
 * @param {number} limit - Maximum number of commits to return
 */
export async function getCommitHistory(limit = 20) {
  const git = getGit();
  const log = await git.log({ maxCount: limit });

  return log.all.map(commit => ({
    hash: commit.hash,
    shortHash: commit.hash.substring(0, 7),
    message: commit.message,
    author: commit.author_name,
    email: commit.author_email,
    date: commit.date
  }));
}

/**
 * Get file diff for uncommitted changes
 */
export async function getFileDiff(filePath) {
  const git = getGit();
  const diff = await git.diff([filePath]);
  return diff;
}

/**
 * Create a Pull Request on GitHub
 */
export async function createPullRequest({ title, body, branch, baseBranch = 'main', reviewers = [] }) {
  const client = getOctokit();
  const { owner, repo } = getRepoInfo();

  // Create the PR
  const { data: pr } = await client.pulls.create({
    owner,
    repo,
    title,
    body,
    head: branch,
    base: baseBranch
  });

  // Add reviewers if specified
  if (reviewers.length > 0) {
    try {
      await client.pulls.requestReviewers({
        owner,
        repo,
        pull_number: pr.number,
        reviewers
      });
    } catch (err) {
      console.warn('Failed to add reviewers:', err.message);
    }
  }

  return {
    number: pr.number,
    url: pr.html_url,
    status: pr.state,
    title: pr.title
  };
}

/**
 * Get Pull Request status including checks
 */
export async function getPullRequestStatus(prNumber) {
  const client = getOctokit();
  const { owner, repo } = getRepoInfo();

  // Get PR details
  const { data: pr } = await client.pulls.get({
    owner,
    repo,
    pull_number: prNumber
  });

  // Get check runs for the PR's head SHA
  const { data: checkRuns } = await client.checks.listForRef({
    owner,
    repo,
    ref: pr.head.sha
  });

  const checks = checkRuns.check_runs.map(check => ({
    name: check.name,
    status: check.status,
    conclusion: check.conclusion,
    url: check.html_url
  }));

  return {
    number: pr.number,
    state: pr.state,
    mergeable: pr.mergeable,
    merged: pr.merged,
    checks
  };
}

/**
 * Get list of Pull Requests
 */
export async function listPullRequests(state = 'open') {
  const client = getOctokit();
  const { owner, repo } = getRepoInfo();

  const { data: prs } = await client.pulls.list({
    owner,
    repo,
    state
  });

  return prs.map(pr => ({
    number: pr.number,
    title: pr.title,
    state: pr.state,
    author: pr.user.login,
    url: pr.html_url,
    branch: pr.head.ref,
    createdAt: pr.created_at
  }));
}

/**
 * Merge a Pull Request
 */
export async function mergePullRequest(prNumber, mergeMethod = 'squash') {
  const client = getOctokit();
  const { owner, repo } = getRepoInfo();

  const { data } = await client.pulls.merge({
    owner,
    repo,
    pull_number: prNumber,
    merge_method: mergeMethod
  });

  return {
    merged: data.merged,
    message: data.message,
    sha: data.sha
  };
}

/**
 * Get repository collaborators (for reviewer selection)
 */
export async function getCollaborators() {
  const client = getOctokit();
  const { owner, repo } = getRepoInfo();

  try {
    const { data: collaborators } = await client.repos.listCollaborators({
      owner,
      repo
    });

    return collaborators.map(user => ({
      login: user.login,
      name: user.login,
      avatarUrl: user.avatar_url
    }));
  } catch (err) {
    console.warn('Failed to get collaborators:', err.message);
    return [];
  }
}
