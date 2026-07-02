import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getCompanyPrepBySlug,
  getUserCompanyRoadmap,
  saveUserCompanyRoadmap,
  incrementCompanyPrepView,
  trackCompanyPrepAttempt
} from '@/lib/db/company-prep';
import { COMPANY_PREP_LIST } from '@/lib/company-prep-data';
import { generateResponse } from '@/lib/ai/router';

export const dynamic = 'force-dynamic';

// GET: Fetches company prep details (metadata + rounds + resources) and user roadmap if authenticated
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const role = searchParams.get('role');

    if (!slug) {
      return NextResponse.json({ success: false, message: 'Slug is required.' }, { status: 400 });
    }

    // 1. Fetch from database helper
    let companyPrep = await getCompanyPrepBySlug(slug);
    let isFallback = false;

    // 2. Fallback to static list if database is empty/unseeded
    if (!companyPrep) {
      const fallbackData = COMPANY_PREP_LIST.find(c => c.slug === slug);
      if (fallbackData) {
        isFallback = true;
        // Format static data to match DB structure
        companyPrep = {
          id: fallbackData.slug, // Mock UUID
          slug: fallbackData.slug,
          name: fallbackData.name,
          overview: fallbackData.overview,
          difficulty: fallbackData.difficulty,
          salary_range: fallbackData.salaryRange,
          roles_hired: fallbackData.rolesHired,
          must_have_skills: fallbackData.mustHaveSkills,
          good_to_have_skills: fallbackData.goodToHaveSkills,
          bonus_skills: fallbackData.bonusSkills,
          package_value: fallbackData.packageValue,
          active_rounds: fallbackData.activeRounds,
          eligibility_cgpa: fallbackData.eligibility.includes('CGPA') ? parseFloat(fallbackData.eligibility.match(/\d+\.\d+/)?.[0] || '6.0') : 6.0,
          eligibility_branches: fallbackData.eligibility.includes('BTech') ? ['Computer Science', 'Information Technology', 'Software Engineering'] : [],
          eligibility_criteria: fallbackData.eligibility,
          hiring_frequency: 'Annual',
          is_active: true,
          role_details: fallbackData.roleDetails || {},
          rounds: fallbackData.hiringProcess.map((r, idx) => ({
            id: `round-${idx}`,
            round_number: idx + 1,
            name: r.name,
            duration: r.duration,
            difficulty: r.difficulty,
            tips: r.tips
          })),
          resources: [
            { id: 'res-1', name: `${fallbackData.name} Placement Playbook 2026.pdf`, type: 'pdf', url: 'https://example.com/playbook.pdf', description: 'Comprehensive review of patterns.', round_number: 1 },
            { id: 'res-2', name: `${fallbackData.name} OA Practice Sheet.xlsx`, type: 'sheet', url: 'https://example.com/sheet.xlsx', description: 'Solved quantitative questions.', round_number: 1 },
            { id: 'res-3', name: `${fallbackData.name} DSA Coding Questions.pdf`, type: 'pdf', url: 'https://example.com/dsa.pdf', description: 'Algorithmic dynamic codes.', round_number: 2 },
            { id: 'res-4', name: `${fallbackData.name} HR Behavioral STAR Bank.pdf`, type: 'pdf', url: 'https://example.com/star.pdf', description: 'Behavioral responses.', round_number: 3 }
          ]
        };
      }
    }

    if (!companyPrep) {
      return NextResponse.json({ success: false, message: 'Company preparation playbook not found.' }, { status: 404 });
    }

    // Increment views analytics (non-blocking) in database if not fallback
    if (!isFallback && companyPrep.id) {
      incrementCompanyPrepView(companyPrep.id).catch(console.error);
    }

    // 3. If user is authenticated, query user roadmap
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    let userRoadmap = null;

    if (user && !isFallback && companyPrep.id) {
      const targetRole = role || companyPrep.roles_hired?.[0] || 'Software Engineer';
      userRoadmap = await getUserCompanyRoadmap(user.id, companyPrep.id, targetRole, supabase);
    }

    return NextResponse.json({
      success: true,
      data: companyPrep,
      userRoadmap: userRoadmap ? userRoadmap.personalized_roadmap : null,
      isFallback
    });
  } catch (err: any) {
    console.error('[Student Company Prep GET] Error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}

// POST: AI Personalized Roadmap Creator
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Sign in required.' }, { status: 401 });
    }

    const body = await request.json();
    const { companyPrepId, targetRole, userSkills, placementReadinessIndex } = body;

    if (!companyPrepId || !targetRole) {
      return NextResponse.json({ success: false, message: 'Missing companyPrepId or targetRole.' }, { status: 400 });
    }

    // Get API Key from header or environment
    const headerApiKey = request.headers.get('x-gemini-api-key');
    const apiKey = headerApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: 'Gemini API Key is missing. Configure it in settings or env variables.' },
        { status: 401 }
      );
    }

    // 1. Fetch metadata & round processes from DB
    const { data: prep } = await supabase
      .from('company_preps')
      .select('*')
      .eq('id', companyPrepId)
      .maybeSingle();

    if (!prep) {
      return NextResponse.json({ success: false, message: 'Company prep configuration not found.' }, { status: 404 });
    }

    const { data: rounds } = await supabase
      .from('company_prep_rounds')
      .select('*')
      .eq('company_prep_id', companyPrepId)
      .order('round_number', { ascending: true });

    const { data: resources } = await supabase
      .from('company_prep_resources')
      .select('*')
      .eq('company_prep_id', companyPrepId);

    let activeRounds = rounds || [];
    let activeResources = resources || [];
    let mustHaveSkills = prep.must_have_skills || [];
    let goodToHaveSkills = prep.good_to_have_skills || [];
    let bonusSkills = prep.bonus_skills || [];

    const roleDetail = prep.role_details?.[targetRole] || {};
    if (roleDetail && Object.keys(roleDetail).length > 0) {
      if (roleDetail.hiringProcess || roleDetail.rounds) {
        const customRounds = roleDetail.hiringProcess || roleDetail.rounds;
        activeRounds = customRounds.map((r: any, idx: number) => ({
          round_number: r.round_number || (idx + 1),
          name: r.name,
          difficulty: r.difficulty || 'Medium',
          tips: r.tips || ''
        }));
      }
      if (roleDetail.resources) {
        activeResources = roleDetail.resources;
      }
      if (roleDetail.mustHaveSkills || roleDetail.must_have_skills) {
        mustHaveSkills = roleDetail.mustHaveSkills || roleDetail.must_have_skills;
      }
      if (roleDetail.goodToHaveSkills || roleDetail.good_to_have_skills) {
        goodToHaveSkills = roleDetail.goodToHaveSkills || roleDetail.good_to_have_skills;
      }
      if (roleDetail.bonusSkills || roleDetail.bonus_skills) {
        bonusSkills = roleDetail.bonusSkills || roleDetail.bonus_skills;
      }
    }

    // 2. Formulate Grounded AI Prompt
    const systemPrompt = `You are a Senior Technical Career Coach customizing a week-by-week preparation roadmap for a candidate targeting ${prep.name} for the role of "${targetRole}".

USER PROFILE STATS:
- Candidate Skills: ${userSkills && userSkills.length > 0 ? userSkills.join(', ') : 'Not specified'}
- Candidate Placement Readiness index: ${placementReadinessIndex || 50}%

TARGET ROLE REQUIREMENT:
- Must Have Skills: ${mustHaveSkills.join(', ')}
- Good to Have Skills: ${goodToHaveSkills.join(', ')}
- Bonus Skills: ${bonusSkills.join(', ')}

ADMIN-DEFINED HIRING TIMELINE & PROCESS FOR ${prep.name} (Role: ${targetRole}):
${activeRounds.map(r => `Round ${r.round_number || r.roundNumber}: ${r.name} (Difficulty: ${r.difficulty}) - Tips: ${r.tips}`).join('\n')}

ROUND-SPECIFIC STUDY vault RESOURCES LINKED BY ADMIN:
${activeResources.map(res => `- ${res.name} (Type: ${res.type}) for Round ${res.round_number || res.roundNumber} - Description: ${res.description}`).join('\n')}

INSTRUCTIONS:
1. Generate a personalized week-by-week preparation roadmap tailored specifically to the candidate's skills and readiness.
2. Target candidate skill gaps relative to the job requirements and outline coding practices.
3. GROUNDING CONSTRAINT: You MUST align your roadmap directly to the admin-defined hiring rounds listed above. Do NOT invent, append, or modify any interview rounds, tests, or stages.
4. Reference the exact admin resources by name in the "resourcesSuggested" array where appropriate.
5. Return ONLY pure valid JSON matching the schema. Do NOT include markdown code blocks.`;

    const responseSchema = {
      type: 'OBJECT',
      properties: {
        targetRole: { type: 'STRING' },
        companyName: { type: 'STRING' },
        personalizedRoadmap: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              week: { type: 'STRING' }, // e.g. "Week 1", "Week 2"
              focusRound: { type: 'STRING' }, // Must match one of the admin-defined round names
              focusTopics: { type: 'ARRAY', items: { type: 'STRING' } },
              actionPlan: { type: 'STRING' }, // Personal actions highlighting gaps
              resourcesSuggested: { type: 'ARRAY', items: { type: 'STRING' } } // Names of admin resources
            },
            required: ['week', 'focusRound', 'focusTopics', 'actionPlan']
          }
        }
      },
      required: ['targetRole', 'companyName', 'personalizedRoadmap']
    };

    // 3. Call AI Gateway
    const gatewayResponse = await generateResponse({
      provider: 'gemini',
      prompt: systemPrompt,
      apiKey,
      responseMimeType: 'application/json',
      responseSchema,
      temperature: 0.2,
      taskType: 'company_prep_roadmap'
    });

    if (!gatewayResponse.success || !gatewayResponse.text) {
      return NextResponse.json(
        { success: false, message: `AI Gateway failed: ${gatewayResponse.error || 'Invalid response.'}` },
        { status: 500 }
      );
    }

    const result = JSON.parse(gatewayResponse.text.trim());

    // 4. Save User Roadmap to DB
    const saveResult = await saveUserCompanyRoadmap(user.id, companyPrepId, targetRole, result, supabase);
    if (!saveResult.success) {
      console.error('Error saving user company roadmap:', saveResult.error);
    }

    // Increment attempts counter
    trackCompanyPrepAttempt(companyPrepId).catch(console.error);

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error('[Student Company Prep POST] Error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
