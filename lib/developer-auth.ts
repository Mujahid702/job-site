import { createClient } from "./supabase/server";

/**
 * lib/developer-auth.ts
 * Public developer API authentication checker.
 * Validates request Bearer token against developer_api_keys DB logs.
 */

export interface DeveloperAuthResult {
  authorized: boolean;
  userId: string | null;
  errorMsg: string | null;
}

/**
 * Checks request headers and verifies the associated API Key matches in database.
 */
export async function verifyDeveloperKey(request: Request): Promise<DeveloperAuthResult> {
  try {
    const authHeader = request.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return {
        authorized: false,
        userId: null,
        errorMsg: "Missing or malformed Authorization header. Must be Bearer <key>."
      };
    }

    const apiKey = authHeader.replace("Bearer ", "").trim();
    if (!apiKey) {
      return {
        authorized: false,
        userId: null,
        errorMsg: "Empty API key provided."
      };
    }

    const supabase = await createClient();
    const { data: keyRecord, error } = await supabase
      .from("developer_api_keys")
      .select("user_id")
      .eq("api_key", apiKey)
      .maybeSingle();

    if (error || !keyRecord) {
      return {
        authorized: false,
        userId: null,
        errorMsg: "Invalid or expired Developer API Key."
      };
    }

    return {
      authorized: true,
      userId: keyRecord.user_id,
      errorMsg: null
    };
  } catch (err: any) {
    return {
      authorized: false,
      userId: null,
      errorMsg: err?.message || "Internal server error during authorization verification."
    };
  }
}
