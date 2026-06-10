import { authenticate } from './middleware.js';
import { jsonResponse, errorResponse } from './utils/response.js';

export async function handleGetFeed(request) {
  const auth = await authenticate(request);
  if (!auth) return errorResponse('Unauthorised', 401);

  try {
    const url = new URL(request.url);
    const cursor = url.searchParams.get('cursor') || '0';
    const limit = parseInt(url.searchParams.get('limit') || '20');

    const res = await fetch(
      `${globalThis.SUPABASE_URL}/rest/v1/rpc/get_feed`,
      {
        method: 'POST',
        headers: {
          'apikey': globalThis.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${globalThis.SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_user_id: auth.userId,
          limit_val: limit,
          offset_val: parseInt(cursor),
        }),
      }
    );

    if (res.ok) {
      const feed = await res.json();
      return jsonResponse({ feed, next_cursor: String(parseInt(cursor) + limit) });
    }

    const feedData = await fetch(
      `${globalThis.SUPABASE_URL}/rest/v1/film_logs?select=id,tmdb_id,title,poster_path,rating,watched_date,created_at,user_id&order=created_at.desc&limit=${limit}`,
      {
        headers: {
          'apikey': globalThis.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${globalThis.SUPABASE_SERVICE_KEY}`,
        },
      }
    );
    let logs = await feedData.json();
    if (!Array.isArray(logs)) logs = [];

    const userIds = [...new Set(logs.map(l => l.user_id))];
    const users = userIds.length > 0
      ? await fetch(
        `${globalThis.SUPABASE_URL}/rest/v1/users?select=id,username,display_name,avatar_url&id=in.(${userIds.map(id => `"${id}"`).join(',')})`,
        {
          headers: {
            'apikey': globalThis.SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${globalThis.SUPABASE_SERVICE_KEY}`,
          },
        }
      ).then(r => r.json())
      : [];

    const userMap = {};
    if (Array.isArray(users)) {
      users.forEach(u => { userMap[u.id] = u; });
    }

    const feed = logs
      .filter(l => {
        const user = userMap[l.user_id];
        if (!user) return false;
        return l.user_id !== auth.userId;
      })
      .map(l => ({
        user: {
          username: userMap[l.user_id]?.username || 'unknown',
          avatar_url: userMap[l.user_id]?.avatar_url || null,
          display_name: userMap[l.user_id]?.display_name || null,
        },
        log: {
          id: l.id,
          tmdb_id: l.tmdb_id,
          title: l.title,
          poster_path: l.poster_path,
          rating: l.rating,
          watched_date: l.watched_date,
          created_at: l.created_at,
        },
      }));

    return jsonResponse({ feed, next_cursor: String(parseInt(cursor) + limit) });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
