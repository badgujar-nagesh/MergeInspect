import api from './axios'

export const reviewsApi = {
  list:         ()        => api.get('/reviews'),
  get:          (id)      => api.get(`/reviews/${id}`),
  create:       (data)    => api.post('/reviews', data),
  postToGithub: (id)      => api.post(`/reviews/${id}/post-to-github`),
}

export const githubApi = {
  // GitHub PAT
  saveToken:  (token)           => api.post('/github-token', { token }),
  checkToken: ()                => api.get('/github-token'),

  // AI API keys (provider = 'openai' | 'claude')
  saveApiKey:  (provider, key)  => api.post('/api-keys', { provider, key }),
  checkApiKey: (provider)       => api.get(`/api-keys/${provider}`),
}
