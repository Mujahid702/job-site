-- Migration: Placement Project Intelligence System Tables

-- 1. Target Companies Table
create table if not exists public.project_companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  priority_skills text[] not null,
  focus text not null,
  description text not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. Student Projects Blueprints Table
create table if not exists public.student_projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  role text not null,
  company text not null,
  difficulty text not null,
  interest_area text not null,
  blueprint jsonb not null, -- Stores the complete schema-validated blueprint object
  readiness_checklist jsonb default '{"planning": true, "development": false, "testing": false, "deployment": false, "documentation": false}'::jsonb not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 3. Enable RLS
alter table public.project_companies enable row level security;
alter table public.student_projects enable row level security;

-- 4. RLS Policies
drop policy if exists "Allow public read access to target companies" on public.project_companies;
create policy "Allow public read access to target companies" on public.project_companies
  for select using (true);

drop policy if exists "Allow admin write access to target companies" on public.project_companies;
create policy "Allow admin write access to target companies" on public.project_companies
  for all using (public.is_admin());

drop policy if exists "Allow users to view own project blueprints" on public.student_projects;
create policy "Allow users to view own project blueprints" on public.student_projects
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Allow users to manage own project blueprints" on public.student_projects;
create policy "Allow users to manage own project blueprints" on public.student_projects
  for all using (user_id = auth.uid() or public.is_admin());

