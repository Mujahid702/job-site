-- Migration 017: Content Taxonomy Seeding
-- ==========================================================

-- 1. Alter public.assessment_topics to support taxonomy metadata
ALTER TABLE public.assessment_topics 
ADD COLUMN IF NOT EXISTS difficulty text DEFAULT 'Medium' NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
ADD COLUMN IF NOT EXISTS question_count integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS estimated_time_minutes integer DEFAULT 30 NOT NULL,
ADD COLUMN IF NOT EXISTS prerequisite_topics text[] DEFAULT '{}'::text[] NOT NULL,
ADD COLUMN IF NOT EXISTS skill_tags text[] DEFAULT '{}'::text[] NOT NULL;

-- 2. Wipe existing placeholder topics
DELETE FROM public.assessment_topics WHERE true;

-- 3. Seed Taxonomy Topics for Quantitative Aptitude
INSERT INTO public.assessment_topics (category_slug, name, slug, difficulty, question_count, estimated_time_minutes, prerequisite_topics, skill_tags) VALUES
('aptitude', 'Number System', 'apt-number-system', 'Medium', 0, 45, '{}'::text[], '{"Numbers", "Aptitude"}'::text[]),
('aptitude', 'HCF and LCM', 'apt-hcf-lcm', 'Easy', 0, 30, '{"apt-number-system"}'::text[], '{"Math", "Fundamentals"}'::text[]),
('aptitude', 'Percentages', 'apt-percentages', 'Easy', 0, 30, '{}'::text[], '{"Ratio", "Business Math"}'::text[]),
('aptitude', 'Profit and Loss', 'apt-profit-loss', 'Medium', 0, 45, '{"apt-percentages"}'::text[], '{"Financial", "Logic"}'::text[]),
('aptitude', 'Simple Interest', 'apt-simple-interest', 'Easy', 0, 30, '{"apt-percentages"}'::text[], '{"Interest", "Finance"}'::text[]),
('aptitude', 'Compound Interest', 'apt-compound-interest', 'Hard', 0, 60, '{"apt-simple-interest"}'::text[], '{"Interest", "Compounding"}'::text[]),
('aptitude', 'Ratio and Proportion', 'apt-ratio-proportion', 'Easy', 0, 30, '{}'::text[], '{"Ratio", "Math"}'::text[]),
('aptitude', 'Averages', 'apt-averages', 'Easy', 0, 30, '{}'::text[], '{"Averages", "Statistics"}'::text[]),
('aptitude', 'Mixtures and Allegations', 'apt-mixtures-allegations', 'Medium', 0, 45, '{"apt-ratio-proportion", "apt-averages"}'::text[], '{"Mixtures", "Allegation"}'::text[]),
('aptitude', 'Time and Work', 'apt-time-work', 'Medium', 0, 45, '{"apt-ratio-proportion"}'::text[], '{"Work", "Time"}'::text[]),
('aptitude', 'Pipes and Cisterns', 'apt-pipes-cisterns', 'Medium', 0, 30, '{"apt-time-work"}'::text[], '{"Time", "Pipes"}'::text[]),
('aptitude', 'Time Speed Distance', 'apt-time-speed-distance', 'Hard', 0, 60, '{}'::text[], '{"Speed", "Distance"}'::text[]),
('aptitude', 'Boats and Streams', 'apt-boats-streams', 'Hard', 0, 45, '{"apt-time-speed-distance"}'::text[], '{"Boats", "Relative Speed"}'::text[]),
('aptitude', 'Permutations', 'apt-permutations', 'Medium', 0, 45, '{}'::text[], '{"Counting", "Math"}'::text[]),
('aptitude', 'Combinations', 'apt-combinations', 'Medium', 0, 45, '{"apt-permutations"}'::text[], '{"Counting", "Math"}'::text[]),
('aptitude', 'Probability', 'apt-probability', 'Hard', 0, 60, '{"apt-combinations"}'::text[], '{"Probability", "Chance"}'::text[]),
('aptitude', 'Data Interpretation', 'apt-data-interpretation', 'Medium', 0, 60, '{"apt-percentages", "apt-ratio-proportion"}'::text[], '{"Graphs", "Charts"}'::text[]),
('aptitude', 'Data Sufficiency', 'apt-data-sufficiency', 'Hard', 0, 45, '{}'::text[], '{"Analysis", "Sufficiency"}'::text[]),
('aptitude', 'Algebra', 'apt-algebra', 'Medium', 0, 45, '{}'::text[], '{"Equations", "Algebra"}'::text[]),
('aptitude', 'Geometry', 'apt-geometry', 'Medium', 0, 45, '{}'::text[], '{"Shapes", "Angles"}'::text[]),
('aptitude', 'Mensuration', 'apt-mensuration', 'Hard', 0, 60, '{"apt-geometry"}'::text[], '{"Area", "Volume"}'::text[]),
('aptitude', 'Ages', 'apt-ages', 'Easy', 0, 30, '{"apt-ratio-proportion"}'::text[], '{"Ages", "Equations"}'::text[]),
('aptitude', 'Clocks', 'apt-clocks', 'Medium', 0, 45, '{}'::text[], '{"Time", "Angles"}'::text[]),
('aptitude', 'Calendars', 'apt-calendars', 'Medium', 0, 45, '{}'::text[], '{"Dates", "Odd Days"}'::text[]),
('aptitude', 'Simplification', 'apt-simplification', 'Easy', 0, 20, '{}'::text[], '{"Basic Math", "Calculation"}'::text[]),
('aptitude', 'Series', 'apt-series', 'Medium', 0, 30, '{}'::text[], '{"Patterns", "Numbers"}'::text[]),
('aptitude', 'Progressions', 'apt-progressions', 'Hard', 0, 60, '{"apt-series"}'::text[], '{"AP", "GP", "HP"}'::text[]);

