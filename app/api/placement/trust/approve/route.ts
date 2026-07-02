import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateInterviewPrepMaterial } from "@/app/api/placement/gmail/sync/route";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const { logId } = await request.json().catch(() => ({}));
    if (!logId) {
      return NextResponse.json({ success: false, message: "Missing logId" }, { status: 400 });
    }

    // 1. Fetch log record
    const { data: log, error: fetchErr } = await supabase
      .from("email_ingestion_logs")
      .select("*")
      .eq("id", logId)
      .eq("user_id", user.id)
      .single();

    if (fetchErr || !log) {
      return NextResponse.json({ success: false, message: "Log record not found." }, { status: 444 });
    }

    const parsedInfo = log.extracted_entities;
    if (!parsedInfo) {
      return NextResponse.json({ success: false, message: "No extracted entities in log." }, { status: 400 });
    }

    const companyName = parsedInfo.company || log.company || "Unknown Company";
    const jobRole = parsedInfo.role || log.role || "Software Engineer";
    const rawStatus = parsedInfo.status || "Application Received";

    const statusMap: Record<string, string> = {
      "Application Received": "Applied",
      "Assessment Scheduled": "Assessment Scheduled",
      "Assessment Completed": "Assessment Completed",
      "Technical Interview": "Technical Interview",
      "HR Interview": "HR Interview",
      "Rejected": "Rejected",
      "Offer Received": "Offer Received"
    };

    const crmStatus = statusMap[rawStatus] || "Applied";

    // 2. Fetch existing user applications to see if company exists
    const { data: userApps } = await supabase
      .from("applications")
      .select("*")
      .eq("user_id", user.id);

    const matchedApp = (userApps || []).find((a: any) => 
      a.company.toLowerCase().trim() === companyName.toLowerCase().trim()
    );

    let updated = false;
    let created = false;

    if (matchedApp) {
      const details = matchedApp.details || {};
      
      if (crmStatus === "Assessment Scheduled" && (parsedInfo.oaDeadline || parsedInfo.interviewDate)) {
        const dateToUse = parsedInfo.oaDeadline || parsedInfo.interviewDate;
        details.assessmentDate = dateToUse;
        if (!details.oas) details.oas = [];
        
        const exists = details.oas.some((o: any) => o.oaDate === dateToUse);
        if (!exists) {
          details.oas.push({
            id: `oa-${Date.now()}`,
            oaDate: dateToUse,
            difficulty: "Medium",
            topicsAsked: [],
            score: 0,
            result: "Pending",
            prepNotes: "Approved and added from suspicious logs.",
            platform: parsedInfo.assessmentPlatform || "HackerRank",
            duration: parsedInfo.assessmentDuration || 90,
            deadline: dateToUse,
            status: "Pending"
          });
        }
      } else if ((crmStatus === "Technical Interview" || crmStatus === "HR Interview") && (parsedInfo.interviewDate || parsedInfo.oaDeadline)) {
        const dateToUse = parsedInfo.interviewDate || parsedInfo.oaDeadline;
        details.interviewDate = dateToUse;
        if (!details.schedules) details.schedules = [];
        
        const timeToUse = parsedInfo.time || "10:00";
        const exists = details.schedules.some((s: any) => s.date === dateToUse && s.time === timeToUse);
        if (!exists) {
          const prep = generateInterviewPrepMaterial(companyName, jobRole, crmStatus);
          details.schedules.push({
            id: `sch-${Date.now()}`,
            type: crmStatus === "HR Interview" ? "HR Round" : "Technical Interview",
            date: dateToUse,
            time: timeToUse,
            platform: parsedInfo.meetingLink ? (parsedInfo.meetingLink.includes("zoom") ? "Zoom" : parsedInfo.meetingLink.includes("teams") ? "Microsoft Teams" : "Google Meet") : "Online / See Email",
            notes: "Approved and added from suspicious logs.",
            mode: parsedInfo.mode || "Online",
            meetingLink: parsedInfo.meetingLink || undefined,
            recruiterName: parsedInfo.recruiterName || undefined,
            recruiterEmail: parsedInfo.recruiterEmail || undefined,
            checklist: prep.checklist,
            companyTasks: prep.companyTasks,
            roleTasks: prep.roleTasks
          });
        }
      } else if (crmStatus === "Offer Received") {
        const offerExpiryDate = parsedInfo.interviewDate || parsedInfo.oaDeadline;
        details.offerExpiry = offerExpiryDate || undefined;
        details.offer = {
          ctc: parsedInfo.offerInfo || matchedApp.salary || "TBD",
          location: matchedApp.location || "TBD",
          joiningDate: offerExpiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          growthRating: 4,
          exposureRating: 4,
          brandValueRating: 4,
          potentialRating: 4
        };
      }

      await supabase
        .from("applications")
        .update({
          status: crmStatus,
          details,
          last_updated: new Date().toISOString()
        })
        .eq("id", matchedApp.id);

      await supabase
        .from("application_history")
        .insert({
          application_id: matchedApp.id,
          status: crmStatus,
          changed_at: new Date().toISOString(),
          notes: `Status updated to ${crmStatus} after manual trust log approval.`
        });

      updated = true;
    } else {
      // Create new application
      const details: any = {
        referralStatus: "None",
        schedules: [],
        oas: [],
        interviews: [],
        matchScore: {
          resumeMatch: 75,
          interviewReadiness: 65,
          overallProbability: 70
        }
      };

      if (crmStatus === "Assessment Scheduled" && (parsedInfo.oaDeadline || parsedInfo.interviewDate)) {
        const dateToUse = parsedInfo.oaDeadline || parsedInfo.interviewDate;
        details.assessmentDate = dateToUse;
        details.oas.push({
          id: `oa-${Date.now()}`,
          oaDate: dateToUse,
          difficulty: "Medium",
          topicsAsked: [],
          score: 0,
          result: "Pending",
          prepNotes: "Approved and added from suspicious logs.",
          platform: parsedInfo.assessmentPlatform || "HackerRank",
          duration: parsedInfo.assessmentDuration || 90,
          deadline: dateToUse,
          status: "Pending"
        });
      } else if ((crmStatus === "Technical Interview" || crmStatus === "HR Interview") && (parsedInfo.interviewDate || parsedInfo.oaDeadline)) {
        const dateToUse = parsedInfo.interviewDate || parsedInfo.oaDeadline;
        details.interviewDate = dateToUse;
        const prep = generateInterviewPrepMaterial(companyName, jobRole, crmStatus);
        details.schedules.push({
          id: `sch-${Date.now()}`,
          type: crmStatus === "HR Interview" ? "HR Round" : "Technical Interview",
          date: dateToUse,
          time: parsedInfo.time || "10:00",
          platform: parsedInfo.meetingLink ? (parsedInfo.meetingLink.includes("zoom") ? "Zoom" : parsedInfo.meetingLink.includes("teams") ? "Microsoft Teams" : "Google Meet") : "Online / See Email",
          notes: "Approved and added from suspicious logs.",
          mode: parsedInfo.mode || "Online",
          meetingLink: parsedInfo.meetingLink || undefined,
          recruiterName: parsedInfo.recruiterName || undefined,
          recruiterEmail: parsedInfo.recruiterEmail || undefined,
          checklist: prep.checklist,
          companyTasks: prep.companyTasks,
          roleTasks: prep.roleTasks
        });
      } else if (crmStatus === "Offer Received") {
        const offerExpiryDate = parsedInfo.interviewDate || parsedInfo.oaDeadline;
        details.offerExpiry = offerExpiryDate || undefined;
        details.offer = {
          ctc: parsedInfo.offerInfo || "TBD",
          location: "TBD",
          joiningDate: offerExpiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          growthRating: 4,
          exposureRating: 4,
          brandValueRating: 4,
          potentialRating: 4
        };
      }

      await supabase
        .from("applications")
        .insert({
          user_id: user.id,
          company: companyName,
          job_title: jobRole,
          location: "Remote / Open Location",
          salary: parsedInfo.offerInfo || "TBD",
          status: crmStatus,
          applied_date: new Date().toISOString(),
          last_updated: new Date().toISOString(),
          details,
          source: "Gmail Manual Trust Approval"
        });

      created = true;
    }

    // 3. Mark the log as processed
    await supabase
      .from("email_ingestion_logs")
      .update({
        processed: true,
        detected_status: crmStatus
      })
      .eq("id", logId);

    // 4. Automatically add recruiter to verified recruiter list if approved
    const sender = log.sender || "";
    const bracketMatch = sender.match(/^(.*?)\s*<(.*?)>/);
    const email = bracketMatch ? bracketMatch[2].trim() : sender.trim();
    const name = bracketMatch ? bracketMatch[1].replace(/['"]/g, "").trim() : email.split("@")[0];
    
    if (email && email.includes("@")) {
      const { data: recExists } = await supabase
        .from("verified_recruiters")
        .select("id")
        .eq("recruiter_email", email)
        .maybeSingle();

      if (!recExists) {
        await supabase
          .from("verified_recruiters")
          .insert({
            recruiter_name: name || email.split("@")[0],
            recruiter_email: email,
            company: companyName,
            verification_status: "Verified",
            trust_score: 85
          });
      }
    }

    return NextResponse.json({ success: true, updated, created });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
