const BASE = String(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) }
  const body = options.body
  const isJsonBody =
    body &&
    typeof body === 'object' &&
    !(body instanceof FormData) &&
    !(body instanceof Blob)

  if (isJsonBody && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    body: isJsonBody ? JSON.stringify(body) : body,
  })

  const text = await res.text()
  const data = (() => {
    try {
      return text ? JSON.parse(text) : {}
    } catch {
      return { error: text || 'Invalid response' }
    }
  })()

  if (!res.ok) {
    const err = new Error(data.error || res.statusText || 'Request failed')
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export const TOKEN_SUPERADMIN = 'ailocity_token_superadmin'
export const TOKEN_ADMIN = 'ailocity_token_admin'
export const TOKEN_CLIENT = 'ailocity_token_client'
export const TOKEN_SUBCLIENT = 'ailocity_token_subclient'
export const TOKEN_BD = 'ailocity_token_bd'
export const TOKEN_TC = 'ailocity_token_tc'
