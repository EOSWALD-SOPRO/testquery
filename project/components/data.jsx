// Mock data for the SOPROFEN production query editor

const QUERIES = [
  { id: "q1",  folder: "Volets Roulants",  name: "operations_assemblage.sql",     branch: "feature/vr-ops-v3",    status: "modified", author: "t.laurent" },
  { id: "q2",  folder: "Volets Roulants",  name: "composants_tablier.sql",        branch: "main",                 status: "clean",    author: "t.laurent" },
  { id: "q3",  folder: "Volets Roulants",  name: "nomenclature_coffre.sql",       branch: "main",                 status: "clean",    author: "a.meyer"   },
  { id: "q4",  folder: "Volets Roulants",  name: "decoupe_lames.sql",             branch: "main",                 status: "clean",    author: "a.meyer"   },
  { id: "q5",  folder: "Portes de Garage", name: "operations_panneaux.sql",       branch: "fix/pg-order-116",     status: "pr-open",  author: "c.fischer" },
  { id: "q6",  folder: "Portes de Garage", name: "ferrures_laterales.sql",        branch: "main",                 status: "clean",    author: "c.fischer" },
  { id: "q7",  folder: "Portes de Garage", name: "motorisation_config.sql",       branch: "main",                 status: "clean",    author: "t.laurent" },
  { id: "q8",  folder: "Stores",           name: "operations_toile.sql",          branch: "main",                 status: "clean",    author: "a.meyer"   },
  { id: "q9",  folder: "Stores",           name: "composants_bras.sql",           branch: "main",                 status: "clean",    author: "a.meyer"   },
  { id: "q10", folder: "Commun",           name: "etiquettes_expedition.sql",     branch: "main",                 status: "clean",    author: "t.laurent" },
  { id: "q11", folder: "Commun",           name: "ordre_fabrication_header.sql",  branch: "main",                 status: "clean",    author: "c.fischer" },
];

const DEFAULT_QUERY = `-- Operations d'assemblage pour volets roulants
-- Affichee sur les ecrans atelier VR-01 a VR-06
SELECT
    op.num_ordre,
    op.sequence,
    op.code_operation,
    op.libelle,
    art.ref_article,
    art.designation,
    art.dimensions,
    art.quantite,
    pos.poste_travail,
    pos.duree_standard_min,
    ops.date_prevue
FROM   production.ordres_fabrication op
JOIN   articles          art ON art.id_article = op.id_article
JOIN   postes            pos ON pos.id_poste   = op.id_poste
JOIN   ordre_sequences   ops ON ops.id_ordre   = op.id_ordre
WHERE  op.famille_produit = 'VR'
  AND  op.statut IN ('PLANIFIE', 'EN_COURS')
  AND  ops.date_prevue >= CURRENT_DATE
  AND  ops.date_prevue <  CURRENT_DATE + INTERVAL '2 days'
ORDER  BY pos.poste_travail, ops.date_prevue, op.sequence;`;

const RESULT_COLUMNS = [
  "num_ordre", "sequence", "code_operation", "libelle",
  "ref_article", "designation", "dimensions", "quantite",
  "poste_travail", "duree_standard_min", "date_prevue"
];

const RESULT_ROWS = [
  ["OF-2026-04881", 10, "DECOUP-ALU", "Decoupe profils alu",            "VR-ALU-4012-BLC", "Volet roulant alu 120x140",  "1200x1400", 1, "VR-01-DECOUPE",   12, "2026-04-22 08:15"],
  ["OF-2026-04881", 20, "ASSEMB-COF", "Assemblage coffre",              "VR-ALU-4012-BLC", "Volet roulant alu 120x140",  "1200x1400", 1, "VR-02-ASSEMB",    18, "2026-04-22 08:45"],
  ["OF-2026-04881", 30, "MONT-MOTOR", "Montage moteur tubulaire",       "VR-ALU-4012-BLC", "Volet roulant alu 120x140",  "1200x1400", 1, "VR-03-MOTOR",      9, "2026-04-22 09:10"],
  ["OF-2026-04881", 40, "POSE-TABL", "Pose tablier + lames finales",    "VR-ALU-4012-BLC", "Volet roulant alu 120x140",  "1200x1400", 1, "VR-04-TABLIER",   14, "2026-04-22 09:30"],
  ["OF-2026-04881", 50, "CTRL-QUAL",  "Controle qualite + tests",        "VR-ALU-4012-BLC", "Volet roulant alu 120x140",  "1200x1400", 1, "VR-06-CONTROLE",   6, "2026-04-22 09:55"],
  ["OF-2026-04882", 10, "DECOUP-ALU", "Decoupe profils alu",            "VR-PVC-1008-ANT", "Volet roulant PVC 100x80",   "1000x800",  2, "VR-01-DECOUPE",   10, "2026-04-22 10:05"],
  ["OF-2026-04882", 20, "ASSEMB-COF", "Assemblage coffre",              "VR-PVC-1008-ANT", "Volet roulant PVC 100x80",   "1000x800",  2, "VR-02-ASSEMB",    15, "2026-04-22 10:20"],
  ["OF-2026-04882", 30, "POSE-TABL", "Pose tablier + lames finales",    "VR-PVC-1008-ANT", "Volet roulant PVC 100x80",   "1000x800",  2, "VR-04-TABLIER",   11, "2026-04-22 10:38"],
  ["OF-2026-04883", 10, "DECOUP-ALU", "Decoupe profils alu",            "VR-ALU-2416-GRI", "Volet roulant alu 240x160",  "2400x1600", 1, "VR-01-DECOUPE",   16, "2026-04-22 10:55"],
  ["OF-2026-04883", 20, "ASSEMB-COF", "Assemblage coffre XL",           "VR-ALU-2416-GRI", "Volet roulant alu 240x160",  "2400x1600", 1, "VR-02-ASSEMB",    22, "2026-04-22 11:14"],
  ["OF-2026-04883", 30, "MONT-MOTOR", "Montage moteur tubulaire XL",    "VR-ALU-2416-GRI", "Volet roulant alu 240x160",  "2400x1600", 1, "VR-03-MOTOR",     11, "2026-04-22 11:35"],
  ["OF-2026-04884", 10, "DECOUP-ALU", "Decoupe profils alu",            "VR-ALU-0908-BLC", "Volet roulant alu 90x80",    "900x800",   4, "VR-01-DECOUPE",    8, "2026-04-22 13:02"],
  ["OF-2026-04884", 20, "ASSEMB-COF", "Assemblage coffre",              "VR-ALU-0908-BLC", "Volet roulant alu 90x80",    "900x800",   4, "VR-02-ASSEMB",    13, "2026-04-22 13:20"],
];

const HISTORY = [
  { hash: "a7c3f21", msg: "feat(vr): ajout duree_standard_min",              author: "t.laurent",  when: "il y a 12 min", branch: "feature/vr-ops-v3" },
  { hash: "e91b0ac", msg: "fix: filtre statut EN_COURS manquant",            author: "t.laurent",  when: "il y a 2 h",     branch: "feature/vr-ops-v3" },
  { hash: "4f5d9e2", msg: "feat: passage a ordre_sequences pour le planning", author: "a.meyer",   when: "hier, 17:42",    branch: "main" },
  { hash: "b2ac176", msg: "chore: cleanup jointures inutiles",               author: "c.fischer", when: "hier, 09:10",    branch: "main" },
];

Object.assign(window, { QUERIES, DEFAULT_QUERY, RESULT_COLUMNS, RESULT_ROWS, HISTORY });
