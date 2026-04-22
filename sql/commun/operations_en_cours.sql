select distinct /*Important*/
op.ProgramNumber as "-1_ProgramNumber", 
op.CartPosition as "-1_CartPosition", 
op.NumOF as "-1_OFNumber",
op.ProgramNumber as "3_N°Prog",
op.CartPosition  as "3_Rep Char",
op.ClientNumber as "1_N°Client",    
op.ClientName as "1_Client",
op.OrderNumber as "1_Num Commande", 
op.OrderLine  as "1_Pos Commande",
op.NumOF as "1_NumOf",     s
case 
    when cptab.OperationElementNumber = '333' then op.ProductCode + '-TAB3' 
    when cptab.OperationElementNumber = '222' then op.ProductCode + '-TAB2' 
    else op.ProductCode + '-TAB1'  
end as "1_Code Produit",  
attcfrtype2.Value  as "3_Désignation",
attTailleCoffre.Value as "3_Taille",    
case  
    when attclrtrap.Value <> attclrfacext.value then concat(attclrtrap.Value ,' ', attclrfacext.value)
    else attclrtrap.Value
end  as "3_Couleur",  
attLargeur.Value as "3_Largeur", 
case 
    when cptab.OperationElementNumber = '222' then 
        case 
            when attman2.Value = 'MOTEUR' then	attgamme2.Value
            when attman2.Value = 'MOTEUR_AUTONOME' then attgamme2.Value + ' / ' + cpbatterie.ExtendedCode
            when attman2.Value = 'MANUELLE' then concat(atttpsman2.Value,' ', cpcadran.ExtendedCode)  
        end
    when cptab.OperationElementNumber = '333' then 
        case 
            when attman3.Value = 'MOTEUR' then	attgamme3.Value
            when attman3.Value = 'MOTEUR_AUTONOME' then attgamme3.Value + ' / ' + cpbatterie.ExtendedCode
            when attman3.Value = 'MANUELLE' then concat(atttpsman3.Value,' ', cpcadran.ExtendedCode) 
        end
    else 
	    case 
            when attman1.Value = 'MOTEUR' then	attgamme1.Value 
            when attman1.Value = 'MOTEUR_AUTONOME' then isnull(attgamme1.Value,'') + ' / ' + isnull(cpbatterie.ExtendedCode, '') 
            when attman1.Value = 'MANUELLE' then concat(atttpsman1.Value,' ', cpcadran.ExtendedCode)   
        end
end as "3_Manoeuvre",
attCote.Value as "3_Coté Man",
case when attposadapt.value = 'ARRIERE' then 'X' end as "3_Pos Arr.",
case when atttabtyp.value in ('SCREEN','SONRO') then atttabtyp.value else cpTablier.ExtendedCode end as "3_Tablier",
cproulet.ExtendedCode as "3_Guide Tablier",
case 
    when cptab.OperationElementNumber = '222' then attAttacheTab2.Value 
    when cptab.OperationElementNumber = '333' then attAttacheTab3.Value 
    else attAttacheTab1.Value
end as "3_Accroche",
case
    when cptab.OperationElementNumber = '222' then attNBAttacheTab2.Value 
    when cptab.OperationElementNumber = '333' then attNBAttacheTab3.Value 
    else attNBAttacheTab1.Value
end as "3_NB Accroches",
case when attjol.Value = 'TRUE' then 'X' end as "3_Joint Jol",
attisolt.value as "3_Isol T",
case when attMSTAB1.Value = 'MS' then 'X' end as "3_MS",
case 
    when cptab.OperationElementNumber = '222' then cpemetteur2.ExtendedCode
    when cptab.OperationElementNumber = '333' then cpemetteur3.ExtendedCode
    else cpemetteur.ExtendedCode 
