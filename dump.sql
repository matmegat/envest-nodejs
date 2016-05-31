--
-- PostgreSQL database dump
--

-- Dumped from database version 9.4.1
-- Dumped by pg_dump version 9.5.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: abuse_comments; Type: TABLE; Schema: public; Owner: netvest
--

CREATE TABLE abuse_comments (
    user_id integer NOT NULL,
    comment_id integer NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now()
);


ALTER TABLE abuse_comments OWNER TO netvest;

--
-- Name: admins; Type: TABLE; Schema: public; Owner: netvest
--

CREATE TABLE admins (
    id integer NOT NULL,
    user_id integer NOT NULL,
    parent integer,
    can_intro boolean DEFAULT false
);


ALTER TABLE admins OWNER TO netvest;

--
-- Name: COLUMN admins.parent; Type: COMMENT; Schema: public; Owner: netvest
--

COMMENT ON COLUMN admins.parent IS 'another admin who introduced this admin';


--
-- Name: COLUMN admins.can_intro; Type: COMMENT; Schema: public; Owner: netvest
--

COMMENT ON COLUMN admins.can_intro IS 'can this admin introduce another';


--
-- Name: admins_id_seq; Type: SEQUENCE; Schema: public; Owner: netvest
--

CREATE SEQUENCE admins_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE admins_id_seq OWNER TO netvest;

--
-- Name: admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: netvest
--

ALTER SEQUENCE admins_id_seq OWNED BY admins.id;


--
-- Name: auth_facebook; Type: TABLE; Schema: public; Owner: netvest
--

CREATE TABLE auth_facebook (
    user_id integer NOT NULL,
    facebook_id bigint NOT NULL
);


ALTER TABLE auth_facebook OWNER TO netvest;

--
-- Name: auth_local; Type: TABLE; Schema: public; Owner: netvest
--

CREATE TABLE auth_local (
    user_id integer NOT NULL,
    password character varying(72) NOT NULL,
    salt character varying(32) NOT NULL
);


ALTER TABLE auth_local OWNER TO netvest;

--
-- Name: brokerage; Type: TABLE; Schema: public; Owner: netvest
--

CREATE TABLE brokerage (
    investor_id integer NOT NULL,
    cash_value numeric(12,2) NOT NULL,
    multiplier real NOT NULL
);


ALTER TABLE brokerage OWNER TO netvest;

--
-- Name: comments; Type: TABLE; Schema: public; Owner: netvest
--

CREATE TABLE comments (
    id integer NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now(),
    user_id integer NOT NULL,
    feed_id integer NOT NULL,
    text text NOT NULL
);


ALTER TABLE comments OWNER TO netvest;

--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: netvest
--

CREATE SEQUENCE comments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE comments_id_seq OWNER TO netvest;

--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: netvest
--

ALTER SEQUENCE comments_id_seq OWNED BY comments.id;


--
-- Name: email_confirms; Type: TABLE; Schema: public; Owner: netvest
--

CREATE TABLE email_confirms (
    user_id integer NOT NULL,
    new_email character varying(255) NOT NULL,
    code character varying(32) NOT NULL
);


ALTER TABLE email_confirms OWNER TO netvest;

--
-- Name: feed_items; Type: TABLE; Schema: public; Owner: netvest
--

CREATE TABLE feed_items (
    id integer NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now(),
    investor_id integer NOT NULL,
    event jsonb NOT NULL
);


ALTER TABLE feed_items OWNER TO netvest;

--
-- Name: feed_items_id_seq; Type: SEQUENCE; Schema: public; Owner: netvest
--

CREATE SEQUENCE feed_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE feed_items_id_seq OWNER TO netvest;

--
-- Name: feed_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: netvest
--

ALTER SEQUENCE feed_items_id_seq OWNED BY feed_items.id;


--
-- Name: investors; Type: TABLE; Schema: public; Owner: netvest
--

