import { useState, useRef, useCallback } from 'react'
import { speak } from '../api/elevenlabs'
import { mockDenialCodes } from '../data/mockData'
import { FileSearch, ShieldAlert, CheckCircle, Copy, AlertTriangle, UploadCloud } from 'lucide-react'

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash'
const GEMINI_VISION_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`

async function analyzeEOBImage(base64Data, mimeType) {
    const parts = [
        { inline_data: { mime_type: mimeType, data: base64Data } },
        {
            text: `You are a medical billing expert and claims analyst. Extract the following from this Explanation of Benefits (EOB) or medical bill in a structured format:
1. The primary Denial Code or Reason Code (e.g. CO-50, CO-97, PR-1, etc.). Look for Remark Codes. If the bill looks normal and paid, return null for denialCode. If you can't find a code but it looks denied, infer a standard code like CO-50.
2. The total Billed Amount (just the number).
3. The Insurance Paid amount (just the number).
4. The Patient Responsibility amount (just the number).
5. The Provider or Hospital Name.
6. The Date of Service.
7. Line Items: Extract each individual service line from the EOB. 
    CRITICAL: You MUST return a populated "lineItems" array. If the bill only has a 'Total' summary and no itemization, you MUST create at least one line item representing the primary service using the Total amounts.
    For each line item (MUST use exact camelCase key names):
    - "cptCode": Identify the CPT/HCPCS code (if visible, otherwise guess a reasonable code based on the Provider/Service Date context).
    - "jargonDescription": Translate the medical jargon of that service into a plain-English "patient friendly" description.
    - "plainEnglishTranslation": Further simplify the description.
    - "billedCharge": Extract the Billed Charge for that line.
    - "networkDiscount": Extract the Network Discount/Adjustment for that line (default to 0.00 if missing).
    - "allowedAmount": Extract the Allowed Amount for that line (default to 0.00 if missing).
    - "patientResponsibility": Extract the Copay/Coinsurance/Deductible for that line (default to 0.00 if missing).

