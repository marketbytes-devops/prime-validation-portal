import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import { getCertificates, deleteCertificate, updateCertificate } from '../api/api'
import { 
  FaSearch, 
  FaEdit, 
  FaTrash, 
  FaExclamationTriangle, 
  FaSpinner 
} from 'react-icons/fa'

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export default function CertificateList() {
  const [certs, setCerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '', search: '', date_from: '', date_to: '' })
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [delId, setDelId] = useState(null)
  const [saving, setSaving] = useState(false)
  const location = useLocation()

  const fetchCerts = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.status) params.status = filters.status
      if (filters.search) params.search = filters.search
      if (filters.date_from) params.date_from = filters.date_from
      if (filters.date_to) params.date_to = filters.date_to
      const res = await getCertificates(params)
      setCerts(res.data.results)
    } catch { setCerts([]) } finally { setLoading(false) }
  }

  useEffect(() => { fetchCerts() }, [filters])

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search)
    const search = queryParams.get('search')
    if (search !== null) {
      setFilters(f => ({ ...f, search }))
    }
  }, [location.search])

  const handleDelete = async (id) => {
    await deleteCertificate(id)
    setDelId(null)
    fetchCerts()
  }

  const handleEditOpen = (cert) => {
    setEditId(cert.id)
    setEditForm({ certificate_number: cert.certificate_number, calibration_date: cert.calibration_date, calibration_due_date: cert.calibration_due_date, description: cert.description || '' })
  }

  const handleEditSave = async () => {
    setSaving(true)
    try {
      await updateCertificate(editId, editForm)
      setEditId(null)
      fetchCerts()
    } finally { setSaving(false) }
  }

  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v }))

  // Outside click for modals
  const editModalRef = React.useRef()
  const delModalRef = React.useRef()

  const handleEditOutsideClick = (e) => {
    if (editModalRef.current && !editModalRef.current.contains(e.target)) {
      setEditId(null)
    }
  }

  const handleDelOutsideClick = (e) => {
    if (delModalRef.current && !delModalRef.current.contains(e.target)) {
      setDelId(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#344482] uppercase tracking-tight">Certificate Numbers</h2>
        <p className="text-slate-500 font-semibold text-sm mt-1">Manage and audit all equipment calibration records.</p>
      </div>

      {/* Filter Station */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-xl shadow-slate-200/20 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Certificate Number</label>
          <div className="relative">
            <input type="text" value={filters.search} placeholder="ID or Number…"
              onChange={e => setF('search', e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 pl-10 outline-none focus:border-[#344482] focus:bg-white transition-all font-semibold text-sm" />
            <FaSearch className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
        </div>
        <div className="w-full sm:w-auto">
          <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Status Filter</label>
          <select value={filters.status} onChange={e => setF('status', e.target.value)}
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 outline-none focus:border-[#344482] focus:bg-white transition-all font-semibold text-sm min-w-[140px]">
            <option value="">All Status</option>
            <option value="valid">Active</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <button onClick={() => setFilters({ status: '', search: '', date_from: '', date_to: '' })}
          className="px-6 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200">
          Reset
        </button>
      </div>

      {/* Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden">
        <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-slate-900 font-bold text-sm uppercase tracking-tight">Records <span className="text-slate-400 font-semibold ml-1">({certs.length})</span></h3>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <FaSpinner className="animate-spin w-8 h-8 text-[#344482] mx-auto" />
          </div>
        ) : certs.length === 0 ? (
          <div className="py-20 text-center opacity-40">
            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">No matching records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-600 border-b border-slate-100">
                  {['Certificate ID', 'Calibrated', 'Expiry Date', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-[10px] font-bold uppercase tracking-[0.15em] px-6 py-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {certs.map(cert => (
                  <tr key={cert.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <p className="text-[#344482] font-semibold text-sm">{cert.certificate_number}</p>
                    </td>
                    <td className="px-6 py-5 text-slate-500 font-semibold text-xs">{fmtDate(cert.calibration_date)}</td>
                    <td className="px-6 py-5 text-slate-500 font-semibold text-xs">{fmtDate(cert.calibration_due_date)}</td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-widest
                        ${cert.is_expired ? 'bg-red-50 text-[#d9242a] border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                         <span className={`w-1.5 h-1.5 rounded-full ${cert.is_expired ? 'bg-[#d9242a]' : 'bg-emerald-500'}`} />
                        {cert.is_expired ? 'Expired' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex gap-2">
                        <button onClick={() => handleEditOpen(cert)} className="p-2.5 rounded-xl text-[#344482] hover:bg-slate-100 transition-all border border-slate-200">
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDelId(cert.id)} className="p-2.5 rounded-xl text-[#d9242a] hover:bg-red-50 transition-all border border-red-100">
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Simplified Modal Controls */}
      {editId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={handleEditOutsideClick}>
          <div ref={editModalRef} className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-200">
            <h3 className="text-xl font-bold text-[#344482] mb-6 uppercase tracking-tight">Edit Record</h3>
            <div className="space-y-4">
              <ModalInput label="ID Number" value={editForm.certificate_number} onChange={v => setEditForm(f => ({ ...f, certificate_number: v }))} />
              <div className="grid grid-cols-2 gap-4">
                <ModalInput label="Calibration" type="date" value={editForm.calibration_date} onChange={v => setEditForm(f => ({ ...f, calibration_date: v }))} />
                <ModalInput label="Due Date" type="date" value={editForm.calibration_due_date} onChange={v => setEditForm(f => ({ ...f, calibration_due_date: v }))} red />
              </div>
              <textarea placeholder="Description…" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold h-24 resize-none outline-none focus:border-[#344482] transition-colors" />
              <div className="flex gap-3 pt-2">
                <button onClick={handleEditSave} disabled={saving} className="flex-1 py-3.5 rounded-xl bg-[#344482] text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-900/20">{saving ? 'Updating…' : 'Save Changes'}</button>
                <button onClick={() => setEditId(null)} className="px-6 py-3.5 rounded-xl bg-slate-100 text-slate-500 font-bold text-xs uppercase tracking-widest">Exit</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {delId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={handleDelOutsideClick} >
          <div ref={delModalRef} className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 text-center border border-slate-200">
            <div className="w-16 h-16 rounded-3xl bg-red-50 flex items-center justify-center mx-auto mb-6 border border-red-100">
              <FaExclamationTriangle className="w-8 h-8 text-[#d9242a]" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2 uppercase tracking-tight">Delete Certificate?</h3>
            <p className="text-slate-500 font-semibold text-sm mb-8">This action is permanent and cannot be reversed.</p>
            <div className="flex flex-col gap-2">
              <button onClick={() => handleDelete(delId)} className="w-full py-4 rounded-2xl bg-[#d9242a] text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-red-900/20">Confirm Delete</button>
              <button onClick={() => setDelId(null)} className="w-full py-3 rounded-2xl text-slate-400 font-bold text-xs uppercase tracking-widest">Dismiss</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

const ModalInput = ({ label, value, onChange, type = 'text', red }) => (
  <div>
    <label className={`block text-[10px] font-bold uppercase tracking-widest mb-1.5 ${red ? 'text-[#d9242a]' : 'text-slate-600'}`}>{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-[#344482] focus:bg-white transition-all" />
  </div>
)
