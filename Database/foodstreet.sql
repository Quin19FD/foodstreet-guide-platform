--
-- PostgreSQL database dump
--
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
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: POIStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."POIStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."POIStatus" OWNER TO postgres;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserRole" AS ENUM (
    'USER',
    'ADMIN',
    'VENDOR'
);


ALTER TYPE public."UserRole" OWNER TO postgres;

--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."UserStatus" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: favorite_pois; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.favorite_pois (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    poi_id uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.favorite_pois OWNER TO postgres;

--
-- Name: menu_items; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.menu_items OWNER TO postgres;

--
-- Name: page_views; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.page_views (
    id uuid NOT NULL,
    path text NOT NULL,
    user_id uuid,
    session_id character varying(255),
    metadata jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.page_views OWNER TO postgres;

--
-- Name: poi_audios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.poi_audios (
    id uuid NOT NULL,
    translation_id uuid NOT NULL,
    audio_url text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.poi_audios OWNER TO postgres;

--
-- Name: poi_images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.poi_images (
    id uuid NOT NULL,
    poi_id uuid NOT NULL,
    image_url text NOT NULL,
    description text
);


ALTER TABLE public.poi_images OWNER TO postgres;

--
-- Name: poi_translations; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.poi_translations OWNER TO postgres;

--
-- Name: poi_views; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.poi_views (
    id uuid NOT NULL,
    poi_id uuid NOT NULL,
    user_id uuid,
    duration integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.poi_views OWNER TO postgres;

--
-- Name: pois; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.pois OWNER TO postgres;

--
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    poi_id uuid NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- Name: search_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.search_history (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    keyword character varying(255) NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.search_history OWNER TO postgres;

--
-- Name: tour_pois; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tour_pois (
    id uuid NOT NULL,
    tour_id uuid NOT NULL,
    poi_id uuid NOT NULL,
    stop_order integer NOT NULL
);


ALTER TABLE public.tour_pois OWNER TO postgres;

--
-- Name: tours; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.tours OWNER TO postgres;

--
-- Name: user_activity; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_activity (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    action character varying(50) NOT NULL,
    target_type character varying(50),
    target_id uuid,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_activity OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public._prisma_migrations (
    id,
    checksum,
    finished_at,
    migration_name,
    logs,
    rolled_back_at,
    started_at,
    applied_steps_count
)
VALUES
(
'9d805f04-95f5-4091-bf80-9dae95000b67',
'7160edeeb1130210ed43da367c91f0b64107a56fdd702a91a84bbbc7f430ce5c',
'2026-03-14 23:11:56.836025+07',
'20260314065425_init',
NULL,
NULL,
'2026-03-14 23:11:56.733242+07',
1
),
(
'163370a1-270f-496b-8dc0-f08ecce42ede',
'3cdc1c1ba902b61703bf53c851cea892833daa8c8cffabfd71e7524509831b17',
'2026-03-14 23:13:13.64211+07',
'20260314161313_update_schema',
NULL,
NULL,
'2026-03-14 23:13:13.57165+07',
1
),
(
'f8b92f5c-68f2-41b0-b6ff-2daaa769fc16',
'6296bde435c13152d3ca8ea0c90c0759455204cecd9b2b4899c8d91ed0554d34',
'2026-03-14 23:43:26.691524+07',
'20260314164326_add_tour',
NULL,
NULL,
'2026-03-14 23:43:26.671404+07',
1
),
(
'caa339b8-2b87-4310-82c9-dcca6bdb36fd',
'8dc4fc0aa2205b20badd785c71f32fd30e8f4f40d5ff8d0bb824bc160b7186bf',
'2026-03-25 21:19:04.050027+07',
'20260324090000_add_poi_is_active',
NULL,
NULL,
'2026-03-25 21:19:04.050027+07',
0
),
(
'7a13b304-6ffa-4524-beda-33f69a7928dd',
'112b89b970ff2d6f0dcb4d14854b4020c33044f918a7f897562db09fdef403ec',
'2026-03-25 21:19:17.918085+07',
'20260325110000_add_tour_is_active',
NULL,
NULL,
'2026-03-25 21:19:17.90447+07',
1
);


--
-- Data for Name: favorite_pois; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.favorite_pois (id, user_id, poi_id, created_at) FROM stdin;



--
-- Data for Name: menu_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.menu_items (
    id,
    poi_id,
    name,
    description,
    price,
    image_url,
    is_available,
    created_at,
    updated_at
)
VALUES
(
'7bc39a13-d2bc-4c11-9ba6-15d9d4ad40f1',
'6267466c-c926-484e-b425-a78089218f1c',
'Há Cảo Đoàn Viên',
'Thanh tao , nhẹ nhàng',
1500000,
'https://res.cloudinary.com/dxy2gp1lg/image/upload/v1774368322/foodstreet/vendor/images/w8zdquozcynhyujgowkt.jpg',
TRUE,
'2026-03-24 16:05:25.226',
'2026-03-24 16:05:25.226'
),
(
'ff5fae51-5247-4514-a551-140f9450f938',
'6267466c-c926-484e-b425-a78089218f1c',
'Há Cảo Chiên',
'Đậm đà . Chuẩn vị Bắc Kinh',
2000000,
'https://res.cloudinary.com/dxy2gp1lg/image/upload/v1774368323/foodstreet/vendor/images/xgu4zan6gb9khd8xk78d.jpg',
TRUE,
'2026-03-24 16:05:25.226',
'2026-03-24 16:05:25.226'
),
(
'adf227e4-99d5-4019-915c-ec12832465a0',
'6267466c-c926-484e-b425-a78089218f1c',
'Mì Trương Hà Tây',
'Nhẹ nhàng',
1500000,
'https://res.cloudinary.com/dxy2gp1lg/image/upload/v1774368321/foodstreet/vendor/images/opdsgckzkc7bf51o4ulj.jpg',
TRUE,
'2026-03-24 16:05:25.226',
'2026-03-24 16:05:25.226'
),
(
'1c14092e-5b00-4056-b932-0918f2120ebe',
'6267466c-c926-484e-b425-a78089218f1c',
'Heo Quay Hoàng Gia',
'Đậm đà',
1300000,
'https://res.cloudinary.com/dxy2gp1lg/image/upload/v1774368325/foodstreet/vendor/images/hmvbtegzry4rzlw4xbm6.jpg',
TRUE,
'2026-03-24 16:05:25.226',
'2026-03-24 16:05:25.226'
),
(
'6bd35678-ca70-4ea4-8ee6-63510f87b0bf',
'6267466c-c926-484e-b425-a78089218f1c',
'Chả Cuốn',
'Giòn rụm , vàng óng',
1200000,
'https://res.cloudinary.com/dxy2gp1lg/image/upload/v1774368323/foodstreet/vendor/images/jwvdktidtg7jvt119au9.jpg',
TRUE,
'2026-03-24 16:05:25.226',
'2026-03-24 16:05:25.226'
),
(
'eaef692c-58e4-4247-8b7a-b31a603e3d8d',
'6267466c-c926-484e-b425-a78089218f1c',
'Hồng Bao',
'Bánh bao màu hồng',
2400000,
'https://res.cloudinary.com/dxy2gp1lg/image/upload/v1774368323/foodstreet/vendor/images/rswcc5rlrjf2rheyx0xm.jpg',
TRUE,
'2026-03-24 16:05:25.226',
'2026-03-24 16:05:25.226'
),
(
'da26be90-a5d3-42b3-b4ff-95b1078bca3d',
'6267466c-c926-484e-b425-a78089218f1c',
'Hải Sản',
'Đậm đà',
2300000,
'https://res.cloudinary.com/dxy2gp1lg/image/upload/v1774368322/foodstreet/vendor/images/kzlit5skd8vpl8ogmweq.jpg',
TRUE,
'2026-03-24 16:05:25.226',
'2026-03-24 16:05:25.226'
),
(
'ba3d200b-e25c-45d9-953a-db1914b5a9a7',
'703466bf-e4f8-4698-a6c9-b3ec14d21093',
'Món 1',
'MÔ TẢ',
1500000,
'https://res.cloudinary.com/dxy2gp1lg/image/upload/v1774448981/foodstreet/vendor/images/mx7hzxxtl7rhjnnvednz.jpg',
TRUE,
'2026-03-25 14:29:41.759',
'2026-03-25 14:29:41.759'
);


--
-- Data for Name: page_views; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.page_views (id, path, user_id, session_id, metadata, created_at) FROM stdin;



--
-- Data for Name: poi_audios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.poi_audios (id, translation_id, audio_url, is_active, created_at) FROM stdin;



--
-- Data for Name: poi_images; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.menu_items
(id, poi_id, name, description, price, image_url, is_available, created_at, updated_at)
VALUES
('7bc39a13-d2bc-4c11-9ba6-15d9d4ad40f1','6267466c-c926-484e-b425-a78089218f1c','Há Cảo Đoàn Viên','Thanh tao , nhẹ nhàng',1500000,'https://res.cloudinary.com/dxy2gp1lg/image/upload/v1774368322/foodstreet/vendor/images/w8zdquozcynhyujgowkt.jpg',true,'2026-03-24 16:05:25.226','2026-03-24 16:05:25.226'),
('ff5fae51-5247-4514-a551-140f9450f938','6267466c-c926-484e-b425-a78089218f1c','Há Cảo Chiên','Đậm đà . Chuẩn vị Bắc Kinh',2000000,'https://res.cloudinary.com/dxy2gp1lg/image/upload/v1774368323/foodstreet/vendor/images/xgu4zan6gb9khd8xk78d.jpg',true,'2026-03-24 16:05:25.226','2026-03-24 16:05:25.226'),
('adf227e4-99d5-4019-915c-ec12832465a0','6267466c-c926-484e-b425-a78089218f1c','Mì Trương Hà Tây','Nhẹ nhàng',1500000,'https://res.cloudinary.com/dxy2gp1lg/image/upload/v1774368321/foodstreet/vendor/images/opdsgckzkc7bf51o4ulj.jpg',true,'2026-03-24 16:05:25.226','2026-03-24 16:05:25.226'),
('1c14092e-5b00-4056-b932-0918f2120ebe','6267466c-c926-484e-b425-a78089218f1c','Heo Quay Hoàng Gia','Đậm đà',1300000,'https://res.cloudinary.com/dxy2gp1lg/image/upload/v1774368325/foodstreet/vendor/images/hmvbtegzry4rzlw4xbm6.jpg',true,'2026-03-24 16:05:25.226','2026-03-24 16:05:25.226'),
('6bd35678-ca70-4ea4-8ee6-63510f87b0bf','6267466c-c926-484e-b425-a78089218f1c','Chả Cuốn','Giòn rụm , vàng óng',1200000,'https://res.cloudinary.com/dxy2gp1lg/image/upload/v1774368323/foodstreet/vendor/images/jwvdktidtg7jvt119au9.jpg',true,'2026-03-24 16:05:25.226','2026-03-24 16:05:25.226'),
('eaef692c-58e4-4247-8b7a-b31a603e3d8d','6267466c-c926-484e-b425-a78089218f1c','Hồng Bao','Bánh bao màu hồng',2400000,'https://res.cloudinary.com/dxy2gp1lg/image/upload/v1774368323/foodstreet/vendor/images/rswcc5rlrjf2rheyx0xm.jpg',true,'2026-03-24 16:05:25.226','2026-03-24 16:05:25.226'),
('da26be90-a5d3-42b3-b4ff-95b1078bca3d','6267466c-c926-484e-b425-a78089218f1c','Hải Sản','Đậm đà',2300000,'https://res.cloudinary.com/dxy2gp1lg/image/upload/v1774368322/foodstreet/vendor/images/kzlit5skd8vpl8ogmweq.jpg',true,'2026-03-24 16:05:25.226','2026-03-24 16:05:25.226'),
('ba3d200b-e25c-45d9-953a-db1914b5a9a7','703466bf-e4f8-4698-a6c9-b3ec14d21093','Món 1','MÔ TẢ',1500000,'https://res.cloudinary.com/dxy2gp1lg/image/upload/v1774448981/foodstreet/vendor/images/mx7hzxxtl7rhjnnvednz.jpg',true,'2026-03-25 14:29:41.759','2026-03-25 14:29:41.759');


--
-- Data for Name: poi_translations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.poi_translations
(id, poi_id, language, name, description, audio_script, updated_at)
VALUES
(
'1b03dbcb-9b0a-48f9-8a7e-f37fdc5619c9',
'6267466c-c926-484e-b425-a78089218f1c',
'vi',
'Nhà Hàng Hồng Bao Bảo',
'Nhà hàng là điểm dừng chân lý tưởng dành cho thực khách yêu thích ẩm thực ngon và không gian thoải mái. Với phong cách phục vụ thân thiện và chuyên nghiệp, nhà hàng luôn chú trọng mang đến trải nghiệm dễ chịu cho mọi đối tượng khách hàng. Không gian được thiết kế gọn gàng, sạch sẽ, tạo cảm giác ấm cúng nhưng vẫn đủ thoải mái cho các buổi gặp gỡ gia đình, bạn bè hoặc đồng nghiệp. Thực đơn của nhà hàng khá đa dạng, bao gồm nhiều món ăn được chế biến từ nguyên liệu tươi ngon, lựa chọn kỹ lưỡng mỗi ngày. Các món ăn được nêm nếm vừa vị, phù hợp với khẩu vị của nhiều thực khách khác nhau, từ những người yêu thích hương vị truyền thống cho đến những ai muốn trải nghiệm sự mới mẻ trong cách chế biến. Bên cạnh chất lượng món ăn, nhà hàng cũng chú trọng đến cách trình bày, mang lại cảm giác ngon miệng ngay từ cái nhìn đầu tiên. Đội ngũ nhân viên tại nhà hàng luôn sẵn sàng hỗ trợ và phục vụ khách hàng một cách tận tâm. Từ khâu đón tiếp đến lúc dùng bữa, mọi trải nghiệm đều được chăm chút cẩn thận nhằm mang lại sự hài lòng tối đa. Nhà hàng không chỉ là nơi thưởng thức ẩm thực mà còn là không gian để thư giãn, trò chuyện và tận hưởng những khoảnh khắc dễ chịu trong cuộc sống hàng ngày.',
NULL,
'2026-03-24 16:05:25.231'
),
(
'11d6e92a-e254-4c77-be0b-722e7edcd79d',
'703466bf-e4f8-4698-a6c9-b3ec14d21093',
'vi',
'Nhà hàng Hồng Thiên Bảo CS2',
'Nhà hàng là điểm dừng chân lý tưởng dành cho thực khách yêu thích ẩm thực ngon và không gian thoải mái. Với phong cách phục vụ thân thiện và chuyên nghiệp, nhà hàng luôn chú trọng mang đến trải nghiệm dễ chịu cho mọi đối tượng khách hàng. Không gian được thiết kế gọn gàng, sạch sẽ, tạo cảm giác ấm cúng nhưng vẫn đủ thoải mái cho các buổi gặp gỡ gia đình, bạn bè hoặc đồng nghiệp. Thực đơn của nhà hàng khá đa dạng, bao gồm nhiều món ăn được chế biến từ nguyên liệu tươi ngon, lựa chọn kỹ lưỡng mỗi ngày. Các món ăn được nêm nếm vừa vị, phù hợp với khẩu vị của nhiều thực khách khác nhau, từ những người yêu thích hương vị truyền thống cho đến những ai muốn trải nghiệm sự mới mẻ trong cách chế biến. Bên cạnh chất lượng món ăn, nhà hàng cũng chú trọng đến cách trình bày, mang lại cảm giác ngon miệng ngay từ cái nhìn đầu tiên.',
NULL,
'2026-03-25 14:29:41.763'
);


--
-- Data for Name: poi_views; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.poi_views (id, poi_id, user_id, duration, created_at) FROM stdin;



--
-- Data for Name: pois; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.pois
(id, name, slug, category, latitude, longitude, price_min, price_max, rating, created_at, updated_at, approved_at, approved_by, owner_id, rejection_reason, status, "submitCount", is_active)
VALUES
(
'6267466c-c926-484e-b425-a78089218f1c',
'Nhà Hàng Hồng Bao Bảo',
NULL,
'Nhà hàng',
10.783285,
106.706392,
1500000,
2500000,
0,
'2026-03-24 16:05:25.207',
'2026-03-25 09:27:52.041',
'2026-03-25 08:28:33.723',
'774881f9-131a-470f-b759-11418f05fdc5',
'2b8867e7-ce0b-4946-9b37-435a3bffb688',
NULL,
'APPROVED',
1,
true
),
(
'703466bf-e4f8-4698-a6c9-b3ec14d21093',
'Nhà hàng Hồng Thiên Bảo CS2',
NULL,
'Nhà Hàng',
10.831013,
106.567205,
1500000,
2400000,
0,
'2026-03-25 14:29:41.740',
'2026-03-25 14:30:08.073',
'2026-03-25 14:30:08.068',
'774881f9-131a-470f-b759-11418f05fdc5',
'2b8867e7-ce0b-4946-9b37-435a3bffb688',
NULL,
'APPROVED',
1,
true
);


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reviews (id, user_id, poi_id, rating, comment, created_at) FROM stdin;



--
-- Data for Name: search_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.search_history (id, user_id, keyword, created_at) FROM stdin;



--
-- Data for Name: tour_pois; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.tour_pois
(id, tour_id, poi_id, stop_order)
VALUES
(
'068c0585-2c99-4112-a566-3fd39c48fee0',
'597bd6d6-adfd-4d4e-8ecb-50a2ee0b17e7',
'6267466c-c926-484e-b425-a78089218f1c',
1
),
(
'6639f5b7-699e-4693-b8a7-2d204cd3ee99',
'597bd6d6-adfd-4d4e-8ecb-50a2ee0b17e7',
'703466bf-e4f8-4698-a6c9-b3ec14d21093',
2
);


--
-- Data for Name: tours; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.tours
(id, name, description, image_url, duration_minutes, created_at, updated_at, is_active)
VALUES
(
'597bd6d6-adfd-4d4e-8ecb-50a2ee0b17e7',
'TOUR DU LỊCH 1',
'Nhà hàng là điểm dừng chân lý tưởng dành cho thực khách yêu thích ẩm thực ngon và không gian thoải mái. Với phong cách phục vụ thân thiện và chuyên nghiệp, nhà hàng luôn chú trọng mang đến trải nghiệm dễ chịu cho mọi đối tượng khách hàng. Không gian được thiết kế gọn gàng, sạch sẽ, tạo cảm giác ấm cúng nhưng vẫn đủ thoải mái cho các buổi gặp gỡ gia đình, bạn bè hoặc đồng nghiệp.',
'https://res.cloudinary.com/dxy2gp1lg/image/upload/v1774450043/foodstreet/tours/ispz1vec24v2t6vtq5jb.jpg',
150,
'2026-03-25 14:47:23.171',
'2026-03-25 14:48:32.927',
true
);


--
-- Data for Name: user_activity; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.user_activity
(id, user_id, action, target_type, target_id, created_at)
VALUES
('008b0b2f-b093-48b7-a6b4-308b2721d279','774881f9-131a-470f-b759-11418f05fdc5','ADMIN_LOGOUT','USER','774881f9-131a-470f-b759-11418f05fdc5','2026-03-16 10:01:08.211'),
('4efe1911-b639-42bd-8622-3da9930fd456','774881f9-131a-470f-b759-11418f05fdc5','ADMIN_LOGOUT','USER','774881f9-131a-470f-b759-11418f05fdc5','2026-03-16 10:06:08.835'),
('628ef5f4-fde1-46b4-afcf-5b87abb4bc25','774881f9-131a-470f-b759-11418f05fdc5','ADMIN_PASSWORD_OTP_SENT','USER','774881f9-131a-470f-b759-11418f05fdc5','2026-03-16 10:20:05.319'),
('694267f4-88b7-483c-b340-09f4a9dae8f2','774881f9-131a-470f-b759-11418f05fdc5','ADMIN_PASSWORD_OTP_SENT','USER','774881f9-131a-470f-b759-11418f05fdc5','2026-03-16 10:21:29.967'),
('fbfa62c0-9435-42e8-b4b9-3bdcb7c870f5','774881f9-131a-470f-b759-11418f05fdc5','ADMIN_PASSWORD_OTP_SENT','USER','774881f9-131a-470f-b759-11418f05fdc5','2026-03-16 13:55:40.789'),
('9810c84f-c02c-4ebd-834e-6afa6abf9c8b','774881f9-131a-470f-b759-11418f05fdc5','ADMIN_PASSWORD_OTP_SENT','USER','774881f9-131a-470f-b759-11418f05fdc5','2026-03-16 13:58:40.787'),
('51c42399-4e56-4583-819a-a9a113275905','774881f9-131a-470f-b759-11418f05fdc5','ADMIN_PASSWORD_OTP_SENT','USER','774881f9-131a-470f-b759-11418f05fdc5','2026-03-16 13:59:38.931'),
('ceb53abc-3084-45cf-a8c8-72ced0e04547','774881f9-131a-470f-b759-11418f05fdc5','ADMIN_PASSWORD_OTP_SENT','USER','774881f9-131a-470f-b759-11418f05fdc5','2026-03-16 14:07:02.862'),
('b2754ad5-bc72-48b8-9484-c6ee3bf42542','774881f9-131a-470f-b759-11418f05fdc5','ADMIN_PASSWORD_OTP_SENT','USER','774881f9-131a-470f-b759-11418f05fdc5','2026-03-16 14:10:34.355'),
('25ae9d0a-5b22-41b7-9602-73f4a69ec57b','774881f9-131a-470f-b759-11418f05fdc5','ADMIN_PASSWORD_OTP_SENT','USER','774881f9-131a-470f-b759-11418f05fdc5','2026-03-16 14:19:20.858'),
('9f04e4af-35fa-4192-ae5a-7c96eee0406c','774881f9-131a-470f-b759-11418f05fdc5','ADMIN_PASSWORD_OTP_SENT','USER','774881f9-131a-470f-b759-11418f05fdc5','2026-03-16 14:25:04.853'),
('38f80651-11cc-44ed-ab17-1d5828ee7304','774881f9-131a-470f-b759-11418f05fdc5','ADMIN_PASSWORD_OTP_SENT','USER','774881f9-131a-470f-b759-11418f05fdc5','2026-03-16 14:30:07.983'),
('780b966b-ce50-4410-841b-d329e1c530dd','774881f9-131a-470f-b759-11418f05fdc5','ADMIN_PASSWORD_OTP_SENT','USER','774881f9-131a-470f-b759-11418f05fdc5','2026-03-16 14:53:18.292'),
('5d36590b-ce3d-4c32-b2a8-9a39fed4d554','774881f9-131a-470f-b759-11418f05fdc5','ADMIN_PASSWORD_OTP_SENT','USER','774881f9-131a-470f-b759-11418f05fdc5','2026-03-16 15:05:37.361'),
('ee8d5f5a-5d78-4ef6-8c5c-7b6815f65e68','774881f9-131a-470f-b759-11418f05fdc5','ADMIN_PASSWORD_RESET','USER','774881f9-131a-470f-b759-11418f05fdc5','2026-03-16 15:06:18.394'),
('2472dd6f-902d-44a9-9d0c-e42c5f34d218','774881f9-131a-470f-b759-11418f05fdc5','ADMIN_LOGOUT','USER','774881f9-131a-470f-b759-11418f05fdc5','2026-03-19 15:45:43.29'),
('33094ca7-15e9-4a7f-afc5-9d1bc2656d76','774881f9-131a-470f-b759-11418f05fdc5','ADMIN_PASSWORD_OTP_SENT','USER','774881f9-131a-470f-b759-11418f05fdc5','2026-03-19 15:51:25.144'),
('79e0ce25-37ec-418c-bf09-6e023653cc3e','774881f9-131a-470f-b759-11418f05fdc5','ADMIN_PASSWORD_RESET','USER','774881f9-131a-470f-b759-11418f05fdc5','2026-03-19 15:51:56.439'),
('68175bf8-1614-408c-a21f-2452c10924a7','774881f9-131a-470f-b759-11418f05fdc5','ADMIN_VENDOR_APPROVED','USER','6cd6baf2-ecb3-4697-9a95-3406a64f11d4','2026-03-19 15:52:21.487'),
('2cc9dd6b-09ed-4f90-ac4f-50da9e44466b','774881f9-131a-470f-b759-11418f05fdc5','ADMIN_LOGOUT','USER','774881f9-131a-470f-b759-11418f05fdc5','2026-03-19 15:52:43.152'),
('4035383e-877d-4255-b9db-2d9fbc1a12c3','774881f9-131a-470f-b759-11418f05fdc5','ADMIN_VENDOR_APPROVED','USER','2b8867e7-ce0b-4946-9b37-435a3bffb688','2026-03-24 12:52:17.976'),
('2bf34b46-3da2-47fd-8569-11bd44366766','2b8867e7-ce0b-4946-9b37-435a3bffb688','VENDOR_POI_CREATED_AND_SUBMITTED','POI','6267466c-c926-484e-b425-a78089218f1c','2026-03-24 16:05:25.249'),
('49003117-5917-4d9e-b3d4-fa83826fdce1','774881f9-131a-470f-b759-11418f05fdc5','ADMIN_POI_APPROVED','POI','6267466c-c926-484e-b425-a78089218f1c','2026-03-25 08:28:33.74'),
('b8ac20a1-def9-4f8f-8784-a4c0a0916ef7','774881f9-131a-470f-b759-11418f05fdc5','ADMIN_LOGOUT','USER','774881f9-131a-470f-b759-11418f05fdc5','2026-03-25 08:28:49.505'),
('4de2c4be-04d0-4329-aef7-5e8d438d300b','774881f9-131a-470f-b759-11418f05fdc5','ADMIN_PASSWORD_OTP_SENT','USER','774881f9-131a-470f-b759-11418f05fdc5','2026-03-25 08:35:57.809'),
('bb51cc09-f867-4462-9089-0fb58e449a28','774881f9-131a-470f-b759-11418f05fdc5','ADMIN_PASSWORD_RESET','USER','774881f9-131a-470f-b759-11418f05fdc5','2026-03-25 08:37:14.406'),
('694dd51b-88eb-4683-bcc3-a7b3647e6b23','774881f9-131a-470f-b759-11418f05fdc5','ADMIN_LOGIN','USER','774881f9-131a-470f-b759-11418f05fdc5','2026-03-25 08:37:22.313'),
('c18070a0-5445-4d37-b53d-3ac4413427a6','774881f9-131a-470f-b759-11418f05fdc5','ADMIN_VENDOR_DISABLED_WITH_POIS','USER','2b8867e7-ce0b-4946-9b37-435a3bffb688','2026-03-25 09:27:33.58'),
('75ed80ab-ebef-4392-baae-4f45fbab4874','774881f9-131a-470f-b759-11418f05fdc5','ADMIN_VENDOR_ENABLED_WITH_POIS','USER','2b8867e7-ce0b-4946-9b37-435a3bffb688','2026-03-25 09:27:52.045'),
('d8c2efed-f781-4835-865d-13c5c6c38733','2b8867e7-ce0b-4946-9b37-435a3bffb688','VENDOR_POI_CREATED_AND_SUBMITTED','POI','703466bf-e4f8-4698-a6c9-b3ec14d21093','2026-03-25 14:29:41.777'),
('5e807616-164b-494a-b39f-7c0caf132bd7','774881f9-131a-470f-b759-11418f05fdc5','ADMIN_POI_APPROVED','POI','703466bf-e4f8-4698-a6c9-b3ec14d21093','2026-03-25 14:30:08.1'),
('4a5fd1ef-e71d-44b5-891e-0e1e0a3958c4','774881f9-131a-470f-b759-11418f05fdc5','ADMIN_TOUR_CREATED','TOUR','597bd6d6-adfd-4d4e-8ecb-50a2ee0b17e7','2026-03-25 14:47:23.193'),
('b0183a15-5088-4646-90ee-bd108217abd8','774881f9-131a-470f-b759-11418f05fdc5','ADMIN_TOUR_HIDDEN','TOUR','597bd6d6-adfd-4d4e-8ecb-50a2ee0b17e7','2026-03-25 14:48:31.303'),
('fb287636-34a5-4b1d-9a6f-e01d4068b2ab','774881f9-131a-470f-b759-11418f05fdc5','ADMIN_TOUR_UPDATED','TOUR','597bd6d6-adfd-4d4e-8ecb-50a2ee0b17e7','2026-03-25 14:48:32.933'),
('2ebe1b4b-0a36-42d8-91c4-99d3d2173078','774881f9-131a-470f-b759-11418f05fdc5','ADMIN_LOGOUT','USER','774881f9-131a-470f-b759-11418f05fdc5','2026-03-26 06:28:32.205');



--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: favorite_pois favorite_pois_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorite_pois
    ADD CONSTRAINT favorite_pois_pkey PRIMARY KEY (id);


--
-- Name: menu_items menu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_pkey PRIMARY KEY (id);


--
-- Name: page_views page_views_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.page_views
    ADD CONSTRAINT page_views_pkey PRIMARY KEY (id);


--
-- Name: poi_audios poi_audios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.poi_audios
    ADD CONSTRAINT poi_audios_pkey PRIMARY KEY (id);


--
-- Name: poi_images poi_images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.poi_images
    ADD CONSTRAINT poi_images_pkey PRIMARY KEY (id);


--
-- Name: poi_translations poi_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.poi_translations
    ADD CONSTRAINT poi_translations_pkey PRIMARY KEY (id);


--
-- Name: poi_views poi_views_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.poi_views
    ADD CONSTRAINT poi_views_pkey PRIMARY KEY (id);


--
-- Name: pois pois_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pois
    ADD CONSTRAINT pois_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: search_history search_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.search_history
    ADD CONSTRAINT search_history_pkey PRIMARY KEY (id);


--
-- Name: tour_pois tour_pois_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tour_pois
    ADD CONSTRAINT tour_pois_pkey PRIMARY KEY (id);


--
-- Name: tours tours_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tours
    ADD CONSTRAINT tours_pkey PRIMARY KEY (id);


--
-- Name: user_activity user_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_activity
    ADD CONSTRAINT user_activity_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: favorite_pois_user_id_poi_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX favorite_pois_user_id_poi_id_key ON public.favorite_pois USING btree (user_id, poi_id);


--
-- Name: page_views_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX page_views_created_at_idx ON public.page_views USING btree (created_at);


--
-- Name: poi_views_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX poi_views_created_at_idx ON public.poi_views USING btree (created_at);


--
-- Name: poi_views_poi_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX poi_views_poi_id_idx ON public.poi_views USING btree (poi_id);


--
-- Name: pois_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pois_status_idx ON public.pois USING btree (status);


--
-- Name: pois_status_is_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pois_status_is_active_idx ON public.pois USING btree (status, is_active);


--
-- Name: reviews_poi_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX reviews_poi_id_idx ON public.reviews USING btree (poi_id);


--
-- Name: search_history_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX search_history_created_at_idx ON public.search_history USING btree (created_at);


--
-- Name: search_history_keyword_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX search_history_keyword_idx ON public.search_history USING btree (keyword);


--
-- Name: tour_pois_poi_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tour_pois_poi_id_idx ON public.tour_pois USING btree (poi_id);


--
-- Name: tour_pois_tour_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tour_pois_tour_id_idx ON public.tour_pois USING btree (tour_id);


--
-- Name: tour_pois_tour_id_poi_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX tour_pois_tour_id_poi_id_key ON public.tour_pois USING btree (tour_id, poi_id);


--
-- Name: tours_is_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tours_is_active_idx ON public.tours USING btree (is_active);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: favorite_pois favorite_pois_poi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorite_pois
    ADD CONSTRAINT favorite_pois_poi_id_fkey FOREIGN KEY (poi_id) REFERENCES public.pois(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: favorite_pois favorite_pois_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorite_pois
    ADD CONSTRAINT favorite_pois_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: menu_items menu_items_poi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_poi_id_fkey FOREIGN KEY (poi_id) REFERENCES public.pois(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: page_views page_views_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.page_views
    ADD CONSTRAINT page_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: poi_audios poi_audios_translation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.poi_audios
    ADD CONSTRAINT poi_audios_translation_id_fkey FOREIGN KEY (translation_id) REFERENCES public.poi_translations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: poi_images poi_images_poi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.poi_images
    ADD CONSTRAINT poi_images_poi_id_fkey FOREIGN KEY (poi_id) REFERENCES public.pois(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: poi_translations poi_translations_poi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.poi_translations
    ADD CONSTRAINT poi_translations_poi_id_fkey FOREIGN KEY (poi_id) REFERENCES public.pois(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: poi_views poi_views_poi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.poi_views
    ADD CONSTRAINT poi_views_poi_id_fkey FOREIGN KEY (poi_id) REFERENCES public.pois(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: poi_views poi_views_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.poi_views
    ADD CONSTRAINT poi_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pois pois_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pois
    ADD CONSTRAINT pois_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reviews reviews_poi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_poi_id_fkey FOREIGN KEY (poi_id) REFERENCES public.pois(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: search_history search_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.search_history
    ADD CONSTRAINT search_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tour_pois tour_pois_poi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tour_pois
    ADD CONSTRAINT tour_pois_poi_id_fkey FOREIGN KEY (poi_id) REFERENCES public.pois(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tour_pois tour_pois_tour_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tour_pois
    ADD CONSTRAINT tour_pois_tour_id_fkey FOREIGN KEY (tour_id) REFERENCES public.tours(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_activity user_activity_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_activity
    ADD CONSTRAINT user_activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--


