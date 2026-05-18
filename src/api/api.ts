import apiFetch from './apiFetch'

type RequestBody = Record<string, unknown> | FormData | unknown[]

const api = {
  post: <T>(endpoint: string, body: RequestBody) => apiFetch<T>(endpoint, { method: 'POST', body }),

  get: <T>(endpoint: string) => apiFetch<T>(endpoint, { method: 'GET' }),

  put: <T>(endpoint: string, body: RequestBody) => apiFetch<T>(endpoint, { method: 'PUT', body }),

  patch: <T>(endpoint: string, body: RequestBody) =>
    apiFetch<T>(endpoint, { method: 'PATCH', body }),

  delete: <T>(endpoint: string) => apiFetch<T>(endpoint, { method: 'DELETE' }),
}

export default api
