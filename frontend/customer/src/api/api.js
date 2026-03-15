import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

export const checkCertificate = (certNumber) =>
  api.get(`/check/${encodeURIComponent(certNumber)}/`)

export const submitEnquiry = (data) =>
  api.post('/enquiry/', data)

export default api
