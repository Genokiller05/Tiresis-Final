-- =========================================================================
-- TIRESIS - SCRIPT DE BASE DE DATOS
-- ADAPTADO PARA MICROSOFT SQL SERVER 2022 (T-SQL)
-- =========================================================================

-- Opcional: Crear la base de datos si no existe
-- CREATE DATABASE TiresisDB;
-- GO
-- USE TiresisDB;
-- GO

-- -------------------------------------------------------------------------
-- CATALOGOS (Tablas de referencia)
-- -------------------------------------------------------------------------

CREATE TABLE roles (
    id INT PRIMARY KEY IDENTITY(1,1),
    code NVARCHAR(50) NOT NULL,
    name NVARCHAR(100) NOT NULL
);

CREATE TABLE report_types (
    id INT PRIMARY KEY IDENTITY(1,1),
    code NVARCHAR(50) NOT NULL,
    name NVARCHAR(100) NOT NULL
);

CREATE TABLE report_statuses (
    id INT PRIMARY KEY IDENTITY(1,1),
    code NVARCHAR(50) NOT NULL,
    name NVARCHAR(100) NOT NULL
);

CREATE TABLE priorities (
    id INT PRIMARY KEY IDENTITY(1,1),
    code NVARCHAR(50) NOT NULL,
    name NVARCHAR(100) NOT NULL
);

CREATE TABLE evidence_types (
    id INT PRIMARY KEY IDENTITY(1,1),
    code NVARCHAR(50) NOT NULL,
    name NVARCHAR(100) NOT NULL
);

-- -------------------------------------------------------------------------
-- TABLAS PRINCIPALES CORE 
-- -------------------------------------------------------------------------

CREATE TABLE sites (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    address NVARCHAR(MAX) NULL,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);

CREATE TABLE admins (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    fullName NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NOT NULL UNIQUE,
    password NVARCHAR(MAX) NOT NULL,
    companyName NVARCHAR(255) NULL,
    location NVARCHAR(MAX) NULL,
    lat FLOAT NULL,
    lng FLOAT NULL,
    zone NVARCHAR(100) NULL,
    [plan] NVARCHAR(50) NULL,
    created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);

CREATE TABLE site_memberships (
    site_id UNIQUEIDENTIFIER NOT NULL,
    user_id UNIQUEIDENTIFIER NOT NULL, -- Referencia general, puede ser admin o guard
    role_id INT NULL, 
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT PK_site_memberships PRIMARY KEY (site_id, user_id),
    CONSTRAINT FK_site_memberships_site FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

CREATE TABLE profiles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    full_name NVARCHAR(255) NOT NULL,
    document_id NVARCHAR(100) NOT NULL UNIQUE,
    phone NVARCHAR(50) NULL,
    current_lat FLOAT NULL,
    current_lng FLOAT NULL,
    last_seen_at DATETIMEOFFSET NULL,
    created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);

CREATE TABLE guards (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    idEmpleado NVARCHAR(100) NOT NULL,
    nombre NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NULL,
    area NVARCHAR(100) NULL,
    estado NVARCHAR(50) NULL,
    actividades NVARCHAR(MAX) NULL, -- Guardado como JSON (arreglo)
    direccion NVARCHAR(MAX) NULL,
    telefono NVARCHAR(50) NULL,
    foto NVARCHAR(MAX) NULL,
    lat FLOAT NULL,
    lng FLOAT NULL,
    fechaContratacion DATETIMEOFFSET NULL,
    created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    site_id UNIQUEIDENTIFIER NULL,
    CONSTRAINT FK_guards_site FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL,
    CONSTRAINT CHK_guards_actividades_json CHECK (actividades IS NULL OR ISJSON(actividades) > 0)
);

