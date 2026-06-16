import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCache, setCache } from "@/lib/redis";
import { logInfo, logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

interface ActionItem {
  id: string;
  appId: string;
  companyName: string;
  role: string;
  type: "deadline" | "assessment" | "interview" | "offer_expiry";
  date: string;
  message: string;
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh") === "true";

    const cacheKey = `user_action_center:${user.id}`;

    if (!refresh) {
      const cached = await getCache<any>(cacheKey);
      if (cached) {
        logInfo(`Cache hit for Action Center: ${user.id}`);
        return NextResponse.json({ success: true, actions: cached });
      }
    }

    logInfo(`Cache miss or refresh. Generating actions timeline for: ${user.id}`);

    // Fetch all applications
    const { data: apps, error } = await supabase
      .from("applications")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      logError("Failed to fetch applications for action center", error);
      return NextResponse.json({ success: false, message: "Failed to load pipelines" }, { status: 500 });
    }

    const critical: ActionItem[] = [];
    const high: ActionItem[] = [];
    const medium: ActionItem[] = [];
    const low: ActionItem[] = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    (apps || []).forEach(app => {
      const details = app.details || {};
      const company = app.company || "Unknown Company";
      const role = app.job_title || "Job Role";

      const dates = [
        { type: "deadline" as const, val: details.deadline, label: "Application Deadline" },
        { type: "assessment" as const, val: details.assessmentDate, label: "Online Assessment" },
        { type: "interview" as const, val: details.interviewDate, label: "Interview Round" },
        { type: "offer_expiry" as const, val: details.offerExpiry, label: "Offer Expiry" }
      ];

      dates.forEach(d => {
        if (!d.val) return;
        const targetDate = new Date(d.val);
        targetDate.setHours(0, 0, 0, 0);

        const diffTime = targetDate.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        const item: ActionItem = {
          id: `${app.id}-${d.type}`,
          appId: app.id,
          companyName: company,
          role: role,
          type: d.type,
          date: d.val,
          message: `${d.label} scheduled for ${company} (${role})`
        };

        if (diffDays === 0) {
          item.message = `${d.label} is TODAY for ${company}!`;
          critical.push(item);
        } else if (diffDays === 1) {
          item.message = `${d.label} is TOMORROW for ${company}`;
          high.push(item);
        } else if (diffDays > 1 && diffDays <= 3) {
          medium.push(item);
        } else if (diffDays > 3) {
          low.push(item);
        }
      });
    });

    const result = { critical, high, medium, low };

    // Cache in Redis for 15 minutes
    await setCache(cacheKey, result, 900);

    return NextResponse.json({
      success: true,
      actions: result
    });
  } catch (err: any) {
    logError("Action center api failed", err);
    return NextResponse.json({ success: false, message: "Unexpected server error compilation actions" }, { status: 500 });
  }
}
