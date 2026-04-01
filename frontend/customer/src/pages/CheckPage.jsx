import React, { useState } from 'react'
import { checkCertificate, submitEnquiry } from '../api/api'
import {
  FaExclamationTriangle,
  FaTimes,
  FaCheckCircle,
  FaExclamationCircle,
  FaSpinner
} from 'react-icons/fa'

// ─── Certificate Detail Card (Valid) ──────────────────────────────────────────
const CertificateDetail = ({ cert, onOpenModal }) => (
  <div className="mt-4 sm:mt-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xl shadow-slate-200/50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="text-center sm:text-left">
          <h3 className="text-base sm:text-xl font-medium text-primary">Equipment Details</h3>
          <p className="text-slate-500 text-[10px] sm:text-xs font-normal mt-1">Verified Record</p>
        </div>
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-4">
          <span className="flex items-center gap-1.5 sm:gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] font-medium text-emerald-700 uppercase tracking-tighter h-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
          <button
            onClick={onOpenModal}
            className="flex-1 sm:flex-none px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-primary text-white font-medium uppercase tracking-widest text-[10px] hover:bg-[#283566] transition-all shadow-lg shadow-blue-900/10 flex items-center justify-center whitespace-nowrap"
          >
            Request Re-Calibration
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 pb-3 sm:pb-4">
        <DetailRow label="Certificate Number" value={cert.certificate_number} bold />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <DetailRow label="Calibration Date" value={formatDate(cert.calibration_date)} />
        <DetailRow label="Expiry/Due Date" value={formatDate(cert.calibration_due_date)} highlight />
        {cert.description && (
          <DetailRow label="Description" value={cert.description} full />
        )}
      </div>
    </div>
  </div>
)

const DetailRow = ({ label, value, bold, highlight, full }) => (
  <div className={`rounded-xl bg-slate-50 border border-slate-100 p-3 sm:p-4 ${full ? 'sm:col-span-2' : ''}`}>
    <p className="text-[10px] sm:text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className={`text-xs sm:text-sm font-medium ${highlight ? 'text-secondary' : bold ? 'text-primary' : 'text-slate-900'}`}>{value}</p>
  </div>
)

// ─── Invalid Alert ────────────────────────────────────────────────────────────
const InvalidAlert = () => (
  <div className="mt-4 sm:mt-6 w-full animate-in fade-in zoom-in-95 duration-300">
    <div className="rounded-2xl border-2 border-secondary/10 bg-white p-4 sm:p-6 flex gap-3 sm:gap-4 items-start shadow-xl shadow-red-100/50">
      <div className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-red-50 flex items-center justify-center border border-red-100">
        <FaExclamationTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
      </div>
      <div>
        <h4 className="text-secondary font-medium text-sm sm:text-base mb-1">Verification Failed</h4>
        <p className="text-slate-600 text-[11px] sm:text-xs leading-relaxed font-normal">
          The certificate number entered could not be located. Please check the ID on your document.
        </p>
      </div>
    </div>
  </div>
)

