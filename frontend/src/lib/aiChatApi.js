import api from '@/lib/api'

export const aiChatApi = {
  sendMessage: (message) => api.post('/ai/chat', { message }).then((res) => res.data),
}
