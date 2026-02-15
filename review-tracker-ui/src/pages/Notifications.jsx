import { useEffect, useState } from "react";
import { getNotifications } from "../api/reviews";
import { Link, useNavigate } from "react-router-dom";
import { BellIcon, ExclamationTriangleIcon, InformationCircleIcon, ClockIcon, ChevronRightIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";

export default function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        getNotifications()
            .then(res => setNotifications(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto p-4 space-y-4 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-gray-100 rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto pb-20">
            <div className="p-6 rounded-t-xl bg-gradient-to-r from-indigo-50 via-white to-emerald-50 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
                    <p className="text-gray-600">Proactive reminders for your reviews and refunds</p>
                </div>
                <Link to="/notification-rules" className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 bg-white px-3 py-1.5 rounded-full border border-indigo-100 shadow-sm">
                    <Cog6ToothIcon className="w-4 h-4" />
                    <span>Rules</span>
                </Link>
            </div>

            <div className="bg-white rounded-b-xl shadow-sm border border-t-0 p-2 space-y-2">
                {notifications.length === 0 ? (
                    <div className="py-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                            <BellIcon className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium">All caught up!</p>
                        <p className="text-sm text-gray-400">No urgent actions pending right now.</p>
                    </div>
                ) : (
                    notifications.map((n) => (
                        <button
                            key={n.id}
                            onClick={() => navigate(n.actionUrl)}
                            className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all flex gap-4 items-start group"
                        >
                            <div className={`p-2 rounded-lg shrink-0 ${n.type === 'URGENT' ? 'bg-red-50 text-red-600' :
                                n.type === 'WARNING' ? 'bg-orange-50 text-orange-600' :
                                    'bg-blue-50 text-blue-600'
                                }`}>
                                {n.type === 'URGENT' ? <ExclamationTriangleIcon className="w-5 h-5" /> :
                                    n.type === 'WARNING' ? <ClockIcon className="w-5 h-5" /> :
                                        <InformationCircleIcon className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                    <span className="font-bold text-gray-900">{n.title}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-indigo-400">Order: {n.orderId}</span>
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed">{n.message}</p>
                            </div>
                            <div className="self-center">
                                <ChevronRightIcon className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                            </div>
                        </button>
                    ))
                )}
            </div>

            <div className="mt-8 px-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Logic Rules</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-500">
                    <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <span className="font-bold block text-gray-700 mb-1">Review Reminder</span>
                        7 days after ordering if no review date is set.
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <span className="font-bold block text-gray-700 mb-1">Refund Form</span>
                        3 days after review acceptance if form not submitted.
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <span className="font-bold block text-gray-700 mb-1">Payment Check</span>
                        45 days after refund form submission for status check.
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <span className="font-bold block text-gray-700 mb-1">Crucial Overdue</span>
                        60 days after refund form submission if still pending.
                    </div>
                </div>
            </div>
        </div>
    );
}
