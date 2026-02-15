import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function CustomSelect({ value, onChange, options, placeholder = "Select", error, className }) {
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);
    const ref = useRef(null);
    const listRef = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        const onScroll = () => setOpen(false);
        window.addEventListener('scroll', onScroll, true);
        return () => window.removeEventListener('scroll', onScroll, true);
    }, []);

    // Ensure active index is valid
    useEffect(() => {
        if (active < 0) setActive(0);
        else if (active >= options.length) setActive(Math.max(0, options.length - 1));
    }, [options.length, active]);

    // Scroll active item into view
    useEffect(() => {
        const el = listRef.current?.querySelector(`[data-index="${active}"]`);
        if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
    }, [active]);

    const selected = options.find(o => o.value === value);

    const openAndInit = () => {
        setOpen(o => {
            const idx = options.findIndex(opt => opt.value === value);
            setActive(idx >= 0 ? idx : 0);
            return !o;
        });
    };

    const onKeyDown = (e) => {
        if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            openAndInit();
            return;
        }
        if (!open) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(options.length - 1, a + 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(0, a - 1)); }
        else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
        else if (e.key === 'End') { e.preventDefault(); setActive(Math.max(0, options.length - 1)); }
        else if (e.key === 'Enter') {
            e.preventDefault();
            const pick = options[active];
            if (pick) { onChange(pick.value); setOpen(false); }
        } else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
    };

    return (
        <div className={`relative ${className || ''}`} ref={ref}>
            <button
                type="button"
                className={`w-full rounded-md border ${error ? 'border-red-500' : 'border-gray-300'} bg-white text-gray-900 px-3 py-2 text-left flex items-center justify-between text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                onClick={openAndInit}
                onKeyDown={onKeyDown}
            >
                <span className={!selected ? 'text-gray-500' : ''}>{selected ? selected.label : placeholder}</span>
                <ChevronDownIcon className="w-4 h-4 text-gray-500" />
            </button>

            {open && (
                <div className="absolute z-50 mt-1 w-full bg-white border rounded shadow-lg" onKeyDown={onKeyDown}>
                    <div ref={listRef} className="max-h-60 overflow-auto text-sm py-1">
                        {options.map((opt, idx) => (
                            <button
                                type="button"
                                data-index={idx}
                                key={opt.value}
                                className={`w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-900 ${opt.value === value ? 'bg-indigo-50 font-medium' : ''} ${idx === active ? 'ring-1 ring-inset ring-indigo-300' : ''}`}
                                onClick={() => { onChange(opt.value); setOpen(false); }}
                            >
                                {opt.label}
                            </button>
                        ))}
                        {options.length === 0 && (
                            <div className="px-3 py-2 text-gray-500">No options</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
