import { query } from './db.js';
import { jsonResponse, errorResponse } from './utils/response.js';
import { authenticate } from './middleware.js';

const TMDB_API_KEY = globalThis.TMDB_API_KEY || '';

export async function handleGetLogs(request, username) {
  try {
    const user = await query('GET', 'users', {
      select: 'id',
      where: { username },
      single: true,
    });
    if (!user) return errorResponse('User not found', 404);

    const url = new URL(request.url);
    const year = url.searchParams.get('year');
    const genre = url.searchParams.get('genre');
    const sort = url.searchParams.get('sort') || 'watched_date';
    const order = url.searchParams.get('order') || 'desc';

    const auth = await authenticate(request);
    const isOwner = auth && auth.userId === user.id;

    const selectFields = isOwner
      ? 'id,tmdb_id,title,poster_path,release_year,genres,runtime_minutes,watched_date,rating,review,created_at'
      : 'id,tmdb_id,title,poster_path,release_year,genres,runtime_minutes,watched_date,rating,created_at';

    let filters = [`user_id=eq.${user.id}`];
    if (year) {
      filters.push(`and(watched_date.gte.${year}-01-01,watched_date.lte.${year}-12-31)`);
    }

    let urlStr = `?select=${encodeURIComponent(selectFields)}&${filters.join('&')}`;
    urlStr += `&order=${sort}.${order}`;

    const res = await fetch(
      `${globalThis.SUPABASE_URL}/rest/v1/film_logs${urlStr}`,
      {
        headers: {
          'apikey': globalThis.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${globalThis.SUPABASE_SERVICE_KEY}`,
        },
      }
    );

    let logs = await res.json();
    if (!Array.isArray(logs)) logs = [];

    if (genre) {
      logs = logs.filter(log => log.genres && log.genres.includes(genre));
    }

    return jsonResponse({ logs });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}

export async function handleCreateLog(request) {
  const auth = await authenticate(request);
  if (!auth) return errorResponse('Unauthorised', 401);

  try {
    const { tmdb_id, watched_date, rating, review } = await request.json();

    if (!tmdb_id || !rating) {
      return errorResponse('tmdb_id and rating are required', 400);
    }

    if (rating < 1 || rating > 10) {
      return errorResponse('Rating must be between 1 and 10', 400);
    }

    const existing = await query('GET', 'film_logs', {
      select: 'id',
      where: { user_id: auth.userId, tmdb_id },
      single: true,
    });

    if (existing) {
      return errorResponse('Film already logged', 400);
    }

    const tmdbRes = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdb_id}?api_key=${TMDB_API_KEY}`
    );
    const tmdbData = await tmdbRes.json();

    const log = await query('POST', 'film_logs', {
      select: 'id,tmdb_id,title,poster_path,release_year,genres,runtime_minutes,watched_date,rating,created_at',
      data: {
        user_id: auth.userId,
        tmdb_id,
        title: tmdbData.title || 'Unknown',
        poster_path: tmdbData.poster_path || null,
        release_year: tmdbData.release_date ? parseInt(tmdbData.release_date.split('-')[0]) : null,
        genres: tmdbData.genres ? tmdbData.genres.map(g => g.name) : [],
        runtime_minutes: tmdbData.runtime || null,
        watched_date: watched_date || new Date().toISOString().split('T')[0],
        rating,
        review: review || null,
      },
      single: true,
    });

    return jsonResponse({ log }, 201);
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}

export async function handleUpdateLog(request, logId) {
  const auth = await authenticate(request);
  if (!auth) return errorResponse('Unauthorised', 401);

  try {
    const existing = await query('GET', 'film_logs', {
      select: 'id,user_id',
      where: { id: logId },
      single: true,
    });

    if (!existing) return errorResponse('Log not found', 404);
    if (existing.user_id !== auth.userId) return errorResponse('Forbidden', 403);

    const { rating, review, watched_date } = await request.json();

    const updates = {};
    if (rating !== undefined) {
      if (rating < 1 || rating > 10) return errorResponse('Rating must be between 1 and 10', 400);
      updates.rating = rating;
    }
    if (review !== undefined) updates.review = review;
    if (watched_date !== undefined) updates.watched_date = watched_date;

    if (Object.keys(updates).length === 0) {
      return errorResponse('No fields to update', 400);
    }

    const updated = await query('PATCH', 'film_logs', {
      select: 'id,tmdb_id,title,poster_path,watched_date,rating,review,created_at',
      where: { id: logId },
      data: updates,
      single: true,
    });

    return jsonResponse({ log: updated });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}

export async function handleDeleteLog(request, logId) {
  const auth = await authenticate(request);
  if (!auth) return errorResponse('Unauthorised', 401);

  try {
    const existing = await query('GET', 'film_logs', {
      select: 'id,user_id',
      where: { id: logId },
      single: true,
    });

    if (!existing) return errorResponse('Log not found', 404);
    if (existing.user_id !== auth.userId) return errorResponse('Forbidden', 403);

    await query('DELETE', 'film_logs', {
      where: { id: logId },
    });

    return jsonResponse({ success: true });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
