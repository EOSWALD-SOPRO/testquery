// Mock data — reflects the real SOPROFEN production data model.
//
// Core entities:
//   WORKCENTERS       — physical workstations, each tied to one Establishment.
//   ATTRIBUTE_MODELS  — semantic categories of components (COULISSE, POC, ADAPTATEUR, ...).
//                       Each shows up in queries via dbo.Component.AttributeModel.
//
//   QUERIES           — one entry per row in dbo.ProductionScreen OR dbo.CUParameter.
//                       Two sources:
//                         "production_screen" → triple (RequestId, WorkCenter, AttributeModel).
//                                              Multiple entries can share the same RequestId
//                                              (= same SQL serving multiple AttributeModels).
//                                              Naming: "{requestId}-{workCenter}-{attributeModel}"
//                         "cu_parameter"      → one row per WorkCenter (PK = WorkCenterId).
//                                              CUParameter has NO AttributeModel notion.
//                                              Naming: "{workCenter}"

export const WORKCENTERS = [
  // Establishment A04 (lignes 6 / "L6" dans la nomenclature historique)
  { id: 1003, name: "L6ITX301", title: "ITX 300 ligne 1",                establishment: "A04" },
  { id: 1005, name: "L6IBLF01", title: "Bain LF 01",                     establishment: "A04" },
  { id: 1007, name: "L6CBAXE2", title: "Cellule axe 2",                  establishment: "A04" },
  { id: 1010, name: "L6CTGAX1", title: "Cellule TG axe 1",               establishment: "A04" },
  { id: 1012, name: "L6IBAD01", title: "Bain ADAPT 01",                  establishment: "A04" },
  { id: 1014, name: "L6INTEB1", title: "Intermediaire EB 1",             establishment: "A04" },
  { id: 1015, name: "L6ITGLF1", title: "ITG LF 1",                       establishment: "A04" },
  { id: 1017, name: "L6CBPLA1", title: "Cellule plat 1",                 establishment: "A04" },
  { id: 1019, name: "L6IMBCAS", title: "Mise en boite cassette",         establishment: "A04" },
  { id: 1075, name: "L6IUCO01", title: "Unite controle 01",              establishment: "A04" },
  { id: 136,  name: "MDDBCO02", title: "MDDBCO 02",                      establishment: "A04" },
  // Establishment A01
  { id: 1,    name: "AGDBIT01", title: "Scie LF, Moustiquaire / Manu",   establishment: "A01" },
  { id: 2,    name: "AGDBLF01", title: "Scie LF",                        establishment: "A01" },
  { id: 3,    name: "AGDBTA01", title: "Scie tablier",                   establishment: "A01" },
  { id: 10,   name: "AGMTGLF1", title: "Poste assemblage LF",            establishment: "A01" },
  { id: 11,   name: "AGATX151", title: "ATX1500",                        establishment: "A01" },
  // Establishment A03
  { id: 1109, name: "ACC-DECO", title: "Accessoires DECO",               establishment: "A03" },
  { id: 1137, name: "ACC-CHRO", title: "Accessoires CHRONO",             establishment: "A03" },
  { id: 1138, name: "ACC-TRAD", title: "Accessoires TRAD",               establishment: "A03" },
  // Establishment C01
  { id: 1197, name: "APPROP",   title: "APPRO PROFILES",                 establishment: "C01" },
];

export const ATTRIBUTE_MODELS = [
  { id: 9,  name: "COULISSE",   title: "Coulisse"                    },
  { id: 10, name: "CLR_COU",    title: "Coloris coulisse"            },
  { id: 11, name: "COU_SCR",    title: "Coulisse SCR"                },
  { id: 12, name: "COU_PM",     title: "Coulisse PM"                 },
  { id: 13, name: "PLAX_COU",   title: "Plaxage coulisse"            },
  { id: 21, name: "POC",        title: "POC — porte de coffre"       },
  { id: 25, name: "ADAPTATEUR", title: "Adaptateur"                  },
  { id: 28, name: "PROF_CHARN", title: "Profil charniere"            },
  { id: 49, name: "CORNIERE",   title: "Corniere"                    },
  { id: 50, name: "CORN_ALU",   title: "Corniere alu"                },
  { id: 51, name: "CLR_COR",    title: "Coloris corniere"            },
  { id: 60, name: "JOINTFINI",  title: "Joint fini"                  },
  { id: 61, name: "JOINT_PT",   title: "Joint pare-tempete"          },
  { id: 62, name: "JOINT_COU",  title: "Joint coulisse"              },
  { id: 70, name: "REH_10",     title: "Rehausse 10 mm"              },
  { id: 71, name: "REH_12",     title: "Rehausse 12 mm"              },
  { id: 72, name: "REH_16",     title: "Rehausse 16 mm"              },
  { id: 73, name: "REH_20",     title: "Rehausse 20 mm"              },
  { id: 74, name: "REH_40",     title: "Rehausse 40 mm"              },
];

