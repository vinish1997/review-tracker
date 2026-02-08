import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { deleteReview, searchReviews, exportCsv as apiExportCsv, importCsv as apiImportCsv, bulkDelete, aggregates as apiAggregates, advanceReview, bulkAdvance, bulkUpdate } from "../api/reviews";
import { getPlatforms, getMediators } from "../api/lookups";
import { listViews, saveView as apiSaveView, deleteView as apiDeleteView, shareView as apiShareView, unshareView as apiUnshareView } from "../api/views";
import { useNavigate, useSearchParams } from "react-router-dom";
import Modal from "./Modal";
import DropdownPortal from "./DropdownPortal";
import useToast from "./useToast";
import { PlusIcon, PencilSquareIcon, TrashIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, DocumentDuplicateIcon, EllipsisVerticalIcon, ClipboardDocumentIcon, ArrowTopRightOnSquareIcon, ChatBubbleLeftRightIcon, AdjustmentsHorizontalIcon, ChevronDownIcon, CheckCircleIcon, XMarkIcon, Squares2X2Icon, TagIcon, UserGroupIcon, ListBulletIcon, SparklesIcon } from "@heroicons/react/24/outline";
import DatePicker from "react-datepicker";
import { formatCurrencyINR as formatCurrency, formatDate } from "../utils/format";

