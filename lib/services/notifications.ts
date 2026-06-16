/**
 * Notification Service Layer
 * Supports scheduling and sending reminders for job applications, assessments, and interviews.
 * Designed for future email integrations (Resend, SendGrid, Amazon SES) and web push notifications.
 */

export interface NotificationPayload {
  userId: string;
  email?: string;
  applicationId: string;
  companyName: string;
  role: string;
  reminderType: "assessment" | "interview" | "followup";
  scheduledDate: string;
  notes?: string;
}

export async function sendNotification(payload: NotificationPayload): Promise<{
  success: boolean;
  messageId: string;
  dispatchedAt: string;
}> {
  const messageId = `msg-${Math.random().toString(36).substring(2, 11)}`;
  const dispatchedAt = new Date().toISOString();

  // 1. In a production environment, you would call a mailer client here.
  // Example:
  // await resend.emails.send({
  //   from: 'BuggedBrain OS <placement@buggedbrain.com>',
  //   to: payload.email,
  //   subject: `Reminder: ${payload.reminderType.toUpperCase()} for ${payload.companyName}`,
  //   html: `<p>Hi there,</p><p>This is a reminder for your upcoming <strong>${payload.reminderType}</strong> round for the <strong>${payload.role}</strong> position at <strong>${payload.companyName}</strong> on <strong>${payload.scheduledDate}</strong>.</p>`
  // });

  // 2. Logging mock payload to the console
  console.log(`[Notification Service] [MOCK SEND] Dispatching notification:`, {
    messageId,
    dispatchedAt,
    recipientUserId: payload.userId,
    target: payload.email || "Simulated User Inbox",
    type: payload.reminderType,
    subject: `🔔 Placement Reminder: ${payload.companyName} - ${payload.role} ${payload.reminderType}`,
    body: `Your scheduled ${payload.reminderType} is set for ${payload.scheduledDate}. Notes: ${payload.notes || "None"}`
  });

  // Simulate network dispatch latency
  await new Promise((resolve) => setTimeout(resolve, 100));

  return {
    success: true,
    messageId,
    dispatchedAt
  };
}

/**
 * Set up an email/system reminder for an application round.
 */
export async function scheduleReminder(
  userId: string,
  appId: string,
  companyName: string,
  role: string,
  type: "assessment" | "interview" | "followup",
  dateStr: string,
  notes?: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Dispatch mock notification
    const res = await sendNotification({
      userId,
      applicationId: appId,
      companyName,
      role,
      reminderType: type,
      scheduledDate: dateStr,
      notes
    });

    return {
      success: res.success,
      message: `Successfully scheduled reminder with message ID ${res.messageId}`
    };
  } catch (err) {
    console.error("Failed to schedule notification:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : String(err)
    };
  }
}
