import { PlacementApplication, InterviewSchedule, OARecord } from "@/types/crm";
import { mapRowToApplication } from "@/lib/db/applications";

// Helper: parse date and time to ISO format
function parseDateTime(dateStr?: string, timeStr?: string): string {
  if (!dateStr) return new Date().toISOString();
  const cleanDate = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  
  if (!timeStr || !timeStr.trim()) {
    return `${cleanDate}T09:00:00Z`; // Default to 9 AM UTC
  }
  
  const cleanTime = timeStr.trim();
  if (/^\d{2}:\d{2}$/.test(cleanTime)) {
    return `${cleanDate}T${cleanTime}:00Z`;
  } else if (/^\d{1}:\d{2}$/.test(cleanTime)) {
    return `${cleanDate}T0${cleanTime}:00Z`;
  } else {
    const match = cleanTime.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2];
      const ampm = match[3].toLowerCase();
      if (ampm === "pm" && hours < 12) hours += 12;
      if (ampm === "am" && hours === 12) hours = 0;
      const hh = hours < 10 ? `0${hours}` : `${hours}`;
      return `${cleanDate}T${hh}:${minutes}:00Z`;
    }
  }
  return `${cleanDate}T09:00:00Z`;
}

function addMinutes(isoStr: string, minutes: number): string {
  try {
    const d = new Date(isoStr);
    d.setMinutes(d.getMinutes() + minutes);
    return d.toISOString();
  } catch {
    return isoStr;
  }
}

// Google token check & refresh
async function refreshGoogleToken(connection: any, supabase: any): Promise<string> {
  try {
    const testRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${connection.access_token}` }
    });
    if (testRes.ok) {
      return connection.access_token;
    }
  } catch (e) {
    console.warn("Google token validation test failed, attempting refresh", e);
  }

  if (!connection.refresh_token) {
    throw new Error("Google access token expired and no refresh token is stored.");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId || "",
      client_secret: clientSecret || "",
      refresh_token: connection.refresh_token,
      grant_type: "refresh_token"
    })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || "Google token refresh failed");
  }

  const { access_token } = data;
  await supabase
    .from("gmail_connections")
    .update({ access_token, last_sync: new Date().toISOString() })
    .eq("user_id", connection.user_id);

  return access_token;
}

// Outlook token check & refresh
export async function refreshOutlookTokens(connection: any, supabase: any): Promise<string> {
  try {
    const testRes = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${connection.access_token}` }
    });
    if (testRes.ok) {
      return connection.access_token;
    }
  } catch (e) {
    console.warn("Outlook token validation test failed, attempting refresh", e);
  }

  if (!connection.refresh_token) {
    throw new Error("Outlook access token expired and no refresh token is stored.");
  }

  const clientId = process.env.OUTLOOK_CLIENT_ID;
  const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;

  const res = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId || "",
      client_secret: clientSecret || "",
      refresh_token: connection.refresh_token,
      grant_type: "refresh_token",
      scope: "offline_access User.Read Calendars.ReadWrite"
    })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || "Outlook token refresh failed");
  }

  const { access_token, refresh_token: newRefreshToken } = data;
  const updatePayload: any = { access_token, last_sync: new Date().toISOString() };
  if (newRefreshToken) {
    updatePayload.refresh_token = newRefreshToken;
  }

  await supabase
    .from("outlook_connections")
    .update(updatePayload)
    .eq("user_id", connection.user_id);

  return access_token;
}

// Google Calendar actions
async function createGoogleEvent(accessToken: string, event: { summary: string; description: string; startIso: string; endIso: string; location?: string }): Promise<{ id: string; htmlLink: string }> {
  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      summary: event.summary,
      description: event.description,
      location: event.location || "",
      start: { dateTime: event.startIso },
      end: { dateTime: event.endIso },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 60 },
          { method: "email", minutes: 1440 }
        ]
      }
    })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || "Failed to create Google event");
  }
  return { id: data.id, htmlLink: data.htmlLink };
}

async function updateGoogleEvent(accessToken: string, eventId: string, event: { summary: string; description: string; startIso: string; endIso: string; location?: string }): Promise<void> {
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      summary: event.summary,
      description: event.description,
      location: event.location || "",
      start: { dateTime: event.startIso },
      end: { dateTime: event.endIso },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 60 },
          { method: "email", minutes: 1440 }
        ]
      }
    })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    console.error("Google update event error details:", data);
  }
}

async function deleteGoogleEvent(accessToken: string, eventId: string): Promise<void> {
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    console.error("Google delete event error details:", data);
  }
}

