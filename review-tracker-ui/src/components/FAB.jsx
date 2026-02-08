import { Link } from "react-router-dom";
import { PlusIcon } from "@heroicons/react/24/outline";

export default function FAB() {
    return (
        <Link
            to="/reviews/new"
            className="md:hidden fixed bottom-20 right-4 bg-indigo-600 text-white p-4 rounded-full shadow-lg z-40 hover:bg-indigo-700 active:scale-95 transition-transform"
            aria-label="Add Review"
        >
            <PlusIcon className="h-6 w-6" />
        </Link>
    );
}
