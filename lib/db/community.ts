import { supabase } from "@/lib/supabase";
import { executeWrite } from "./sync";
import { calculatePRIScore } from "./placement-readiness";

async function getDb(supabaseClient?: any) {
  if (supabaseClient) return supabaseClient;
  if (typeof window !== "undefined") {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      return createClient();
    } catch {
      return supabase;
    }
  }
  return supabase;
}

export async function getPosts(supabaseClient?: any): Promise<any[]> {
  try {
    const db = await getDb(supabaseClient);
    // Fetch posts and join with profiles to get author details
    const { data: postsData, error: postsError } = await db
      .from("community_posts")
      .select("*, profiles!left(full_name, target_role, college)")
      .order("created_at", { ascending: false });

    if (postsError) {
      console.error("Error fetching community posts:", postsError);
      return [];
    }

    // Fetch comments and join with profiles to get author details
    const { data: commentsData, error: commentsError } = await db
      .from("community_comments")
      .select("*, profiles!left(full_name)")
      .order("created_at", { ascending: true });

    if (commentsError) {
      console.error("Error fetching comments:", commentsError);
    }

    const typedPosts = (postsData || []) as {
      id: string;
      content: string | null;
      upvotes: number | null;
      reports: number | null;
      created_at: string;
      profiles: { full_name: string | null; target_role: string | null; college: string | null } | null;
    }[];

    const typedComments = (commentsData || []) as {
      id: string;
      post_id: string;
      content: string;
      created_at: string;
      profiles: { full_name: string | null } | null;
    }[];

    return typedPosts.map(post => {
      let text = post.content || "";
      let type = "Placement Update";
      let category = "General";
      let tags: string[] = [];
      let shareData = undefined;

      try {
        if (post.content && post.content.startsWith("{")) {
          const parsed = JSON.parse(post.content);
          text = parsed.text || post.content;
          type = parsed.type || type;
          category = parsed.category || category;
          tags = parsed.tags || [];
          shareData = parsed.shareData;
        }
      } catch (e) {
        // Fallback for plain text
      }

      const postComments = typedComments
        .filter(c => c.post_id === post.id)
        .map(c => ({
          id: c.id,
          author: c.profiles?.full_name || "Anonymous User",
          content: c.content,
          dateAdded: c.created_at
        }));

      return {
        id: post.id,
        author: post.profiles?.full_name || "Anonymous User",
        authorRole: post.profiles?.target_role || "Student",
        authorCompany: post.profiles?.college || "",
        type,
        category,
        content: text,
        tags,
        likes: post.upvotes || 0,
        comments: postComments,
        bookmarked: false,
        likedByUser: false,
        dateAdded: post.created_at,
        shareData,
        reports: [],
        flagged: (post.reports || 0) > 0
      };
    });
  } catch (err) {
    console.error("Exception in getPosts:", err);
    return [];
  }
}

export async function createPost(userId: string, post: any, supabaseClient?: any): Promise<{ success: boolean; error?: any }> {
  const contentObj = {
    text: post.content,
    type: post.type,
    category: post.category,
    tags: post.tags || [],
    shareData: post.shareData
  };

  const payload = {
    user_id: userId,
    title: post.title || post.type || "Community Post",
    content: JSON.stringify(contentObj),
    upvotes: post.likes || 0,
    reports: 0,
    created_at: new Date().toISOString()
  };

  const res = await executeWrite("community_posts", "insert", payload, undefined, supabaseClient);
  if (res.success) {
    calculatePRIScore(userId, undefined, supabaseClient).catch(console.error);
  }
  return res;
}

export async function upvotePost(postId: string, newLikes: number, supabaseClient?: any): Promise<{ success: boolean; error?: any }> {
  return executeWrite("community_posts", "update", { upvotes: newLikes }, { id: postId }, supabaseClient);
}

export async function createComment(postId: string, userId: string, content: string, supabaseClient?: any): Promise<{ success: boolean; error?: any }> {
  const payload = {
    post_id: postId,
    user_id: userId,
    content,
    created_at: new Date().toISOString()
  };
  const res = await executeWrite("community_comments", "insert", payload, undefined, supabaseClient);
  if (res.success) {
    calculatePRIScore(userId, undefined, supabaseClient).catch(console.error);
  }
  return res;
}

export async function reportPost(postId: string, userId: string, reason: string, supabaseClient?: any): Promise<{ success: boolean; error?: any }> {
  const payloadReport = {
    post_id: postId,
    reporter_id: userId,
    reason,
    created_at: new Date().toISOString()
  };
  
  const reportRes = await executeWrite("community_reports", "insert", payloadReport, undefined, supabaseClient);

  try {
    const db = await getDb(supabaseClient);
    const { data } = await db.from("community_posts").select("reports").eq("id", postId).single();
    const currentReports = data?.reports || 0;
    await executeWrite("community_posts", "update", { reports: currentReports + 1 }, { id: postId }, supabaseClient);
  } catch (e) {
    console.error("Failed to update post report counter:", e);
  }

  return reportRes;
}
