import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { verifyOtp } from '../api/api'
import { AuthLayout, ErrorBox } from './ForgotPassword'

export default function VerifyOtp() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || ''
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()]

  useEffect(() => { refs[0].current?.focus() }, [])

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[i] = val
    setOtp(next)
    if (val && i < 5) refs[i + 1].current?.focus()
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs[i - 1].current?.focus()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const otpStr = otp.join('')
    if (otpStr.length < 6) { setError('Please enter the complete 6-digit OTP.'); return }
    setLoading(true)
    setError('')
    try {
      await verifyOtp({ email, otp: otpStr })
      navigate('/reset-password', { state: { email } })
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired OTP.')
      setOtp(['', '', '', '', '', ''])
      refs[0].current?.focus()
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Verification" subtitle={`We've sent a code to ${email || 'your email'}`}>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* OTP boxes */}
        <div className="flex gap-3 justify-center">
          {otp.map((digit, i) => (
            <input
              key={i} ref={refs[i]} type="text" inputMode="numeric"
              maxLength={1} value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className="w-12 h-14 text-center text-xl  rounded-xl bg-slate-50 border-2 border-slate-100 text-[#344482] outline-none focus:border-[#344482] focus:bg-white transition-all caret-[#344482]"
            />
          ))}
        </div>

        {error && <ErrorBox msg={error} />}

        <button type="submit" disabled={loading}
          className="w-full py-3.5 rounded-xl bg-[#344482] text-white font-semibold hover:bg-[#283566] transition-all shadow-md shadow-[#344482]/20 disabled:opacity-70">
          {loading ? 'Verifying…' : 'Verify & Continue'}
        </button>

        <p className="text-center text-sm text-slate-500 font-medium">
          Didn't receive?{' '}
          <Link to="/forgot-password" size="sm" className="text-[#344482] font-semibold hover:underline">Resend OTP</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
