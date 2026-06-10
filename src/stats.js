import { query } from './db.js';
import { jsonResponse, errorResponse } from './utils/response.js';

export async function handleGetStats(request, username) {
  try {
    const user = await query('GET', 'users', {
      select: 'id',
      where: { username },
      single: true,
    });
    if (!user) return errorResponse('User not found', 404);

    const url = new URL(request.url);
    const year = parseInt(url.searchParams.get('year') || new Date().getFullYear());

    const logs = await query('GET', 'film_logs', {
      select: 'id,tmdb_id,title,poster_path,release_year,genres,watched_date,rating,created_at',
      where: { user_id: user.id },
      order: 'watched_date.desc',
    });

    if (!Array.isArray(logs)) {
      return jsonResponse(getEmptyStats(year));
    }

    const yearLogs = logs.filter(l => {
      if (!l.watched_date) return false;
      const d = new Date(l.watched_date);
      return d.getFullYear() === year;
    });

    const totalThisYear = yearLogs.length;
    const totalAllTime = logs.length;

    const ratings = logs.filter(l => l.rating != null).map(l => l.rating);
    const averageRating = ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : 0;

    const byMonth = {};
    for (let m = 1; m <= 12; m++) byMonth[m] = 0;
    yearLogs.forEach(l => {
      if (l.watched_date) {
        const m = new Date(l.watched_date).getMonth() + 1;
        byMonth[m] = (byMonth[m] || 0) + 1;
      }
    });
    const byMonthArr = Object.entries(byMonth).map(([month, count]) => ({ month: parseInt(month), count }));

    const byGenre = {};
    logs.forEach(l => {
      if (l.genres && Array.isArray(l.genres)) {
        l.genres.forEach(g => {
          byGenre[g] = (byGenre[g] || 0) + 1;
        });
      }
    });
    const byGenreArr = Object.entries(byGenre).map(([genre, count]) => ({ genre, count }));

    const byDecade = {};
    logs.forEach(l => {
      if (l.release_year) {
        const decade = Math.floor(l.release_year / 10) * 10;
        const label = `${decade}s`;
        byDecade[label] = (byDecade[label] || 0) + 1;
      }
    });
    const byDecadeArr = Object.entries(byDecade).map(([decade, count]) => ({ decade, count }));

    const heatmap = {};
    yearLogs.forEach(l => {
      if (l.watched_date) {
        heatmap[l.watched_date] = (heatmap[l.watched_date] || 0) + 1;
      }
    });
    const heatmapArr = Object.entries(heatmap).map(([date, count]) => ({ date, count }));

    let longestStreak = 0;
    if (yearLogs.length > 0) {
      const dates = [...new Set(yearLogs.map(l => l.watched_date))].sort();
      let currentStreak = 1;
      longestStreak = 1;
      for (let i = 1; i < dates.length; i++) {
        const prev = new Date(dates[i - 1]);
        const curr = new Date(dates[i]);
        const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentStreak++;
          longestStreak = Math.max(longestStreak, currentStreak);
        } else {
          currentStreak = 1;
        }
      }
    }

    return jsonResponse({
      total_this_year: totalThisYear,
      total_all_time: totalAllTime,
      average_rating: averageRating,
      by_month: byMonthArr,
      by_genre: byGenreArr,
      by_decade: byDecadeArr,
      heatmap: heatmapArr,
      longest_streak: longestStreak,
    });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}

function getEmptyStats(year) {
  return {
    total_this_year: 0,
    total_all_time: 0,
    average_rating: 0,
    by_month: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, count: 0 })),
    by_genre: [],
    by_decade: [],
    heatmap: [],
    longest_streak: 0,
  };
}