const wcById  = Object.fromEntries(WORKCENTERS.map(w => [w.id, w]));

// Map of RequestId → SQL. Several ProductionScreen rows can point to the same
// RequestId (e.g. Request 7 sert COULISSE + CLR_COU sur MDDBCO02).
const REQUESTS = {};

const screenSql = (requestId, attrModels) => `-- Request #${requestId} (dbo.ProductionScreen)
-- Sert les AttributeModels : ${attrModels.join(", ")}

SELECT
    op.OrderNumber                    AS "n° de commande",
    op.OrderLine                      AS "Position ligne de commande",
    op.CartPosition                   AS "n° position sur chariot",
    op.ProgramNumber                  AS "n° de série",
    op.ClientName                     AS "Client",
    op.NumOF                          AS "n°OF",
    ol.ClientReference                AS "Réf chantier",
    cp.AttributeModel                 AS "Modèle",
    cp.ExtendedCode                   AS "Reference",
    cp.Label                          AS "Designation",
    cp.QuantityToProduce * 1000       AS "Longueur"
FROM dbo.Operation op
INNER JOIN dbo.Component cp
    ON cp.EstablishmentId = op.EstablishmentId
   AND cp.NumOF           = op.NumOF
   AND cp.OperationNumber = op.OperationNumber
   AND cp.AttributeModel IN (${attrModels.map(a => `'${a}'`).join(", ")})
LEFT JOIN dbo.OrderLine ol
    ON ol.OrderNumber     = op.OrderNumber
   AND ol.Line            = op.OrderLine
   AND ol.EstablishmentId = op.EstablishmentId
WHERE op.WorkCenterId = @WorkCenterId
ORDER BY op.ProgramNumber, op.CartPosition, cp.ExtendedCode;`;

const cuSql = (wcId, wcName) => `-- CUParameter.Request — WorkCenter ${wcName} (Id ${wcId})
-- Pas de notion d'AttributeModel ici — la Request encapsule tout pour ce poste.
-- En prod, ces Request font typiquement des UNION ALL sur plusieurs blocs SELECT
-- (un par famille de composants — coulisse, POC, adaptateur, etc.).

SELECT
    op.OrderNumber                    AS "n° de commande",
    op.CartPosition                   AS "n° position sur chariot",
    op.ProgramNumber                  AS "n° de série",
    op.ClientName                     AS "Client",
    op.NumOF                          AS "n°OF",
    op.ProductCode                    AS "Reference",
    op.ProductName                    AS "Designation",
    op.OrderedQuantity                AS "Quantite",
    op.OFDate                         AS "Date OF",
    op.Status                         AS "Statut"
FROM dbo.Operation op
WHERE op.WorkCenterId = ${wcId}
  AND op.Status IN ('20', '30')
ORDER BY op.OFDate, op.ProgramNumber, op.OperationNumber;`;

// Register a ProductionScreen Request once. Returns the requestId for chaining.
const registerRequest = (requestId, attrModelsServed) => {
  if (!REQUESTS[requestId]) REQUESTS[requestId] = screenSql(requestId, attrModelsServed);
  return requestId;
};