Return ONLY valid JSON with no markdown, no backticks, no explanation:
{
  "denialCode": "CO-97",
  "billedAmount": "1500.00",
  "insurancePaid": "800.00",
  "patientResponsibility": "700.00",
  "provider": "Hospital Name",
  "date": "MM/DD/YYYY",
  "lineItems": [
    {
      "cptCode": "99213",
      "jargonDescription": "Office/outpatient visit est",
      "plainEnglishTranslation": "Standard doctor's office visit (Moderate length)",
      "billedCharge": "250.00",
      "networkDiscount": "100.00",
      "allowedAmount": "150.00",
      "patientResponsibility": "150.00"
    }
  ]
}`
        }
    ]

    const res = await fetch(GEMINI_VISION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }] })
    })

    if (!res.ok) {
        const errData = await res.json()
        console.error('Gemini error:', errData)
        if (res.status === 429) {
            throw new Error("API Rate limit exceeded. The free tier of Gemini AI allows limited requests per minute. Please wait a moment and try again.")
        }
        throw new Error(`API error: ${res.status} - ${errData?.error?.message || 'Unknown Error'}`)
    }

    const data = await res.json()
    if (!data.candidates || data.candidates.length === 0) {
        throw new Error('Analysis failed. The AI returned an empty response. Please try again.')
    }
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
    const [loading, setLoading] = useState(false)
    const [dragOver, setDragOver] = useState(false)
    const [uploadedFile, setUploadedFile] = useState(null)
    const [preview, setPreview] = useState(null)
    const [error, setError] = useState('')
    const fileInputRef = useRef()

    const [eobResult, setEOBResult] = useState(null)
    const [copied, setCopied] = useState(false)

    const handleFile = useCallback((file) => {
        if (!file) return
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
        if (!allowed.includes(file.type)) {
            setError('Please upload a JPG, PNG, WEBP, or PDF file.')
            return
        }
        setUploadedFile(file)
        setError('')
        setEOBResult(null)
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

    const handleAnalyzeUpload = async () => {
        if (!uploadedFile) {
            setError('Please upload an EOB or medical bill first.')
            return
        }
        setLoading(true)
        setError('')
        setEOBResult(null)

        try {
            const base64 = await fileToBase64(uploadedFile)
            const mimeType = uploadedFile.type

            const raw = await analyzeEOBImage(base64, mimeType)
            const cleaned = raw.replace(/```json|```/g, '').trim()
            let parsed;
            try {
                parsed = JSON.parse(cleaned)
                console.log('✅ Gemini Extracted JSON:', parsed)
            } catch (e) {
                console.error("Failed to parse JSON string:", cleaned)
                throw new Error("AI returned invalid data format. Please try again.")
            }

            // Match extracted code with our intelligence database
            let intelligence = null;
            if (parsed.denialCode) {
                // Remove spaces and uppercase just in case
                const cleanCode = parsed.denialCode.replace(/\s+/g, '').toUpperCase();
                intelligence = mockDenialCodes.find(d => d.code === cleanCode)

                // Fallback intelligence if code not in our mock DB
                if (!intelligence) {
                    intelligence = mockDenialCodes[0] // Default to CO-50 logic for demo
                    parsed.denialCode = intelligence.code // override to match for UI
                }
            }

            const finalResult = {
                ...parsed,
                intelligence
            }

            setEOBResult(finalResult)

            try {
                if (intelligence) {
                    await speak(`This claim was denied for ${intelligence.reason}. You have a ${intelligence.successProbability} percent chance of winning an appeal.`)
                } else if (parsed.patientResponsibility && parseFloat(parsed.patientResponsibility) > 0) {
                    await speak(`This claim was processed. Your patient responsibility is $${parsed.patientResponsibility}.`)
                } else {
                    await speak(`This claim appears to be fully covered or paid.`)
                }
            } catch (voiceErr) {
                console.warn('Voice readout failed:', voiceErr)
            }

        } catch (e) {
            console.error('Analysis error:', e)
            setError(e.message || 'Failed to analyze the document. Please try again.')
        }

        setLoading(false)
    }

    const handleCopyAppeal = () => {
        if (eobResult?.intelligence?.appealTemplate) {
            navigator.clipboard.writeText(eobResult.intelligence.appealTemplate)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 text-slate-900 pb-20">
            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fade-up { animation: fadeUp 0.4s ease-out forwards; }
                .fade-up-1 { animation: fadeUp 0.4s ease-out forwards; animation-delay: 0.1s; opacity: 0; }
                .fade-up-2 { animation: fadeUp 0.4s ease-out forwards; animation-delay: 0.2s; opacity: 0; }
                
                .shimmer {
                    background: linear-gradient(90deg, #f1f5f9 25%, #f8fafc 50%, #f1f5f9 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite linear;
                }
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
            `}</style>

            <div className="max-w-5xl mx-auto px-6 py-12">

                {/* Header */}
                <div className="mb-12 text-center">
                    <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-full px-4 py-1.5 mb-6">
                        <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                        <span className="text-rose-600 text-[10px] font-bold tracking-widest uppercase">Phase 2: Post-Visit Recovery</span>
                    </div>
                    <h1 className="syne text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                        Claims Analyst <br />
                        <span className="text-rose-600">& Denial Intelligence</span>
                    </h1>
                    <p className="text-slate-500 mt-6 text-lg max-w-2xl mx-auto leading-relaxed">
                        Upload your confusing Explanation of Benefits (EOB) or denied hospital bill. The AI will extract the specific denial codes, calculate your appeal success rate, and immediately generate a legal appeal letter to fight for your coverage.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start fade-up">
                    {/* Left: Input Selection */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                            <h3 className="syne font-bold text-lg mb-4 flex items-center gap-2">
                                <FileSearch size={20} className="text-rose-500" />
                                Upload EOB or Bill
                            </h3>

                            {/* Upload Zone */}
                            <div
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`relative rounded-3xl border-2 border-dashed cursor-pointer transition-all duration-300 p-8 text-center
                                    ${dragOver
                                        ? 'border-rose-400 bg-rose-50 scale-[1.02]'
                                        : uploadedFile
                                            ? 'border-green-200 bg-green-50/50'
                                            : 'border-slate-200 hover:border-rose-300 bg-slate-50 shadow-inner hover:shadow-md'
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
                                                <img src={preview} alt="EOB Document" className="h-40 mx-auto rounded-2xl object-cover border border-slate-100 shadow-sm" />
                                                <div className="absolute -top-2 -right-2 bg-green-500 text-white p-1 rounded-full shadow-lg">
                                                    <CheckCircle size={16} />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-20 h-20 mx-auto bg-rose-50 rounded-2xl flex items-center justify-center text-3xl">
                                                📄
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-slate-900 font-bold text-sm truncate px-4">{uploadedFile.name}</p>
                                            <p className="text-rose-500 text-xs font-semibold mt-1">Ready for extraction</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="w-16 h-16 mx-auto bg-white rounded-2xl flex items-center justify-center text-rose-300 shadow-sm border border-slate-100">
                                            <UploadCloud size={32} />
                                        </div>
                                        <div>
                                            <p className="text-slate-900 font-bold">Drop EOB Document here</p>
                                            <p className="text-slate-400 text-xs mt-2 leading-relaxed max-w-[200px] mx-auto">Supports clear photos (JPG, PNG) or downloaded PDFs spanning multiple pages.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div className="mt-4 bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-100 flex items-start gap-2">
                                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}

                        </div>

                        <button
                            onClick={handleAnalyzeUpload}
                            disabled={!uploadedFile || loading}
                            className="w-full py-5 rounded-2xl font-bold text-sm tracking-wide transition-all duration-300
                                bg-slate-900 text-white hover:bg-rose-500 shadow-lg hover:shadow-rose-200
                                disabled:opacity-20 disabled:cursor-not-allowed
                                flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Extracting Intelligence...
                                </>
                            ) : (
                                'Extract Denial Intelligence'
                            )}
                        </button>
                    </div>

                    {/* Right: Results */}
                    <div className="lg:col-span-3">
                        {!eobResult && !loading && (
                            <div className="h-full min-h-[400px] border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-12 opacity-50">
                                <FileSearch size={64} className="mb-6 text-rose-500" />
                                <h3 className="syne text-xl font-bold text-slate-400">Claim Analysis</h3>
                                <p className="text-slate-400 text-sm mt-2 max-w-xs">Upload an EOB and run extraction to detect billing errors and generate appeals.</p>
                            </div>
                        )}

                        {loading && (
                            <div className="space-y-6">
                                <div className="h-32 rounded-[1.5rem] shimmer"></div>
                                <div className="h-64 rounded-[2rem] shimmer"></div>
                            </div>
                        )}

                        {eobResult && !loading && (
                            <div className="space-y-6 fade-up">
                                {/* Record Meta */}
                                <div className="flex justify-between items-center px-2">
                                    <p className="text-xs font-bold text-slate-500">{eobResult.provider}</p>
                                    <p className="text-xs font-bold text-slate-400">Service Date: {eobResult.date}</p>
                                </div>

                                {/* Financial Summary */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-200 text-center flex flex-col justify-center">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Total Billed</p>
                                        <p className="syne text-xl font-extrabold text-slate-800">${eobResult.billedAmount || '0.00'}</p>
                                    </div>
                                    <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-200 text-center flex flex-col justify-center">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Insurance Paid</p>
                                        <p className="syne text-xl font-extrabold text-slate-800">${eobResult.insurancePaid || '0.00'}</p>
                                    </div>
                                    <div className="bg-red-50 rounded-[1.5rem] p-6 border-2 border-red-200 text-center relative overflow-hidden group flex flex-col justify-center">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700"></div>
                                        <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-2 relative z-10">Your Responsibility</p>
                                        <p className="syne text-xl font-black text-red-700 relative z-10">${eobResult.patientResponsibility || '0.00'}</p>
                                    </div>
                                </div>

                                {/* Line Items Breakdown */}
                                {eobResult.lineItems && eobResult.lineItems.length > 0 && (
                                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 fade-up-1">
                                        <h3 className="syne font-bold text-lg mb-4 flex items-center gap-2">
                                            📄 Line Item Breakdown
                                        </h3>
                                        <div className="space-y-4">
                                            {eobResult.lineItems.map((line, i) => (
                                                <div key={i} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors relative">
                                                    {/* Header & Descriptions */}
                                                    <div className="flex items-start gap-4 mb-4">
                                                        <span className="text-xs font-bold tracking-widest uppercase bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full shrink-0 mt-0.5">
                                                            CPT {line.cptCode || 'UNKNOWN'}
                                                        </span>
                                                        <h4 className="font-bold text-slate-900 text-lg leading-snug">{line.jargonDescription || 'Service Description Missing'}</h4>
                                                    </div>

                                                    <div className="bg-white px-5 py-4 rounded-xl border border-blue-100 mb-5 relative top-1">
                                                        <span className="text-[10px] font-bold text-blue-500 uppercase block mb-1.5 tracking-wider">Patient Explanation (Plain English)</span>
                                                        <p className="text-sm font-medium text-slate-700 leading-relaxed">
                                                            {line.plainEnglishTranslation || 'Translation missing.'}
                                                        </p>
                                                    </div>

                                                    {/* Financial Grid */}
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-center">
                                                            <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Billed Charge</p>
                                                            <p className="font-bold text-slate-900">${line.billedCharge || '0.00'}</p>
                                                        </div>
                                                        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-center">
                                                            <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Network Discount</p>
                                                            <p className="font-bold text-slate-900">-${line.networkDiscount || '0.00'}</p>
                                                        </div>
                                                        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 shadow-sm text-center">
                                                            <p className="text-[10px] uppercase font-bold text-emerald-600 mb-1">Allowed Amount</p>
                                                            <p className="font-bold text-emerald-700">${line.allowedAmount || '0.00'}</p>
                                                        </div>
                                                        <div className="bg-red-50 p-3 rounded-xl border border-red-200 shadow-sm text-center relative overflow-hidden">
                                                            <div className="absolute top-0 right-0 w-8 h-8 bg-red-500/10 rounded-full -mr-4 -mt-4"></div>
                                                            <p className="text-[10px] uppercase font-bold text-red-600 mb-1 relative z-10">You Pay</p>
                                                            <p className="font-black text-red-700 relative z-10">${line.patientResponsibility || '0.00'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Intelligence Engine output */}
                                {eobResult.intelligence ? (
                                    <>
                                        <div className="bg-amber-50 rounded-[2rem] p-8 border border-amber-200 fade-up-2 shadow-sm">
                                            <div className="flex flex-col sm:flex-row sm:items-start gap-5 mb-8">
                                                <div className="p-3.5 bg-amber-100 text-amber-600 rounded-2xl shadow-sm shrink-0 inline-flex">
                                                    <ShieldAlert size={32} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs uppercase font-bold text-amber-600 tracking-wider mb-2">Denial Reason Detected: {eobResult.denialCode}</p>
                                                    <h3 className="syne text-2xl font-bold text-slate-900 leading-snug">{eobResult.intelligence.reason}</h3>
                                                </div>
                                            </div>

                                            <div className="bg-white rounded-2xl p-6 border border-amber-100 mb-8 shadow-sm">
                                                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                                    {eobResult.intelligence.explanation}
                                                </p>

                                                {(eobResult.denialCode === 'CO-97' || eobResult.denialCode === 'CO-16') && (
                                                    <div className="mt-4 flex items-start gap-3 p-3 bg-purple-50 text-purple-700 rounded-lg text-sm border border-purple-100">
                                                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                                        <p><strong>Coding Error Detected:</strong> This is frequently caused by a provider missing a modifier code or submitting an invalid claim. This is an administrative error, not an actual lack of coverage constraint.</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="flex-1">
                                                    <div className="flex justify-between text-sm font-bold text-slate-900 mb-2">
                                                        <span>Appeal Success Probability</span>
                                                        <span className={eobResult.intelligence.successProbability > 50 ? 'text-green-600' : 'text-amber-600'}>{eobResult.intelligence.successProbability}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-1000 ${eobResult.intelligence.successProbability > 50 ? 'bg-green-500' : 'bg-amber-500'}`}
                                                            style={{ width: `${eobResult.intelligence.successProbability}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                                <div className="text-center px-4 border-l border-amber-200">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Deadline</p>
                                                    <p className="font-bold text-slate-900">{eobResult.intelligence.deadlineDays} Days</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Appeal Generator */}
                                        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm fade-up-2">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="syne font-bold text-xl flex items-center gap-2">
                                                    📝 AI Appeal Letter
                                                </h3>
                                                <button
                                                    onClick={handleCopyAppeal}
                                                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 hover:text-blue-600 rounded-xl text-sm font-bold transition-colors"
                                                >
                                                    {copied ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
                                                    {copied ? 'Copied' : 'Copy Text'}
                                                </button>
                                            </div>
                                            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 relative group">
                                                <div className="absolute top-4 right-4 text-slate-200 group-hover:text-blue-200 transition-colors">
                                                    <Copy size={64} className="opacity-20" />
                                                </div>
                                                <pre className="text-sm text-slate-600 font-sans whitespace-pre-wrap leading-relaxed relative z-10">
                                                    {eobResult.intelligence.appealTemplate}
                                                </pre>
                                            </div>
                                            <div className="mt-6">
                                                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Required Attachments:</p>
                                                <ul className="flex flex-wrap gap-2">
                                                    {eobResult.intelligence.requiredDocuments.map((doc, i) => (
                                                        <li key={i} className="text-xs font-medium bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm">
                                                            📎 {doc}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="bg-green-50 rounded-[2rem] p-8 border border-green-200 flex items-center justify-center min-h-[140px] fade-up-1">
                                        <div className="text-center">
                                            <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
                                            <h3 className="syne text-xl font-bold text-slate-900 mb-1">Claim Processed Normal</h3>
                                            <p className="text-slate-600 text-sm max-w-sm mx-auto leading-relaxed">This EOB shows no denial flags or remark codes. Your balance is correct based on your plan benefits.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}