// Outlook Calendar actions
async function createOutlookEvent(accessToken: string, event: { summary: string; description: string; startIso: string; endIso: string; location?: string }): Promise<{ id: string; htmlLink: string }> {
  const res = await fetch("https://graph.microsoft.com/v1.0/me/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      subject: event.summary,
      body: {
        contentType: "HTML",
        content: event.description
      },
      location: {
        displayName: event.location || ""
      },
      start: {
        dateTime: event.startIso.replace("Z", ""),
        timeZone: "UTC"
      },
      end: {
        dateTime: event.endIso.replace("Z", ""),
        timeZone: "UTC"
      },
      reminderMinutesBeforeStart: 60,
      isReminderOn: true
    })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || "Failed to create Outlook event");
  }
  return { id: data.id, htmlLink: data.webLink };
}

async function updateOutlookEvent(accessToken: string, eventId: string, event: { summary: string; description: string; startIso: string; endIso: string; location?: string }): Promise<void> {
  const res = await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      subject: event.summary,
      body: {
        contentType: "HTML",
        content: event.description
      },
      location: {
        displayName: event.location || ""
      },
      start: {
        dateTime: event.startIso.replace("Z", ""),
        timeZone: "UTC"
      },
      end: {
        dateTime: event.endIso.replace("Z", ""),
        timeZone: "UTC"
      },
      reminderMinutesBeforeStart: 60,
      isReminderOn: true
    })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    console.error("Outlook update event error details:", data);
  }
}

async function deleteOutlookEvent(accessToken: string, eventId: string): Promise<void> {
  const res = await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    console.error("Outlook delete event error details:", data);
  }
}

