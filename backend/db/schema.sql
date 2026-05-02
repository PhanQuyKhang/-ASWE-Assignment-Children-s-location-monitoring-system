-- public.users definition

-- Drop table

-- DROP TABLE public.users;

CREATE TABLE public.users (
	user_id serial4 NOT NULL,
	email varchar(255) NOT NULL,
	"password" varchar(255) NULL,
	phone varchar(20) NULL,
	lname varchar(50) NOT NULL,
	fname varchar(50) NOT NULL,
	CONSTRAINT users_email_key UNIQUE (email),
	CONSTRAINT users_pkey PRIMARY KEY (user_id)
);


-- public.devices definition

-- Drop table

-- DROP TABLE public.devices;

CREATE TABLE public.devices (
	device_id uuid DEFAULT gen_random_uuid() NOT NULL,
	user_id int4 NOT NULL,
	child_name varchar(20) NOT NULL,
	last_lat numeric(10, 8) NULL,
	last_lon numeric(11, 8) NULL,
	last_updated timestamptz NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	status varchar(20) DEFAULT 'ACTIVE'::character varying NULL,
	timezone text DEFAULT 'Asia/Ho_Chi_Minh'::text NOT NULL,
	boundary_status varchar(10) DEFAULT 'INSIDE'::character varying NULL,
	CONSTRAINT devices_boundary_status_check CHECK (((boundary_status)::text = ANY ((ARRAY['INSIDE'::character varying, 'OUTSIDE'::character varying])::text[]))),
	CONSTRAINT devices_pkey PRIMARY KEY (device_id),
	CONSTRAINT devices_status_check CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'INACTIVE'::character varying, 'NOSIGNAL'::character varying])::text[]))),
	CONSTRAINT devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE
);
CREATE INDEX idx_devices_last_updated ON public.devices USING btree (last_updated);
CREATE INDEX idx_devices_status_last_updated ON public.devices USING btree (status, last_updated);
CREATE INDEX idx_devices_user_id ON public.devices USING btree (user_id);


-- public.zones definition

-- Drop table

-- DROP TABLE public.zones;

CREATE TABLE public.zones (
	zone_id serial4 NOT NULL,
	device_id uuid NOT NULL,
	zone_name varchar(100) NOT NULL,
	"type" varchar(20) NOT NULL,
	is_active bool DEFAULT true NULL,
	schedule_type varchar(20) DEFAULT 'ALWAYS'::character varying NULL,
	start_time time NULL,
	days_of_week _int4 NULL,
	days_of_month _int4 NULL,
	specific_date date NULL,
	duration int4 NULL,
	CONSTRAINT zones_duration_check CHECK (((duration > 0) AND (duration < 1440))),
	CONSTRAINT zones_pkey PRIMARY KEY (zone_id),
	CONSTRAINT zones_schedule_type_check CHECK (((schedule_type)::text = ANY ((ARRAY['ALWAYS'::character varying, 'DAILY'::character varying, 'WEEKLY'::character varying, 'MONTHLY'::character varying, 'ONCE'::character varying])::text[]))),
	CONSTRAINT zones_type_check CHECK (((type)::text = ANY ((ARRAY['CIRCLE'::character varying, 'POLYGON'::character varying])::text[]))),
	CONSTRAINT zones_arduino_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices(device_id) ON DELETE CASCADE
);
CREATE INDEX idx_zones_arduino_id ON public.zones USING btree (device_id);


-- public.alert_logs definition

-- Drop table

-- DROP TABLE public.alert_logs;

CREATE TABLE public.alert_logs (
	alert_id serial4 NOT NULL,
	device_id uuid NOT NULL,
	zone_id int4 NULL,
	alert_type varchar(50) NOT NULL,
	message text NOT NULL,
	trigger_lat numeric(10, 8) NULL,
	trigger_lon numeric(11, 8) NULL,
	is_read bool DEFAULT false NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	"timestamp" timestamptz NULL,
	CONSTRAINT alert_logs_alert_type_check CHECK (((alert_type)::text = ANY ((ARRAY['EXIT'::character varying, 'ENTER'::character varying, 'OUT_OF_SIGNAL'::character varying, 'SOS'::character varying, 'LOW_BATTERY'::character varying])::text[]))),
	CONSTRAINT alert_logs_pkey PRIMARY KEY (alert_id),
	CONSTRAINT alert_logs_arduino_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices(device_id) ON DELETE CASCADE,
	CONSTRAINT alert_logs_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.zones(zone_id) ON DELETE SET NULL
);
CREATE INDEX idx_alert_logs_arduino_time ON public.alert_logs USING btree (device_id, created_at DESC);


-- public.circles definition

-- Drop table

-- DROP TABLE public.circles;

CREATE TABLE public.circles (
	zone_id int4 NOT NULL,
	center_lat numeric(10, 8) NOT NULL,
	center_lon numeric(11, 8) NOT NULL,
	radius int4 NOT NULL,
	CONSTRAINT circles_pkey PRIMARY KEY (zone_id),
	CONSTRAINT circles_radius_check CHECK ((radius > 0)),
	CONSTRAINT circles_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.zones(zone_id) ON DELETE CASCADE
);


-- public.device_logs definition

-- Drop table

-- DROP TABLE public.device_logs;

CREATE TABLE public.device_logs (
	log_id int8 DEFAULT nextval('loca_logs_log_id_seq'::regclass) NOT NULL,
	device_id uuid NOT NULL,
	latitude numeric(10, 8) NOT NULL,
	longitude numeric(11, 8) NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	"timestamp" timestamptz NULL,
	accuracy numeric(10, 2) NULL,
	speed numeric(8, 2) NULL,
	heading numeric(8, 2) NULL,
	altitude numeric(10, 2) NULL,
	odometer numeric(12, 2) NULL,
	battery_level numeric(5, 2) NULL,
	activity_type varchar(50) NULL,
	zone_id int4 NULL,
	boundary_status varchar(10) NULL,
	zone_name varchar(100) NULL,
	CONSTRAINT device_logs_boundary_status_check CHECK (((boundary_status)::text = ANY ((ARRAY['INSIDE'::character varying, 'OUTSIDE'::character varying])::text[]))),
	CONSTRAINT loca_logs_pkey PRIMARY KEY (log_id),
	CONSTRAINT device_logs_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.zones(zone_id) ON DELETE SET NULL,
	CONSTRAINT loca_logs_arduino_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices(device_id) ON DELETE CASCADE
);
CREATE INDEX idx_loca_logs_arduino_time ON public.device_logs USING btree (device_id, updated_at DESC);


-- public.poly_points definition

-- Drop table

-- DROP TABLE public.poly_points;

CREATE TABLE public.poly_points (
	zone_id int4 NOT NULL,
	sequence_order int4 NOT NULL,
	latitude numeric(10, 8) NOT NULL,
	longitude numeric(11, 8) NOT NULL,
	CONSTRAINT poly_points_pkey PRIMARY KEY (zone_id, sequence_order),
	CONSTRAINT poly_points_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.zones(zone_id) ON DELETE CASCADE
);
CREATE INDEX idx_poly_points_zone_id ON public.poly_points USING btree (zone_id);