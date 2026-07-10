-- ==========================================================
-- 011_rls_data_isolation.sql
-- ==========================================================

-- 1. Enable RLS on all user-owned public tables if not already enabled
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.roadmap_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.placement_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.resume_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.jd_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.mentor_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.application_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.resume_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.placement_readiness ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.portfolio_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.student_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.interview_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.recruiter_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.recruiter_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.recruiter_ratings ENABLE ROW LEVEL SECURITY;

-- Assessment RLS
ALTER TABLE IF EXISTS public.assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.assessment_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.assessment_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.assessment_leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.assessment_ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.assessment_certificates ENABLE ROW LEVEL SECURITY;

-- 2. Drop unsafe "using (true)" or loose policies
DROP POLICY IF EXISTS "Allow read own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Allow admin write subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Allow read own limits" ON public.user_usage_limits;
DROP POLICY IF EXISTS "Allow modify own limits" ON public.user_usage_limits;
DROP POLICY IF EXISTS "Allow read own devices" ON public.user_devices;
DROP POLICY IF EXISTS "Allow write own devices" ON public.user_devices;
DROP POLICY IF EXISTS "Allow insert security events" ON public.security_events;
DROP POLICY IF EXISTS "Allow read own security events" ON public.security_events;
DROP POLICY IF EXISTS "Allow insert telemetry" ON public.feature_telemetry;
DROP POLICY IF EXISTS "Allow read own telemetry" ON public.feature_telemetry;
DROP POLICY IF EXISTS "Allow read submissions" ON public.assessment_submissions;
DROP POLICY IF EXISTS "Allow user modify submissions" ON public.assessment_submissions;
DROP POLICY IF EXISTS "Allow user access streaks" ON public.assessment_streaks;

-- Assessment OS drops
DROP POLICY IF EXISTS "Allow user access attempts" ON public.assessment_attempts;
DROP POLICY IF EXISTS "Allow user access answers" ON public.assessment_answers;
DROP POLICY IF EXISTS "Allow user access results" ON public.assessment_results;
DROP POLICY IF EXISTS "Allow user access progress" ON public.assessment_progress;
DROP POLICY IF EXISTS "Allow read leaderboards" ON public.assessment_leaderboards;
DROP POLICY IF EXISTS "Allow user access feedback" ON public.assessment_ai_feedback;
DROP POLICY IF EXISTS "Allow user access certificates" ON public.assessment_certificates;

-- 3. Create secure policies for monthly limits, subscriptions, and telemetry (text user_id columns)
CREATE POLICY "Allow read own subscription" ON public.user_subscriptions
  FOR SELECT USING (auth.uid()::text = user_id OR public.is_admin());

CREATE POLICY "Allow admin write subscription" ON public.user_subscriptions
  FOR ALL USING (auth.uid()::text = user_id OR public.is_admin());

CREATE POLICY "Allow read own limits" ON public.user_usage_limits
  FOR SELECT USING (auth.uid()::text = user_id OR public.is_admin());

CREATE POLICY "Allow modify own limits" ON public.user_usage_limits
  FOR ALL USING (auth.uid()::text = user_id OR public.is_admin());

CREATE POLICY "Allow read own devices" ON public.user_devices
  FOR SELECT USING (auth.uid()::text = user_id OR public.is_admin());

CREATE POLICY "Allow write own devices" ON public.user_devices
  FOR ALL USING (auth.uid()::text = user_id OR public.is_admin());

CREATE POLICY "Allow insert security events" ON public.security_events
  FOR INSERT WITH CHECK (auth.uid()::text = user_id OR public.is_admin());

CREATE POLICY "Allow read own security events" ON public.security_events
  FOR SELECT USING (auth.uid()::text = user_id OR public.is_admin());

CREATE POLICY "Allow insert telemetry" ON public.feature_telemetry
  FOR INSERT WITH CHECK (auth.uid()::text = user_id OR public.is_admin());

CREATE POLICY "Allow read own telemetry" ON public.feature_telemetry
  FOR SELECT USING (auth.uid()::text = user_id OR public.is_admin());

CREATE POLICY "Allow read own assessment submissions" ON public.assessment_submissions
  FOR SELECT USING (auth.uid()::text = user_id OR public.is_admin());

CREATE POLICY "Allow user modify own submissions" ON public.assessment_submissions
  FOR ALL USING (auth.uid()::text = user_id OR public.is_admin());

CREATE POLICY "Allow user access own streaks" ON public.assessment_streaks
  FOR ALL USING (auth.uid()::text = user_id OR public.is_admin());

-- Assessment OS secure policies
CREATE POLICY "Allow user access attempts" ON public.assessment_attempts
  FOR ALL USING (auth.uid()::text = user_id OR public.is_admin());

CREATE POLICY "Allow user access answers" ON public.assessment_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.assessment_attempts a
      WHERE a.id = attempt_id AND (a.user_id = auth.uid()::text OR public.is_admin())
    )
  );

CREATE POLICY "Allow user access results" ON public.assessment_results
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.assessment_attempts a
      WHERE a.id = attempt_id AND (a.user_id = auth.uid()::text OR public.is_admin())
    )
  );

