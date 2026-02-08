import { Link, useLocation } from "react-router-dom";
import {
    HomeIcon,
    ListBulletIcon,
    ArchiveBoxIcon,
    TableCellsIcon,
    BellIcon
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { getNotifications } from "../api/reviews";

export default function BottomNav() {
    const location = useLocation();
    const isActive = (path) => location.pathname.startsWith(path);

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
        { name: 'Reviews', path: '/reviews', icon: ListBulletIcon },
        { name: 'Alerts', path: '/notifications', icon: BellIcon, badge: true },
        { name: 'Lookups', path: '/lookups', icon: TableCellsIcon },
        { name: 'Archive', path: '/archive', icon: ArchiveBoxIcon },
    ];

    const [notifCount, setNotifCount] = useState(0);
    useEffect(() => {
        getNotifications().then(res => setNotifCount(res.data?.length || 0)).catch(() => { });
        // Poll every 5 minutes
        const timer = setInterval(() => {
            getNotifications().then(res => setNotifCount(res.data?.length || 0)).catch(() => { });
        }, 5 * 60 * 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 z-40 pb-safe">
            {navItems.map((item) => (
                <Link
                    key={item.name}
                    to={item.path}
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive(item.path) ? 'text-indigo-600' : 'text-gray-500'
                        }`}
                >
                    <div className="relative">
                        <item.icon className="h-6 w-6" />
                        {item.badge && notifCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                                {notifCount}
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] font-medium">{item.name}</span>
                </Link>
            ))}
        </nav>
    );
}
