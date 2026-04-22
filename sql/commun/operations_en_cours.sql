-- Operations en cours
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
