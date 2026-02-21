import { Heart, ShieldCheck, Zap, Globe } from 'lucide-react'

export default function Donations() {
    return (
        <div className="min-h-screen bg-gray-50 text-slate-900 pb-20">
            <div className="max-w-4xl mx-auto px-6 py-12">

                {/* Header */}
                <div className="mb-16 text-center">
                    <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-full px-4 py-1.5 mb-6">
                        <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                        <span className="text-rose-600 text-[10px] font-bold tracking-widest uppercase">Support Our Mission</span>
                    </div>
                    <h1 className="syne text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                        Help Us Keep <br />
                        <span className="text-rose-600">Healthcare Free</span>
                    </h1>
                    <p className="text-slate-500 mt-6 text-lg max-w-2xl mx-auto leading-relaxed">
                        CoverWise is a non-profit AI project dedicated to making insurance
                        understandable for everyone. Your support pays for AI compute and API costs.
                    </p>
                </div>

                {/* Donation Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {[
                        { amount: "$5", label: "Coffee Supporter", icon: "☕", desc: "Covers 50 AI insurance scans" },
                        { amount: "$25", label: "Health Hero", icon: "🦸", desc: "Covers 300 AI insurance scans", popular: true },
                        { amount: "$100", label: "Impact Partner", icon: "🌎", desc: "Covers 1,500 AI insurance scans" }
                    ].map((tier, i) => (
                        <div key={i} className={`relative bg-white rounded-[2.5rem] p-8 border ${tier.popular ? 'border-rose-200 ring-4 ring-rose-50' : 'border-slate-100'} shadow-xl shadow-slate-200/40 transition-all hover:scale-[1.03] duration-300`}>
                            {tier.popular && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                                    Most Impact
                                </span>
                            )}
                            <div className="text-4xl mb-4">{tier.icon}</div>
                            <h3 className="syne text-xl font-bold text-slate-900 mb-1">{tier.label}</h3>
                            <p className="text-slate-400 text-xs mb-6 font-medium">{tier.desc}</p>
                            <div className="text-4xl font-extrabold text-slate-900 mb-8">{tier.amount}</div>
                            <button className={`w-full py-4 rounded-2xl font-bold text-sm transition-all ${tier.popular ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-900 hover:text-white'}`}>
                                Donate Now
                            </button>
                        </div>
                    ))}
                </div>

                {/* Feature Grid */}
                <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="flex gap-6">
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 mb-2">100% Transparent</h4>
                            <p className="text-slate-500 text-sm leading-relaxed">Every cent goes toward API processing fees and keeping the platform ad-free.</p>
                        </div>
                    </div>
                    <div className="flex gap-6">
                        <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center shrink-0">
                            <Heart className="w-6 h-6 text-rose-500" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 mb-2">Personal Impact</h4>
                            <p className="text-slate-500 text-sm leading-relaxed">Help thousands of elderly and uninsured patients understand their coverage.</p>
                        </div>
                    </div>
                    <div className="flex gap-6">
                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0">
                            <Zap className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 mb-2">Instant Scale</h4>
                            <p className="text-slate-500 text-sm leading-relaxed">Your donation immediately increases our daily AI scan capacity across the globe.</p>
                        </div>
                    </div>
                    <div className="flex gap-6">
                        <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0">
                            <Globe className="w-6 h-6 text-amber-500" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 mb-2">Global Access</h4>
                            <p className="text-slate-500 text-sm leading-relaxed">Supporting translation services for non-English insurance documents.</p>
                        </div>
                    </div>
                </div>

                {/* Crypto Placeholder */}
                <div className="mt-12 text-center">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">We also accept crypto</p>
                    <div className="inline-flex items-center gap-4 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-xl transition-all hover:scale-[1.02] cursor-pointer">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center font-bold text-xs italic">S</div>
                        <div className="text-left">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Solana Address</p>
                            <p className="text-xs font-mono">Bv9v...8qA2</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
