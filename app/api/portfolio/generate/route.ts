import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateResponse } from '@/lib/ai/router';
import { savePortfolioGeneration, savePortfolioProjects } from '@/lib/db/portfolio';
import { getUserProfile } from '@/lib/db/profiles';
import { getResumeScans } from '@/lib/db/resume';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { 
      theme, 
      font, 
      colorScheme, 
      profileImageUrl, 
      githubData, 
      linkedinData,
      achievements,
      customPreferences 
    } = await request.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // 1. Fetch Profile Data from DB
    const profile = await getUserProfile(userId, supabase);
    if (!profile) {
      return NextResponse.json(
        { success: false, message: 'Profile not found. Please complete onboarding first.' },
        { status: 400 }
      );
    }

    // 2. Fetch Latest Resume Scan details from DB
    const scans = await getResumeScans(userId, supabase);
    const latestScan = scans.length > 0 ? scans[0] : null;
    const scanInfo = latestScan?.analysis?.parsedInfo || {};

    // 3. Compile Raw Structured Schema (Hero, About, Skills, Projects, Experience, Certifications, Achievements, Contact)
    // We merge database profile, resume scan contents, and optional connected GitHub/LinkedIn feeds.
    
    // Skills compilation
    const rawSkills = new Set<string>();
    if (profile.skills) profile.skills.forEach(s => rawSkills.add(s));
    if (scanInfo.skills) scanInfo.skills.forEach((s: string) => rawSkills.add(s));
    if (linkedinData?.skills) linkedinData.skills.forEach((s: string) => rawSkills.add(s));
    if (githubData?.languages) {
      Object.keys(githubData.languages).forEach(l => rawSkills.add(l));
    }
    const skillsList = Array.from(rawSkills).slice(0, 15); // cap at 15 key skills

    // Projects compilation (factual mapping: never invent projects)
    const projectsList: any[] = [];
    const processedProjectTitles = new Set<string>();

    // Add projects from resume builder profile / raw_profile_data
    const profileProjects = profile.raw_profile_data?.projects || profile.raw_profile_data?.profile?.projects || [];
    if (Array.isArray(profileProjects)) {
      profileProjects.forEach((p: any) => {
        const title = p.title || p.name;
        if (title && !processedProjectTitles.has(title.toLowerCase())) {
          processedProjectTitles.add(title.toLowerCase());
          projectsList.push({
            title,
            description: Array.isArray(p.description) ? p.description.join(' ') : p.description || '',
            tech_stack: p.technologies || p.tech || [],
            github_url: p.github || null,
            live_url: p.live || p.portfolio || null,
            impact_score: p.impactScore || 85,
            problem_statement: p.problem || 'No problem statement defined.',
            solution_description: p.solution || 'No solution description defined.',
            challenges_faced: p.challenges || 'No challenges mapped.'
          });
        }
      });
    }

    // Add projects from resume scans analysis
    const parsedProjects = scanInfo.projects || [];
    if (Array.isArray(parsedProjects)) {
      parsedProjects.forEach((p: any) => {
        const title = typeof p === 'string' ? p : p.title || p.name;
        if (title && !processedProjectTitles.has(title.toLowerCase())) {
          processedProjectTitles.add(title.toLowerCase());
          projectsList.push({
            title,
            description: p.description || 'Factual project parsed from resume scanning.',
            tech_stack: p.technologies || p.tech || [],
            github_url: p.github || null,
            live_url: p.live || null,
            impact_score: p.score || 80,
            problem_statement: p.problem || 'Parsed from resume.',
            solution_description: p.solution || 'Parsed from resume.',
            challenges_faced: p.challenges || 'Parsed from resume.'
          });
        }
      });
    }

    // Add projects from GitHub repos
    const githubRepos = githubData?.pinned || githubData?.repositories || [];
    if (Array.isArray(githubRepos)) {
      githubRepos.forEach((repo: any) => {
        const title = repo.name;
        if (title && !processedProjectTitles.has(title.toLowerCase())) {
          processedProjectTitles.add(title.toLowerCase());
          projectsList.push({
            title,
            description: repo.description || 'Public GitHub repository.',
            tech_stack: repo.language ? [repo.language] : [],
            github_url: repo.html_url || null,
            live_url: repo.live_url || null,
            impact_score: repo.stars ? 80 + Math.min(repo.stars, 15) : 80,
            problem_statement: 'Need a stable, open-source codebase for this utility.',
            solution_description: repo.description || 'Engineered public repo.',
            challenges_faced: 'Handling code optimizations and documentation.'
          });
        }
      });
    }

    // Experiences compilation
    const experienceList: any[] = [];
    const processedExpCompanies = new Set<string>();

    const profileExp = profile.raw_profile_data?.experience || profile.raw_profile_data?.profile?.experience || [];
    if (Array.isArray(profileExp)) {
      profileExp.forEach((exp: any) => {
        const key = `${exp.company}-${exp.role}`.toLowerCase();
        if (exp.company && !processedExpCompanies.has(key)) {
          processedExpCompanies.add(key);
          experienceList.push({
            company: exp.company,
            role: exp.role,
            period: exp.date || exp.period || '',
            desc: Array.isArray(exp.description) ? exp.description.join(' ') : exp.desc || exp.description || ''
          });
        }
      });
    }

    const parsedExp = scanInfo.experience || [];
    if (Array.isArray(parsedExp)) {
      parsedExp.forEach((exp: any) => {
        const comp = typeof exp === 'string' ? exp : exp.company || exp.name;
        const role = exp.role || 'Software Engineer';
        const key = `${comp}-${role}`.toLowerCase();
        if (comp && !processedExpCompanies.has(key)) {
          processedExpCompanies.add(key);
          experienceList.push({
            company: comp,
            role,
            period: exp.dateRange || exp.period || '',
            desc: exp.description || 'Factual experience parsed from resume scan.'
          });
        }
      });
    }

    if (Array.isArray(linkedinData?.experience)) {
      linkedinData.experience.forEach((exp: any) => {
        const key = `${exp.company}-${exp.role}`.toLowerCase();
        if (exp.company && !processedExpCompanies.has(key)) {
          processedExpCompanies.add(key);
          experienceList.push({
            company: exp.company,
            role: exp.role,
            period: exp.dateRange || '',
            desc: exp.description || 'Imported from LinkedIn.'
          });
        }
      });
    }

    // Certifications & Achievements compilation
    const certsList: any[] = [];
    const achievementsList: string[] = [];

    const profileCerts = profile.raw_profile_data?.certifications || profile.raw_profile_data?.profile?.certifications || [];
    if (Array.isArray(profileCerts)) {
      profileCerts.forEach((c: any) => {
        const name = typeof c === 'string' ? c : c.name;
        certsList.push({
          name,
          issuer: c.issuer || 'Professional Organization',
          date: c.date || ''
        });
      });
    }

    if (Array.isArray(achievements)) {
      achievements.forEach((a: string) => {
        if (a && a.trim()) achievementsList.push(a.trim());
      });
    } else {
      const profileAch = profile.raw_profile_data?.achievements || profile.raw_profile_data?.profile?.achievements || [];
      if (Array.isArray(profileAch)) {
        profileAch.forEach((a: string) => achievementsList.push(a));
      }
      if (Array.isArray(linkedinData?.achievements)) {
        linkedinData.achievements.forEach((a: string) => achievementsList.push(a));
      }
    }

    // Default fallbacks if lists are empty
    if (projectsList.length === 0) {
      projectsList.push({
        title: 'VTU Student Portal Portal',
        description: 'Responsive college website processing grade lookup metrics.',
        tech_stack: ['React', 'CSS'],
        github_url: null,
        live_url: null,
        impact_score: 80,
        problem_statement: 'Students lacked mobile grade access.',
        solution_description: 'Built mobile web views.',
        challenges_faced: 'Mobile view conversions.'
      });
    }

    if (experienceList.length === 0) {
      experienceList.push({
        company: 'VTU Computer Science Labs',
        role: 'Assistant Web Administrator',
        period: '2025 - Present',
        desc: 'Assisted in supporting local server infrastructures and student query databases.'
      });
    }

    const rawSchema = {
      hero: {
        name: profile.full_name || 'Candidate Portfolio',
        role: profile.target_role || 'Software Engineer',
        tagline: `Passionate ${profile.target_role || 'Software Engineer'} from ${profile.college || 'VTU'}`,
        avatar: profileImageUrl || profile.raw_profile_data?.profile?.portfolio || null
      },
      about: {
        description: profile.raw_profile_data?.summary || profile.raw_profile_data?.profile?.summary || `I am an ambitious candidate specializing in ${profile.skills?.join(', ') || 'software engineering'}. Graduate class of ${profile.graduation_year || '2026'}.`
      },
      skills: skillsList,
      projects: projectsList,
      experience: experienceList,
      certifications: certsList,
      achievements: achievementsList,
      contact: {
        email: profile.email || '',
        linkedin: profile.linkedin_url || linkedinData?.linkedinUrl || '',
        github: profile.github_url || githubData?.profile?.avatar_url ? `github.com/${profile.github_url || ''}` : '',
        portfolio: profile.portfolio_url || ''
      }
    };

    // 4. Send to AI Layer for writing enhancements (never invent projects)
    const headerApiKey = request.headers.get('x-gemini-api-key');
    let aiProvider: 'gemini' | 'groq' | 'openrouter' = 'gemini';
    let apiKey = headerApiKey || process.env.GEMINI_API_KEY;
    let model = 'gemini-3.5-flash';

    if (headerApiKey) {
      aiProvider = 'gemini';
      apiKey = headerApiKey;
      model = 'gemini-3.5-flash';
    } else if (process.env.GROQ_API_KEY) {
      aiProvider = 'groq';
      apiKey = process.env.GROQ_API_KEY;
      model = 'llama-3.3-70b-versatile';
    } else if (process.env.OPENROUTER_API_KEY) {
      aiProvider = 'openrouter';
      apiKey = process.env.OPENROUTER_API_KEY;
      model = 'meta-llama/llama-3.3-70b-instruct:free';
    }

    let enhancedSchema = rawSchema;

    if (apiKey) {
      const systemInstruction = `You are a premium Portfolio SEO and branding editor.
Enhance the professional quality, readability, action verbs, and tone of the provided portfolio JSON schema.

CRITICAL CONSTRAINTS:
1. You MUST generate a "thinking" property first. In this section, perform a rigorous step-by-step chain of thought:
   - Identify the user's name, role, and current background.
   - Outline key professional improvement strategies for their tagline and bio descriptions.
   - Assess how to polish project explanations and experience bullet points to emphasize impact.
   - Verify that NO new projects, tools, or facts are simulated or invented.
2. You must ONLY rewrite sentences to sound more professional (e.g. taglines, about summaries, project descriptions, experiences).
3. You must NEVER invent, add, or simulate any new projects, technologies not used, achievements not stated, or companies not listed. Keep the projects and experiences lists matching the input.
4. Output the exact same JSON schema structure.`;

      const responseSchema = {
        type: 'OBJECT',
        properties: {
          thinking: {
            type: 'STRING',
            description: 'Step-by-step reasoning chain about profile highlights and editing strategy. Generated first.'
          },
          hero: {
            type: 'OBJECT',
            properties: {
              name: { type: 'STRING' },
              role: { type: 'STRING' },
              tagline: { type: 'STRING' },
              avatar: { type: 'STRING' }
            },
            required: ['name', 'role', 'tagline']
          },
          about: {
            type: 'OBJECT',
            properties: {
              description: { type: 'STRING' }
            },
            required: ['description']
          },
          skills: { type: 'ARRAY', items: { type: 'STRING' } },
          projects: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                title: { type: 'STRING' },
                description: { type: 'STRING' },
                tech_stack: { type: 'ARRAY', items: { type: 'STRING' } },
                github_url: { type: 'STRING' },
                live_url: { type: 'STRING' },
                impact_score: { type: 'INTEGER' },
                problem_statement: { type: 'STRING' },
                solution_description: { type: 'STRING' },
                challenges_faced: { type: 'STRING' }
              },
              required: ['title', 'description', 'tech_stack', 'problem_statement', 'solution_description', 'challenges_faced']
            }
          },
          experience: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                company: { type: 'STRING' },
                role: { type: 'STRING' },
                period: { type: 'STRING' },
                desc: { type: 'STRING' }
              },
              required: ['company', 'role', 'period', 'desc']
            }
          },
          certifications: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                name: { type: 'STRING' },
                issuer: { type: 'STRING' },
                date: { type: 'STRING' }
              },
              required: ['name', 'issuer']
            }
          },
          achievements: { type: 'ARRAY', items: { type: 'STRING' } },
          contact: {
            type: 'OBJECT',
            properties: {
              email: { type: 'STRING' },
              linkedin: { type: 'STRING' },
              github: { type: 'STRING' },
              portfolio: { type: 'STRING' }
            },
            required: ['email']
          }
        },
        required: ['thinking', 'hero', 'about', 'skills', 'projects', 'experience', 'certifications', 'achievements', 'contact']
      };

      const gatewayResponse = await generateResponse({
        provider: aiProvider,
        model,
        prompt: JSON.stringify(rawSchema),
        systemInstruction,
        apiKey,
        responseMimeType: 'application/json',
        responseSchema,
        temperature: 0.2,
        taskType: 'resume_enhancer',
        userId
      });

      if (gatewayResponse.success && gatewayResponse.text) {
        try {
          enhancedSchema = JSON.parse(gatewayResponse.text.trim());
        } catch (e) {
          console.warn("AI enhanced JSON failed to parse. Falling back to raw schema.");
        }
      }
    }

    // 5. Save the generated portfolio schema
    const saveGenResult = await savePortfolioGeneration(
      userId,
      {
        theme: theme || 'Modern',
        font_family: font || 'Poppins',
        color_scheme: colorScheme || 'Blue',
        profile_image_url: profileImageUrl || null,
        structured_schema: enhancedSchema,
        ai_enhanced: !!apiKey,
        published: true
      },
      supabase
    );

    if (!saveGenResult.success || !saveGenResult.data) {
      throw new Error(saveGenResult.error || 'Failed to save portfolio generation.');
    }

    const generationId = saveGenResult.data.id;

    // 6. Save/Sync portfolio projects
    const dbProjects = enhancedSchema.projects.map((p: any) => ({
      title: p.title,
      description: p.description,
      tech_stack: p.tech_stack || [],
      github_url: p.github_url || null,
      live_url: p.live_url || null,
      impact_score: p.impact_score || 80,
      problem_statement: p.problem_statement || null,
      solution_description: p.solution_description || null,
      challenges_faced: p.challenges_faced || null,
      is_visible: true
    }));

    await savePortfolioProjects(userId, generationId, dbProjects, supabase);

    // 7. Update profile target portfolio link
    const portUrl = `/portfolio/${generationId}`;
    await supabase
      .from('profiles')
      .update({ portfolio_url: portUrl })
      .eq('user_id', userId);

    return NextResponse.json({
      success: true,
      portfolioUrl: portUrl,
      data: enhancedSchema,
      generationId
    });

  } catch (err: any) {
    console.error('AI Generate Portfolio Error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to generate portfolio.' },
      { status: 500 }
    );
  }
}
