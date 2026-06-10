function getSupabaseUrl() { return globalThis.SUPABASE_URL || ''; }
function getSupabaseKey() { return globalThis.SUPABASE_SERVICE_KEY || ''; }

export async function query(method, table, options = {}) {
  const { select = '*', where = {}, data, single = false, order, limit, offset } = options;

  const SUPABASE_URL = getSupabaseUrl();
  const SUPABASE_KEY = getSupabaseKey();
  let url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}`;

  const whereEntries = Object.entries(where);
  for (const [key, value] of whereEntries) {
    const strVal = String(value);
    if (strVal.includes('.') || strVal.startsWith('(')) {
      url += `&${key}=${encodeURIComponent(strVal)}`;
    } else {
      url += `&${key}=eq.${encodeURIComponent(strVal)}`;
    }
  }

  if (order) url += `&order=${encodeURIComponent(order)}`;
  if (limit) url += `&limit=${limit}`;
  if (offset) url += `&offset=${offset}`;
  if (single) url += '&limit=1';

  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': single ? 'return=representation' : 'return=representation',
  };

  const fetchOpts = { method, headers };

  if (data && (method === 'POST' || method === 'PATCH')) {
    fetchOpts.body = JSON.stringify(data);
  }

  const res = await fetch(url, fetchOpts);

  if (res.status === 204) return null;
  const result = await res.json();

  if (res.status >= 400) {
    throw new Error(result.message || `Supabase error: ${res.status}`);
  }

  if (single && Array.isArray(result)) return result[0] || null;
  return result;
}

export function sqlQuery(queryText, params = {}) {
  const url = `${getSupabaseUrl()}/rest/v1/rpc/execute_sql`;
  return fetch(url, {
    method: 'POST',
    headers: {
      'apikey': getSupabaseKey(),
      'Authorization': `Bearer ${getSupabaseKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: queryText, params }),
  }).then(r => r.json());
}

export async function rawQuery(queryText) {
  const url = `${getSupabaseUrl()}/rest/v1/`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': getSupabaseKey(),
      'Authorization': `Bearer ${getSupabaseKey()}`,
      'Content-Type': 'application/json',
      'Prefer': 'params=single-object',
    },
    body: JSON.stringify({ query: queryText }),
  });
  return res.json();
}