// One ProductionScreen entry = (RequestId, WorkCenter, AttributeModel) tuple.
// shouldUseComponent / isReadonly / useColumnSelection mirror the bit flags on dbo.ProductionScreen.
const psEntry = (requestId, wcId, attributeModel, branch, status, author, flags = {}) => {
  const wc = wcById[wcId];
  return {
    id:                   `ps-${requestId}-${wcId}-${attributeModel}`,
    source:               "production_screen",
    name:                 `${requestId}-${wc.name}-${attributeModel}`,
    requestId,
    workCenterId:         wcId,
    workCenter:           wc.name,
    establishment:        wc.establishment,
    attributeModel,
    shouldUseComponent:   flags.shouldUseComponent ?? true,
    isReadonly:           flags.isReadonly         ?? false,
    useColumnSelection:   flags.useColumnSelection ?? false,
    branch, status, author,
    sql:                  REQUESTS[requestId],
  };
};

// One CUParameter entry = one WorkCenter.
const cuEntry = (wcId, branch, status, author) => {
  const wc = wcById[wcId];
  return {
    id:               `cu-${wcId}`,
    source:           "cu_parameter",
    name:             wc.name,
    requestId:        null,           // pas de RequestId distinct cote CUParameter
    workCenterId:     wcId,
    workCenter:       wc.name,
    establishment:    wc.establishment,
    attributeModel:   null,           // CU n'a pas la notion
    branch, status, author,
    sql:              cuSql(wcId, wc.name),
  };
};

// Register requests up-front so multiple entries can share the same SQL.
registerRequest(7,  ["COULISSE", "CLR_COU"]);   // sert 2 AttributeModels
registerRequest(8,  ["COU_SCR"]);
registerRequest(9,  ["COU_PM"]);
registerRequest(36, ["CORNIERE"]);
registerRequest(12, ["POC", "JOINT_PT"]);
registerRequest(14, ["ADAPTATEUR"]);
registerRequest(15, ["PROF_CHARN"]);
registerRequest(22, ["CORN_ALU", "CLR_COR"]);
registerRequest(23, ["JOINTFINI"]);
registerRequest(31, ["REH_10", "REH_12", "REH_16", "REH_20", "REH_40"]);
registerRequest(40, ["PLAX_COU"]);

export const QUERIES = [
  // === MDDBCO02 (WC 136) — exemple complet d'apres le screenshot utilisateur ===
  psEntry(7,  136, "COULISSE", "main",                    "clean",    "e.oswald"),
  psEntry(7,  136, "CLR_COU",  "main",                    "clean",    "e.oswald"),  // meme Request 7
  psEntry(8,  136, "COU_SCR",  "main",                    "clean",    "a.meyer"),
  psEntry(9,  136, "COU_PM",   "main",                    "clean",    "a.meyer"),
  psEntry(36, 136, "CORNIERE", "feature/corniere-rev",    "modified", "c.fischer"),

  // === L6IBAD01 (WC 1012) ===
  psEntry(7,  1012, "COULISSE", "main",                   "clean",    "e.oswald"),
  psEntry(7,  1012, "CLR_COU",  "main",                   "clean",    "e.oswald"),
  psEntry(12, 1012, "POC",      "feature/poc-typej",      "modified", "c.fischer"),
  psEntry(12, 1012, "JOINT_PT", "feature/poc-typej",      "modified", "c.fischer"),
  psEntry(14, 1012, "ADAPTATEUR","main",                  "clean",    "e.oswald"),

  // === L6CBPLA1 (WC 1017) ===
  psEntry(7,  1017, "COULISSE", "fix/cu-coloris-tab3",    "modified", "c.fischer"),
  psEntry(15, 1017, "PROF_CHARN","main",                  "clean",    "a.meyer"),
  psEntry(22, 1017, "CORN_ALU", "main",                   "clean",    "a.meyer"),

  // === L6IUCO01 (WC 1075) ===
  psEntry(23, 1075, "JOINTFINI","fix/jointfini-doublons", "pr-open",  "c.fischer"),
  psEntry(7,  1075, "COULISSE", "main",                   "clean",    "e.oswald"),

  // === L6ITX301 (WC 1003) — controle ITX ===
  psEntry(31, 1003, "REH_10",   "main",                   "clean",    "e.oswald"),
  psEntry(31, 1003, "REH_20",   "main",                   "clean",    "e.oswald"),

  // === A01 (sites scies) ===
  psEntry(7,  1, "COULISSE",    "main",                   "clean",    "a.meyer"),
  psEntry(40, 2, "PLAX_COU",    "main",                   "clean",    "a.meyer"),

  // === A03 (accessoires) ===
  psEntry(23, 1109, "JOINTFINI","main",                   "clean",    "c.fischer"),
  psEntry(23, 1137, "JOINTFINI","main",                   "clean",    "c.fischer"),

  // === CUParameter — 1 par WorkCenter ===
  cuEntry(136,  "main",                   "clean",    "e.oswald"),
  cuEntry(1012, "main",                   "clean",    "e.oswald"),
  cuEntry(1017, "fix/cu-coloris-tab3",    "modified", "c.fischer"),
  cuEntry(1075, "main",                   "clean",    "a.meyer"),
  cuEntry(1003, "main",                   "clean",    "e.oswald"),
  cuEntry(1,    "main",                   "clean",    "a.meyer"),
];

