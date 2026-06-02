/* eslint-disable @typescript-eslint/no-explicit-any */
// Core Publisher abstraction and channel implementations for job distribution

export interface Publisher {
  generate(jobData: any, options: { websiteUrl: string; templateId?: string }): string;
}

export class WhatsAppPublisher implements Publisher {
  generate(jobData: any, options: { websiteUrl: string; templateId?: 'A' | 'B' | 'C' }): string {
    const templateId = options.templateId || 'B';
    const company = jobData.company_name || 'Unknown Company';
    const role = jobData.drive_title || 'Software Developer';
    
    // Eligibility formatting: extract first 2 brief bullet points or keep it ultra-short and clean
    let eligibility = 'Any Graduate / B.E. / B.Tech / MCA';
    if (jobData.eligibility_criteria) {
      const cleanElig = this.stripHtmlAndMarkdown(jobData.eligibility_criteria);
      const bullets = cleanElig.split(/[•\n]/).map(b => b.trim()).filter(b => b.length > 2);
      if (bullets.length > 0) {
        eligibility = bullets.slice(0, 2).join(' / ');
      } else {
        eligibility = cleanElig;
      }
      
      if (eligibility.length > 80) {
        eligibility = eligibility.substring(0, 80).trim() + '...';
      }
    }

    const location = jobData.location || 'Across India / Remote';
    const salary = jobData.salary_range || 'Best in Industry';
    const website_job_url = options.websiteUrl;

    // Selection process formatting: strictly 3-4 concise points
    let selection_process_formatted = `✅ Online Assessment\n✅ Technical Interview\n✅ HR Round`;
    if (jobData.selection_process) {
      const cleanedProcess = this.stripHtmlAndMarkdown(jobData.selection_process);
      const lines = cleanedProcess.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 2 && !line.match(/^[=\-*•_~\s]*$/))
        .map(line => line.replace(/^[\d+.\-*•✅\s\t]+/, '').trim())
        .filter(line => line.length > 2)
        .slice(0, 4); // strictly max 4 items
        
      if (lines.length > 0) {
        selection_process_formatted = lines.map(line => `✅ ${line}`).join('\n');
      }
    }

    if (templateId === 'A') {
      // Template A: Concise Alert Format
      return `🚀 *Freshers Hiring Alert*

🏢 *Company:* ${company}

💼 *Role:* ${role}

🎓 *Eligibility:* ${eligibility}

📍 *Location:* ${location}

💰 *Salary:* ${salary}

🔗 *Full Details & Apply:*
${website_job_url}

⏳ *Apply Early*

📢 *Share With Friends*`;
    }

    if (templateId === 'C') {
      // Template C: High Engagement / FOMO Alert (still clean and concise)
      return `🔥 *Massive Off-Campus Drive*

🏢 *Company:* ${company}

💼 *Role:* ${role}

🎓 *Eligibility:* ${eligibility}

📍 *Location:* ${location}

💰 *Salary:* ${salary}

📝 *Expected Selection Rounds:*
${selection_process_formatted}

🔗 *Apply Instantly & Access Resume Tips:*
${website_job_url}

⏳ *Apply Immediately before link expires!*

📢 *Share this update with your friends!*`;
    }

    // Default Template B: Traffic-Focused / Structured Placement Alert
    return `🚀 *Freshers Hiring Alert*

🏢 *Company:* ${company}

💼 *Role:* ${role}

🎓 *Eligibility:* ${eligibility}

📍 *Location:* ${location}

💰 *Salary:* ${salary}

📝 *Selection Process:*
${selection_process_formatted}

🔗 *Full Details & Apply:*
${website_job_url}

⏳ *Apply Early*

📢 *Share With Friends*`;
  }

  private stripHtmlAndMarkdown(text: string): string {
    if (!text) return '';
    // Strip HTML tags
    let clean = text.replace(/<[^>]*>/g, '');
    // Strip markdown formatting characters (bold, italics, headers)
    clean = clean.replace(/[*_~`#\-+]/g, '');
    return clean.trim();
  }
}

export class TelegramPublisher implements Publisher {
  generate(jobData: any, options: { websiteUrl: string }): string {
    return `Telegram Promotion:\n\n🚀 ${jobData.company_name} is hiring ${jobData.drive_title}!\n💰 Salary: ${jobData.salary_range || 'Best in Industry'}\n📍 Location: ${jobData.location || 'Across India'}\n\nApply Here: ${options.websiteUrl}`;
  }
}

export class LinkedInPublisher implements Publisher {
  generate(jobData: any, options: { websiteUrl: string }): string {
    return `LinkedIn Promotion:\n\nExcited to share that ${jobData.company_name} is hiring for ${jobData.drive_title}! 🚀\n\n💼 Role: ${jobData.drive_title}\n💰 Compensation: ${jobData.salary_range || 'Best in Industry'}\n📍 Location: ${jobData.location || 'Across India'}\n\nLearn more and apply here: ${options.websiteUrl}\n\n#hiring #jobs #freshers #careers`;
  }
}
