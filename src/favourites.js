import { query } from './db.js';
import { jsonResponse, errorResponse } from './utils/response.js';
import { authenticate } from './middleware.js';

const TMDB_API_KEY = globalThis.TMDB_API_KEY || '';

export async function handleGetFavourites(request, username) {
  try {
    const user = await query('GET', 'users', {
      select: 'id',
      where: { username },
      single: true,
    });
    if (!user) return errorResponse('User not found', 404);

    const favourites = await query('GET', 'favourites', {
      select: 'id,tmdb_id,title,poster_path,release_year,sort_order,created_at',
      where: { user_id: user.id },
      order: 'sort_order.asc',
    });

    return jsonResponse({ favourites: Array.isArray(favourites) ? favourites : [] });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}

export async function handleAddFavourite(request) {
  const auth = await authenticate(request);
  if (!auth) return errorResponse('Unauthorised', 401);

  try {
    const { tmdb_id } = await request.json();
    if (!tmdb_id) return errorResponse('tmdb_id is required', 400);

    const existing = await query('GET', 'favourites', {
      select: 'id',
      where: { user_id: auth.userId, tmdb_id },
      single: true,
    });
    if (existing) return errorResponse('Film already in favourites', 400);

    const existingCount = await query('GET', 'favourites', {
      select: 'id',
      where: { user_id: auth.userId },
    });
    const count = Array.isArray(existingCount) ? existingCount.length : 0;

    const tmdbRes = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdb_id}?api_key=${TMDB_API_KEY}`
    );
    const tmdbData = await tmdbRes.json();

    const fav = await query('POST', 'favourites', {
      select: 'id,tmdb_id,title,poster_path,release_year,sort_order',
      data: {
        user_id: auth.userId,
        tmdb_id,
        title: tmdbData.title || 'Unknown',
        poster_path: tmdbData.poster_path || null,
        release_year: tmdbData.release_date ? parseInt(tmdbData.release_date.split('-')[0]) : null,
        sort_order: count,
      },
      single: true,
    });

    return jsonResponse({ favourite: fav }, 201);
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}

export async function handleRemoveFavourite(request, tmdbId) {
  const auth = await authenticate(request);
  if (!auth) return errorResponse('Unauthorised', 401);

  try {
    const existing = await query('GET', 'favourites', {
      select: 'id,sort_order',
      where: { user_id: auth.userId, tmdb_id: parseInt(tmdbId) },
      single: true,
    });
    if (!existing) return errorResponse('Favourite not found', 404);

    await query('DELETE', 'favourites', {
      where: { id: existing.id },
    });

    return jsonResponse({ success: true });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}

export async function handleReorderFavourites(request) {
  const auth = await authenticate(request);
  if (!auth) return errorResponse('Unauthorised', 401);

  try {
    const { tmdb_ids } = await request.json();
    if (!Array.isArray(tmdb_ids)) return errorResponse('tmdb_ids array is required', 400);

    for (let i = 0; i < tmdb_ids.length; i++) {
      await query('PATCH', 'favourites', {
        where: { user_id: auth.userId, tmdb_id: tmdb_ids[i] },
        data: { sort_order: i },
      });
    }

    return jsonResponse({ success: true });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