CREATE TABLE investors (
    first_name character varying(255) NOT NULL,
    user_id integer NOT NULL,
    last_name character varying(255),
    profession character varying(255) DEFAULT ''::character varying,
    focus jsonb DEFAULT '[]'::jsonb,
    background text DEFAULT ''::text,
    historical_returns jsonb DEFAULT '[{"year": 2011, "percentage": 10}, {"year": 2012, "percentage": 11}, {"year": 2013, "percentage": -8}, {"year": 2014, "percentage": 5}, {"year": 2015, "percentage": 15}]'::jsonb NOT NULL,
    is_public boolean DEFAULT false,
    profile_pic text DEFAULT '/api/static/pic/b4f18f5b05307bd1e3cc00e0802d641b'::text
);


ALTER TABLE investors OWNER TO netvest;

--
-- Name: knex_migrations; Type: TABLE; Schema: public; Owner: netvest
--

CREATE TABLE knex_migrations (
    id integer NOT NULL,
    name character varying(255),
    batch integer,
    migration_time timestamp with time zone
);


ALTER TABLE knex_migrations OWNER TO netvest;

--
-- Name: knex_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: netvest
--

CREATE SEQUENCE knex_migrations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE knex_migrations_id_seq OWNER TO netvest;

--
-- Name: knex_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: netvest
--

ALTER SEQUENCE knex_migrations_id_seq OWNED BY knex_migrations.id;


--
-- Name: knex_migrations_lock; Type: TABLE; Schema: public; Owner: netvest
--

CREATE TABLE knex_migrations_lock (
    is_locked integer
);


ALTER TABLE knex_migrations_lock OWNER TO netvest;

--
-- Name: portfolio_symbols; Type: TABLE; Schema: public; Owner: netvest
--

CREATE TABLE portfolio_symbols (
    id integer NOT NULL,
    amount integer NOT NULL,
    investor_id integer NOT NULL,
    symbol_id integer NOT NULL
);


ALTER TABLE portfolio_symbols OWNER TO netvest;

--
-- Name: COLUMN portfolio_symbols.amount; Type: COMMENT; Schema: public; Owner: netvest
--

COMMENT ON COLUMN portfolio_symbols.amount IS 'Number of Shares';


--
-- Name: portfolio_symbols_id_seq; Type: SEQUENCE; Schema: public; Owner: netvest
--

CREATE SEQUENCE portfolio_symbols_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE portfolio_symbols_id_seq OWNER TO netvest;

--
-- Name: portfolio_symbols_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: netvest
--

ALTER SEQUENCE portfolio_symbols_id_seq OWNED BY portfolio_symbols.id;


--
-- Name: symbols; Type: TABLE; Schema: public; Owner: netvest
--

CREATE TABLE symbols (
    id integer NOT NULL,
    ticker character varying(255) NOT NULL,
    company character varying(255) NOT NULL
);


ALTER TABLE symbols OWNER TO netvest;

--
-- Name: symbols_id_seq; Type: SEQUENCE; Schema: public; Owner: netvest
--

CREATE SEQUENCE symbols_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE symbols_id_seq OWNER TO netvest;

--
-- Name: symbols_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: netvest
--

ALTER SEQUENCE symbols_id_seq OWNED BY symbols.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: netvest
--

CREATE TABLE users (
    id integer NOT NULL,
    email character varying(255),
    pic text DEFAULT '/api/static/pic/ee11cbb19052e40b07aac0ca060c23ee'::text,
    first_name character varying(255) NOT NULL,
    last_name character varying(255) NOT NULL
);


ALTER TABLE users OWNER TO netvest;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: netvest
--

CREATE SEQUENCE users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE users_id_seq OWNER TO netvest;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: netvest
--

ALTER SEQUENCE users_id_seq OWNED BY users.id;


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: netvest
--

