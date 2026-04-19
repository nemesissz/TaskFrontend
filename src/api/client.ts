// Backend statuslarını frontend formatına çevirir
export const mapStatus = (s: string): 'gozlenir' | 'icrada' | 'tamamlandi' => {
  if (s === 'InProgress') return 'icrada'
  if (s === 'Completed') return 'tamamlandi'
  return 'gozlenir'
}

// Frontend statusunu backend formatına çevirir
export const mapStatusToBackend = (s: string): number => {
  if (s === 'icrada') return 1   // InProgress
  if (s === 'tamamlandi') return 2 // Completed
  return 0 // Pending
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('authToken')
  const res = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...options
  })

  if (res.status === 204) return null as T

  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      const text = await res.text()
      if (text) msg = text
    } catch { /* empty */ }
    throw new Error(msg)
  }

  return res.json()
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
