import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createRecruiter, calculateRelationshipScore } from "@/lib/db/recruiters";
import { logAnalyticsEvent } from "@/lib/db/admin-analytics";

export const dynamic = "force-dynamic";

interface RawContact {
  name?: string;
  company?: string;
  designation?: string;
  linkedin_url?: string;
  email?: string;
  phone?: string;
  location?: string;
  hiring_roles?: string;
  tags?: string;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { contacts } = body;

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ success: false, message: "contacts array is required and cannot be empty." }, { status: 400 });
    }

    // Load existing recruiters for duplicate checks
    const { data: existingRecs } = await supabase
      .from("recruiters")
      .select("name, company, linkedin_url, email")
      .eq("user_id", user.id);

    const existingList = existingRecs || [];

    const toInsert: any[] = [];
    let skippedCount = 0;
    let importedCount = 0;

    for (const item of contacts as RawContact[]) {
      const name = item.name?.trim();
      const company = item.company?.trim();

      if (!name || !company) {
        skippedCount++; // Invalid
        continue;
      }

      // Check for duplicates locally in memory to optimize
      const isDuplicate = existingList.some(r => {
        const matchLinkedin = item.linkedin_url && r.linkedin_url && r.linkedin_url.trim().toLowerCase() === item.linkedin_url.trim().toLowerCase();
        const matchEmail = item.email && r.email && r.email.trim().toLowerCase() === item.email.trim().toLowerCase();
        const matchNameCompany = r.name.toLowerCase() === name.toLowerCase() && r.company.toLowerCase() === company.toLowerCase();
        return matchLinkedin || matchEmail || matchNameCompany;
      });

      if (isDuplicate) {
        skippedCount++;
        continue;
      }

      const parsedTags = item.tags 
        ? item.tags.split(",").map(t => t.trim()).filter(t => t.length > 0)
        : ["Imported"];

      const payload = {
        user_id: user.id,
        name,
        company,
        designation: item.designation?.trim() || "",
        linkedin_url: item.linkedin_url?.trim() || "",
        email: item.email?.trim() || "",
        phone: item.phone?.trim() || "",
        location: item.location?.trim() || "",
        hiring_roles: item.hiring_roles?.trim() || "",
        relationship_strength: "Cold",
        pipeline_stage: "Lead Found",
        last_interaction: new Date().toISOString(),
        notes: `Imported via CSV`,
        tags: parsedTags,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      toInsert.push(payload);
    }

    if (toInsert.length > 0) {
      // Supabase bulk insert
      const { data, error } = await supabase
        .from("recruiters")
        .insert(toInsert)
        .select();

      if (error) throw error;
      
      importedCount = data?.length || 0;

      // Log added events
      for (const rec of (data || [])) {
        await logAnalyticsEvent("recruiter_added", user.id, {
          recruiterId: rec.id,
          company: rec.company,
          stage: rec.pipeline_stage,
          relationshipScore: calculateRelationshipScore(rec, [])
        });
      }
    }

    // Invalidate Redis cache
    const { invalidateRecruiterCache } = await import("@/lib/redis");
    invalidateRecruiterCache(user.id).catch(err => console.error("Cache invalidation error:", err));

    return NextResponse.json({
      success: true,
      importedCount,
      skippedCount,
      totalProcessed: contacts.length
    });

  } catch (err: any) {
    console.error("Outreach import CSV API failed:", err);
    return NextResponse.json({ success: false, message: err.message || "Failed to import contacts" }, { status: 500 });
  }
}
