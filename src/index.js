import { jsonResponse, errorResponse } from './utils/response.js';
import { handleRegister, handleLogin, handleLogout, handleMe } from './auth.js';
import { handleGetProfile, handleUpdateProfile, handleGetFollowers, handleGetFollowing, handleFollow, handleUnfollow } from './users.js';
import { handleGetLogs, handleCreateLog, handleUpdateLog, handleDeleteLog } from './logs.js';
import { handleGetFeed } from './feed.js';
import { handleGetStats } from './stats.js';
import { handleGetFavourites, handleAddFavourite, handleRemoveFavourite, handleReorderFavourites } from './favourites.js';
import { handleSearch, handleFilmDetail } from './tmdb.js';

export default {
  async fetch(request, env, ctx) {
    globalThis.JWT_SECRET = env.JWT_SECRET;
    globalThis.SUPABASE_URL = env.SUPABASE_URL;
    globalThis.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;
    globalThis.TMDB_API_KEY = env.TMDB_API_KEY;

    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    if (pathname === '/api/auth/register' && method === 'POST') {
      return handleRegister(request);
    }
    if (pathname === '/api/auth/login' && method === 'POST') {
      return handleLogin(request);
    }
    if (pathname === '/api/auth/logout' && method === 'POST') {
      return handleLogout();
    }
    if (pathname === '/api/auth/me' && method === 'GET') {
      return handleMe(request);
    }

    if (pathname === '/api/users/me' && method === 'PATCH') {
      return handleUpdateProfile(request);
    }
    const profileMatch = pathname.match(/^\/api\/users\/([^/]+)$/);
    if (profileMatch && method === 'GET') {
      return handleGetProfile(request, profileMatch[1]);
    }

    const followersMatch = pathname.match(/^\/api\/users\/([^/]+)\/followers$/);
    if (followersMatch && method === 'GET') {
      return handleGetFollowers(request, followersMatch[1]);
    }

    const followingMatch = pathname.match(/^\/api\/users\/([^/]+)\/following$/);
    if (followingMatch && method === 'GET') {
      return handleGetFollowing(request, followingMatch[1]);
    }

    const followMatch = pathname.match(/^\/api\/users\/([^/]+)\/follow$/);
    if (followMatch) {
      if (method === 'POST') return handleFollow(request, followMatch[1]);
      if (method === 'DELETE') return handleUnfollow(request, followMatch[1]);
    }

    if (pathname === '/api/logs' && method === 'POST') {
      return handleCreateLog(request);
    }
    const logsMatch = pathname.match(/^\/api\/logs\/([^/]+)$/);
    if (logsMatch) {
      if (method === 'GET') return handleGetLogs(request, logsMatch[1]);
      if (method === 'PATCH') return handleUpdateLog(request, logsMatch[1]);
      if (method === 'DELETE') return handleDeleteLog(request, logsMatch[1]);
    }

    if (pathname === '/api/feed' && method === 'GET') {
      return handleGetFeed(request);
    }

    const statsMatch = pathname.match(/^\/api\/stats\/([^/]+)$/);
    if (statsMatch && method === 'GET') {
      return handleGetStats(request, statsMatch[1]);
    }

    if (pathname === '/api/favourites' && method === 'POST') {
      return handleAddFavourite(request);
    }
    if (pathname === '/api/favourites/reorder' && method === 'PATCH') {
      return handleReorderFavourites(request);
    }
    const favMatch = pathname.match(/^\/api\/favourites\/(\d+)$/);
    if (favMatch && method === 'DELETE') {
      return handleRemoveFavourite(request, favMatch[1]);
    }
    const favGetMatch = pathname.match(/^\/api\/favourites\/([^/]+)$/);
    if (favGetMatch && method === 'GET' && favGetMatch[1] !== 'reorder') {
      return handleGetFavourites(request, favGetMatch[1]);
    }

    if (pathname === '/api/tmdb/search' && method === 'GET') {
      return handleSearch(request);
    }
    const filmDetailMatch = pathname.match(/^\/api\/tmdb\/film\/(\d+)$/);
    if (filmDetailMatch && method === 'GET') {
      return handleFilmDetail(request, filmDetailMatch[1]);
    }

    if (pathname.startsWith('/api/')) {
      return errorResponse('Not found', 404);
    }

    return serveStatic(request, url, env, ctx);
  },
};

const CONTENT_TYPES = {
  html: 'text/html',
  css: 'text/css',
  js: 'application/javascript',
  json: 'application/json',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  woff: 'font/woff',
  woff2: 'font/woff2',
};

async function serveStatic(request, url, env, ctx) {
  try {
    let key = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    const value = await env.__STATIC_CONTENT.get(key, 'arrayBuffer');
    if (value === null) throw new Error('Not found');

    const ext = key.split('.').pop();
    return new Response(value, {
      headers: { 'Content-Type': CONTENT_TYPES[ext] || 'text/plain' },
    });
  } catch {
    try {
      const value = await env.__STATIC_CONTENT.get('index.html', 'arrayBuffer');
      return new Response(value, {
        headers: { 'Content-Type': 'text/html' },
      });
    } catch {
      return new Response('Not found', { status: 404 });
    }
  }
}
