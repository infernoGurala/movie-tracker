import { query } from './db.js';
import { jsonResponse, errorResponse } from './utils/response.js';
import { authenticate } from './middleware.js';

export async function handleGetProfile(request, username) {
  try {
    const user = await query('GET', 'users', {
      select: 'id,username,display_name,avatar_url,bio,favourite_quote,created_at',
      where: { username },
      single: true,
    });

    if (!user) {
      return errorResponse('User not found', 404);
    }

    const followerCount = await query('GET', 'follows', {
      select: 'id',
      where: { following_id: user.id },
    });
    const followingCount = await query('GET', 'follows', {
      select: 'id',
      where: { follower_id: user.id },
    });

    const auth = await authenticate(request);
    let isFollowing = false;
    if (auth) {
      const follow = await query('GET', 'follows', {
        select: 'id',
        where: { follower_id: auth.userId, following_id: user.id },
        single: true,
      });
      isFollowing = !!follow;
    }

    return jsonResponse({
      profile: {
        ...user,
        follower_count: Array.isArray(followerCount) ? followerCount.length : 0,
        following_count: Array.isArray(followingCount) ? followingCount.length : 0,
        is_following: isFollowing,
        is_own_profile: auth ? auth.userId === user.id : false,
      },
    });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}

export async function handleUpdateProfile(request) {
  const auth = await authenticate(request);
  if (!auth) return errorResponse('Unauthorised', 401);

  try {
    const { display_name, bio, favourite_quote, avatar_url } = await request.json();

    const updates = {};
    if (display_name !== undefined) updates.display_name = display_name;
    if (bio !== undefined) updates.bio = bio;
    if (favourite_quote !== undefined) updates.favourite_quote = favourite_quote;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;

    if (Object.keys(updates).length === 0) {
      return errorResponse('No fields to update', 400);
    }

    const updated = await query('PATCH', 'users', {
      select: 'id,username,display_name,avatar_url,bio,favourite_quote',
      where: { id: auth.userId },
      data: updates,
      single: true,
    });

    return jsonResponse({ user: updated });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}

export async function handleGetFollowers(request, username) {
  try {
    const user = await query('GET', 'users', {
      select: 'id',
      where: { username },
      single: true,
    });
    if (!user) return errorResponse('User not found', 404);

    const followers = await query('GET', 'follows', {
      select: 'follower_id',
      where: { following_id: user.id },
      order: 'created_at.desc',
    });

    const userIds = followers.map(f => f.follower_id);
    const profiles = userIds.length > 0
      ? await query('GET', 'users', {
        select: 'id,username,display_name,avatar_url',
        where: { id: `in.(${userIds.map(id => `"${id}"`).join(',')})` },
      })
      : [];

    const auth = await authenticate(request);
    const enriched = await enrichProfiles(profiles, auth);

    return jsonResponse({ followers: enriched });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}

export async function handleGetFollowing(request, username) {
  try {
    const user = await query('GET', 'users', {
      select: 'id',
      where: { username },
      single: true,
    });
    if (!user) return errorResponse('User not found', 404);

    const following = await query('GET', 'follows', {
      select: 'following_id',
      where: { follower_id: user.id },
      order: 'created_at.desc',
    });

    const userIds = following.map(f => f.following_id);
    const profiles = userIds.length > 0
      ? await query('GET', 'users', {
        select: 'id,username,display_name,avatar_url',
        where: { id: `in.(${userIds.map(id => `"${id}"`).join(',')})` },
      })
      : [];

    const auth = await authenticate(request);
    const enriched = await enrichProfiles(profiles, auth);

    return jsonResponse({ following: enriched });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}

export async function handleFollow(request, username) {
  const auth = await authenticate(request);
  if (!auth) return errorResponse('Unauthorised', 401);

  try {
    const target = await query('GET', 'users', {
      select: 'id',
      where: { username },
      single: true,
    });
    if (!target) return errorResponse('User not found', 404);

    if (target.id === auth.userId) {
      return errorResponse('Cannot follow yourself', 400);
    }

    const existing = await query('GET', 'follows', {
      select: 'id',
      where: { follower_id: auth.userId, following_id: target.id },
      single: true,
    });

    if (existing) {
      return jsonResponse({ following: true });
    }

    await query('POST', 'follows', {
      data: { follower_id: auth.userId, following_id: target.id },
    });

    return jsonResponse({ following: true });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}

export async function handleUnfollow(request, username) {
  const auth = await authenticate(request);
  if (!auth) return errorResponse('Unauthorised', 401);

  try {
    const target = await query('GET', 'users', {
      select: 'id',
      where: { username },
      single: true,
    });
    if (!target) return errorResponse('User not found', 404);

    const existing = await query('GET', 'follows', {
      select: 'id',
      where: { follower_id: auth.userId, following_id: target.id },
      single: true,
    });

    if (existing) {
      await query('DELETE', 'follows', {
        where: { id: existing.id },
      });
    }

    return jsonResponse({ following: false });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}

async function enrichProfiles(profiles, auth) {
  if (!Array.isArray(profiles)) return [];
  return Promise.all(profiles.map(async (p) => {
    const logCount = await query('GET', 'film_logs', {
      select: 'id',
      where: { user_id: p.id },
    });
    let isFollowing = false;
    if (auth && auth.userId !== p.id) {
      const follow = await query('GET', 'follows', {
        select: 'id',
        where: { follower_id: auth.userId, following_id: p.id },
        single: true,
      });
      isFollowing = !!follow;
    }
    return {
      ...p,
      film_count: Array.isArray(logCount) ? logCount.length : 0,
      is_following: isFollowing,
    };
  }));
}
