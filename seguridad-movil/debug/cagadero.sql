-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.admins (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  fullName text,
  email text NOT NULL UNIQUE,
  password text,
  companyName text,
  location text,
  lat double precision,
  lng double precision,
  zone text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admins_pkey PRIMARY KEY (id)
);
CREATE TABLE public.alert_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  alert_id uuid NOT NULL,
  assigned_to_user_id uuid NOT NULL,
  assigned_by_user_id uuid NOT NULL,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  unassigned_at timestamp with time zone,
  CONSTRAINT alert_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT alert_assignments_alert_id_fkey FOREIGN KEY (alert_id) REFERENCES public.alerts(id),
  CONSTRAINT alert_assignments_assigned_to_user_id_fkey FOREIGN KEY (assigned_to_user_id) REFERENCES public.profiles(id),
  CONSTRAINT alert_assignments_assigned_by_user_id_fkey FOREIGN KEY (assigned_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.alert_evidences (
  alert_id uuid NOT NULL,
  evidence_id uuid NOT NULL,
  CONSTRAINT alert_evidences_pkey PRIMARY KEY (alert_id, evidence_id),
  CONSTRAINT alert_evidences_alert_id_fkey FOREIGN KEY (alert_id) REFERENCES public.alerts(id),
  CONSTRAINT alert_evidences_evidence_id_fkey FOREIGN KEY (evidence_id) REFERENCES public.evidences(id)
);
CREATE TABLE public.alert_resolutions (
  alert_id uuid NOT NULL,
  resolved_by_user_id uuid NOT NULL,
  resolution_notes text NOT NULL,
  resolved_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT alert_resolutions_pkey PRIMARY KEY (alert_id),
  CONSTRAINT alert_resolutions_alert_id_fkey FOREIGN KEY (alert_id) REFERENCES public.alerts(id),
  CONSTRAINT alert_resolutions_resolved_by_user_id_fkey FOREIGN KEY (resolved_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.alert_sources (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  CONSTRAINT alert_sources_pkey PRIMARY KEY (id)
);
CREATE TABLE public.alert_statuses (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  CONSTRAINT alert_statuses_pkey PRIMARY KEY (id)
);
CREATE TABLE public.alert_types (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  CONSTRAINT alert_types_pkey PRIMARY KEY (id)
);
CREATE TABLE public.alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL,
  source_id integer NOT NULL,
  alert_type_id integer NOT NULL,
  severity_id integer NOT NULL,
  status_id integer NOT NULL,
  camera_id uuid,
  zone_id uuid,
  linked_report_id uuid,
  linked_notice_id uuid,
  description text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT alerts_pkey PRIMARY KEY (id),
  CONSTRAINT alerts_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id),
  CONSTRAINT alerts_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.alert_sources(id),
  CONSTRAINT alerts_alert_type_id_fkey FOREIGN KEY (alert_type_id) REFERENCES public.alert_types(id),
  CONSTRAINT alerts_severity_id_fkey FOREIGN KEY (severity_id) REFERENCES public.priorities(id),
  CONSTRAINT alerts_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.alert_statuses(id),
  CONSTRAINT alerts_camera_id_fkey FOREIGN KEY (camera_id) REFERENCES public.cameras(id),
  CONSTRAINT alerts_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.security_zones(id),
  CONSTRAINT alerts_linked_report_id_fkey FOREIGN KEY (linked_report_id) REFERENCES public.reports(id),
  CONSTRAINT alerts_linked_notice_id_fkey FOREIGN KEY (linked_notice_id) REFERENCES public.resident_notices(id)
);
CREATE TABLE public.assignment_statuses (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  CONSTRAINT assignment_statuses_pkey PRIMARY KEY (id)
);
CREATE TABLE public.audit_actions (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  CONSTRAINT audit_actions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL,
  actor_user_id uuid NOT NULL,
  action_id integer NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id),
  CONSTRAINT audit_logs_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.profiles(id),
  CONSTRAINT audit_logs_action_id_fkey FOREIGN KEY (action_id) REFERENCES public.audit_actions(id)
);
CREATE TABLE public.buildings (
  id text NOT NULL,
  name text,
  geometry jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT buildings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.cameras (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL,
  name text NOT NULL,
  rtsp_url text NOT NULL,
  location_description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cameras_pkey PRIMARY KEY (id),
  CONSTRAINT cameras_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id)
);
CREATE TABLE public.devices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device_type text NOT NULL,
  push_token text,
  last_seen_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT devices_pkey PRIMARY KEY (id),
  CONSTRAINT devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.entries_exits (
  id text NOT NULL,
  fechaHora timestamp with time zone,
  tipo text,
  descripcion text,
  idRelacionado text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT entries_exits_pkey PRIMARY KEY (id)
);
CREATE TABLE public.evidence_types (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  CONSTRAINT evidence_types_pkey PRIMARY KEY (id)
);
CREATE TABLE public.evidences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  evidence_type_id integer NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  created_by_user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT evidences_pkey PRIMARY KEY (id),
  CONSTRAINT evidences_evidence_type_id_fkey FOREIGN KEY (evidence_type_id) REFERENCES public.evidence_types(id),
  CONSTRAINT evidences_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.guards (
  idEmpleado text NOT NULL,
  nombre text,
  email text,
  area text,
  estado text,
  actividades jsonb DEFAULT '[]'::jsonb,
  direccion text,
  telefono text,
  foto text,
  lat double precision,
  lng double precision,
  fechaContratacion timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT guards_pkey PRIMARY KEY (idEmpleado)
);
CREATE TABLE public.locations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT locations_pkey PRIMARY KEY (id),
  CONSTRAINT locations_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id)
);
CREATE TABLE public.notice_evidences (
  notice_id uuid NOT NULL,
  evidence_id uuid NOT NULL,
  CONSTRAINT notice_evidences_pkey PRIMARY KEY (notice_id, evidence_id),
  CONSTRAINT notice_evidences_notice_id_fkey FOREIGN KEY (notice_id) REFERENCES public.resident_notices(id),
  CONSTRAINT notice_evidences_evidence_id_fkey FOREIGN KEY (evidence_id) REFERENCES public.evidences(id)
);
CREATE TABLE public.object_classes (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  CONSTRAINT object_classes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.priorities (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  CONSTRAINT priorities_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  document_id text UNIQUE,
  phone text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  current_lat numeric,
  current_lng numeric,
  last_seen_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.report_closures (
  report_id uuid NOT NULL,
  closed_by_user_id uuid NOT NULL,
  resolution_notes text NOT NULL,
  closed_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT report_closures_pkey PRIMARY KEY (report_id),
  CONSTRAINT report_closures_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.reports(id),
  CONSTRAINT report_closures_closed_by_user_id_fkey FOREIGN KEY (closed_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.report_evidences (
  report_id uuid NOT NULL,
  evidence_id uuid NOT NULL,
  CONSTRAINT report_evidences_pkey PRIMARY KEY (report_id, evidence_id),
  CONSTRAINT report_evidences_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.reports(id),
  CONSTRAINT report_evidences_evidence_id_fkey FOREIGN KEY (evidence_id) REFERENCES public.evidences(id)
);
CREATE TABLE public.report_statuses (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  CONSTRAINT report_statuses_pkey PRIMARY KEY (id)
);
CREATE TABLE public.report_types (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  CONSTRAINT report_types_pkey PRIMARY KEY (id)
);
CREATE TABLE public.reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  site_id uuid,
  shift_id uuid,
  created_by_guard_id uuid NOT NULL,
  report_type_id integer NOT NULL,
  status_id integer NOT NULL,
  priority_id integer NOT NULL,
  location_id uuid,
  gps_lat numeric,
  gps_lng numeric,
  short_description text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  closed_at timestamp with time zone,
  detalles jsonb,
  estado text DEFAULT 'Pendiente'::text,
  fechaHora text,
  tipo text,
  origen text,
  sitioArea text,
  CONSTRAINT reports_pkey PRIMARY KEY (id),
  CONSTRAINT reports_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id),
  CONSTRAINT reports_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.shifts(id),
  CONSTRAINT reports_created_by_guard_id_fkey FOREIGN KEY (created_by_guard_id) REFERENCES public.profiles(id),
  CONSTRAINT reports_report_type_id_fkey FOREIGN KEY (report_type_id) REFERENCES public.report_types(id),
  CONSTRAINT reports_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.report_statuses(id),
  CONSTRAINT reports_priority_id_fkey FOREIGN KEY (priority_id) REFERENCES public.priorities(id),
  CONSTRAINT reports_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id)
);
CREATE TABLE public.resident_notice_statuses (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  CONSTRAINT resident_notice_statuses_pkey PRIMARY KEY (id)
);
CREATE TABLE public.resident_notice_types (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  CONSTRAINT resident_notice_types_pkey PRIMARY KEY (id)
);
CREATE TABLE public.resident_notices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL,
  resident_id uuid NOT NULL,
  notice_type_id integer NOT NULL,
  status_id integer NOT NULL,
  location_id uuid,
  gps_lat numeric,
  gps_lng numeric,
  description text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  closed_at timestamp with time zone,
  CONSTRAINT resident_notices_pkey PRIMARY KEY (id),
  CONSTRAINT resident_notices_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id),
  CONSTRAINT resident_notices_resident_id_fkey FOREIGN KEY (resident_id) REFERENCES public.profiles(id),
  CONSTRAINT resident_notices_notice_type_id_fkey FOREIGN KEY (notice_type_id) REFERENCES public.resident_notice_types(id),
  CONSTRAINT resident_notices_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.resident_notice_statuses(id),
  CONSTRAINT resident_notices_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id)
);
CREATE TABLE public.roles (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.security_zones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  camera_id uuid NOT NULL,
  name text NOT NULL,
  zone_type_id integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT security_zones_pkey PRIMARY KEY (id),
  CONSTRAINT security_zones_camera_id_fkey FOREIGN KEY (camera_id) REFERENCES public.cameras(id),
  CONSTRAINT security_zones_zone_type_id_fkey FOREIGN KEY (zone_type_id) REFERENCES public.zone_types(id)
);
CREATE TABLE public.shift_assignments (
  shift_id uuid NOT NULL,
  guard_id uuid NOT NULL,
  status_id integer NOT NULL,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT shift_assignments_pkey PRIMARY KEY (shift_id, guard_id),
  CONSTRAINT shift_assignments_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.shifts(id),
  CONSTRAINT shift_assignments_guard_id_fkey FOREIGN KEY (guard_id) REFERENCES public.profiles(id),
  CONSTRAINT shift_assignments_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.assignment_statuses(id)
);
CREATE TABLE public.shifts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL,
  start_at timestamp with time zone NOT NULL,
  end_at timestamp with time zone NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT shifts_pkey PRIMARY KEY (id),
  CONSTRAINT shifts_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id),
  CONSTRAINT shifts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.site_memberships (
  site_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role_id integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT site_memberships_pkey PRIMARY KEY (site_id, user_id),
  CONSTRAINT site_memberships_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id),
  CONSTRAINT site_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT site_memberships_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id)
);
CREATE TABLE public.sites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT sites_pkey PRIMARY KEY (id)
);
CREATE TABLE public.zone_coordinates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL,
  point_order integer NOT NULL,
  x integer NOT NULL,
  y integer NOT NULL,
  CONSTRAINT zone_coordinates_pkey PRIMARY KEY (id),
  CONSTRAINT zone_coordinates_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.security_zones(id)
);
CREATE TABLE public.zone_rule_objects (
  zone_id uuid NOT NULL,
  object_class_id integer NOT NULL,
  CONSTRAINT zone_rule_objects_pkey PRIMARY KEY (zone_id, object_class_id),
  CONSTRAINT zone_rule_objects_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.security_zones(id),
  CONSTRAINT zone_rule_objects_object_class_id_fkey FOREIGN KEY (object_class_id) REFERENCES public.object_classes(id)
);
CREATE TABLE public.zone_rules (
  zone_id uuid NOT NULL,
  direction text NOT NULL DEFAULT 'both'::text CHECK (direction = ANY (ARRAY['both'::text, 'inbound'::text, 'outbound'::text])),
  sensitivity numeric NOT NULL DEFAULT 0.80 CHECK (sensitivity >= 0::numeric AND sensitivity <= 1::numeric),
  min_dwell_ms integer,
  enabled boolean NOT NULL DEFAULT true,
  CONSTRAINT zone_rules_pkey PRIMARY KEY (zone_id),
  CONSTRAINT zone_rules_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.security_zones(id)
);
CREATE TABLE public.zone_types (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  CONSTRAINT zone_types_pkey PRIMARY KEY (id)
);