-- Seed Taxonomy Topics for Logical Reasoning
INSERT INTO public.assessment_topics (category_slug, name, slug, difficulty, question_count, estimated_time_minutes, prerequisite_topics, skill_tags) VALUES
('logical', 'Number Series', 'log-number-series', 'Easy', 0, 30, '{}'::text[], '{"Logic", "Patterns"}'::text[]),
('logical', 'Alphabet Series', 'log-alphabet-series', 'Easy', 0, 30, '{}'::text[], '{"Alphabets", "Logic"}'::text[]),
('logical', 'Coding-Decoding', 'log-coding-decoding', 'Medium', 0, 45, '{}'::text[], '{"Cipher", "Code"}'::text[]),
('logical', 'Blood Relations', 'log-blood-relations', 'Medium', 0, 45, '{}'::text[], '{"Family", "Relations"}'::text[]),
('logical', 'Direction Sense', 'log-direction-sense', 'Easy', 0, 30, '{}'::text[], '{"Directions", "Angles"}'::text[]),
('logical', 'Seating Arrangement', 'log-seating-arrangement', 'Hard', 0, 60, '{}'::text[], '{"Arrangement", "Seating"}'::text[]),
('logical', 'Linear Arrangement', 'log-linear-arrangement', 'Medium', 0, 45, '{"log-seating-arrangement"}'::text[], '{"Linear", "Arrangement"}'::text[]),
('logical', 'Circular Arrangement', 'log-circular-arrangement', 'Hard', 0, 60, '{"log-seating-arrangement"}'::text[], '{"Circular", "Arrangement"}'::text[]),
('logical', 'Puzzles', 'log-puzzles', 'Hard', 0, 90, '{}'::text[], '{"Logic", "Puzzles"}'::text[]),
('logical', 'Syllogisms', 'log-syllogisms', 'Medium', 0, 45, '{}'::text[], '{"Deduction", "Logic"}'::text[]),
('logical', 'Statements and Conclusions', 'log-statements-conclusions', 'Medium', 0, 30, '{}'::text[], '{"Verbal Logic", "Conclusions"}'::text[]),
('logical', 'Statements and Assumptions', 'log-statements-assumptions', 'Hard', 0, 45, '{}'::text[], '{"Verbal Logic", "Assumptions"}'::text[]),
('logical', 'Data Sufficiency', 'log-data-sufficiency', 'Hard', 0, 45, '{}'::text[], '{"Sufficiency", "Analysis"}'::text[]),
('logical', 'Venn Diagrams', 'log-venn-diagrams', 'Medium', 0, 30, '{}'::text[], '{"Venn", "Sets"}'::text[]),
('logical', 'Logical Deduction', 'log-logical-deduction', 'Medium', 0, 45, '{}'::text[], '{"Deduction", "Inference"}'::text[]),
('logical', 'Analogy', 'log-analogy', 'Easy', 0, 20, '{}'::text[], '{"Analogy", "Relations"}'::text[]),
('logical', 'Classification', 'log-classification', 'Easy', 0, 20, '{}'::text[], '{"Groups", "Classification"}'::text[]),
('logical', 'Odd One Out', 'log-odd-one-out', 'Easy', 0, 20, '{}'::text[], '{"Logic", "Odd Item"}'::text[]),
('logical', 'Ranking', 'log-ranking', 'Easy', 0, 30, '{}'::text[], '{"Ranking", "Order"}'::text[]),
('logical', 'Scheduling', 'log-scheduling', 'Hard', 0, 60, '{}'::text[], '{"Time", "Scheduling"}'::text[]),
('logical', 'Input Output', 'log-input-output', 'Hard', 0, 60, '{}'::text[], '{"Traces", "Patterns"}'::text[]),
('logical', 'Decision Making', 'log-decision-making', 'Medium', 0, 45, '{}'::text[], '{"Decisions", "Rules"}'::text[]);