// Core Sync Engine: Sync Application schedules, OAs, and deadlines
export async function syncApplicationToCalendars(
  userId: string,
  application: PlacementApplication,
  supabaseClient: any
): Promise<void> {
  try {
    // 1. Fetch Integration settings
    const { data: googleConn } = await supabaseClient
      .from("gmail_connections")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const { data: outlookConn } = await supabaseClient
      .from("outlook_connections")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const googleEnabled = !!(googleConn && googleConn.sync_enabled);
    const outlookEnabled = !!(outlookConn && outlookConn.sync_enabled);

    if (!googleEnabled && !outlookEnabled) {
      return; // No active integrations
    }

    // Load active tokens
    let googleToken = "";
    if (googleEnabled) {
      try {
        googleToken = await refreshGoogleToken(googleConn, supabaseClient);
      } catch (e) {
        console.error("Failed to refresh Google token for calendar sync:", e);
      }
    }

    let outlookToken = "";
    if (outlookEnabled) {
      try {
        outlookToken = await refreshOutlookTokens(outlookConn, supabaseClient);
      } catch (e) {
        console.error("Failed to refresh Outlook token for calendar sync:", e);
      }
    }

    if (!googleToken && !outlookToken) {
      return; // Failed to authenticate to active connections
    }

    // 2. Fetch existing version from DB to check for deleted schedules or OAs
    const { data: appRow } = await supabaseClient
      .from("applications")
      .select("*")
      .eq("id", application.id)
      .eq("user_id", userId)
      .maybeSingle();
      
    const existingApp = appRow ? mapRowToApplication(appRow) : null;

    // Handle deletions first
    if (existingApp) {
      // Clean up deleted schedules
      for (const oldSched of existingApp.schedules) {
        const stillExists = application.schedules.some((s) => s.id === oldSched.id);
        if (!stillExists) {
          if (oldSched.googleEventId && googleToken) {
            await deleteGoogleEvent(googleToken, oldSched.googleEventId).catch((err) =>
              console.error("Error deleting old Google schedule event:", err)
            );
          }
          if (oldSched.outlookEventId && outlookToken) {
            await deleteOutlookEvent(outlookToken, oldSched.outlookEventId).catch((err) =>
              console.error("Error deleting old Outlook schedule event:", err)
            );
          }
        }
      }

      // Clean up deleted OAs
      for (const oldOa of existingApp.oas || []) {
        const stillExists = (application.oas || []).some((o) => o.id === oldOa.id);
        if (!stillExists) {
          if (oldOa.googleEventId && googleToken) {
            await deleteGoogleEvent(googleToken, oldOa.googleEventId).catch((err) =>
              console.error("Error deleting old Google OA event:", err)
            );
          }
          if (oldOa.outlookEventId && outlookToken) {
            await deleteOutlookEvent(outlookToken, oldOa.outlookEventId).catch((err) =>
              console.error("Error deleting old Outlook OA event:", err)
            );
          }
        }
      }

      // Clean up deadline event if deadline was removed
      if (!application.deadline && existingApp.deadline) {
        if (existingApp.googleDeadlineEventId && googleToken) {
          await deleteGoogleEvent(googleToken, existingApp.googleDeadlineEventId).catch((err) =>
            console.error("Error deleting Google deadline event:", err)
          );
        }
        if (existingApp.outlookDeadlineEventId && outlookToken) {
          await deleteOutlookEvent(outlookToken, existingApp.outlookDeadlineEventId).catch((err) =>
            console.error("Error deleting Outlook deadline event:", err)
          );
        }
      }
    }

    // 3. Process Deadlines Event
    let googleDeadlineEventId = application.googleDeadlineEventId;
    let googleDeadlineCalendarLink = application.googleDeadlineCalendarLink;
    let outlookDeadlineEventId = application.outlookDeadlineEventId;
    let outlookDeadlineCalendarLink = application.outlookDeadlineCalendarLink;

    if (application.deadline) {
      const summary = `${application.companyName} - Application Deadline`;
      const description = `Deadline to complete application or submit materials for the ${application.role} position at ${application.companyName}.\nJob URL: ${application.jobUrl || "N/A"}`;
      const startIso = parseDateTime(application.deadline, "09:00");
      const endIso = addMinutes(startIso, 30);
      const location = application.location || "";

      // Google Deadline Event Sync
      if (googleToken) {
        try {
          if (googleDeadlineEventId) {
            await updateGoogleEvent(googleToken, googleDeadlineEventId, { summary, description, startIso, endIso, location });
          } else {
            const ev = await createGoogleEvent(googleToken, { summary, description, startIso, endIso, location });
            googleDeadlineEventId = ev.id;
            googleDeadlineCalendarLink = ev.htmlLink;
          }
        } catch (e) {
          console.error("Google deadline event sync failed:", e);
        }
      }

      // Outlook Deadline Event Sync
      if (outlookToken) {
        try {
          if (outlookDeadlineEventId) {
            await updateOutlookEvent(outlookToken, outlookDeadlineEventId, { summary, description, startIso, endIso, location });
          } else {
            const ev = await createOutlookEvent(outlookToken, { summary, description, startIso, endIso, location });
            outlookDeadlineEventId = ev.id;
            outlookDeadlineCalendarLink = ev.htmlLink;
          }
        } catch (e) {
          console.error("Outlook deadline event sync failed:", e);
        }
      }
    }

    // 4. Process Online Assessments Sync
    const syncedOas: OARecord[] = [];
    for (const oa of application.oas || []) {
      const updatedOa = { ...oa };
      const targetDate = oa.deadline || oa.oaDate;

      if (targetDate) {
        const summary = `${application.companyName} - Online Assessment (${oa.platform || "Platform"})`;
        const description = `Online assessment details:\nCompany: ${application.companyName}\nRole: ${application.role}\nPlatform: ${oa.platform || "N/A"}\nDuration: ${oa.duration || 60} mins\nPrep Notes: ${oa.prepNotes || "N/A"}\n\nJob URL: ${application.jobUrl || "N/A"}`;
        const startIso = parseDateTime(targetDate, "10:00");
        const endIso = addMinutes(startIso, oa.duration || 60);

        if (googleToken) {
          try {
            if (oa.googleEventId) {
              await updateGoogleEvent(googleToken, oa.googleEventId, { summary, description, startIso, endIso });
            } else {
              const ev = await createGoogleEvent(googleToken, { summary, description, startIso, endIso });
              updatedOa.googleEventId = ev.id;
              updatedOa.googleCalendarLink = ev.htmlLink;
            }
          } catch (e) {
            console.error(`Google OA sync failed for ${oa.id}:`, e);
          }
        }

        if (outlookToken) {
          try {
            if (oa.outlookEventId) {
              await updateOutlookEvent(outlookToken, oa.outlookEventId, { summary, description, startIso, endIso });
            } else {
              const ev = await createOutlookEvent(outlookToken, { summary, description, startIso, endIso });
              updatedOa.outlookEventId = ev.id;
              updatedOa.outlookCalendarLink = ev.htmlLink;
            }
          } catch (e) {
            console.error(`Outlook OA sync failed for ${oa.id}:`, e);
          }
        }
      }
      syncedOas.push(updatedOa);
    }

    // 5. Process Interview Schedules Sync
    const syncedSchedules: InterviewSchedule[] = [];
    for (const sched of application.schedules) {
      const updatedSched = { ...sched };

      if (sched.date) {
        const summary = `${application.companyName} - Interview (${sched.type})`;
        const description = `Interview details:\nRound: ${sched.type}\nMode: ${sched.mode || "N/A"}\nPlatform: ${sched.platform || "N/A"}\nMeeting Link: ${sched.meetingLink || "N/A"}\nRecruiter: ${sched.recruiterName || "N/A"} (${sched.recruiterEmail || "N/A"})\nNotes: ${sched.notes || "N/A"}`;
        const startIso = parseDateTime(sched.date, sched.time);
        const endIso = addMinutes(startIso, 60); // default 1 hour
        const location = sched.meetingLink || sched.platform || "";

        if (googleToken) {
          try {
            if (sched.googleEventId) {
              await updateGoogleEvent(googleToken, sched.googleEventId, { summary, description, startIso, endIso, location });
            } else {
              const ev = await createGoogleEvent(googleToken, { summary, description, startIso, endIso, location });
              updatedSched.googleEventId = ev.id;
              updatedSched.googleCalendarLink = ev.htmlLink;
            }
          } catch (e) {
            console.error(`Google schedule sync failed for ${sched.id}:`, e);
          }
        }

        if (outlookToken) {
          try {
            if (sched.outlookEventId) {
              await updateOutlookEvent(outlookToken, sched.outlookEventId, { summary, description, startIso, endIso, location });
            } else {
              const ev = await createOutlookEvent(outlookToken, { summary, description, startIso, endIso, location });
              updatedSched.outlookEventId = ev.id;
              updatedSched.outlookCalendarLink = ev.htmlLink;
            }
          } catch (e) {
            console.error(`Outlook schedule sync failed for ${sched.id}:`, e);
          }
        }
      }
      syncedSchedules.push(updatedSched);
    }

    // 6. Direct update to DB to save the IDs/links bypass triggers
    const details = {
      ...(appRow?.details || {}),
      schedules: syncedSchedules,
      oas: syncedOas,
      googleDeadlineEventId,
      googleDeadlineCalendarLink,
      outlookDeadlineEventId,
      outlookDeadlineCalendarLink
    };

    const { error: dbError } = await supabaseClient
      .from("applications")
      .update({
        details,
        last_updated: new Date().toISOString()
      })
      .eq("id", application.id)
      .eq("user_id", userId);

    if (dbError) {
      console.error("Failed to save calendar IDs in DB:", dbError);
    }
  } catch (err) {
    console.error("General calendar sync exception:", err);
  }
}

