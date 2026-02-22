import { useMemo, useRef, useState } from 'react'
import {
    Calendar, MapPin, Users, Phone, Share2, Trash2, Plus, X, Search, Activity,
    Heart, ShieldCheck, Zap, Globe
} from 'lucide-react'
import { donateSol, getDonationAddress, getSolanaCluster } from '../api/solana'

const CATEGORIES = [
    { id: 'all', label: '✦ All Events', color: 'blue' },
    { id: 'blood', label: '🩸 Blood Donation', color: 'rose' },
    { id: 'eye', label: '👁 Eye Checkup', color: 'blue' },
    { id: 'dental', label: '🦷 Dental', color: 'teal' },
    { id: 'cancer', label: '🎗 Cancer Screening', color: 'pink' },
    { id: 'mental', label: '🧠 Mental Health', color: 'purple' },
    { id: 'diabetes', label: '💉 Diabetes', color: 'orange' },
    { id: 'general', label: '🏥 General Health', color: 'emerald' },
]

const CATEGORY_COLORS = {
    blood: 'bg-rose-50 text-rose-600 border-rose-100',
    eye: 'bg-blue-50 text-blue-600 border-blue-100',
    dental: 'bg-teal-50 text-teal-600 border-teal-100',
    cancer: 'bg-pink-50 text-pink-600 border-pink-100',
    mental: 'bg-purple-50 text-purple-600 border-purple-100',
    diabetes: 'bg-orange-50 text-orange-600 border-orange-100',
    general: 'bg-emerald-50 text-emerald-600 border-emerald-100',
}

const SEED_EVENTS = [
    {
        id: 1,
        title: 'Free Blood Donation Drive',
        description: 'Join us for our monthly blood donation camp. All blood types needed. Refreshments provided. Every donation saves up to 3 lives.',
        category: 'blood',
        location: 'City Community Center, Main St',
        date: '2026-03-05',
        time: '9:00 AM – 4:00 PM',
        organizer: 'Red Cross Chapter',
        spots: '200 spots available',
        image: 'https://images.unsplash.com/photo-1615461066870-40c144002701?auto=format&fit=crop&w=800&q=80',
        postedAt: '2026-02-20',
        contact: '555-0101',
    },
    {
        id: 2,
        title: 'Free Eye Checkup Camp',
        description: 'Get a comprehensive eye examination at no cost. Free glasses for those in need. Experienced ophthalmologists on site.',
        category: 'eye',
        location: 'Sunrise Mall, Parking Lot B',
        date: '2026-03-12',
        time: '10:00 AM – 6:00 PM',
        organizer: 'Vision Care Foundation',
        spots: '150 spots available',
        image: 'https://images.unsplash.com/photo-1576091160550-217359f42f8c?auto=format&fit=crop&w=800&q=80',
        postedAt: '2026-02-19',
        contact: '555-0202',
    },
    {
        id: 3,
        title: 'Mental Health Awareness Walk',
        description: 'Free counseling sessions, stress management workshops, and community support groups. Break the stigma together.',
        category: 'mental',
        location: 'Riverside Park, Pavilion 3',
        date: '2026-03-18',
        time: '8:00 AM – 1:00 PM',
        organizer: 'Mind Matters NGO',
        spots: 'Open to all',
        image: 'https://images.unsplash.com/photo-1527137342181-19aab11a8ee1?auto=format&fit=crop&w=800&q=80',
        postedAt: '2026-02-18',
        contact: '555-0303',
    },
]

const DONATION_TIERS = [
    { amount: '$15', sol: '0.06', label: 'Diagnostic Aid', icon: '🧪', desc: 'Covers essential lab tests for one student' },
    { amount: '$45', sol: '0.18', label: 'Recovery Hero', icon: '🩹', desc: 'Supports prescription and follow-up costs', popular: true },
    { amount: '$150', sol: '0.60', label: 'Surgical Support', icon: '🏥', desc: 'Contributes to major emergency procedures' }
]
const DONATION_HISTORY_KEY = 'careless_solana_donations'

