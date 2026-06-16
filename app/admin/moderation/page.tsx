"use client";

import React, { useState, useEffect } from "react";
import { Shield, AlertTriangle, CheckCircle, Trash2, UserX, UserCheck, MessageSquare, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface FeedPost {
  id: string;
  author: string;
  authorRole: string;
  authorCompany?: string;
  type: string;
  category: string;
  content: string;
  tags: string[];
  likes: number;
  comments: Array<{ author: string; content: string; dateAdded: string; reports?: any[]; flagged?: boolean }>;
  bookmarked: boolean;
  likedByUser: boolean;
  dateAdded: string;
  reports?: Array<{ reason: string; reportedBy: string; date: string }>;
  flagged?: boolean;
}

export default function ModerationDashboard() {
  const [activeTab, setActiveTab] = useState<"posts" | "comments" | "users">("posts");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [bannedUsers, setBannedUsers] = useState<string[]>([]);
  const [userWarnings, setUserWarnings] = useState<Record<string, number>>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedPosts = localStorage.getItem("placement_community_feed_posts");
      if (storedPosts) {
        try {
          setPosts(JSON.parse(storedPosts));
        } catch {}
      }

      const storedBanned = localStorage.getItem("placement_community_banned_users");
      if (storedBanned) {
        try {
          setBannedUsers(JSON.parse(storedBanned));
        } catch {}
      }

      const storedWarnings = localStorage.getItem("placement_community_user_warnings");
      if (storedWarnings) {
        try {
          setUserWarnings(JSON.parse(storedWarnings));
        } catch {}
      }
    }
  }, []);

  const savePosts = (updatedPosts: FeedPost[]) => {
    setPosts(updatedPosts);
    localStorage.setItem("placement_community_feed_posts", JSON.stringify(updatedPosts));
  };

  const saveBannedUsers = (updatedBanned: string[]) => {
    setBannedUsers(updatedBanned);
    localStorage.setItem("placement_community_banned_users", JSON.stringify(updatedBanned));
  };

  const saveWarnings = (updatedWarnings: Record<string, number>) => {
    setUserWarnings(updatedWarnings);
    localStorage.setItem("placement_community_user_warnings", JSON.stringify(updatedWarnings));
  };

  // Actions for Posts
  const handleApprovePost = (postId: string) => {
    const updated = posts.map(post => {
      if (post.id === postId) {
        return { ...post, reports: [], flagged: false };
      }
      return post;
    });
    savePosts(updated);
    alert("Post approved. All reports cleared.");
  };

  const handleRemovePost = (postId: string) => {
    const updated = posts.filter(post => post.id !== postId);
    savePosts(updated);
    alert("Post removed successfully.");
  };

  // Actions for Comments
  const handleApproveComment = (postId: string, commentIndex: number) => {
    const updated = posts.map(post => {
      if (post.id === postId) {
        const comments = [...post.comments];
        comments[commentIndex] = { ...comments[commentIndex], reports: [], flagged: false };
        return { ...post, comments };
      }
      return post;
    });
    savePosts(updated);
    alert("Comment approved. Reports cleared.");
  };

  const handleRemoveComment = (postId: string, commentIndex: number) => {
    const updated = posts.map(post => {
      if (post.id === postId) {
        const comments = post.comments.filter((_, idx) => idx !== commentIndex);
        return { ...post, comments };
      }
      return post;
    });
    savePosts(updated);
    alert("Comment removed successfully.");
  };

  // Actions for Users
  const handleWarnUser = (authorName: string) => {
    const currentWarnings = userWarnings[authorName] || 0;
    const updated = { ...userWarnings, [authorName]: currentWarnings + 1 };
    saveWarnings(updated);

    // Log moderation action to audit trail
    fetch("/api/admin/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "log_action",
        details: {
          actionName: "Moderation Action",
          actionData: {
            user: authorName,
            action: "Warned",
            totalWarnings: currentWarnings + 1
          }
        }
      })
    }).catch(err => console.error("Failed to log warning:", err));

    alert(`Warning issued to ${authorName}. Total warnings: ${currentWarnings + 1}`);
  };

  const handleBanUser = (authorName: string) => {
    if (bannedUsers.includes(authorName)) {
      alert("User is already banned.");
      return;
    }
    const updatedBanned = [...bannedUsers, authorName];
    saveBannedUsers(updatedBanned);

    // Log moderation action to audit trail
    fetch("/api/admin/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "log_action",
        details: {
          actionName: "User Banned",
          actionData: {
            user: authorName,
            reason: "Multiple violations / flagged posts"
          }
        }
      })
    }).catch(err => console.error("Failed to log ban:", err));

    // Remove all posts and comments by this user
    const remainingPosts = posts.filter(post => post.author !== authorName);
    const cleanedPosts = remainingPosts.map(post => ({
      ...post,
      comments: post.comments.filter(comment => comment.author !== authorName)
    }));
    savePosts(cleanedPosts);
    alert(`User ${authorName} has been banned and their posts/comments deleted.`);
  };

  const handleUnbanUser = (authorName: string) => {
    const updatedBanned = bannedUsers.filter(user => user !== authorName);
    saveBannedUsers(updatedBanned);
    alert(`User ${authorName} has been unbanned.`);
  };

  // Selectors
  const reportedPosts = posts.filter(post => post.reports && post.reports.length > 0);

  // Compile reported comments list
  const reportedComments: Array<{ postId: string; postTitle: string; comment: any; commentIndex: number; postAuthor: string }> = [];
  posts.forEach(post => {
    post.comments.forEach((comment, commentIndex) => {
      if (comment.reports && comment.reports.length > 0) {
        reportedComments.push({
          postId: post.id,
          postTitle: post.content.substring(0, 60) + "...",
          comment,
          commentIndex,
          postAuthor: post.author
        });
      }
    });
  });

  // Unique list of authors who have posts or comments
  const reportedUsers = Array.from(
    new Set([
      ...reportedPosts.map(p => p.author),
      ...reportedComments.map(c => c.comment.author)
    ])
  );

  return (
    <div className="space-y-8 pb-20 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="space-y-2">
          <Link href="/admin" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 font-bold uppercase tracking-wider mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Shield className="w-9 h-9 text-rose-500 fill-rose-50" />
            Community Moderation Panel
          </h1>
          <p className="text-slate-500 text-sm font-semibold">
            Audit reported social hub feed posts, comments, flag warnings, and manage blocked / banned credentials.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white p-2 rounded-2xl shadow-sm gap-1 max-w-md">
        <button
          onClick={() => setActiveTab("posts")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
            activeTab === "posts" ? "bg-slate-900 text-white shadow" : "text-slate-550 hover:bg-slate-50"
          )}
        >
          <FileText className="w-4 h-4" />
          <span>Posts ({reportedPosts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("comments")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
            activeTab === "comments" ? "bg-slate-900 text-white shadow" : "text-slate-550 hover:bg-slate-50"
          )}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Comments ({reportedComments.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
            activeTab === "users" ? "bg-slate-900 text-white shadow" : "text-slate-550 hover:bg-slate-50"
          )}
        >
          <UserX className="w-4 h-4" />
          <span>Users</span>
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm min-h-[400px]">
        {/* POSTS TAB */}
        {activeTab === "posts" && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 font-display">Reported Posts Feed</h2>
            {reportedPosts.length === 0 ? (
              <p className="text-sm text-slate-450 font-bold text-center py-12">No pending reported posts found.</p>
            ) : (
              <div className="space-y-4">
                {reportedPosts.map(post => (
                  <div key={post.id} className="p-6 border border-slate-200 rounded-2xl bg-slate-50/20 hover:border-slate-350 transition-all flex flex-col gap-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <strong className="text-sm font-black text-slate-800">{post.author}</strong>
                        <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{post.authorRole}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-600 text-[8px] font-black uppercase tracking-widest rounded flex items-center gap-1 shrink-0">
                        <AlertTriangle className="w-3 h-3 text-rose-550 fill-rose-50" />
                        {post.reports?.length || 0} Reports
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 font-bold leading-normal bg-white p-3.5 border border-slate-150 rounded-xl">
                      {post.content}
                    </p>

                    {/* Report Reasons List */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Report Reasons Mapped:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {post.reports?.map((rep, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-red-50 text-red-700 text-[9px] font-bold rounded-lg border border-red-100">
                            {rep.reason} (by {rep.reportedBy})
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-between items-center gap-2 pt-2 border-t border-slate-100 flex-wrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprovePost(post.id)}
                          className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approve (Keep)
                        </button>
                        <button
                          onClick={() => handleRemovePost(post.id)}
                          className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleWarnUser(post.author)}
                          className="px-4 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                        >
                          Warn User ({userWarnings[post.author] || 0} warnings)
                        </button>
                        <button
                          onClick={() => handleBanUser(post.author)}
                          className="px-4 py-2 bg-slate-905 text-white hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          Ban User
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* COMMENTS TAB */}
        {activeTab === "comments" && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 font-display">Reported Comments</h2>
            {reportedComments.length === 0 ? (
              <p className="text-sm text-slate-450 font-bold text-center py-12">No pending reported comments found.</p>
            ) : (
              <div className="space-y-4">
                {reportedComments.map((item, idx) => (
                  <div key={idx} className="p-6 border border-slate-200 rounded-2xl bg-slate-50/20 hover:border-slate-350 transition-all flex flex-col gap-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <strong className="text-sm font-black text-slate-800">{item.comment.author}</strong>
                        <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Commented on post by {item.postAuthor}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-600 text-[8px] font-black uppercase tracking-widest rounded flex items-center gap-1 shrink-0">
                        <AlertTriangle className="w-3 h-3 text-rose-550 fill-rose-50" />
                        {item.comment.reports?.length || 0} Reports
                      </span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Parent Post Context:</span>
                      <p className="text-[10px] font-bold text-slate-450 italic truncate max-w-full">
                        &quot;{item.postTitle}&quot;
                      </p>
                    </div>

                    <p className="text-xs text-slate-650 font-bold leading-normal bg-white p-3.5 border border-slate-150 rounded-xl">
                      {item.comment.content}
                    </p>

                    {/* Report Reasons List */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Report Reasons Mapped:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {item.comment.reports?.map((rep: any, rIdx: number) => (
                          <span key={rIdx} className="px-2 py-0.5 bg-red-50 text-red-700 text-[9px] font-bold rounded-lg border border-red-100">
                            {rep.reason} (by {rep.reportedBy})
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-between items-center gap-2 pt-2 border-t border-slate-100 flex-wrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveComment(item.postId, item.commentIndex)}
                          className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approve (Keep)
                        </button>
                        <button
                          onClick={() => handleRemoveComment(item.postId, item.commentIndex)}
                          className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleWarnUser(item.comment.author)}
                          className="px-4 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                        >
                          Warn User ({userWarnings[item.comment.author] || 0} warnings)
                        </button>
                        <button
                          onClick={() => handleBanUser(item.comment.author)}
                          className="px-4 py-2 bg-slate-905 text-white hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          Ban User
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 font-display">Manage User Flags & Bans</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Flagged Users List */}
              <div className="p-6 border border-slate-200 rounded-2xl space-y-4 bg-slate-50/20">
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2">Flagged Contributors</h3>
                {reportedUsers.length === 0 ? (
                  <p className="text-xs text-slate-400 font-bold text-center py-6">No users flagged from report logs.</p>
                ) : (
                  <div className="divide-y divide-slate-150">
                    {reportedUsers.map((user, idx) => (
                      <div key={idx} className="py-3 flex justify-between items-center gap-4">
                        <div>
                          <strong className="text-xs font-black text-slate-800 block">{user}</strong>
                          <span className="text-[10px] text-slate-450 font-bold block">Warnings issued: {userWarnings[user] || 0}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleWarnUser(user)}
                            className="px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 text-[9px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                          >
                            Warn
                          </button>
                          <button
                            onClick={() => handleBanUser(user)}
                            className="px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 text-[9px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                          >
                            Ban
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Banned Users list */}
              <div className="p-6 border border-slate-200 rounded-2xl space-y-4 bg-slate-50/20">
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2">Banned Users</h3>
                {bannedUsers.length === 0 ? (
                  <p className="text-xs text-slate-400 font-bold text-center py-6">No users banned currently.</p>
                ) : (
                  <div className="divide-y divide-slate-150">
                    {bannedUsers.map((user, idx) => (
                      <div key={idx} className="py-3 flex justify-between items-center gap-4">
                        <div>
                          <strong className="text-xs font-black text-red-600 block">{user}</strong>
                          <span className="text-[9px] text-red-500 font-black uppercase tracking-widest block bg-red-50 border border-red-100 px-1 rounded">BANNED</span>
                        </div>
                        <button
                          onClick={() => handleUnbanUser(user)}
                          className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[9px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <UserCheck className="w-3 h-3" />
                          Unban
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
