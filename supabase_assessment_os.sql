-- ==========================================
-- PRODUCTION-GRADE ASSESSMENT OS MIGRATIONS
-- ==========================================

-- Drop existing tables if they exist to apply clean relational migrations
drop table if exists public.assessment_certificates cascade;
drop table if exists public.assessment_ai_feedback cascade;
drop table if exists public.assessment_leaderboards cascade;
drop table if exists public.assessment_progress cascade;
drop table if exists public.assessment_results cascade;
drop table if exists public.assessment_answers cascade;
drop table if exists public.assessment_attempts cascade;
drop table if exists public.assessment_sections cascade;
drop table if exists public.assessment_options cascade;
drop table if exists public.assessment_questions cascade;
drop table if exists public.assessment_company_templates cascade;
drop table if exists public.assessment_topics cascade;
drop table if exists public.assessment_categories cascade;

-- 1. Assessment Categories
create table public.assessment_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. Assessment Topics
create table public.assessment_topics (
  id uuid primary key default uuid_generate_v4(),
  category_slug text not null references public.assessment_categories(slug) on delete cascade,
  name text not null,
  slug text not null unique,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 3. Assessment Company Templates (Exams/Mock tests scheduler)
create table public.assessment_company_templates (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  company text not null,
  role text not null,
  duration_minutes integer not null default 45,
  passing_percentage integer not null default 60,
  instructions text,
  randomize_questions boolean default false not null,
  shuffle_options boolean default false not null,
  visibility text default 'Free' not null check (visibility in ('Free', 'Premium')),
  attempt_limit integer default 3,
  start_date timestamptz,
  end_date timestamptz,
  has_certificate boolean default false not null,
  status text default 'Active' not null check (status in ('Active', 'Archived', 'Draft')),
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 4. Assessment Questions
create table public.assessment_questions (
  id uuid primary key default uuid_generate_v4(),
  topic_id uuid not null references public.assessment_topics(id) on delete cascade,
  question_text text not null,
  correct_answer_text text not null, -- correct option matching string
  explanation text,
  hints jsonb default '[]'::jsonb, -- array of strings
  solution_code text, -- sample solution queries or codes
  difficulty text default 'Medium' not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  expected_time_seconds integer default 120,
  marks integer default 4,
  negative_marks numeric default 1.0,
  company_tags jsonb default '[]'::jsonb, -- array of company tag strings
  role_tags jsonb default '[]'::jsonb, -- array of role tag strings
  is_published boolean default true not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 5. Assessment Options
create table public.assessment_options (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid not null references public.assessment_questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean default false not null
);

-- 6. Assessment Sections
create table public.assessment_sections (
  id uuid primary key default uuid_generate_v4(),
  template_id uuid not null references public.assessment_company_templates(id) on delete cascade,
  name text not null,
  duration_minutes integer not null,
  question_count integer not null
);

-- 7. Assessment Attempts
create table public.assessment_attempts (
  id text primary key, -- user-friendly custom string or standard UUID
  user_id text not null,
  template_id uuid references public.assessment_company_templates(id) on delete set null,
  test_type text not null check (test_type in ('Practice', 'Exam', 'Company')),
  mode text not null check (mode in ('Timed', 'Untimed')),
  started_at timestamptz default timezone('utc'::text, now()) not null,
  completed_at timestamptz,
  is_completed boolean default false not null
);

-- 8. Assessment Answers
create table public.assessment_answers (
  id uuid primary key default uuid_generate_v4(),
  attempt_id text not null references public.assessment_attempts(id) on delete cascade,
  question_id uuid not null references public.assessment_questions(id) on delete cascade,
  selected_option_id uuid references public.assessment_options(id) on delete set null,
  answer_text text, -- user typed answer or code
  is_correct boolean default false not null,
  time_spent_seconds integer default 0 not null,
  marked_for_review boolean default false not null
);

-- 9. Assessment Results
create table public.assessment_results (
  attempt_id text primary key references public.assessment_attempts(id) on delete cascade,
  score_percentage numeric(5,2) not null,
  correct_count integer not null,
  incorrect_count integer not null,
  skipped_count integer not null,
  time_taken_seconds integer not null,
  passed boolean not null,
  guess_rate numeric(5,2) default 0.00,
  confidence_score numeric(5,2) default 100.00,
  xp_gained integer default 0 not null
);

-- 10. Assessment Progress
create table public.assessment_progress (
  user_id text not null,
  topic_id uuid not null references public.assessment_topics(id) on delete cascade,
  questions_solved integer default 0 not null,
  correct_answers integer default 0 not null,
  accuracy_percentage numeric(5,2) default 0.00 not null,
  mastery_level text default 'Needs Improvement' not null check (mastery_level in ('Mastered', 'Moderate', 'Needs Improvement')),
  last_updated timestamptz default timezone('utc'::text, now()) not null,
  primary key (user_id, topic_id)
);

-- 11. Assessment Leaderboards
create table public.assessment_leaderboards (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  template_id uuid references public.assessment_company_templates(id) on delete set null,
  total_score numeric(5,2) not null,
  rank integer not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 12. Assessment AI Feedback
create table public.assessment_ai_feedback (
  id uuid primary key default uuid_generate_v4(),
  attempt_id text not null references public.assessment_attempts(id) on delete cascade,
  feedback_text text not null,
  weak_concepts jsonb default '[]'::jsonb,
  practice_recommendations jsonb default '[]'::jsonb,
  estimated_readiness_percentage numeric(5,2) default 0.00 not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 13. Assessment Certificates
create table public.assessment_certificates (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  template_id uuid not null references public.assessment_company_templates(id) on delete cascade,
  certificate_code text not null unique,
  issued_at timestamptz default timezone('utc'::text, now()) not null
);

-- Enable RLS on all tables
alter table public.assessment_categories enable row level security;
alter table public.assessment_topics enable row level security;
alter table public.assessment_company_templates enable row level security;
alter table public.assessment_questions enable row level security;
alter table public.assessment_options enable row level security;
alter table public.assessment_sections enable row level security;
alter table public.assessment_attempts enable row level security;
alter table public.assessment_answers enable row level security;
alter table public.assessment_results enable row level security;
alter table public.assessment_progress enable row level security;
alter table public.assessment_leaderboards enable row level security;
alter table public.assessment_ai_feedback enable row level security;
alter table public.assessment_certificates enable row level security;

-- Setup RLS Policies (Allow Read/Select for active/published items, and modify attempts for authenticated users)
create policy "Allow read categories" on public.assessment_categories for select using (true);
create policy "Allow read topics" on public.assessment_topics for select using (true);
create policy "Allow read templates" on public.assessment_company_templates for select using (status = 'Active');
create policy "Allow read published questions" on public.assessment_questions for select using (is_published = true);
create policy "Allow read options" on public.assessment_options for select using (true);
create policy "Allow read sections" on public.assessment_sections for select using (true);

create policy "Allow user access attempts" on public.assessment_attempts for all using (true);
create policy "Allow user access answers" on public.assessment_answers for all using (true);
create policy "Allow user access results" on public.assessment_results for all using (true);
create policy "Allow user access progress" on public.assessment_progress for all using (true);
create policy "Allow read leaderboards" on public.assessment_leaderboards for select using (true);
create policy "Allow user access feedback" on public.assessment_ai_feedback for all using (true);
create policy "Allow user access certificates" on public.assessment_certificates for all using (true);

-- Check if placement_readiness table column exists before adding it
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name='placement_readiness' and column_name='assessment_score') then
    alter table public.placement_readiness add column assessment_score integer default 0;
  end if;
end $$;


-- ==========================================
-- SEED DATA CONFIGURATIONS
-- ==========================================

-- Seed Categories
insert into public.assessment_categories (name, slug, description) values
('Quantitative Aptitude', 'aptitude', 'Mathematics, arithmetic, algebraic operations, word puzzles and data interpretation.'),
('Logical Reasoning', 'logical', 'Deductive reasoning, pattern analysis, blood relations, seating arrangements and puzzles.'),
('Verbal Ability', 'verbal', 'Sentence syntax correction, grammar, reading comprehension, idioms and vocabulary.'),
('SQL Assessments', 'sql', 'Relational query execution, window aggregates, group filtrations and joining patterns.'),
('Coding Assessments', 'coding', 'Data structures, algorithm complexity optimization, dynamic scripting and traversal operations.')
on conflict (slug) do update set name = excluded.name, description = excluded.description;

-- Seed Topics for Aptitude
insert into public.assessment_topics (category_slug, name, slug) values
('aptitude', 'Percentage', 'apt-percentage'),
('aptitude', 'Profit & Loss', 'apt-profit-loss'),
('aptitude', 'Ratio', 'apt-ratio'),
('aptitude', 'Partnership', 'apt-partnership'),
('aptitude', 'Average', 'apt-average'),
('aptitude', 'Time & Work', 'apt-time-work'),
('aptitude', 'Pipes & Cisterns', 'apt-pipes-cisterns'),
('aptitude', 'Time Speed Distance', 'apt-time-speed-distance'),
('aptitude', 'Boats & Streams', 'apt-boats-streams'),
('aptitude', 'Compound Interest', 'apt-compound-interest'),
('aptitude', 'Simple Interest', 'apt-simple-interest'),
('aptitude', 'Mixtures', 'apt-mixtures'),
('aptitude', 'Allegation', 'apt-allegation'),
('aptitude', 'Probability', 'apt-probability'),
('aptitude', 'Permutation', 'apt-permutation'),
('aptitude', 'Combination', 'apt-combination'),
('aptitude', 'Number System', 'apt-number-system'),
('aptitude', 'HCF', 'apt-hcf'),
('aptitude', 'LCM', 'apt-lcm'),
('aptitude', 'Calendar', 'apt-calendar'),
('aptitude', 'Clock', 'apt-clock'),
('aptitude', 'Ages', 'apt-ages'),
('aptitude', 'Heights & Distances', 'apt-heights-distances'),
('aptitude', 'Mensuration', 'apt-mensuration'),
('aptitude', 'Geometry', 'apt-geometry'),
('aptitude', 'Coordinate Geometry', 'apt-coordinate-geometry'),
('aptitude', 'Trigonometry', 'apt-trigonometry'),
('aptitude', 'Data Interpretation', 'apt-data-interpretation'),
('aptitude', 'Caselets', 'apt-caselets'),
('aptitude', 'Graphs', 'apt-graphs'),
('aptitude', 'Tables', 'apt-tables')
on conflict (slug) do nothing;

-- Seed Topics for Logical Reasoning
insert into public.assessment_topics (category_slug, name, slug) values
('logical', 'Blood Relations', 'log-blood-relations'),
('logical', 'Seating Arrangement', 'log-seating-arrangement'),
('logical', 'Direction Sense', 'log-direction-sense'),
('logical', 'Coding Decoding', 'log-coding-decoding'),
('logical', 'Puzzle', 'log-puzzle'),
('logical', 'Syllogism', 'log-syllogism'),
('logical', 'Statement Assumption', 'log-statement-assumption'),
('logical', 'Statement Conclusion', 'log-statement-conclusion'),
('logical', 'Cause Effect', 'log-cause-effect'),
('logical', 'Data Sufficiency', 'log-data-sufficiency'),
('logical', 'Cubes', 'log-cubes'),
('logical', 'Dice', 'log-dice'),
('logical', 'Calendar Verification', 'log-calendar-verification'),
('logical', 'Clock Calculations', 'log-clock-calculations'),
('logical', 'Ranking', 'log-ranking'),
('logical', 'Input Output', 'log-input-output'),
('logical', 'Decision Making', 'log-decision-making'),
('logical', 'Critical Reasoning', 'log-critical-reasoning')
on conflict (slug) do nothing;

-- Seed Topics for Verbal Ability
insert into public.assessment_topics (category_slug, name, slug) values
('verbal', 'Reading Comprehension', 'verb-reading-comprehension'),
('verbal', 'Vocabulary', 'verb-vocabulary'),
('verbal', 'Synonyms', 'verb-synonyms'),
('verbal', 'Antonyms', 'verb-antonyms'),
('verbal', 'Fill in blanks', 'verb-fill-blanks'),
('verbal', 'Sentence Correction', 'verb-sentence-correction'),
('verbal', 'Para Jumbles', 'verb-para-jumbles'),
('verbal', 'Error Spotting', 'verb-error-spotting'),
('verbal', 'Active Passive', 'verb-active-passive'),
('verbal', 'Direct Indirect', 'verb-direct-indirect'),
('verbal', 'Idioms', 'verb-idioms'),
('verbal', 'One Word', 'verb-one-word'),
('verbal', 'Cloze Test', 'verb-cloze-test')
on conflict (slug) do nothing;

-- Seed Topics for SQL
insert into public.assessment_topics (category_slug, name, slug) values
('sql', 'SELECT queries', 'sql-select'),
('sql', 'WHERE filtering', 'sql-where'),
('sql', 'GROUP BY aggregates', 'sql-group-by'),
('sql', 'HAVING clause', 'sql-having'),
('sql', 'ORDER BY sequencing', 'sql-order-by'),
('sql', 'Aggregate Functions', 'sql-aggregates'),
('sql', 'JOIN methods', 'sql-join'),
('sql', 'LEFT JOIN links', 'sql-left-join'),
('sql', 'RIGHT JOIN links', 'sql-right-join'),
('sql', 'FULL JOIN operations', 'sql-full-join'),
('sql', 'SELF JOIN matches', 'sql-self-join'),
('sql', 'UNION syntax', 'sql-union'),
('sql', 'UNION ALL queries', 'sql-union-all'),
('sql', 'Window Functions', 'sql-window-functions'),
('sql', 'ROW_NUMBER ranking', 'sql-row-number'),
('sql', 'RANK calculation', 'sql-rank'),
('sql', 'DENSE_RANK execution', 'sql-dense-rank'),
('sql', 'LEAD offset', 'sql-lead'),
('sql', 'LAG offset', 'sql-lag'),
('sql', 'CTE structure', 'sql-cte'),
('sql', 'Recursive CTE', 'sql-recursive-cte'),
('sql', 'Views', 'sql-views'),
('sql', 'Stored Procedures', 'sql-stored-procedures'),
('sql', 'Triggers', 'sql-triggers'),
('sql', 'Indexes', 'sql-indexes'),
('sql', 'Normalization rules', 'sql-normalization')
on conflict (slug) do nothing;

-- Seed Topics for Coding
insert into public.assessment_topics (category_slug, name, slug) values
('coding', 'Arrays', 'code-arrays'),
('coding', 'Strings', 'code-strings'),
('coding', 'Hashing', 'code-hashing'),
('coding', 'Linked List', 'code-linked-list'),
('coding', 'Stack', 'code-stack'),
('coding', 'Queue', 'code-queue'),
('coding', 'Trees', 'code-trees'),
('coding', 'BST', 'code-bst'),
('coding', 'Heap', 'code-heap'),
('coding', 'Graph', 'code-graph'),
('coding', 'DFS Traversal', 'code-dfs'),
('coding', 'BFS Traversal', 'code-bfs'),
('coding', 'Dynamic Programming', 'code-dp'),
('coding', 'Greedy algorithms', 'code-greedy'),
('coding', 'Sliding Window', 'code-sliding-window'),
('coding', 'Binary Search', 'code-binary-search'),
('coding', 'Recursion', 'code-recursion'),
('coding', 'Backtracking', 'code-backtracking'),
('coding', 'Bit Manipulation', 'code-bit-manipulation'),
('coding', 'Segment Tree', 'code-segment-tree'),
('coding', 'Trie structure', 'code-trie')
on conflict (slug) do nothing;
