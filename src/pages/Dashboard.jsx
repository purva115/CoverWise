import React, { useState, useEffect } from 'react';
import { useInsurance } from '../context/InsuranceContext';
import {
    Activity, CreditCard, ShieldCheck, Clock,
    TrendingUp, ArrowUpRight, Filter, Calendar,
    ChevronRight, Wallet, AlertCircle, PieChart, Info, MapPin,
    Sparkles, ArrowDownCircle, CheckCircle2, Shield
} from 'lucide-react';

const NESSIE_API_KEY = import.meta.env.VITE_NESSIE_API_KEY;

export default function Dashboard() {
    const { insuranceData } = useInsurance();
    const [accounts, setAccounts] = useState([]);
    const [atms, setAtms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');

    // Simulated Upcoming Bill for the Advisor Demo
    const upcomingBill = {
        amount: 1500,
        dueDate: 'March 02',
        provider: 'City General'
    };

    // Simulated Insurance Details (since we want "CareLess" UI state)
    const insuranceSummary = {
        plan: "Blue Cross PPO - Platinum",
        deductible: 3000,
        spent: 2150,
        copay: "$25",
        outOfPocketMax: 6000
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!NESSIE_API_KEY) {
                setLoading(false);
                return;
            }
            try {
                // Fetch Live Accounts
                const accRes = await fetch(`http://api.nessieisreal.com/accounts?key=${NESSIE_API_KEY}`);
                const accData = await accRes.json();
                setAccounts(accData);

                // Fetch Nearby "Facilities" (Using ATMs as proxy for Hackathon)
                const atmRes = await fetch(`http://api.nessieisreal.com/atms?key=${NESSIE_API_KEY}`);
                const atmData = await atmRes.json();
                setAtms(atmData.data ? atmData.data.slice(0, 3) : []);

            } catch (err) {
                console.error("Nessie API Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredAccounts = filter === 'All'
        ? accounts
        : accounts.filter(acc => acc.type === filter);

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    // Predictive "Financial Readiness Score"
    const readinessScore = accounts.length > 0
        ? Math.min(100, Math.round((totalBalance / 15000) * 100))
        : 0;

    // Smart Advisor Logic
    const getAdvice = () => {
        if (loading || accounts.length === 0) return null;

        const remainingAfterPay = totalBalance - upcomingBill.amount;

        if (remainingAfterPay < 1000) {
            return {
                type: 'warning',
                title: 'Wait for Paycheck',
                message: `Your balance will drop below $1k if you pay now. We recommend waiting until March 1st.`,
                icon: Clock
            };
        } else if (upcomingBill.amount > totalBalance * 0.15) {
            return {
                type: 'info',
                title: 'Consider Split Payment',
                message: `This bill is $>15% of your liquid assets. Split into 3 interest-free parts to keep cash flow safe.`,
                icon: PieChart
            };
        } else {
            return {
                type: 'success',
                title: 'Ready to Settle',
                message: `You have ample liquidity. Settling now helps simplify your journey and avoids late fees.`,
                icon: CheckCircle2
            };
        }
    };

    const advice = getAdvice();
    const deductibleProgress = (insuranceSummary.spent / insuranceSummary.deductible) * 100;

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 pt-10">
            <div className="max-w-7xl mx-auto px-10">

                {/* Header Section */}
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h1 className="syne text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                            User <span className="text-blue-600">Portfolio</span>
                        </h1>
                        <p className="text-slate-500 mt-2 font-medium text-lg">Integrated Capital One Analytics & Care Insights</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-blue-500" />
                            <span className="text-xs font-black text-slate-600 uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Left Column: Financial & Coverage Intelligence (4 cols) */}
                    <div className="lg:col-span-4 space-y-10">

                        {/* Health Readiness & Coverage Combo Card */}
                        <div className="glass rounded-[3rem] p-10 shadow-2xl shadow-blue-100/30 relative overflow-hidden group border border-white/50">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full -mr-24 -mt-24 group-hover:scale-125 transition-transform duration-1000"></div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-center mb-10">
                                    <h3 className="syne text-xl font-black text-slate-900">Health Readiness</h3>
                                    <Sparkles className="w-5 h-5 text-blue-500 animate-pulse" />
                                </div>

                                <div className="flex flex-col items-center mb-10">
                                    <div className="relative w-48 h-28 overflow-hidden">
                                        <svg viewBox="0 0 100 50" className="w-full h-full drop-shadow-xl">
                                            {/* Background Arc */}
                                            <path
                                                d="M 10,45 A 40,40 0 0 1 90,45"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="8"
                                                className="text-slate-100"
                                                strokeLinecap="round"
                                            />
                                            {/* Progress Arc */}
                                            <path
                                                d="M 10,45 A 40,40 0 0 1 90,45"
                                                fill="none"
                                                stroke="url(#arc-gradient)"
                                                strokeWidth="8"
                                                strokeDasharray="126"
                                                strokeDashoffset={126 - (126 * readinessScore) / 100}
                                                strokeLinecap="round"
                                                className="transition-all duration-1000 ease-out"
                                            />
                                            <defs>
                                                <linearGradient id="arc-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="#3b82f6" />
                                                    <stop offset="100%" stopColor="#6366f1" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                        {/* Decorative Center Dot */}
                                        <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-200 rounded-full border-4 border-white shadow-sm ring-4 ring-slate-50"></div>
                                    </div>

                                    <div className="text-center mt-4">
                                        <p className="syne text-4xl font-black text-slate-900 tracking-tighter">{readinessScore}%</p>
                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-1">Health Score</p>
                                        <p className="text-slate-400 text-[10px] mt-2 font-medium max-w-[180px] leading-relaxed mx-auto">
                                            Liquid assets can cover 100% of typical deductibles.
                                        </p>
                                    </div>
                                </div>

                                <div className="h-[1px] bg-slate-100 mb-8"></div>

                                {/* Deductible Status Indicator */}
                                <div>
                                    <div className="flex justify-between items-end mb-3">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deductible Utilization</span>
                                        <span className="text-sm font-black text-slate-900">${insuranceSummary.spent.toLocaleString()} / ${insuranceSummary.deductible.toLocaleString()}</span>
                                    </div>
                                    <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                        <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000" style={{ width: `${deductibleProgress}%` }}></div>
                                    </div>
                                    <p className="text-[9px] text-slate-400 mt-3 font-medium flex items-center gap-1">
                                        <Shield className="w-3 h-3" />
                                        Once hit, your insurance covers 90% of visits.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Nessie API: Linked Accounts */}
                        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm hover:shadow-xl transition-shadow duration-500">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="syne text-xl font-black text-slate-900">Live Accounts</h3>
                                <div className="px-3 py-1 bg-slate-50 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest">Capital One</div>
                            </div>

                            <div className="space-y-5">
                                {loading ? (
                                    [1, 2, 3].map(i => <div key={i} className="h-20 rounded-3xl bg-slate-50 animate-pulse"></div>)
                                ) : accounts.length > 0 ? (
                                    filteredAccounts.map(acc => (
                                        <div key={acc._id} className="p-5 rounded-3xl bg-slate-50/50 border border-slate-50 group hover:border-blue-200 hover:bg-white hover:shadow-md transition-all cursor-pointer">
                                            <div className="flex justify-between items-center">
                                                <div className="flex gap-4">
                                                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                        <Wallet className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-slate-900">{acc.nickname}</h4>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{acc.type}</p>
                                                    </div>
                                                </div>
                                                <p className="text-base font-black text-slate-900">${acc.balance.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-10 text-center">
                                        <AlertCircle className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                                        <p className="text-xs font-bold text-slate-400">No accounts linked.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Middle Column: Journey, Advisor & Events (8 cols) */}
                    <div className="lg:col-span-8 space-y-10">

                        {/* Dashboard Top Row: Advisor & Status Icons */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Smart Repayment Advisor */}
                            {advice && (
                                <div className="bg-gradient-to-br from-slate-900 to-blue-900 text-white rounded-[3rem] p-10 relative overflow-hidden shadow-2xl border border-white/5 group">
                                    <div className="absolute bottom-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Sparkles className="w-32 h-32 text-blue-400" />
                                    </div>
                                    <div className="relative z-10 h-full flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="px-4 py-1.5 bg-blue-600/30 backdrop-blur-md border border-blue-400/30 text-white text-[9px] font-black uppercase tracking-widest rounded-full">AI Financial Tip</div>
                                            </div>
                                            <div className="flex items-start gap-4 mb-6">
                                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                                                    <advice.icon className={`w-6 h-6 ${advice.type === 'warning' ? 'text-amber-400' : 'text-blue-400'}`} />
                                                </div>
                                                <h3 className="syne text-2xl font-black">{advice.title}</h3>
                                            </div>
                                            <p className="text-blue-100/60 text-sm leading-relaxed mb-6">{advice.message}</p>
                                        </div>

                                        <div className="bg-white/5 border border-white/10 p-5 rounded-[2rem] flex justify-between items-center">
                                            <div>
                                                <p className="text-[9px] font-bold text-blue-300 uppercase tracking-widest leading-none mb-1">Upcoming Bill</p>
                                                <p className="text-lg font-black">${upcomingBill.amount.toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-white/50">{upcomingBill.provider}</p>
                                                <p className="text-[10px] font-black text-blue-400 uppercase">Due Mar 02</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Plan Summary Card */}
                            <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm flex flex-col justify-between">
                                <div>
                                    <h3 className="syne text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                                        <ShieldCheck className="w-6 h-6 text-emerald-500" />
                                        Coverage Plan
                                    </h3>
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-50">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan Name</span>
                                            <span className="text-xs font-black text-slate-800">{insuranceSummary.plan}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-50">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In-Network Copay</span>
                                            <span className="text-sm font-black text-blue-600">{insuranceSummary.copay}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-50">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OOP Limit</span>
                                            <span className="text-xs font-black text-slate-800">${insuranceSummary.outOfPocketMax.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Patient Journey Planner */}
                        <div className="bg-blue-600 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-blue-200/50">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-40 -mt-40"></div>
                            <h3 className="syne text-3xl font-black mb-12 relative z-10 flex items-center gap-4">
                                <Activity className="w-8 h-8 text-blue-200" />
                                Patient Journey Timeline
                            </h3>

                            <div className="relative flex justify-between">
                                <div className="absolute top-8 left-14 right-14 h-[3px] bg-white/10"></div>

                                {[
                                    { step: 'Pre-Visit', status: 'Completed', date: 'Feb 20', icon: ShieldCheck, color: 'text-emerald-300' },
                                    { step: 'Hospital', status: 'In Progress', date: 'Mar 05', icon: Activity, color: 'text-blue-100' },
                                    { step: 'Post-Visit', status: 'Upcoming', date: 'Mar 15', icon: Clock, color: 'text-blue-200/40' },
                                    { step: 'Settlement', status: 'Awaiting', date: 'Apr 01', icon: CreditCard, color: 'text-blue-200/20' }
                                ].map((item, i) => (
                                    <div key={i} className="relative z-10 flex flex-col items-center group">
                                        <div className={`w-16 h-16 rounded-[2rem] bg-white/10 border border-white/20 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-white group-hover:text-blue-600 transition-all duration-500 ${item.status === 'Completed' ? 'bg-emerald-400/20 border-emerald-400/50' : ''}`}>
                                            <item.icon className={`w-7 h-7 ${item.status === 'Completed' ? 'text-emerald-300' : 'text-white'} group-hover:text-inherit`} />
                                        </div>
                                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">{item.step}</h4>
                                        <p className={`text-[10px] mt-1 font-black ${item.color}`}>{item.status}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bottom Row: Events & Facilities */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Recent Activity / Bills extracted */}
                            <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden">
                                <div className="flex justify-between items-center mb-10">
                                    <h3 className="syne text-xl font-black text-slate-900">Medical Events</h3>
                                    <div className="px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                        <Info className="w-3 h-3" />
                                        AI Verified
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    {[
                                        { provider: 'City General', procedure: 'MRI Scan', cost: '$1,200', status: 'Analyzed' },
                                        { provider: 'Westside Dental', procedure: 'Surgery Prep', cost: '$450', status: 'Pre-Auth' },
                                        { provider: 'LabCorp', procedure: 'Blood Panel', cost: '$210', status: 'Pending' }
                                    ].map((bill, i) => (
                                        <div key={i} className="flex justify-between items-center p-6 rounded-3xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 bg-white border border-slate-100 text-blue-600 rounded-2xl flex items-center justify-center font-black shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:rotate-6">
                                                    {bill.provider[0]}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-900">{bill.procedure}</h4>
                                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{bill.provider}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-base font-black text-slate-900">{bill.cost}</p>
                                                <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded ml-auto w-max">{bill.status}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Nearby "Facilities" (ATMs) */}
                            <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
                                <h3 className="syne text-xl font-black text-slate-900 mb-10 flex items-center gap-3">
                                    <MapPin className="w-6 h-6 text-blue-600" />
                                    Care Partnerships
                                </h3>
                                <div className="space-y-6">
                                    {loading ? (
                                        [1, 2].map(i => <div key={i} className="h-20 rounded-3xl bg-slate-50 animate-pulse"></div>)
                                    ) : atms.length > 0 ? (
                                        atms.map(atm => (
                                            <div key={atm._id} className="p-6 rounded-3xl bg-blue-50/30 border border-transparent hover:border-blue-100 hover:bg-blue-50/50 transition-all group">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="text-sm font-black text-slate-900">{atm.name}</h4>
                                                    <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                                                </div>
                                                <p className="text-[11px] font-medium text-slate-500 leading-relaxed">{atm.address.street_number} {atm.address.street_name}, {atm.address.city}</p>
                                                <div className="flex items-center gap-3 mt-4">
                                                    <span className="text-[10px] font-black text-emerald-600 uppercase bg-white px-3 py-1 rounded-full border border-emerald-100 shadow-sm">Verified Partner</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-10 text-center opacity-40">
                                            <MapPin className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                                            <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Searching Network...</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