end as "3_Emetteur",
concat(case when attcou1t1.Value in ('CAM145','AM') then 'X'  end,' ',case when attnbtrtens.value <> '0' then attnbtrtens.value end)  as "3_NB Tour Moustiq / TGD.",
CONCAT (cprenfort.ExtendedCode,' ',cprenfortsf.ExtendedCode) as "3_Renfort",
case when attlambre.Value = 'TRUE' then 'X' end as "1_Delta R",
attralailg.value as "3_Aile G",
attralaild.value as "3_Aile D",	
case when attypcvrone.value = '70' then 'X' end  as "3_Dorm 70",	
attsupendui.value as "3_Support enduit",	
cpcadran.ExtendedCode  as "3_Cardan",	
case when attnbbridint.value <> '0' then attnbbridint.value end as "3_Bride Int",
case when attnbbridext.value <> '0' then attnbbridext.value end as "3_Bride Ext",
case 
    when  attnbtab.Value > '1'  then '1' 
    else '0' 
end as "7_Plan_Montage",
op.OFDate as "1_DateOF"
from Operation op 
left join Component cp on cp.EstablishmentId = op.EstablishmentId  and cp.NumOF = op.NumOF and cp.AttributeModel = @AttributeModel 
left join (select op.NumOF, OperationElementNumber,ProgramNumber, SupplyChainNumber,cp.Code, ExtendedCode from Component cp
inner join Operation op on op.NumOF = cp.NumOF and op.WorkCenterId = cp.WorkCenterId
where cp.OperationElementNumber in ('222','333')) cptab on cptab.ProgramNumber = op.ProgramNumber and cptab.Code = op.ProductCode
left join Attribute attcfrtype2 on  attcfrtype2.OrderNumber = op.OrderNumber and attcfrtype2.Name = 'CFR_TYPE2' and attcfrtype2.OrderLine = op.OrderLine 
left join Attribute attTailleCoffre on  attTailleCoffre.OrderNumber = op.OrderNumber and attTailleCoffre.Name = 'CFR_TAILLE2' and attTailleCoffre.OrderLine = op.OrderLine 
left join Attribute attclrtrap on  attclrtrap.OrderNumber = op.OrderNumber and attclrtrap.Name = 'CLR_TRAPPE' and attclrtrap.OrderLine = op.OrderLine 
left join Attribute attclrfacext on  attclrfacext.OrderNumber = op.OrderNumber and attclrfacext.Name = 'CLR_FACE_EXT' and attclrfacext.OrderLine = op.OrderLine 
left join Attribute attLargeur on attLargeur.OrderNumber = op.OrderNumber and attLargeur.Name = 'L_DOS_COFFRE' and attLargeur.OrderLine = op.OrderLine 
left join Attribute attman1 on attman1.OrderNumber = op.OrderNumber and attman1.Name = 'MANOEUVRE1' and attman1.OrderLine = op.OrderLine 
left join Attribute attman2 on attman2.OrderNumber = op.OrderNumber and attman2.Name = 'MANOEUVRE2' and attman2.OrderLine = op.OrderLine 
left join Attribute attman3 on attman3.OrderNumber = op.OrderNumber and attman3.Name = 'MANOEUVRE3' and attman3.OrderLine = op.OrderLine 
left join Attribute attgamme1 on attgamme1.OrderNumber = op.OrderNumber and attgamme1.Name = 'GAMME_MOTEUR1' and attgamme1.OrderLine = op.OrderLine 
left join Attribute attgamme2 on attgamme2.OrderNumber = op.OrderNumber and attgamme2.Name = 'GAMME_MOTEUR2' and attgamme2.OrderLine = op.OrderLine
left join Attribute attgamme3 on attgamme3.OrderNumber = op.OrderNumber and attgamme3.Name = 'GAMME_MOTEUR3' and attgamme3.OrderLine = op.OrderLine 
left join (select distinct EstablishmentId, NumOF, AttributeModel, ExtendedCode from Component where AttributeModel = 'BATTERIE' ) cpbatterie on cpbatterie.EstablishmentId = op.EstablishmentId and cpbatterie.NumOF = op.NumOF
LEFT join Attribute atttpsman1 on atttpsman1.OrderNumber = op.OrderNumber and atttpsman1.Name = 'TPS_MAN_TYPE1' and atttpsman1.OrderLine = op.OrderLine 
left join Attribute atttpsman2 on atttpsman2.OrderNumber = op.OrderNumber and atttpsman2.Name = 'TPS_MAN_TYPE2' and atttpsman2.OrderLine = op.OrderLine 
left join Attribute atttpsman3 on atttpsman3.OrderNumber = op.OrderNumber and atttpsman3.Name = 'TPS_MAN_TYPE3' and atttpsman3.OrderLine = op.OrderLine 
left join Attribute attCote on  attCote.OrderNumber = op.OrderNumber and attCote.Name = 'MAN_COTE' and attCote.OrderLine = op.OrderLine
left join Attribute attposadapt on  attposadapt.OrderNumber = op.OrderNumber and attposadapt.Name = 'POSITION_ADAPT' and attposadapt.OrderLine = op.OrderLine
left join Attribute atttabtyp on  atttabtyp.OrderNumber = op.OrderNumber and atttabtyp.Name = 'TAB_TYPE' and atttabtyp.OrderLine = op.OrderLine
left join Component cpTablier on  cpTablier.NumOF = op.NumOF and cpTablier.AttributeModel = 'TABLIER' and cpTablier.OperationElementNumber = '601'
left join (select distinct EstablishmentId, NumOF, AttributeModel, ExtendedCode, QuantityToProduce from Component where AttributeModel = 'ROULETTE') cproulet on cproulet.EstablishmentId = op.EstablishmentId and cproulet.NumOF = op.NumOF
left join Attribute attAttacheTab1 on attAttacheTab1.OrderNumber = op.OrderNumber and attAttacheTab1.Name = 'ATTACHE_TAB1' and attAttacheTab1.OrderLine = op.OrderLine 
left join Attribute attAttacheTab2 on attAttacheTab2.OrderNumber = op.OrderNumber and attAttacheTab2.Name = 'ATTACHE_TAB2' and attAttacheTab2.OrderLine = op.OrderLine 
left join Attribute attAttacheTab3 on attAttacheTab3.OrderNumber = op.OrderNumber and attAttacheTab3.Name = 'ATTACHE_TAB3' and attAttacheTab3.OrderLine = op.OrderLine 
left join Attribute attNBAttacheTab1 on attNBAttacheTab1.OrderNumber = op.OrderNumber and attNBAttacheTab1.Name = 'NB_ATTACHE_TAB1' and attNBAttacheTab1.OrderLine = op.OrderLine 
left join Attribute attNBAttacheTab2 on attNBAttacheTab2.OrderNumber = op.OrderNumber and attNBAttacheTab2.Name = 'NB_ATTACHE_TAB2' and attNBAttacheTab2.OrderLine = op.OrderLine 
left join Attribute attNBAttacheTab3 on attNBAttacheTab3.OrderNumber = op.OrderNumber and attNBAttacheTab3.Name = 'NB_ATTACHE_TAB3' and attNBAttacheTab3.OrderLine = op.OrderLine 
left join Attribute attjol on attjol.OrderNumber = op.OrderNumber and attjol.Name = 'JOL' and attjol.OrderLine = op.OrderLine 
left join Attribute attisolt on attisolt.OrderNumber = op.OrderNumber and attisolt.Name = 'TYPE_ISOLANT' and attisolt.OrderLine = op.OrderLine 
left join Attribute attMSTAB1 on attMSTAB1.OrderNumber = op.OrderNumber and attMSTAB1.Name = 'MAN_MTG1' and attMSTAB1.OrderLine = op.OrderLine  
left join (select distinct EstablishmentId, NumOF, AttributeModel, ExtendedCode, OperationElementNumber from Component where OperationElementNumber in ('810')) cpemetteur on cpemetteur.EstablishmentId = op.EstablishmentId and cpemetteur.NumOF in (op.NumOF,op.ParentOfNumber)
left join (select distinct EstablishmentId, NumOF, AttributeModel, ExtendedCode, OperationElementNumber from Component where OperationElementNumber in ('811')) cpemetteur2 on cpemetteur2.EstablishmentId = op.EstablishmentId and cpemetteur2.NumOF in (op.NumOF,op.ParentOfNumber)
left join (select distinct EstablishmentId, NumOF, AttributeModel, ExtendedCode, OperationElementNumber from Component where OperationElementNumber in ('812')) cpemetteur3 on cpemetteur3.EstablishmentId = op.EstablishmentId and cpemetteur3.NumOF in (op.NumOF,op.ParentOfNumber)
left join Attribute attcou1t1 on  attcou1t1.OrderNumber = op.OrderNumber and attcou1t1.Name = 'COU1_TYPE_TAB1' and attcou1t1.OrderLine = op.OrderLine 
left join Attribute attnbtrtens on  attnbtrtens.OrderNumber = op.OrderNumber and attnbtrtens.Name = 'NB_TOUR_TENSION' and attnbtrtens.OrderLine = op.OrderLine 
left join (select distinct EstablishmentId, NumOF, AttributeModel, ExtendedCode, QuantityToProduce from Component where AttributeModel = 'RENFORT') cprenfort on cprenfort.EstablishmentId = op.EstablishmentId and cprenfort.NumOF = op.NumOF
left join (select distinct EstablishmentId, NumOF, AttributeModel, ExtendedCode, QuantityToProduce from Component where AttributeModel = 'RENFORT_SF') cprenfortsf on cprenfortsf.EstablishmentId = op.EstablishmentId and cprenfortsf.NumOF = op.NumOF
left join Attribute attlambre on attlambre.OrderNumber = op.OrderNumber and attlambre.Name = 'SOD' and attlambre.OrderLine = op.OrderLine 
left join Attribute attralailg on attralailg.OrderNumber = op.OrderNumber and attralailg.Name = 'RALL_AILE_SLG' and attralailg.OrderLine = op.OrderLine 
left join Attribute attralaild on attralaild.OrderNumber = op.OrderNumber and attralaild.Name = 'RALL_AILE_SLG' and attralaild.OrderLine = op.OrderLine 
left join Attribute attypcvrone on attypcvrone.OrderNumber = op.OrderNumber and attypcvrone.Name = 'TYPE_CVR_ONE' and attypcvrone.OrderLine = op.OrderLine 
left join Attribute attsupendui on attsupendui.OrderNumber = op.OrderNumber and attsupendui.Name = 'SUPPORT_ENDUIT' and attsupendui.OrderLine = op.OrderLine 
left join (select distinct EstablishmentId, NumOF, AttributeModel, ExtendedCode, QuantityToProduce from Component where AttributeModel = 'CARDAN') cpcadran on cpcadran.EstablishmentId = op.EstablishmentId and cpcadran.NumOF = op.NumOF
left join Attribute attnbbridint on attnbbridint.OrderNumber = op.OrderNumber and attnbbridint.Name = 'NB_BRIDE_INT' and attnbbridint.OrderLine = op.OrderLine 
left join Attribute attnbbridext on attnbbridext.OrderNumber = op.OrderNumber and attnbbridext.Name = 'NB_BRIDE_EXT' and attnbbridext.OrderLine = op.OrderLine 
left join Attribute attnbtab on attnbtab.OrderNumber = op.OrderNumber and attnbtab.Name = 'NB_TABLIER' and attnbtab.OrderLine = op.OrderLine 

where op.WorkCenterId = @WorkCenter and op.ProgramNumber = '0'
ORDER BY CartPosition