CREATE POLICY "Allow user access progress" ON public.assessment_progress
  FOR ALL USING (auth.uid()::text = user_id OR public.is_admin());

CREATE POLICY "Allow read leaderboards" ON public.assessment_leaderboards
  FOR SELECT USING (true);

CREATE POLICY "Allow user access own leaderboards" ON public.assessment_leaderboards
  FOR ALL USING (auth.uid()::text = user_id OR public.is_admin());

CREATE POLICY "Allow user access feedback" ON public.assessment_ai_feedback
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.assessment_attempts a
      WHERE a.id = attempt_id AND (a.user_id = auth.uid()::text OR public.is_admin())
    )
  );

CREATE POLICY "Allow read certificates" ON public.assessment_certificates
  FOR SELECT USING (true);

CREATE POLICY "Allow user access own certificates" ON public.assessment_certificates
  FOR ALL USING (auth.uid()::text = user_id OR public.is_admin());

-- 4. Recreate/create secure policies for all standard UUID tables
DROP POLICY IF EXISTS "Users can operate on own profile" ON public.profiles;
CREATE POLICY "Users can operate on own profile" ON public.profiles
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can operate on own saved jobs" ON public.saved_jobs;
CREATE POLICY "Users can operate on own saved jobs" ON public.saved_jobs
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can operate on own roadmap progress" ON public.roadmap_progress;
CREATE POLICY "Users can operate on own roadmap progress" ON public.roadmap_progress
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can operate on own placement scores" ON public.placement_scores;
CREATE POLICY "Users can operate on own placement scores" ON public.placement_scores
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can operate on own resume scans" ON public.resume_scans;
CREATE POLICY "Users can operate on own resume scans" ON public.resume_scans
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can operate on own jd matches" ON public.jd_matches;
CREATE POLICY "Users can operate on own jd matches" ON public.jd_matches
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can operate on own mentor bookings" ON public.mentor_bookings;
CREATE POLICY "Users can operate on own mentor bookings" ON public.mentor_bookings
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can operate on own applications" ON public.applications;
CREATE POLICY "Users can operate on own applications" ON public.applications
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can operate on own application history" ON public.application_history;
CREATE POLICY "Users can operate on own application history" ON public.application_history
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can operate on own resume analytics" ON public.resume_analytics;
CREATE POLICY "Users can operate on own resume analytics" ON public.resume_analytics
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can operate on own readiness score" ON public.placement_readiness;
CREATE POLICY "Users can operate on own readiness score" ON public.placement_readiness
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can operate on own user missions" ON public.user_missions;
CREATE POLICY "Users can operate on own user missions" ON public.user_missions
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can operate on own user xp" ON public.user_xp;
CREATE POLICY "Users can operate on own user xp" ON public.user_xp
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can operate on own portfolio generations" ON public.portfolio_generations;
CREATE POLICY "Users can operate on own portfolio generations" ON public.portfolio_generations
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can operate on own portfolio projects" ON public.portfolio_projects;
CREATE POLICY "Users can operate on own portfolio projects" ON public.portfolio_projects
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can operate on own student projects" ON public.student_projects;
CREATE POLICY "Users can operate on own student projects" ON public.student_projects
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can operate on own referrals" ON public.referrals;
CREATE POLICY "Users can operate on own referrals" ON public.referrals
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can operate on own streaks" ON public.user_streaks;
CREATE POLICY "Users can operate on own streaks" ON public.user_streaks
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can operate on own interview sessions" ON public.interview_sessions;
CREATE POLICY "Users can operate on own interview sessions" ON public.interview_sessions
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can operate on own interview answers" ON public.interview_answers;
CREATE POLICY "Users can operate on own interview answers" ON public.interview_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.interview_sessions s
      WHERE s.id = session_id AND (s.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Users can operate on own recruiter verifications" ON public.recruiter_verifications;
CREATE POLICY "Users can operate on own recruiter verifications" ON public.recruiter_verifications
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can operate on own recruiter reports" ON public.recruiter_reports;
CREATE POLICY "Users can operate on own recruiter reports" ON public.recruiter_reports
  FOR ALL USING (auth.uid() = reporter_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can operate on own recruiter ratings" ON public.recruiter_ratings;
CREATE POLICY "Users can operate on own recruiter ratings" ON public.recruiter_ratings
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- 5. Community Tables policies
DROP POLICY IF EXISTS "Anyone can select community posts" ON public.community_posts;
CREATE POLICY "Anyone can select community posts" ON public.community_posts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can modify own community posts" ON public.community_posts;
CREATE POLICY "Users can modify own community posts" ON public.community_posts
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Anyone can select community comments" ON public.community_comments;
CREATE POLICY "Anyone can select community comments" ON public.community_comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can modify own community comments" ON public.community_comments;
CREATE POLICY "Users can modify own community comments" ON public.community_comments
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can view reports" ON public.community_reports;
CREATE POLICY "Admins can view reports" ON public.community_reports
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Users can submit reports" ON public.community_reports;
CREATE POLICY "Users can submit reports" ON public.community_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);
