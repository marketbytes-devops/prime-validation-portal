import React, { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { getEnquiries, updateEnquiry } from '../api/api'
import {
  FaSearch,
  FaSpinner,
  FaCalendarAlt,
  FaCheckCircle,
  FaExclamationCircle,
  FaTimes
} from 'react-icons/fa'

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export default function RecalibrationRequests() {
  const [enquiries, setEnquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '', search: '', date_from: '', date_to: '' })

  // Resolve modal state
  const [resolveEnq, setResolveEnq] = useState(null)
  const [resolveForm, setResolveForm] = useState({ new_certificate_number: '', calibration_due_date: '' })
  const [resolveLoading, setResolveLoading] = useState(false)
  const [resolveError, setResolveError] = useState('')

  // Toast notifications
  const [toast, setToast] = useState(null)

  const fetchEnquiries = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.status) params.status = filters.status
      if (filters.search) params.search = filters.search
      const res = await getEnquiries(params)
      setEnquiries(res.data.results)
    } catch { setEnquiries([]) } finally { setLoading(false) }
  }

  useEffect(() => { fetchEnquiries() }, [filters])

  // Show toast with auto-dismiss
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Handle Resolve with details
  const handleResolve = async (e) => {
    if (e) e.preventDefault()
    if (!resolveEnq) return
    
    if (!resolveForm.new_certificate_number || !resolveForm.calibration_due_date) {
      setResolveError('All fields are required.')
      return
    }

    setResolveLoading(true)
    setResolveError('')
    try {
      await updateEnquiry(resolveEnq.id, { 
        status: 'resolved',
        new_certificate_number: resolveForm.new_certificate_number,
        calibration_due_date: resolveForm.calibration_due_date
      })
      setResolveEnq(null)
      showToast(`Request resolved and certificate updated. Resolution email sent to ${resolveEnq.customer_email}`)
      fetchEnquiries()
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to resolve. Please try again.'
      setResolveError(msg)
    } finally {
      setResolveLoading(false)
    }
  }

  // Handle Reopen
  const handleReopen = async (id) => {
    try {
      await updateEnquiry(id, { status: 'pending' })
      showToast('Request reopened successfully.')
      fetchEnquiries()
    } catch {
      showToast('Failed to reopen request.', 'error')
    }
  }

  const openResolveModal = (enq) => {
    setResolveEnq(enq)
    setResolveForm({
      new_certificate_number: '',
      calibration_due_date: ''
    })
    setResolveError('')
  }

  // Outside click for modal
  const modalRef = React.useRef()
  const handleOutsideClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      setResolveEnq(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#344482] uppercase tracking-tight">Recalibration</h2>
        <p className="text-slate-500 font-semibold text-sm mt-1">Manage inbound service requests for instrument recalibration.</p>
      </div>

      {/* Filter Station */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-xl shadow-slate-200/20 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[240px]">
          <label className="block text-[10px] text-slate-600 uppercase tracking-widest mb-1.5">Request Search</label>
          <div className="relative">
            <input type="text" value={filters.search} placeholder="Customer name or ID…"
              onChange={e => setF('search', e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 pl-10 outline-none focus:border-[#344482] focus:bg-white transition-all font-semibold text-sm" />
            <FaSearch className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
        </div>
        <div className="w-full sm:w-auto">
          <label className="block text-[10px] text-slate-600 uppercase tracking-widest mb-1.5">Status</label>
          <select value={filters.status} onChange={e => setF('status', e.target.value)}
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 outline-none focus:border-[#344482] focus:bg-white transition-all font-semibold text-sm min-w-[140px]">
            <option value="">All Leads</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <button onClick={() => setFilters({ status: '', search: '', date_from: '', date_to: '' })}
          className="px-6 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200">
          Reset
        </button>
      </div>

      {/* Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden">
        <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-200">
          <h3 className="text-slate-900 font-bold text-sm uppercase tracking-tight">Active Requests</h3>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <FaSpinner className="animate-spin w-8 h-8 text-[#344482] mx-auto" />
          </div>
        ) : enquiries.length === 0 ? (
          <div className="py-20 text-center opacity-40">
            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">No requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-600 border-b border-slate-100">
                  {['Date', 'Certificate Number', 'Customer', 'Message', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-[10px] font-bold uppercase tracking-[0.15em] px-6 py-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {enquiries.map(enq => (
                  <tr key={enq.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5 whitespace-nowrap text-slate-500 font-semibold text-xs">{fmtDate(enq.created_at)}</td>
                    <td className="px-6 py-5">
                      <p className="text-[#344482] font-semibold text-sm">{enq.certificate_number || 'ID: ' + enq.certificate}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-slate-900 font-semibold text-sm">{enq.customer_name}</p>
                      <p className="text-slate-400 text-[10px] font-semibold mt-1">{enq.customer_email}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-slate-600 text-xs font-medium max-w-[200px] truncate" title={enq.message}>{enq.message || '—'}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-widest shadow-sm
                        ${enq.status === 'pending'
                          ? 'bg-orange-50 text-orange-600 border border-orange-100'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${enq.status === 'pending' ? 'bg-orange-500' : 'bg-emerald-500'}`} />
                        {enq.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex gap-2 items-center">

                        {/* Resolve / Reopen Button */}
                        {enq.status === 'pending' ? (
                          <button onClick={() => openResolveModal(enq)}
                            className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap border border-emerald-100 hover:bg-emerald-500 hover:text-white transition-all">
                            Resolve
                          </button>
                        ) : (
                          <button onClick={() => handleReopen(enq.id)}
                            className="px-4 py-2 rounded-xl bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap border border-slate-100 hover:bg-orange-50 hover:text-orange-600 transition-all">
                            Reopen
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {resolveEnq && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in" onClick={handleOutsideClick}>
          <div ref={modalRef} className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#344482] px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-base font-bold uppercase tracking-tight">Resolve Request</h3>
              <button onClick={() => setResolveEnq(null)} className="text-white/80 hover:text-white transition-colors">
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-emerald-50 rounded-xl p-4 mb-6 border border-emerald-100 flex items-start gap-3">
                <FaCheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-slate-700 text-xs font-medium leading-relaxed">
                  Resolving this request for <span className="text-[#344482] font-bold">{resolveEnq.certificate_number}</span>. 
                  Updating the certificate number and due date will mark it as <span className="text-emerald-600 font-bold">Active</span> and notify 
                  <span className="font-bold text-slate-600 ml-1">{resolveEnq.customer_email}</span>.
                </p>
              </div>

              <form onSubmit={handleResolve} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Current Certificate Number
                  </label>
                  <div className="w-full bg-slate-100/50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-500 shadow-inner">
                    {resolveEnq.certificate_number}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#344482] uppercase tracking-widest mb-1.5">
                    New Certificate Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter new certificate number…"
                    value={resolveForm.new_certificate_number}
                    onChange={e => { setResolveForm(f => ({ ...f, new_certificate_number: e.target.value })); setResolveError('') }}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-[#344482] focus:bg-white transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#344482] uppercase tracking-widest mb-1.5">
                    New Calibration Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={resolveForm.calibration_due_date}
                    onChange={e => { setResolveForm(f => ({ ...f, calibration_due_date: e.target.value })); setResolveError('') }}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-[#344482] focus:bg-white transition-all shadow-sm"
                  />
                </div>

                {resolveError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-[#d9242a] text-xs font-bold flex items-center gap-2 animate-in shake duration-300">
                    <FaExclamationCircle className="w-4 h-4 shrink-0" />
                    {resolveError}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={resolveLoading}
                    className="flex-1 py-3.5 rounded-xl bg-emerald-500 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-900/20 hover:bg-emerald-600 transition-all disabled:opacity-70 flex items-center justify-center gap-2">
                    {resolveLoading ? <><FaSpinner className="w-3 h-3 animate-spin" /> Resolving…</> : 'Confirm & Resolve'}
                  </button>
                  <button type="button" onClick={() => setResolveEnq(null)}
                    className="px-6 py-3.5 rounded-xl bg-slate-100 text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast Notification ──────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 max-w-sm px-5 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-bottom-4 fade-in duration-300
          ${toast.type === 'error'
            ? 'bg-red-50 border-red-200 text-[#d9242a]'
            : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
          {toast.type === 'error'
            ? <FaExclamationCircle className="w-5 h-5 shrink-0" />
            : <FaCheckCircle className="w-5 h-5 shrink-0" />}
          <p className="text-sm font-semibold">{toast.message}</p>
          <button onClick={() => setToast(null)} className="ml-auto opacity-60 hover:opacity-100 transition-opacity">
            <FaTimes className="w-3 h-3" />
          </button>
        </div>
      )}
    </DashboardLayout>
  )
}
