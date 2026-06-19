import api from '@/lib/api'

export const taskApi = {
  list: (params) => api.get('/tasks', { params }).then((res) => res.data),
  getById: (id) => api.get(`/tasks/${id}`).then((res) => res.data),
  create: (data) => api.post('/tasks', data).then((res) => res.data),
  update: (id, data) => api.put(`/tasks/${id}`, data).then((res) => res.data),
  delete: (id) => api.delete(`/tasks/${id}`).then((res) => res.data),
}
