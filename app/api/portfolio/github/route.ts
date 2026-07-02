import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username')?.trim();

    if (!username) {
      return NextResponse.json(
        { success: false, message: 'GitHub username is required.' },
        { status: 400 }
      );
    }

    const headers: HeadersInit = {
      'User-Agent': 'BuggedBrain-PlacementOS-Agent',
    };

    // If GitHub Token is available in environment, we use it to bypass rate limits
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    // 1. Fetch GitHub user profile details
    const userResponse = await fetch(`https://api.github.com/users/${username}`, { headers, next: { revalidate: 3600 } });
    
    if (userResponse.status === 404) {
      return NextResponse.json(
        { success: false, message: `GitHub user "${username}" not found.` },
        { status: 404 }
      );
    }

    if (!userResponse.ok) {
      // Return a structured mockup fallback if GitHub API rate limits us
      console.warn(`GitHub API user query returned status ${userResponse.status}. Falling back to mock sync.`);
      return getMockFallback(username);
    }

    const userData = await userResponse.json();

    // 2. Fetch public repos (up to 100)
    const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers, next: { revalidate: 3600 } });
    if (!reposResponse.ok) {
      console.warn(`GitHub API repos query returned status ${reposResponse.status}. Falling back to mock sync.`);
      return getMockFallback(username, userData);
    }

    const reposData = await reposResponse.json();

    if (!Array.isArray(reposData)) {
      return getMockFallback(username, userData);
    }

    // 3. Process repository stats
    const processedRepos = reposData.map((repo: any) => ({
      name: repo.name,
      description: repo.description || 'No description provided.',
      stars: repo.stargazers_count || 0,
      language: repo.language || 'Plain Text',
      html_url: repo.html_url,
      updated_at: repo.updated_at
    }));

    // Calculate total stars
    const totalStars = processedRepos.reduce((acc, r) => acc + r.stars, 0);

    // Calculate language distribution
    const languages: Record<string, number> = {};
    processedRepos.forEach(r => {
      if (r.language && r.language !== 'Plain Text') {
        languages[r.language] = (languages[r.language] || 0) + 1;
      }
    });

    // Pinned repositories approximation (take top 4 repos sorted by stars, then updated)
    const pinnedRepos = [...processedRepos]
      .sort((a, b) => b.stars - a.stars || new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 4);

    return NextResponse.json({
      success: true,
      profile: {
        name: userData.name || userData.login,
        avatar_url: userData.avatar_url,
        bio: userData.bio || 'Software Developer',
        public_repos: userData.public_repos,
        followers: userData.followers
      },
      repositories: processedRepos,
      pinned: pinnedRepos,
      languages,
      totalStars,
      isMock: false
    });

  } catch (err: any) {
    console.error('GitHub API sync error:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to synchronize GitHub. Please try again later.' },
      { status: 500 }
    );
  }
}

// Fallback helper to provide clean, realistic mock data for sandbox/offline runs
function getMockFallback(username: string, userData?: any) {
  const mockProfile = {
    name: userData?.name || username,
    avatar_url: userData?.avatar_url || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=250&auto=format&fit=crop`,
    bio: userData?.bio || 'Full Stack Software Engineer specializing in scalable web frameworks.',
    public_repos: userData?.public_repos || 12,
    followers: userData?.followers || 32
  };

  const mockRepos = [
    {
      name: 'realtime-canvas-sync',
      description: 'Collaborative whiteboard drawing board utilizing WebSocket state distributions.',
      stars: 14,
      language: 'TypeScript',
      html_url: `https://github.com/${username}/realtime-canvas-sync`,
      updated_at: new Date().toISOString()
    },
    {
      name: 'microservice-checkout',
      description: 'Serverless checkouts inventory allocations lock controller in Go.',
      stars: 9,
      language: 'Go',
      html_url: `https://github.com/${username}/microservice-checkout`,
      updated_at: new Date().toISOString()
    },
    {
      name: 'placement-telemetry-gateway',
      description: 'Explainable AI routing and usage logging telemetry suite.',
      stars: 7,
      language: 'TypeScript',
      html_url: `https://github.com/${username}/placement-telemetry-gateway`,
      updated_at: new Date().toISOString()
    },
    {
      name: 'rust-json-parser',
      description: 'High-speed JSON tokenizer and parser written in Rust.',
      stars: 4,
      language: 'Rust',
      html_url: `https://github.com/${username}/rust-json-parser`,
      updated_at: new Date().toISOString()
    }
  ];

  return NextResponse.json({
    success: true,
    profile: mockProfile,
    repositories: mockRepos,
    pinned: mockRepos.slice(0, 3),
    languages: { 'TypeScript': 2, 'Go': 1, 'Rust': 1 },
    totalStars: 34,
    isMock: true
  });
}
