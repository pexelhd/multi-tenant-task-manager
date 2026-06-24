import api from './api'

export const commentApi = {
  list: (taskId) => api.get(`/tasks/${taskId}/comments`).then((r) => r.data),
  create: (taskId, content) => api.post(`/tasks/${taskId}/comments`, { content }).then((r) => r.data),
  delete: (taskId, commentId) => api.delete(`/tasks/${taskId}/comments/${commentId}`).then((r) => r.data),
}
