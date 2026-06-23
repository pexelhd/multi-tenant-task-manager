import api from './api'

export const dbApi = {
  getSummary: () => api.get('/db/summary').then((res) => res.data),
}
