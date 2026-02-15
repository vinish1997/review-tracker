import { EllipsisVerticalIcon, PencilSquareIcon, TrashIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useState, useRef } from "react";
import DropdownPortal from "./DropdownPortal";

export default function ReviewCard({ review, renderCell, onEdit, onDelete, onNavigate }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // key fields to show on mobile card
    const header = (
        <div className="flex justify-between items-start mb-2">
            <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 truncate flex items-center gap-2">
                    {renderCell('orderId', review)}
                </div>
                <div className="text-sm text-gray-600 truncate">{renderCell('productName', review)}</div>
            </div>
            <div className="ml-2 flex-shrink-0">
                {renderCell('status', review)}
            </div>
        </div>
    );

    const details = (
        <div className="grid grid-cols-2 gap-y-2 text-xs text-gray-500 mt-3 border-t border-gray-100 pt-3">
            <div>
                <span className="block text-gray-400 font-medium pb-0.5">Platform</span>
                {renderCell('platformName', review)}
            </div>
            <div className="text-right">
                <span className="block text-gray-400 font-medium pb-0.5">Mediator</span>
                {renderCell('mediatorName', review)}
            </div>
            <div>
                <span className="block text-gray-400 font-medium pb-0.5">Date</span>
                {renderCell('orderedDate', review)}
            </div>
            <div className="text-right">
                <span className="block text-gray-400 font-medium pb-0.5">Amount</span>
                <span className="font-medium text-gray-900">{renderCell('amountRupees', review)}</span>
            </div>
            {/* Show refund if applicable */}
            {(review.refundAmountRupees > 0 || review.refundFormSubmittedDate) && (
                <div className="col-span-2 flex justify-between pt-1 border-t border-dashed border-gray-100 mt-1">
                    <span className="text-gray-400">Refund</span>
                    <span className="font-medium text-emerald-600">{renderCell('refundAmountRupees', review)}</span>
                </div>
            )}
        </div>
    );

    return (
        <div
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative active:scale-[0.99] transition-transform"
            onClick={() => onNavigate(review)}
        >
            {header}
            {details}

            <div className="absolute bottom-4 right-4 md:hidden" onClick={(e) => e.stopPropagation()}>
                {/* Actions handled via separate button or swipe? 
                   For now, let's just stick to the card click navigating to details.
                   Maybe a small context menu?
               */}
                <button
                    ref={menuRef}
                    className="p-2 -m-2 text-gray-400"
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    <EllipsisVerticalIcon className="w-5 h-5" />
                </button>
                <DropdownPortal open={menuOpen} anchorRef={menuRef} onClose={() => setMenuOpen(false)} align="right" className="w-32">
                    <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                        onClick={() => { setMenuOpen(false); onEdit(review); }}
                    >
                        <PencilSquareIcon className="w-4 h-4" /> Edit
                    </button>
                    <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                        onClick={() => { setMenuOpen(false); onDelete(review); }}
                    >
                        <TrashIcon className="w-4 h-4" /> Delete
                    </button>
                </DropdownPortal>
            </div>
        </div>
    );
}
