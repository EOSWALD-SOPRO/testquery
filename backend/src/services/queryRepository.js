import fs from 'fs/promises';
import path from 'path';
import { config } from '../config.js';

// Path to the queries repository
const QUERIES_PATH = path.resolve(process.cwd(), config.queriesPath);

/**
 * Query folder structure mapping
 */
const FOLDER_MAPPING = {
  'volets-roulants': 'Volets Roulants',
  'portes-garage': 'Portes de Garage',
  'stores': 'Stores',
  'commun': 'Commun'
};

/**
 * Get all queries from the repository
 * @returns {Array} List of query metadata
 */
export async function getAllQueries() {
  const queries = [];

  try {
    // Check if queries directory exists
    await fs.access(QUERIES_PATH);
  } catch {
    // Create default structure if it doesn't exist
    await createDefaultStructure();
  }

  // Read all folders
  const folders = await fs.readdir(QUERIES_PATH, { withFileTypes: true });

  for (const folder of folders) {
    if (!folder.isDirectory()) continue;

    const folderPath = path.join(QUERIES_PATH, folder.name);
    const displayFolder = FOLDER_MAPPING[folder.name] || folder.name;

    // Read all SQL files in the folder
    const files = await fs.readdir(folderPath);

    for (const file of files) {
      if (!file.endsWith('.sql')) continue;

      const filePath = path.join(folderPath, file);
      const stats = await fs.stat(filePath);
      const content = await fs.readFile(filePath, 'utf-8');

      queries.push({
        id: `${folder.name}/${file}`,
        folder: displayFolder,
        name: file,
        path: filePath,
        sql: content,
        branch: 'main',
        status: 'clean',
        author: 'System',
        modifiedAt: stats.mtime.toISOString()
      });
    }
  }

  return queries;
}

/**
 * Get a single query by ID
 * @param {string} id - Query ID (folder/filename)
 * @returns {Object} Query metadata and content
 */
export async function getQueryById(id) {
  const [folder, file] = id.split('/');
  const filePath = path.join(QUERIES_PATH, folder, file);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const stats = await fs.stat(filePath);

    return {
      id,
      folder: FOLDER_MAPPING[folder] || folder,
      name: file,
      path: filePath,
      sql: content,
      branch: 'main',
      status: 'clean',
      modifiedAt: stats.mtime.toISOString()
    };
  } catch (err) {
    if (err.code === 'ENOENT') {
      return null;
    }
    throw err;
  }
}

/**
 * Save a query to the repository
 * @param {string} id - Query ID
 * @param {string} sql - SQL content
 * @returns {Object} Updated query metadata
 */
export async function saveQuery(id, sql) {
  const [folder, file] = id.split('/');
  const folderPath = path.join(QUERIES_PATH, folder);
  const filePath = path.join(folderPath, file);

  // Ensure folder exists
  await fs.mkdir(folderPath, { recursive: true });

  // Write the file
  await fs.writeFile(filePath, sql, 'utf-8');

  const stats = await fs.stat(filePath);

  return {
    id,
    folder: FOLDER_MAPPING[folder] || folder,
    name: file,
    path: filePath,
    sql,
    branch: 'main',
    status: 'modified',
    modifiedAt: stats.mtime.toISOString()
  };
}

/**
 * Create a new query
 * @param {string} folder - Folder name
 * @param {string} name - File name
 * @param {string} sql - SQL content
 * @returns {Object} Created query metadata
 */
export async function createQuery(folder, name, sql) {
  // Normalize folder name
  const folderKey = Object.keys(FOLDER_MAPPING).find(
    key => FOLDER_MAPPING[key] === folder
  ) || folder.toLowerCase().replace(/\s+/g, '-');

  const id = `${folderKey}/${name}`;
  return saveQuery(id, sql);
}

/**
 * Delete a query from the repository
 * @param {string} id - Query ID
 */
export async function deleteQuery(id) {
  const [folder, file] = id.split('/');
  const filePath = path.join(QUERIES_PATH, folder, file);

  await fs.unlink(filePath);
}

/**
 * Create default folder structure with sample queries
 */
async function createDefaultStructure() {
  const folders = Object.keys(FOLDER_MAPPING);

  for (const folder of folders) {
    const folderPath = path.join(QUERIES_PATH, folder);
    await fs.mkdir(folderPath, { recursive: true });
  }

  // Create a sample query
  const sampleQuery = `-- Sample Query: Operations en cours
-- Environnement: TRN / PRD

SELECT TOP 100
    of.num_ordre,
    of.code_operation,
    of.libelle,
    p.poste_travail,
    a.ref_article,
    a.designation,
    of.statut,
    os.date_prevue
FROM production.ordres_fabrication of
INNER JOIN postes p ON of.id_poste = p.id_poste
INNER JOIN articles a ON of.id_article = a.id_article
INNER JOIN ordre_sequences os ON of.num_ordre = os.id_ordre
WHERE of.statut IN ('PLANIFIE', 'EN_COURS')
    AND os.date_prevue >= CAST(GETDATE() AS DATE)
ORDER BY os.date_prevue, of.sequence;
`;

  await fs.writeFile(
    path.join(QUERIES_PATH, 'commun', 'operations_en_cours.sql'),
    sampleQuery,
    'utf-8'
  );

  console.log('Created default queries structure at:', QUERIES_PATH);
}
