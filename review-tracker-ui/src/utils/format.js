export function formatCurrencyINR(val) {
  return `₹${Number(val || 0).toLocaleString('en-IN')}`;
}

// Format integer counts with Indian locale grouping
export function formatInt(val) {
  return Number(val || 0).toLocaleString('en-IN');
}

// Expects ISO date string (yyyy-MM-dd or ISO). Returns yyyy-MM-dd.
export function formatDate(val) {
  if (!val) return '';
  try {
    // If already yyyy-MM-dd, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return String(val);
    return d.toISOString().slice(0, 10);
  } catch {
    return String(val);
  }
}
