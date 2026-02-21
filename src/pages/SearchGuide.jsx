import { useState } from 'react'
import { useInsurance } from '../context/InsuranceContext'
import { searchTreatment } from '../api/gemini'
import { speak } from '../api/elevenlabs'

export default function SearchGuide() {
    const [query, setQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState(null)
    const [error, setError] = useState('')
    const { insuranceData } = useInsurance()

    const handleSearch = async () => {
        if (!query.trim()) return
        setLoading(true)
        setError('')
        setResults(null)

        try {
            // Contextual search - send insurance data to Gemini to get tailored costs
            const res = await searchTreatment(query, insuranceData)
            const cleaned = res.replace(/```json|```/g, '').trim()
            const parsed = JSON.parse(cleaned)
            setResults(parsed)

            try {
                await speak(`I found some information for ${query}. ${parsed.summary || ''}`)
            } catch (vErr) { console.warn(vErr) }

        } catch (e) {
            console.error('Search error:', e)
            setError('Failed to find treatment data. Please try again.')
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-gray-50 text-slate-900 pb-20">
            <div className="max-w-4xl mx-auto px-6 py-12">

                {/* Header */}
                <div className="mb-12 text-center">
                    <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 mb-6">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                        <span className="text-blue-600 text-[10px] font-bold tracking-widest uppercase">Treatment Guide</span>
                    </div>
                    <h1 className="syne text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                        Treatment Cost <br />
                        <span className="text-blue-600">Estimator</span>
                    </h1>
                    <p className="text-slate-500 mt-6 text-lg max-w-2xl mx-auto leading-relaxed">
                        Search for any medical procedure to see typical costs and how your <br />
                        <span className="font-bold text-slate-700">{insuranceData?.planName || 'current'}</span> plan might cover it.
                    </p>
                </div>

                {/* Search Box */}
                <div className="max-w-2xl mx-auto mb-12">
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Try 'MRI Scan', 'ACL Surgery', or 'Dental Cleaning'..."
                            className="w-full bg-white border border-slate-200 rounded-3xl px-8 py-6 text-lg shadow-xl shadow-slate-200/50 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-medium placeholder:text-slate-300"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <button
                            onClick={handleSearch}
                            disabled={loading}
                            className="absolute right-3 top-3 bottom-3 bg-slate-900 text-white px-8 rounded-2xl font-bold text-sm hover:bg-blue-600 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="max-w-2xl mx-auto bg-red-50 border border-red-100 rounded-2xl px-6 py-4 text-red-600 text-sm font-medium mb-8">
                        ⚠️ {error}
                    </div>
                )}

                {loading && (
                    <div className="max-w-2xl mx-auto space-y-4">
                        <div className="h-48 bg-white border border-slate-100 rounded-[2.5rem] animate-pulse"></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="h-24 bg-white border border-slate-100 rounded-3xl animate-pulse"></div>
                            <div className="h-24 bg-white border border-slate-100 rounded-3xl animate-pulse"></div>
                        </div>
                    </div>
                )}

                {results && !loading && (
                    <div className="max-w-2xl mx-auto space-y-6">
                        {/* Procedure Card */}
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Procedure Found</p>
                                    <h2 className="syne text-3xl font-extrabold text-slate-900">{results.procedureName}</h2>
                                </div>
                                <span className="text-4xl text-blue-100">🩺</span>
                            </div>

                            <p className="text-slate-600 text-sm leading-relaxed mb-8">
                                {results.description}
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-50 rounded-3xl p-6 border border-blue-100/50">
                                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">Estimated Cost</p>
                                    <p className="syne text-3xl font-bold text-blue-600">{results.estimatedCost}</p>
                                    <p className="text-blue-400 text-[10px] mt-1 font-medium">U.S. National Average</p>
                                </div>
                                <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100/50">
                                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">Your Estimate</p>
                                    <p className="syne text-3xl font-bold text-emerald-600">{results.yourEstimatedCost}</p>
                                    <p className="text-emerald-500 text-[10px] mt-1 font-medium">Based on your {insuranceData?.provider || 'plan'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Breakdown */}
                        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                            <h3 className="syne text-lg font-bold text-slate-900 mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-sm">📊</span>
                                Insurance Breakdown
                            </h3>
                            <div className="space-y-4">
                                {results.breakdown?.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
                                        <span className="text-slate-500 text-sm font-medium">{item.label}</span>
                                        <span className="text-slate-900 text-sm font-bold">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Advice */}
                        <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                            <h3 className="syne text-lg font-bold mb-4 relative z-10">AI Health Tip</h3>
                            <p className="text-slate-300 text-sm leading-relaxed relative z-10">
                                {results.advice}
                            </p>
                        </div>
                    </div>
                )}

                {!results && !loading && (
                    <div className="max-w-2xl mx-auto py-20 text-center opacity-40 grayscale group">
                        <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">🔍</div>
                        <p className="text-slate-400 font-medium">Enter a procedure name above to start estimating</p>
                    </div>
                )}
            </div>
        </div>
    )
}
