-- ============================================================================
-- NagarWatch — SYNTHETIC seed data for development/demo only.
-- No real FIRs, officers, victims, or accused persons. All names and
-- coordinates below are fictional placeholders inside Bengaluru city limits
-- purely so the map view has something to render.
-- ============================================================================


INSERT INTO UnitType (UnitName, Hierarchy) VALUES
 ('Police Station', 1), ('Sub-Division', 2), ('District', 3), ('Range', 4), ('State HQ', 5);

INSERT INTO Unit (UnitTypeID, UnitName, ParentUnitID, DistrictName, Geo) VALUES
 (5, 'Karnataka State Police HQ', NULL, NULL, NULL),
 (3, 'Bengaluru City District', 1, 'Bengaluru Urban', NULL),
 (1, 'Jayanagar PS (Demo)', 2, 'Bengaluru Urban', NULL),
 (1, 'Indiranagar PS (Demo)', 2, 'Bengaluru Urban', NULL),
 (1, 'Whitefield PS (Demo)', 2, 'Bengaluru Urban', NULL);

INSERT INTO Rank (RankName, RankLevel) VALUES
 ('Police Constable', 1), ('Head Constable', 2), ('Sub-Inspector', 3),
 ('Inspector', 4), ('Deputy Superintendent of Police', 5), ('Superintendent of Police', 6);

INSERT INTO Designation (DesignationName, AccessTier) VALUES
 ('Beat Constable', 'BEAT_CONSTABLE'),
 ('Investigating Officer', 'IO_SHO'),
 ('Station House Officer', 'IO_SHO'),
 ('SCRB Administrator', 'SP_SCRB_ADMIN'),
 ('Superintendent of Police', 'SP_SCRB_ADMIN');


INSERT INTO Employee (KGID, FullName, RankID, DesignationID, UnitID, PhoneNumber, Email, PasswordHash) VALUES
('KGID-BC-001', 'Constable Demo Kumar', 1, 1, 3, '9900000001', 'beat.demo@nagarwatch.local', '$2b$10$PLACEHOLDER_RUN_SEED_HASH_TO_GENERATE'),
('KGID-IO-001', 'SI Demo Rao',       3, 2, 3, '9900000002', 'io.demo@nagarwatch.local',   '$2b$10$PLACEHOLDER_RUN_SEED_HASH_TO_GENERATE'),
('KGID-AD-001', 'SP Demo Sharma',    6, 4, 1, '9900000003', 'admin.demo@nagarwatch.local','$2b$10$PLACEHOLDER_RUN_SEED_HASH_TO_GENERATE');


INSERT INTO GenderRef (GenderLabel) VALUES ('Male'), ('Female'), ('Other');
INSERT INTO ReligionRef (ReligionLabel) VALUES ('Not Disclosed'), ('Category A'), ('Category B'), ('Category C');
INSERT INTO CasteRef (CasteCategoryLabel) VALUES ('Not Disclosed'), ('General'), ('OBC'), ('SC'), ('ST');
INSERT INTO CaseStatusRef (StatusLabel) VALUES
 ('Under Investigation'), ('Charge-sheeted'), ('Closed - Untraced'), ('Court - Pending'), ('Convicted'), ('Acquitted');

INSERT INTO LegalSection (ActName, SectionNumber, SectionTitle, OffenceCategory, IsHeinous) VALUES
 ('Bharatiya Nyaya Sanhita', '303', 'Theft', 'Theft', FALSE),
 ('Bharatiya Nyaya Sanhita', '318', 'Cheating', 'Fraud', FALSE),
 ('Bharatiya Nyaya Sanhita', '103', 'Murder', 'Violent Crime', TRUE),
 ('Bharatiya Nyaya Sanhita', '115', 'Voluntarily causing hurt', 'Assault', FALSE),
 ('Information Technology Act', '66C', 'Identity Theft', 'Cybercrime', FALSE);


INSERT INTO FIR (FIRNumber, UnitID, DateFiled, DateOfOccurrence, Location, LocationText, Narrative, CaseStatusID, IsHeinous)
VALUES
 ('FIR/2026/0001', 3, now() - interval '2 days', now() - interval '2 days',
   ST_SetSRID(ST_MakePoint(77.5946, 12.9279), 4326), 'Jayanagar 4th Block', 'Synthetic demo narrative — bicycle theft reported.', 1, FALSE),
 ('FIR/2026/0002', 4, now() - interval '5 days', now() - interval '5 days',
   ST_SetSRID(ST_MakePoint(77.6408, 12.9719), 4326), 'Indiranagar 100ft Road', 'Synthetic demo narrative — online fraud complaint.', 1, FALSE),
 ('FIR/2026/0003', 5, now() - interval '10 days', now() - interval '11 days',
   ST_SetSRID(ST_MakePoint(77.7500, 12.9698), 4326), 'Whitefield Main Road', 'Synthetic demo narrative — assault during altercation.', 2, FALSE);

INSERT INTO FIRLegalSection (FIRID, LegalSectionID)
SELECT FIRID, 1 FROM FIR WHERE FIRNumber = 'FIR/2026/0001';
INSERT INTO FIRLegalSection (FIRID, LegalSectionID)
SELECT FIRID, 2 FROM FIR WHERE FIRNumber = 'FIR/2026/0002';
INSERT INTO FIRLegalSection (FIRID, LegalSectionID)
SELECT FIRID, 4 FROM FIR WHERE FIRNumber = 'FIR/2026/0003';
