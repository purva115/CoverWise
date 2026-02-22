import { Link, useLocation } from 'react-router-dom'
import { Activity } from 'lucide-react'

export default function Navbar() {
    const { pathname } = useLocation()
    const links = [
        { to: '/', label: '🏥 Pre Visit' },
        { to: '/post-visit', label: '🧾 Post Visit' },
        { to: '/dashboard', label: '📊 Dashboard' },
        { to: '/community', label: '📅 Community' },
    ]



    return (
        <nav className="sticky top-0 z-50 px-10 py-5 flex justify-between items-center transition-all duration-300 glass border-b border-blue-50/50 shadow-[0_2px_20px_-5px_rgba(59,130,246,0.08)]">
            <div className="flex items-center gap-14">
                <div className="flex items-center gap-2 group cursor-pointer">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200/50 group-hover:scale-110 transition-transform duration-300">
                        <Activity className="w-6 h-6 text-white" />
                    </div>
                    <span className="syne font-bold text-slate-900 text-3xl tracking-tighter">CareLess</span>
                </div>

                <div className="flex gap-2">
                    {links.map(l => (
                        <Link
                            key={l.to}
                            to={l.to}
                            className={`relative px-6 py-2.5 rounded-2xl text-base font-bold tracking-tight transition-all duration-300 flex items-center gap-2
                                ${pathname === l.to
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 translate-y-[-1px]'
                                    : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50/50'
                                }`}
                        >
                            {l.label}
                            {pathname === l.to && (
                                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full"></span>
                            )}
                        </Link>
                    ))}
                </div>
            </div>

            <div className="hidden lg:flex items-center gap-4">
                <div className="h-8 w-[1px] bg-slate-100 mx-2"></div>
                <div className="px-5 py-2 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-xs font-black uppercase tracking-widest border border-blue-100/50 shadow-inner">
                    AI Health Assistant v1.0
                </div>
            </div>
        </nav>
    )

}
