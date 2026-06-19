import api from '@/lib/api'

export const tenantApi = {
  list: (params) => api.get('/tenants', { params }).then((res) => res.data),
  getById: (id) => api.get(`/tenants/${id}`).then((res) => res.data),
  create: (data) => api.post('/tenants', data).then((res) => res.data),
  update: (id, data) => api.put(`/tenants/${id}`, data).then((res) => res.data),
  delete: (id) => api.delete(`/tenants/${id}`).then((res) => res.data),
}