-- Seed Taxonomy Topics for Verbal Ability
INSERT INTO public.assessment_topics (category_slug, name, slug, difficulty, question_count, estimated_time_minutes, prerequisite_topics, skill_tags) VALUES
('verbal', 'Reading Comprehension', 'verb-reading-comprehension', 'Hard', 0, 90, '{}'::text[], '{"Reading", "Comprehension"}'::text[]),
('verbal', 'Sentence Correction', 'verb-sentence-correction', 'Medium', 0, 40, '{}'::text[], '{"Grammar", "Syntax"}'::text[]),
('verbal', 'Grammar', 'verb-grammar', 'Easy', 0, 30, '{}'::text[], '{"Grammar", "Rules"}'::text[]),
('verbal', 'Vocabulary', 'verb-vocabulary', 'Easy', 0, 20, '{}'::text[], '{"Words", "Synonyms"}'::text[]),
('verbal', 'Synonyms', 'verb-synonyms', 'Easy', 0, 15, '{"verb-vocabulary"}'::text[], '{"Words", "Synonyms"}'::text[]),
('verbal', 'Antonyms', 'verb-antonyms', 'Easy', 0, 15, '{"verb-vocabulary"}'::text[], '{"Words", "Antonyms"}'::text[]),
('verbal', 'Para Jumbles', 'verb-para-jumbles', 'Hard', 0, 60, '{}'::text[], '{"Coherence", "Order"}'::text[]),
('verbal', 'Sentence Completion', 'verb-sentence-completion', 'Easy', 0, 30, '{"verb-vocabulary"}'::text[], '{"Sentence", "Context"}'::text[]),
('verbal', 'Error Detection', 'verb-error-detection', 'Medium', 0, 45, '{"verb-grammar"}'::text[], '{"Syntax", "Error"}'::text[]),
('verbal', 'Fill in the Blanks', 'verb-fill-blanks', 'Easy', 0, 20, '{"verb-vocabulary"}'::text[], '{"Context", "Blanks"}'::text[]),
('verbal', 'Idioms', 'verb-idioms', 'Medium', 0, 30, '{}'::text[], '{"Phrases", "Idioms"}'::text[]),
('verbal', 'One Word Substitution', 'verb-substitution', 'Easy', 0, 20, '{"verb-vocabulary"}'::text[], '{"Substitution", "Phrases"}'::text[]),
('verbal', 'Critical Reasoning', 'verb-critical-reasoning', 'Hard', 0, 60, '{}'::text[], '{"Logic", "Critical Thinking"}'::text[]),
('verbal', 'Cloze Tests', 'verb-cloze-tests', 'Medium', 0, 45, '{"verb-grammar", "verb-vocabulary"}'::text[], '{"Reading", "Blanks"}'::text[]),
('verbal', 'Verbal Analogies', 'verb-verbal-analogies', 'Easy', 0, 20, '{}'::text[], '{"Analogies", "Logic"}'::text[]);

