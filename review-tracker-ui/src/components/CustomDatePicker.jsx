import { useState, useEffect, useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CustomDatePicker({ value, onChange, placeholder = "Select Date", error, className, disabled }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    // Parse value or default to today for view
    const dateValue = value ? new Date(value) : null;
    const [viewDate, setViewDate] = useState(dateValue || new Date());

    useEffect(() => {
        if (value) {
            setViewDate(new Date(value));
        }
    }, [value]);

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

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const handlePrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const handleDateClick = (day) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        onChange(newDate);
        setOpen(false);
    };

    const renderCalendar = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const blanks = Array(firstDay).fill(null);
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        const allCells = [...blanks, ...days];

        return (
            <div className="p-2">
                <div className="flex justify-between items-center mb-2">
                    <button type="button" onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded text-gray-600">
                        <ChevronLeftIcon className="w-4 h-4" />
                    </button>
                    <div className="font-semibold text-gray-900 text-sm">
                        {MONTHS[month]} {year}
                    </div>
                    <button type="button" onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded text-gray-600">
                        <ChevronRightIcon className="w-4 h-4" />
                    </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs mb-1">
                    {DAYS.map(d => <div key={d} className="text-gray-400 font-medium">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                    {allCells.map((day, idx) => {
                        if (!day) return <div key={idx} />;
                        const current = new Date(year, month, day);
                        const isSelected = dateValue &&
                            current.getDate() === dateValue.getDate() &&
                            current.getMonth() === dateValue.getMonth() &&
                            current.getFullYear() === dateValue.getFullYear();
                        const isToday = !isSelected &&
                            day === new Date().getDate() &&
                            month === new Date().getMonth() &&
                            year === new Date().getFullYear();

                        return (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => handleDateClick(day)}
                                className={`w-8 h-8 flex items-center justify-center rounded-full text-sm transition-colors
                  ${isSelected ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'}
                  ${isToday ? 'bg-indigo-50 text-indigo-700 font-medium' : ''}
                `}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    const displayValue = value ? new Date(value).toLocaleDateString() : '';

    return (
        <div className={`relative ${className || ''}`} ref={ref}>
            <button
                type="button"
                disabled={disabled}
                className={`w-full rounded-md border ${error ? 'border-red-500' : 'border-gray-300'} ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-400' : 'bg-white text-gray-900'} px-3 py-2 text-left flex items-center justify-between text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                onClick={() => !disabled && setOpen(!open)}
            >
                <span className={!value ? 'text-gray-500' : ''}>{displayValue || placeholder}</span>
                <CalendarDaysIcon className="w-4 h-4 text-gray-500" />
            </button>

            {open && !disabled && (
                <div className="absolute z-[1300] mt-1 bg-white border rounded-lg shadow-xl w-72 p-1 left-0 sm:left-auto">
                    {renderCalendar()}
                </div>
            )}
        </div>
    );
}
