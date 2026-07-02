-- Migration: Rebuild Action Center into Placement Command Center configurations
-- This updates the project_companies table to support Admin configurations for hiring processes, role requirements, and skill weightages.

ALTER TABLE public.project_companies 
ADD COLUMN IF NOT EXISTS hiring_process text[] DEFAULT ARRAY['Online Assessment', 'Technical Interview', 'HR Round'],
ADD COLUMN IF NOT EXISTS role_requirements text[] DEFAULT ARRAY['CGPA >= 7.0', 'No active backlogs'],
ADD COLUMN IF NOT EXISTS skill_weightages jsonb DEFAULT '{}'::jsonb;

-- Seed default weightages and details for existing target companies
UPDATE public.project_companies
SET hiring_process = ARRAY['Online Coding Assessment', 'System Design Round', 'Bar Raiser Round', 'HM Interview'],
    role_requirements = ARRAY['CGPA >= 7.5', 'B.Tech/M.Tech in CS/IT', '1+ advanced projects built'],
    skill_weightages = '{"Java": 35, "AWS": 25, "DynamoDB": 20, "Messaging Queues": 20}'::jsonb
WHERE name = 'Amazon';

UPDATE public.project_companies
SET hiring_process = ARRAY['Aptitude & English Test', 'Technical Interview', 'HR Discussion'],
    role_requirements = ARRAY['CGPA >= 6.5', 'No active backlogs', 'Completed TCS Prep modules'],
    skill_weightages = '{"Java": 40, "Spring Boot": 30, "REST APIs": 15, "Oracle DB": 15}'::jsonb
WHERE name = 'TCS';

UPDATE public.project_companies
SET hiring_process = ARRAY['Case Study Round', 'Managerial Technical Round', 'Partner Round'],
    role_requirements = ARRAY['CGPA >= 7.0', 'Excellent communications', 'Power BI Dashboard built'],
    skill_weightages = '{"Python": 30, "Power BI": 30, "SQL": 20, "Cloud Analytics": 20}'::jsonb
WHERE name = 'Deloitte';