-- Seed Taxonomy Topics for Coding
INSERT INTO public.assessment_topics (category_slug, name, slug, difficulty, question_count, estimated_time_minutes, prerequisite_topics, skill_tags) VALUES
('coding', 'Programming Fundamentals', 'code-fundamentals', 'Easy', 0, 60, '{}'::text[], '{"Fundamentals", "Syntax"}'::text[]),
('coding', 'Variables', 'code-variables', 'Easy', 0, 20, '{"code-fundamentals"}'::text[], '{"Variables", "Types"}'::text[]),
('coding', 'Conditions', 'code-conditions', 'Easy', 0, 20, '{"code-fundamentals"}'::text[], '{"Conditionals", "Logic"}'::text[]),
('coding', 'Loops', 'code-loops', 'Easy', 0, 30, '{"code-conditions"}'::text[], '{"Loops", "Iteration"}'::text[]),
('coding', 'Functions', 'code-functions', 'Easy', 0, 30, '{"code-fundamentals"}'::text[], '{"Methods", "Functions"}'::text[]),
('coding', 'Arrays', 'code-arrays', 'Easy', 0, 45, '{"code-loops"}'::text[], '{"Data Structures", "Arrays"}'::text[]),
('coding', 'Strings', 'code-strings', 'Easy', 0, 45, '{"code-arrays"}'::text[], '{"Data Structures", "Strings"}'::text[]),
('coding', 'Hashing', 'code-hashing', 'Medium', 0, 60, '{"code-arrays"}'::text[], '{"Data Structures", "HashMap"}'::text[]),
('coding', 'Sorting', 'code-sorting', 'Medium', 0, 60, '{"code-arrays"}'::text[], '{"Algorithms", "Sorting"}'::text[]),
('coding', 'Searching', 'code-searching', 'Easy', 0, 45, '{"code-arrays"}'::text[], '{"Algorithms", "Searching"}'::text[]),
('coding', 'Two Pointers', 'code-two-pointers', 'Medium', 0, 60, '{"code-arrays"}'::text[], '{"Patterns", "Arrays"}'::text[]),
('coding', 'Sliding Window', 'code-sliding-window', 'Medium', 0, 60, '{"code-arrays"}'::text[], '{"Patterns", "Subarrays"}'::text[]),
('coding', 'Recursion', 'code-recursion', 'Medium', 0, 60, '{"code-functions"}'::text[], '{"Recursion", "Logic"}'::text[]),
('coding', 'Backtracking', 'code-backtracking', 'Hard', 0, 90, '{"code-recursion"}'::text[], '{"Algorithms", "Backtracking"}'::text[]),
('coding', 'Linked Lists', 'code-linked-lists', 'Medium', 0, 60, '{"code-variables"}'::text[], '{"Data Structures", "Pointers"}'::text[]),
('coding', 'Stacks', 'code-stacks', 'Medium', 0, 45, '{"code-linked-lists"}'::text[], '{"Data Structures", "LIFO"}'::text[]),
('coding', 'Queues', 'code-queues', 'Medium', 0, 45, '{"code-linked-lists"}'::text[], '{"Data Structures", "FIFO"}'::text[]),
('coding', 'Trees', 'code-trees', 'Medium', 0, 90, '{"code-recursion"}'::text[], '{"Data Structures", "N-ary Trees"}'::text[]),
('coding', 'Binary Search Trees', 'code-bst', 'Medium', 0, 60, '{"code-trees"}'::text[], '{"Data Structures", "BST"}'::text[]),
('coding', 'Heaps', 'code-heaps', 'Hard', 0, 60, '{"code-trees"}'::text[], '{"Data Structures", "Priority Queue"}'::text[]),
('coding', 'Graphs', 'code-graphs', 'Hard', 0, 120, '{"code-trees"}'::text[], '{"Data Structures", "Graphs"}'::text[]),
('coding', 'BFS', 'code-bfs', 'Medium', 0, 65, '{"code-graphs"}'::text[], '{"Algorithms", "Traversal"}'::text[]),
('coding', 'DFS', 'code-dfs', 'Medium', 0, 65, '{"code-graphs"}'::text[], '{"Algorithms", "Traversal"}'::text[]),
('coding', 'Dynamic Programming', 'code-dp', 'Hard', 0, 180, '{"code-recursion"}'::text[], '{"Algorithms", "Memoization"}'::text[]),
('coding', 'Greedy Algorithms', 'code-greedy', 'Medium', 0, 25, '{}'::text[], '{"Algorithms", "Greedy"}'::text[]),
('coding', 'Bit Manipulation', 'code-bit-manipulation', 'Medium', 0, 45, '{}'::text[], '{"Bitwise", "Optimization"}'::text[]),
('coding', 'Mathematical Programming', 'code-math-prog', 'Medium', 0, 45, '{}'::text[], '{"Math", "Prime Numbers"}'::text[]),
('coding', 'Object-Oriented Programming', 'code-oop', 'Easy', 0, 60, '{}'::text[], '{"OOP", "Classes"}'::text[]),
('coding', 'Debugging', 'code-debugging', 'Easy', 0, 30, '{}'::text[], '{"Troubleshooting", "Errors"}'::text[]),
('coding', 'Complexity Analysis', 'code-complexity', 'Easy', 0, 30, '{}'::text[], '{"Big O", "Performance"}'::text[]);