function txExplorerUrl(signature) {
    const cluster = getSolanaCluster()
    const clusterSuffix = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`
    return `https://solscan.io/tx/${signature}${clusterSuffix}`
}

function formatFeedTimestamp(dateText) {
    const date = new Date(dateText)
    if (Number.isNaN(date.getTime())) return 'Unknown time'
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function DonorCountCard({ donorCount }) {
    return (
        <div className="mx-auto mt-8 max-w-md rounded-3xl border border-rose-200 bg-white px-6 py-5 shadow-xl shadow-rose-100/40">
            <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500">Community Impact</p>
            <div className="mt-2 flex items-end justify-between">
                <div>
                    <p className="syne text-4xl font-extrabold text-slate-900">{donorCount}</p>
                    <p className="text-sm font-semibold text-slate-500">people donated so far</p>
                </div>
                <div className="rounded-2xl bg-rose-50 p-3">
                    <Users className="h-5 w-5 text-rose-500" />
                </div>
            </div>
        </div>
    )
}

function EventCard({ event, onDelete, isOwner }) {
    const [expanded, setExpanded] = useState(false)
    const [imageFailed, setImageFailed] = useState(false)
    const catClass = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.general
    const catLabel = CATEGORIES.find(c => c.id === event.category)?.label || '🏥 General Health'
    const eventDate = new Date(event.date)
    const isPast = eventDate < new Date()
    const hasImage = Boolean(event.image) && !imageFailed

    return (
        <div className={`group bg-white rounded-[2.5rem] border overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1
      ${isPast ? 'border-slate-100 opacity-60' : 'border-slate-100 shadow-xl shadow-slate-200/30'}`}>

            {/* Image */}
            <div className="relative aspect-[21/9] overflow-hidden">
                {hasImage ? (
                    <img
                        src={event.image}
                        alt={event.title}
                        onError={() => setImageFailed(true)}
                        className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-6 flex items-end">
                        <div className="rounded-2xl bg-white/90 px-4 py-3 shadow-lg">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Community Event</p>
                            <p className="syne text-lg font-extrabold text-slate-900 line-clamp-2">{event.title}</p>
                        </div>
                    </div>
                )}
                {isPast && (
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold bg-slate-900/80 px-3 py-1.5 rounded-full uppercase tracking-widest">Event Ended</span>
                    </div>
                )}
            </div>

            <div className="p-8">
                {/* Top row */}
                <div className="flex items-start justify-between gap-3 mb-6">
                    <div className="flex-1">
                        <span className={`inline-block text-[10px] font-bold border rounded-full px-3 py-1 mb-4 uppercase tracking-widest ${catClass}`}>
                            {catLabel}
                        </span>
                        <h3 className="syne text-2xl font-extrabold text-slate-900 leading-tight group-hover:text-emerald-600 transition-colors">{event.title}</h3>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">by {event.organizer}</p>
                    </div>
                </div>

                {/* Description */}
                <p className={`text-slate-500 text-sm leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
                    {event.description}
                </p>
                {event.description.length > 100 && (
                    <button onClick={() => setExpanded(!expanded)} className="text-emerald-600 font-bold text-xs mt-2 hover:text-emerald-700 transition-colors">
                        {expanded ? 'Show less ↑' : 'Read more ↓'}
                    </button>
                )}

                {/* Details */}
                <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 text-slate-500">
                        <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-emerald-50 transition-colors">
                            <MapPin className="w-4 h-4 text-slate-400 group-hover:text-emerald-400" />
                        </div>
                        <span className="text-xs font-semibold truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-500">
                        <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-emerald-50 transition-colors">
                            <Calendar className="w-4 h-4 text-slate-400 group-hover:text-emerald-400" />
                        </div>
                        <span className="text-xs font-semibold">{eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    {event.time && (
                        <div className="flex items-center gap-3 text-slate-500">
                            <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-emerald-50 transition-colors">
                                <Users className="w-4 h-4 text-slate-400 group-hover:text-emerald-400" />
                            </div>
                            <span className="text-xs font-semibold truncate">{event.time}</span>
                        </div>
                    )}
                    {event.contact && (
                        <div className="flex items-center gap-3 text-slate-500">
                            <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-emerald-50 transition-colors">
                                <Phone className="w-4 h-4 text-slate-400 group-hover:text-emerald-400" />
                            </div>
                            <span className="text-xs font-semibold truncate">{event.contact}</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-slate-300 text-[10px] font-bold uppercase tracking-widest">Posted {event.postedAt}</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                const text = `${event.title} – ${event.location} on ${event.date}. ${event.description}`
                                navigator.clipboard?.writeText(text)
                            }}
                            className="p-2 text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
                            title="Share Event"
                        >
                            <Share2 className="w-4 h-4" />
                        </button>
                        {isOwner && (
                            <button
                                onClick={() => onDelete(event.id)}
                                className="p-2 text-rose-400 hover:text-white hover:bg-rose-500 bg-rose-50 rounded-xl transition-all"
                                title="Remove Event"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function Community() {
    // Event State
    const [events, setEvents] = useState(() => {
        const saved = localStorage.getItem('careless_events')
        return saved ? [...SEED_EVENTS, ...JSON.parse(saved)] : SEED_EVENTS
    })
    const [activeCategory, setActiveCategory] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [userEventIds, setUserEventIds] = useState(() => {
        const saved = localStorage.getItem('careless_my_events')
        return saved ? JSON.parse(saved) : []
    })
    const [form, setForm] = useState({
        title: '', description: '', category: 'general',
        location: '', date: '', time: '', organizer: '',
        spots: '', contact: '', image: null, imagePreview: null
    })
    const [formError, setFormError] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const fileInputRef = useRef()
    const [solAmount, setSolAmount] = useState('0.18')
    const [isSending, setIsSending] = useState(false)
    const [txSignature, setTxSignature] = useState('')
    const [donateError, setDonateError] = useState('')
    const [donationHistory, setDonationHistory] = useState(() => {
        try {
            const saved = localStorage.getItem(DONATION_HISTORY_KEY)
            if (!saved) return []
            const parsed = JSON.parse(saved)
            return Array.isArray(parsed) ? parsed : []
        } catch {
            return []
        }
    })
    const donationAddress = useMemo(() => {
        try {
            return getDonationAddress().toBase58()
        } catch {
            return ''
        }
    }, [])
    const donorCount = useMemo(() => 2 + donationHistory.length, [donationHistory])

    const isAmountValid = Number.isFinite(Number(solAmount)) && Number(solAmount) > 0
    const donateDisabled = isSending || !isAmountValid || !donationAddress

    const handleTierSelect = (nextAmount) => {
        setSolAmount(nextAmount)
        setDonateError('')
        setTxSignature('')
    }

    const handleDonateWithSolana = async () => {
        setDonateError('')
        setTxSignature('')
        setIsSending(true)

        try {
            const signature = await donateSol({ solAmount })
            setTxSignature(signature)
            setDonationHistory(prev => {
                const next = [
                    {
                        id: signature,
                        signature,
                        amount: Number(solAmount),
                        createdAt: new Date().toISOString(),
                    },
                    ...prev,
                ].slice(0, 8)
                localStorage.setItem(DONATION_HISTORY_KEY, JSON.stringify(next))
                return next
            })
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Donation failed. Please try again.'
            setDonateError(message)
        } finally {
            setIsSending(false)
        }
    }

    const handleImageUpload = (e) => {
        const file = e.target.files[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => setForm(f => ({ ...f, image: reader.result, imagePreview: reader.result }))
        reader.readAsDataURL(file)
    }

    const handlePost = async () => {
        if (!form.title.trim()) return setFormError('Event title is required.')
        if (!form.location.trim()) return setFormError('Location is required.')
        if (!form.date) return setFormError('Date is required.')
        if (!form.organizer.trim()) return setFormError('Organizer name is required.')

        setSubmitting(true)
        setFormError('')

        const newEvent = {
            id: Date.now(),
            ...form,
            imagePreview: undefined,
            postedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        }

        const savedEvents = JSON.parse(localStorage.getItem('careless_events') || '[]')
        const updatedSaved = [newEvent, ...savedEvents]
        localStorage.setItem('careless_events', JSON.stringify(updatedSaved))

        const updatedIds = [newEvent.id, ...userEventIds]
        localStorage.setItem('careless_my_events', JSON.stringify(updatedIds))
        setUserEventIds(updatedIds)

        setEvents(prev => [newEvent, ...prev])
        setForm({
            title: '', description: '', category: 'general',
            location: '', date: '', time: '', organizer: '',
            spots: '', contact: '', image: null, imagePreview: null
        })
        setShowForm(false)
        setSubmitting(false)
    }

    const handleDelete = (id) => {
        const updated = events.filter(e => e.id !== id)
        setEvents(updated)
        const savedEvents = updated.filter(e => !SEED_EVENTS.find(s => s.id === e.id))
        localStorage.setItem('careless_events', JSON.stringify(savedEvents))
        const updatedIds = userEventIds.filter(uid => uid !== id)
        setUserEventIds(updatedIds)
        localStorage.setItem('careless_my_events', JSON.stringify(updatedIds))
    }

    const filtered = events.filter(e => {
        const matchesCat = activeCategory === 'all' || e.category === activeCategory
        const matchesSearch = !searchQuery ||
            e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.description.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesCat && matchesSearch
    })

    const upcoming = filtered.filter(e => new Date(e.date) >= new Date())
    const past = filtered.filter(e => new Date(e.date) < new Date())

    return (
        <div className="min-h-screen bg-gray-50 text-slate-900 pb-20">
            <header className="sticky top-0 z-40 border-b border-emerald-100/80 bg-white/90 backdrop-blur">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-center">
                    <div className="inline-flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-full px-6 py-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span className="text-emerald-700 text-base md:text-lg font-extrabold tracking-wide uppercase">Community Board</span>
                    </div>
                </div>
            </header>
            <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col">

                {/* Header */}
                <div className="mb-16 text-center max-w-3xl mx-auto">
                    <h1 className="syne text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                        Free Campaign<br />
                        <span className="text-emerald-600">Drives Near You</span>
                    </h1>
                    <p className="text-slate-500 mt-6 text-lg leading-relaxed">
                        Discover free health camps, wellness drives, and screenings posted by your community.
                        Making healthcare accessible for every student and neighbor.
                    </p>

                    <button
                        onClick={() => setShowForm(!showForm)}
                        className={`mt-10 inline-flex items-center gap-3 font-bold px-10 py-4 rounded-2xl transition-all shadow-xl shadow-slate-200/50 ${showForm
                            ? 'bg-slate-900 text-white hover:bg-slate-800'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200/50'
                            }`}
                    >
                        {showForm ? <><X className="w-5 h-5" /> Cancel</> : <><Plus className="w-5 h-5" /> Post a Campaign</>}
                    </button>
                </div>


                {/* Post Form */}
                {showForm && (
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 mb-12 shadow-2xl shadow-slate-200/50">
                        <h2 className="syne text-3xl font-extrabold text-slate-900 mb-8">Post a Free Health Drive</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="md:col-span-2">
                                <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 block">Event Title *</label>
                                <input
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-all font-medium"
                                    placeholder="e.g. Free Blood Donation Drive"
                                    value={form.title}
                                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 block">Description</label>
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm resize-none h-32 focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-all font-medium"
                                    placeholder="Tell people what to expect, what to bring, who it's for..."
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 block">Category</label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-all font-bold text-slate-700"
                                    value={form.category}
                                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                >
                                    {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                                        <option key={c.id} value={c.id}>{c.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 block">Organizer Name *</label>
                                <input
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-all font-medium"
                                    placeholder="e.g. Red Cross, Local Hospital"
                                    value={form.organizer}
                                    onChange={e => setForm(f => ({ ...f, organizer: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 block">Location *</label>
                                <input
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-all font-medium"
                                    placeholder="e.g. City Hall, 123 Main St"
                                    value={form.location}
                                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 block">Date *</label>
                                <input
                                    type="date"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-all font-bold text-slate-700"
                                    value={form.date}
                                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 block">Time</label>
                                <input
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-all font-medium"
                                    placeholder="e.g. 9:00 AM – 4:00 PM"
                                    value={form.time}
                                    onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 block">Contact Info</label>
                                <input
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-all font-medium"
                                    placeholder="e.g. Phone number or Email"
                                    value={form.contact}
                                    onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
                                />
                            </div>

                            {/* Image Upload */}
                            <div className="md:col-span-2">
                                <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 block">Event Poster / Image</label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 rounded-[2rem] p-10 text-center cursor-pointer transition-all group"
                                >
                                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                    {form.imagePreview ? (
                                        <div className="space-y-4">
                                            <img src={form.imagePreview} className="h-40 mx-auto rounded-2xl object-cover shadow-lg" alt="preview" />
                                            <p className="text-emerald-600 text-xs font-bold">✓ Image Ready — Click to change</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-3">
                                            <Activity className="w-10 h-10 text-slate-300 group-hover:text-emerald-400 transition-colors" />
                                            <p className="text-slate-500 font-bold text-sm">Upload a poster or photo</p>
                                            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Supports JPG, PNG, WEBP</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {formError && (
                            <div className="mt-8 bg-rose-50 border border-rose-100 rounded-2xl px-6 py-4">
                                <p className="text-rose-600 text-sm font-bold">⚠ {formError}</p>
                            </div>
                        )}

                        <div className="mt-10 flex gap-4">
                            <button
                                onClick={handlePost}
                                disabled={submitting}
                                className="flex-1 bg-slate-900 text-white hover:bg-emerald-600 disabled:opacity-50 py-5 rounded-2xl font-bold text-sm transition-all shadow-xl hover:shadow-emerald-200"
                            >
                                {submitting ? 'Creating Event...' : '🚀 Post Free Event'}
                            </button>
                            <button
                                onClick={() => { setShowForm(false); setFormError('') }}
                                className="px-8 py-5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-sm transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Stats Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {[
                        { label: 'Total Events', value: events.length, icon: '📋', color: 'blue' },
                        { label: 'Upcoming', value: events.filter(e => new Date(e.date) >= new Date()).length, icon: '📅', color: 'emerald' },
                        { label: 'Categories', value: CATEGORIES.length - 1, icon: '🏷', color: 'purple' },
                    ].map(s => (
                        <div key={s.label} className="bg-white border border-slate-100 rounded-3xl p-6 flex items-center gap-6 shadow-sm">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-slate-50`}>
                                {s.icon}
                            </div>
                            <div>
                                <p className="syne text-2xl font-extrabold text-slate-900">{s.value}</p>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col lg:flex-row gap-6 mb-12">
                    <div className="flex-1 relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-6 h-6" />
                        <input
                            className="w-full bg-white border border-slate-100 rounded-3xl pl-16 pr-8 py-6 text-lg focus:outline-none focus:ring-4 focus:ring-emerald-50 transition-all shadow-xl shadow-slate-200/50 font-medium placeholder-slate-400"
                            placeholder="Find health camps, clinics, or screenings..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 shrink-0">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`shrink-0 text-[10px] font-bold uppercase tracking-widest px-6 py-4 rounded-2xl border transition-all ${activeCategory === cat.id
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                                    : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300 hover:text-slate-600'
                                    }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Upcoming Events */}
                {upcoming.length > 0 && (
                    <div className="mb-16">
                        <div className="flex items-center gap-3 mb-8">
                            <h2 className="syne text-2xl font-extrabold text-slate-900">Upcoming Events</h2>
                            <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-3 py-1 rounded-full">{upcoming.length} Found</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {upcoming.map(event => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    onDelete={handleDelete}
                                    isOwner={userEventIds.includes(event.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Past Events */}
                {past.length > 0 && (
                    <div className="mb-16">
                        <div className="flex items-center gap-3 mb-8">
                            <h2 className="syne text-2xl font-extrabold text-slate-400">Past Events</h2>
                            <span className="bg-slate-100 text-slate-400 text-[10px] font-bold px-3 py-1 rounded-full">{past.length}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 opacity-60 grayscale-[0.5]">
                            {past.map(event => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    onDelete={handleDelete}
                                    isOwner={userEventIds.includes(event.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {filtered.length === 0 && (
                    <div className="text-center py-24 bg-white rounded-[3rem] border border-slate-100 shadow-sm mb-16">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">🏥</div>
                        <h3 className="syne text-2xl font-extrabold text-slate-900 mb-2">No events found</h3>
                        <p className="text-slate-500 text-sm max-w-xs mx-auto mb-8 leading-relaxed">Try adjusting your filters or be the hero who posts the first event in this category!</p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-xl shadow-emerald-100"
                        >
                            + Post New Event
                        </button>
                    </div>
                )}

                {/* --- DONATION SECTION --- */}
                <div className="order-first mb-16 max-w-4xl mx-auto w-full rounded-[3rem] border border-rose-100 bg-gradient-to-b from-rose-50/60 to-white p-6 md:p-10 shadow-2xl shadow-rose-100/50">
                    {/* Donation Header */}
                    <div className="mb-16 text-center">
                        <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-full px-4 py-1.5 mb-6">
                            <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                            <span className="text-rose-600 text-[10px] font-bold tracking-widest uppercase">Student Emergency Fund</span>
                        </div>
                        <h2 className="syne text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                            Student Health <br />
                            <span className="text-rose-600">Emergency Fund</span>
                        </h2>
                        <p className="text-slate-500 mt-6 text-lg leading-relaxed">
                            Support college students facing unexpected medical crises. Your contributions
                            provide immediate aid for treatments, prescriptions, and diagnostics.
                        </p>
                        <DonorCountCard donorCount={donorCount} />
                    </div>

                    {/* Donation Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        {DONATION_TIERS.map((tier) => (
                            <div key={tier.label} className={`relative bg-white rounded-[2.5rem] p-8 border ${tier.popular ? 'border-rose-200 ring-4 ring-rose-50' : 'border-slate-100'} shadow-xl shadow-slate-200/40 transition-all hover:scale-[1.03] duration-300`}>
                                {tier.popular && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                                        Critical Need
                                    </span>
                                )}
                                <div className="text-4xl mb-4">{tier.icon}</div>
                                <h3 className="syne text-xl font-bold text-slate-900 mb-1">{tier.label}</h3>
                                <p className="text-slate-400 text-xs mb-6 font-medium">{tier.desc}</p>
                                <div className="text-4xl font-extrabold text-slate-900 mb-8">{tier.amount}</div>
                                <button
                                    type="button"
                                    onClick={() => handleTierSelect(tier.sol)}
                                    className={`w-full py-4 rounded-2xl font-bold text-sm transition-all ${tier.popular ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-900 hover:text-white'}`}
                                >
                                    Select {tier.sol} SOL
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Feature Grid */}
                    <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="flex gap-6">
                            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0">
                                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 mb-2">Verified Emergencies</h4>
                                <p className="text-slate-500 text-sm leading-relaxed">Every request is vetted to ensure funds go directly to students in genuine medical need.</p>
                            </div>
                        </div>
                        <div className="flex gap-6">
                            <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center shrink-0">
                                <Heart className="w-6 h-6 text-rose-500" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 mb-2">Student Focus</h4>
                                <p className="text-slate-500 text-sm leading-relaxed">Dedicated specifically to undergraduate and graduate students without adequate insurance.</p>
                            </div>
                        </div>
                        <div className="flex gap-6">
                            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0">
                                <Zap className="w-6 h-6 text-emerald-500" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 mb-2">Rapid Relief</h4>
                                <p className="text-slate-500 text-sm leading-relaxed">Funds are deployed quickly to cover urgent bills and prevent medical debt.</p>
                            </div>
                        </div>
                        <div className="flex gap-6">
                            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0">
                                <Globe className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 mb-2">College Network</h4>
                                <p className="text-slate-500 text-sm leading-relaxed">Partnering with university health centers to identify and support students at risk.</p>
                            </div>
                        </div>
                    </div>

                    {/* Solana Donate */}
                    <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
                            <div className="flex items-center gap-4 mb-5">
                                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center font-bold text-xs italic">S</div>
                                <div className="text-left">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Solana Address</p>
                                    <p className="text-xs font-mono break-all">{donationAddress || 'Not configured'}</p>
                                </div>
                            </div>

                            <div className="text-left mb-4">
                                <label htmlFor="sol-amount" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                    Donation Amount (SOL)
                                </label>
                                <input
                                    id="sol-amount"
                                    type="number"
                                    min="0"
                                    step="0.001"
                                    value={solAmount}
                                    onChange={(event) => setSolAmount(event.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="0.18"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={handleDonateWithSolana}
                                disabled={donateDisabled}
                                className="w-full py-3 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-all"
                            >
                                {isSending ? 'Sending SOL...' : 'Donate with Solana'}
                            </button>

                            {donateError && (
                                <p className="text-rose-300 text-xs mt-3">{donateError}</p>
                            )}

                            {txSignature && (
                                <a
                                    href={txExplorerUrl(txSignature)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-block mt-3 text-xs text-emerald-300 hover:text-emerald-100 underline break-all"
                                >
                                    View transaction: {txSignature}
                                </a>
                            )}

                            {!donationAddress && (
                                <p className="text-amber-200 text-xs mt-3">Set `VITE_DONATION_WALLET` in `.env` to enable donations.</p>
                            )}
                        </div>

                        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                            <div className="flex items-center justify-between gap-3 mb-4">
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Proof Of Impact</p>
                                    <h4 className="syne text-2xl font-extrabold text-slate-900">On-Chain Donation Feed</h4>
                                </div>
                                <span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full">
                                    {donationHistory.length} TX
                                </span>
                            </div>

                            {donationHistory.length === 0 ? (
                                <p className="text-slate-500 text-sm leading-relaxed">
                                    Your first Solana donation will appear here with a verifiable signature.
                                    This feed helps judges quickly validate real blockchain usage.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {donationHistory.map((item) => (
                                        <div key={item.id || item.signature} className="border border-slate-100 rounded-2xl px-4 py-3">
                                            <div className="flex items-center justify-between gap-3 mb-2">
                                                <p className="text-sm font-extrabold text-slate-900">{Number(item.amount || 0).toFixed(3)} SOL</p>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                    {formatFeedTimestamp(item.createdAt)}
                                                </p>
                                            </div>
                                            {item.signature ? (
                                                <a
                                                    href={txExplorerUrl(item.signature)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-xs font-mono text-emerald-600 hover:text-emerald-700 underline break-all"
                                                >
                                                    {item.signature}
                                                </a>
                                            ) : (
                                                <p className="text-xs font-mono text-slate-400">Signature unavailable</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}