export default function ReviewTable() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [platforms, setPlatforms] = useState([]);
  const [mediators, setMediators] = useState([]);
  const statusOptions = [
    "ordered",
    "delivered",
    "review submitted",
    "review accepted",
    "rating submitted",
    "refund form submitted",
    "payment received",
  ];
  const dealTypeOptions = [
    { value: "REVIEW_PUBLISHED", label: "Review Published" },
    { value: "REVIEW_SUBMISSION", label: "Review Submission" },
    { value: "RATING_ONLY", label: "Rating Only" },
  ];

  // Advanced search filters
  // Draft filters (checkbox selections)
  const [fPlatformIds, setFPlatformIds] = useState([]);
  const [fMediatorIds, setFMediatorIds] = useState([]);
  const [fStatuses, setFStatuses] = useState([]);
  const [fDealTypes, setFDealTypes] = useState([]);

  // Sorting
  const [sortField, setSortField] = useState("orderedDate");
  const [sortDir, setSortDir] = useState("desc"); // 'asc' | 'desc'
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [quickMode, setQuickMode] = useState("both"); // both | product | order
  const [statusInPreset, setStatusInPreset] = useState([]); // optional preset override
  const [hasRefundFormUrlInPreset, setHasRefundFormUrlInPreset] = useState(null);
  const [searchParams] = useSearchParams();
  // Filters popover
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef(null);
  const filtersAnchorRef = useRef(null);
  const [selected, setSelected] = useState(new Set());
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [mediatorQuery, setMediatorQuery] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false); // applied overdue-only filter
  const [overdueDraft, setOverdueDraft] = useState(false); // draft within filters popover
  const [datePreset, setDatePreset] = useState(null); // 'delivered7' | 'delivered30' | 'delivered90' | 'range' | null
  const [datePresetDraft, setDatePresetDraft] = useState(null);
  const [dateRangeFrom, setDateRangeFrom] = useState(null); // Date | null
  const [dateRangeTo, setDateRangeTo] = useState(null); // Date | null
  const [dateRangeDraft, setDateRangeDraft] = useState({ from: null, to: null });
  const [openDatePicker, setOpenDatePicker] = useState(null); // 'from' | 'to' | null
  const [headElevated, setHeadElevated] = useState(false);
  const tableWrapRef = useRef(null);
  const [openRowMenu, setOpenRowMenu] = useState(null); // row id
  const rowMenuAnchorRef = useRef(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const bulkRef = useRef(null);
  const bulkAnchorRef = useRef(null);
  const [bulkAdvanceOpen, setBulkAdvanceOpen] = useState(false);
  const [bulkAdvanceDate, setBulkAdvanceDate] = useState(() => formatDate(new Date()));
  const [advancingRowId, setAdvancingRowId] = useState(null);
  const [advanceDate, setAdvanceDate] = useState(() => formatDate(new Date()));
  const [columnsOpen, setColumnsOpen] = useState(false);
  const columnsRef = useRef(null);
  const columnsAnchorRef = useRef(null);
  // Filters popover state
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('presets'); // 'presets' | 'platform' | 'status' | 'deal' | 'mediator'

  useEffect(() => {
    if (!filtersOpen) setOpenDatePicker(null);
  }, [filtersOpen]);
  // Saved views
  const [viewsOpen, setViewsOpen] = useState(false);
  const viewsRef = useRef(null);
  const viewsAnchorRef = useRef(null);
  const [views, setViews] = useState([]);
  useEffect(() => { (async () => { try { const res = await listViews(); setViews(res.data || []); } catch { void 0; } })(); }, []);
  const closeRowMenus = useCallback(() => {
    setOpenRowMenu(null);
    setAdvancingRowId(null);
    rowMenuAnchorRef.current = null;
  }, []);
  const defaultColOrder = ['orderId', 'productName', 'platformName', 'status', 'dealType', 'mediatorName', 'amountRupees', 'refundAmountRupees', 'orderedDate', 'deliveryDate', 'reviewSubmitDate', 'reviewAcceptedDate', 'ratingSubmittedDate', 'refundFormSubmittedDate', 'paymentReceivedDate'];
  const [colOrder, setColOrder] = useState(() => {
    try { const s = localStorage.getItem('review-col-order'); return s ? JSON.parse(s) : defaultColOrder.slice(); } catch { return defaultColOrder.slice(); }
  });
  const [dragKey, setDragKey] = useState(null);
  const [colWidths, setColWidths] = useState(() => {
    try { const s = localStorage.getItem('review-col-widths'); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });
  const [visibleCols, setVisibleCols] = useState(() => {
    const full = { orderId: true, productName: true, platformName: true, status: true, dealType: true, mediatorName: true, amountRupees: true, refundAmountRupees: true, orderedDate: true, deliveryDate: false, reviewSubmitDate: false, reviewAcceptedDate: false, ratingSubmittedDate: false, refundFormSubmittedDate: false, paymentReceivedDate: false };
    const compact = { orderId: true, productName: true, platformName: false, status: true, dealType: false, mediatorName: false, amountRupees: false, refundAmountRupees: true, orderedDate: true, deliveryDate: false, reviewSubmitDate: false, reviewAcceptedDate: false, ratingSubmittedDate: false, refundFormSubmittedDate: false, paymentReceivedDate: false };
    try {
      const s = localStorage.getItem('review-visible-cols');
      if (s) return JSON.parse(s);
      const isSmall = typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches;
      return isSmall ? compact : full;
    } catch { return full; }
  });

  // Applied filters (only used after Apply Filters is clicked)
  const [aPlatformIds, setAPlatformIds] = useState([]);
  const [aMediatorIds, setAMediatorIds] = useState([]);
  const [aStatuses, setAStatuses] = useState([]);
  const [aDealTypes, setADealTypes] = useState([]);
  const [aSearch, setASearch] = useState("");
  const [aQuickMode, setAQuickMode] = useState("both");
  const [aggTotals, setAggTotals] = useState(null);

  const platformMap = useMemo(() => Object.fromEntries(platforms.map(p => [p.id, p.name])), [platforms]);
  const mediatorMap = useMemo(() => Object.fromEntries(mediators.map(m => [m.id, m])), [mediators]);
  const filteredMediators = useMemo(() => {
    const q = mediatorQuery.trim().toLowerCase();
    if (!q) return mediators;
    return mediators.filter(m => (m.name || '').toLowerCase().includes(q) || (m.phone || '').toLowerCase().includes(q));
  }, [mediators, mediatorQuery]);
  const fromDraftDate = dateRangeDraft.from ? new Date(dateRangeDraft.from) : null;
  const toDraftDate = dateRangeDraft.to ? new Date(dateRangeDraft.to) : null;
  const navigate = useNavigate();
  const toast = useToast();

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const criteria = {
        platformIdIn: (aPlatformIds && aPlatformIds.length > 0) ? aPlatformIds : undefined,
        mediatorIdIn: (aMediatorIds && aMediatorIds.length > 0) ? aMediatorIds : undefined,
        statusIn: (statusInPreset && statusInPreset.length > 0) ? statusInPreset : ((aStatuses && aStatuses.length > 0) ? aStatuses : undefined),
        dealTypeIn: (aDealTypes && aDealTypes.length > 0) ? aDealTypes : undefined,
        hasRefundFormUrl: hasRefundFormUrlInPreset !== null ? hasRefundFormUrlInPreset : undefined,
        productNameContains: (aQuickMode === "both" || aQuickMode === "product") ? (aSearch || undefined) : undefined,
        orderIdContains: (aQuickMode === "both" || aQuickMode === "order") ? (aSearch || undefined) : undefined,
      };
      const [res, pRes, mRes, aggRes] = await Promise.all([
        searchReviews(criteria, {
          page,
          size,
          sort: sortField,
          dir: sortDir.toUpperCase(),
        }),
        getPlatforms(),
        getMediators(),
        apiAggregates(criteria),
      ]);
      const pr = res.data;
      let list = (pr.content || []);
      // client-side sort by name-based pseudo fields using fresh maps
      if (["platformName", "mediatorName"].includes(sortField)) {
        const pMap = Object.fromEntries((pRes.data || []).map(p => [p.id, p.name]));
        const mMap = Object.fromEntries((mRes.data || []).map(m => [m.id, m.name]));
        const nameOf = (r) => sortField === 'platformName' ? (pMap[r.platformId] || '') : (mMap[r.mediatorId] || '');
        list = [...list].sort((a, b) => {
          const av = nameOf(a), bv = nameOf(b);
          const cmp = String(av).localeCompare(String(bv));
          return (sortDir === 'asc' ? cmp : -cmp);
        });
      }
      // optional overdue filter (client side)
      if (overdueOnly) {
        list = list.filter(isOverdue);
      }
      if (datePreset === 'delivered7' || datePreset === 'delivered30' || datePreset === 'delivered90') {
        const now = new Date();
        const days = datePreset === 'delivered7' ? 7 : (datePreset === 'delivered90' ? 90 : 30);
        const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        list = list.filter(r => {
          if (!r.deliveryDate) return false;
          const d = new Date(r.deliveryDate);
          if (Number.isNaN(d.getTime())) return false;
          return d >= from && d <= now;
        });
      } else if (datePreset === 'range' && (dateRangeFrom || dateRangeTo)) {
        const from = dateRangeFrom ? new Date(dateRangeFrom) : null;
        const to = dateRangeTo ? new Date(dateRangeTo) : null;
        list = list.filter(r => {
          if (!r.deliveryDate) return false;
          const d = new Date(r.deliveryDate);
          if (Number.isNaN(d.getTime())) return false;
          if (from && d < from) return false;
          if (to && d > to) return false;
          return true;
        });
      }
      setReviews(list);
      setSelected(new Set());
      setTotalPages(pr.totalPages ?? 0);
      setTotalElements(pr.totalElements ?? 0);
      setPlatforms(pRes.data);
      setMediators(mRes.data);
      setAggTotals(overdueOnly ? null : (aggRes.data || null));
    } catch (err) {
      console.error("Failed to fetch reviews", err);
    }
    setLoading(false);
  }, [aSearch, aPlatformIds, aMediatorIds, sortField, sortDir, page, size, aQuickMode, aStatuses, aDealTypes, statusInPreset, overdueOnly, datePreset, dateRangeFrom, dateRangeTo, hasRefundFormUrlInPreset, isOverdue]);

  // Read optional dashboard preset and apply multi-status filters
  useEffect(() => {
    const preset = searchParams.get('preset');
    if (!preset) { setStatusInPreset([]); setOverdueOnly(false); return; }
    switch (preset) {
      case 'pending-review-rating':
        setStatusInPreset(['ordered', 'delivered']);
        setOverdueOnly(false);
        break;
      case 'pending-refund-form':
        setStatusInPreset(['review submitted', 'review accepted', 'rating submitted']);
        setOverdueOnly(false);
        break;
      case 'pending-payment':
        setStatusInPreset(['refund form submitted']);
        setOverdueOnly(false);
        break;
      case 'overdue':
        setStatusInPreset([]);
        setOverdueOnly(true);
        break;
      case 'ready-to-submit':
        setStatusInPreset(['review accepted', 'rating submitted']);
        setHasRefundFormUrlInPreset(true);
        setOverdueOnly(false);
        break;
      default:
        setStatusInPreset([]);
        setHasRefundFormUrlInPreset(null);
        setOverdueOnly(false);
    }
    setPage(0);
  }, [searchParams]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Load saved filters once on mount (keep hooks before any early return)
  useEffect(() => {
    loadFilters();
  }, []);

  // Elevate header shadow when scrolled
  useEffect(() => {
    const el = tableWrapRef.current;
    if (!el) return;
    const onScroll = () => { setHeadElevated(el.scrollTop > 0); };
    el.addEventListener('scroll', onScroll);
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Virtualizer (top-level hook)
  const rowVirtualizer = useVirtualizer({
    count: reviews.length,
    getScrollElement: () => tableWrapRef.current,
    estimateSize: () => 48,
    overscan: 10,
  });
  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const topPad = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const bottomPad = virtualRows.length > 0 ? totalSize - (virtualRows[virtualRows.length - 1].end) : 0;
  const visibleCountCols = colOrder.filter(k => visibleCols[k]).length + 2; // checkbox + actions
  const dateColumns = ['orderedDate', 'deliveryDate', 'reviewSubmitDate', 'reviewAcceptedDate', 'ratingSubmittedDate', 'refundFormSubmittedDate', 'paymentReceivedDate'];

  function renderCell(key, r) {
    switch (key) {
      case 'orderId':
        return (
          <div className="flex items-center gap-1">
            <button className="text-blue-600 hover:underline" onClick={() => navigate(`/reviews/view/${r.id}`)}>{r.orderId}</button>
            <button title="Copy Order ID" aria-label="Copy Order ID" className="p-1 rounded hover:bg-gray-100" onClick={async () => { await navigator.clipboard.writeText(r.orderId || ''); toast.show('Copied', 'success'); }}>
              <ClipboardDocumentIcon className="w-4 h-4 text-gray-600" />
            </button>
            {r.orderLink && (
              <a title="Open Order Link" aria-label="Open Order Link" href={r.orderLink} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-gray-100">
                <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-600" />
              </a>
            )}
          </div>
        );
      case 'productName':
        return r.productName;
      case 'platformName':
        return platformMap[r.platformId] || r.platformId;
      case 'orderedDate':
        return formatDate(r.orderedDate);
      case 'deliveryDate':
        return formatDate(r.deliveryDate);
      case 'reviewSubmitDate':
        return formatDate(r.reviewSubmitDate);
      case 'reviewAcceptedDate':
        return formatDate(r.reviewAcceptedDate);
      case 'ratingSubmittedDate':
        return formatDate(r.ratingSubmittedDate);
      case 'refundFormSubmittedDate':
        return formatDate(r.refundFormSubmittedDate);
      case 'paymentReceivedDate':
        return formatDate(r.paymentReceivedDate);
      case 'status':
        return (
          <div className="flex flex-col items-center gap-1">
            <span className={`px-2 py-0.5 rounded text-xs ${statusClass(r.status)}`}>{r.status}</span>
            {r.refundFormUrl && (r.status === 'review accepted' || r.status === 'rating submitted' || r.status === 'review submitted') && (
              <a
                href={r.refundFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 px-2 py-1 bg-orange-100 text-orange-700 rounded text-[10px] font-bold uppercase hover:bg-orange-200 transition-colors inline-flex items-center gap-1"
                title="Open Refund Form"
              >
                <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                Submit Refund
              </a>
            )}
          </div>
        );
      case 'dealType':
        return dealTypeLabel(r.dealType);
      case 'mediatorName':
        return r.mediatorId ? (
          <a
            href={`https://wa.me/${(mediatorMap[r.mediatorId]?.phone || "").replace(/^\+/, '')}?text=${encodeURIComponent(`Hi ${mediatorMap[r.mediatorId]?.name || ""}, regarding order ${r.orderId}`)}`}
            target="_blank" rel="noopener noreferrer" className="text-green-700 hover:underline inline-flex items-center gap-1">
            <ChatBubbleLeftRightIcon className="w-4 h-4" />
            <span>{mediatorMap[r.mediatorId]?.name || r.mediatorId}</span>
          </a>
        ) : null;
      case 'amountRupees':
        return formatCurrency(r.amountRupees);
      case 'refundAmountRupees':
        return formatCurrency(r.refundAmountRupees ?? ((+r.amountRupees || 0) - (+r.lessRupees || 0)));
      default:
        return r[key];
    }
  }

  // Remember page size across sessions
  useEffect(() => {
    try {
      const saved = localStorage.getItem('review-page-size');
      if (saved) setSize(Number(saved));
    } catch { /* persist not available */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem('review-page-size', String(size)); } catch { /* ignore */ }
  }, [size]);

  // Persist visible columns
  useEffect(() => {
    try { localStorage.setItem('review-visible-cols', JSON.stringify(visibleCols)); } catch { /* ignore */ }
  }, [visibleCols]);
  // Persist column order
  useEffect(() => {
    try { localStorage.setItem('review-col-order', JSON.stringify(colOrder)); } catch { /* ignore */ }
  }, [colOrder]);
  // Persist column widths
  useEffect(() => {
    try { localStorage.setItem('review-col-widths', JSON.stringify(colWidths)); } catch { /* ignore */ }
  }, [colWidths]);

  const [confirmId, setConfirmId] = useState(null);
  const handleDelete = async (id) => { setConfirmId(id); };
  const doDelete = async () => {
    const id = confirmId;
    setConfirmId(null);
    try { await deleteReview(id); toast.show('Review deleted', 'success'); await loadReviews(); }
    catch (e) { console.error(e); toast.show('Delete failed', 'error'); }
  };

  // server-side sorting/filtering now handled in loadReviews

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(0);
  };

  // Avoid early returns before all hooks. Render loading in JSX instead.

  const toggleAll = (checked) => {
    if (checked) setSelected(new Set(reviews.map(r => r.id)));
    else setSelected(new Set());
  };
  const toggleOne = (id, checked) => {
    const next = new Set(selected);
    if (checked) next.add(id); else next.delete(id);
    setSelected(next);
  };

  const saveFilters = () => {
    setConfirm({
      open: true,
      title: 'Save Filters',
      message: 'Save current filters for next time?',
      onConfirm: () => {
        const data = { quickMode, search, fPlatformIds, fMediatorIds, fStatuses, fDealTypes, sortField, sortDir, size, overdue: overdueOnly, datePreset, dateRangeFrom: dateRangeFrom ? formatDate(dateRangeFrom) : null, dateRangeTo: dateRangeTo ? formatDate(dateRangeTo) : null };
        localStorage.setItem('review-filters', JSON.stringify(data));
        toast.show('Filters saved', 'success');
      }
    });
  };
  function loadFilters() {
    try {
      const s = localStorage.getItem('review-filters');
      if (!s) return;
      const d = JSON.parse(s);
      setQuickMode(d.quickMode || 'both');
      setSearch(d.search || '');
      setFPlatformIds(d.fPlatformIds || []);
      setFMediatorIds(d.fMediatorIds || []);
      setFStatuses(d.fStatuses || []);
      setFDealTypes(d.fDealTypes || []);
      setSortField(d.sortField || 'orderedDate');
      setSortDir(d.sortDir || 'desc');
      setSize(d.size || 10);
      setOverdueOnly(!!d.overdue);
      setDatePreset(d.datePreset || null);
      setDateRangeFrom(d.dateRangeFrom ? new Date(d.dateRangeFrom) : null);
      setDateRangeTo(d.dateRangeTo ? new Date(d.dateRangeTo) : null);
      // apply loaded filters initially
      setAPlatformIds(d.fPlatformIds || []);
      setAMediatorIds(d.fMediatorIds || []);
      setAStatuses(d.fStatuses || []);
      setADealTypes(d.fDealTypes || []);
      setASearch(d.search || '');
      setAQuickMode(d.quickMode || 'both');
      setPage(0);
    } catch { /* ignore */ }
  }



  const doBulkDelete = async () => {
    if (selected.size === 0) { toast.show('Select rows first', 'error'); return; }
    setConfirm({
      open: true,
      title: 'Delete Selected',
      message: `Delete ${selected.size} selected review(s)?`,
      onConfirm: async () => {
        try { await bulkDelete(Array.from(selected)); setSelected(new Set()); await loadReviews(); toast.show('Deleted', 'success'); }
        catch (e) { console.error(e); toast.show('Bulk delete failed', 'error'); }
      }
    });
  };

  const nextFieldFor = useCallback((r) => {
    const base = ['orderedDate', 'deliveryDate'];
    const type = r.dealType || 'REVIEW_SUBMISSION';
    const seq = type === 'REVIEW_PUBLISHED'
      ? [...base, 'reviewSubmitDate', 'reviewAcceptedDate', 'refundFormSubmittedDate', 'paymentReceivedDate']
      : type === 'RATING_ONLY'
        ? [...base, 'ratingSubmittedDate', 'refundFormSubmittedDate', 'paymentReceivedDate']
        : [...base, 'reviewSubmitDate', 'refundFormSubmittedDate', 'paymentReceivedDate'];
    for (const k of seq) if (!r[k]) return k;
    return null;
  }, []);

  const isOverdue = useCallback((r) => {
    if (!r.deliveryDate) return false;
    const nf = nextFieldFor(r);
    if (!nf) return false;
    const d = new Date(r.deliveryDate);
    if (Number.isNaN(d.getTime())) return false;
    const days = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
    return days > 7;
  }, [nextFieldFor]);

  const duplicateRow = (r) => {
    const clean = {
      orderId: '',
      orderLink: r.orderLink || '',
      productName: r.productName || '',
      platformId: r.platformId || '',
      mediatorId: r.mediatorId || '',
      dealType: r.dealType || '',
      amountRupees: r.amountRupees ?? '',
      lessRupees: r.lessRupees ?? '',
      orderedDate: null,
      deliveryDate: null,
      reviewSubmitDate: null,
      reviewAcceptedDate: null,
      ratingSubmittedDate: null,
      refundFormSubmittedDate: null,
      paymentReceivedDate: null,
      refundFormUrl: r.refundFormUrl || '',
    };
    navigate('/reviews/new', { state: { prefill: clean } });
  };

  async function doExport(selectedOnly = false) {
    try {
      if (selectedOnly) {
        const cols = ['orderId', 'orderLink', 'productName', 'dealType', 'platformId', 'mediatorId', 'amountRupees', 'lessRupees', 'refundAmountRupees', 'orderedDate', 'deliveryDate', 'reviewSubmitDate', 'reviewAcceptedDate', 'ratingSubmittedDate', 'refundFormSubmittedDate', 'paymentReceivedDate', 'refundFormUrl', 'status'];
        const selectedRows = reviews.filter(r => selected.has(r.id));
        const rows = [cols, ...selectedRows.map(r => [
          r.orderId, r.orderLink, r.productName, r.dealType, r.platformId, r.mediatorId,
          r.amountRupees ?? '', r.lessRupees ?? '', (r.refundAmountRupees ?? ((+r.amountRupees || 0) - (+r.lessRupees || 0))),
          r.orderedDate ?? '', r.deliveryDate ?? '', r.reviewSubmitDate ?? '', r.reviewAcceptedDate ?? '', r.ratingSubmittedDate ?? '', r.refundFormSubmittedDate ?? '', r.paymentReceivedDate ?? '',
          r.refundFormUrl || '',
          r.status ?? ''
        ])];
        const csv = rows.map(r => r.map(v => String(v).replaceAll('"', '""')).map(v => /[,"]/.test(v) ? `"${v}"` : v).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'reviews-selected.csv'; a.click(); URL.revokeObjectURL(url);
      } else {
        const res = await apiExportCsv();
        const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'reviews.csv';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error('Export failed', e);
      alert('Export failed');
    }
  }

  async function onImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await apiImportCsv(file);
      await loadReviews();
    } catch (err) {
      console.error('Import failed', err);
      alert('Import failed: ' + (err?.response?.data?.message || err.message));
    } finally {
      e.target.value = '';
    }
  }

  // close bulk/columns menu on outside click (row menu handled by DropdownPortal)
  useEffect(() => {
    const handler = (e) => {
      if (bulkRef.current && !bulkRef.current.contains(e.target)) setBulkOpen(false);
      if (columnsRef.current && !columnsRef.current.contains(e.target)) setColumnsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Ensure lookups are available when filters popover is opened
  useEffect(() => {
    if (!filtersOpen) return;
    // Default to Quick Presets on open
    setActiveFilter('presets');
    setOverdueDraft(overdueOnly);
    setDatePresetDraft(datePreset);
    setDateRangeDraft({ from: dateRangeFrom, to: dateRangeTo });
    (async () => {
      try {
        if (!platforms.length) { const p = await getPlatforms(); setPlatforms(p.data || []); }
        if (!mediators.length) { const m = await getMediators(); setMediators(m.data || []); }
      } catch { /* ignore */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersOpen]);

  // Reset advance date when the advance menu opens
  useEffect(() => {
    if (advancingRowId) {
      setAdvanceDate(formatDate(new Date()));
    }
  }, [advancingRowId]);

  return (
    <div>
      {/* Header */}
      <div className="p-6 rounded-t-xl bg-gradient-to-r from-indigo-50 via-white to-emerald-50">
        <h3 className="text-2xl font-bold text-gray-900">Reviews</h3>
        <div className="text-sm text-gray-600">Manage and track all reviews</div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="bg-white p-4 rounded-b-xl shadow animate-pulse">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="flex-1 min-w-56">
              <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
              <div className="flex gap-2">
                <div className="h-9 flex-1 bg-gray-200 rounded" />
                <div className="h-9 w-40 bg-gray-200 rounded" />
                <div className="h-9 w-24 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="flex gap-2 md:self-end">
              <div className="h-9 w-24 bg-gray-200 rounded" />
              <div className="h-9 w-28 bg-gray-200 rounded" />
              <div className="h-9 w-28 bg-gray-200 rounded" />
              <div className="h-9 w-28 bg-gray-200 rounded" />
            </div>
          </div>
          <div className="rounded shadow overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <th key={i} className="p-2 border">
                      <div className="h-4 bg-gray-200 rounded w-24" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 6 }).map((_, ri) => (
                  <tr key={ri} className="border-b">
                    {Array.from({ length: 9 }).map((_, ci) => (
                      <td key={ci} className="p-2">
                        <div className="h-4 bg-gray-200 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Body card */
        <div className="bg-white p-4 rounded-b-xl shadow text-gray-900">
          {/* Search and Toolbar (sticky) */}
          <div className="md:sticky md:top-0 md:z-20 bg-white mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between border-b border-gray-100 py-2">
            <div className="flex-1 min-w-56">
              <label className="block text-sm font-medium text-gray-700">Quick Search</label>
              <div className="flex gap-2 items-end flex-col sm:flex-row">
                <input id="quick-search-input" type="text" placeholder="Search by product or order ID" className="min-w-0 w-full sm:w-auto flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400" value={search} onChange={(e) => setSearch(e.target.value)} />
                <select className="w-full sm:w-56 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900" value={quickMode} onChange={(e) => { setQuickMode(e.target.value); setPage(0); }}>
                  <option value="both">Product + Order ID</option>
                  <option value="product">Product</option>
                  <option value="order">Order ID</option>
                </select>
                <button onClick={() => { setASearch(search); setAQuickMode(quickMode); setPage(0); loadReviews(); }} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md shadow">Search</button>
              </div>
              {/* Mobile quick filters */}
              <div className="hidden" />
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:self-end w-full md:w-auto">
              <div className="relative w-full md:w-auto" ref={filtersRef}>
                <button ref={filtersAnchorRef} onClick={() => setFiltersOpen(o => !o)} className="w-full md:w-auto px-3 py-2 border rounded-md border-gray-300 bg-white hover:bg-gray-50 text-gray-700">Filters ▾</button>
              </div>
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <div className="relative" ref={viewsRef}>
                  <button ref={viewsAnchorRef} onClick={() => setViewsOpen(o => !o)} className="flex-1 md:flex-none px-3 py-2 border rounded-md border-gray-300 bg-white hover:bg-gray-50 text-gray-700 w-full md:w-auto md:min-w-[110px]">Views ▾</button>
                  <DropdownPortal open={viewsOpen} anchorRef={viewsAnchorRef} onClose={() => setViewsOpen(false)} preferred="down" align="right" className="w-64 max-w-[95vw] p-2 text-sm text-gray-800">
                    <div className="flex gap-2 mb-2 min-w-0">
                      <input type="text" placeholder="New view name" className="border p-1 rounded flex-1 min-w-0 bg-white text-gray-900" id="new-view-name" />
                      <button className="px-2 py-1 bg-indigo-600 text-white rounded flex-shrink-0 whitespace-nowrap" onClick={async () => {
                        const name = document.getElementById('new-view-name')?.value?.trim();
                        if (!name) { toast.show('Enter view name', 'error'); return; }
                        const cfg = {
                          quickMode, search, fPlatformIds, fMediatorIds, fStatuses, fDealTypes,
                          sortField, sortDir, size, colOrder, visibleCols, overdue: overdueOnly,
                          datePreset, dateRangeFrom: dateRangeFrom ? formatDate(dateRangeFrom) : null, dateRangeTo: dateRangeTo ? formatDate(dateRangeTo) : null
                        };
                        try {
                          const res = await apiSaveView({ name, config: cfg });
                          setViews(v => [...v.filter(x => x.id !== res.data.id), res.data]);
                          toast.show('View saved', 'success');
                        } catch (e) { console.error(e); toast.show('Save view failed', 'error'); }
                      }}>Save</button>
                    </div>
                    <div className="max-h-60 overflow-auto">
                      {(views || []).map(v => (
                        <div key={v.id} className="flex items-center justify-between px-2 py-1 hover:bg-gray-50 rounded gap-2">
                          <button className="text-left flex-1" title="Apply view" onClick={() => {
                            try {
                              const cfg = v.config || {};
                              setQuickMode(cfg.quickMode || 'both');
                              setSearch(cfg.search || '');
                              setFPlatformIds(cfg.fPlatformIds || []);
                              setFMediatorIds(cfg.fMediatorIds || []);
                              setFStatuses(cfg.fStatuses || []);
                              setFDealTypes(cfg.fDealTypes || []);
                              setSortField(cfg.sortField || 'orderedDate');
                              setSortDir(cfg.sortDir || 'desc');
                              setSize(cfg.size || 10);
                              setColOrder(cfg.colOrder || defaultColOrder.slice());
                              setVisibleCols(cfg.visibleCols || visibleCols);
                              // Apply
                              setAPlatformIds(cfg.fPlatformIds || []);
                              setAMediatorIds(cfg.fMediatorIds || []);
                              setAStatuses(cfg.fStatuses || []);
                              setADealTypes(cfg.fDealTypes || []);
                              setASearch(cfg.search || '');
                              setAQuickMode(cfg.quickMode || 'both');
                              setOverdueOnly(!!cfg.overdue);
                              setDatePreset(cfg.datePreset || null);
                              setDateRangeFrom(cfg.dateRangeFrom ? new Date(cfg.dateRangeFrom) : null);
                              setDateRangeTo(cfg.dateRangeTo ? new Date(cfg.dateRangeTo) : null);
                              setPage(0);
                              loadReviews();
                              setViewsOpen(false);
                            } catch (e) { console.error(e); }
                          }}>{v.name}</button>
                          <button className="px-2 py-0.5 text-blue-600" title="Copy share link" onClick={async () => {
                            try {
                              let updated = v;
                              if (!v.shared) {
                                const res = await apiShareView(v.id);
                                updated = res.data;
                                setViews(list => list.map(x => x.id === updated.id ? updated : x));
                              }
                              const url = `${window.location.origin}/shared/${updated.slug}`;
                              await navigator.clipboard.writeText(url);
                              toast.show('Share link copied', 'success');
                            } catch (e) { console.error(e); toast.show('Share failed', 'error'); }
                          }}>Link</button>
                          {v.shared && (
                            <button className="px-2 py-0.5 text-gray-600" title="Disable link" onClick={async () => {
                              try { const res = await apiUnshareView(v.id); const u = res.data; setViews(list => list.map(x => x.id === u.id ? u : x)); toast.show('Sharing disabled', 'success'); } catch (e) { console.error(e); toast.show('Unshare failed', 'error'); }
                            }}>Unshare</button>
                          )}
                          <button className="px-2 py-0.5 text-red-600" title="Delete" onClick={async () => { try { await apiDeleteView(v.id); setViews(list => list.filter(x => x.id !== v.id)); } catch (e) { console.error(e); toast.show('Delete failed', 'error'); } }}>✕</button>
                        </div>
                      ))}
                    </div>
                  </DropdownPortal>
                </div>
                <div className="relative" ref={bulkRef}>
                  <button ref={bulkAnchorRef} onClick={() => setBulkOpen(o => !o)} className="flex-1 md:flex-none px-3 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-500 w-full md:w-auto md:min-w-[110px]">Bulk ▾</button>
                  <DropdownPortal open={bulkOpen} anchorRef={bulkAnchorRef} onClose={() => setBulkOpen(false)} preferred="down" align="right" className="w-60 p-1 text-gray-800">
                    <button className="block w-full text-left px-3 py-2 hover:bg-gray-50 inline-flex items-center gap-2" onClick={() => { setBulkOpen(false); if (selected.size === 0) { toast.show('Select rows first', 'error'); } else { setBulkEditOpen(true); } }}>
                      <PencilSquareIcon className="w-4 h-4" />
                      <span>Bulk Edit selected…</span>
                    </button>
                    <button className="block w-full text-left px-3 py-2 hover:bg-gray-50 inline-flex items-center gap-2" onClick={() => { setBulkOpen(false); if (selected.size === 0) { toast.show('Select rows first', 'error'); } else { setBulkAdvanceOpen(true); setBulkAdvanceDate(formatDate(new Date())); } }}>
                      <span className="w-4 h-4 inline-flex items-center justify-center">⏭</span>
                      <span>Advance selected…</span>
                    </button>
                    <button className="block w-full text-left px-3 py-2 hover:bg-gray-50 inline-flex items-center gap-2" onClick={() => { setBulkOpen(false); doExport(true); }}>
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      <span>Export selected</span>
                    </button>
                    <button className="block w-full text-left px-3 py-2 hover:bg-gray-50 inline-flex items-center gap-2" onClick={() => { setBulkOpen(false); doExport(false); }}>
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      <span>Export all</span>
                    </button>
                    <label className="block w-full text-left px-3 py-2 hover:bg-gray-50 cursor-pointer inline-flex items-center gap-2">
                      <ArrowUpTrayIcon className="w-4 h-4" />
                      <span>Import CSV</span>
                      <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { setBulkOpen(false); onImport(e); }} />
                    </label>
                    <button className="block w-full text-left px-3 py-2 hover:bg-gray-50 text-red-600 inline-flex items-center gap-2" onClick={() => { setBulkOpen(false); doBulkDelete(); }}>
                      <TrashIcon className="w-4 h-4" />
                      <span>Delete selected</span>
                    </button>
                  </DropdownPortal>
                </div>
                <div className="relative" ref={columnsRef}>
                  <button ref={columnsAnchorRef} onClick={() => setColumnsOpen(o => !o)} className="flex-1 md:flex-none px-3 py-2 border rounded-md border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center gap-2 text-gray-700 w-full md:w-auto md:min-w-[110px]"><AdjustmentsHorizontalIcon className="w-4 h-4" />Cols ▾</button>
                  <DropdownPortal open={columnsOpen} anchorRef={columnsAnchorRef} onClose={() => setColumnsOpen(false)} preferred="down" align="right" className="w-56 p-2 text-sm text-gray-800">
                    {[
                      { key: 'image', label: 'Image' },
                      { key: 'orderId', label: 'Order ID' },
                      { key: 'productName', label: 'Product' },
                      { key: 'platformName', label: 'Platform' },
                      { key: 'status', label: 'Status' },
                      { key: 'dealType', label: 'Deal Type' },
                      { key: 'mediatorName', label: 'Mediator' },
                      { key: 'amountRupees', label: 'Amount' },
                      { key: 'refundAmountRupees', label: 'Refund' },
                      { key: 'orderedDate', label: 'Ordered Date' },
                      { key: 'deliveryDate', label: 'Delivery Date' },
                      { key: 'reviewSubmitDate', label: 'Review Submitted' },
                      { key: 'reviewAcceptedDate', label: 'Review Accepted' },
                      { key: 'ratingSubmittedDate', label: 'Rating Submitted' },
                      { key: 'refundFormSubmittedDate', label: 'Refund Form Submitted' },
                      { key: 'paymentReceivedDate', label: 'Payment Received' },
                    ].map(c => (
                      <label key={c.key} className="flex items-center gap-2 p-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={!!visibleCols[c.key]}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setVisibleCols(v => ({ ...v, [c.key]: checked }));
                            if (checked) {
                              setColOrder(prev => prev.includes(c.key) ? prev : [...prev, c.key]);
                            }
                          }}
                        />
                        <span>{c.label}</span>
                      </label>
                    ))}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <button className="px-2 py-1 border rounded" onClick={() => {
                        try {
                          localStorage.setItem('review-visible-cols', JSON.stringify(visibleCols));
                          localStorage.setItem('review-col-order', JSON.stringify(colOrder));
                          localStorage.setItem('review-col-widths', JSON.stringify(colWidths));
                          setColumnsOpen(false);
                          toast.show('Column settings saved', 'success');
                        } catch { /* ignore */ }
                      }}>Save</button>
                      <button className="px-2 py-1 border rounded" onClick={() => {
                        try {
                          const v = JSON.parse(localStorage.getItem('review-visible-cols') || 'null');
                          const o = JSON.parse(localStorage.getItem('review-col-order') || 'null');
                          const w = JSON.parse(localStorage.getItem('review-col-widths') || 'null');
                          if (v) setVisibleCols(v);
                          if (o) setColOrder(o);
                          if (w) setColWidths(w);
                          toast.show('Loaded saved view', 'success');
                        } catch { /* ignore */ }
                      }}>Load</button>
                      <button className="px-2 py-1 border rounded" onClick={() => {
                        setVisibleCols({ image: true, orderId: true, productName: true, platformName: true, status: true, dealType: true, mediatorName: true, amountRupees: true, refundAmountRupees: true, orderedDate: true, deliveryDate: false, reviewSubmitDate: false, reviewAcceptedDate: false, ratingSubmittedDate: false, refundFormSubmittedDate: false, paymentReceivedDate: false });
                        setColOrder(['image', 'orderId', 'productName', 'platformName', 'status', 'dealType', 'mediatorName', 'amountRupees', 'refundAmountRupees', 'orderedDate', 'deliveryDate', 'reviewSubmitDate', 'reviewAcceptedDate', 'ratingSubmittedDate', 'refundFormSubmittedDate', 'paymentReceivedDate']);
                        setColWidths({});
                        toast.show('Column settings reset', 'success');
                      }}>Reset</button>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <button className="px-2 py-1 border rounded" onClick={() => {
                        const compact = { image: true, orderId: true, productName: true, platformName: false, status: true, dealType: false, mediatorName: false, amountRupees: false, refundAmountRupees: true, orderedDate: true, deliveryDate: false, reviewSubmitDate: false, reviewAcceptedDate: false, ratingSubmittedDate: false, refundFormSubmittedDate: false, paymentReceivedDate: false };
                        setVisibleCols(compact);
                        toast.show('Compact columns applied', 'success');
                      }}>Compact</button>
                      <button className="px-2 py-1 border rounded" onClick={() => {
                        const full = { image: true, orderId: true, productName: true, platformName: true, status: true, dealType: true, mediatorName: true, amountRupees: true, refundAmountRupees: true, orderedDate: true, deliveryDate: true, reviewSubmitDate: true, reviewAcceptedDate: true, ratingSubmittedDate: true, refundFormSubmittedDate: true, paymentReceivedDate: true };
                        setVisibleCols(full);
                        toast.show('All columns shown', 'success');
                      }}>All</button>
                    </div>
                  </DropdownPortal>
                </div>
              </div>
              <button onClick={() => navigate("/reviews/new")} className="hidden md:inline-flex bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-md items-center gap-2 shadow"><PlusIcon className="w-4 h-4" /><span>Add</span></button>
            </div>
          </div>

          {/* Filters Popover */}
          <DropdownPortal open={filtersOpen} anchorRef={filtersAnchorRef} onClose={() => setFiltersOpen(false)} preferred="down" align="right" className="p-3 text-sm text-gray-900 w-[90vw] max-w-3xl md:w-[800px]">
            <div className="max-h-[70vh] overflow-auto">
              <div className="md:grid md:grid-cols-12 gap-4">
                <div className="md:col-span-4">
                  <div className="flex gap-2 md:flex-col overflow-x-auto no-scrollbar">
                    <button type="button" title="Quick presets" onClick={() => setActiveFilter('presets')} className={`w-full text-left px-3 py-2 border rounded inline-flex items-center gap-2 ${activeFilter === 'presets' ? 'bg-indigo-50 text-indigo-700 border-indigo-300' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                      <SparklesIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">Quick Presets</span>
                    </button>
                    <button type="button" title="Filter by platform" onClick={() => setActiveFilter('platform')} className={`w-full text-left px-3 py-2 border rounded inline-flex items-center gap-2 ${activeFilter === 'platform' ? 'bg-indigo-50 text-indigo-700 border-indigo-300' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                      <Squares2X2Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">Platform</span>
                    </button>
                    <button type="button" title="Filter by status" onClick={() => setActiveFilter('status')} className={`w-full text-left px-3 py-2 border rounded inline-flex items-center gap-2 ${activeFilter === 'status' ? 'bg-indigo-50 text-indigo-700 border-indigo-300' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                      <ListBulletIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">Status</span>
                    </button>
                    <button type="button" title="Filter by deal type" onClick={() => setActiveFilter('deal')} className={`w-full text-left px-3 py-2 border rounded inline-flex items-center gap-2 ${activeFilter === 'deal' ? 'bg-indigo-50 text-indigo-700 border-indigo-300' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                      <TagIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">Deal Type</span>
                    </button>
                    <button type="button" title="Filter by mediator" onClick={() => setActiveFilter('mediator')} className={`w-full text-left px-3 py-2 border rounded inline-flex items-center gap-2 ${activeFilter === 'mediator' ? 'bg-indigo-50 text-indigo-700 border-indigo-300' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                      <UserGroupIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">Mediator</span>
                    </button>
                  </div>
                </div>
                <div className="md:col-span-8">
                  {/* Active filter content */}
                  {activeFilter === 'presets' && (
                    <div className="bg-white rounded border p-3">
                      <div className="font-medium mb-2">Quick Presets</div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className="px-2 py-1 border rounded hover:bg-gray-50 text-gray-700" onClick={() => { setFStatuses([]); setOverdueDraft(false); setDatePresetDraft(null); setDateRangeDraft({ from: null, to: null }); }}>Clear presets</button>
                        <button
                          type="button"
                          className={`px-2 py-1 border rounded transition-colors ${overdueDraft ? 'bg-indigo-100 text-indigo-700 border-indigo-300 hover:bg-indigo-200' : 'text-gray-700 hover:bg-gray-50'}`}
                          onClick={() => { setFStatuses([]); setOverdueDraft(true); setDatePresetDraft(null); }}
                        >Overdue Since Delivery</button>
                        <button
                          type="button"
                          className={`px-2 py-1 border rounded transition-colors ${datePresetDraft === 'delivered7' ? 'bg-indigo-100 text-indigo-700 border-indigo-300 hover:bg-indigo-200' : 'text-gray-700 hover:bg-gray-50'}`}
                          onClick={() => { setFStatuses([]); setOverdueDraft(false); setDatePresetDraft('delivered7'); setDateRangeDraft({ from: null, to: null }); }}
                        >Delivered last 7 days</button>
                        <button
                          type="button"
                          className={`px-2 py-1 border rounded transition-colors ${datePresetDraft === 'delivered30' ? 'bg-indigo-100 text-indigo-700 border-indigo-300 hover:bg-indigo-200' : 'text-gray-700 hover:bg-gray-50'}`}
                          onClick={() => { setFStatuses([]); setOverdueDraft(false); setDatePresetDraft('delivered30'); }}
                        >Delivered last 30 days</button>
                        <button
                          type="button"
                          className={`px-2 py-1 border rounded transition-colors ${datePresetDraft === 'delivered90' ? 'bg-indigo-100 text-indigo-700 border-indigo-300 hover:bg-indigo-200' : 'text-gray-700 hover:bg-gray-50'}`}
                          onClick={() => { setFStatuses([]); setOverdueDraft(false); setDatePresetDraft('delivered90'); setDateRangeDraft({ from: null, to: null }); }}
                        >Delivered last 90 days</button>
                        <button
                          type="button"
                          className="px-2 py-1 border rounded text-gray-700 transition-colors hover:bg-gray-50"
                          onClick={() => { setFStatuses(['ordered', 'delivered']); setOverdueDraft(false); setDatePresetDraft(null); }}
                        >Pending Review/Rating</button>
                        <button
                          type="button"
                          className="px-2 py-1 border rounded text-gray-700 transition-colors hover:bg-gray-50"
                          onClick={() => { setFStatuses(['review submitted', 'review accepted', 'rating submitted']); setOverdueDraft(false); setDatePresetDraft(null); }}
                        >Pending Refund Form</button>
                        <button
                          type="button"
                          className="px-2 py-1 border rounded text-gray-700 transition-colors hover:bg-gray-50"
                          onClick={() => { setFStatuses(['refund form submitted']); setOverdueDraft(false); setDatePresetDraft(null); }}
                        >Pending Payment</button>
                      </div>
                      <div className="mt-3">
                        <div className="text-sm font-medium mb-1">Custom delivery date range</div>
                        <div className="flex items-center gap-2">
                          <DatePicker
                            selected={fromDraftDate}
                            startDate={fromDraftDate}
                            endDate={toDraftDate}
                            selectsStart
                            open={openDatePicker === 'from'}
                            onInputClick={() => setOpenDatePicker((prev) => prev === 'from' ? null : 'from')}
                            onFocus={() => setOpenDatePicker('from')}
                            onChange={(d) => { setDateRangeDraft(prev => ({ ...prev, from: d || null })); setDatePresetDraft('range'); setOverdueDraft(false); setOpenDatePicker(null); }}
                            onCalendarClose={() => setOpenDatePicker(null)}
                            onClickOutside={() => setOpenDatePicker(null)}
                            onKeyDown={(e) => { if (e.key === 'Escape') setOpenDatePicker(null); }}
                            shouldCloseOnSelect
                            placeholderText="From"
                            className="border p-1 rounded bg-white text-gray-900"
                          />
                          <span className="text-gray-500">to</span>
                          <DatePicker
                            selected={toDraftDate}
                            startDate={fromDraftDate}
                            endDate={toDraftDate}
                            selectsEnd
                            minDate={fromDraftDate || undefined}
                            open={openDatePicker === 'to'}
                            onInputClick={() => setOpenDatePicker((prev) => prev === 'to' ? null : 'to')}
                            onFocus={() => setOpenDatePicker('to')}
                            onChange={(d) => { setDateRangeDraft(prev => ({ ...prev, to: d || null })); setDatePresetDraft('range'); setOverdueDraft(false); setOpenDatePicker(null); }}
                            onCalendarClose={() => setOpenDatePicker(null)}
                            onClickOutside={() => setOpenDatePicker(null)}
                            onKeyDown={(e) => { if (e.key === 'Escape') setOpenDatePicker(null); }}
                            shouldCloseOnSelect
                            placeholderText="To"
                            className="border p-1 rounded bg-white text-gray-900"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {activeFilter === 'platform' && (
                    <div className="bg-white rounded border p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">Platform</div>
                        <div className="flex items-center gap-2">
                          <button type="button" title="Select all" aria-label="Select all" className="p-1 rounded hover:bg-gray-50" onClick={() => setFPlatformIds(platforms.map(p => p.id))}><CheckCircleIcon className="w-4 h-4 text-indigo-600" /></button>
                          <button type="button" title="Deselect all" aria-label="Deselect all" className="p-1 rounded hover:bg-gray-50" onClick={() => setFPlatformIds([])}><XMarkIcon className="w-4 h-4 text-gray-600" /></button>
                        </div>
                      </div>
                      <div className="mt-2 max-h-40 overflow-auto space-y-1 no-scrollbar">
                        {platforms.map(p => (
                          <label key={p.id} className="flex items-center gap-2 text-sm text-gray-800">
                            <input type="checkbox" checked={fPlatformIds.includes(p.id)} onChange={(e) => {
                              setFPlatformIds(prev => e.target.checked ? [...prev, p.id] : prev.filter(x => x !== p.id));
                            }} />
                            <span>{p.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {activeFilter === 'status' && (
                    <div className="bg-white rounded border p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">Status</div>
                        <div className="flex items-center gap-2">
                          <button type="button" title="Select all" aria-label="Select all" className="p-1 rounded hover:bg-gray-50" onClick={() => setFStatuses(statusOptions.slice())}><CheckCircleIcon className="w-4 h-4 text-indigo-600" /></button>
                          <button type="button" title="Deselect all" aria-label="Deselect all" className="p-1 rounded hover:bg-gray-50" onClick={() => setFStatuses([])}><XMarkIcon className="w-4 h-4 text-gray-600" /></button>
                        </div>
                      </div>
                      <div className="mt-2 max-h-40 overflow-auto space-y-1 no-scrollbar">
                        {statusOptions.map(s => (
                          <label key={s} className="flex items-center gap-2 text-sm capitalize text-gray-800">
                            <input type="checkbox" checked={fStatuses.includes(s)} onChange={(e) => {
                              setFStatuses(prev => e.target.checked ? [...prev, s] : prev.filter(x => x !== s));
                            }} />
                            <span>{s}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {activeFilter === 'deal' && (
                    <div className="bg-white rounded border p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">Deal Type</div>
                        <div className="flex items-center gap-2">
                          <button type="button" title="Select all" aria-label="Select all" className="p-1 rounded hover:bg-gray-50" onClick={() => setFDealTypes(dealTypeOptions.map(d => d.value))}><CheckCircleIcon className="w-4 h-4 text-indigo-600" /></button>
                          <button type="button" title="Deselect all" aria-label="Deselect all" className="p-1 rounded hover:bg-gray-50" onClick={() => setFDealTypes([])}><XMarkIcon className="w-4 h-4 text-gray-600" /></button>
                        </div>
                      </div>
                      <div className="mt-2 max-h-40 overflow-auto space-y-1 no-scrollbar">
                        {dealTypeOptions.map(d => (
                          <label key={d.value} className="flex items-center gap-2 text-sm text-gray-800">
                            <input type="checkbox" checked={fDealTypes.includes(d.value)} onChange={(e) => {
                              setFDealTypes(prev => e.target.checked ? [...prev, d.value] : prev.filter(x => x !== d.value));
                            }} />
                            <span>{d.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {activeFilter === 'mediator' && (
                    <div className="bg-white rounded border p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">Mediator</div>
                        <div className="flex items-center gap-2">
                          <button type="button" title="Select all" aria-label="Select all" className="p-1 rounded hover:bg-gray-50" onClick={() => setFMediatorIds(mediators.map(m => m.id))}><CheckCircleIcon className="w-4 h-4 text-indigo-600" /></button>
                          <button type="button" title="Deselect all" aria-label="Deselect all" className="p-1 rounded hover:bg-gray-50" onClick={() => setFMediatorIds([])}><XMarkIcon className="w-4 h-4 text-gray-600" /></button>
                        </div>
                      </div>
                      <input className="mt-2 border p-1 rounded w-full text-sm text-gray-900 placeholder-gray-400 bg-white" placeholder="Search name or phone" value={mediatorQuery} onChange={(e) => setMediatorQuery(e.target.value)} />
                      <div className="mt-2 max-h-40 overflow-auto space-y-1 no-scrollbar">
                        {filteredMediators.map(m => (
                          <label key={m.id} className="flex items-center gap-2 text-sm text-gray-800">
                            <input type="checkbox" checked={fMediatorIds.includes(m.id)} onChange={(e) => {
                              setFMediatorIds(prev => e.target.checked ? [...prev, m.id] : prev.filter(x => x !== m.id));
                            }} />
                            <span>{m.name} {m.phone ? `· ${m.phone}` : ''}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-end gap-2 sm:justify-start">
                <button
                  onClick={() => { setAPlatformIds(fPlatformIds); setAMediatorIds(fMediatorIds); setAStatuses(fStatuses); setADealTypes(fDealTypes); setOverdueOnly(overdueDraft); setDatePreset(datePresetDraft); setDateRangeFrom(dateRangeDraft.from || null); setDateRangeTo(dateRangeDraft.to || null); setPage(0); loadReviews(); setFiltersOpen(false); }}
                  className="flex-none rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 sm:px-4 sm:py-2 sm:text-sm"
                >Apply</button>
                <button
                  onClick={() => setConfirm({ open: true, title: 'Clear Filters', message: 'Clear all selected filters?', onConfirm: () => { setFPlatformIds([]); setFMediatorIds([]); setFStatuses([]); setFDealTypes([]); } })}
                  className="flex-none rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:px-4 sm:py-2 sm:text-sm"
                >Clear</button>
                <button
                  onClick={saveFilters}
                  className="flex-none rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:px-4 sm:py-2 sm:text-sm"
                >Save</button>
              </div>
            </div>
          </DropdownPortal>
          {/* Pagination */}
          <div className="flex items-center justify-between mb-3 text-sm text-gray-700">
            <div>
              Page {page + 1} of {Math.max(totalPages, 1)} • {totalElements} items
            </div>
            <div className="space-x-2 flex items-center">
              <button disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="px-3 py-1 border rounded disabled:opacity-50" title="Previous">‹</button>
              <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} className="px-3 py-1 border rounded disabled:opacity-50" title="Next">›</button>
              <select value={size} onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }} className="ml-2 border p-1 rounded bg-white text-gray-900">
                {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}/page</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          <div
            ref={tableWrapRef}
            className="relative rounded shadow overflow-auto pb-12 md:pb-0"
            style={{
              // Give the table its own scrollable area so sticky header/virtualization work reliably
              maxHeight: '70vh',
            }}
          >
            {headElevated && (
              <div className="hidden md:block pointer-events-none absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-gray-300/40 to-transparent" />
            )}
            <table className="w-full border-collapse bg-white text-sm">
              <thead className={`text-gray-700 md:sticky md:top-0 md:z-10 ${headElevated ? 'md:shadow-md' : ''}`}>
                <tr className="bg-gray-100 text-left select-none md:bg-gray-100/95 md:backdrop-blur">
                  <th className="p-2 border"><input type="checkbox" aria-label="Select all" checked={selected.size > 0 && selected.size === reviews.length} onChange={(e) => toggleAll(e.target.checked)} /></th>
                  {colOrder.filter(k => visibleCols[k]).map((key) => {
                    const labels = {
                      image: 'IMG',
                      orderId: 'Order ID',
                      productName: 'Product',
                      platformName: 'Platform',
                      status: 'Status',
                      dealType: 'Deal Type',
                      mediatorName: 'Mediator',
                      amountRupees: 'Amount',
                      refundAmountRupees: 'Refund',
                      orderedDate: 'Ordered',
                      deliveryDate: 'Delivery',
                      reviewSubmitDate: 'Review Submitted',
                      reviewAcceptedDate: 'Review Accepted',
                      ratingSubmittedDate: 'Rating Submitted',
                      refundFormSubmittedDate: 'Refund Form',
                      paymentReceivedDate: 'Payment Received'
                    };
                    const isDateCol = dateColumns.includes(key);
                    return (
                      <th
                        key={key}
                        className={`p-2 border cursor-pointer relative group ${isDateCol ? 'whitespace-nowrap' : ''}`}
                        onClick={() => toggleSort(key)}
                        title="Click to sort"
                        draggable
                        onDragStart={() => setDragKey(key)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => { e.preventDefault(); if (!dragKey || dragKey === key) return; setColOrder(prev => { const p = prev.slice(); const from = p.indexOf(dragKey); const to = p.indexOf(key); if (from < 0 || to < 0) return prev; p.splice(from, 1); p.splice(to, 0, dragKey); return p; }); setDragKey(null); }}
                        style={{ width: colWidths[key] ? `${colWidths[key]}px` : undefined, minWidth: colWidths[key] ? `${colWidths[key]}px` : undefined }}
                      >
                        {labels[key]}{sortField === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                        <span
                          onMouseDown={(e) => {
                            e.preventDefault();
                            const startX = e.clientX;
                            const startW = (colWidths[key] || (e.currentTarget.parentElement?.offsetWidth)) || 150;
                            const onMove = (ev) => {
                              const delta = ev.clientX - startX;
                              const next = Math.max(80, startW + delta);
                              setColWidths(w => ({ ...w, [key]: next }));
                            };
                            const onUp = () => {
                              window.removeEventListener('mousemove', onMove);
                              window.removeEventListener('mouseup', onUp);
                            };
                            window.addEventListener('mousemove', onMove);
                            window.addEventListener('mouseup', onUp);
                          }}
                          className="absolute top-0 right-0 h-full w-1 cursor-col-resize opacity-0 group-hover:opacity-100 bg-transparent"
                          role="separator"
                          aria-orientation="vertical"
                          aria-label={`Resize ${labels[key]} column`}
                        />
                      </th>
                    );
                  })}
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody style={{ position: 'relative' }}>
                {topPad > 0 && (
                  <tr aria-hidden="true"><td colSpan={visibleCountCols} style={{ height: topPad, padding: 0, border: 0 }} /></tr>
                )}
                {virtualRows.map((vr) => {
                  const r = reviews[vr.index];
                  const idx = vr.index;
                  return (
                    <tr ref={rowVirtualizer.measureElement} key={r.id} className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${isOverdue(r) ? 'bg-red-50' : ''}`}>
                      <td className="p-2"><input type="checkbox" aria-label={`Select ${r.orderId}`} checked={selected.has(r.id)} onChange={(e) => toggleOne(r.id, e.target.checked)} /></td>
                      {colOrder.filter(k => visibleCols[k]).map(key => {
                        const isDateCol = dateColumns.includes(key);
                        return (
                          <td
                            key={key}
                            className={`p-2 ${(key === 'orderId' || isDateCol) ? 'whitespace-nowrap' : ''} ${key === 'status' ? 'text-center' : ''}`}
                            style={{ width: colWidths[key] ? `${colWidths[key]}px` : undefined }}
                          >{renderCell(key, r)}</td>
                        );
                      })}
                      <td className="p-2">
                        <div className="relative inline-block">
                          <button
                            className="px-2 py-1 border rounded-md border-gray-300 bg-white hover:bg-gray-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              const sameRowOpen = openRowMenu === r.id || advancingRowId === r.id;
                              if (sameRowOpen) {
                                closeRowMenus();
                              } else {
                                rowMenuAnchorRef.current = e.currentTarget;
                                setAdvancingRowId(null);
                                setOpenRowMenu(r.id);
                              }
                            }}
                            aria-haspopup="menu"
                            aria-expanded={openRowMenu === r.id || advancingRowId === r.id}
                          >
                            <EllipsisVerticalIcon className="w-5 h-5 text-gray-600" />
                          </button>
                          <DropdownPortal open={openRowMenu === r.id} anchorRef={rowMenuAnchorRef} onClose={closeRowMenus} preferred="up" align="right" className="w-44 overflow-hidden text-gray-800">
                            <button className="block w-full text-left px-3 py-2 hover:bg-gray-50 inline-flex items-center gap-2" onClick={() => { closeRowMenus(); navigate(`/reviews/edit/${r.id}`); }}>
                              <PencilSquareIcon className="w-4 h-4" />
                              <span>Edit</span>
                            </button>
                            <button className="block w-full text-left px-3 py-2 hover:bg-gray-50 inline-flex items-center gap-2" onClick={() => { closeRowMenus(); duplicateRow(r); }}>
                              <DocumentDuplicateIcon className="w-4 h-4" />
                              <span>Duplicate</span>
                            </button>
                            <button className="block w-full text-left px-3 py-2 hover:bg-gray-50 inline-flex items-center gap-2" onClick={() => { setOpenRowMenu(null); setAdvancingRowId(r.id); }}>
                              <span className="w-4 h-4 inline-flex items-center justify-center">⏭</span>
                              <span>Advance next step…</span>
                            </button>
                            <button className="block w-full text-left px-3 py-2 hover:bg-gray-50 text-red-600 inline-flex items-center gap-2" onClick={() => { closeRowMenus(); handleDelete(r.id); }}>
                              <TrashIcon className="w-4 h-4" />
                              <span>Delete</span>
                            </button>
                            {r.mediatorId && mediatorMap[r.mediatorId] && (
                              <a
                                href={`https://wa.me/${(mediatorMap[r.mediatorId]?.phone || "").replace(/^\+/, '')}?text=${encodeURIComponent(`Hi ${mediatorMap[r.mediatorId]?.name || ""}, regarding order ${r.orderId}`)}`}
                                target="_blank" rel="noopener noreferrer"
                                className="block w-full text-left px-3 py-2 hover:bg-gray-50 text-green-700 inline-flex items-center gap-2 border-t"
                                onClick={closeRowMenus}
                              >
                                <ChatBubbleLeftRightIcon className="w-4 h-4" />
                                <span>WhatsApp Follow-up</span>
                              </a>
                            )}
                            {r.refundFormUrl && (
                              <a
                                href={r.refundFormUrl}
                                target="_blank" rel="noopener noreferrer"
                                className="block w-full text-left px-3 py-2 hover:bg-gray-50 text-orange-700 inline-flex items-center gap-2 border-t"
                                onClick={closeRowMenus}
                              >
                                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                                <span>Submit Refund Form</span>
                              </a>
                            )}
                          </DropdownPortal>
                          <DropdownPortal open={advancingRowId === r.id} anchorRef={rowMenuAnchorRef} onClose={closeRowMenus} preferred="up" align="right" className="w-60 p-2 text-gray-800">
                            {(() => {
                              const nf = nextFieldFor(r);
                              if (!nf) return <div className="px-2 py-1 text-sm">No further steps.</div>;
                              return (
                                <div className="text-sm">
                                  <div className="mb-1 text-gray-600">Set {nf.replace(/([A-Z])/g, ' $1')} date</div>
                                  <div className="flex items-center gap-2">
                                    <DatePicker
                                      selected={advanceDate ? new Date(advanceDate) : null}
                                      onChange={(d) => setAdvanceDate(formatDate(d))}
                                      className="border p-1 rounded w-full bg-white text-gray-900"
                                    />
                                    <button className="px-2 py-1 bg-blue-600 text-white rounded" onClick={async () => {
                                      const dateStr = advanceDate;
                                      if (!dateStr) return;
                                      try {
                                        await advanceReview(r.id, dateStr);
                                        toast.show('Advanced', 'success');
                                        setAdvancingRowId(null);
                                        closeRowMenus();
                                        await loadReviews();
                                      } catch (err) { console.error(err); toast.show('Advance failed', 'error'); }
                                    }}>Save</button>
                                  </div>
                                </div>
                              );
                            })()}
                          </DropdownPortal>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {bottomPad > 0 && (
                  <tr aria-hidden="true"><td colSpan={visibleCountCols} style={{ height: bottomPad, padding: 0, border: 0 }} /></tr>
                )}
                {reviews.length === 0 && (
                  <tr>
                    <td colSpan={visibleCountCols} className="p-4 text-center text-gray-500">
                      No reviews found.
                    </td>
                  </tr>
                )}
              </tbody>
              {reviews.length > 0 && (() => {
                const serverAmount = aggTotals?.totalAmount ?? null;
                const serverRefund = aggTotals?.totalRefund ?? null;
                const totalAmount = serverAmount != null ? Number(serverAmount) : reviews.reduce((s, r) => s + (+r.amountRupees || 0), 0);
                const totalRefund = serverRefund != null ? Number(serverRefund) : reviews.reduce((s, r) => s + (+(r.refundAmountRupees ?? ((+r.amountRupees || 0) - (+r.lessRupees || 0))) || 0), 0);
                const selectedRefund = reviews.filter(r => selected.has(r.id)).reduce((s, r) => s + (+(r.refundAmountRupees ?? ((+r.amountRupees || 0) - (+r.lessRupees || 0))) || 0), 0);
                const showAmount = !!visibleCols.amountRupees;
                const showRefund = !!visibleCols.refundAmountRupees;
                const midSpan = colOrder.filter(k => visibleCols[k] && !['amountRupees', 'refundAmountRupees'].includes(k)).length;
                return (
                  <tfoot className="md:sticky md:bottom-0 bg-white">
                    <tr className="bg-gray-50 border-t">
                      <td className="p-2 font-semibold">Totals</td>
                      <td className="p-2 text-sm text-gray-600" colSpan={midSpan}>Selected: {selected.size} • Selected Refund: {formatCurrency(selectedRefund)}</td>
                      {showAmount && (<td className="p-2 font-semibold">{formatCurrency(totalAmount)}</td>)}
                      {showRefund && (<td className="p-2 font-semibold">{formatCurrency(totalRefund)}</td>)}
                      <td className="p-2"></td>
                    </tr>
                  </tfoot>
                );
              })()}
            </table>
          </div>
        </div>
      )}
      {/* Keyboard shortcuts */}
      <Shortcuts onAdvance={() => { if (selected.size > 0) setBulkAdvanceOpen(true); }} onFocusSearch={() => document.getElementById('quick-search-input')?.focus()} onDelete={() => doBulkDelete()} />
      <Modal open={!!confirmId} title="Delete Review" onClose={() => setConfirmId(null)}>
        <p className="mb-4 text-gray-700">Are you sure you want to delete this review?</p>
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1 border rounded" onClick={() => setConfirmId(null)}>Cancel</button>
          <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={doDelete}>Delete</button>
        </div>
      </Modal>
      <Modal open={bulkAdvanceOpen} title="Advance Selected" onClose={() => setBulkAdvanceOpen(false)}>
        <div className="space-y-3">
          <div className="text-sm text-gray-700">Advance next step for {selected.size} selected review(s).</div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Date</label>
            <input type="date" className="border p-1 rounded bg-white text-gray-900" value={bulkAdvanceDate} onChange={(e) => setBulkAdvanceDate(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="px-3 py-1 border rounded" onClick={() => setBulkAdvanceOpen(false)}>Cancel</button>
            <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={async () => {
              if (selected.size === 0) { toast.show('Select rows first', 'error'); return; }
              try {
                await bulkAdvance(Array.from(selected), bulkAdvanceDate);
                toast.show('Advanced', 'success');
                setBulkAdvanceOpen(false);
                setSelected(new Set());
                await loadReviews();
              } catch (e) { console.error(e); toast.show('Bulk advance failed', 'error'); }
            }}>Advance</button>
          </div>
        </div>
      </Modal>
      <Modal open={confirm.open} title={confirm.title} onClose={() => setConfirm({ open: false, title: '', message: '', onConfirm: null })}>
        <p className="mb-4 text-gray-700">{confirm.message}</p>
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1 border rounded" onClick={() => setConfirm({ open: false, title: '', message: '', onConfirm: null })}>Cancel</button>
          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => { const cb = confirm.onConfirm; setConfirm({ open: false, title: '', message: '', onConfirm: null }); cb?.(); }}>Confirm</button>
        </div>
      </Modal>
      <BulkEditModal
        open={bulkEditOpen}
        onClose={() => setBulkEditOpen(false)}
        selectedCount={selected.size}
        platforms={platforms}
        mediators={mediators}
        statusOptions={statusOptions}
        onSave={async (updates) => {
          try {
            await bulkUpdate(Array.from(selected), updates);
            toast.show(`Updated ${selected.size} reviews`, 'success');
            setSelected(new Set());
            setBulkEditOpen(false);
            await loadReviews();
          } catch (err) {
            console.error(err);
            toast.show('Bulk update failed', 'error');
          }
        }}
      />
    </div>
  );
}

function BulkEditModal({ open, onClose, selectedCount, platforms, mediators, statusOptions, onSave }) {
  const [updates, setUpdates] = useState({});
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Bulk Edit (${selectedCount} reviews)`}>
      <div className="p-4 space-y-4">
        <p className="text-sm text-gray-600">Only fields with values will be updated.</p>

        <div>
          <label className="block text-sm font-medium text-gray-700">Platform</label>
          <select
            className="mt-1 w-full border rounded p-2 bg-white text-gray-900"
            value={updates.platformId || ""}
            onChange={e => setUpdates(prev => ({ ...prev, platformId: e.target.value }))}
          >
            <option value="">No change</option>
            {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Mediator</label>
          <select
            className="mt-1 w-full border rounded p-2 bg-white text-gray-900"
            value={updates.mediatorId || ""}
            onChange={e => setUpdates(prev => ({ ...prev, mediatorId: e.target.value }))}
          >
            <option value="">No change</option>
            {mediators.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            className="mt-1 w-full border rounded p-2 bg-white text-gray-900"
            value={updates.status || ""}
            onChange={e => setUpdates(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">No change</option>
            {statusOptions.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2 p-4 border-t">
        <button className="px-4 py-2 border rounded hover:bg-gray-50" onClick={onClose}>Cancel</button>
        <button
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          disabled={saving || Object.keys(updates).length === 0}
          onClick={async () => {
            setSaving(true);
            try { await onSave(updates); } finally { setSaving(false); }
          }}
        >
          {saving ? "Saving..." : "Apply Updates"}
        </button>
      </div>
    </Modal>
  );
}

function Shortcuts({ onAdvance, onFocusSearch, onDelete }) {
  useEffect(() => {
    const handler = (e) => {
      const target = e.target;
      const isEditable = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable || target.tagName === 'SELECT');
      if (isEditable) return;
      if (e.key === '/') { e.preventDefault(); onFocusSearch?.(); }
      if (e.key === 'a' || e.key === 'A') { onAdvance?.(); }
      if (e.key === 'Delete') { onDelete?.(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onAdvance, onFocusSearch, onDelete]);
  return null;
}

function dealTypeLabel(code) {
  switch (code) {
    case 'REVIEW_PUBLISHED': return 'Review Published';
    case 'REVIEW_SUBMISSION': return 'Review Submission';
    case 'RATING_ONLY': return 'Rating Only';
    default: return code || '-';
  }
}

function statusClass(s) {
  const key = String(s || '').toLowerCase();
  const map = {
    'ordered': 'bg-slate-100 text-slate-700',
    'delivered': 'bg-sky-100 text-sky-700',
    'review submitted': 'bg-amber-100 text-amber-700',
    'review accepted': 'bg-emerald-100 text-emerald-700',
    'rating submitted': 'bg-violet-100 text-violet-700',
    'refund form submitted': 'bg-orange-100 text-orange-700',
    'payment received': 'bg-green-100 text-green-700',
  };
  return map[key] || 'bg-gray-100 text-gray-700';
}
