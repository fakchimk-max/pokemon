const apiBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

export async function fetchJson(url, options) {
  const requestUrl = url.startsWith('/') ? `${apiBaseUrl}${url}` : url
  const response = await fetch(requestUrl, options)
  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body = await response.json()
      if (body.error) message = body.error
    } catch {
      // Keep the HTTP status when the response is not JSON.
    }
    throw new Error(message)
  }
  return response.json()
}
