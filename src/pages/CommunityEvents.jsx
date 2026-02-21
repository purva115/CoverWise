import { Calendar, MapPin, Users, ArrowRight } from 'lucide-react'

const events = [
    {
        title: "Medicare Advantage 2026 Webinar",
        date: "Oct 12, 2026",
        location: "Online / Zoom",
        attendees: "1.2k attending",
        category: "Information",
        image: "https://images.unsplash.com/photo-1576091160550-217359f42f8c?auto=format&fit=crop&w=800&q=80"
    },
    {
        title: "Free Healthcare Clinic: Downtown",
        date: "Oct 15, 2026",
        location: "Community Center, NY",
        attendees: "450 attending",
        category: "Local Service",
        image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80"
    },
    {
        title: "Mental Health Awareness Workshop",
        date: "Oct 20, 2026",
        location: "Health Hub, Brooklyn",
        attendees: "120 attending",
        category: "Workshop",
        image: "https://images.unsplash.com/photo-1527137342181-19aab11a8ee1?auto=format&fit=crop&w=800&q=80"
    },
    {
        title: "Navigating PPO Networks 101",
        date: "Nov 5, 2026",
        location: "Online / Webinar",
        attendees: "800 attending",
        category: "Education",
        image: "https://images.unsplash.com/photo-1454165833714-c073984635d1?auto=format&fit=crop&w=800&q=80"
    }
]

export default function CommunityEvents() {
    return (
        <div className="min-h-screen bg-gray-50 text-slate-900 pb-20">
            <div className="max-w-6xl mx-auto px-6 py-12">

                {/* Header */}
                <div className="mb-16">
                    <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-full px-4 py-1.5 mb-6">
                        <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                        <span className="text-purple-600 text-[10px] font-bold tracking-widest uppercase">Community & Events</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <h1 className="syne text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                                Connect & <br />
                                <span className="text-purple-600">Learn Together</span>
                            </h1>
                            <p className="text-slate-500 mt-6 text-lg max-w-xl leading-relaxed">
                                Join local clinics, educational webinars, and support groups to make better healthcare decisions.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <button className="bg-white border border-slate-200 px-6 py-3 rounded-2xl font-bold text-sm shadow-sm hover:shadow-md transition-all">Submit Event</button>
                            <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg hover:bg-purple-600 transition-all">My Calendar</button>
                        </div>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                    {events.map((event, i) => (
                        <div key={i} className="group bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/30 hover:shadow-2xl hover:shadow-purple-200/40 transition-all duration-500">
                            <div className="aspect-[21/9] overflow-hidden relative">
                                <img
                                    src={event.image}
                                    alt={event.title}
                                    className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                                />
                                <div className="absolute top-4 left-4">
                                    <span className="bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                                        {event.category}
                                    </span>
                                </div>
                            </div>
                            <div className="p-8">
                                <h3 className="syne text-2xl font-bold text-slate-900 mb-6 group-hover:text-purple-600 transition-colors">
                                    {event.title}
                                </h3>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="flex items-center gap-3 text-slate-500">
                                        <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-purple-50 transition-colors">
                                            <Calendar className="w-4 h-4 text-slate-400 group-hover:text-purple-400" />
                                        </div>
                                        <span className="text-xs font-semibold">{event.date}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-500">
                                        <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-purple-50 transition-colors">
                                            <MapPin className="w-4 h-4 text-slate-400 group-hover:text-purple-400" />
                                        </div>
                                        <span className="text-xs font-semibold truncate">{event.location}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-500">
                                        <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-purple-50 transition-colors">
                                            <Users className="w-4 h-4 text-slate-400 group-hover:text-purple-400" />
                                        </div>
                                        <span className="text-xs font-semibold">{event.attendees}</span>
                                    </div>
                                </div>

                                <button className="w-full py-4 bg-slate-50 group-hover:bg-slate-900 group-hover:text-white rounded-2xl text-slate-600 font-bold text-sm transition-all flex items-center justify-center gap-2">
                                    Register Now <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Newsletter */}
                <div className="mt-20 bg-purple-600 rounded-[3rem] p-12 text-center text-white relative overflow-hidden shadow-2xl shadow-purple-200">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mt-32 blur-3xl"></div>
                    <h2 className="syne text-3xl font-extrabold mb-4 relative z-10">Don't miss a beat</h2>
                    <p className="text-purple-100 mb-8 relative z-10">Get weekly updates on health laws, free clinics, and insurance tips.</p>
                    <div className="max-w-md mx-auto flex gap-2 relative z-10">
                        <input
                            type="email"
                            placeholder="your@email.com"
                            className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-6 py-3 text-white placeholder:text-purple-200 focus:outline-none focus:bg-white/20 transition-all"
                        />
                        <button className="bg-white text-purple-600 px-6 py-3 rounded-2xl font-bold text-sm hover:shadow-xl transition-all">Subscribe</button>
                    </div>
                </div>

            </div>
        </div>
    )
}
