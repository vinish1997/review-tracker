import { Link } from "react-router-dom";
import { PlusIcon } from "@heroicons/react/24/outline";

export default function FAB({ onClick, to, ariaLabel = "Add" }) {
    const className = "md:hidden fixed bottom-20 right-4 bg-indigo-600 text-white p-4 rounded-full shadow-lg z-40 hover:bg-indigo-700 active:scale-95 transition-transform";

    if (to) {
        return (
            <Link to={to} className={className} aria-label={ariaLabel}>
                <PlusIcon className="h-6 w-6" />
            </Link>
        );
    }

    return (
        <button onClick={onClick} className={className} aria-label={ariaLabel}>
            <PlusIcon className="h-6 w-6" />
        </button>
    );
}
