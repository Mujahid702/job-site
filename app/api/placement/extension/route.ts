import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createApplication } from "@/lib/db/applications";
import { invalidateUserCache } from "@/lib/redis";

export async function POST(request: Request) {
  try {
    // 1. Authenticate using Bearer token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized. Missing Authorization Bearer Token." }, { status: 401 });
    }

    const token = authHeader.substring(7).trim(); // User ID token
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized. Empty Token." }, { status: 401 });
    }

    // Verify token exists in profiles
    const supabase = await createClient();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("user_id", token)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ success: false, message: "Unauthorized. Invalid Token Key." }, { status: 401 });
    }

    const userId = profile.user_id;

    // 2. Parse request payload
    const body = await request.json();
    const { type, company, jobTitle, location, jobUrl, source, appliedDate, platform, deadline, duration, status } = body;

    if (type === "oa") {
      if (!company || !platform) {
        return NextResponse.json({ success: false, message: "Missing required fields: company and platform for OA sync." }, { status: 400 });
      }

      // Fetch user applications
      const { data: userApps } = await supabase
        .from("applications")
        .select("*")
        .eq("user_id", userId);

      const matchedApp = (userApps || []).find((a: any) => 
        a.company.toLowerCase().trim() === company.toLowerCase().trim()
      );

      const newOaRecord = {
        id: `oa-${Date.now()}`,
        oaDate: deadline || new Date().toISOString().split("T")[0],
        difficulty: "Medium" as const,
        topicsAsked: [],
        score: 0,
        result: "Pending" as const,
        prepNotes: `Automatically logged via Browser Extension from ${platform} page.`,
        platform,
        deadline: deadline || new Date().toISOString().split("T")[0],
        duration: Number(duration) || 90,
        status: (status as any) || "Pending"
      };

      if (matchedApp) {
        const details = matchedApp.details || {};
        if (!details.oas) details.oas = [];
        
        // Prevent duplicate OA records for the same platform and date
        const exists = details.oas.some((o: any) => o.platform === platform && o.oaDate === newOaRecord.oaDate);
        if (!exists) {
          details.oas.push(newOaRecord);
        }

        const { error: updateError } = await supabase
          .from("applications")
          .update({
            status: "Assessment Scheduled",
            details,
            last_updated: new Date().toISOString()
          })
          .eq("id", matchedApp.id);

        if (updateError) throw updateError;

        await supabase
          .from("application_history")
          .insert({
            application_id: matchedApp.id,
            status: "Assessment Scheduled",
            changed_at: new Date().toISOString(),
            notes: `OA logged automatically via Browser Extension on ${platform}.`
          });

        await invalidateUserCache(userId);

        return NextResponse.json({ 
          success: true, 
          message: `Logged OA on ${platform} for existing application ${company}.`,
          updated: true 
        });
      } else {
        // Create new application under status "Assessment Scheduled"
        const result = await createApplication(userId, {
          companyName: company,
          role: jobTitle || "Software Engineer",
          location: location || "Remote / Open Location",
          jobUrl: jobUrl || "",
          status: "Assessment Scheduled",
          applicationDate: new Date().toISOString().split("T")[0],
          notes: `Automatically created via Browser Extension from ${platform} OA detection.`,
          oas: [newOaRecord]
        }, supabase);

        if (!result.success) {
          return NextResponse.json({ success: false, message: "Failed to create application with OA." }, { status: 500 });
        }

        return NextResponse.json({ 
          success: true, 
          message: `Created new application and logged OA on ${platform} for ${company}.`,
          created: true,
          data: result.data 
        });
      }
    }

    if (!company || !jobTitle) {
      return NextResponse.json({ success: false, message: "Missing required fields: company and jobTitle." }, { status: 400 });
    }

    // 3. Deduplicate check: see if application exists for this user and company
    const { data: userApps } = await supabase
      .from("applications")
      .select("*")
      .eq("user_id", userId);

    const matchedApp = (userApps || []).find((a: any) => 
      a.company.toLowerCase().trim() === company.toLowerCase().trim()
    );

    if (matchedApp) {
      // Update existing application status to "Applied"
      const { error: updateError } = await supabase
        .from("applications")
        .update({
          status: "Applied",
          application_link: jobUrl || matchedApp.application_link,
          location: location || matchedApp.location,
          last_updated: new Date().toISOString()
        })
        .eq("id", matchedApp.id);

      if (updateError) {
        throw updateError;
      }

      // Add to application history
      await supabase
        .from("application_history")
        .insert({
          application_id: matchedApp.id,
          status: "Applied",
          changed_at: new Date().toISOString(),
          notes: `Application updated automatically via Browser Extension capture from ${source || "Web Listing"}.`
        });

      await invalidateUserCache(userId);

      return NextResponse.json({ 
        success: true, 
        message: `Updated existing application for ${company}.`,
        updated: true 
      });
    }

    // 4. Create new application using DB utility
    const result = await createApplication(userId, {
      companyName: company,
      role: jobTitle,
      location: location || "Remote / Open Location",
      jobUrl: jobUrl || "",
      status: "Applied",
      applicationDate: appliedDate || new Date().toISOString().split("T")[0],
      notes: `Automatically captured from ${source || "Careers Page"} via Placement OS Browser Extension.`
    }, supabase);

    if (!result.success) {
      return NextResponse.json({ success: false, message: "Failed to insert application record." }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Created new application for ${company}.`, 
      created: true,
      data: result.data 
    });

  } catch (err: any) {
    console.error("[Extension Ingest API] Exception:", err);
    return NextResponse.json({ success: false, message: err.message || "Internal server error." }, { status: 500 });
  }
}
