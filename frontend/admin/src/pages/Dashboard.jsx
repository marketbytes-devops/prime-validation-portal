import React, { useEffect, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { getDashboardStats } from '../api/api'
import { 
  FaCertificate, 
  FaCheckCircle, 
  FaHistory, 
  FaSyncAlt, 
  FaExclamationCircle 
} from 'react-icons/fa'

const StatCard = ({ label, value, color, icon }) => (
  <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 group relative overflow-hidden">
    <div className={`absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 ${color.replace('bg-', 'text-')} opacity-[0.03] -mr-6 sm:-mr-8 -mt-6 sm:-mt-8 transition-transform group-hover:scale-110 duration-700 flex items-center justify-center`}>
      {React.cloneElement(icon, { size: 64 })}
    </div>

    <div className="flex justify-between items-start mb-4 sm:mb-6">
      <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-inner ${color}`}>
        {React.cloneElement(icon, { size: 18 })}
      </div>
    </div>

    <div className="space-y-0.5 sm:space-y-1">
      <p className="text-slate-600 text-[9px] sm:text-[11px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] leading-tight">{label}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{value ?? '0'}</h3>
      </div>
    </div>
  </div>
)

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardStats()
      .then(r => setStats(r.data))
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout>
      <div className="mb-4 sm:mb-6 relative">
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-[#344482]/5 border border-[#344482]/10 mb-3 sm:mb-6">
          <span className="text-[9px] sm:text-[10px] text-[#344482] uppercase tracking-[0.2em]">Compliance Overview</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 leading-tight tracking-tighter mb-2 sm:mb-4">
          Prime Customer <br /> <span className="text-[#344482]">Validation Dashboard</span>
        </h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-8">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-36 sm:h-48 rounded-2xl sm:rounded-3xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-8">
          <StatCard
            label="Total Certificates"
            value={stats?.total_certificates}
            color="bg-blue-50 text-[#344482]"
            icon={<FaCertificate />}
          />
          <StatCard
            label="Active Certificates"
            value={stats?.active_certificates}
            color="bg-emerald-50 text-emerald-600"
            icon={<FaCheckCircle />}
          />
          <StatCard
            label="Expired Certificates"
            value={stats?.expired_certificates}
            color="bg-red-50 text-[#d9242a]"
            icon={<FaHistory />}
          />
          <StatCard
            label="Recalibration Request"
            value={stats?.total_enquiries}
            color="bg-slate-100 text-slate-600"
            icon={<FaSyncAlt />}
          />
          <StatCard
            label="Pending Requests"
            value={stats?.pending_enquiries}
            color="bg-orange-50 text-orange-600"
            icon={<FaExclamationCircle />}
          />
        </div>
      )}
    </DashboardLayout>
  )
}