-- Seed Taxonomy Topics for SQL
INSERT INTO public.assessment_topics (category_slug, name, slug, difficulty, question_count, estimated_time_minutes, prerequisite_topics, skill_tags) VALUES
('sql', 'SELECT', 'sql-select', 'Easy', 0, 20, '{}'::text[], '{"DML", "Select"}'::text[]),
('sql', 'WHERE', 'sql-where', 'Easy', 0, 20, '{"sql-select"}'::text[], '{"Filters", "Where"}'::text[]),
('sql', 'ORDER BY', 'sql-order-by', 'Easy', 0, 20, '{"sql-select"}'::text[], '{"Sorting", "Order"}'::text[]),
('sql', 'GROUP BY', 'sql-group-by', 'Medium', 0, 30, '{"sql-where"}'::text[], '{"Aggregation", "Group"}'::text[]),
('sql', 'HAVING', 'sql-having', 'Medium', 0, 30, '{"sql-group-by"}'::text[], '{"Filters", "Having"}'::text[]),
('sql', 'DISTINCT', 'sql-distinct', 'Easy', 0, 15, '{"sql-select"}'::text[], '{"Distinct", "Sets"}'::text[]),
('sql', 'Aggregate Functions', 'sql-aggregates', 'Easy', 0, 30, '{"sql-select"}'::text[], '{"SUM", "AVG", "COUNT"}'::text[]),
('sql', 'Joins', 'sql-joins', 'Medium', 0, 45, '{"sql-where"}'::text[], '{"Relationships", "Joins"}'::text[]),
('sql', 'Subqueries', 'sql-subqueries', 'Medium', 0, 45, '{"sql-select"}'::text[], '{"Nested Queries", "Subqueries"}'::text[]),
('sql', 'CTE', 'sql-cte', 'Medium', 0, 40, '{"sql-subqueries"}'::text[], '{"CTE", "With Clause"}'::text[]),
('sql', 'CASE', 'sql-case', 'Medium', 0, 15, '{"sql-select"}'::text[], '{"Conditional", "Case"}'::text[]),
('sql', 'Window Functions', 'sql-window-functions', 'Hard', 0, 60, '{"sql-select"}'::text[], '{"Window", "Over Clause"}'::text[]),
('sql', 'Ranking Functions', 'sql-ranking-functions', 'Medium', 0, 45, '{"sql-window-functions"}'::text[], '{"Rank", "Dense Rank"}'::text[]),
('sql', 'String Functions', 'sql-strings', 'Easy', 0, 15, '{}'::text[], '{"Strings", "Formatting"}'::text[]),
('sql', 'Date Functions', 'sql-dates', 'Easy', 0, 15, '{}'::text[], '{"Dates", "Intervals"}'::text[]),
('sql', 'NULL Handling', 'sql-null-handling', 'Easy', 0, 15, '{}'::text[], '{"Nulls", "Coalesce"}'::text[]),
('sql', 'Set Operations', 'sql-set-operations', 'Medium', 0, 20, '{}'::text[], '{"Union", "Intersect", "Except"}'::text[]),
('sql', 'Constraints', 'sql-constraints', 'Easy', 0, 15, '{}'::text[], '{"Keys", "Constraints"}'::text[]),
('sql', 'DDL', 'sql-ddl', 'Easy', 0, 20, '{}'::text[], '{"Create", "Alter", "Drop"}'::text[]),
('sql', 'DML', 'sql-dml', 'Easy', 0, 20, '{}'::text[], '{"Insert", "Update", "Delete"}'::text[]),
('sql', 'Indexes', 'sql-indexes', 'Medium', 0, 15, '{}'::text[], '{"Performance", "Indexes"}'::text[]),
('sql', 'Transactions', 'sql-transactions', 'Hard', 0, 20, '{}'::text[], '{"ACID", "Commit", "Rollback"}'::text[]),
('sql', 'Query Optimization', 'sql-optimization', 'Hard', 0, 25, '{"sql-indexes"}'::text[], '{"Explain", "Optimization"}'::text[]);
