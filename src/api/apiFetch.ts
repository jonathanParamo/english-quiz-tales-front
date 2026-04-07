const BASE_URL = import.meta.env.VITE_API_URL

type RequestBody = Record<string, unknown> | FormData | unknown[]

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: RequestBody
}

async function apiFetch<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options

  const isFormData = body instanceof FormData

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...rest,
    credentials: 'include',
    headers: {
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...(headers || {}),
    },
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  })

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`)
  }

  return response.json() as Promise<T>
}

export default apiFetch
