-- ============================================================================
-- NagarWatch — Karnataka SCRB Spatial-Temporal Intelligence Platform
-- Core Database Schema (PostgreSQL 14+ with PostGIS 3.x)
-- ============================================================================
-- This schema is a representative implementation of the architecture
-- described in the NagarWatch PRD (Section 4). It is a starting scaffold,
-- not an authoritative reproduction of any real Karnataka Police database —
-- table names/fields should be reconciled with the department's actual data
-- dictionary before any production use, and this file must only ever be
-- run against synthetic/demo data in non-production environments.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. ORGANIZATIONAL HIERARCHY
-- ----------------------------------------------------------------------------

CREATE TABLE UnitType (
    UnitTypeID      SERIAL PRIMARY KEY,
    UnitName        VARCHAR(100) NOT NULL,          -- e.g. 'Police Station', 'Sub-Division', 'District', 'Range', 'State'
    Hierarchy       INTEGER NOT NULL                -- 1 = Station ... 5 = State HQ (used for RBAC scoping)
);

CREATE TABLE Unit (
    UnitID          SERIAL PRIMARY KEY,
    UnitTypeID      INTEGER NOT NULL REFERENCES UnitType(UnitTypeID),
    UnitName        VARCHAR(150) NOT NULL,          -- e.g. 'Jayanagar PS', 'Bengaluru South Division'
    ParentUnitID    INTEGER REFERENCES Unit(UnitID),
    DistrictName    VARCHAR(100),
    Geo             GEOMETRY(MultiPolygon, 4326)    -- jurisdiction boundary, used for hotspot aggregation
);

CREATE TABLE Rank (
    RankID          SERIAL PRIMARY KEY,
    RankName        VARCHAR(100) NOT NULL,          -- e.g. 'Constable', 'Head Constable', 'SI', 'CI', 'DySP', 'SP'
    RankLevel       INTEGER NOT NULL                -- numeric seniority, used by RBAC middleware
);

CREATE TABLE Designation (
    DesignationID   SERIAL PRIMARY KEY,
    DesignationName VARCHAR(150) NOT NULL,          -- e.g. 'Station House Officer', 'Investigating Officer', 'SCRB Administrator'
    AccessTier      VARCHAR(30) NOT NULL CHECK (AccessTier IN ('BEAT_CONSTABLE','IO_SHO','SP_SCRB_ADMIN'))
);

