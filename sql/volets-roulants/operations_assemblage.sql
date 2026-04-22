-- Operations assemblage volets roulants
-- Environnement: TRN / PRD

SELECT
    of.num_ordre,
    of.sequence,
    of.code_operation,
    of.libelle,
    p.poste_travail,
    p.duree_standard_min,
    a.ref_article,
    a.designation,
    a.dimensions
FROM production.ordres_fabrication of
INNER JOIN postes p ON of.id_poste = p.id_poste
INNER JOIN articles a ON of.id_article = a.id_article
WHERE of.famille_produit = 'VR'
    AND of.statut IN ('PLANIFIE', 'EN_COURS')
ORDER BY of.num_ordre, of.sequence;