// ─── Enquiry/Recalibration Modal ─────────────────────────────────────────────
const EnquiryModal = ({ cert, onClose }) => {
  const [form, setForm] = useState({ customer_name: '', customer_email: '', customer_phone: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await submitEnquiry({ ...form, certificate_id: cert.id })
      setSuccess(true)
    } catch {
      setError('Submission failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const isExpired = cert.is_expired

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {!success ? (
          <>
            <div className={`${isExpired ? 'bg-secondary' : 'bg-primary'} px-4 sm:px-6 py-3 sm:py-4 text-white flex items-center justify-center sticky top-0 z-10`}>
              <h3 className="text-sm sm:text-lg font-medium uppercase tracking-tight text-center">
                {isExpired ? 'Expired Certificate' : 'Request Re-Calibration'}
              </h3>
              <button onClick={onClose} className="absolute right-4 sm:right-6 text-white/80 hover:text-white transition-colors">
                <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              <div className={`${isExpired ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'} rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border`}>
                <p className="text-slate-700 text-[11px] sm:text-xs font-normal leading-relaxed">
                  Record <span className={`${isExpired ? 'text-secondary' : 'text-primary'} font-medium`}>{cert.certificate_number}</span> {isExpired ? `expired on ${formatDate(cert.calibration_due_date)}.` : 'is currently active.'} Request service now.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <Input label="Full Name" value={form.customer_name} onChange={v => setForm(f => ({ ...f, customer_name: v }))} required />
                <Input label="Email" type="email" value={form.customer_email} onChange={v => setForm(f => ({ ...f, customer_email: v }))} required />
                <Input label="Phone" value={form.customer_phone} onChange={v => setForm(f => ({ ...f, customer_phone: v }))} />
                <div>
                  <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1">Details</label>
                  <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    rows={2} placeholder="Recalibration needs…"
                    className={`w-full rounded-xl bg-slate-50 border border-slate-200 px-3 sm:px-4 py-2 text-sm font-normal outline-none transition-all resize-none focus:border-${isExpired ? 'secondary' : 'primary'}`} />
                </div>
                {error && <p className="text-secondary text-xs font-medium">{error}</p>}
                <button type="submit" disabled={loading}
                  className={`w-full py-3.5 sm:py-4 rounded-xl text-white font-medium text-xs sm:text-sm uppercase tracking-widest transition-all shadow-md ${isExpired ? 'bg-secondary hover:bg-[#b81d22]' : 'bg-primary hover:bg-[#283566]'}`}>
                  {loading ? 'Sending…' : 'Request Recalibration'}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="p-8 sm:p-10 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <FaCheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500" />
            </div>
            <h3 className="text-slate-900 font-medium text-lg sm:text-xl mb-1">Request Sent</h3>
            <p className="text-slate-500 text-sm font-normal mb-6">We'll contact you shortly.</p>
            <button onClick={onClose} className="w-full py-3 rounded-xl bg-primary text-white font-medium">Close</button>
          </div>
        )}
      </div>
    </div>
  )
}

const Input = ({ label, type = 'text', value, onChange, required }) => (
  <div>
    <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1">{label} {required && '*'}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required}
      className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 sm:px-4 py-2.5 sm:py-2 text-sm font-normal outline-none focus:border-primary transition-all" />
  </div>
)

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Main Check Page ──────────────────────────────────────────────────────────
export default function CheckPage() {
  const [certNumber, setCertNumber] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const handleCheck = async (e) => {
    e.preventDefault()
    if (!certNumber.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await checkCertificate(certNumber.trim())
      setResult({ found: true, ...res.data })
      if (res.data.is_expired) setShowModal(true)
    } catch (err) {
      if (err.response?.status === 404) setResult({ found: false })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full min-h-screen flex flex-col items-center bg-white pb-6">
      {/* Main Content */}
      <main className="w-full max-w-3xl px-4 sm:px-6 flex flex-col items-center justify-center flex-1">
        <div className="text-center my-6 md:my-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 sm:px-4 py-1.5 text-primary text-[10px] font-medium uppercase tracking-widest mb-3 sm:mb-4 border border-blue-100">
            <span className="w-1 h-1 rounded-full bg-primary" />
            Real-time Status
          </div>
          <h2 className="text-xl sm:text-4xl font-medium text-slate-900 leading-[1.1] mb-3 sm:mb-4 tracking-tighter">
            <span className="pb-1 sm:pb-2 block">Check Your </span><span className="text-primary">Calibration Status</span>
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm font-normal leading-relaxed max-w-sm mx-auto">
            Secure validation for instrument certificates and equipment compliance.
          </p>
        </div>

        {/* Search Bar */}
        <div className="w-full bg-white rounded-2xl border-2 border-slate-100 p-1 sm:p-1.5 shadow-xl shadow-slate-200/50">
          <form onSubmit={handleCheck} className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
            <input
              type="text"
              value={certNumber}
              onChange={e => setCertNumber(e.target.value)}
              placeholder="Enter Certificate Serial Number…"
              className="flex-1 rounded-xl bg-slate-50 text-slate-900 placeholder:text-slate-400 px-4 sm:px-5 py-3.5 sm:py-4 font-normal outline-none focus:bg-white focus:border-primary border-2 border-transparent transition-all text-sm"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !certNumber.trim()}
              className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-primary text-white font-medium uppercase tracking-widest text-xs hover:bg-[#283566] transition-all shadow-lg shadow-blue-900/10 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <FaSpinner className="w-4 h-4 animate-spin" />
              ) : 'Validate'}
            </button>
          </form>
        </div>

        {/* Dynamic Results */}
        {result && (
          result.found
            ? (!result.is_expired && <CertificateDetail cert={result} onOpenModal={() => setShowModal(true)} />)
            : <InvalidAlert />
        )}

        {result?.found && result.is_expired && (
          <div className="mt-4 sm:mt-6 w-full animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="rounded-2xl border-2 border-secondary/10 bg-white p-4 sm:p-6 flex gap-3 sm:gap-4 items-start shadow-xl shadow-red-100/50">
              <div className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-red-50 flex items-center justify-center border border-red-100">
                <FaExclamationCircle className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
              </div>
              <div className="flex-1">
                <h4 className="text-secondary font-bold text-sm sm:text-base mb-1 leading-tight">Certificate Expired</h4>
                <p className="text-slate-600 text-[11px] sm:text-xs font-normal">This record expired on <span className="font-normal">{formatDate(result.calibration_due_date)}</span>.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {showModal && <EnquiryModal cert={result} onClose={() => setShowModal(false)} />}
    </div>
  )
}

