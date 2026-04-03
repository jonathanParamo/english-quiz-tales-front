import apiFetch from "./apiFetch";

const api = {
  post: <T>(endpoint: string, body: Record<string, unknown>) =>
    apiFetch<T>(endpoint, { method: "POST", body }),

  get: <T>(endpoint: string) => apiFetch<T>(endpoint, { method: "GET" }),

  put: <T>(endpoint: string, body: Record<string, unknown>) =>
    apiFetch<T>(endpoint, { method: "PUT", body }),

  delete: <T>(endpoint: string) => apiFetch<T>(endpoint, { method: "DELETE" }),
};

export default api;
