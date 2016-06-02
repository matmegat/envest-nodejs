--
-- PostgreSQL database dump
--
​
SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
​
--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--
​
CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;
​
​
--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--
​
COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';
​
​
SET search_path = public, pg_catalog;
​
SET default_tablespace = '';
​
SET default_with_oids = false;
​
--
-- Name: abuse_comments; Type: TABLE; Schema: public; Owner: netvest; Tablespace: 
--
​
CREATE TABLE abuse_comments (
    user_id integer NOT NULL,
    comment_id integer NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now()
);
​
​
ALTER TABLE abuse_comments OWNER TO netvest;
​
--
-- Name: admins; Type: TABLE; Schema: public; Owner: netvest; Tablespace: 
--
​
CREATE TABLE admins (
    user_id integer NOT NULL,
    parent integer,
    can_intro boolean DEFAULT false
);
​
​
ALTER TABLE admins OWNER TO netvest;
​
--
-- Name: COLUMN admins.parent; Type: COMMENT; Schema: public; Owner: netvest
--
​
COMMENT ON COLUMN admins.parent IS 'another admin who introduced this admin';
​
​
--
-- Name: COLUMN admins.can_intro; Type: COMMENT; Schema: public; Owner: netvest
--
​
COMMENT ON COLUMN admins.can_intro IS 'can this admin introduce another';
​
​
--
-- Name: auth_facebook; Type: TABLE; Schema: public; Owner: netvest; Tablespace: 
--
​
CREATE TABLE auth_facebook (
    user_id integer NOT NULL,
    facebook_id bigint NOT NULL
);
​
​
ALTER TABLE auth_facebook OWNER TO netvest;
​
--
-- Name: auth_local; Type: TABLE; Schema: public; Owner: netvest; Tablespace: 
--
​
CREATE TABLE auth_local (
    user_id integer NOT NULL,
    password character varying(72) NOT NULL,
    salt character varying(32) NOT NULL
);
​
​
ALTER TABLE auth_local OWNER TO netvest;
​
--
-- Name: brokerage; Type: TABLE; Schema: public; Owner: netvest; Tablespace: 
--
​
CREATE TABLE brokerage (
    investor_id integer NOT NULL,
    cash_value numeric(12,2) NOT NULL,
    multiplier real NOT NULL
);
​
​
ALTER TABLE brokerage OWNER TO netvest;
​
--
-- Name: comments; Type: TABLE; Schema: public; Owner: netvest; Tablespace: 
--
​
CREATE TABLE comments (
    id integer NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now(),
    user_id integer NOT NULL,
    feed_id integer NOT NULL,
    text text NOT NULL
);
​
​
ALTER TABLE comments OWNER TO netvest;
​
--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: netvest
--
​
CREATE SEQUENCE comments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
​
​
ALTER TABLE comments_id_seq OWNER TO netvest;
​
--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: netvest
--
​
ALTER SEQUENCE comments_id_seq OWNED BY comments.id;
​
​
--
-- Name: email_confirms; Type: TABLE; Schema: public; Owner: netvest; Tablespace: 
--
​
CREATE TABLE email_confirms (
    user_id integer NOT NULL,
    new_email character varying(255) NOT NULL,
    code character varying(32) NOT NULL
);
​
​
ALTER TABLE email_confirms OWNER TO netvest;
​
--
-- Name: feed_items; Type: TABLE; Schema: public; Owner: netvest; Tablespace: 
--
​
CREATE TABLE feed_items (
    id integer NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now(),
    investor_id integer NOT NULL,
    event jsonb NOT NULL
);
​
​
ALTER TABLE feed_items OWNER TO netvest;
​
--
-- Name: feed_items_id_seq; Type: SEQUENCE; Schema: public; Owner: netvest
--
​
CREATE SEQUENCE feed_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
​
​
ALTER TABLE feed_items_id_seq OWNER TO netvest;
​
--
-- Name: feed_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: netvest
--
​
ALTER SEQUENCE feed_items_id_seq OWNED BY feed_items.id;
​
​
--
-- Name: investors; Type: TABLE; Schema: public; Owner: netvest; Tablespace: 
--
​
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
​
​
ALTER TABLE investors OWNER TO netvest;
​
--
-- Name: knex_migrations; Type: TABLE; Schema: public; Owner: netvest; Tablespace: 
--
​
CREATE TABLE knex_migrations (
    id integer NOT NULL,
    name character varying(255),
    batch integer,
    migration_time timestamp with time zone
);
​
​
ALTER TABLE knex_migrations OWNER TO netvest;
​
--
-- Name: knex_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: netvest
--
​
CREATE SEQUENCE knex_migrations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
​
​
ALTER TABLE knex_migrations_id_seq OWNER TO netvest;
​
--
-- Name: knex_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: netvest
--
​
ALTER SEQUENCE knex_migrations_id_seq OWNED BY knex_migrations.id;
​
​
--
-- Name: knex_migrations_lock; Type: TABLE; Schema: public; Owner: netvest; Tablespace: 
--
​
CREATE TABLE knex_migrations_lock (
    is_locked integer
);
​
​
ALTER TABLE knex_migrations_lock OWNER TO netvest;
​
--
-- Name: portfolio_symbols; Type: TABLE; Schema: public; Owner: netvest; Tablespace: 
--
​
CREATE TABLE portfolio_symbols (
    id integer NOT NULL,
    amount integer NOT NULL,
    investor_id integer NOT NULL,
    symbol_id integer NOT NULL
);
​
​
ALTER TABLE portfolio_symbols OWNER TO netvest;
​
--
-- Name: COLUMN portfolio_symbols.amount; Type: COMMENT; Schema: public; Owner: netvest
--
​
COMMENT ON COLUMN portfolio_symbols.amount IS 'Number of Shares';
​
​
--
-- Name: portfolio_symbols_id_seq; Type: SEQUENCE; Schema: public; Owner: netvest
--
​
CREATE SEQUENCE portfolio_symbols_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
​
​
ALTER TABLE portfolio_symbols_id_seq OWNER TO netvest;
​
--
-- Name: portfolio_symbols_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: netvest
--
​
ALTER SEQUENCE portfolio_symbols_id_seq OWNED BY portfolio_symbols.id;
​
​
--
-- Name: symbols; Type: TABLE; Schema: public; Owner: netvest; Tablespace: 
--
​
CREATE TABLE symbols (
    id integer NOT NULL,
    ticker character varying(255) NOT NULL,
    company character varying(255) NOT NULL
);
​
​
ALTER TABLE symbols OWNER TO netvest;
​
--
-- Name: symbols_id_seq; Type: SEQUENCE; Schema: public; Owner: netvest
--
​
CREATE SEQUENCE symbols_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
​
​
ALTER TABLE symbols_id_seq OWNER TO netvest;
​
--
-- Name: symbols_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: netvest
--
​
ALTER SEQUENCE symbols_id_seq OWNED BY symbols.id;
​
​
--
-- Name: users; Type: TABLE; Schema: public; Owner: netvest; Tablespace: 
--
​
CREATE TABLE users (
    id integer NOT NULL,
    full_name character varying(255) NOT NULL,
    email character varying(255),
    pic text DEFAULT '/api/static/pic/ee11cbb19052e40b07aac0ca060c23ee'::text
);
​
​
ALTER TABLE users OWNER TO netvest;
​
--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: netvest
--
​
CREATE SEQUENCE users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
​
​
ALTER TABLE users_id_seq OWNER TO netvest;
​
--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: netvest
--
​
ALTER SEQUENCE users_id_seq OWNED BY users.id;
​
​
--
-- Name: id; Type: DEFAULT; Schema: public; Owner: netvest
--
​
ALTER TABLE ONLY comments ALTER COLUMN id SET DEFAULT nextval('comments_id_seq'::regclass);
​
​
--
-- Name: id; Type: DEFAULT; Schema: public; Owner: netvest
--
​
ALTER TABLE ONLY feed_items ALTER COLUMN id SET DEFAULT nextval('feed_items_id_seq'::regclass);
​
​
--
-- Name: id; Type: DEFAULT; Schema: public; Owner: netvest
--
​
ALTER TABLE ONLY knex_migrations ALTER COLUMN id SET DEFAULT nextval('knex_migrations_id_seq'::regclass);
​
​
--
-- Name: id; Type: DEFAULT; Schema: public; Owner: netvest
--
​
ALTER TABLE ONLY portfolio_symbols ALTER COLUMN id SET DEFAULT nextval('portfolio_symbols_id_seq'::regclass);
​
​
--
-- Name: id; Type: DEFAULT; Schema: public; Owner: netvest
--
​
ALTER TABLE ONLY symbols ALTER COLUMN id SET DEFAULT nextval('symbols_id_seq'::regclass);
​
​
--
-- Name: id; Type: DEFAULT; Schema: public; Owner: netvest
--
​
ALTER TABLE ONLY users ALTER COLUMN id SET DEFAULT nextval('users_id_seq'::regclass);
​
​
--
-- Data for Name: abuse_comments; Type: TABLE DATA; Schema: public; Owner: netvest
--
​
COPY abuse_comments (user_id, comment_id, "timestamp") FROM stdin;
16	416	2016-05-26 11:42:25.938652+00
16	417	2016-05-26 12:11:59.433525+00
223	365	2016-05-26 15:03:17.087854+00
223	366	2016-05-26 15:03:22.176261+00
223	401	2016-05-26 15:03:27.433122+00
16	429	2016-05-26 16:58:05.525224+00
16	428	2016-05-26 17:16:00.995722+00
16	434	2016-05-26 20:06:42.178987+00
29	418	2016-05-27 07:22:11.392805+00
29	448	2016-05-27 07:22:18.301618+00
13	117	2016-05-27 08:16:02.085952+00
16	449	2016-05-27 09:07:59.854938+00
16	450	2016-05-27 09:08:10.90919+00
16	435	2016-05-27 09:08:19.228442+00
223	328	2016-05-27 10:26:08.987851+00
223	461	2016-05-27 10:26:40.348458+00
223	458	2016-05-27 10:28:49.14543+00
223	462	2016-05-27 10:28:58.367434+00
223	463	2016-05-27 10:41:57.629298+00
13	464	2016-05-27 11:57:41.318346+00
13	463	2016-05-27 11:57:50.486031+00
13	466	2016-05-27 12:02:16.819464+00
13	465	2016-05-27 12:02:47.008408+00
13	352	2016-05-27 12:03:52.102949+00
19	117	2016-05-25 12:01:52.7398+00
19	285	2016-05-25 12:02:45.577806+00
15	364	2016-05-25 12:07:00.586386+00
15	362	2016-05-25 12:07:06.180546+00
13	472	2016-05-27 12:18:57.184018+00
223	360	2016-05-27 12:39:48.176586+00
19	118	2016-05-25 12:19:05.444079+00
15	363	2016-05-25 14:13:26.348381+00
15	361	2016-05-25 14:13:29.126648+00
15	365	2016-05-25 14:13:31.567241+00
15	358	2016-05-25 14:13:41.908205+00
15	311	2016-05-26 08:27:28.382858+00
15	314	2016-05-26 08:27:30.757891+00
15	366	2016-05-26 09:36:40.525009+00
10	288	2016-05-26 09:51:43.791896+00
13	488	2016-05-27 12:40:13.500753+00
16	458	2016-05-27 14:00:19.917487+00
223	352	2016-05-27 14:51:53.844434+00
29	512	2016-05-27 15:27:49.812678+00
16	340	2016-05-27 15:31:27.601915+00
223	464	2016-05-27 15:31:46.127168+00
288	522	2016-05-27 15:54:41.60733+00
287	325	2016-05-27 16:13:08.370484+00
287	521	2016-05-27 16:31:23.298496+00
13	526	2016-05-30 10:05:31.857252+00
13	448	2016-05-30 10:34:24.792736+00
289	530	2016-05-30 10:45:50.368618+00
289	453	2016-05-30 12:04:47.434034+00
\.
​
​
--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: netvest
--
​
COPY admins (user_id, parent, can_intro) FROM stdin;
\.
​
​
--
-- Data for Name: auth_facebook; Type: TABLE DATA; Schema: public; Owner: netvest
--
​
COPY auth_facebook (user_id, facebook_id) FROM stdin;
7	1733352810234965
12	129435810797194
\.
​
​
--
-- Data for Name: auth_local; Type: TABLE DATA; Schema: public; Owner: netvest
--
​
COPY auth_local (user_id, password, salt) FROM stdin;
1	4d4bf931bb840b74c0349879be5eeebc786e21b9fc7b05e272bb0fe402d54b8559def007	e37b739fbfa92ad861f05594786be5a8
2	4d4bf931bb840b74c0349879be5eeebc786e21b9fc7b05e272bb0fe402d54b8559def007	e37b739fbfa92ad861f05594786be5a8
3	4d4bf931bb840b74c0349879be5eeebc786e21b9fc7...