CREATE TABLE locations (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    site_id UNIQUEIDENTIFIER NOT NULL,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT FK_locations_site FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

CREATE TABLE buildings (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    site_id UNIQUEIDENTIFIER NULL, -- Añadido si es por sitio
    name NVARCHAR(255) NOT NULL,
    geometry NVARCHAR(MAX) NULL, -- Guardado como JSON (arreglo de coordenadas)
    created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT FK_buildings_site FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL,
    CONSTRAINT CHK_buildings_geometry_json CHECK (geometry IS NULL OR ISJSON(geometry) > 0)
);

-- -------------------------------------------------------------------------
-- DISPOSITIVOS Y CAMARAS
-- -------------------------------------------------------------------------

CREATE TABLE cameras (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    site_id UNIQUEIDENTIFIER NOT NULL,
    name NVARCHAR(255) NOT NULL,
    rtsp_url NVARCHAR(MAX) NULL,
    location_description NVARCHAR(MAX) NULL,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT FK_cameras_site FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

CREATE TABLE devices (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    device_type NVARCHAR(50) NULL,
    push_token NVARCHAR(MAX) NULL,
    last_seen_at DATETIMEOFFSET NULL,
    created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);

-- -------------------------------------------------------------------------
-- OPERACION DIARIA Y REPORTES (MOVIL)
-- -------------------------------------------------------------------------

CREATE TABLE entries_exits (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    site_id UNIQUEIDENTIFIER NULL,
    fechaHora DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    tipo NVARCHAR(50) NOT NULL,
    descripcion NVARCHAR(MAX) NULL,
    idRelacionado NVARCHAR(100) NULL,
    created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT FK_entries_exits_site FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL
);

CREATE TABLE reports (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    site_id UNIQUEIDENTIFIER NOT NULL,
    shift_id NVARCHAR(100) NULL,
    report_type_id INT NULL,
    status_id INT NULL,
    priority_id INT NULL,
    location_id NVARCHAR(100) NULL,
    gps_lat FLOAT NULL,
    gps_lng FLOAT NULL,
    short_description NVARCHAR(MAX) NULL,
    created_by_guard_id UNIQUEIDENTIFIER NOT NULL,
    created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    closed_at DATETIMEOFFSET NULL,
    CONSTRAINT FK_reports_site FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    CONSTRAINT FK_reports_guard FOREIGN KEY (created_by_guard_id) REFERENCES guards(id)
);

CREATE TABLE evidences (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    evidence_type_id INT NULL,
    storage_path NVARCHAR(MAX) NULL,
    mime_type NVARCHAR(100) NULL,
    created_by_user_id UNIQUEIDENTIFIER NULL,
    created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);

CREATE TABLE report_evidences (
    report_id UNIQUEIDENTIFIER NOT NULL,
    evidence_id UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT PK_report_evidences PRIMARY KEY (report_id, evidence_id),
    CONSTRAINT FK_report_evidences_report FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
    CONSTRAINT FK_report_evidences_evidence FOREIGN KEY (evidence_id) REFERENCES evidences(id) ON DELETE CASCADE
);

CREATE TABLE weekly_reports (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    site_id UNIQUEIDENTIFIER NOT NULL,
    start_date DATETIME2 NOT NULL,
    end_date DATETIME2 NOT NULL,
    summary_json NVARCHAR(MAX) NULL,
    status NVARCHAR(50) NULL,
    admin_notes NVARCHAR(MAX) NULL,
    created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT FK_weekly_reports_site FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    CONSTRAINT CHK_weekly_reports_summary_json CHECK (summary_json IS NULL OR ISJSON(summary_json) > 0)
);

-- -------------------------------------------------------------------------
-- NOTIFICACIONES Y LOGS
-- -------------------------------------------------------------------------

CREATE TABLE notifications (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id NVARCHAR(100) NOT NULL,
    site_id UNIQUEIDENTIFIER NULL,
    message NVARCHAR(MAX) NOT NULL,
    type NVARCHAR(50) NULL,
    status NVARCHAR(50) NULL,
    created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    acknowledged_at DATETIMEOFFSET NULL,
    updated_at DATETIMEOFFSET NULL,
    CONSTRAINT FK_notifications_site FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL
);

CREATE TABLE guard_notifications (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    guard_id NVARCHAR(100) NOT NULL, -- Guarda el idEmpleado o UUID
    title NVARCHAR(255) NOT NULL,
    body NVARCHAR(MAX) NOT NULL,
    type NVARCHAR(50) NULL,
    is_read BIT NOT NULL DEFAULT 0,
    created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);

-- Vistas recomendadas para compatibilidad con código (Opcional)
GO
CREATE VIEW active_guards_view AS
SELECT 
    id AS guard_id,
    nombre,
    idEmpleado AS document_id,
    telefono AS phone,
    lat,
    lng,
    NULL AS last_seen_at, -- Puedes enlazar tabla devices si se ocupa 
    site_id AS sitio_asignado,
    CAST(CASE WHEN estado = 'En servicio' THEN 1 ELSE 0 END AS BIT) AS en_servicio
FROM guards;
GO
