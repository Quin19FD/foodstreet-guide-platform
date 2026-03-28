--
-- PostgreSQL database dump
--

\restrict 5zMbrYEzHUgXVcV6bm6AXyGOe68LjtgBMCZskP2HpViBoyJpjTvKhIn9ppRzn0R

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: foodstreet_user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO foodstreet_user;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: foodstreet_user
--

COMMENT ON SCHEMA public IS '';


--
-- Name: POIStatus; Type: TYPE; Schema: public; Owner: foodstreet_user
--

CREATE TYPE public."POIStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."POIStatus" OWNER TO foodstreet_user;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: foodstreet_user
--

CREATE TYPE public."UserRole" AS ENUM (
    'USER',
    'ADMIN',
    'VENDOR'
);


ALTER TYPE public."UserRole" OWNER TO foodstreet_user;

--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: foodstreet_user
--

CREATE TYPE public."UserStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."UserStatus" OWNER TO foodstreet_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: foodstreet_user
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO foodstreet_user;

--
-- Name: favorite_pois; Type: TABLE; Schema: public; Owner: foodstreet_user
--

CREATE TABLE public.favorite_pois (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    poi_id uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.favorite_pois OWNER TO foodstreet_user;

--
-- Name: menu_items; Type: TABLE; Schema: public; Owner: foodstreet_user
--

CREATE TABLE public.menu_items (
    id uuid NOT NULL,
    poi_id uuid NOT NULL,
    name character varying(255),
    description text,
    price integer,
    image_url text,
    is_available boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.menu_items OWNER TO foodstreet_user;

--
-- Name: page_views; Type: TABLE; Schema: public; Owner: foodstreet_user
--

CREATE TABLE public.page_views (
    id uuid NOT NULL,
    path text NOT NULL,
    user_id uuid,
    session_id character varying(255),
    metadata jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.page_views OWNER TO foodstreet_user;

--
-- Name: poi_audios; Type: TABLE; Schema: public; Owner: foodstreet_user
--

CREATE TABLE public.poi_audios (
    id uuid NOT NULL,
    translation_id uuid NOT NULL,
    audio_url text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.poi_audios OWNER TO foodstreet_user;

--
-- Name: poi_images; Type: TABLE; Schema: public; Owner: foodstreet_user
--

CREATE TABLE public.poi_images (
    id uuid NOT NULL,
    poi_id uuid NOT NULL,
    image_url text NOT NULL,
    description text
);


ALTER TABLE public.poi_images OWNER TO foodstreet_user;

--
-- Name: poi_translations; Type: TABLE; Schema: public; Owner: foodstreet_user
--

CREATE TABLE public.poi_translations (
    id uuid NOT NULL,
    poi_id uuid NOT NULL,
    language character varying(10) NOT NULL,
    name character varying(255),
    description text,
    audio_script text,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.poi_translations OWNER TO foodstreet_user;

--
-- Name: poi_views; Type: TABLE; Schema: public; Owner: foodstreet_user
--

CREATE TABLE public.poi_views (
    id uuid NOT NULL,
    poi_id uuid NOT NULL,
    user_id uuid,
    duration integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.poi_views OWNER TO foodstreet_user;

--
-- Name: pois; Type: TABLE; Schema: public; Owner: foodstreet_user
--

CREATE TABLE public.pois (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255),
    category character varying(50),
    latitude double precision,
    longitude double precision,
    price_min integer,
    price_max integer,
    rating double precision DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    approved_at timestamp(3) without time zone,
    approved_by uuid,
    owner_id uuid NOT NULL,
    rejection_reason text,
    status public."POIStatus" DEFAULT 'PENDING'::public."POIStatus" NOT NULL,
    "submitCount" integer DEFAULT 1 NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.pois OWNER TO foodstreet_user;

--
-- Name: reviews; Type: TABLE; Schema: public; Owner: foodstreet_user
--

CREATE TABLE public.reviews (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    poi_id uuid NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.reviews OWNER TO foodstreet_user;

--
-- Name: search_history; Type: TABLE; Schema: public; Owner: foodstreet_user
--

CREATE TABLE public.search_history (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    keyword character varying(255) NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.search_history OWNER TO foodstreet_user;

--
-- Name: tour_pois; Type: TABLE; Schema: public; Owner: foodstreet_user
--

CREATE TABLE public.tour_pois (
    id uuid NOT NULL,
    tour_id uuid NOT NULL,
    poi_id uuid NOT NULL,
    stop_order integer NOT NULL
);


ALTER TABLE public.tour_pois OWNER TO foodstreet_user;

--
-- Name: tours; Type: TABLE; Schema: public; Owner: foodstreet_user
--

CREATE TABLE public.tours (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    image_url text,
    duration_minutes integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.tours OWNER TO foodstreet_user;

--
-- Name: user_activity; Type: TABLE; Schema: public; Owner: foodstreet_user
--

CREATE TABLE public.user_activity (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    action character varying(50) NOT NULL,
    target_type character varying(50),
    target_id uuid,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_activity OWNER TO foodstreet_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: foodstreet_user
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    phone_number text,
    avatar_url text,
    role public."UserRole" DEFAULT 'USER'::public."UserRole" NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    last_login timestamp(3) without time zone,
    refresh_token_hash text,
    refresh_token_expiry timestamp(3) without time zone,
    reset_password_token_hash text,
    reset_password_token_expiry timestamp(3) without time zone,
    approved_at timestamp(3) without time zone,
    approved_by uuid,
    rejection_reason text,
    status public."UserStatus" DEFAULT 'APPROVED'::public."UserStatus" NOT NULL
);


ALTER TABLE public.users OWNER TO foodstreet_user;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: foodstreet_user
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
9d805f04-95f5-4091-bf80-9dae95000b67	7160edeeb1130210ed43da367c91f0b64107a56fdd702a91a84bbbc7f430ce5c	2026-03-14 23:11:56.836025+07	20260314065425_init	\N	\N	2026-03-14 23:11:56.733242+07	1
163370a1-270f-496b-8dc0-f08ecce42ede	3cdc1c1ba902b61703bf53c851cea892833daa8c8cffabfd71e7524509831b17	2026-03-14 23:13:13.64211+07	20260314161313_update_schema	\N	\N	2026-03-14 23:13:13.57165+07	1
f8b92f5c-68f2-41b0-b6ff-2daaa769fc16	6296bde435c13152d3ca8ea0c90c0759455204cecd9b2b4899c8d91ed0554d34	2026-03-14 23:43:26.691524+07	20260314164326_add_tour	\N	\N	2026-03-14 23:43:26.671404+07	1
caa339b8-2b87-4310-82c9-dcca6bdb36fd	8dc4fc0aa2205b20badd785c71f32fd30e8f4f40d5ff8d0bb824bc160b7186bf	2026-03-25 21:19:04.050027+07	20260324090000_add_poi_is_active		\N	2026-03-25 21:19:04.050027+07	0
7a13b304-6ffa-4524-beda-33f69a7928dd	112b89b970ff2d6f0dcb4d14854b4020c33044f918a7f897562db09fdef403ec	2026-03-25 21:19:17.918085+07	20260325110000_add_tour_is_active	\N	\N	2026-03-25 21:19:17.90447+07	1
\.


--
-- Data for Name: favorite_pois; Type: TABLE DATA; Schema: public; Owner: foodstreet_user
--

COPY public.favorite_pois (id, user_id, poi_id, created_at) FROM stdin;
\.


--
-- Data for Name: menu_items; Type: TABLE DATA; Schema: public; Owner: foodstreet_user
--

COPY public.menu_items (id, poi_id, name, description, price, image_url, is_available, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: page_views; Type: TABLE DATA; Schema: public; Owner: foodstreet_user
--

COPY public.page_views (id, path, user_id, session_id, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: poi_audios; Type: TABLE DATA; Schema: public; Owner: foodstreet_user
--

COPY public.poi_audios (id, translation_id, audio_url, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: poi_images; Type: TABLE DATA; Schema: public; Owner: foodstreet_user
--

COPY public.poi_images (id, poi_id, image_url, description) FROM stdin;
\.


--
-- Data for Name: poi_translations; Type: TABLE DATA; Schema: public; Owner: foodstreet_user
--

COPY public.poi_translations (id, poi_id, language, name, description, audio_script, updated_at) FROM stdin;
\.


--
-- Data for Name: poi_views; Type: TABLE DATA; Schema: public; Owner: foodstreet_user
--

COPY public.poi_views (id, poi_id, user_id, duration, created_at) FROM stdin;
\.


--
-- Data for Name: pois; Type: TABLE DATA; Schema: public; Owner: foodstreet_user
--

COPY public.pois (id, name, slug, category, latitude, longitude, price_min, price_max, rating, created_at, updated_at, approved_at, approved_by, owner_id, rejection_reason, status, "submitCount", is_active) FROM stdin;
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: foodstreet_user
--

COPY public.reviews (id, user_id, poi_id, rating, comment, created_at) FROM stdin;
\.


--
-- Data for Name: search_history; Type: TABLE DATA; Schema: public; Owner: foodstreet_user
--

COPY public.search_history (id, user_id, keyword, created_at) FROM stdin;
\.


--
-- Data for Name: tour_pois; Type: TABLE DATA; Schema: public; Owner: foodstreet_user
--

COPY public.tour_pois (id, tour_id, poi_id, stop_order) FROM stdin;
\.


--
-- Data for Name: tours; Type: TABLE DATA; Schema: public; Owner: foodstreet_user
--

COPY public.tours (id, name, description, image_url, duration_minutes, created_at, updated_at, is_active) FROM stdin;
\.


--
-- Data for Name: user_activity; Type: TABLE DATA; Schema: public; Owner: foodstreet_user
--

COPY public.user_activity (id, user_id, action, target_type, target_id, created_at) FROM stdin;
008b0b2f-b093-48b7-a6b4-308b2721d279	774881f9-131a-470f-b759-11418f05fdc5	ADMIN_LOGOUT	USER	774881f9-131a-470f-b759-11418f05fdc5	2026-03-16 10:01:08.211
4efe1911-b639-42bd-8622-3da9930fd456	774881f9-131a-470f-b759-11418f05fdc5	ADMIN_LOGOUT	USER	774881f9-131a-470f-b759-11418f05fdc5	2026-03-16 10:06:08.835
628ef5f4-fde1-46b4-afcf-5b87abb4bc25	774881f9-131a-470f-b759-11418f05fdc5	ADMIN_PASSWORD_OTP_SENT	USER	774881f9-131a-470f-b759-11418f05fdc5	2026-03-16 10:20:05.319
694267f4-88b7-483c-b340-09f4a9dae8f2	774881f9-131a-470f-b759-11418f05fdc5	ADMIN_PASSWORD_OTP_SENT	USER	774881f9-131a-470f-b759-11418f05fdc5	2026-03-16 10:21:29.967
fbfa62c0-9435-42e8-b4b9-3bdcb7c870f5	774881f9-131a-470f-b759-11418f05fdc5	ADMIN_PASSWORD_OTP_SENT	USER	774881f9-131a-470f-b759-11418f05fdc5	2026-03-16 13:55:40.789
9810c84f-c02c-4ebd-834e-6afa6abf9c8b	774881f9-131a-470f-b759-11418f05fdc5	ADMIN_PASSWORD_OTP_SENT	USER	774881f9-131a-470f-b759-11418f05fdc5	2026-03-16 13:58:40.787
51c42399-4e56-4583-819a-a9a113275905	774881f9-131a-470f-b759-11418f05fdc5	ADMIN_PASSWORD_OTP_SENT	USER	774881f9-131a-470f-b759-11418f05fdc5	2026-03-16 13:59:38.931
ceb53abc-3084-45cf-a8c8-72ced0e04547	774881f9-131a-470f-b759-11418f05fdc5	ADMIN_PASSWORD_OTP_SENT	USER	774881f9-131a-470f-b759-11418f05fdc5	2026-03-16 14:07:02.862
b2754ad5-bc72-48b8-9484-c6ee3bf42542	774881f9-131a-470f-b759-11418f05fdc5	ADMIN_PASSWORD_OTP_SENT	USER	774881f9-131a-470f-b759-11418f05fdc5	2026-03-16 14:10:34.355
25ae9d0a-5b22-41b7-9602-73f4a69ec57b	774881f9-131a-470f-b759-11418f05fdc5	ADMIN_PASSWORD_OTP_SENT	USER	774881f9-131a-470f-b759-11418f05fdc5	2026-03-16 14:19:20.858
9f04e4af-35fa-4192-ae5a-7c96eee0406c	774881f9-131a-470f-b759-11418f05fdc5	ADMIN_PASSWORD_OTP_SENT	USER	774881f9-131a-470f-b759-11418f05fdc5	2026-03-16 14:25:04.853
38f80651-11cc-44ed-ab17-1d5828ee7304	774881f9-131a-470f-b759-11418f05fdc5	ADMIN_PASSWORD_OTP_SENT	USER	774881f9-131a-470f-b759-11418f05fdc5	2026-03-16 14:30:07.983
780b966b-ce50-4410-841b-d329e1c530dd	774881f9-131a-470f-b759-11418f05fdc5	ADMIN_PASSWORD_OTP_SENT	USER	774881f9-131a-470f-b759-11418f05fdc5	2026-03-16 14:53:18.292
5d36590b-ce3d-4c32-b2a8-9a39fed4d554	774881f9-131a-470f-b759-11418f05fdc5	ADMIN_PASSWORD_OTP_SENT	USER	774881f9-131a-470f-b759-11418f05fdc5	2026-03-16 15:05:37.361
ee8d5f5a-5d78-4ef6-8c5c-7b6815f65e68	774881f9-131a-470f-b759-11418f05fdc5	ADMIN_PASSWORD_RESET	USER	774881f9-131a-470f-b759-11418f05fdc5	2026-03-16 15:06:18.394
2472dd6f-902d-44a9-9d0c-e42c5f34d218	774881f9-131a-470f-b759-11418f05fdc5	ADMIN_LOGOUT	USER	774881f9-131a-470f-b759-11418f05fdc5	2026-03-19 15:45:43.29
33094ca7-15e9-4a7f-afc5-9d1bc2656d76	774881f9-131a-470f-b759-11418f05fdc5	ADMIN_PASSWORD_OTP_SENT	USER	774881f9-131a-470f-b759-11418f05fdc5	2026-03-19 15:51:25.144
79e0ce25-37ec-418c-bf09-6e023653cc3e	774881f9-131a-470f-b759-11418f05fdc5	ADMIN_PASSWORD_RESET	USER	774881f9-131a-470f-b759-11418f05fdc5	2026-03-19 15:51:56.439
68175bf8-1614-408c-a21f-2452c10924a7	774881f9-131a-470f-b759-11418f05fdc5	ADMIN_VENDOR_APPROVED	USER	6cd6baf2-ecb3-4697-9a95-3406a64f11d4	2026-03-19 15:52:21.487
2cc9dd6b-09ed-4f90-ac4f-50da9e44466b	774881f9-131a-470f-b759-11418f05fdc5	ADMIN_LOGOUT	USER	774881f9-131a-470f-b759-11418f05fdc5	2026-03-19 15:52:43.152
4035383e-877d-4255-b9db-2d9fbc1a12c3	774881f9-131a-470f-b759-11418f05fdc5	ADMIN_VENDOR_APPROVED	USER	2b8867e7-ce0b-4946-9b37-435a3bffb688	2026-03-24 12:52:17.976
2bf34b46-3da2-47fd-8569-11bd44366766	2b8867e7-ce0b-4946-9b37-435a3bffb688	VENDOR_POI_CREATED_AND_SUBMITTED	POI	6267466c-c926-484e-b425-a78089218f1c	2026-03-24 16:05:25.249
49003117-5917-4d9e-b3d4-fa83826fdce1	774881f9-131a-470f-b759-11418f05fdc5	ADMIN_POI_APPROVED	POI	6267466c-c926-484e-b425-a78089218f1c	2026-03-25 08:28:33.74
b8ac20a1-def9-4f8f-8784-a4c0a0916ef7	774881f9-131a-470f-b759-11418f05fdc5	ADMIN_LOGOUT	USER	774881f9-131a-470f-b759-11418f05fdc5	2026-03-25 08:28:49.505
4de2c4be-04d0-4329-aef7-5e8d438d300b	774881f9-131a-470f-b759-11418f05fdc5	ADMIN_PASSWORD_OTP_SENT	USER	774881f9-131a-470f-b759-11418f05fdc5	2026-03-25 08:35:57.809
bb51cc09-f867-4462-9089-0fb58e449a28	774881f9-131a-470f-b759-11418f05fdc5	ADMIN_PASSWORD_RESET	USER	774881f9-131a-470f-b759-11418f05fdc5	2026-03-25 08:37:14.406
694dd51b-88eb-4683-bcc3-a7b3647e6b23	774881f9-131a-470f-b759-11418f05fdc5	ADMIN_LOGIN	USER	774881f9-131a-470f-b759-11418f05fdc5	2026-03-25 08:37:22.313
c18070a0-5445-4d37-b53d-3ac4413427a6	774881f9-131a-470f-b759-11418f05fdc5	ADMIN_VENDOR_DISABLED_WITH_POIS	USER	2b8867e7-ce0b-4946-9b37-435a3bffb688	2026-03-25 09:27:33.58
75ed80ab-ebef-4392-baae-4f45fbab4874	774881f9-131a-470f-b759-11418f05fdc5	ADMIN_VENDOR_ENABLED_WITH_POIS	USER	2b8867e7-ce0b-4946-9b37-435a3bffb688	2026-03-25 09:27:52.045
d8c2efed-f781-4835-865d-13c5c6c38733	2b8867e7-ce0b-4946-9b37-435a3bffb688	VENDOR_POI_CREATED_AND_SUBMITTED	POI	703466bf-e4f8-4698-a6c9-b3ec14d21093	2026-03-25 14:29:41.777
5e807616-164b-494a-b39f-7c0caf132bd7	774881f9-131a-470f-b759-11418f05fdc5	ADMIN_POI_APPROVED	POI	703466bf-e4f8-4698-a6c9-b3ec14d21093	2026-03-25 14:30:08.1
4a5fd1ef-e71d-44b5-891e-0e1e0a3958c4	774881f9-131a-470f-b759-11418f05fdc5	ADMIN_TOUR_CREATED	TOUR	597bd6d6-adfd-4d4e-8ecb-50a2ee0b17e7	2026-03-25 14:47:23.193
b0183a15-5088-4646-90ee-bd108217abd8	774881f9-131a-470f-b759-11418f05fdc5	ADMIN_TOUR_HIDDEN	TOUR	597bd6d6-adfd-4d4e-8ecb-50a2ee0b17e7	2026-03-25 14:48:31.303
fb287636-34a5-4b1d-9a6f-e01d4068b2ab	774881f9-131a-470f-b759-11418f05fdc5	ADMIN_TOUR_UPDATED	TOUR	597bd6d6-adfd-4d4e-8ecb-50a2ee0b17e7	2026-03-25 14:48:32.933
2ebe1b4b-0a36-42d8-91c4-99d3d2173078	774881f9-131a-470f-b759-11418f05fdc5	ADMIN_LOGOUT	USER	774881f9-131a-470f-b759-11418f05fdc5	2026-03-26 06:28:32.205
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: foodstreet_user
--

COPY public.users (id, email, password, name, phone_number, avatar_url, role, is_active, created_at, updated_at, last_login, refresh_token_hash, refresh_token_expiry, reset_password_token_hash, reset_password_token_expiry, approved_at, approved_by, rejection_reason, status) FROM stdin;
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: foodstreet_user
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: favorite_pois favorite_pois_pkey; Type: CONSTRAINT; Schema: public; Owner: foodstreet_user
--

ALTER TABLE ONLY public.favorite_pois
    ADD CONSTRAINT favorite_pois_pkey PRIMARY KEY (id);


--
-- Name: menu_items menu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: foodstreet_user
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_pkey PRIMARY KEY (id);


--
-- Name: page_views page_views_pkey; Type: CONSTRAINT; Schema: public; Owner: foodstreet_user
--

ALTER TABLE ONLY public.page_views
    ADD CONSTRAINT page_views_pkey PRIMARY KEY (id);


--
-- Name: poi_audios poi_audios_pkey; Type: CONSTRAINT; Schema: public; Owner: foodstreet_user
--

ALTER TABLE ONLY public.poi_audios
    ADD CONSTRAINT poi_audios_pkey PRIMARY KEY (id);


--
-- Name: poi_images poi_images_pkey; Type: CONSTRAINT; Schema: public; Owner: foodstreet_user
--

ALTER TABLE ONLY public.poi_images
    ADD CONSTRAINT poi_images_pkey PRIMARY KEY (id);


--
-- Name: poi_translations poi_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: foodstreet_user
--

ALTER TABLE ONLY public.poi_translations
    ADD CONSTRAINT poi_translations_pkey PRIMARY KEY (id);


--
-- Name: poi_views poi_views_pkey; Type: CONSTRAINT; Schema: public; Owner: foodstreet_user
--

ALTER TABLE ONLY public.poi_views
    ADD CONSTRAINT poi_views_pkey PRIMARY KEY (id);


--
-- Name: pois pois_pkey; Type: CONSTRAINT; Schema: public; Owner: foodstreet_user
--

ALTER TABLE ONLY public.pois
    ADD CONSTRAINT pois_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: foodstreet_user
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: search_history search_history_pkey; Type: CONSTRAINT; Schema: public; Owner: foodstreet_user
--

ALTER TABLE ONLY public.search_history
    ADD CONSTRAINT search_history_pkey PRIMARY KEY (id);


--
-- Name: tour_pois tour_pois_pkey; Type: CONSTRAINT; Schema: public; Owner: foodstreet_user
--

ALTER TABLE ONLY public.tour_pois
    ADD CONSTRAINT tour_pois_pkey PRIMARY KEY (id);


--
-- Name: tours tours_pkey; Type: CONSTRAINT; Schema: public; Owner: foodstreet_user
--

ALTER TABLE ONLY public.tours
    ADD CONSTRAINT tours_pkey PRIMARY KEY (id);


--
-- Name: user_activity user_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: foodstreet_user
--

ALTER TABLE ONLY public.user_activity
    ADD CONSTRAINT user_activity_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: foodstreet_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: favorite_pois_user_id_poi_id_key; Type: INDEX; Schema: public; Owner: foodstreet_user
--

CREATE UNIQUE INDEX favorite_pois_user_id_poi_id_key ON public.favorite_pois USING btree (user_id, poi_id);


--
-- Name: page_views_created_at_idx; Type: INDEX; Schema: public; Owner: foodstreet_user
--

CREATE INDEX page_views_created_at_idx ON public.page_views USING btree (created_at);


--
-- Name: poi_views_created_at_idx; Type: INDEX; Schema: public; Owner: foodstreet_user
--

CREATE INDEX poi_views_created_at_idx ON public.poi_views USING btree (created_at);


--
-- Name: poi_views_poi_id_idx; Type: INDEX; Schema: public; Owner: foodstreet_user
--

CREATE INDEX poi_views_poi_id_idx ON public.poi_views USING btree (poi_id);


--
-- Name: pois_status_idx; Type: INDEX; Schema: public; Owner: foodstreet_user
--

CREATE INDEX pois_status_idx ON public.pois USING btree (status);


--
-- Name: pois_status_is_active_idx; Type: INDEX; Schema: public; Owner: foodstreet_user
--

CREATE INDEX pois_status_is_active_idx ON public.pois USING btree (status, is_active);


--
-- Name: reviews_poi_id_idx; Type: INDEX; Schema: public; Owner: foodstreet_user
--

CREATE INDEX reviews_poi_id_idx ON public.reviews USING btree (poi_id);


--
-- Name: search_history_created_at_idx; Type: INDEX; Schema: public; Owner: foodstreet_user
--

CREATE INDEX search_history_created_at_idx ON public.search_history USING btree (created_at);


--
-- Name: search_history_keyword_idx; Type: INDEX; Schema: public; Owner: foodstreet_user
--

CREATE INDEX search_history_keyword_idx ON public.search_history USING btree (keyword);


--
-- Name: tour_pois_poi_id_idx; Type: INDEX; Schema: public; Owner: foodstreet_user
--

CREATE INDEX tour_pois_poi_id_idx ON public.tour_pois USING btree (poi_id);


--
-- Name: tour_pois_tour_id_idx; Type: INDEX; Schema: public; Owner: foodstreet_user
--

CREATE INDEX tour_pois_tour_id_idx ON public.tour_pois USING btree (tour_id);


--
-- Name: tour_pois_tour_id_poi_id_key; Type: INDEX; Schema: public; Owner: foodstreet_user
--

CREATE UNIQUE INDEX tour_pois_tour_id_poi_id_key ON public.tour_pois USING btree (tour_id, poi_id);


--
-- Name: tours_is_active_idx; Type: INDEX; Schema: public; Owner: foodstreet_user
--

CREATE INDEX tours_is_active_idx ON public.tours USING btree (is_active);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: foodstreet_user
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: favorite_pois favorite_pois_poi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: foodstreet_user
--

ALTER TABLE ONLY public.favorite_pois
    ADD CONSTRAINT favorite_pois_poi_id_fkey FOREIGN KEY (poi_id) REFERENCES public.pois(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: favorite_pois favorite_pois_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: foodstreet_user
--

ALTER TABLE ONLY public.favorite_pois
    ADD CONSTRAINT favorite_pois_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: menu_items menu_items_poi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: foodstreet_user
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_poi_id_fkey FOREIGN KEY (poi_id) REFERENCES public.pois(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: page_views page_views_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: foodstreet_user
--

ALTER TABLE ONLY public.page_views
    ADD CONSTRAINT page_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: poi_audios poi_audios_translation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: foodstreet_user
--

ALTER TABLE ONLY public.poi_audios
    ADD CONSTRAINT poi_audios_translation_id_fkey FOREIGN KEY (translation_id) REFERENCES public.poi_translations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: poi_images poi_images_poi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: foodstreet_user
--

ALTER TABLE ONLY public.poi_images
    ADD CONSTRAINT poi_images_poi_id_fkey FOREIGN KEY (poi_id) REFERENCES public.pois(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: poi_translations poi_translations_poi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: foodstreet_user
--

ALTER TABLE ONLY public.poi_translations
    ADD CONSTRAINT poi_translations_poi_id_fkey FOREIGN KEY (poi_id) REFERENCES public.pois(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: poi_views poi_views_poi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: foodstreet_user
--

ALTER TABLE ONLY public.poi_views
    ADD CONSTRAINT poi_views_poi_id_fkey FOREIGN KEY (poi_id) REFERENCES public.pois(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: poi_views poi_views_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: foodstreet_user
--

ALTER TABLE ONLY public.poi_views
    ADD CONSTRAINT poi_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pois pois_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: foodstreet_user
--

ALTER TABLE ONLY public.pois
    ADD CONSTRAINT pois_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reviews reviews_poi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: foodstreet_user
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_poi_id_fkey FOREIGN KEY (poi_id) REFERENCES public.pois(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: foodstreet_user
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: search_history search_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: foodstreet_user
--

ALTER TABLE ONLY public.search_history
    ADD CONSTRAINT search_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tour_pois tour_pois_poi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: foodstreet_user
--

ALTER TABLE ONLY public.tour_pois
    ADD CONSTRAINT tour_pois_poi_id_fkey FOREIGN KEY (poi_id) REFERENCES public.pois(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tour_pois tour_pois_tour_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: foodstreet_user
--

ALTER TABLE ONLY public.tour_pois
    ADD CONSTRAINT tour_pois_tour_id_fkey FOREIGN KEY (tour_id) REFERENCES public.tours(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_activity user_activity_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: foodstreet_user
--

ALTER TABLE ONLY public.user_activity
    ADD CONSTRAINT user_activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: foodstreet_user
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict 5zMbrYEzHUgXVcV6bm6AXyGOe68LjtgBMCZskP2HpViBoyJpjTvKhIn9ppRzn0R

