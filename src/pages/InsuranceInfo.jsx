import { useState, useRef, useCallback } from 'react'
import { useInsurance } from '../context/InsuranceContext'
import { speak } from '../api/elevenlabs'

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_VISION_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`

async function analyzeInsuranceImage(base64Data, mimeType, textInput) {
    const parts = []

    if (base64Data) {
        parts.push({ inline_data: { mime_type: mimeType, data: base64Data } })
    }

    parts.push({
        text: `You are a medical insurance expert with deep knowledge of all US insurance plans.

Step 1: Extract every visible detail from this insurance card or document (plan name, provider, member ID, group number, copay, payer ID, phone numbers, plan type, drug coverage info, RxBIN, RxPCN, RxGrp).

Step 2: Based on the plan type and provider you identified, use your expert knowledge to generate a FULL detailed breakdown of what this plan typically covers and excludes. Be specific — list at least 8 covered items and 6 excluded items based on this exact plan type.

${textInput ? `Extra context from user: ${textInput}` : ''}

Return ONLY valid JSON with no markdown, no backticks, no explanation:
{
  "planName": "full plan name extracted from card",
  "provider": "insurance company name",
  "planType": "PPO / HMO / Medicare Advantage / etc",
  "deductible": "typical deductible for this plan type e.g. $0 for Medicare Advantage",
  "outOfPocketMax": "typical out of pocket max for this plan type",
  "copay": "PCP $XX / Specialist $XX / ER $XX extracted or inferred",
  "memberId": "extracted from card",
  "groupNumber": "extracted from card",
  "payerId": "extracted from card if present",
  "rxBin": "extracted from card if present",
  "pcpName": "extracted from card if present",
  "pcpPhone": "extracted from card if present",
  "drugCoverage": "description of prescription drug coverage based on plan type",
  "covered": [
    "at least 8 specific things covered by this exact plan type"
  ],
  "notCovered": [
    "at least 6 specific things NOT covered by this exact plan type"
  ],
  "summary": "2-3 sentence plain english summary of this specific plan and what kind of patient it suits best"
}`
    })

    const res = await fetch(GEMINI_VISION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }] })
    })

    if (!res.ok) {
        const errData = await res.json()
        console.error('Gemini error:', errData)
        throw new Error(`API error: ${res.status}`)
    }

    const data = await res.json()
    return data.candidates[0].content.parts[0].text
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result.split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}

export default function InsuranceInfo() {
    const [input, setInput] = useState('')
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [dragOver, setDragOver] = useState(false)
    const [uploadedFile, setUploadedFile] = useState(null)
    const [preview, setPreview] = useState(null)
    const [error, setError] = useState('')
    const fileInputRef = useRef()
    const { setInsuranceData } = useInsurance()

    const handleFile = useCallback((file) => {
        if (!file) return
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
        if (!allowed.includes(file.type)) {
            setError('Please upload a JPG, PNG, WEBP, or PDF file.')
            return
        }
        setUploadedFile(file)
        setError('')
        if (file.type !== 'application/pdf') {
            const url = URL.createObjectURL(file)
            setPreview(url)
        } else {
            setPreview(null)
        }
    }, [])

    const handleDrop = useCallback((e) => {
        e.preventDefault()
        setDragOver(false)
        handleFile(e.dataTransfer.files[0])
    }, [handleFile])

    const handleAnalyze = async () => {
        if (!uploadedFile && !input.trim()) {
            setError('Please upload a file or enter insurance details.')
            return
        }
        setLoading(true)
        setError('')
        setResult(null)

        try {
            let base64 = null
            let mimeType = null
            if (uploadedFile) {
                base64 = await fileToBase64(uploadedFile)
                mimeType = uploadedFile.type
            }

            const raw = await analyzeInsuranceImage(base64, mimeType, input)
            const cleaned = raw.replace(/```json|```/g, '').trim()
            const parsed = JSON.parse(cleaned)
            setResult(parsed)
            setInsuranceData(parsed)

            // Auto-voice isolated so it never crashes the main flow
            try {
                await speak(`Your insurance plan has been analyzed. ${parsed.summary}`)
            } catch (voiceErr) {
                console.warn('Voice readout failed:', voiceErr)
            }

        } catch (e) {
            console.error('Analysis error:', e)
            setError('Failed to analyze. Check your API key or try again.')
        }

        setLoading(false)
    }

    const handleReadSection = async (text) => {
        try {
            await speak(text)
        } catch (e) {
            console.warn('Voice failed:', e)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 text-slate-900">
            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fade-up { animation: fadeUp 0.4s ease-out forwards; }
                .fade-up-1 { animation-delay: 0.1s; opacity: 0; }
                .fade-up-2 { animation-delay: 0.2s; opacity: 0; }
                .fade-up-3 { animation-delay: 0.3s; opacity: 0; }
                .fade-up-4 { animation-delay: 0.4s; opacity: 0; }
                .fade-up-5 { animation-delay: 0.5s; opacity: 0; }
                
                .shimmer {
                    background: linear-gradient(90deg, #f1f5f9 25%, #f8fafc 50%, #f1f5f9 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite linear;
                }
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                .speak-btn { opacity: 0; transition: all 0.2s; }
                .speak-parent:hover .speak-btn { opacity: 1; }
            `}</style>

            <div className="max-w-4xl mx-auto px-6 py-12">

                {/* Header */}
                <div className="mb-12 text-center">
                    <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 mb-6">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                        <span className="text-blue-600 text-[10px] font-bold tracking-widest uppercase">Intelligent Analysis</span>
                    </div>
                    <h1 className="syne text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                        Decode Your <br />
                        <span className="text-blue-600">Insurance Plan</span>
                    </h1>
                    <p className="text-slate-500 mt-6 text-lg max-w-2xl mx-auto leading-relaxed">
                        Upload your insurance card or document and let our AI translate the fine print into a clear, plain-English summary.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

                    {/* Left: Input Sections */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Upload Zone */}
                        <div
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative rounded-3xl border-2 border-dashed cursor-pointer transition-all duration-300 p-8 text-center
                                ${dragOver
                                    ? 'border-blue-400 bg-blue-50 scale-[1.02]'
                                    : uploadedFile
                                        ? 'border-green-200 bg-green-50/50'
                                        : 'border-slate-200 hover:border-blue-300 bg-white shadow-sm hover:shadow-md'
                                }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,.pdf"
                                className="hidden"
                                onChange={(e) => handleFile(e.target.files[0])}
                            />

                            {uploadedFile ? (
                                <div className="space-y-4">
                                    {preview ? (
                                        <div className="relative inline-block">
                                            <img src={preview} alt="Insurance card" className="h-40 mx-auto rounded-2xl object-contain border border-slate-100 shadow-sm" />
                                            <div className="absolute -top-2 -right-2 bg-green-500 text-white p-1 rounded-full shadow-lg">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-20 h-20 mx-auto bg-blue-50 rounded-2xl flex items-center justify-center text-3xl">
                                            📄
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-slate-900 font-bold text-sm truncate px-4">{uploadedFile.name}</p>
                                        <p className="text-blue-500 text-xs font-semibold mt-1">File uploaded successfully</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="w-16 h-16 mx-auto bg-blue-50 rounded-2xl flex items-center justify-center text-3xl border border-blue-100">
                                        🪪
                                    </div>
                                    <div>
                                        <p className="text-slate-900 font-bold">Upload Insurance Card</p>
                                        <p className="text-slate-400 text-sm mt-1 leading-relaxed">Drop image or click to browse<br />(PNG, JPG, PDF)</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Text Input */}
                        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Optional Details</label>
                            <textarea
                                className="w-full h-32 bg-slate-50 border-none rounded-2xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-slate-700 placeholder-slate-400"
                                placeholder="Add specific questions or details from your plan..."
                                value={input}
                                onChange={e => setInput(e.target.value)}
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-center gap-3">
                                <span className="text-red-500">⚠️</span>
                                <p className="text-red-600 text-xs font-medium">{error}</p>
                            </div>
                        )}

                        <button
                            onClick={handleAnalyze}
                            disabled={loading || (!uploadedFile && !input.trim())}
                            className="w-full py-5 rounded-2xl font-bold text-sm tracking-wide transition-all duration-300
                                bg-slate-900 text-white hover:bg-blue-600 shadow-lg hover:shadow-blue-200
                                disabled:opacity-20 disabled:cursor-not-allowed
                                flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    Processing...
                                </>
                            ) : (
                                <>Start AI Analysis</>
                            )}
                        </button>
                    </div>

                    {/* Right: Results / Skeletons */}
                    <div className="lg:col-span-3">

                        {!result && !loading && (
                            <div className="h-full min-h-[400px] border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-12 opacity-50">
                                <div className="text-6xl mb-6 grayscale text-blue-500">✨</div>
                                <h3 className="syne text-xl font-bold text-slate-400">Ready for Analysis</h3>
                                <p className="text-slate-400 text-sm mt-2 max-w-xs">Your results will appear here after the AI processes your documents.</p>
                            </div>
                        )}

                        {loading && (
                            <div className="space-y-6">
                                <div className="h-40 rounded-[2.5rem] shimmer"></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="h-32 rounded-3xl shimmer"></div>
                                    <div className="h-32 rounded-3xl shimmer"></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="h-64 rounded-3xl shimmer"></div>
                                    <div className="h-64 rounded-3xl shimmer"></div>
                                </div>
                            </div>
                        )}

                        {result && !loading && (
                            <div className="space-y-6">
                                {/* Success Banner */}
                                <div className="fade-up fade-up-1 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700 opacity-50"></div>

                                    <div className="flex justify-between items-start relative z-10">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Analysis Result</p>
                                            <h2 className="syne text-3xl font-extrabold text-slate-900 leading-tight">
                                                {result.planName || 'Generic Plan'}
                                            </h2>
                                            <p className="text-blue-600 font-bold text-sm mt-1">{result.provider}</p>

                                            {result.planType && (
                                                <div className="inline-flex mt-4 bg-slate-50 text-slate-500 text-[10px] font-extrabold px-3 py-1.5 rounded-full border border-slate-100 uppercase tracking-wider">
                                                    {result.planType}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleReadSection(result.summary)}
                                            className="flex items-center gap-2 bg-slate-900 text-white hover:bg-blue-600 text-[10px] font-bold px-4 py-2.5 rounded-full transition-all shadow-lg hover:shadow-blue-200"
                                        >
                                            🔊 LISTEN
                                        </button>
                                    </div>

                                    <div className="mt-8 p-6 bg-blue-50/50 rounded-3xl border border-blue-100/30">
                                        <p className="text-slate-600 text-sm leading-relaxed italic">"{result.summary}"</p>
                                    </div>

                                    {/* Tag fields */}
                                    <div className="mt-6 flex flex-wrap gap-2">
                                        {[
                                            { label: 'Member ID', val: result.memberId },
                                            { label: 'Group', val: result.groupNumber },
                                            { label: 'Payer ID', val: result.payerId },
                                            { label: 'RxBIN', val: result.rxBin }
                                        ].map((tag, i) => tag.val && (
                                            <div key={i} className="bg-white rounded-xl px-3 py-2 border border-slate-100 shadow-sm">
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-tight">{tag.label}</p>
                                                <p className="text-slate-700 text-[11px] font-mono font-bold mt-0.5">{tag.val}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Financials */}
                                <div className="fade-up fade-up-2 grid grid-cols-2 gap-4">
                                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-12 h-12 bg-gray-50 rounded-bl-3xl transition-colors group-hover:bg-blue-50"></div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Deductible</p>
                                        <p className="syne text-3xl font-bold text-slate-900">{result.deductible || '—'}</p>
                                        <p className="text-slate-400 text-[10px] mt-2 leading-tight">Amount required before <br />coverage activates</p>
                                    </div>
                                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-12 h-12 bg-gray-50 rounded-bl-3xl transition-colors group-hover:bg-blue-50"></div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Out of Pocket Max</p>
                                        <p className="syne text-3xl font-bold text-slate-900">{result.outOfPocketMax || '—'}</p>
                                        <p className="text-slate-400 text-[10px] mt-2 leading-tight">Maximum liability per <br />fiscal year</p>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="fade-up fade-up-3 space-y-3">
                                    {[
                                        { label: 'Copay Details', val: result.copay, icon: '🏥' },
                                        { label: 'Rx Drug Coverage', val: result.drugCoverage, icon: '💊' },
                                        { label: 'Primary Doctor', val: result.pcpName, sub: result.pcpPhone, icon: '👨‍⚕️' }
                                    ].map((item, i) => item.val && (
                                        <div key={i} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center justify-between group transition-colors hover:border-blue-200">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-xl group-hover:bg-blue-50 transition-colors">
                                                    {item.icon}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">{item.label}</p>
                                                    <p className="text-slate-900 font-bold text-sm">{item.val}</p>
                                                    {item.sub && <p className="text-blue-500 text-[10px] font-semibold mt-0.5">{item.sub}</p>}
                                                </div>
                                            </div>
                                            <div className="text-slate-200 group-hover:text-blue-200 transition-colors">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Lists */}
                                <div className="fade-up fade-up-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="speak-parent bg-white rounded-[2rem] p-7 border border-emerald-50 shadow-sm shadow-emerald-100/20">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 text-xs font-bold">✓</div>
                                                <p className="text-slate-900 font-bold text-sm tracking-tight">Fully Covered</p>
                                            </div>
                                            <button
                                                onClick={() => handleReadSection(`Covered items include ${result.covered?.join(', ')}`)}
                                                className="speak-btn bg-slate-100 p-2 rounded-full text-slate-400 hover:text-slate-900"
                                            >🔊</button>
                                        </div>
                                        <ul className="grid grid-cols-1 gap-3">
                                            {result.covered?.map((item, i) => (
                                                <li key={i} className="text-slate-600 text-xs font-medium flex gap-3 items-center">
                                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="speak-parent bg-white rounded-[2rem] p-7 border border-rose-50 shadow-sm shadow-rose-100/20">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center text-rose-600 text-xs font-bold">✕</div>
                                                <p className="text-slate-900 font-bold text-sm tracking-tight">Typical Exclusions</p>
                                            </div>
                                            <button
                                                onClick={() => handleReadSection(`Exclusions include ${result.notCovered?.join(', ')}`)}
                                                className="speak-btn bg-slate-100 p-2 rounded-full text-slate-400 hover:text-slate-900"
                                            >🔊</button>
                                        </div>
                                        <ul className="grid grid-cols-1 gap-3">
                                            {result.notCovered?.map((item, i) => (
                                                <li key={i} className="text-slate-600 text-xs font-medium flex gap-3 items-center">
                                                    <div className="w-1.5 h-1.5 bg-rose-400 rounded-full"></div>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* CTA */}
                                <div className="fade-up fade-up-5 bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-200/50 flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-sm">Action Suggested</p>
                                        <p className="text-blue-100 text-xs mt-1">Ready to search for specific treatment costs?</p>
                                    </div>
                                    <button className="bg-white text-blue-600 font-bold text-xs px-5 py-2.5 rounded-xl">Search Guide →</button>
                                </div>

                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )

}