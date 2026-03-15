import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { resetPassword } from '../api/api'
import { AuthLayout, ErrorBox } from './ForgotPassword'
import { FaEye, FaEyeSlash } from 'react-icons/fa'

export default function ResetPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || ''
  const [form, setForm] = useState({ new_password: '', confirm_password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.new_password !== form.confirm_password) {
      setError('Passwords do not match.'); return
    }
    if (form.new_password.length < 8) {
      setError('Password must be at least 8 characters.'); return
    }
    setLoading(true)
    setError('')
    try {
      await resetPassword({ email, ...form })
      navigate('/login', { state: { success: 'Password reset successfully. Please sign in.' } })
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="New Password" subtitle="Set a secure password to regain access to your dashboard.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <PwdField label="New Password" id="new_pwd" value={form.new_password}
          onChange={v => setForm(f => ({ ...f, new_password: v }))} />
        <PwdField label="Repeat Password" id="confirm_pwd" value={form.confirm_password}
          onChange={v => setForm(f => ({ ...f, confirm_password: v }))} />

        {error && <ErrorBox msg={error} />}

        <button type="submit" disabled={loading}
          className="w-full py-4 rounded-xl bg-[#344482] text-white font-semibold hover:bg-[#283566] transition-all shadow-md shadow-[#344482]/20 disabled:opacity-70">
          {loading ? 'Processing…' : 'Finalize & Update'}
        </button>
      </form>
    </AuthLayout>
  )
}

function PwdField({ label, id, value, onChange }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        <input id={id} type={show ? 'text' : 'password'} required value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Min. 8 characters"
          className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#344482] focus:border-transparent transition-all placeholder:text-slate-400" />
        <button type="button" onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
          {show ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
        </button>
      </div>
    </div>
  )
}

