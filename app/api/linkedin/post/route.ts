import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { content, providerToken } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, message: 'Post content is required.' },
        { status: 400 }
      );
    }

    if (!providerToken) {
      return NextResponse.json(
        { success: false, message: 'LinkedIn provider token is missing. Please re-authenticate your LinkedIn connection.' },
        { status: 401 }
      );
    }

    // 1. Fetch member profile info using Userinfo endpoint to get person ID (sub)
    const userinfoRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${providerToken}`
      }
    });

    if (!userinfoRes.ok) {
      const errText = await userinfoRes.text();
      console.error('LinkedIn userinfo fetch failed:', errText);
      return NextResponse.json(
        { success: false, message: 'Failed to retrieve LinkedIn profile identifier. Your token may have expired.' },
        { status: userinfoRes.status }
      );
    }

    const userInfo = await userinfoRes.json();
    const personId = userInfo.sub;

    if (!personId) {
      return NextResponse.json(
        { success: false, message: 'LinkedIn profile ID not found in OAuth payload.' },
        { status: 400 }
      );
    }

    // 2. Publish post using Share on LinkedIn API (Posts endpoint)
    const shareRes = await fetch('https://api.linkedin.com/v2/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${providerToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify({
        author: `urn:li:person:${personId}`,
        commentary: content,
        visibility: 'PUBLIC',
        distribution: {
          feedDistribution: 'MAIN_FEED',
          targetEntities: [],
          thirdPartyDistributionChannels: []
        },
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false
      })
    });

    if (!shareRes.ok) {
      const errData = await shareRes.text();
      console.error('LinkedIn share post failed:', errData);
      
      // Check if it is a scope error (which is highly likely if w_member_social is not enabled)
      if (shareRes.status === 403 || errData.includes('permission') || errData.includes('scope')) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Sharing failed: The linked LinkedIn connection lacks direct writing permissions (w_member_social scope is missing). Please add this scope in your Supabase Auth LinkedIn settings, or copy and paste the post manually.',
            isScopeError: true
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { success: false, message: `LinkedIn API sharing error: ${shareRes.statusText}` },
        { status: shareRes.status }
      );
    }

    // Attempt to extract response data (some success states return 201 with location header instead of body)
    let postId = '';
    const locationHeader = shareRes.headers.get('x-restli-id') || shareRes.headers.get('Location');
    if (locationHeader) {
      postId = locationHeader.split('/').pop() || '';
    }

    return NextResponse.json({
      success: true,
      message: 'Post successfully published directly to your LinkedIn feed!',
      postId
    });

  } catch (err: any) {
    console.error('LinkedIn Post API exception:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Internal server error while publishing post to LinkedIn.' },
      { status: 500 }
    );
  }
}