// Result shape ≈ a typical ProductionScreen query (Operation × Component join).
export const RESULT_COLUMNS = [
  "n° de commande", "Position ligne de commande", "n° position sur chariot",
  "n° de série", "Client", "n°OF", "Réf chantier",
  "Modèle", "Reference", "Designation", "Longueur"
];

export const RESULT_ROWS = [
  ["CMD-2026-0451", 10, 1, 4001, "CLIENT-68343", "1000225397", "CHANT-A12", "COULISSE",   "COU-ALU-2400-BLC", "Coulisse alu 2400 blanc",      2400],
  ["CMD-2026-0451", 10, 2, 4001, "CLIENT-68343", "1000225397", "CHANT-A12", "COULISSE",   "COU-ALU-2400-BLC", "Coulisse alu 2400 blanc",      2400],
  ["CMD-2026-0451", 10, 1, 4001, "CLIENT-68343", "1000225397", "CHANT-A12", "CLR_COU",    "CLR-RAL9016",       "Coloris RAL 9016",                0],
  ["CMD-2026-0451", 20, 1, 4002, "CLIENT-68344", "1000225397", "CHANT-A12", "COU_SCR",    "SCR-2400-BLC",      "Coulisse SCR 2400 blanc",      2400],
  ["CMD-2026-0512", 10, 1, 4015, "CLIENT-68410", "1000225398", "CHANT-B07", "COULISSE",   "COU-ALU-2200-ANT",  "Coulisse alu 2200 anthracite", 2200],
  ["CMD-2026-0512", 10, 2, 4015, "CLIENT-68410", "1000225398", "CHANT-B07", "COULISSE",   "COU-ALU-2200-ANT",  "Coulisse alu 2200 anthracite", 2200],
  ["CMD-2026-0512", 10, 1, 4015, "CLIENT-68410", "1000225398", "CHANT-B07", "POC",        "POC-J09-200",       "POC J09 200mm",                 200],
  ["CMD-2026-0512", 20, 1, 4016, "CLIENT-68411", "1000225398", "CHANT-B07", "ADAPTATEUR", "ADAP-STD-150",      "Adaptateur standard 150",       150],
  ["CMD-2026-0631", 10, 1, 4072, "CLIENT-68505", "1000225399", "CHANT-C03", "COULISSE",   "COU-ALU-1800-GRI",  "Coulisse alu 1800 gris",       1800],
  ["CMD-2026-0631", 10, 1, 4072, "CLIENT-68505", "1000225399", "CHANT-C03", "JOINTFINI",  "JF-EPDM-2.5",       "Joint fini EPDM 2.5mm",        1800],
  ["CMD-2026-0631", 10, 1, 4072, "CLIENT-68505", "1000225399", "CHANT-C03", "PROF_CHARN", "PCH-ALU-2400",      "Profil charniere alu 2400",    2400],
  ["CMD-2026-0631", 20, 1, 4073, "CLIENT-68506", "1000225399", "CHANT-C03", "CORN_ALU",   "CRN-ALU-90-BLC",    "Corniere alu 90 blanc",         900],
  ["CMD-2026-0631", 20, 1, 4073, "CLIENT-68506", "1000225399", "CHANT-C03", "CLR_COR",    "CLR-RAL9016",       "Coloris RAL 9016",                0],
];