-- 5. Seed Target Companies
insert into public.project_companies (name, priority_skills, focus, description)
values
  ('Google', ARRAY['Go', 'C++', 'Python', 'Distributed Systems', 'Algorithms'], 'Scale & Algorithm Performance', 'Focuses on massive scale, low latency, and algorithms.'),
  ('Microsoft', ARRAY['C#', 'Azure', 'TypeScript', 'SQL Server'], 'Enterprise Scaling & SDK development', 'Focuses on cloud integrations, enterprise governance, and developer productivity.'),
  ('Amazon', ARRAY['Java', 'AWS', 'DynamoDB', 'Messaging Queues'], 'Operational Resiliency & Concurrency', 'Focuses on customer obsession, transaction locks, and operational resilience.'),
  ('Meta', ARRAY['Hack', 'React', 'Python', 'Memcached', 'GraphQL'], 'Web Scale & Real-Time Sync', 'Focuses on social graph routing, web scaling, and open-source stacks.'),
  ('Netflix', ARRAY['Java', 'Spring Cloud', 'Node.js', 'AWS', 'Cassandra'], 'Fault Tolerance & High Availability', 'Focuses on microservice architectures, streaming throughput, and fault tolerance.'),
  ('Uber', ARRAY['Go', 'Java', 'Python', 'Kafka', 'Cassandra'], 'Real-Time Telemetry & Geofencing', 'Focuses on high-concurrency dispatch routing and geospatial calculations.'),
  ('Airbnb', ARRAY['Ruby', 'React', 'TypeScript', 'AWS', 'GraphQL'], 'Search Indexing & Responsive UI', 'Focuses on rich search interfaces, layout consistency, and client caching.'),
  ('Atlassian', ARRAY['Java', 'React', 'TypeScript', 'AWS', 'PostgreSQL'], 'Collaborative Tools & API Gateways', 'Focuses on collaborative document updates and extensible SaaS API plugins.'),
  ('Salesforce', ARRAY['Apex', 'Java', 'Javascript', 'Heroku', 'SQL'], 'CRM Middleware & Event Hubs', 'Focuses on multi-tenant databases and scalable enterprise event structures.'),
  ('Adobe', ARRAY['C++', 'React', 'WebAssembly', 'Python', 'WebGL'], 'Rich Media Rendering & Cloud Collaboration', 'Focuses on high-fidelity visual tools and serverless rendering pipelines.'),
  ('Oracle', ARRAY['Java', 'SQL Tuning', 'OCI', 'Redis', 'PL/SQL'], 'Database Optimizations & ACID Compliance', 'Focuses on database performance, caching locks, and cloud analytics.'),
  ('Intel', ARRAY['C', 'C++', 'Python', 'Linux Kernel', 'RTOS'], 'Embedded Systems & Hardware Interfacing', 'Focuses on low-level firmware, driver efficiency, and hardware acceleration.'),
  ('Nvidia', ARRAY['C++', 'CUDA', 'Python', 'TensorRT', 'PyTorch'], 'GPU Computing & AI Inference Acceleration', 'Focuses on deep learning acceleration, raytracing APIs, and hardware computing.'),
  ('Goldman Sachs', ARRAY['Java', 'C++', 'Python', 'Sybase', 'Kafka'], 'Financial Transactions & Low-Latency Execution', 'Focuses on safe trading gateways, low-latency queues, and compliance logs.'),
  ('JPMorgan', ARRAY['Java', 'Spring Boot', 'Python', 'AWS', 'Oracle'], 'Secure Core Banking & Auditing Mappings', 'Focuses on financial scale, message processing audits, and data isolation.'),
  ('Morgan Stanley', ARRAY['C++', 'Java', 'Python', 'Linux', 'SQL'], 'High-Frequency Risk Modeling Systems', 'Focuses on secure calculations, distributed ledgers, and trade risks analytics.'),
  ('Deloitte', ARRAY['Python', 'Power BI', 'SQL', 'Cloud Analytics'], 'Business Workflow & Diagnostics', 'Focuses on business workflow compliance, analytics, and problem solving.'),
  ('Accenture', ARRAY['Java', 'Spring Boot', 'AWS', 'Node.js'], 'Cloud Operations & Integration Delivery', 'Focuses on cloud migrations, scalable microservices, and enterprise API gateways.'),
  ('Infosys', ARRAY['Java', 'OOP Principles', 'Python', 'SQL'], 'System Modernization & Standardized Frameworks', 'Focuses on client application maintenance, SQL queries, and core enterprise modules.'),
  ('TCS', ARRAY['Java', 'Spring Boot', 'REST APIs', 'Oracle DB'], 'Service Modernization & Client Delivery', 'Focuses on migration pipelines, client delivery schedules, and service operations.'),
  ('Wipro', ARRAY['Java', 'HTML5', 'CSS3', 'SQL', 'REST APIs'], 'Web Applications & Standard Integrations', 'Focuses on application modernizations, client portals, and standard API stacks.'),
  ('HCL', ARRAY['Java', 'C++', 'Linux', 'SQL', 'Git'], 'Systems Engineering & Infrastructure Operations', 'Focuses on operating systems maintenance, core networking, and SQL setups.'),
  ('Zoho', ARRAY['Java', 'Deluge', 'PostgreSQL', 'Redis', 'Linux'], 'SaaS Architecture & Custom Database Models', 'Focuses on cloud SaaS platforms, local database optimization, and high-tenancy networks.'),
  ('Freshworks', ARRAY['Ruby on Rails', 'React', 'Node.js', 'AWS', 'MySQL'], 'Multi-Tenant SaaS & Helpdesk Workflows', 'Focuses on ticket routing queues, user presence websockets, and responsive UI.'),
  ('Flipkart', ARRAY['Java', 'Python', 'Kafka', 'HBase', 'Redis'], 'High-Volume e-Commerce & Inventory Locks', 'Focuses on atomic checkout locks, search indexing, and warehouse logistics.'),
  ('Swiggy', ARRAY['Go', 'Java', 'Kafka', 'PostgreSQL', 'Redis'], 'Hyperlocal Logistics & Dispatch Routing', 'Focuses on geofencing calculations, driver matching queues, and high-concurrency order systems.'),
  ('Zomato', ARRAY['PHP', 'React Native', 'Node.js', 'AWS', 'PostgreSQL'], 'Food Tech Aggregator & Recommendation Engines', 'Focuses on restaurant search performance, geolocation lookups, and coupon check loops.'),
  ('Paytm', ARRAY['Java', 'Node.js', 'Kubernetes', 'Redis', 'Kafka'], 'Atomic Payment Processing & Ledger Mappings', 'Focuses on sub-second double-entry bookkeeping ledgers and transaction locks.'),
  ('Razorpay', ARRAY['PHP', 'Go', 'MySQL', 'Redis', 'AWS'], 'Secure Payment Gateways & Webhook Handlers', 'Focuses on automated reconciliation loops and secure tokenization of cards.'),
  ('PhonePe', ARRAY['Java', 'Spring Boot', 'HBase', 'Aerospike', 'Kafka'], 'Distributed UPI Settlement Networks', 'Focuses on high-throughput database transactions and real-time ledger settlements.'),
  ('Meesho', ARRAY['Java', 'Python', 'AWS', 'PostgreSQL', 'Kafka'], 'Social Commerce Funnel & Feed Recommendations', 'Focuses on collaborative recommendation models and scalable reseller dashboards.')
on conflict (name) do update
set priority_skills = excluded.priority_skills,
    focus = excluded.focus,
    description = excluded.description;
