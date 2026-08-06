-- PostgreSQL Initialization Script for SJ Cloud

-- Create extensions in the default database
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create Databases for Platform Services
CREATE DATABASE sj_tenant_manager;
CREATE DATABASE sj_auth;
CREATE DATABASE sj_billing;

-- Connect to tenant manager database and install extensions
\c sj_tenant_manager
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Connect to auth database and install extensions
\c sj_auth
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Connect to billing database and install extensions
\c sj_billing
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
