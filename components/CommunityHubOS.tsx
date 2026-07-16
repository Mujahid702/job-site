"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getPosts, createPost, upvotePost, createComment, reportPost } from "@/lib/db/community";
import { getUserProfile, upsertUserProfile } from "@/lib/db/profiles";
import { getScopedKey } from "@/lib/security/LocalStorage";
import { createClient } from "@/lib/supabase/client";

import {
  MessageCircle,
  ThumbsUp,
  Bookmark,
  Bot,
  User,
  Send,
  FileText,
  Compass,
  Briefcase,
  Search,
  Bell,
  Trophy,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

// Interfaces
export interface FeedPost {
  id: string;
  author: string;
  authorRole: string;
  authorCompany?: string;
  type: "Placement Update" | "Job Opportunity" | "Resume Tip" | "Interview Experience" | "Success Story" | "Resource" | "Learning Progress";
  category: string;
  content: string;
  tags: string[];
  likes: number;
  comments: Array<{ author: string; content: string; dateAdded: string; id?: string; reports?: Array<{ reason: string; reportedBy: string; date: string }>; flagged?: boolean }>;
  bookmarked: boolean;
  likedByUser: boolean;
  dateAdded: string;
  shareData?: {
    type: "ats" | "portfolio" | "project" | "tracker";
    value: string;
  };
  reports?: Array<{ reason: string; reportedBy: string; date: string }>;
  flagged?: boolean;
}

export interface InterviewExperience {
  id: string;
  company: string;
  role: string;
  year: number;
  roundsCount: number;
  questions: string[];
  difficulty: "Easy" | "Medium" | "Hard";
  prepResources: string;
  tips: string;
  outcome: "Selected" | "Rejected" | "Pending";
  helpfulVotes: number;
  votesByUser: boolean;
  author: string;
}

export interface TeamPost {
  id: string;
  author: string;
  roleWanted: string;
  skillsNeeded: string[];
  projectType: string;
  description: string;
  college: string;
  dateAdded: string;
}

export interface ReferralRequest {
  id: string;
  studentName: string;
  targetCompany: string;
  targetRole: string;
  resumeScore: number;
  portfolioUrl: string;
  status: "Pending" | "Referred" | "Declined";
  dateRequested: string;
}

// Initial Mock Feed Posts
const INITIAL_POSTS: FeedPost[] = [
  {
    id: "post-1",
    author: "Siddharth Verma",
    authorRole: "Software Engineer Intern",
    authorCompany: "Google",
    type: "Success Story",
    category: "Placements",
    content: "Thrilled to announce I cleared the final roundtable interview at Google! Special thanks to Google mentor Sarah Jenkins. The mock system design session on distributed caches and atomic stock reductions was a direct game changer.",
    tags: ["Placements", "Google", "System Design"],
    likes: 42,
    comments: [
      { author: "Rahul Sharma", content: "Huge congratulations Siddharth! Well deserved.", dateAdded: "2026-06-02" },
      { author: "Neha Patel", content: "Awesome achievement, gives us motivation!", dateAdded: "2026-06-03" }
    ],
    bookmarked: false,
    likedByUser: false,
    dateAdded: "2026-06-01"
  },
  {
    id: "post-2",
    author: "Neha Patel",
    authorRole: "Software Developer Graduate",
    authorCompany: "Accenture",
    type: "Learning Progress",
    category: "Accenture",
    content: "Cleared the Accenture Cognitive & Coding Assessment today! The SQL question bank and mock OA simulations on BuggedBrain's Accenture Prep OS matched the exact pattern. Keep practicing Joins indices optimizations.",
    tags: ["Accenture", "Aptitude", "SQL"],
    likes: 24,
    comments: [
      { author: "David Miller", content: "Great tip on SQL. Indexing is key in consulting OAs too.", dateAdded: "2026-06-03" }
    ],
    bookmarked: true,
    likedByUser: false,
    dateAdded: "2026-06-02"
  },
  {
    id: "post-3",
    author: "Amit Sharma",
    authorRole: "Placed Candidate",
    authorCompany: "TCS",
    type: "Resume Tip",
    category: "Resume",
    content: "Quick checklist for TCS NQT resumes: Include at least one cloud deployment (AWS/Azure) and quantifiable metrics (e.g. 'reduced API response times by 35%'). This single formatting upgrade boosted my ATS score to 88%.",
    tags: ["Resume", "ATS", "Cloud"],
    likes: 15,
    comments: [],
    bookmarked: false,
    likedByUser: false,
    dateAdded: "2026-06-03"
  }
];

// Initial Mock Interview Experiences
const INITIAL_EXPERIENCES: InterviewExperience[] = [
  {
    id: "exp-1",
    company: "IBM",
    role: "Associate AI Developer",
    year: 2025,
    roundsCount: 3,
    questions: [
      "Explain the difference between supervised and unsupervised learning.",
      "How do LangChain vector database loops manage context sizing constraints?",
      "Write a quicksort logic in Python under O(N log N) limits."
    ],
    difficulty: "Medium",
    prepResources: "IBM Watson preparation guides on Company Prep OS",
    tips: "Be very descriptive about AI fine-tuning project pipelines and data cleansing parameters.",
    outcome: "Selected",
    helpfulVotes: 18,
    votesByUser: false,
    author: "Rahul Sharma"
  },
  {
    id: "exp-2",
    company: "Deloitte",
    role: "Technology Consultant Analyst",
    year: 2025,
    roundsCount: 2,
    questions: [
      "Describe a project bottleneck you faced and how you debugged the concurrency chokepoint.",
      "SQL query setup to fetch second highest employee CTC with offsets."
    ],
    difficulty: "Easy",
    prepResources: "Deloitte consulting case briefs sheet",
    tips: "Focus on presenting your answers using the STAR format (Situation, Task, Action, Result).",
    outcome: "Selected",
    helpfulVotes: 12,
    votesByUser: false,
    author: "David Miller"
  }
];

// Initial Mock Study Groups Chats
const INITIAL_GROUP_CHATS: Record<string, Array<{ author: string; role: string; content: string; time: string }>> = {
  "SDE Preparation": [
    { author: "Siddharth Verma", role: "Software Engineer at Google", content: "Hey guys! What SDE topic are we practicing today?", time: "05:12 PM" },
    { author: "Neha Patel", role: "Developer at Accenture", content: "I'm practicing advanced dynamic programming memoization grids.", time: "05:14 PM" },
    { author: "David Miller", role: "Cloud Architect at Deloitte", content: "Don't forget to review Redis write lock loops for transactional scale.", time: "05:15 PM" }
  ],
  "AI Engineer Preparation": [
    { author: "Rahul Sharma", role: "AI Tech Lead at IBM", content: "Watson pipeline models are deploying now. Ask any fine-tuning questions here.", time: "06:01 PM" },
    { author: "Siddharth Verma", role: "Software Engineer at Google", content: "LangChain context indexing works best with custom vector DB embeddings.", time: "06:03 PM" }
  ],
  "Deloitte Preparation": [
    { author: "David Miller", role: "Cloud Architect at Deloitte", content: "Deloitte assessment focuses on business compliance analysis algorithms.", time: "02:30 PM" }
  ]
};

// Initial Mock Leaderboard members
const LEADERBOARD_MEMBERS = [
  { name: "Arnav Gupta", company: "Amazon", points: 420, level: "Expert", avatarColor: "from-orange-500 to-amber-600" },
  { name: "Sarah Jenkins", company: "Google", points: 380, level: "Expert", avatarColor: "from-red-500 to-yellow-500" },
  { name: "Rahul Sharma", company: "IBM", points: 290, level: "Mentor", avatarColor: "from-blue-600 to-indigo-800" },
  { name: "Neha Patel", company: "Accenture", points: 195, level: "Mentor", avatarColor: "from-purple-600 to-pink-700" },
  { name: "David Miller", company: "Deloitte", points: 125, level: "Contributor", avatarColor: "from-emerald-500 to-teal-700" }
];

// Initial Challenges List
const CHALLENGES_LIST = [
  { id: "ch-1", name: "7-Day Resume Challenge", xp: 150, joined: true, progress: 3, total: 7 },
  { id: "ch-2", name: "30-Day Placement Challenge", xp: 500, joined: false, progress: 0, total: 30 },
  { id: "ch-3", name: "LinkedIn Profile Audit Challenge", xp: 200, joined: false, progress: 0, total: 5 },
  { id: "ch-4", name: "Daily DSA Quick Test", xp: 100, joined: true, progress: 1, total: 1 }
];

// Helper outside component for copilot message ID creation
const generateCopilotMsgId = () => {
  return `community-copilot-msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export default function CommunityHubOS() {
  const [activeSubTab, setActiveSubTab] = useState<string>("feed");

  // State Management
  const [posts, setPosts] = useState<FeedPost[]>(INITIAL_POSTS);
  const [experiences, setExperiences] = useState<InterviewExperience[]>(INITIAL_EXPERIENCES);
  const [userReputation, setUserReputation] = useState<number>(85); // Default Contributor starting RP points

  const [notifications, setNotifications] = useState<Array<{ id: string; text: string; date: string; read: boolean }>>([
    { id: "notif-1", text: "Neha Patel liked your success post!", date: "2026-06-03", read: false },
    { id: "notif-2", text: "New SDE Prep challenge is active. Join now!", date: "2026-06-04", read: true }
  ]);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);

  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);

  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportingCommentId, setReportingCommentId] = useState<{ postId: string; commentIndex: number } | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUserName, setCurrentUserName] = useState<string>("Mujahid Ahmed");

  // Listen to Auth State
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sync blocked users from storage on userId change
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(getScopedKey("placement_community_blocked_users", userId));
      if (stored) {
        try {
          setBlockedUsers(JSON.parse(stored));
          return;
        } catch {}
      }
      setBlockedUsers([]);
    }
  }, [userId]);

  // Sync blocked users to storage on update
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(getScopedKey("placement_community_blocked_users", userId), JSON.stringify(blockedUsers));
    }
  }, [blockedUsers, userId]);

  // Fetch community posts and experiences, join with profiles
  useEffect(() => {
    async function loadCommunityData() {
      setLoading(true);
      const allPosts = await getPosts();
      
      if (allPosts && allPosts.length > 0) {
        const feedPosts = allPosts.filter(p => p.type !== "Interview Experience");
        const expPosts = allPosts
          .filter(p => p.type === "Interview Experience")
          .map(p => ({
            id: p.id,
            company: p.shareData?.company || "Company",
            role: p.shareData?.role || "Software Engineer",
            year: p.shareData?.year || 2026,
            roundsCount: p.shareData?.roundsCount || 3,
            questions: p.shareData?.questions || [],
            difficulty: p.shareData?.difficulty || "Medium",
            prepResources: p.shareData?.prepResources || "",
            tips: p.content,
            outcome: p.shareData?.outcome || "Selected",
            helpfulVotes: p.likes || 0,
            votesByUser: p.likedByUser || false,
            author: p.author || "Anonymous"
          }));

        setPosts(feedPosts);
        if (expPosts.length > 0) {
          setExperiences(expPosts);
        }
      }

      if (userId) {
        const dbProfile = await getUserProfile(userId);
        if (dbProfile) {
          if (dbProfile.full_name) {
            setCurrentUserName(dbProfile.full_name);
          }
          if (dbProfile.raw_profile_data?.reputation) {
            setUserReputation(dbProfile.raw_profile_data.reputation);
          }
        }
      }
      setLoading(false);
    }
    loadCommunityData();
  }, [userId, activeSubTab]);

  // Sync reputation to DB profile metadata
  useEffect(() => {
    if (userId && userReputation !== 85) {
      getUserProfile(userId).then(dbProfile => {
        const existingRaw = dbProfile?.raw_profile_data || {};
        upsertUserProfile(userId, { ...existingRaw, reputation: userReputation });
      });
    }
  }, [userReputation, userId]);

  // Derived user reputation level
  const getUserLevel = () => {
    if (userReputation >= 501) return "Placement Champion";
    if (userReputation >= 301) return "Expert";
    if (userReputation >= 151) return "Mentor";
    if (userReputation >= 51) return "Contributor";
    return "Beginner";
  };

  const userLevel = getUserLevel();

  // Social feed interaction handlers
  const handleLikePost = async (postId: string) => {
    let newLikes = 0;
    setPosts(posts.map(post => {
      if (post.id === postId) {
        const liked = !post.likedByUser;
        newLikes = liked ? post.likes + 1 : post.likes - 1;
        return {
          ...post,
          likedByUser: liked,
          likes: newLikes
        };
      }
      return post;
    }));
    setUserReputation(prev => prev + 2); // Like awards a small reputation bump
    await upvotePost(postId, newLikes);
  };

  const handleBookmarkPost = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          bookmarked: !post.bookmarked
        };
      }
      return post;
    }));
  };

  const handleReportPost = async (postId: string, reason: string) => {
    setPosts(prevPosts => {
      return prevPosts.map(post => {
        if (post.id === postId) {
          const reports = (post as any).reports || [];
          const newReports = [...reports, { reason, reportedBy: currentUserName, date: new Date().toISOString() }];
          const flagged = newReports.length >= 2;
          return {
            ...post,
            reports: newReports,
            flagged
          };
        }
        return post;
      });
    });
    
    if (userId) {
      await reportPost(postId, userId, reason);
    }
    alert("Post reported successfully. Thank you for keeping our community safe.");
  };

  const handleReportComment = async (postId: string, commentIndex: number, reason: string) => {
    setPosts(prevPosts => {
      return prevPosts.map(post => {
        if (post.id === postId) {
          const comments = [...post.comments];
          const comment = { ...comments[commentIndex] };
          const reports = (comment as any).reports || [];
          const newReports = [...reports, { reason, reportedBy: currentUserName, date: new Date().toISOString() }];
          const flagged = newReports.length >= 2;
          comments[commentIndex] = {
            ...comment,
            reports: newReports,
            flagged
          } as any;
          return {
            ...post,
            comments
          };
        }
        return post;
      });
    });

    if (userId) {
      await reportPost(postId, userId, `Comment: ${reason}`);
    }
    alert("Comment reported successfully. Thank you for keeping our community safe.");
  };

  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  
  const handleAddComment = async (postId: string) => {
    const text = commentInput[postId]?.trim();
    if (!text) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    // Spam heuristics: check for repeated comment in this post
    const isRepeated = post.comments.some(c => c.author === currentUserName && c.content.trim() === text);
    if (isRepeated) {
      alert("Spam Blocked: You have already added this comment.");
      return;
    }

    setPosts(posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [
            ...p.comments,
            { 
              author: currentUserName, 
              content: text, 
              dateAdded: new Date().toISOString().split("T")[0],
              id: `comment-${Date.now()}`
            }
          ]
        };
      }
      return p;
    }));

    setCommentInput(prev => ({ ...prev, [postId]: "" }));
    setUserReputation(prev => prev + 5); // Commenting awards 5 points

    if (userId) {
      await createComment(postId, userId, text);
    }
    alert("Comment added to social feed post.");
  };

  // Platform sharing indicators
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [projectTitle, setProjectTitle] = useState<string | null>(null);
  const [portfolioTheme, setPortfolioTheme] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setTimeout(() => {
        setAtsScore(Number(localStorage.getItem(getScopedKey("ats_score", userId))));
        
        const projectProfile = localStorage.getItem(getScopedKey("project_os_profile", userId));
        if (projectProfile) {
          try {
            const parsed = JSON.parse(projectProfile);
            if (parsed.projects && parsed.projects.length > 0) {
              setProjectTitle(parsed.projects[0].title);
            }
          } catch {}
        }

        setPortfolioTheme(localStorage.getItem(getScopedKey("portfolio_profile_os_theme", userId)));
      }, 0);
    }
  }, [activeSubTab, userId]);

  const handleShareAtsScore = async () => {
    if (!atsScore) return;
    const newPost: FeedPost = {
      id: `post-${Date.now()}`,
      author: currentUserName,
      authorRole: "Candidate (Class of 2026)",
      type: "Resume Tip",
      category: "Resume",
      content: `Just optimized my resume layout using ATS Resume OS Scans. Cleared formatter guidelines and increased my overall ATS score to ${atsScore}%!`,
      tags: ["Resume", "ATS", "ScoreShare"],
      likes: 1,
      comments: [],
      bookmarked: false,
      likedByUser: false,
      dateAdded: new Date().toISOString().split("T")[0],
      shareData: {
        type: "ats",
        value: `${atsScore}%`
      }
    };

    setPosts([newPost, ...posts]);
    setUserReputation(prev => prev + 10); // Share post awards 10 points

    if (userId) {
      await createPost(userId, newPost);
    }
    alert("ATS optimization report shared to community hub feed!");
  };

  const handleShareProjectBlueprint = async () => {
    if (!projectTitle) return;
    const newPost: FeedPost = {
      id: `post-${Date.now()}`,
      author: currentUserName,
      authorRole: "Candidate (Class of 2026)",
      type: "Learning Progress",
      category: "Projects",
      content: `Just compiled a high-throughput project blueprint using Project Advisor OS: "${projectTitle}". Mapped dynamic SQL database caching lock routines to prevent double-booking locks.`,
      tags: ["Projects", "SystemDesign", "Blueprint"],
      likes: 1,
      comments: [],
      bookmarked: false,
      likedByUser: false,
      dateAdded: new Date().toISOString().split("T")[0],
      shareData: {
        type: "project",
        value: projectTitle
      }
    };

    setPosts([newPost, ...posts]);
    setUserReputation(prev => prev + 10);

    if (userId) {
      await createPost(userId, newPost);
    }
    alert("Project blueprint shared successfully!");
  };

  const handleSharePortfolioTheme = async () => {
    if (!portfolioTheme) return;
    const newPost: FeedPost = {
      id: `post-${Date.now()}`,
      author: currentUserName,
      authorRole: "Candidate (Class of 2026)",
      type: "Learning Progress",
      category: "Portfolio",
      content: `Just published my live interactive portfolio on Portfolio OS! Chosen theme: ${portfolioTheme}. Ready for recruiters inbound reach.`,
      tags: ["Portfolio", "Theme", "Branding"],
      likes: 1,
      comments: [],
      bookmarked: false,
      likedByUser: false,
      dateAdded: new Date().toISOString().split("T")[0],
      shareData: {
        type: "portfolio",
        value: portfolioTheme
      }
    };

    setPosts([newPost, ...posts]);
    setUserReputation(prev => prev + 10);

    if (userId) {
      await createPost(userId, newPost);
    }
    alert("Portfolio theme setup shared to community!");
  };

  const handleMarkAllNotifRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  // Create standard post
  const [newPostText, setNewPostText] = useState("");
  const [newPostType, setNewPostType] = useState<FeedPost["type"]>("Learning Progress");
  const [newPostCategory, setNewPostCategory] = useState("Placements");

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newPostText.trim();
    if (!text) return;

    // Spam heuristics: repeated identical text
    const isRepeated = posts.some(p => p.author === currentUserName && p.content.trim() === text);
    if (isRepeated) {
      alert("Spam Blocked: You have already published this identical text recently.");
      return;
    }

    // Spam heuristics: 5 posts within 1 minute
    const oneMinuteAgo = Date.now() - 60000;
    const recentPostsCount = posts.filter(p => {
      if (p.author !== currentUserName) return false;
      const parts = p.id.split("-");
      if (parts.length < 2) return false;
      const timestamp = parseInt(parts[1]);
      return !isNaN(timestamp) && timestamp > oneMinuteAgo;
    }).length;

    if (recentPostsCount >= 5) {
      alert("Spam Blocked: Rate limit exceeded. You cannot post more than 5 times in 1 minute.");
      return;
    }

    const newPost: FeedPost = {
      id: `post-${Date.now()}`,
      author: currentUserName,
      authorRole: "Candidate (Class of 2026)",
      type: newPostType,
      category: newPostCategory,
      content: newPostText,
      tags: [newPostCategory, newPostType.replace(" ", "")],
      likes: 0,
      comments: [],
      bookmarked: false,
      likedByUser: false,
      dateAdded: new Date().toISOString().split("T")[0]
    };

    setPosts([newPost, ...posts]);
    setNewPostText("");
    setUserReputation(prev => prev + 10);

    if (userId) {
      await createPost(userId, newPost);
    }
    alert("Update post shared successfully.");
  };

  // Interview Experience submissions
  const [newCompany, setNewCompany] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newQuestions, setNewQuestions] = useState("");
  const [newTips, setNewTips] = useState("");
  const [newDifficulty, setNewDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");

  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.trim() || !newRole.trim()) return;

    const newExp: InterviewExperience = {
      id: `exp-${Date.now()}`,
      company: newCompany,
      role: newRole,
      year: 2026,
      roundsCount: 3,
      questions: newQuestions.split("\n").filter(Boolean),
      difficulty: newDifficulty,
      prepResources: "BuggedBrain Company Prep OS sheets",
      tips: newTips || "Practice mock sessions under Mentorship OS first.",
      outcome: "Selected",
      helpfulVotes: 0,
      votesByUser: false,
      author: currentUserName
    };

    setExperiences([newExp, ...experiences]);
    setNewCompany("");
    setNewRole("");
    setNewQuestions("");
    setNewTips("");
    setUserReputation(prev => prev + 25); // Experience submission is highly valued (25 RP)

    if (userId) {
      await createPost(userId, {
        title: `${newRole} Interview Experience at ${newCompany}`,
        content: newTips || "Practice mock sessions under Mentorship OS first.",
        type: "Interview Experience",
        category: "Experiences",
        likes: 0,
        shareData: {
          company: newCompany,
          role: newRole,
          year: 2026,
          roundsCount: 3,
          questions: newQuestions.split("\n").filter(Boolean),
          difficulty: newDifficulty,
          prepResources: "BuggedBrain Company Prep OS sheets",
          outcome: "Selected"
        }
      });
    }
    alert("Placement interview experience shared to community library. +25 reputation points!");
  };

  const handleVoteHelpful = (expId: string) => {
    setExperiences(experiences.map(exp => {
      if (exp.id === expId) {
        const voted = !exp.votesByUser;
        return {
          ...exp,
          votesByUser: voted,
          helpfulVotes: voted ? exp.helpfulVotes + 1 : exp.helpfulVotes - 1
        };
      }
      return exp;
    }));
  };

  // Study Groups Chat box logic
  const [selectedGroup, setSelectedGroup] = useState<string>("SDE Preparation");
  const [groupChats, setGroupChats] = useState(INITIAL_GROUP_CHATS);
  const [chatInput, setChatInput] = useState("");

  const handleSendGroupMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = {
      author: "Mujahid Ahmed",
      role: "Candidate (Reputation: 85)",
      content: chatInput,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setGroupChats(prev => ({
      ...prev,
      [selectedGroup]: [...(prev[selectedGroup] || []), newMsg]
    }));

    setChatInput("");
    setUserReputation(prev => prev + 3); // Active chatting awards 3 points
  };

  // Team Finder matching listings
  const [teamPosts, setTeamPosts] = useState<TeamPost[]>([
    { id: "team-1", author: "Rahul Sharma", roleWanted: "Backend Go Developer", skillsNeeded: ["Go", "Kubernetes", "PostgreSQL"], projectType: "Distributed Transaction Locks Log", description: "Looking for an advanced Go developer to help scale database replication scripts for hackathon prototypes.", college: "VTU engineering", dateAdded: "2026-06-03" }
  ]);
  const [newTeamRole, setNewTeamRole] = useState("");
  const [newTeamSkills, setNewTeamSkills] = useState("");
  const [newTeamDesc, setNewTeamDesc] = useState("");

  const handleAddTeamFinderLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamRole.trim() || !newTeamDesc.trim()) return;

    const newTeam: TeamPost = {
      id: `team-post-${Date.now()}`,
      author: "Mujahid Ahmed",
      roleWanted: newTeamRole,
      skillsNeeded: newTeamSkills.split(",").map(s => s.trim()).filter(Boolean),
      projectType: "Hackathon Prep Project",
      description: newTeamDesc,
      college: "VTU Class of 2026",
      dateAdded: new Date().toISOString().split("T")[0]
    };

    setTeamPosts([newTeam, ...teamPosts]);
    setNewTeamRole("");
    setNewTeamSkills("");
    setNewTeamDesc("");
    setUserReputation(prev => prev + 10);
    alert("Team collaboration request listed!");
  };

  // Referral exchanges list
  const [referralRequests, setReferralRequests] = useState<ReferralRequest[]>([
    { id: "ref-1", studentName: "Siddharth Verma", targetCompany: "Google", targetRole: "Software Engineer", resumeScore: 92, portfolioUrl: "siddharthverma.dev", status: "Referred", dateRequested: "2026-06-02" },
    { id: "ref-2", studentName: "Mujahid Ahmed", targetCompany: "Amazon", targetRole: "Full Stack Engineer", resumeScore: 88, portfolioUrl: "mujahidcodes.dev", status: "Pending", dateRequested: "2026-06-04" }
  ]);
  const [targetRefCompany, setTargetRefCompany] = useState("Amazon");
  const [targetRefRole, setTargetRefRole] = useState("Software Engineer");

  const handleRequestReferral = (e: React.FormEvent) => {
    e.preventDefault();
    const newRef: ReferralRequest = {
      id: `ref-${Date.now()}`,
      studentName: "Mujahid Ahmed",
      targetCompany: targetRefCompany,
      targetRole: targetRefRole,
      resumeScore: atsScore || 75,
      portfolioUrl: "mujahidcodes.dev",
      status: "Pending",
      dateRequested: new Date().toISOString().split("T")[0]
    };

    setReferralRequests([newRef, ...referralRequests]);
    setUserReputation(prev => prev + 10);
    alert("Referral request submitted to verified employee directory board.");
  };

  // Challenge campaigns checklist progress
  const [challenges, setChallenges] = useState(CHALLENGES_LIST);
  const handleJoinChallenge = (id: string) => {
    setChallenges(challenges.map(ch => {
      if (ch.id === id) {
        return {
          ...ch,
          joined: true,
          progress: ch.progress + 1
        };
      }
      return ch;
    }));
    alert("Joined community preparation challenge campaign!");
  };

  // Copilot stratégic advisor completion
  const [copilotMessages, setCopilotMessages] = useState<Array<{ id: string; role: "user" | "copilot"; content: string }>>([
    {
      id: "comm-welcome",
      role: "copilot",
      content: "Hello! I am your **Community Hub Copilot**. I can help you search interview experiences for top companies (IBM/Deloitte/Accenture), recommend SDE study groups, or match you with hackathon collaborators."
    }
  ]);
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);

  const handleCopilotSend = async (customPrompt?: string) => {
    const query = (customPrompt || copilotInput).trim();
    if (!query) return;

    setCopilotInput("");
    const userMsg = {
      id: generateCopilotMsgId(),
      role: "user" as const,
      content: query
    };

    const updatedMsgs = [...copilotMessages, userMsg];
    setCopilotMessages(updatedMsgs);
    setCopilotLoading(true);

    try {
      const apiKey = typeof window !== "undefined" ? localStorage.getItem(getScopedKey("gemini_api_key", userId)) || "" : "";
      const res = await fetch("/api/placement/copilot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": apiKey
        },
        body: JSON.stringify({
          message: `Community OS query: ${query}`,
          history: updatedMsgs.slice(-6).map(m => ({ role: m.role, content: m.content })),
          context: {
            reputation: userReputation,
            level: userLevel,
            challengesJoined: challenges.filter(c => c.joined).length
          }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error();

      setCopilotMessages([
        ...updatedMsgs,
        {
          id: generateCopilotMsgId(),
          role: "copilot" as const,
          content: data.data.reply
        }
      ]);
    } catch {
      const q = query.toLowerCase();
      let reply = "";

      if (q.includes("ibm") || q.includes("experience")) {
        reply = `### IBM Interview Experiences Found:
- **Associate AI Developer (2025)** shared by **Rahul Sharma**.
- **Difficulty**: Medium.
- **Rounds**: 3 Rounds (Cognitive OA, Coding Test, Technical Panel).
- **Core Topics**: LangChain context loops, Spring Boot DI, quicksort.`;
      } else if (q.includes("study") || q.includes("group")) {
        reply = `### Recommended Study Groups:
1. **SDE Preparation** (Active discussion on Dynamic Programming grids).
2. **AI Engineer Preparation** (Managed by Rahul Sharma on Watson pipelines deployment).`;
      } else if (q.includes("challenge")) {
        reply = `### Active Community Campaigns:
- **7-Day Resume Challenge**: Cleared 3 days. Earn +150 XP.
- **30-Day Placement Challenge**: Cleared 0 days. Earn +500 XP.`;
      } else {
        reply = `Search query mapped. Try matching templates by clicking quick-actions links: **"CRACK IBM EXPERIENCES"** or **"JOIN SDE STUDY ROOM"**.`;
      }

      setCopilotMessages([
        ...updatedMsgs,
        {
          id: generateCopilotMsgId(),
          role: "copilot" as const,
          content: reply
        }
      ]);
    } finally {
      setCopilotLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative font-sans">
      
      {/* LEFT COLUMN: Main discussion panel tabs */}
      <div className="lg:col-span-8 space-y-8">
        
        {/* Title panel */}
        <div className="max-w-3xl flex justify-between items-start flex-wrap gap-4 w-full">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
              <Compass className="w-3.5 h-3.5" />
              Social Placement Community
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight font-display">
              Community Hub OS
            </h1>
            <p className="text-slate-500 font-medium text-sm max-w-xl">
              Network with classmates, review interview experiences log files, share portfolios theme configurations, and join collaborative SDE/AI coding study groups.
            </p>
          </div>

          {/* Notifications Feed Drawer Button */}
          <div className="relative">
            <button
              onClick={() => setShowNotifDrawer(!showNotifDrawer)}
              className="relative p-3 bg-white border border-slate-200 hover:border-slate-350 hover:bg-slate-50 transition-all rounded-2xl cursor-pointer shadow-sm flex items-center justify-center text-slate-655"
            >
              <Bell className="w-5 h-5 text-indigo-500" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-1 right-1 h-3.5 w-3.5 bg-rose-500 text-white font-black text-[8px] flex items-center justify-center rounded-full animate-bounce">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>

            {/* Drawer Popover */}
            {showNotifDrawer && (
              <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xl shadow-slate-200/50 z-30 space-y-4 animate-fade-in text-slate-800">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                  <strong className="text-xs font-black text-slate-800 uppercase tracking-wide">Notifications Feed</strong>
                  <button
                    type="button"
                    onClick={handleMarkAllNotifRead}
                    className="text-[9px] font-black text-indigo-650 uppercase hover:underline cursor-pointer"
                  >
                    Mark Read
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-[10px] text-slate-400 font-bold text-center py-4">No recent notifications</p>
                  ) : (
                    notifications.map(notif => (
                      <div
                        key={notif.id}
                        className={cn(
                          "p-3 rounded-xl border transition-all text-xs flex flex-col justify-between gap-1",
                          notif.read ? "bg-slate-50/50 border-slate-150 text-slate-500" : "bg-blue-50/30 border-blue-100 text-slate-800"
                        )}
                      >
                        <p className="font-semibold leading-normal">{notif.text}</p>
                        <span className="text-[8px] text-slate-400 font-black tracking-wider uppercase mt-1">{notif.date}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Categories Tabs selection */}
        <div className="flex flex-wrap border-b border-slate-200 bg-white p-2 rounded-2xl shadow-sm gap-1">
          {[
            { id: "feed", label: "Community Feed", icon: <Compass className="w-4 h-4" /> },
            { id: "experiences", label: "Interview Experiences", icon: <FileText className="w-4 h-4 animate-pulse" /> },
            { id: "study-groups", label: "Study Rooms", icon: <Users className="w-4 h-4" /> },
            { id: "team-finder", label: "Team Finder", icon: <Search className="w-4 h-4" /> },
            { id: "referrals", label: "Referral Exchange", icon: <Briefcase className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                activeSubTab === tab.id
                  ? "bg-slate-900 text-white shadow-md"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Card content area */}
        <div className="bg-white rounded-[2.5rem] p-6 md:p-10 border border-slate-200/60 shadow-sm min-h-[500px]">
          
          {/* TAB 1: COMMUNITY FEED */}
          {activeSubTab === "feed" && (
            <div className="space-y-8 animate-fade-in">
              
              {/* Share Platform Metrics quick panel */}
              <div className="p-5 bg-blue-50/30 border border-blue-100 rounded-3xl space-y-3">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">Quick Share Dashboard Metrics</span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {atsScore ? (
                    <button
                      onClick={handleShareAtsScore}
                      className="px-3 py-1.5 bg-white border border-blue-200 text-blue-700 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-100 transition-all cursor-pointer"
                    >
                      Share ATS Score ({atsScore}%)
                    </button>
                  ) : null}

                  {projectTitle ? (
                    <button
                      onClick={handleShareProjectBlueprint}
                      className="px-3 py-1.5 bg-white border border-blue-200 text-blue-700 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-100 transition-all cursor-pointer"
                    >
                      Share Project: {projectTitle.slice(0, 18)}...
                    </button>
                  ) : null}

                  {portfolioTheme ? (
                    <button
                      onClick={handleSharePortfolioTheme}
                      className="px-3 py-1.5 bg-white border border-blue-200 text-blue-700 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-100 transition-all cursor-pointer"
                    >
                      Share Portfolio: {portfolioTheme}
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Form to post updates */}
              <form onSubmit={handleCreatePost} className="space-y-4 border border-slate-200 p-6 rounded-2xl bg-slate-50/30">
                <div>
                  <label className="text-[9px] font-black text-slate-450 uppercase tracking-widest block mb-2">Share a Placement Resource / Progress update</label>
                  <textarea
                    rows={3}
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                    placeholder="Type details here..."
                  />
                </div>

                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div className="flex gap-2">
                    <select
                      value={newPostType}
                      onChange={(e) => setNewPostType(e.target.value as FeedPost["type"])}
                      className="p-2 bg-white border border-slate-250 rounded-xl text-[10px] font-black focus:outline-none"
                    >
                      <option value="Learning Progress">Learning Progress</option>
                      <option value="Resume Tip">Resume Tip</option>
                      <option value="Job Opportunity">Job Opportunity</option>
                    </select>

                    <select
                      value={newPostCategory}
                      onChange={(e) => setNewPostCategory(e.target.value)}
                      className="p-2 bg-white border border-slate-250 rounded-xl text-[10px] font-black focus:outline-none"
                    >
                      <option value="Placements">Placements</option>
                      <option value="Resume">Resume</option>
                      <option value="DSA">DSA</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-650 transition-all cursor-pointer"
                  >
                    Publish Post
                  </button>
                </div>
              </form>
              {/* Posts Feed list */}
              <div className="space-y-6 pt-4">
                {posts
                  .filter(post => !blockedUsers.includes(post.author) && !post.flagged)
                  .map(post => (
                  <div key={post.id} className="border border-slate-200 p-6 rounded-[2rem] bg-white space-y-4 shadow-sm flex flex-col justify-between">
                    <div className="space-y-3">
                      {/* Post Header */}
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-sm font-black text-slate-800 block">{post.author}</strong>
                            {post.author !== "Mujahid Ahmed" && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Block ${post.author}?`)) {
                                    setBlockedUsers(prev => [...prev, post.author]);
                                  }
                                }}
                                className="text-[9px] text-red-500 hover:underline font-bold cursor-pointer"
                              >
                                Block
                              </button>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                            {post.authorRole} {post.authorCompany ? `@ ${post.authorCompany}` : ""}
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 text-[8px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 border border-indigo-150 rounded">
                          {post.type}
                        </span>
                      </div>

                      {/* Content block */}
                      <p className="text-xs text-slate-650 font-semibold leading-relaxed leading-normal">{post.content}</p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {post.tags.map((tag, idx) => (
                          <span key={idx} className="px-2.5 py-0.5 bg-slate-50 text-slate-500 text-[8px] font-black uppercase tracking-wider rounded border border-slate-100">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Inline post report panel */}
                    {reportingPostId === post.id && (
                      <div className="flex flex-wrap gap-2 p-3 bg-red-50/50 rounded-2xl border border-red-100 mt-2">
                        <span className="text-[9px] font-black text-red-700 uppercase tracking-widest block w-full">Report Post Reason:</span>
                        {["Spam", "Abuse", "Fake Information", "Harassment", "Other"].map(reason => (
                          <button
                            key={reason}
                            type="button"
                            onClick={() => {
                              handleReportPost(post.id, reason);
                              setReportingPostId(null);
                            }}
                            className="px-2.5 py-1 bg-white border border-red-200 text-red-700 hover:bg-red-50 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all"
                          >
                            {reason}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setReportingPostId(null)}
                          className="px-2.5 py-1 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all ml-auto"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {/* Inline comment report panel */}
                    {reportingCommentId?.postId === post.id && (
                      <div className="flex flex-wrap gap-2 p-3 bg-red-50/50 rounded-2xl border border-red-100 mt-2">
                        <span className="text-[9px] font-black text-red-700 uppercase tracking-widest block w-full">Report Comment Reason:</span>
                        {["Spam", "Abuse", "Fake Information", "Harassment", "Other"].map(reason => (
                          <button
                            key={reason}
                            type="button"
                            onClick={() => {
                              handleReportComment(post.id, reportingCommentId.commentIndex, reason);
                              setReportingCommentId(null);
                            }}
                            className="px-2.5 py-1 bg-white border border-red-200 text-red-700 hover:bg-red-50 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all"
                          >
                            {reason}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setReportingCommentId(null)}
                          className="px-2.5 py-1 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all ml-auto"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {/* Footer Interactions */}
                    <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs mt-3">
                      <div className="flex gap-4">
                        <button
                          onClick={() => handleLikePost(post.id)}
                          className={cn(
                            "flex items-center gap-1.5 font-bold transition-colors cursor-pointer text-[10px]",
                            post.likedByUser ? "text-indigo-600 font-black" : "text-slate-450 hover:text-slate-800"
                          )}
                        >
                          <ThumbsUp className="w-4.5 h-4.5" />
                          <span>{post.likes} Likes</span>
                        </button>

                        <span className="flex items-center gap-1.5 text-slate-450 text-[10px]">
                          <MessageCircle className="w-4.5 h-4.5" />
                          <span>{post.comments.filter(c => !blockedUsers.includes(c.author) && !(c as any).flagged).length} Comments</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => setReportingPostId(post.id)}
                          className="flex items-center gap-1 text-[10px] text-red-500 hover:text-red-750 font-bold transition-colors cursor-pointer"
                        >
                          Report
                        </button>
                      </div>

                      <button
                        onClick={() => handleBookmarkPost(post.id)}
                        className={cn(
                          "p-1.5 rounded-lg cursor-pointer",
                          post.bookmarked ? "text-amber-500" : "text-slate-400 hover:text-slate-700"
                        )}
                      >
                        <Bookmark className="w-4.5 h-4.5" />
                      </button>
                    </div>

                    {/* Comments Sheet list */}
                    {post.comments.some(c => !blockedUsers.includes(c.author) && !(c as any).flagged) && (
                      <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-2.5 mt-2">
                        {post.comments.map((comment, cIdx) => {
                          if (blockedUsers.includes(comment.author) || (comment as any).flagged) return null;
                          return (
                            <div key={cIdx} className="text-xs flex justify-between items-start gap-4">
                              <div className="space-y-0.5">
                                <strong className="text-slate-800 font-black">{comment.author}</strong>
                                <p className="text-slate-650 font-semibold leading-normal">{comment.content}</p>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setReportingCommentId({ postId: post.id, commentIndex: cIdx })}
                                  className="text-[9px] text-red-500 hover:underline font-bold cursor-pointer"
                                >
                                  Report
                                </button>
                                {comment.author !== "Mujahid Ahmed" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`Block ${comment.author}?`)) {
                                        setBlockedUsers(prev => [...prev, comment.author]);
                                      }
                                    }}
                                    className="text-[9px] text-red-500 hover:underline font-bold cursor-pointer"
                                  >
                                    Block
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add comment input */}
                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        value={commentInput[post.id] || ""}
                        onChange={(e) => setCommentInput({ ...commentInput, [post.id]: e.target.value })}
                        className="flex-grow p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        className="px-3 bg-slate-900 text-white text-[10px] font-black uppercase rounded-xl cursor-pointer"
                      >
                        Send
                      </button>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 2: INTERVIEW EXPERIENCES */}
          {activeSubTab === "experiences" && (
            <div className="space-y-8 animate-fade-in">
              <h2 className="text-xl font-black text-slate-900 font-display">Interview Experiences Library</h2>

              {/* Submit experience form */}
              <form onSubmit={handleAddExperience} className="space-y-4 border border-slate-200 p-6 rounded-2xl bg-slate-50/30">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-450 uppercase tracking-widest block mb-1">Company Name</label>
                    <input
                      type="text"
                      required
                      value={newCompany}
                      onChange={(e) => setNewCompany(e.target.value)}
                      placeholder="E.g. Deloitte"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-450 uppercase tracking-widest block mb-1">Target Role</label>
                    <input
                      type="text"
                      required
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      placeholder="E.g. Consultant Architect"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-450 uppercase tracking-widest block mb-1">Difficulty Metric</label>
                    <select
                      value={newDifficulty}
                      onChange={(e) => setNewDifficulty(e.target.value as InterviewExperience["difficulty"])}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                    >
                      <option value="Easy">Easy Assessment</option>
                      <option value="Medium">Medium Technical</option>
                      <option value="Hard">Hard / FAANG Level</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-450 uppercase tracking-widest block mb-1">Rounds Questions Asked (one per line)</label>
                  <textarea
                    rows={3}
                    value={newQuestions}
                    onChange={(e) => setNewQuestions(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                    placeholder="E.g. Write a quicksort logic in Python..."
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-450 uppercase tracking-widest block mb-1">Preparation Tips & Advice</label>
                  <input
                    type="text"
                    value={newTips}
                    onChange={(e) => setNewTips(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                    placeholder="E.g. Focus on memory limits analysis..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-650 transition-all cursor-pointer shadow-sm"
                >
                  Publish Interview Experience (+25 Reputation XP)
                </button>
              </form>

              {/* Experiences Cards List */}
              <div className="space-y-4">
                {experiences
                  .filter(exp => !blockedUsers.includes(exp.author))
                  .map(exp => (
                  <div key={exp.id} className="border border-slate-200 p-6 rounded-[2.5rem] bg-white space-y-4 shadow-sm flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <strong className="text-sm font-black text-slate-800 block">{exp.company} &bull; {exp.role}</strong>
                          <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Contributor: {exp.author} ({exp.year})</span>
                        </div>
                        <span className={cn(
                          "px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                          exp.difficulty === "Hard"
                            ? "bg-rose-50 border-rose-100 text-rose-600"
                            : exp.difficulty === "Medium"
                            ? "bg-amber-50 border-amber-100 text-amber-600"
                            : "bg-emerald-50 border-emerald-100 text-emerald-600"
                        )}>
                          {exp.difficulty}
                        </span>
                      </div>

                      {/* Questions */}
                      <div className="space-y-2">
                        <strong className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Questions Mapped:</strong>
                        <ul className="space-y-1 text-xs font-semibold text-slate-700">
                          {exp.questions.map((q, idx) => (
                            <li key={idx} className="list-disc ml-4 leading-relaxed">{q}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-550 leading-relaxed leading-normal">
                        <strong>Tips:</strong> {exp.tips}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-between items-center mt-3">
                      <button
                        onClick={() => handleVoteHelpful(exp.id)}
                        className={cn(
                          "flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer",
                          exp.votesByUser ? "text-indigo-650" : "text-slate-400 hover:text-slate-700"
                        )}
                      >
                        <Trophy className="w-4 h-4" />
                        <span>{exp.helpfulVotes} Helpful Votes</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 3: STUDY GROUPS */}
          {activeSubTab === "study-groups" && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-black text-slate-900 font-display">Study Rooms & Channels</h2>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Rooms selection lists */}
                <div className="md:col-span-4 space-y-2 border-r border-slate-100 pr-4">
                  {Object.keys(groupChats).map(room => (
                    <button
                      key={room}
                      onClick={() => setSelectedGroup(room)}
                      className={cn(
                        "w-full p-3 rounded-xl text-xs font-black uppercase tracking-wider text-left transition-all cursor-pointer",
                        selectedGroup === room
                          ? "bg-slate-900 text-white shadow"
                          : "text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      {room}
                    </button>
                  ))}
                </div>

                {/* Simulated live chat box */}
                <div className="md:col-span-8 flex flex-col h-[350px] border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/20 relative">
                  <div className="flex-grow overflow-y-auto p-4 space-y-3.5 min-h-0">
                    {(groupChats[selectedGroup] || [])
                      .filter(chat => !blockedUsers.includes(chat.author))
                      .map((chat, idx) => (
                      <div key={idx} className="text-xs space-y-1 select-none">
                        <div className="flex justify-between items-baseline">
                          <strong className="text-slate-800 font-black">{chat.author}</strong>
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">{chat.time}</span>
                        </div>
                        <p className="text-slate-600 font-semibold leading-relaxed">{chat.content}</p>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSendGroupMessage} className="p-3 border-t border-slate-150 bg-white flex gap-2">
                    <input
                      type="text"
                      placeholder={`Message in #${selectedGroup.toLowerCase()}...`}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="flex-grow p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-3 bg-slate-900 text-white text-[10px] font-black uppercase rounded-xl cursor-pointer"
                    >
                      Send
                    </button>
                  </form>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: TEAM FINDER */}
          {activeSubTab === "team-finder" && (
            <div className="space-y-8 animate-fade-in">
              <h2 className="text-xl font-black text-slate-900 font-display">Team Finder Matcher</h2>

              {/* Log new team search */}
              <form onSubmit={handleAddTeamFinderLog} className="space-y-4 border border-slate-200 p-6 rounded-2xl bg-slate-50/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-450 uppercase tracking-widest block mb-1">Required Role Wanted</label>
                    <input
                      type="text"
                      required
                      value={newTeamRole}
                      onChange={(e) => setNewTeamRole(e.target.value)}
                      placeholder="E.g. Full Stack Developer"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-450 uppercase tracking-widest block mb-1">Key Skills Mapped (comma-separated)</label>
                    <input
                      type="text"
                      value={newTeamSkills}
                      onChange={(e) => setNewTeamSkills(e.target.value)}
                      placeholder="E.g. Go, Kubernetes, REST APIs"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-450 uppercase tracking-widest block mb-1">Project Description & Collboration Goals</label>
                  <textarea
                    rows={2}
                    value={newTeamDesc}
                    onChange={(e) => setNewTeamDesc(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                    placeholder="Explain what you are building..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-650 transition-all cursor-pointer"
                >
                  List Collaboration Request (+10 Reputation RP)
                </button>
              </form>

              {/* Collaboration Listings */}
              <div className="space-y-4">
                {teamPosts
                  .filter(post => !blockedUsers.includes(post.author))
                  .map(post => (
                  <div key={post.id} className="border border-slate-200 p-5 rounded-[2.5rem] bg-white space-y-4 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <strong className="text-sm font-black text-slate-800 block">Wanted: {post.roleWanted}</strong>
                        <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Author: {post.author} &bull; {post.college}</span>
                      </div>
                      <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-150 text-[9px] font-black uppercase text-indigo-650 rounded">Active Team</span>
                    </div>

                    <p className="text-xs text-slate-600 font-semibold leading-relaxed">{post.description}</p>

                    <div className="flex flex-wrap gap-1.5">
                      {post.skillsNeeded.map((skill, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[9px] font-black uppercase rounded border border-slate-100">{skill}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 5: REFERRAL EXCHANGE */}
          {activeSubTab === "referrals" && (
            <div className="space-y-8 animate-fade-in">
              <h2 className="text-xl font-black text-slate-900 font-display">Referral Exchange Board</h2>

              {/* Submit request form */}
              <form onSubmit={handleRequestReferral} className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-slate-200 p-6 rounded-2xl bg-slate-50/30">
                <div>
                  <label className="text-[9px] font-black text-slate-450 uppercase tracking-widest block mb-1">Target Company</label>
                  <input
                    type="text"
                    required
                    value={targetRefCompany}
                    onChange={(e) => setTargetRefCompany(e.target.value)}
                    placeholder="E.g. Amazon"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-450 uppercase tracking-widest block mb-1">Target Career Role</label>
                  <input
                    type="text"
                    required
                    value={targetRefRole}
                    onChange={(e) => setTargetRefRole(e.target.value)}
                    placeholder="E.g. Full Stack Engineer"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-650 transition-all cursor-pointer shadow-sm"
                  >
                    Request Referral
                  </button>
                </div>
              </form>

              {/* Referral Request lists */}
              <div className="space-y-4">
                {referralRequests
                  .filter(req => !blockedUsers.includes(req.studentName))
                  .map(req => (
                  <div key={req.id} className="border border-slate-200 p-5 rounded-2xl bg-white flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-indigo-150 transition-colors">
                    <div>
                      <strong className="text-sm font-black text-slate-800 block">Target: {req.targetCompany} &bull; {req.targetRole}</strong>
                      <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Student: {req.studentName} &bull; Resume Score: {req.resumeScore}%</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest rounded border",
                        req.status === "Pending"
                          ? "bg-amber-50 border-amber-100 text-amber-600"
                          : "bg-emerald-50 border-emerald-100 text-emerald-600"
                      )}>
                        {req.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>

      </div>

      {/* RIGHT COLUMN: Reputation points stats & leaderboards / challenges list */}
      <div className="lg:col-span-4 space-y-8">
        
        {/* User Community Profile widget */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-5">
          <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Community Profile</strong>
          
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md shrink-0">
              M
            </div>
            <div>
              <strong className="text-sm font-black text-slate-800 block">Mujahid Ahmed</strong>
              <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-600 text-[8px] font-black uppercase tracking-widest rounded block mt-1 w-max">
                Level: {userLevel}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 py-2 border-t border-slate-100 text-center">
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Reputation Points</span>
              <strong className="text-xl font-black text-slate-800 block mt-1">{userReputation} RP</strong>
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">XP Level Progress</span>
              <strong className="text-xl font-black text-slate-800 block mt-1">
                {userReputation > 500 ? "Max" : `${Math.round((userReputation / 500) * 100)}%`}
              </strong>
            </div>
          </div>
        </div>

        {/* Weekly Challenges Campaign */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-5">
          <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Active Community Challenges</strong>

          <div className="space-y-4">
            {challenges.map(ch => (
              <div key={ch.id} className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <strong className="text-xs font-black text-slate-800 block leading-tight">{ch.name}</strong>
                    <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest block mt-0.5">Rewards: +{ch.xp} XP</span>
                  </div>
                  
                  {!ch.joined ? (
                    <button
                      onClick={() => handleJoinChallenge(ch.id)}
                      className="px-2.5 py-1 bg-slate-900 text-white text-[8px] font-black uppercase rounded-lg cursor-pointer"
                    >
                      Join
                    </button>
                  ) : (
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase rounded-lg border border-emerald-100">Joined</span>
                  )}
                </div>

                {ch.joined && (
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.round((ch.progress / ch.total) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Top Contributors Leaderboard */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-5 animate-fade-in">
          <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Top Weekly Contributors</strong>

          <div className="space-y-3">
            {LEADERBOARD_MEMBERS.map((member, idx) => (
              <div key={idx} className="flex justify-between items-center gap-3">
                <div className="flex gap-2.5 items-center">
                  <span className="text-xs font-black text-slate-400 w-4 font-mono">{idx + 1}</span>
                  <div className={cn("w-8 h-8 rounded-lg bg-gradient-to-tr flex items-center justify-center text-white font-black text-xs shadow-sm", member.avatarColor)}>
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <strong className="text-xs font-black text-slate-800 block leading-tight">{member.name}</strong>
                    <span className="text-[8px] font-black text-slate-400 uppercase block mt-0.5">{member.company} &bull; {member.level}</span>
                  </div>
                </div>

                <strong className="text-xs font-black text-slate-800 shrink-0">{member.points} RP</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Copilot strategically widget */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden flex flex-col h-[400px]">
          
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 relative">
              <Bot className="w-4.5 h-4.5" />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
            </div>
            <div>
              <strong className="text-xs font-black text-slate-800 block">Community Copilot</strong>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mt-0.5">Placement network coach</span>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4 min-h-0 bg-slate-50/20">
            {copilotMessages.map((msg) => {
              const isCopilot = msg.role === "copilot";
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3 max-w-[85%] text-xs font-semibold leading-relaxed",
                    isCopilot ? "self-start" : "ml-auto flex-row-reverse"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-md flex items-center justify-center shrink-0 border text-[10px]",
                    isCopilot ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-slate-900 border-slate-900 text-white"
                  )}>
                    {isCopilot ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  </div>
                  <div className={cn(
                    "p-3 rounded-2xl whitespace-pre-wrap shadow-sm",
                    isCopilot ? "bg-white border border-slate-150 text-slate-700" : "bg-slate-900 text-white"
                  )}>
                    {msg.content.split("\n").map((line, idx) => {
                      if (line.startsWith("### ")) {
                        return <h4 key={idx} className="font-black text-slate-900 text-xs mt-2 mb-1 first:mt-0 font-display">{line.replace("### ", "")}</h4>;
                      }
                      if (line.startsWith("- ") || line.startsWith("* ")) {
                        return <li key={idx} className="ml-3 list-disc text-slate-650 font-bold my-0.5">{line.replace(/^[-*]\s+/, "")}</li>;
                      }
                      return <p key={idx} className="my-1">{line}</p>;
                    })}
                  </div>
                </div>
              );
            })}

            {copilotLoading && (
              <div className="flex gap-3 max-w-[80%] self-start animate-pulse text-xs">
                <div className="w-6 h-6 rounded-md bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 animate-bounce" />
                </div>
                <div className="p-3 bg-white border border-slate-150 text-slate-400 rounded-2xl font-bold flex items-center gap-1.5">
                  <span>Searching discussion database...</span>
                </div>
              </div>
            )}
          </div>

          {/* Shortcuts panel */}
          <div className="p-3 border-t border-slate-100 flex flex-wrap gap-1.5 bg-slate-50/30 shrink-0">
            {[
              { label: "CRACK IBM EXPERIENCES", query: "Where can I find IBM interview experiences?" },
              { label: "JOIN SDE STUDY ROOM", query: "Which study group is best for SDE?" }
            ].map(prompt => (
              <button
                key={prompt.label}
                disabled={copilotLoading}
                onClick={() => handleCopilotSend(prompt.query)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-650 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
              >
                {prompt.label}
              </button>
            ))}
          </div>

          {/* Form input */}
          <div className="p-3 border-t border-slate-100 bg-white flex items-center gap-2 shrink-0">
            <input
              type="text"
              disabled={copilotLoading}
              placeholder="Ask placement discussions tips..."
              value={copilotInput}
              onChange={(e) => setCopilotInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !copilotLoading) handleCopilotSend();
              }}
              className="flex-grow p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
            <button
              disabled={copilotLoading || !copilotInput.trim()}
              onClick={() => handleCopilotSend()}
              className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-all cursor-pointer disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
