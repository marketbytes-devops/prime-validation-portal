import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import { createCertificate } from '../api/api'
import { FaChevronLeft, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa'

export default function AddCertificate() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ certificate_number: '', client_name: '', calibration_date: '', calibration_due_date: '', description: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await createCertificate(form)
      setSuccess(true)
      setTimeout(() => navigate('/admin/certificates'), 1500)
    } catch (err) {
      const msgs = err.response?.data
      if (msgs && typeof msgs === 'object') {
        setError(Object.values(msgs).flat().join(' '))
      } else {
        setError('Failed to add certificate. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  return (
    <DashboardLayout>
      <div className="w-full">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#344482] uppercase tracking-tight">Create Certificate</h2>
            <p className="text-slate-500 font-semibold text-sm mt-1">Create a new compliance record.</p>
          </div>
          <button onClick={() => navigate('/admin/certificates')} className="text-xs font-bold text-[#344482] uppercase tracking-widest hover:text-[#d9242a] transition-all flex items-center gap-1">
            <FaChevronLeft className="w-3 h-3" />
            Cancel
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-2xl shadow-slate-200/50">
          {success ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                <FaCheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2 uppercase tracking-tight">Saved Successfully</h3>
              <p className="text-slate-500 font-semibold text-sm">Redirecting to certificate database…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Certificate / ID Number *</label>
                  <input type="text" required value={form.certificate_number}
                    onChange={e => set('certificate_number', e.target.value)}
                    placeholder="CERT-2024-001"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-[#344482] focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Client Name</label>
                  <input type="text" value={form.client_name}
                    onChange={e => set('client_name', e.target.value)}
                    placeholder="Acme Corporation"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-[#344482] focus:bg-white transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Calibration Date *</label>
                  <input type="date" required value={form.calibration_date}
                    onChange={e => set('calibration_date', e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-[#344482] focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#d9242a] uppercase tracking-widest mb-1.5">Recalibration Due *</label>
                  <input type="date" required value={form.calibration_due_date}
                    onChange={e => set('calibration_due_date', e.target.value)}
                    className="w-full bg-slate-50 border-2 border-red-50 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-[#d9242a] focus:bg-white transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Technical Notes</label>
                <textarea rows={4} value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Location, equipment details, or compliance notes…"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-[#344482] focus:bg-white transition-all resize-none" />
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-[#d9242a] text-xs font-bold flex items-center gap-2 animate-in shake">
                  <FaExclamationCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="pt-2">
                <button type="submit" disabled={loading}
                  className="w-full py-4 rounded-xl bg-[#344482] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#283566] transition-all shadow-xl shadow-blue-900/10">
                  {loading ? 'Submitting Record…' : 'Finalize Registration'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

