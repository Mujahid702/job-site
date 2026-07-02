-- SQL Migration to seed the 4 categories of Placement Gamification Engine missions

-- Clean up outdated master missions (cascades to user_missions)
TRUNCATE TABLE public.placement_missions RESTART IDENTITY CASCADE;

-- Seed Category 1: Profile Missions (auto-verified)
INSERT INTO public.placement_missions (id, title, description, category, mission_type, xp_reward, pri_reward, target_value) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Complete Onboarding', 'Complete the student onboarding profile setup process.', 'profile', 'career', 50, 5, 1),
  ('00000000-0000-0000-0000-000000000002', 'Upload Resume', 'Scan and upload your placement resume to get an ATS assessment.', 'profile', 'career', 40, 5, 1),
  ('00000000-0000-0000-0000-000000000003', 'Add LinkedIn Profile', 'Link your professional LinkedIn account url to your profile.', 'profile', 'career', 30, 3, 1),
  ('00000000-0000-0000-0000-000000000004', 'Add GitHub Profile', 'Link your active GitHub profile url to your profile.', 'profile', 'career', 30, 3, 1),
  ('00000000-0000-0000-0000-000000000005', 'Create Portfolio', 'Link your personal web portfolio url to your profile.', 'profile', 'career', 75, 8, 1),
  ('00000000-0000-0000-0000-000000000006', 'Portfolio completion above 80%', 'Achieve a profile/portfolio completion rating of 80% or above.', 'profile', 'career', 50, 5, 1);

-- Seed Category 2: Learning Missions (proof required)
INSERT INTO public.placement_missions (id, title, description, category, mission_type, xp_reward, pri_reward, target_value) VALUES
  ('00000000-0000-0000-0000-000000000007', 'Upload DSA Certificate', 'Verify and upload a DSA course or practice certificate.', 'learning', 'career', 100, 10, 1),
  ('00000000-0000-0000-0000-000000000008', 'Upload Cloud Certificate', 'Verify and upload an AWS, GCP, or Azure Cloud certificate.', 'learning', 'career', 150, 15, 1),
  ('00000000-0000-0000-0000-000000000009', 'Upload SQL Certificate', 'Verify and upload a SQL or database systems certificate.', 'learning', 'career', 100, 10, 1),
  ('00000000-0000-0000-0000-000000000010', 'Complete Company Prep OS', 'Finish a complete company-specific preparation track.', 'learning', 'career', 75, 8, 1),
  ('00000000-0000-0000-0000-000000000011', 'Finish Project Advisor roadmap', 'Generate and complete a placement project architecture roadmap.', 'learning', 'career', 100, 10, 1),
  ('00000000-0000-0000-0000-000000000012', 'Resume ATS score above 85', 'Score 85 or above in the Resume Builder ATS scanner.', 'learning', 'career', 75, 8, 1),
  ('00000000-0000-0000-0000-000000000013', 'JD Match score above 80', 'Score 80 or above in a Job Description keywords match.', 'learning', 'career', 50, 5, 1);

-- Seed Category 3: Application Missions
INSERT INTO public.placement_missions (id, title, description, category, mission_type, xp_reward, pri_reward, target_value) VALUES
  ('00000000-0000-0000-0000-000000000014', 'Save First Job', 'Track your first job application inside the CRM.', 'applications', 'career', 10, 2, 1),
  ('00000000-0000-0000-0000-000000000015', 'Apply to 5 Jobs', 'Submit active applications to 5 different companies.', 'applications', 'career', 40, 5, 5),
  ('00000000-0000-0000-0000-000000000016', 'Apply to 20 Jobs', 'Submit active applications to 20 different companies.', 'applications', 'career', 100, 12, 20),
  ('00000000-0000-0000-0000-000000000017', 'Track First Interview', 'Progress to the interview stage in the CRM dashboard.', 'applications', 'career', 75, 8, 1),
  ('00000000-0000-0000-0000-000000000018', 'Reach HR Round', 'Advance to the final HR interview round for an application.', 'applications', 'career', 150, 15, 1),
  ('00000000-0000-0000-0000-000000000019', 'Receive Offer Letter', 'Get a verified job offer letter from an employer.', 'applications', 'career', 1000, 30, 1),
  ('00000000-0000-0000-0000-000000000020', 'Join Company', 'Accept the offer and officially join the company.', 'applications', 'career', 2500, 50, 1);

-- Seed Category 4: Community Missions
INSERT INTO public.placement_missions (id, title, description, category, mission_type, xp_reward, pri_reward, target_value) VALUES
  ('00000000-0000-0000-0000-000000000021', 'First Community Post', 'Write and publish your first forum post in the community hubs.', 'community', 'career', 20, 2, 1),
  ('00000000-0000-0000-0000-000000000022', 'First Helpful Answer', 'Post a helpful reply to a peer query in community discussion.', 'community', 'career', 25, 2, 1),
  ('00000000-0000-0000-0000-000000000023', 'Receive 10 Upvotes', 'Earn 10 upvotes on your shared posts/replies.', 'community', 'career', 50, 5, 10),
  ('00000000-0000-0000-0000-000000000024', 'Receive 50 Upvotes', 'Earn 50 upvotes on your shared posts/replies.', 'community', 'career', 150, 10, 50),
  ('00000000-0000-0000-0000-000000000025', 'Community Contributor Badge', 'Unlock the special Community Contributor milestone badge.', 'community', 'career', 300, 15, 1);
