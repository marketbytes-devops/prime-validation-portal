import axios from 'axios'

const api = axios.create({
  baseURL: 'https://certificate.primearabiagroup.com/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const login = (data) => api.post('/auth/login/', data)
export const forgotPassword = (data) => api.post('/auth/forgot-password/', data)
export const verifyOtp = (data) => api.post('/auth/verify-otp/', data)
export const resetPassword = (data) => api.post('/auth/reset-password/', data)

// ─── Certificates ─────────────────────────────────────────────────────────────
export const getCertificates = (params) => api.get('/admin/certificates/', { params })
export const createCertificate = (data) => api.post('/admin/certificates/', data)
export const updateCertificate = (id, data) => api.put(`/admin/certificates/${id}/`, data)
export const deleteCertificate = (id) => api.delete(`/admin/certificates/${id}/`)

// ─── Enquiries ────────────────────────────────────────────────────────────────
export const getEnquiries = (params) => api.get('/admin/enquiries/', { params })
export const updateEnquiry = (id, data) => api.put(`/admin/enquiries/${id}/`, data)
export const deleteEnquiry = (id) => api.delete(`/admin/enquiries/${id}/`)

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const getDashboardStats = () => api.get('/admin/dashboard/')

export default api
