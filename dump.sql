--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4 (Debian 17.4-1.pgdg120+2)
-- Dumped by pg_dump version 17.4 (Debian 17.4-1.pgdg120+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: needed_moisture_level; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.needed_moisture_level AS ENUM (
    'Very Dry',
    'Dry',
    'Moist',
    'Wet',
    'Very Wet'
);


ALTER TYPE public.needed_moisture_level OWNER TO postgres;

--
-- Name: notify_new_or_updated_moisture(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.notify_new_or_updated_moisture() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE') THEN
    PERFORM pg_notify(
      'moisture_channel',
      json_build_object(
        'message', 'New moisture value',
        'sensorId', NEW.id,
        'moisture_level', NEW.current_moisture_level,
        'user_id', NEW.user_id
      )::text
    );
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.notify_new_or_updated_moisture() OWNER TO postgres;

--
-- Name: notify_sensor_assignment(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.notify_sensor_assignment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  sensor_name TEXT;
BEGIN
  IF NEW.moisture_sensor_id IS NOT NULL THEN
    -- Sensor-Namen aus moisture_sensor lesen
    SELECT name INTO sensor_name
    FROM moisture_sensor
    WHERE id = NEW.moisture_sensor_id;

    -- Benachrichtigung senden
    PERFORM pg_notify(
      'new_sensor_channel',
      json_build_object(
        'message', 'New sensor assigned',
        'sensorId', NEW.moisture_sensor_id,
        'sensor_name', sensor_name,
        'moisture_level', NULL,
        'user_id', NEW.user_id,
        'user_plant_id', NEW.id,
        'plant_nickname', NEW.nickname
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.notify_sensor_assignment() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: app_user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.app_user (
    id integer NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    pwd_reset_token text,
    active boolean DEFAULT false,
    token_expiring_date timestamp with time zone
);


ALTER TABLE public.app_user OWNER TO postgres;

--
-- Name: app_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.app_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.app_user_id_seq OWNER TO postgres;

--
-- Name: app_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.app_user_id_seq OWNED BY public.app_user.id;


--
-- Name: catalog_plant; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.catalog_plant (
    id integer NOT NULL,
    common_name text NOT NULL,
    scientific_name text NOT NULL,
    width integer,
    height integer,
    min_temperature integer,
    max_temperature integer,
    planting_start text,
    planting_end text,
    blooming_start text,
    blooming_end text,
    flower_color text,
    harvest_start text,
    harvest_end text,
    edible_parts text,
    yield text,
    sun_light text,
    water_frequency text,
    feeding_frequency text,
    fertilizer_type text,
    image_url text,
    needed_moisture public.needed_moisture_level
);


ALTER TABLE public.catalog_plant OWNER TO postgres;

--
-- Name: catalog_plant_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.catalog_plant_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.catalog_plant_id_seq OWNER TO postgres;

--
-- Name: catalog_plant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.catalog_plant_id_seq OWNED BY public.catalog_plant.id;


--
-- Name: garden; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.garden (
    id integer NOT NULL,
    user_id integer,
    name text NOT NULL
);


ALTER TABLE public.garden OWNER TO postgres;

--
-- Name: garden_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.garden_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.garden_id_seq OWNER TO postgres;

--
-- Name: garden_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.garden_id_seq OWNED BY public.garden.id;


--
-- Name: moisture_level_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.moisture_level_history (
    id integer NOT NULL,
    sensor_id integer,
    moisture_level integer,
    time_stamp timestamp with time zone NOT NULL
);


ALTER TABLE public.moisture_level_history OWNER TO postgres;

--
-- Name: moisture_level_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.moisture_level_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.moisture_level_history_id_seq OWNER TO postgres;

--
-- Name: moisture_level_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.moisture_level_history_id_seq OWNED BY public.moisture_level_history.id;


--
-- Name: moisture_sensor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.moisture_sensor (
    id integer NOT NULL,
    user_id integer,
    current_moisture_level integer,
    name text NOT NULL,
    date_added date DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.moisture_sensor OWNER TO postgres;

--
-- Name: moisture_sensor_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.moisture_sensor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.moisture_sensor_id_seq OWNER TO postgres;

--
-- Name: moisture_sensor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.moisture_sensor_id_seq OWNED BY public.moisture_sensor.id;


--
-- Name: user_plant; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_plant (
    id integer NOT NULL,
    nickname text NOT NULL,
    plant_id integer NOT NULL,
    user_id integer NOT NULL,
    garden_id integer NOT NULL,
    date_added timestamp with time zone,
    date_watered date,
    harvest_status boolean DEFAULT false,
    moisture_sensor_id integer
);


ALTER TABLE public.user_plant OWNER TO postgres;

--
-- Name: user_plant_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_plant_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_plant_id_seq OWNER TO postgres;

--
-- Name: user_plant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_plant_id_seq OWNED BY public.user_plant.id;


--
-- Name: app_user id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_user ALTER COLUMN id SET DEFAULT nextval('public.app_user_id_seq'::regclass);


--
-- Name: catalog_plant id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.catalog_plant ALTER COLUMN id SET DEFAULT nextval('public.catalog_plant_id_seq'::regclass);


--
-- Name: garden id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.garden ALTER COLUMN id SET DEFAULT nextval('public.garden_id_seq'::regclass);


--
-- Name: moisture_level_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.moisture_level_history ALTER COLUMN id SET DEFAULT nextval('public.moisture_level_history_id_seq'::regclass);


--
-- Name: moisture_sensor id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.moisture_sensor ALTER COLUMN id SET DEFAULT nextval('public.moisture_sensor_id_seq'::regclass);


--
-- Name: user_plant id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_plant ALTER COLUMN id SET DEFAULT nextval('public.user_plant_id_seq'::regclass);


--
-- Data for Name: catalog_plant; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.catalog_plant (id, common_name, scientific_name, width, height, min_temperature, max_temperature, planting_start, planting_end, blooming_start, blooming_end, flower_color, harvest_start, harvest_end, edible_parts, yield, sun_light, water_frequency, feeding_frequency, fertilizer_type, image_url, needed_moisture) FROM stdin;
10	Mint	Mentha spicata	45	60	10	30	April	June	May	August	Purple	\N	\N	Leaves	Frequent small harvests	Partial Shade to Full Sun	DAILY	WEEKLY	Organic Compost	https://mxawacvsywnyaatpwbvl.supabase.co/storage/v1/object/public/plant-icons//mintIcon.png	Wet
11	Catnip	Nepeta cataria	60	100	-30	35	March	May	June	September	Lavender	June	September	Leaves, stems	Moderate (up to 1 lb per plant)	Full sun to partial shade	Moderate	Monthly	Balanced (e.g., 10-10-10)	https://mxawacvsywnyaatpwbvl.supabase.co/storage/v1/object/public/plant-icons//catnipIcon.png	Dry
2	Lavender	Lavandula angustifolia	60	90	-5	30	April	June	June	August	Purple	\N	\N	\N	\N	Full Sun	WEEKLY	MONTHLY	All-purpose fertilizer	https://mxawacvsywnyaatpwbvl.supabase.co/storage/v1/object/public/plant-icons//Lavender%20Plant%20Icon%20in%20Vibrant%20Colors.png	Dry
1	tomato	Solanum lycopersicum	60	100	15	35	March	April	June	August	Yellow	July	September	Fruit	20	FULL_SUN	WEEKLY	MONTHLY	Organic Compost	https://mxawacvsywnyaatpwbvl.supabase.co/storage/v1/object/public/plant-icons//Cartoon%20Tomato%20Plant%20Illustration.png	Moist
4	Basil	Ocimum basilicum	30	60	10	30	April	June	June	September	White	June	October	Leaves	Frequent small harvests	Full Sun	DAILY	WEEKLY	Liquid Organic Fertilizer	https://mxawacvsywnyaatpwbvl.supabase.co/storage/v1/object/public/plant-icons//basilIcon.png	Wet
5	Blueberry	Vaccinium corymbosum	120	180	-20	30	March	April	April	May	White/Pink	June	August	Fruit	2-4 kg per bush	Full Sun to Partial Shade	WEEKLY	BIWEEKLY	Acidic Fertilizer	https://mxawacvsywnyaatpwbvl.supabase.co/storage/v1/object/public/plant-icons//blueberryIcon.png	Moist
3	Carrot	Daucus carota	5	30	4	24	March	July	\N	\N	\N	June	November	Root	1-2 kg per m²	Full Sun	BIWEEKLY	MONTHLY	Balanced NPK	https://mxawacvsywnyaatpwbvl.supabase.co/storage/v1/object/public/plant-icons//carrotIcon.png	Very Dry
7	Zucchini	Cucurbita pepo	90	60	10	35	April	June	June	August	Yellow	June	September	Fruit	3-9 kg per plant	Full Sun	DAILY	WEEKLY	High Potassium Fertilizer	https://mxawacvsywnyaatpwbvl.supabase.co/storage/v1/object/public/plant-icons//zucchiniIcon.png	Wet
6	Rosemary	Salvia rosmarinus	90	150	-10	30	March	May	May	August	Blue	\N	\N	Leaves	Frequent small harvests	Full Sun	WEEKLY	MONTHLY	Low Nitrogen Fertilizer	https://mxawacvsywnyaatpwbvl.supabase.co/storage/v1/object/public/plant-icons//rosemaryIcon.png	Dry
8	Strawberry	Fragaria × ananassa	30	20	-5	30	March	May	April	June	White	May	July	Fruit	0.5-1 kg per plant	Full Sun	DAILY	BIWEEKLY	Balanced NPK	https://mxawacvsywnyaatpwbvl.supabase.co/storage/v1/object/public/plant-icons//strawberryIcon.png	Wet
9	Sunflower	Helianthus annuus	60	300	10	35	April	May	July	August	Yellow	September	October	Seeds	500-1000 seeds per plant	Full Sun	BIWEEKLY	MONTHLY	Slow-release Fertilizer	https://mxawacvsywnyaatpwbvl.supabase.co/storage/v1/object/public/plant-icons//sunflowerIcon.png	Very Dry
\.


--
-- Name: app_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.app_user_id_seq', 1, true);


--
-- Name: catalog_plant_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.catalog_plant_id_seq', 1, true);


--
-- Name: garden_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.garden_id_seq', 1, true);


--
-- Name: moisture_level_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.moisture_level_history_id_seq', 1, true);


--
-- Name: moisture_sensor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.moisture_sensor_id_seq', 1, true);


--
-- Name: user_plant_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_plant_id_seq', 1, true);


--
-- Name: app_user app_user_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_user
    ADD CONSTRAINT app_user_email_key UNIQUE (email);


--
-- Name: app_user app_user_password_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_user
    ADD CONSTRAINT app_user_password_key UNIQUE (password);


--
-- Name: app_user app_user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_user
    ADD CONSTRAINT app_user_pkey PRIMARY KEY (id);

--
-- Name: catalog_plant catalog_plant_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.catalog_plant
    ADD CONSTRAINT catalog_plant_pkey PRIMARY KEY (id);


--
-- Name: garden garden_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.garden
    ADD CONSTRAINT garden_pkey PRIMARY KEY (id);


--
-- Name: moisture_level_history moisture_level_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.moisture_level_history
    ADD CONSTRAINT moisture_level_history_pkey PRIMARY KEY (id);


--
-- Name: moisture_sensor moisture_sensor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.moisture_sensor
    ADD CONSTRAINT moisture_sensor_pkey PRIMARY KEY (id);


--
-- Name: user_plant user_plant_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_plant
    ADD CONSTRAINT user_plant_pkey PRIMARY KEY (id);


--
-- Name: moisture_sensor moisture_sensor_notify_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER moisture_sensor_notify_trigger AFTER INSERT OR UPDATE ON public.moisture_sensor FOR EACH ROW EXECUTE FUNCTION public.notify_new_or_updated_moisture();


--
-- Name: user_plant notify_sensor_assignment_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER notify_sensor_assignment_trigger AFTER INSERT OR UPDATE OF moisture_sensor_id ON public.user_plant FOR EACH ROW EXECUTE FUNCTION public.notify_sensor_assignment();


--
-- Name: moisture_level_history moisture_level_history_sensor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.moisture_level_history
    ADD CONSTRAINT moisture_level_history_sensor_id_fkey FOREIGN KEY (sensor_id) REFERENCES public.moisture_sensor(id) ON DELETE CASCADE;


--
-- Name: moisture_sensor moisture_sensor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.moisture_sensor
    ADD CONSTRAINT moisture_sensor_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_user(id);


--
-- Name: user_plant user_plant_garden_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_plant
    ADD CONSTRAINT user_plant_garden_id_fkey FOREIGN KEY (garden_id) REFERENCES public.garden(id) ON DELETE CASCADE;


--
-- Name: user_plant user_plant_moisture_sensor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_plant
    ADD CONSTRAINT user_plant_moisture_sensor_id_fkey FOREIGN KEY (moisture_sensor_id) REFERENCES public.moisture_sensor(id) ON DELETE SET NULL;


--
-- Name: user_plant user_plant_plant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_plant
    ADD CONSTRAINT user_plant_plant_id_fkey FOREIGN KEY (plant_id) REFERENCES public.catalog_plant(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

