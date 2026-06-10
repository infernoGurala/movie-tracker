import { jsonResponse, errorResponse } from './utils/response.js';
import { mapGenres } from './genre-map.js';

function getTmdbKey() { return globalThis.TMDB_API_KEY || ''; }
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p';

export async function handleSearch(request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    if (!query || query.length < 2) {
      return jsonResponse({ results: [] });
    }

    const res = await fetch(
      `${TMDB_BASE}/search/movie?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1&api_key=${getTmdbKey()}`
    );

    if (res.status === 429) {
      return jsonResponse({ results: [], error: 'Rate limited' });
    }

    const data = await res.json();

    const results = (data.results || []).slice(0, 6).map(movie => ({
      id: movie.id,
      title: movie.title,
      year: movie.release_date ? movie.release_date.split('-')[0] : null,
      poster_path: movie.poster_path,
      rating: movie.vote_average ? Math.round(movie.vote_average * 10) / 10 : null,
      genre_ids: movie.genre_ids || [],
      genres: mapGenres(movie.genre_ids || []),
    }));

    return jsonResponse({ results });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}

export async function handleFilmDetail(request, tmdbId) {
  try {
    const res = await fetch(
      `${TMDB_BASE}/movie/${tmdbId}?append_to_response=credits&api_key=${getTmdbKey()}`
    );

    if (res.status === 404) {
      return errorResponse('Film not found', 404);
    }

    if (res.status === 429) {
      return errorResponse('Rate limited', 429);
    }

    const data = await res.json();

    const detail = {
      id: data.id,
      title: data.title,
      year: data.release_date ? data.release_date.split('-')[0] : null,
      poster_path: data.poster_path,
      backdrop_path: data.backdrop_path,
      overview: data.overview,
      runtime: data.runtime,
      genres: data.genres ? data.genres.map(g => g.name) : [],
      vote_average: data.vote_average ? Math.round(data.vote_average * 10) / 10 : null,
      vote_count: data.vote_count,
      release_date: data.release_date,
      cast: (data.credits?.cast || []).slice(0, 10).map(person => ({
        name: person.name,
        character: person.character,
        profile_path: person.profile_path,
      })),
      director: (data.credits?.crew || [])
        .filter(person => person.job === 'Director')
        .map(person => person.name),
    };

    return jsonResponse({ film: detail });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
