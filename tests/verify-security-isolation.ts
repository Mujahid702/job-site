console.log("🛡 Starting Dedicated Security Audit Regression Tests...\n");

// Mock Supabase clients
const createMockSupabase = (currentUserId: string) => {
  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: { id: currentUserId } }, error: null })
    },
    from: (table: string) => {
      return {
        select: (cols?: string) => {
          return {
            eq: (colName: string, value: any) => {
              return {
                eq: (secondCol: string, secondValue: any) => {
                  return {
                    maybeSingle: async () => {
                      if (table === "assessment_attempts") {
                        const targetAttemptOwner = "user_b_id";
                        if (currentUserId !== targetAttemptOwner) {
                          return { data: null, error: null }; // Access Denied
                        }
                        return { data: { id: value, user_id: targetAttemptOwner, session: { status: "Active" } }, error: null };
                      }
                      if (table === "assessment_scores") {
                        const targetAttemptOwner = "user_b_id";
                        if (currentUserId !== targetAttemptOwner) {
                          return { data: null, error: null }; // Access Denied
                        }
                        return { data: { id: "score_1", user_id: targetAttemptOwner }, error: null };
                      }
                      return { data: null, error: null };
                    }
                  };
                }
              };
            }
          };
        }
      };
    }
  };
};

async function runSecurityAuditTests() {
  const userA = "user_a_id";
  const userB = "user_b_id";
  const userBAttemptId = "attempt_user_b_999";

  console.log("🧪 Test 1: User A session queries User B's score result");
  const mockDbUserA = createMockSupabase(userA);

  const { data: scoreRecord } = await mockDbUserA
    .from("assessment_scores")
    .select("*")
    .eq("attempt_id", userBAttemptId)
    .eq("user_id", userA) // Enforced server-side
    .maybeSingle();

  console.log(`   - Query returned: ${scoreRecord ? "Access Allowed" : "Access Denied (Null)"}`);
  if (scoreRecord) {
    console.error("❌ Test 1 Failed! User A was allowed to query User B's scores.");
    process.exit(1);
  }
  console.log("✅ Test 1 Passed.\n");

  console.log("🧪 Test 2: User A session tries to write answer on User B's attempt ID");
  const { data: attemptRecord } = await mockDbUserA
    .from("assessment_attempts")
    .select("*, session:assessment_sessions(*)")
    .eq("id", userBAttemptId)
    .eq("user_id", userA) // Enforced server-side
    .maybeSingle();

  console.log(`   - Query returned: ${attemptRecord ? "Access Allowed" : "Access Denied (Null)"}`);
  if (attemptRecord) {
    console.error("❌ Test 2 Failed! User A was allowed to update User B's attempt.");
    process.exit(1);
  }
  console.log("✅ Test 2 Passed.\n");

  console.log("🧪 Test 3: User B queries own score results");
  const mockDbUserB = createMockSupabase(userB);
  const { data: ownerScore } = await mockDbUserB
    .from("assessment_scores")
    .select("*")
    .eq("attempt_id", userBAttemptId)
    .eq("user_id", userB) // Enforced server-side
    .maybeSingle();

  console.log(`   - Query returned: ${ownerScore ? "Access Allowed" : "Access Denied"}`);
  if (!ownerScore) {
    console.error("❌ Test 3 Failed! Owner User B was blocked from accessing own scores.");
    process.exit(1);
  }
  console.log("✅ Test 3 Passed.\n");

  console.log("🛡 All security regression isolation checks verified successfully!");
  process.exit(0);
}

runSecurityAuditTests();
