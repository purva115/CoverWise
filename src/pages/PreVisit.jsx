import { useState, useRef, useCallback, useEffect } from 'react'
import { useInsurance } from '../context/InsuranceContext'
import { speak } from '../api/elevenlabs'
import { listGenerateContentModels } from '../api/geminiModels'
import {
    Plus, X, Mic, MicOff, Search, FileText, Activity,
    MapPin, DollarSign, ShieldAlert, Volume2, Sparkles,
    ArrowRight, ShieldCheck, Info, CheckCircle, Clock, CreditCard,
    Navigation, Star
} from 'lucide-react'

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY
const DEFAULT_PREVISIT_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash']

function cleanModelJson(raw) {
    const trimmed = (raw || '').replace(/```json|```/g, '').trim()
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start >= 0 && end > start) return trimmed.slice(start, end + 1)
    return trimmed
}

function normalizeAnalysisPayload(payload = {}) {
    const mitigationSteps = Array.isArray(payload.mitigationSteps)
        ? payload.mitigationSteps.map((step, index) => ({
            step: step?.step || step?.title || `Step ${index + 1}`,
            tip: step?.tip || step?.desc || 'Review this action with your insurer.'
        }))
        : []

    const nearbyDoctors = Array.isArray(payload.nearbyDoctors)
        ? payload.nearbyDoctors.map((doctor, index) => ({
            name: doctor?.name || `Specialist ${index + 1}`,
            specialty: doctor?.specialty || 'Specialty not specified',
            dist: doctor?.dist || 'Distance unavailable',
            rating: doctor?.rating ?? 'N/A'
        }))
        : []

    const procedureSteps = Array.isArray(payload.procedureSteps)
        ? payload.procedureSteps.map((step, index) => ({
            title: step?.title || `Phase ${index + 1}`,
            desc: step?.desc || 'Details were not provided by the model.'
        }))
        : []

    return {
        ...payload,
        type: payload?.type || 'analysis',
        treatment: payload?.treatment || 'Treatment analysis',
        coverageStatus: payload?.coverageStatus || 'Coverage details unavailable',
        hospital: payload?.hospital || 'Hospital recommendation unavailable',
        estTotalCost: payload?.estTotalCost || 'N/A',
        yourCost: payload?.yourCost || 'N/A',
        insurancePays: payload?.insurancePays || 'N/A',
        denialRiskValue: Number.isFinite(Number(payload?.denialRiskValue)) ? Number(payload.denialRiskValue) : 0,
        mitigationSteps,
        nearbyDoctors,
        procedureSteps,
        summary: payload?.summary || 'Analysis completed. Please verify details with your provider and insurer.'
    }
}