// Cleanup associated events prior to deleting an application
export async function deleteApplicationFromCalendars(
  userId: string,
  appBeforeDeletion: PlacementApplication,
  supabaseClient: any
): Promise<void> {
  try {
    const { data: googleConn } = await supabaseClient
      .from("gmail_connections")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const { data: outlookConn } = await supabaseClient
      .from("outlook_connections")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    let googleToken = "";
    if (googleConn && googleConn.sync_enabled) {
      try {
        googleToken = await refreshGoogleToken(googleConn, supabaseClient);
      } catch {}
    }

    let outlookToken = "";
    if (outlookConn && outlookConn.sync_enabled) {
      try {
        outlookToken = await refreshOutlookTokens(outlookConn, supabaseClient);
      } catch {}
    }

    if (!googleToken && !outlookToken) {
      return;
    }

    // Delete deadline events
    if (appBeforeDeletion.googleDeadlineEventId && googleToken) {
      await deleteGoogleEvent(googleToken, appBeforeDeletion.googleDeadlineEventId).catch(() => {});
    }
    if (appBeforeDeletion.outlookDeadlineEventId && outlookToken) {
      await deleteOutlookEvent(outlookToken, appBeforeDeletion.outlookDeadlineEventId).catch(() => {});
    }

    // Delete OA events
    for (const oa of appBeforeDeletion.oas || []) {
      if (oa.googleEventId && googleToken) {
        await deleteGoogleEvent(googleToken, oa.googleEventId).catch(() => {});
      }
      if (oa.outlookEventId && outlookToken) {
        await deleteOutlookEvent(outlookToken, oa.outlookEventId).catch(() => {});
      }
    }

    // Delete schedule events
    for (const sched of appBeforeDeletion.schedules) {
      if (sched.googleEventId && googleToken) {
        await deleteGoogleEvent(googleToken, sched.googleEventId).catch(() => {});
      }
      if (sched.outlookEventId && outlookToken) {
        await deleteOutlookEvent(outlookToken, sched.outlookEventId).catch(() => {});
      }
    }
  } catch (err) {
    console.error("Error during application calendar cleanup:", err);
  }
}
