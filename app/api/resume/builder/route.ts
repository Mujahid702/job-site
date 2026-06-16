import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'
import { generateResponse } from '@/lib/ai/router'

export const dynamic = 'force-dynamic'

const builderInputSchema = z.object({
  action: z.enum(['latex', 'structure', 'optimize-jd']),
  text: z.string().trim().max(75000, 'Raw text input exceeds the 75,000 character limit.').optional().nullable(),
  profileData: z.any().optional().nullable(),
  jdText: z.string().trim().max(75000, 'Job description input exceeds the 75,000 character limit.').optional().nullable(),
  templateId: z.string().optional().nullable(),
  targetRole: z.string().trim().max(100).optional().nullable(),
})

// Helper to escape special LaTeX characters to guarantee compilation on Overleaf
function escapeLatex(text: string): string {
  if (!text) return ''
  return text
    .replace(/\\/g, '\\\\')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/~/g, '\\textasciitilde')
    .replace(/\^/g, '\\textasciicircum')
}

// Generate LaTeX templates
function generateTemplateLatex(profile: any, templateId: string): string {
  const name = escapeLatex(profile.name || 'John Doe')
  const email = escapeLatex(profile.email || 'john.doe@example.com')
  const phone = escapeLatex(profile.phone || '+1-123-456-7890')
  const linkedin = escapeLatex(profile.linkedin || '')
  const github = escapeLatex(profile.github || '')
  const portfolio = escapeLatex(profile.portfolio || '')
  const summary = escapeLatex(profile.summary || '')

  const headerContact = [
    phone ? `${phone}` : null,
    email ? `\\href{mailto:${email}}{${email}}` : null,
    linkedin ? `\\href{https://${linkedin}}{LinkedIn}` : null,
    github ? `\\href{https://${github}}{GitHub}` : null,
    portfolio ? `\\href{https://${portfolio}}{Portfolio}` : null,
  ]
    .filter(Boolean)
    .join(' \\textbullet{} ')

  let latex = `\\documentclass[letterpaper,10pt]{article}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}

\\pagestyle{fancy}
\\fancyhf{} % clear all header and footer fields
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

% Adjust margins
\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1.0in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}

\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Sections formatting
\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

%-------------------------
% Custom commands
\\newcommand{\\resumeItem}[2]{
  \\item\\small{
    \\textbf{#1}{: #2 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeItemWithoutTitle}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-1pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small#4} \\\\
    \\end{tabular*}\\vspace{-5pt}
}

\\newcommand{\\resumeSubItem}[2]{\\resumeItem{#1}{#2}\\vspace{-4pt}}

\\renewcommand{\\labelitemii}{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=*]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

%-------------------------------------------
\\\\%%%%%%  CV STARTS HERE  %%%%%%%%%%%%%%%%%%%%%%%%%%%%


\\begin{document}

%----------HEADING-----------------
\\begin{center}
  \\textbf{\\Huge ${name}} \\\\
  \\vspace{5pt}
  ${headerContact}
\\end{center}

`

  // Summary Section
  if (summary) {
    latex += `%-----------SUMMARY-----------
\\section{Professional Summary}
\\small{${summary}}
\\vspace{5pt}

`
  }

  // Helper to build sections based on order
  const buildEducation = () => {
    if (!profile.education || profile.education.length === 0) return ''
    let section = `%-----------EDUCATION-----------
\\section{Education}
\\resumeSubHeadingListStart
`
    profile.education.forEach((edu: any) => {
      const school = escapeLatex(edu.school)
      const degree = escapeLatex(edu.degree)
      const major = escapeLatex(edu.major)
      const loc = escapeLatex(edu.location)
      const date = escapeLatex(edu.date)
      const gpa = escapeLatex(edu.gpa)
      section += `  \\resumeSubheading
    {${school}}{${loc}}
    {${degree} in ${major}${gpa ? `; GPA: ${gpa}` : ''}}{${date}}
`
    })
    section += `\\resumeSubHeadingListEnd
\\vspace{5pt}

`
    return section
  }

  const buildSkills = () => {
    if (!profile.skills || profile.skills.length === 0) return ''
    let section = `%-----------SKILLS-----------
\\section{Technical Skills}
\\begin{itemize}[leftmargin=*]
  \\small{\\item{
`
    profile.skills.forEach((group: any) => {
      const cat = escapeLatex(group.category)
      const items = (group.items || []).map(escapeLatex).join(', ')
      section += `    \\textbf{${cat}}{: ${items}} \\\\
`
    })
    // Remove last newline and backslash if present
    section = section.replace(/\\\\ \n$/, '\n')
    section += `  }}
\\end{itemize}
\\vspace{5pt}

`
    return section
  }

  const buildExperience = () => {
    if (!profile.experience || profile.experience.length === 0) return ''
    let section = `%-----------EXPERIENCE-----------
\\section{Experience}
\\resumeSubHeadingListStart
`
    profile.experience.forEach((exp: any) => {
      const company = escapeLatex(exp.company)
      const role = escapeLatex(exp.role)
      const loc = escapeLatex(exp.location)
      const date = escapeLatex(exp.date)
      const bullets = exp.description || []

      section += `  \\resumeSubheading
    {${company}}{${loc}}
    {${role}}{${date}}
`
      if (bullets.length > 0) {
        section += `  \\resumeItemListStart
`
        bullets.forEach((bullet: string) => {
          section += `    \\item ${escapeLatex(bullet)}
`
        })
        section += `  \\resumeItemListEnd
`
      }
    })
    section += `\\resumeSubHeadingListEnd
\\vspace{5pt}

`
    return section
  }

  const buildProjects = () => {
    if (!profile.projects || profile.projects.length === 0) return ''
    let section = `%-----------PROJECTS-----------
\\section{Projects}
\\resumeSubHeadingListStart
`
    profile.projects.forEach((proj: any) => {
      const title = escapeLatex(proj.title)
      const role = escapeLatex(proj.role || 'Developer')
      const tech = (proj.technologies || []).map(escapeLatex).join(', ')
      const bullets = proj.description || []

      section += `  \\resumeSubheading
    {${title}}{}
    {${role}${tech ? ` | Technologies: ${tech}` : ''}}{}
`
      if (bullets.length > 0) {
        section += `  \\resumeItemListStart
`
        bullets.forEach((bullet: string) => {
          section += `    \\item ${escapeLatex(bullet)}
`
        })
        section += `  \\resumeItemListEnd
`
      }
    })
    section += `\\resumeSubHeadingListEnd
\\vspace{5pt}

`
    return section
  }

  const buildCertifications = () => {
    if (!profile.certifications || profile.certifications.length === 0) return ''
    let section = `%-----------CERTIFICATIONS-----------
\\section{Certifications}
\\begin{itemize}[leftmargin=*]
  \\small{\\item{
`
    profile.certifications.forEach((cert: string) => {
      section += `    \\textbullet{} ${escapeLatex(cert)} \\\\
`
    })
    section = section.replace(/\\\\ \n$/, '\n')
    section += `  }}
\\end{itemize}
\\vspace{5pt}

`
    return section
  }

  const buildAchievements = () => {
    if (!profile.achievements || profile.achievements.length === 0) return ''
    let section = `%-----------ACHIEVEMENTS-----------
\\section{Achievements}
\\begin{itemize}[leftmargin=*]
  \\small{\\item{
`
    profile.achievements.forEach((ach: string) => {
      section += `    \\textbullet{} ${escapeLatex(ach)} \\\\
`
    })
    section = section.replace(/\\\\ \n$/, '\n')
    section += `  }}
\\end{itemize}
\\vspace{5pt}

`
    return section
  }

  // Determine section ordering based on templateId
  if (templateId === '6') {
    // Fresher special: Education first, then skills, projects, experience, certs, achievements
    latex += buildEducation()
    latex += buildSkills()
    latex += buildProjects()
    latex += buildExperience()
    latex += buildCertifications()
    latex += buildAchievements()
  } else if (templateId === '2' || templateId === '4') {
    // Software Engineer / Data Science: Skills first, experience, projects, education, certs
    latex += buildSkills()
    latex += buildExperience()
    latex += buildProjects()
    latex += buildEducation()
    latex += buildCertifications()
    latex += buildAchievements()
  } else {
    // Classic/Minimal: Experience first, projects, education, skills, certs
    latex += buildExperience()
    latex += buildProjects()
    latex += buildEducation()
    latex += buildSkills()
    latex += buildCertifications()
    latex += buildAchievements()
  }

  latex += `\\end{document}\n`
  return latex
}

