import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' })

export const uploadFiles = (jdText, resumeFile) => {
  const form = new FormData()
  form.append('jd_text', jdText)
  form.append('resume', resumeFile)
  return api.post('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const startAssessment = (sessionId) =>
  api.post('/start', { session_id: sessionId })

export const sendAnswer = (sessionId, answer) =>
  api.post('/chat', { session_id: sessionId, answer })

export const getReport = (sessionId) =>
  api.get(`/report/${sessionId}`)
