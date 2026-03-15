import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  FaThLarge, 
  FaCertificate, 
  FaPlus, 
  FaSyncAlt, 
  FaShieldAlt, 
  FaBars, 
  FaSearch, 
  FaSignOutAlt, 
  FaBell 
} from 'react-icons/fa'
import logo from '../assets/logo.webp'

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const nav = [
    {
      label: 'Dashboard', to: '/dashboard', icon: <FaThLarge className="w-4 h-4" />
    },
    {
      label: 'Certificates', to: '/certificates', icon: <FaCertificate className="w-4 h-4" />
    },
    {
      label: 'Add Certificate', to: '/add-certificate', icon: <FaPlus className="w-4 h-4" />
    },
    {
      label: 'Recalibration Request', to: '/recalibration-requests', icon: <FaSyncAlt className="w-4 h-4" />
    },
  ]

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    navigate('/login')
  }

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/certificates?search=${searchQuery.trim()}`)
    }
  }

  const [notifications, setNotifications] = useState([
    { 
      title: 'New Recalibration Request', 
      time: '5m ago', 
      type: 'service',
      to: '/recalibration-requests'
    },
    { 
      title: 'Certificate Number #CERT-2024-089 Expired', 
      time: '2h ago', 
      type: 'alert',
      to: '/certificates?status=expired'
    },
    { 
      title: 'Daily Report Generated', 
      time: '1d ago', 
      type: 'info',
      to: '#'
    }
  ])

  // Outside click for notifications
  React.useEffect(() => {
    if (!showNotifications) return
    const handleClick = (e) => {
      if (!e.target.closest('.notification-container')) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [showNotifications])

  const handleClearAll = (e) => {
    e.stopPropagation()
    setNotifications([])
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] w-full">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 z-50 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:block ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Brand Section */}
          <div className="px-8 py-8 flex item-center justify-center">
            <Link to="/dashboard" className="flex items-center">
              <img src={logo} alt="Prime Innovation Logo" className="h-16 w-auto object-contain" />
            </Link>
          </div>

          {/* User Profile Hook (Original Sidebar) */}
          <div className="px-6 mb-4">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">Superadmin</p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">Administrator</p>
              </div>
            </div>
          </div>

          {/* Navigation Section Label */}
          <div className="px-8 pt-4 pb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Management</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-8 py-2 space-y-1 overflow-y-auto">
            {nav.map((item) => {
              const isActive = location.pathname === item.to
              return (
                <Link key={item.to} to={item.to}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-semibold text-[13px] group ${isActive ? 'bg-[#344482] text-white shadow-xl shadow-blue-900/20' : 'text-slate-700 hover:bg-slate-50 hover:text-[#344482]'}`}>
                  <span className={`${isActive ? 'text-white' : 'text-slate-600 group-hover:text-[#344482]'}`}>{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Footer Sidebar */}
          <div className="p-8 mt-auto">
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-red-50 text-[#d9242a] font-bold text-xs uppercase tracking-[0.1em] hover:bg-[#d9242a] hover:text-white transition-all shadow-sm border border-red-100">
              <FaSignOutAlt className="w-4 h-4" />
              Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 min-h-[80px] h-20 px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-6">
            <button className="lg:hidden p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:text-[#344482] border border-slate-200" onClick={() => setSidebarOpen(true)}>
              <FaBars className="w-5 h-5" />
            </button>
            <div className="relative group hidden md:block">
              <input 
                type="text" 
                placeholder="Search certificates..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                className="bg-slate-100/50 border border-slate-200 rounded-2xl px-6 py-3 pl-12 text-sm font-medium w-80 outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-[#344482]/20 transition-all" 
              />
              <FaSearch className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#344482]" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Redesigned User Profile Card */}
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#F8FAFC] border border-slate-100">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900 leading-tight">Superadmin</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">ADMINISTRATOR</p>
              </div>
            </div>

            <div className="relative notification-container">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowNotifications(!showNotifications) }}
                className={`relative w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${showNotifications ? 'bg-[#344482] text-white border-[#344482]' : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-[#344482]'}`}
              >
                <FaBell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#d9242a] text-white text-[8px] font-bold rounded-full flex items-center justify-center border-2 border-white">{notifications.length}</span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Notifications</h3>
                    {notifications.length > 0 && (
                      <span className="bg-[#344482] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">New</span>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-6 py-10 text-center opacity-40">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">No notifications</p>
                      </div>
                    ) : (
                      notifications.map((note, i) => (
                        <div key={i} 
                          onClick={() => { navigate(note.to); setShowNotifications(false) }}
                          className="px-6 py-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 cursor-pointer">
                          <p className="text-sm font-semibold text-slate-800 mb-1">{note.title}</p>
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{note.time}</p>
                        </div>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <button 
                      onClick={handleClearAll}
                      className="w-full py-3 text-[10px] font-bold text-[#344482] uppercase tracking-widest border-t border-slate-100 hover:bg-[#344482] hover:text-white transition-all"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