export async function POST(request: Request) {
  try {
    // 1. Rate limiting check (20 requests/hour)
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    const limitResult = await rateLimit(ip, 'builder')
    if (!limitResult.success) {
      return NextResponse.json(
        { success: false, message: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: limitResult.headers }
      )
    }

    // 2. Validate inputs
    const body = await request.json().catch(() => ({}))
    const validation = builderInputSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid input fields.',
          errors: validation.error.flatten(),
        },
        { status: 400, headers: limitResult.headers }
      )
    }

    const { action, text, profileData, jdText, templateId, targetRole } = validation.data

    // Handle latex generation directly without API key requirement
    if (action === 'latex') {
      if (!profileData) {
        return NextResponse.json(
          { success: false, message: 'Missing profileData for LaTeX generation.' },
          { status: 400, headers: limitResult.headers }
        )
      }
      const latexCode = generateTemplateLatex(profileData, templateId || '1')
      return NextResponse.json(
        { success: true, latexCode },
        { status: 200, headers: limitResult.headers }
      )
    }

    // Retrieve Gemini API Key from headers or environment
    const headerApiKey = request.headers.get('x-gemini-api-key')
    const apiKey = headerApiKey || process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message: 'Gemini API Key is missing. Please configure it in your environment.',
          needsKey: true,
        },
        { status: 401, headers: limitResult.headers }
      )
    }

    if (action === 'structure') {
      if (!text || !text.trim()) {
        return NextResponse.json(
          { success: false, message: 'Missing text content to structure.' },
          { status: 400, headers: limitResult.headers }
        )
      }

      const systemPrompt = `You are a premium ATS Resume parser. Parse and reorganize the raw resume text into a highly structured JSON format.
CRITICAL DIRECTIONS:
1. Extract name, email, phone, linkedin, github, portfolio.
2. Group all parsed skills into logical categories (e.g. Languages, Frameworks, Databases, Tools).
3. Extract education history, including school, degree, major, location, date, gpa.
4. Extract work experience details, listing company, role, location, dates, and separate description bullet points (clean up phrasing, start with strong verbs, fix spelling).
5. Extract project history, listing title, role, technologies, and separate description bullets.
6. Extract certifications and achievements into flat arrays of strings.
7. Write a professional, concise 3-4 sentence professional summary based on the parsed credentials.`

      const schema = {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          email: { type: 'STRING' },
          phone: { type: 'STRING' },
          linkedin: { type: 'STRING' },
          github: { type: 'STRING' },
          portfolio: { type: 'STRING' },
          summary: { type: 'STRING' },
          education: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                school: { type: 'STRING' },
                degree: { type: 'STRING' },
                major: { type: 'STRING' },
                location: { type: 'STRING' },
                date: { type: 'STRING' },
                gpa: { type: 'STRING' },
              },
              required: ['school', 'degree', 'major', 'date'],
            },
          },
          skills: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                category: { type: 'STRING' },
                items: { type: 'ARRAY', items: { type: 'STRING' } },
              },
              required: ['category', 'items'],
            },
          },
          projects: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                title: { type: 'STRING' },
                role: { type: 'STRING' },
                description: { type: 'ARRAY', items: { type: 'STRING' } },
                technologies: { type: 'ARRAY', items: { type: 'STRING' } },
              },
              required: ['title', 'description', 'technologies'],
            },
          },
          experience: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                company: { type: 'STRING' },
                role: { type: 'STRING' },
                location: { type: 'STRING' },
                date: { type: 'STRING' },
                description: { type: 'ARRAY', items: { type: 'STRING' } },
              },
              required: ['company', 'role', 'date', 'description'],
            },
          },
          certifications: { type: 'ARRAY', items: { type: 'STRING' } },
          achievements: { type: 'ARRAY', items: { type: 'STRING' } },
        },
        required: [
          'name',
          'email',
          'phone',
          'summary',
          'education',
          'skills',
          'projects',
          'experience',
        ],
      }

      const payload = {
        contents: [{ parts: [{ text: `${systemPrompt}\n\nRAW TEXT:\n${text}` }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 0.1,
        },
      }

      const res = await callGemini(payload, apiKey, 'structure')
      return NextResponse.json(
        { success: true, data: res },
        { status: 200, headers: limitResult.headers }
      )
    }

    if (action === 'optimize-jd') {
      if (!profileData || !jdText) {
        return NextResponse.json(
          { success: false, message: 'Missing profileData or jdText to optimize.' },
          { status: 400, headers: limitResult.headers }
        )
      }

      const systemPrompt = `You are a premium career consultant. Review the structured resume JSON profileData and the target job description (JD), and optimize the content for maximum matching index score.
CRITICAL DIRECTIONS:
1. Re-write the professional summary to align with the JD, highlighting key matching skills.
2. Group and order the skills categories based on what the JD prioritizes.
3. Align project and experience description bullets to focus on JD keywords and inject suggested metrics placeholders in brackets (e.g. "[Insert Performance Improvement]%").
4. Maintain all core credentials, do not make up fake job titles or credentials.
5. Return the full structured profile data matching the schema.`

      // Re-use the exact same schema structure for validation
      const schema = {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          email: { type: 'STRING' },
          phone: { type: 'STRING' },
          linkedin: { type: 'STRING' },
          github: { type: 'STRING' },
          portfolio: { type: 'STRING' },
          summary: { type: 'STRING' },
          education: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                school: { type: 'STRING' },
                degree: { type: 'STRING' },
                major: { type: 'STRING' },
                location: { type: 'STRING' },
                date: { type: 'STRING' },
                gpa: { type: 'STRING' },
              },
              required: ['school', 'degree', 'major', 'date'],
            },
          },
          skills: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                category: { type: 'STRING' },
                items: { type: 'ARRAY', items: { type: 'STRING' } },
              },
              required: ['category', 'items'],
            },
          },
          projects: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                title: { type: 'STRING' },
                role: { type: 'STRING' },
                description: { type: 'ARRAY', items: { type: 'STRING' } },
                technologies: { type: 'ARRAY', items: { type: 'STRING' } },
              },
              required: ['title', 'description', 'technologies'],
            },
          },
          experience: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                company: { type: 'STRING' },
                role: { type: 'STRING' },
                location: { type: 'STRING' },
                date: { type: 'STRING' },
                description: { type: 'ARRAY', items: { type: 'STRING' } },
              },
              required: ['company', 'role', 'date', 'description'],
            },
          },
          certifications: { type: 'ARRAY', items: { type: 'STRING' } },
          achievements: { type: 'ARRAY', items: { type: 'STRING' } },
        },
        required: [
          'name',
          'email',
          'phone',
          'summary',
          'education',
          'skills',
          'projects',
          'experience',
        ],
      }

      const payload = {
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}\n\nRESUME DATA:\n${JSON.stringify(profileData)}\n\nJOB DESCRIPTION:\n${jdText}`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 0.2,
        },
      }

      const res = await callGemini(payload, apiKey, 'optimize-jd')
      return NextResponse.json(
        { success: true, data: res },
        { status: 200, headers: limitResult.headers }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action type.' },
      { status: 400, headers: limitResult.headers }
    )
  } catch (err: any) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to run LaTeX Resume Builder API.'
    console.error('Resume Builder API error:', err)
    return NextResponse.json(
      { success: false, message: 'Temporary issue. Please try again.' },
      { status: 500 }
    )
  }
}

async function callGemini(payload: any, apiKey: string, taskType: string): Promise<any> {
  const prompt = payload.contents?.[0]?.parts?.[0]?.text || '';
  const systemInstruction = payload.systemInstruction?.parts?.[0]?.text;
  const config = payload.generationConfig || {};

  const gatewayResponse = await generateResponse({
    provider: 'gemini',
    prompt,
    systemInstruction,
    apiKey,
    responseMimeType: config.responseMimeType,
    responseSchema: config.responseSchema,
    temperature: config.temperature,
    taskType: `resume_builder:${taskType}`,
  });

  if (!gatewayResponse.success) {
    throw new Error(`AI generation failed: ${gatewayResponse.error}`);
  }

  const textResponse = gatewayResponse.text;

  if (!textResponse) {
    throw new Error('Invalid response structure from Gemini API.');
  }

  return JSON.parse(textResponse.trim());
}
