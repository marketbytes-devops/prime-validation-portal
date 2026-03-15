import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { forgotPassword } from '../api/api'
import { 
  FaCheckCircle, 
  FaKey, 
  FaExclamationCircle 
} from 'react-icons/fa'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await forgotPassword({ email })
      setSent(true)
      setTimeout(() => navigate('/verify-otp', { state: { email } }), 1000)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your email to receive a 6-digit verification code."
    >
      {sent ? (
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4">
            <FaCheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <p className="text-emerald-700 font-semibold">OTP sent successfully!</p>
          <p className="text-slate-500 text-sm">Redirecting to verification…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
            <input id="email" type="email" required autoFocus value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#344482] focus:border-transparent transition-all placeholder:text-slate-400" />
          </div>

          {error && <ErrorBox msg={error} />}

          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#344482] text-white font-semibold hover:bg-[#283566] transition-all shadow-md shadow-[#344482]/20 disabled:opacity-70">
            {loading ? 'Sending Code…' : 'Send Verification Code'}
          </button>

          <p className="text-center text-sm text-slate-500 font-medium mt-2">
            Remember your password?{' '}
            <Link to="/login" className="text-[#344482] font-semibold hover:underline">Sign in</Link>
          </p>
        </form>
      )}
    </AuthLayout>
  )
}

// ─── Shared Layout ────────────────────────────────────────────────────────────
export function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-[#344482] items-center justify-center shadow-lg mb-4">
             <FaKey className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl text-[#344482] uppercase tracking-tight">{title}</h1>
          <p className="text-slate-500 font-medium mt-1">{subtitle}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xl shadow-slate-200/50">
          {children}
        </div>
      </div>
    </div>
  )
}

export function ErrorBox({ msg }) {
  return (
    <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-[#d9242a] text-sm font-semibold flex items-center gap-2 animate-in shake-1">
      <FaExclamationCircle className="w-4 h-4 shrink-0" />
      {msg}
    </div>
  )
}