export default function PreVisit() {
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [uploadedFile, setUploadedFile] = useState(null)
    const [preview, setPreview] = useState(null)
    const [error, setError] = useState('')
    const [isListening, setIsListening] = useState(false)
    const [location, setLocation] = useState(null)
    const [gettingLoc, setGettingLoc] = useState(false)

    const getLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser')
            return
        }
        setGettingLoc(true)
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
                setGettingLoc(false)
            },
            (err) => {
                console.error(err)
                setError('Failed to get location. Please allow access.')
                setGettingLoc(false)
            }
        )
    }
    const [dragOver, setDragOver] = useState(false)
    const fileInputRef = useRef()
    const { insuranceData, setInsuranceData } = useInsurance()

    // Speech Recognition Setup
    const recognitionRef = useRef(null)

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition()
            recognitionRef.current.continuous = false
            recognitionRef.current.interimResults = false
            recognitionRef.current.lang = 'en-US'

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript
                setInput(prev => prev ? `${prev} ${transcript}` : transcript)
                setIsListening(false)
            }

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error)
                setIsListening(false)
                setError('Speech recognition failed. Please try again.')
            }

            recognitionRef.current.onend = () => {
                setIsListening(false)
            }
        }
    }, [])

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop()
        } else {
            setError('')
            recognitionRef.current?.start()
            setIsListening(true)
        }
    }

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

    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result.split(',')[1])
            reader.onerror = reject
            reader.readAsDataURL(file)
        })
    }

    const analyze = async (customQuery = null) => {
        const queryToUse = customQuery || input
        if (!uploadedFile && !queryToUse.trim()) {
            setError('Please upload an insurance card or type a message.')
            return
        }

        setLoading(true)
        setError('')
        setResult(null)

        try {
            if (!GEMINI_KEY) {
                const keyError = new Error('Missing VITE_GEMINI_API_KEY in environment.')
                keyError.status = 401
                throw keyError
            }

            const parts = []

            if (uploadedFile) {
                const base64 = await fileToBase64(uploadedFile)
                parts.push({ inline_data: { mime_type: uploadedFile.type, data: base64 } })
            }

            parts.push({
                text: `You are a "Pre Visit Hospital Assistant". Your ONLY purpose is to help patients prepare for hospital visits by analyzing insurance coverage, naming a nearby hospital, and estimating treatment costs/procedures.
            
            STRICT RULE: If the user's query is UNRELATED to medical insurance, hospital visits, pre-authorization, or surgical/treatment preparation, you MUST politely refuse to answer and state that you are a specialized Hospital Pre-Visit Assistant.
            
            If an insurance card is provided, extract its details (Provider, Plan Name, Member ID, Copay, Deductible).
            
            TASK: Based on the insurance (if provided), the user's query ("${queryToUse}"), and user's location (${location ? `Lat: ${location.lat}, Lng: ${location.lng}` : 'Unknown'}), provide:
            1. Analysis of coverage for the specific treatment mentioned.
            2. A "Nearest Recommended Hospital" (Mock a realistic hospital name near student residential areas like Columbia University or UCLA depending on context, or a general name).
            3. Estimated total cost, "Your Responsibility", and "Insurance Pays" based on plan typicals (HMO/PPO).
            4. Step-by-step procedure breakdown (At least 3 phases: e.g., Preparation, Treatment, Recovery).
            5. Denial Risk Percentage (0-100) and at least 3 specific mitigation steps to overcome that risk.
            6. Suggest at least 3 "Nearby Specialists/Doctors" for this treatment (Mocked realistic names nearby).
            
            Return ONLY valid JSON with no markdown:
            {
              "type": "analysis" | "denial",
              "denialMessage": "Only if unrelated",
              "treatment": "The procedure name",
              "coverageStatus": "Covered / Partially Covered / Pre-auth Required",
              "hospital": "Mocked Hospital Name",
              "estTotalCost": "$X,XXX",
              "yourCost": "$XXX",
              "insurancePays": "$X,XXX",
              "denialRiskValue": 15,
              "mitigationSteps": [
                {"step": "Detailed step", "tip": "Pro tip"}
              ],
              "nearbyDoctors": [
                {"name": "Dr. Name", "specialty": "Specialty", "dist": "0.X miles", "rating": 4.9}
              ],
              "procedureSteps": [
                {"title": "Step title", "desc": "Brief description"}
              ],
              "summary": "4-5 sentence summary for audio readout. Mention the hospital, the doctor, and the key treatment steps."
            }`
            })

            const preferredModel = import.meta.env.VITE_GEMINI_MODEL_PREVISIT || import.meta.env.VITE_GEMINI_MODEL
            const discoveredModels = await listGenerateContentModels(GEMINI_KEY)
            const modelSequence = [...new Set([preferredModel, ...DEFAULT_PREVISIT_MODELS, ...discoveredModels].filter(Boolean))]
            let parsed = null
            let lastError = null
            let sawRateLimit = false

            for (const model of modelSequence) {
                const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`

                try {
                    const res = await fetch(geminiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contents: [{ parts }] })
                    })

                    if (!res.ok) {
                        let details = ''
                        try {
                            const err = await res.json()
                            details = err?.error?.message || JSON.stringify(err)
                        } catch {
                            details = await res.text()
                        }

                        const apiError = new Error(`Gemini API error (${res.status})${details ? `: ${details}` : ''}`)
                        apiError.status = res.status
                        apiError.model = model
                        throw apiError
                    }

                    const data = await res.json()
                    const raw = data?.candidates?.[0]?.content?.parts?.map((part) => part?.text || '').join('').trim()
                    if (!raw) {
                        const emptyError = new Error(`No model output found from ${model}.`)
                        emptyError.status = 502
                        emptyError.model = model
                        throw emptyError
                    }

                    parsed = JSON.parse(cleanModelJson(raw))
                    break
                } catch (modelError) {
                    lastError = modelError
                    if (modelError?.status === 429) sawRateLimit = true
                    if (
                        modelError?.status === 403
                        || modelError?.status === 404
                        || modelError?.status === 429
                        || modelError?.status === 502
                        || modelError instanceof SyntaxError
                    ) {
                        continue
                    }
                    throw modelError
                }
            }

            if (!parsed && sawRateLimit) {
                const rateLimitError = new Error('Gemini rate limit reached for available models.')
                rateLimitError.status = 429
                throw rateLimitError
            }

            if (!parsed) {
                throw lastError || new Error('Pre-visit analysis failed for all configured Gemini models.')
            }

            if (parsed.type === 'denial') {
                setError(parsed.denialMessage || "I'm sorry, I can only assist with hospital pre-visit and insurance related queries.")
                return
            }

            const normalized = normalizeAnalysisPayload(parsed)
            setResult(normalized)

            // If insurance data was extracted, save it to context (optional mapping)
            if (parsed.treatment) {
                // We don't overwrite the full insurance context here unless we want to,
                // but we could map some new data if needed.
            }

            // ElevenLabs Voice Output
            try {
                await speak(normalized.summary)
            } catch (vErr) {
                console.warn('Voice failed:', vErr)
            }

        } catch (err) {
            console.error(err)
            if (err?.status === 401) {
                setError('Missing Gemini API key. Add VITE_GEMINI_API_KEY to .env and restart Vite.')
            } else if (err?.status === 429) {
                setError('Gemini rate limit reached (429). Wait a minute and try again.')
            } else if (err?.status === 403) {
                setError('Gemini access denied (403). Check API key restrictions and enabled model access.')
            } else if (err?.status === 404) {
                setError('No available Gemini model supports generateContent for this API version. Set VITE_GEMINI_MODEL and restart Vite.')
            } else {
                setError('Analysis failed. Please try again.')
            }
        } finally {
            setLoading(false)
        }
    }

    const suggestedPrompts = [
        "Suggest nearby specialists for ligament treatment",
        "How to avoid pre-auth denial for MRI in NYC",
        "Estimated cost for dental surgery coverage",
        "Nearest orthopedic hospital and specialists nearby"
    ]

    return (
        <div className="min-h-screen bg-gray-50 text-slate-900 pb-20">
            <style>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-in { animation: slideIn 0.5s ease-out forwards; }
                .shimmer {
                    background: linear-gradient(90deg, #f1f5f9 25%, #f8fafc 50%, #f1f5f9 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite linear;
                }
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                .glass {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                }
                .blob {
                    position: fixed;
                    width: 500px;
                    height: 500px;
                    background: radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0) 70%);
                    border-radius: 50%;
                    z-index: -1;
                    filter: blur(40px);
                }
            `}</style>

            <div className="blob top-[-10%] left-[-10%] animate-pulse"></div>
            <div className="blob bottom-[-10%] right-[-10%] delay-1000 animate-pulse" style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0) 70%)' }}></div>

            <div className="max-w-4xl mx-auto px-6 py-12">

                {/* Header */}
                <div className="mb-12 text-center relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-100/30 rounded-full blur-3xl -z-10"></div>
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-900 to-blue-900 text-white rounded-full px-5 py-2 mb-6 text-[10px] font-bold tracking-[0.2em] uppercase shadow-lg shadow-blue-200/50">
                        <Activity className="w-3 h-3 text-blue-300 animate-pulse" />
                        Hospital Pre-Visit Assistant
                    </div>
                    <h1 className="syne text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] drop-shadow-sm">
                        Prepare for Your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Hospital Visit</span>
                    </h1>
                    <p className="text-slate-500 mt-8 text-xl max-w-2xl mx-auto leading-relaxed font-medium">
                        Upload your insurance, talk to our AI assistant, and get a clear breakdown of costs,
                        coverage, and nearby facilities before you step into the hospital.
                    </p>
                </div>

                {/* Main Interaction Area */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

                    {/* Left: Inputs */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Insurance Dropzone */}
                        <div
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center p-10 transition-all duration-500 cursor-pointer glass
                                ${dragOver ? 'border-blue-500 bg-blue-50/50 scale-[1.02] shadow-2xl shadow-blue-200/50' :
                                    uploadedFile ? 'border-emerald-300 bg-emerald-50/50' :
                                        'border-slate-200 shadow-xl shadow-slate-200/40 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-100/50'}
                            `}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,.pdf"
                                className="hidden"
                                onChange={(e) => handleFile(e.target.files[0])}
                            />

                            {uploadedFile ? (
                                <div className="text-center">
                                    {preview ? (
                                        <div className="relative group">
                                            <img src={preview} className="h-32 mx-auto rounded-2xl object-contain mb-4 shadow-xl transition-transform group-hover:scale-110" alt="Preview" />
                                            <div className="absolute inset-0 bg-emerald-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        </div>
                                    ) : (
                                        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-[2rem] flex items-center justify-center text-4xl mb-4 shadow-inner">📄</div>
                                    )}
                                    <p className="text-slate-900 font-extrabold text-sm truncate max-w-[180px]">{uploadedFile.name}</p>
                                    <div className="mt-2 flex items-center justify-center gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                        <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest">Ready for analysis</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="w-20 h-20 bg-slate-50/50 rounded-[2rem] flex items-center justify-center mb-5 shadow-inner group-hover:bg-blue-50 transition-colors">
                                        <Plus className="w-10 h-10 text-slate-300 group-hover:text-blue-400 transition-colors" />
                                    </div>
                                    <p className="text-slate-900 font-extrabold text-base">Upload Insurance</p>
                                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-2">JPG, PNG, WEBP or PDF</p>
                                </>
                            )}
                        </div>

                        {/* Text Input with Mic */}
                        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-xl shadow-slate-200/30 relative">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 mb-3 block">How can I help you today?</label>

                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className="w-full h-32 bg-slate-50 border-none rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none placeholder:text-slate-300"
                                placeholder="Ask about ligament treatments, costs, or pre-auth risks..."
                            />

                            <div className="absolute right-6 bottom-6 flex gap-3">
                                <button
                                    onClick={getLocation}
                                    disabled={gettingLoc}
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg
                                        ${location ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 hover:text-blue-600 border border-slate-100'}
                                    `}
                                    title={location ? "Location Saved" : "Pin My Location"}
                                >
                                    {gettingLoc ? (
                                        <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                                    ) : (
                                        <Navigation className={`w-5 h-5 ${location ? 'fill-white/20' : ''}`} />
                                    )}
                                </button>
                                <button
                                    onClick={toggleListening}
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg
                                        ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-900 text-white hover:bg-blue-600'}
                                    `}
                                >
                                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3 items-center text-rose-600 text-xs font-medium animate-in">
                                <ShieldAlert className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <button
                            onClick={() => analyze()}
                            disabled={loading}
                            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    Analyzing...
                                </>
                            ) : (
                                <>Verify & Analyze <ArrowRight className="w-4 h-4" /></>
                            )}
                        </button>

                        {/* Suggested Prompts */}
                        <div className="space-y-2">
                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1 mb-3">Quick Prompts</p>
                            <div className="flex flex-col gap-2">
                                {suggestedPrompts.map((p, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { setInput(p); analyze(p); }}
                                        className="text-left bg-white border border-slate-100 rounded-xl px-4 py-3 text-[11px] font-medium text-slate-600 hover:border-blue-200 hover:text-blue-600 transition-all"
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Right: Results Panel */}
                    <div className="lg:col-span-3">

                        {!result && !loading && (
                            <div className="h-full min-h-[500px] border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-center p-12 opacity-40">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                    <Sparkles className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="syne text-xl font-bold text-slate-500">Awaiting your query</h3>
                                <p className="text-slate-400 text-xs mt-3 max-w-xs leading-relaxed">
                                    Upload your card or use the microphone to start your pre-hospital preparation.
                                </p>
                            </div>
                        )}

                        {loading && (
                            <div className="space-y-6">
                                <div className="h-48 rounded-[3rem] shimmer"></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="h-32 rounded-[2rem] shimmer"></div>
                                    <div className="h-32 rounded-[2rem] shimmer"></div>
                                </div>
                                <div className="h-64 rounded-[3rem] shimmer"></div>
                            </div>
                        )}

                        {result && !loading && (
                            <div className="space-y-6 animate-in">

                                {/* 1. Hero Analysis Card */}
                                <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-2xl shadow-slate-200/40 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 opacity-50"></div>

                                    <div className="relative z-10 flex justify-between items-start">
                                        <div>
                                            <div className="inline-flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-[10px] font-bold uppercase mb-4">
                                                <ShieldCheck className="w-3 h-3" />
                                                Verified Assessment
                                            </div>
                                            <h2 className="syne text-4xl font-extrabold text-slate-900 leading-tight">
                                                {result.treatment}
                                            </h2>
                                            <p className={`text-sm font-bold mt-2 ${result.coverageStatus?.includes('Covered') ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                {result.coverageStatus}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => speak(result.summary)}
                                            className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-blue-600 transition-all"
                                        >
                                            <Volume2 className="w-6 h-6" />
                                        </button>
                                    </div>

                                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                        <div className="bg-slate-50 p-6 rounded-3xl group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all border border-transparent hover:border-blue-100">
                                            <div className="flex items-center gap-4 mb-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                                    <MapPin className="w-5 h-5" />
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Recommended Hospital</p>
                                            </div>
                                            <p className="text-slate-900 font-extrabold text-lg truncate">{result.hospital}</p>
                                            <div className="mt-4 flex gap-2">
                                                <button className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold">Directions</button>
                                                <button className="bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-[10px] font-bold">Details</button>
                                            </div>
                                        </div>

                                        <div className="bg-slate-900 p-8 rounded-3xl text-white relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-700"></div>
                                            <div className="relative z-10">
                                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-4">Total Treatment Estimate</p>
                                                <h3 className="syne text-3xl font-extrabold">{result.estTotalCost}</h3>
                                                <p className="text-blue-100/50 text-[10px] mt-4 font-medium flex items-center gap-2">
                                                    <Info className="w-3 h-3" />
                                                    Includes anesthesia, facility & professional fees
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Risk & Financial Charts */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Denial Risk Gauge */}
                                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                                        <h3 className="syne text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Denial Risk Meter</h3>
                                        <div className="relative w-40 h-40">
                                            <svg className="w-full h-full transform -rotate-90">
                                                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-50" />
                                                <circle
                                                    cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent"
                                                    strokeDasharray={440}
                                                    strokeDashoffset={440 - (440 * (parseInt(result.denialRiskValue) || 0)) / 100}
                                                    strokeLinecap="round"
                                                    className={`transition-all duration-1000 ${parseInt(result.denialRiskValue) < 20 ? 'text-emerald-500' :
                                                        parseInt(result.denialRiskValue) < 50 ? 'text-amber-500' : 'text-rose-500'
                                                        }`}
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="syne text-3xl font-extrabold text-slate-900">{result.denialRiskValue}%</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Probability</span>
                                            </div>
                                        </div>
                                        <p className="text-slate-500 text-[10px] mt-6 font-medium leading-relaxed italic max-w-[200px]">
                                            Analysis based on common {result.treatment} CPT code denials for this insurer.
                                        </p>
                                    </div>

                                    {/* Financial Comparison */}
                                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                                        <h3 className="syne text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Cost Breakdown</h3>
                                        <div className="space-y-6">
                                            {/* Insurance Portion */}
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[10px] font-bold text-slate-600 uppercase">Insurance Coverage</span>
                                                    <span className="text-emerald-600 font-extrabold text-xs">{result.insurancePays}</span>
                                                </div>
                                                <div className="h-3 bg-slate-50 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '70%' }}></div>
                                                </div>
                                            </div>
                                            {/* Your Portion */}
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[10px] font-bold text-slate-600 uppercase">Your Responsibility</span>
                                                    <span className="text-blue-600 font-extrabold text-xs">{result.yourCost}</span>
                                                </div>
                                                <div className="h-3 bg-slate-50 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-600 rounded-full" style={{ width: '30%' }}></div>
                                                </div>
                                            </div>
                                            <div className="pt-4 border-t border-slate-50 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                                                    <CreditCard className="w-4 h-4 text-orange-400" />
                                                </div>
                                                <p className="text-slate-400 text-[10px] leading-tight font-medium">
                                                    Deductible status applies. Costs show typical member liability.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Mitigation Action Plan */}
                                <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm overflow-hidden relative">
                                    <div className="flex items-center gap-4 mb-10">
                                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
                                            <ShieldAlert className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="syne text-2xl font-extrabold text-slate-900">Mitigation Action Plan</h3>
                                            <p className="text-slate-400 text-xs font-medium">Steps to ensure coverage approval</p>
                                        </div>
                                    </div>

                                    <div className="space-y-8 relative">
                                        <div className="absolute left-[23px] top-2 bottom-2 w-px bg-slate-100"></div>
                                        {result.mitigationSteps?.map((step, i) => (
                                            <div key={i} className="flex gap-6 relative z-10 group">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110
                                                    ${i === 0 ? 'bg-blue-600 text-white' :
                                                        i === 1 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'}
                                                `}>
                                                    {i === 0 ? <Activity className="w-5 h-5" /> :
                                                        i === 1 ? <Plus className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                                                </div>
                                                <div className="flex-1 pt-1">
                                                    <h4 className="text-slate-900 font-extrabold text-sm mb-1">{step.step}</h4>
                                                    <p className="text-slate-500 text-xs leading-relaxed max-w-md">{step.tip}</p>
                                                </div>
                                                <div className="hidden md:flex flex-col items-end pt-1">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Priority</span>
                                                    <span className={`text-[10px] font-bold mt-1 ${i === 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                                                        {i === 0 ? 'CRITICAL' : 'HIGH'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 4. Nearby Doctor Suggestions */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <h3 className="syne text-sm font-bold text-slate-400 uppercase tracking-widest">Nearby Specialists</h3>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                                            <MapPin className="w-3 h-3" />
                                            {location ? "Based on your location" : "NYC Area (Default)"}
                                        </div>
                                    </div>
                                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                                        {result.nearbyDoctors?.map((doc, i) => (
                                            <div key={i} className="min-w-[280px] bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-bold group-hover:bg-blue-600 transition-colors">
                                                        {doc.name.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                    <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-lg text-[10px] font-black">
                                                        <Star className="w-3 h-3 fill-amber-600" />
                                                        {doc.rating}
                                                    </div>
                                                </div>
                                                <h4 className="text-slate-900 font-extrabold text-sm mb-1">{doc.name}</h4>
                                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-4">{doc.specialty}</p>
                                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                                    <div className="flex items-center gap-2 text-slate-500 text-[10px] font-medium">
                                                        <Navigation className="w-3 h-3" />
                                                        {doc.dist} away
                                                    </div>
                                                    <button className="text-blue-600 font-bold text-[10px] hover:underline flex items-center gap-1">
                                                        Book Visit <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 5. Treatment Roadmap */}
                                <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-4 mb-10">
                                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-blue-400">
                                                <Activity className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="syne text-2xl font-extrabold">Treatment Roadmap</h3>
                                                <p className="text-blue-200/50 text-[10px] font-bold uppercase tracking-widest">Procedural Step-by-Step</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                                            {/* Horizontal Desktop Line */}
                                            <div className="hidden md:block absolute top-[23px] left-12 right-12 h-px bg-white/10"></div>

                                            {result.procedureSteps?.map((step, i) => (
                                                <div key={i} className="relative z-10 group">
                                                    <div className="flex flex-col items-center md:items-start text-center md:text-left">
                                                        <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:border-blue-500 transition-all duration-500">
                                                            <span className="syne font-black text-sm">{i + 1}</span>
                                                        </div>
                                                        <h4 className="text-white font-extrabold text-sm mb-2 uppercase tracking-wide">{step.title}</h4>
                                                        <p className="text-blue-100/40 text-[10px] leading-relaxed font-medium">
                                                            {step.desc}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* AI Disclaimer */}
                                <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100 flex items-start gap-4 opacity-70">
                                    <Sparkles className="w-6 h-6 text-blue-400 shrink-0" />
                                    <div>
                                        <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest mb-1">AI Health Assistant Disclaimer</p>
                                        <p className="text-slate-500 text-[10px] leading-relaxed">
                                            Estimates are based on general historical data and extracted insurance details.
                                            Always confirm with your facility and insurer for exact billing and coverage.
                                        </p>
                                    </div>
                                </div>

                            </div>
                        )}

                    </div>

                </div>

            </div>
        </div>
    )
}