export const PULL_REQUESTS = [
  {
    number: 247,
    title: "fix(L6CBPLA1): correction CASE Coloris pour OperationElementNumber tab3",
    body: "Le tab3 ne renvoyait pas le coloris correct quand OperationElementNumber etait 121 ou 131. Correction du CASE pour aligner avec le pattern tab1/tab2.",
    branch: "fix/cu-coloris-tab3",
    base: "main",
    author: "c.fischer",
    state: "review",
    createdAt: "2026-05-10T14:23:00",
    files: ["sql/cu-1017.sql"],
    reviewers: ["e.oswald"],
    checks: [
      { name: "syntax-check", status: "success",  conclusion: "passed" },
      { name: "deploy-trn",   status: "success",  conclusion: "passed" },
      { name: "merge-to-prd", status: "waiting",  conclusion: null     },
    ],
  },
  {
    number: 246,
    title: "feat(ps-jointfini): dedup ExtendedCode lors d'OF a sequences multiples",
    body: "Ajout d'un DISTINCT sur ExtendedCode pour eviter les doublons quand un OF a plusieurs sequences avec le meme composant JOINTFINI.",
    branch: "fix/jointfini-doublons",
    base: "main",
    author: "c.fischer",
    state: "checks-running",
    createdAt: "2026-05-11T09:15:00",
    files: ["sql/ps-23.sql"],
    reviewers: ["a.meyer", "e.oswald"],
    checks: [
      { name: "syntax-check", status: "success",  conclusion: "passed"  },
      { name: "deploy-trn",   status: "running",  conclusion: null      },
      { name: "merge-to-prd", status: "waiting",  conclusion: null      },
    ],
  },
  {
    number: 245,
    title: "feat(ps-poc): ajout AttributeModel JOINT_PT pour pare-tempete",
    body: "Le pattern POC + JOINT_PT etait deja utilise sur L6CBPLA1, generalisation a L6IBAD01 et L6IUCO01.",
    branch: "feature/poc-typej",
    base: "main",
    author: "c.fischer",
    state: "checks-failed",
    createdAt: "2026-05-09T16:42:00",
    files: ["sql/ps-12.sql"],
    reviewers: ["e.oswald"],
    checks: [
      { name: "syntax-check", status: "success",  conclusion: "passed"  },
      { name: "deploy-trn",   status: "completed", conclusion: "failed" },
      { name: "merge-to-prd", status: "waiting",  conclusion: null      },
    ],
  },
  {
    number: 244,
    title: "feat(itx): ajout filtre Status='30' pour OFs en attente",
    body: "Ajout du status 30 (en attente) en plus du 20 (planifie) pour que l'ecran ITX301 affiche aussi les OFs en attente de pieces.",
    branch: "feature/itx-status",
    base: "main",
    author: "e.oswald",
    state: "merged",
    createdAt: "2026-05-08T11:20:00",
    mergedAt: "2026-05-08T15:45:00",
    files: ["sql/cu-1003.sql"],
    reviewers: ["a.meyer"],
    checks: [
      { name: "syntax-check", status: "success",  conclusion: "passed"  },
      { name: "deploy-trn",   status: "success",  conclusion: "passed"  },
      { name: "merge-to-prd", status: "success",  conclusion: "passed"  },
    ],
  },
];

export const HISTORY = [
  { hash: "a7c3f21", msg: "feat(req#12): ajout AttributeModel JOINT_PT pour pare-tempete",  author: "c.fischer", when: "il y a 12 min", branch: "feature/poc-typej" },
  { hash: "e91b0ac", msg: "fix(cu-1017): correction CASE Coloris pour OperationElementNumber tab3", author: "c.fischer", when: "il y a 2 h", branch: "fix/cu-coloris-tab3" },
  { hash: "4f5d9e2", msg: "feat: standardisation jointures Component sur EstablishmentId",  author: "a.meyer",   when: "hier, 17:42",   branch: "main" },
  { hash: "b2ac176", msg: "chore(req#23): dedup ExtendedCode lors d'OF a sequences multiples", author: "c.fischer", when: "hier, 09:10", branch: "fix/jointfini-doublons" },
];