ALTER TABLE ONLY admins ALTER COLUMN id SET DEFAULT nextval('admins_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: netvest
--

ALTER TABLE ONLY comments ALTER COLUMN id SET DEFAULT nextval('comments_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: netvest
--

ALTER TABLE ONLY feed_items ALTER COLUMN id SET DEFAULT nextval('feed_items_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: netvest
--

ALTER TABLE ONLY knex_migrations ALTER COLUMN id SET DEFAULT nextval('knex_migrations_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: netvest
--

ALTER TABLE ONLY portfolio_symbols ALTER COLUMN id SET DEFAULT nextval('portfolio_symbols_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: netvest
--

ALTER TABLE ONLY symbols ALTER COLUMN id SET DEFAULT nextval('symbols_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: netvest
--

ALTER TABLE ONLY users ALTER COLUMN id SET DEFAULT nextval('users_id_seq'::regclass);


--
-- Data for Name: abuse_comments; Type: TABLE DATA; Schema: public; Owner: netvest
--

COPY abuse_comments (user_id, comment_id, "timestamp") FROM stdin;
\.


--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: netvest
--

COPY admins (id, user_id, parent, can_intro) FROM stdin;
\.


--
-- Name: admins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: netvest
--

SELECT pg_catalog.setval('admins_id_seq', 1, false);


--
-- Data for Name: auth_facebook; Type: TABLE DATA; Schema: public; Owner: netvest
--

COPY auth_facebook (user_id, facebook_id) FROM stdin;
27	1733352810234965
\.


--
-- Data for Name: auth_local; Type: TABLE DATA; Schema: public; Owner: netvest
--

COPY auth_local (user_id, password, salt) FROM stdin;
\.


--
-- Data for Name: brokerage; Type: TABLE DATA; Schema: public; Owner: netvest
--

COPY brokerage (investor_id, cash_value, multiplier) FROM stdin;
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: netvest
--

COPY comments (id, "timestamp", user_id, feed_id, text) FROM stdin;
\.


--
-- Name: comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: netvest
--

SELECT pg_catalog.setval('comments_id_seq', 296, true);


--
-- Data for Name: email_confirms; Type: TABLE DATA; Schema: public; Owner: netvest
--

COPY email_confirms (user_id, new_email, code) FROM stdin;
27	reaper90fang@gmail.com	8744f6738d7cb5435559b20fd383c718
\.


--
-- Data for Name: feed_items; Type: TABLE DATA; Schema: public; Owner: netvest
--

COPY feed_items (id, "timestamp", investor_id, event) FROM stdin;
\.


--
-- Name: feed_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: netvest
--

SELECT pg_catalog.setval('feed_items_id_seq', 150, true);


--
-- Data for Name: investors; Type: TABLE DATA; Schema: public; Owner: netvest
--

COPY investors (first_name, user_id, last_name, profession, focus, background, historical_returns, is_public, profile_pic) FROM stdin;
\.


--
-- Data for Name: knex_migrations; Type: TABLE DATA; Schema: public; Owner: netvest
--

COPY knex_migrations (id, name, batch, migration_time) FROM stdin;
68	20160420174050_init-db.js	1	2016-05-30 16:02:01.33+03
69	20160505104748_feed.js	1	2016-05-30 16:02:01.401+03
70	20160516235944_admin.js	1	2016-05-30 16:02:01.42+03
71	20160518115550_investor_onboarding.js	1	2016-05-30 16:02:01.612+03
72	20160518222250_abuse_comments.js	1	2016-05-30 16:02:01.632+03
73	20160526114419_userpic.js	1	2016-05-30 16:02:01.652+03
74	20160527160349_fullname-separation.js	1	2016-05-30 16:02:01.696+03
\.


--
-- Name: knex_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: netvest
--

SELECT pg_catalog.setval('knex_migrations_id_seq', 74, true);


--
-- Data for Name: knex_migrations_lock; Type: TABLE DATA; Schema: public; Owner: netvest
--

COPY knex_migrations_lock (is_locked) FROM stdin;
0
\.


--
-- Data for Name: portfolio_symbols; Type: TABLE DATA; Schema: public; Owner: netvest
--

COPY portfolio_symbols (id, amount, investor_id, symbol_id) FROM stdin;
\.


--
-- Name: portfolio_symbols_id_seq; Type: SEQUENCE SET; Schema: public; Owner: netvest
--

SELECT pg_catalog.setval('portfolio_symbols_id_seq', 29, true);


--
-- Data for Name: symbols; Type: TABLE DATA; Schema: public; Owner: netvest
--

COPY symbols (id, ticker, company) FROM stdin;
1	BABA	Alibaba Group Holding Limited
2	MBUU	Malibu Boats Inc
3	CXBMF	Calibre Mining Corp
4	EXCFF	Excalibur Resources Ltd.
5	CABE	Calibre Energy
6	AAPL	Apple Inc
7	CMG	Chipotle Mexican Grill
8	COKE	Coca-Cola Bottle Corp.
9	FB	Facebook
10	NFLX	Netflix Inc
11	GOOG	Alphabet Inc
12	GE	Genral Electric
13	FIT	Firbit Inc
14	YHOO	YAhoo Inc
15	GRMN	Garmin Ltd.
16	TWTR	Twitter
17	ATVI	Activation Blizzard
18	ZG	Zillow
\.


--
-- Name: symbols_id_seq; Type: SEQUENCE SET; Schema: public; Owner: netvest
--

SELECT pg_catalog.setval('symbols_id_seq', 18, true);


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: netvest
--

COPY users (id, email, pic, first_name, last_name) FROM stdin;
27	\N	/api/static/pic/ee11cbb19052e40b07aac0ca060c23ee	Artem	Toomean
\.


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: netvest
--

SELECT pg_catalog.setval('users_id_seq', 27, true);


--
-- Name: abuse_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: netvest
--

ALTER TABLE ONLY abuse_comments
    ADD CONSTRAINT abuse_comments_pkey PRIMARY KEY (user_id, comment_id);


--
-- Name: admins_pkey; Type: CONSTRAINT; Schema: public; Owner: netvest
--

ALTER TABLE ONLY admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: admins_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: netvest
--

ALTER TABLE ONLY admins
    ADD CONSTRAINT admins_user_id_unique UNIQUE (user_id);


--
-- Name: auth_facebook_facebook_id_unique; Type: CONSTRAINT; Schema: public; Owner: netvest
--

ALTER TABLE ONLY auth_facebook
    ADD CONSTRAINT auth_facebook_facebook_id_unique UNIQUE (facebook_id);


--
-- Name: auth_facebook_pkey; Type: CONSTRAINT; Schema: public; Owner: netvest
--

ALTER TABLE ONLY auth_facebook
    ADD CONSTRAINT auth_facebook_pkey PRIMARY KEY (user_id);


--
-- Name: auth_local_pkey; Type: CONSTRAINT; Schema: public; Owner: netvest
--

ALTER TABLE ONLY auth_local
    ADD CONSTRAINT auth_local_pkey PRIMARY KEY (user_id);


--
-- Name: brokerage_pkey; Type: CONSTRAINT; Schema: public; Owner: netvest
--

ALTER TABLE ONLY brokerage
    ADD CONSTRAINT brokerage_pkey PRIMARY KEY (investor_id);


--
-- Name: comments_pkey; Type: CONSTRAINT; Schema: public; Owner: netvest
--

ALTER TABLE ONLY comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: email_confirms_new_email_unique; Type: CONSTRAINT; Schema: public; Owner: netvest
--

ALTER TABLE ONLY email_confirms
    ADD CONSTRAINT email_confirms_new_email_unique UNIQUE (new_email);


--
-- Name: email_confirms_pkey; Type: CONSTRAINT; Schema: public; Owner: netvest
--

ALTER TABLE ONLY email_confirms
    ADD CONSTRAINT email_confirms_pkey PRIMARY KEY (user_id);


--
-- Name: feed_items_pkey; Type: CONSTRAINT; Schema: public; Owner: netvest
--

ALTER TABLE ONLY feed_items
    ADD CONSTRAINT feed_items_pkey PRIMARY KEY (id);


--
-- Name: investors_pkey; Type: CONSTRAINT; Schema: public; Owner: netvest
--

ALTER TABLE ONLY investors
    ADD CONSTRAINT investors_pkey PRIMARY KEY (user_id);


--
-- Name: investors_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: netvest
--

ALTER TABLE ONLY investors
    ADD CONSTRAINT investors_user_id_unique UNIQUE (user_id);


--
-- Name: knex_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: netvest
--

ALTER TABLE ONLY knex_migrations
    ADD CONSTRAINT knex_migrations_pkey PRIMARY KEY (id);


--
-- Name: portfolio_symbols_pkey; Type: CONSTRAINT; Schema: public; Owner: netvest
--

ALTER TABLE ONLY portfolio_symbols
    ADD CONSTRAINT portfolio_symbols_pkey PRIMARY KEY (id);


--
-- Name: symbols_pkey; Type: CONSTRAINT; Schema: public; Owner: netvest
--

ALTER TABLE ONLY symbols
    ADD CONSTRAINT symbols_pkey PRIMARY KEY (id);


--
-- Name: users_pkey; Type: CONSTRAINT; Schema: public; Owner: netvest
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: abuse_comments_comment_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: netvest
--

ALTER TABLE ONLY abuse_comments
    ADD CONSTRAINT abuse_comments_comment_id_foreign FOREIGN KEY (comment_id) REFERENCES comments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: abuse_comments_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: netvest
--

ALTER TABLE ONLY abuse_comments
    ADD CONSTRAINT abuse_comments_user_id_foreign FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: admins_parent_foreign; Type: FK CONSTRAINT; Schema: public; Owner: netvest
--

ALTER TABLE ONLY admins
    ADD CONSTRAINT admins_parent_foreign FOREIGN KEY (parent) REFERENCES admins(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: admins_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: netvest
--

ALTER TABLE ONLY admins
    ADD CONSTRAINT admins_user_id_foreign FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: brokerage_investor_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: netvest
--

ALTER TABLE ONLY brokerage
    ADD CONSTRAINT brokerage_investor_id_foreign FOREIGN KEY (investor_id) REFERENCES investors(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comments_feed_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: netvest
--

ALTER TABLE ONLY comments
    ADD CONSTRAINT comments_feed_id_foreign FOREIGN KEY (feed_id) REFERENCES feed_items(id);


--
-- Name: comments_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: netvest
--

ALTER TABLE ONLY comments
    ADD CONSTRAINT comments_user_id_foreign FOREIGN KEY (user_id) REFERENCES users(id);


--
-- Name: feed_items_investor_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: netvest
--

ALTER TABLE ONLY feed_items
    ADD CONSTRAINT feed_items_investor_id_foreign FOREIGN KEY (investor_id) REFERENCES investors(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: investors_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: netvest
--

ALTER TABLE ONLY investors
    ADD CONSTRAINT investors_user_id_foreign FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: portfolio_symbols_investor_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: netvest
--

ALTER TABLE ONLY portfolio_symbols
    ADD CONSTRAINT portfolio_symbols_investor_id_foreign FOREIGN KEY (investor_id) REFERENCES investors(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: portfolio_symbols_symbol_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: netvest
--

ALTER TABLE ONLY portfolio_symbols
    ADD CONSTRAINT portfolio_symbols_symbol_id_foreign FOREIGN KEY (symbol_id) REFERENCES symbols(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: public; Type: ACL; Schema: -; Owner: Tommy
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM "Tommy";
GRANT ALL ON SCHEMA public TO "Tommy";
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