CREATE TABLE Employee (
    EmployeeID      SERIAL PRIMARY KEY,
    KGID            VARCHAR(20) UNIQUE NOT NULL,     -- Karnataka Government ID (personnel identifier)
    FullName        VARCHAR(150) NOT NULL,
    RankID          INTEGER NOT NULL REFERENCES Rank(RankID),
    DesignationID   INTEGER NOT NULL REFERENCES Designation(DesignationID),
    UnitID          INTEGER NOT NULL REFERENCES Unit(UnitID),
    PhoneNumber     VARCHAR(20),
    Email           VARCHAR(150),
    PasswordHash    TEXT NOT NULL,                   -- bcrypt hash, never store plaintext
    IsActive        BOOLEAN NOT NULL DEFAULT TRUE,
    CreatedAt       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 2. REFERENCE / LOOKUP TABLES
-- ----------------------------------------------------------------------------

CREATE TABLE LegalSection (
    LegalSectionID  SERIAL PRIMARY KEY,
    ActName         VARCHAR(100) NOT NULL,           -- e.g. 'Bharatiya Nyaya Sanhita (BNS)', 'NDPS Act'
    SectionNumber   VARCHAR(20) NOT NULL,
    SectionTitle    VARCHAR(255),
    OffenceCategory VARCHAR(100),                    -- e.g. 'Theft', 'Assault', 'Cybercrime'
    IsHeinous       BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE GenderRef (
    GenderID        SERIAL PRIMARY KEY,
    GenderLabel     VARCHAR(30) NOT NULL
);

CREATE TABLE ReligionRef (
    ReligionID      SERIAL PRIMARY KEY,
    ReligionLabel   VARCHAR(50) NOT NULL
);

CREATE TABLE CasteRef (
    CasteID         SERIAL PRIMARY KEY,
    CasteCategoryLabel VARCHAR(50) NOT NULL          -- statutory category only (e.g. SC/ST/OBC/General) —
                                                      -- recorded because it is a mandatory field on the
                                                      -- statutory FIR form (Integrated Investigation Form-1);
                                                      -- see README section on data-protection posture for how
                                                      -- this field is access-restricted and why it must never
                                                      -- be used as a scoring/ranking input anywhere in the app.
);

CREATE TABLE CaseStatusRef (
    CaseStatusID    SERIAL PRIMARY KEY,
    StatusLabel     VARCHAR(50) NOT NULL             -- 'Under Investigation','Charge-sheeted','Closed - Untraced','Court - Pending','Convicted','Acquitted'
);

-- ----------------------------------------------------------------------------
-- 3. CORE FIR (FIRST INFORMATION REPORT) TABLES
-- ----------------------------------------------------------------------------

CREATE TABLE FIR (
    FIRID               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    FIRNumber           VARCHAR(30) NOT NULL,
    UnitID              INTEGER NOT NULL REFERENCES Unit(UnitID),      -- filing police station
    DateFiled           TIMESTAMPTZ NOT NULL,
    DateOfOccurrence    TIMESTAMPTZ,
    Location            GEOMETRY(Point, 4326),                        -- lat/long of incident, PostGIS
    LocationText        VARCHAR(255),
    Narrative           TEXT,                                         -- free-text complaint narrative
    CaseStatusID        INTEGER NOT NULL REFERENCES CaseStatusRef(CaseStatusID),
    InvestigatingOfficerID INTEGER REFERENCES Employee(EmployeeID),
    IsHeinous           BOOLEAN NOT NULL DEFAULT FALSE,
    CreatedAt           TIMESTAMPTZ NOT NULL DEFAULT now(),
    UpdatedAt           TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (FIRNumber, UnitID)
);

CREATE INDEX idx_fir_location ON FIR USING GIST (Location);
CREATE INDEX idx_fir_date ON FIR (DateOfOccurrence);
CREATE INDEX idx_fir_unit ON FIR (UnitID);

CREATE TABLE FIRLegalSection (
    FIRID               UUID NOT NULL REFERENCES FIR(FIRID) ON DELETE CASCADE,
    LegalSectionID      INTEGER NOT NULL REFERENCES LegalSection(LegalSectionID),
    PRIMARY KEY (FIRID, LegalSectionID)
);

-- Complainant / Victim — treated as sensitive PII, see middleware/piiRedaction.js
CREATE TABLE Complainant (
    ComplainantID       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    FIRID               UUID NOT NULL REFERENCES FIR(FIRID) ON DELETE CASCADE,
    ComplainantName     VARCHAR(150) NOT NULL,
    AgeYear             INTEGER,
    GenderID            INTEGER REFERENCES GenderRef(GenderID),
    PhoneNumber         VARCHAR(20),
    Address             TEXT
);

CREATE TABLE Victim (
    VictimID            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    FIRID               UUID NOT NULL REFERENCES FIR(FIRID) ON DELETE CASCADE,
    VictimName          VARCHAR(150) NOT NULL,
    AgeYear             INTEGER,
    GenderID            INTEGER REFERENCES GenderRef(GenderID),
    ReligionID          INTEGER REFERENCES ReligionRef(ReligionID),   -- statutory field, redacted by default
    CasteID             INTEGER REFERENCES CasteRef(CasteID),        -- statutory field, redacted by default
    Address             TEXT
);

-- Accused persons
CREATE TABLE Accused (
    AccusedID           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    FIRID               UUID NOT NULL REFERENCES FIR(FIRID) ON DELETE CASCADE,
    AccusedName         VARCHAR(150),
    AliasName           VARCHAR(150),
    AgeYear             INTEGER,
    GenderID            INTEGER REFERENCES GenderRef(GenderID),
    Address             TEXT,
    IsArrested          BOOLEAN DEFAULT FALSE,
    IsRepeatOffender    BOOLEAN DEFAULT FALSE,        -- derived flag: prior FIR linkage count > threshold, never
                                                       -- derived from ReligionID/CasteID — see README
    ModusOperandiText   TEXT                            -- free-text MO description, used for MO similarity search
);

CREATE TABLE Vehicle (
    VehicleID           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    FIRID               UUID REFERENCES FIR(FIRID) ON DELETE CASCADE,
    RegistrationNumber  VARCHAR(20),
    VehicleType         VARCHAR(50),
    Make                VARCHAR(50),
    Color               VARCHAR(30),
    RoleInCase          VARCHAR(50)                    -- 'Stolen','Used in Offence','Recovered'
);

CREATE TABLE PropertyItem (
    PropertyItemID      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    FIRID               UUID NOT NULL REFERENCES FIR(FIRID) ON DELETE CASCADE,
    Description         TEXT,
    EstimatedValueINR   NUMERIC(14,2),
    IsRecovered         BOOLEAN DEFAULT FALSE
);

-- ----------------------------------------------------------------------------
-- 4. LINK ANALYSIS (SYNDICATE / NETWORK GRAPH)
-- ----------------------------------------------------------------------------

CREATE TABLE AccusedLink (
    LinkID              SERIAL PRIMARY KEY,
    AccusedID_A         UUID NOT NULL REFERENCES Accused(AccusedID),
    AccusedID_B         UUID NOT NULL REFERENCES Accused(AccusedID),
    LinkType            VARCHAR(50),                   -- 'Co-accused','Same MO','Same Vehicle','Family','Associate'
    LinkStrength        NUMERIC(3,2) DEFAULT 0.5,       -- 0-1 confidence score
    CreatedAt           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 5. SECURITY, RBAC-SUPPORT, AND AUDIT
-- ----------------------------------------------------------------------------

CREATE TABLE AuditLog (
    AuditLogID          BIGSERIAL PRIMARY KEY,
    EmployeeID          INTEGER REFERENCES Employee(EmployeeID),
    KGID                VARCHAR(20),
    ActionType          VARCHAR(50) NOT NULL,          -- 'LOGIN','SEARCH','EXPORT','FILTER_CHANGE','AI_QUERY','VIEW_FIR'
    ActionDetail        JSONB,
    IPAddress           INET,
    CreatedAt           TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- WORM enforcement: revoke UPDATE/DELETE from the application role at the DB level.
-- Run as a superuser after creating the app role, e.g.:
--   REVOKE UPDATE, DELETE ON AuditLog FROM nagarwatch_app;

CREATE TABLE AIQueryLog (
    AIQueryLogID        BIGSERIAL PRIMARY KEY,
    EmployeeID          INTEGER REFERENCES Employee(EmployeeID),
    PromptText          TEXT NOT NULL,
    GeneratedSQL        TEXT,
    ModelUsed           VARCHAR(100),
    Success             BOOLEAN,
    CreatedAt           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- Convenience view: hotspot-ready FIR points with only non-PII fields,
-- so map/analytics endpoints never need to touch Complainant/Victim tables.
-- ----------------------------------------------------------------------------
CREATE VIEW FIRHotspotView AS
SELECT
    f.FIRID,
    f.UnitID,
    f.DateOfOccurrence,
    f.Location,
    f.IsHeinous,
    f.CaseStatusID,
    ls.OffenceCategory
FROM FIR f
LEFT JOIN FIRLegalSection fls ON fls.FIRID = f.FIRID
LEFT JOIN LegalSection ls ON ls.LegalSectionID = fls.LegalSectionID;
