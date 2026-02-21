import { Link, useLocation } from 'react-router-dom'

const links = [
    { to: '/', label: '🏥 Insurance Info' },
    { to: '/search', label: '🔍 Search Guide' },
    { to: '/events', label: '📅 Community' },
    { to: '/donate', label: '💜 Donate' },
]

export default function Navbar() {
    const { pathname } = useLocation()
    return (
        <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-10">
                <span className="syne font-bold text-blue-600 text-2xl tracking-tight">CoverWise</span>
                <div className="flex gap-8">
                    {links.map(l => (
                        <Link
                            key={l.to}
                            to={l.to}
                            className={`text-sm font-semibold tracking-tight transition-all ${pathname === l.to
                                ? 'text-blue-600'
                                : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            {l.label}
                        </Link>
                    ))}
                </div>
            </div>
            <div className="hidden md:block text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                AI Health Assistant v1.0
            </div>
        </nav>
    )

}