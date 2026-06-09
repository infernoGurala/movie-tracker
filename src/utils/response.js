export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify({ data, error: null }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function errorResponse(message, status = 400) {
  return new Response(JSON.stringify({ data: null, error: { message, code: status } }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
