// Load environment variables - this file must be imported FIRST
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Export config values
export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // SQL Server
  sqlServerTrn: process.env.SQL_SERVER_TRN,
  sqlServerPrd: process.env.SQL_SERVER_PRD,
  sqlDatabaseTrn: process.env.SQL_DATABASE_TRN,
  sqlDatabasePrd: process.env.SQL_DATABASE_PRD,
  sqlUser: process.env.SQL_USER,
  sqlPassword: process.env.SQL_PASSWORD,
  sqlEncrypt: process.env.SQL_ENCRYPT === 'true',
  sqlTrustCert: process.env.SQL_TRUST_CERT !== 'false',

  // GitHub
  githubToken: process.env.GITHUB_TOKEN,
  githubRepo: process.env.GITHUB_REPO,

  // Paths
  queriesPath: process.env.QUERIES_PATH || './queries',
  gitRepoPath: process.env.GIT_REPO_PATH || './queries',
};

console.log('[Config] Loaded:');
console.log('  QUERIES_PATH:', config.queriesPath);
console.log('  GIT_REPO_PATH:', config.gitRepoPath);
