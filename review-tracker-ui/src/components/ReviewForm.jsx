import { useForm, Controller } from "react-hook-form";
import DatePicker from "react-datepicker";
import { InformationCircleIcon, PencilSquareIcon, ArrowPathIcon, ChevronDownIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState, useMemo, useRef } from "react";
import { createReview, updateReview } from "../api/reviews";
import useToast from "./useToast";
import { getPlatforms, getMediators } from "../api/lookups";

export default function ReviewForm({ review, initialValues, onSuccess, onCancel }) {
  const toast = useToast();
  const defaultValues = {
    orderId: "",
    orderLink: "",
    productName: "",
    platformId: "",
    mediatorId: "",
    dealType: "",
    // No numeric defaults; leave empty until user enters values
    orderedDate: null,
    deliveryDate: null,
    reviewSubmitDate: null,
    refundFormSubmittedDate: null,
    paymentReceivedDate: null
  };
  const { register, handleSubmit, control, watch, formState: { errors }, reset, setValue } = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: review || initialValues || defaultValues,
  });

  const [platforms, setPlatforms] = useState([]);
  const [mediators, setMediators] = useState([]);
  const [lookupsReady, setLookupsReady] = useState(false);
  const [stayAfterSave, setStayAfterSave] = useState(false);
  const [saveAsNew, setSaveAsNew] = useState(false);
  const firstFieldRef = useRef(null);

  useEffect(() => {
  async function fetchLookups() {
    try {
      const [pRes, mRes] = await Promise.all([
        getPlatforms(),
        getMediators(),
        
      ]);
      setPlatforms(pRes.data);
      setMediators(mRes.data);
      // statuses removed
      setLookupsReady(true);
    } catch (err) {
      console.error("Lookup fetch failed", err);
    }
  }
  fetchLookups();
}, []);

  // Global ESC to cancel
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && onCancel) { toast.show('Cancelled','info'); onCancel(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel, toast]);

  // When review prop arrives (edit flow), sync form values
  useEffect(() => {
    if (review) {
      reset({ ...review });
    }
  }, [review, reset]);

  const orderedDate = watch("orderedDate");
  const deliveryDate = watch("deliveryDate");
  const reviewSubmitDate = watch("reviewSubmitDate");
  const reviewAcceptedDate = watch("reviewAcceptedDate");
  const ratingSubmittedDate = watch("ratingSubmittedDate");
  const refundFormSubmittedDate = watch("refundFormSubmittedDate");
  const paymentReceivedDate = watch("paymentReceivedDate");
  const amountValue = watch("amountRupees");
  const lessValue = watch("lessRupees");
  const dealType = watch("dealType");
  // render only current step input; previous steps as summaries
  const [editStep, setEditStep] = useState(null);

  // Computed refund preview
  const amtNum = typeof amountValue === 'number' ? amountValue : parseFloat(amountValue ?? '0');
  const lessNum = typeof lessValue === 'number' ? lessValue : parseFloat(lessValue ?? '0');
  const refundPreview = (isFinite(amtNum) ? amtNum : 0) - (isFinite(lessNum) ? lessNum : 0);

  // Compute current status preview (mirror backend logic)
  const statusPreview = (() => {
    if (paymentReceivedDate) return "payment received";
    if (refundFormSubmittedDate) return "refund form submitted";
    const dt = dealType || "REVIEW_SUBMISSION";
    if (dt === "REVIEW_PUBLISHED") {
      if (reviewAcceptedDate) return "review accepted";
      if (reviewSubmitDate) return "review submitted";
    } else if (dt === "RATING_ONLY") {
      if (ratingSubmittedDate) return "rating submitted";
    } else {
      if (reviewSubmitDate) return "review submitted";
    }
    if (deliveryDate) return "delivered";
    if (orderedDate) return "ordered";
    return "ordered";
  })();

  // Sequence and next date field to set for advancing status
  const stepSequence = (() => {
    const base = ['orderedDate', 'deliveryDate'];
    if ((dealType || 'REVIEW_SUBMISSION') === 'REVIEW_PUBLISHED') return [...base, 'reviewSubmitDate', 'reviewAcceptedDate', 'refundFormSubmittedDate', 'paymentReceivedDate'];
    if ((dealType || 'REVIEW_SUBMISSION') === 'RATING_ONLY') return [...base, 'ratingSubmittedDate', 'refundFormSubmittedDate', 'paymentReceivedDate'];
    return [...base, 'reviewSubmitDate', 'refundFormSubmittedDate', 'paymentReceivedDate'];
  })();
  const nextField = (() => {
    if (!orderedDate) return "orderedDate";
    if (!deliveryDate) return "deliveryDate";
    const dt = dealType || "REVIEW_SUBMISSION";
    if (dt === "REVIEW_PUBLISHED") {
      if (!reviewSubmitDate) return "reviewSubmitDate";
      if (!reviewAcceptedDate) return "reviewAcceptedDate";
    } else if (dt === "RATING_ONLY") {
      if (!ratingSubmittedDate) return "ratingSubmittedDate";
    } else {
      if (!reviewSubmitDate) return "reviewSubmitDate";
    }
    if (!refundFormSubmittedDate) return "refundFormSubmittedDate";
    if (!paymentReceivedDate) return "paymentReceivedDate";
    return null;
  })();

  const labelOf = (k) => ({
    orderedDate: 'Ordered Date',
    deliveryDate: 'Delivery Date',
    reviewSubmitDate: 'Review Submit Date',
    reviewAcceptedDate: 'Review Accepted Date',
    ratingSubmittedDate: 'Rating Submitted Date',
    refundFormSubmittedDate: 'Refund Form Submitted',
    paymentReceivedDate: 'Payment Received',
  })[k] || k;

  const valueOf = (k) => ({
    orderedDate, deliveryDate, reviewSubmitDate, reviewAcceptedDate, ratingSubmittedDate, refundFormSubmittedDate, paymentReceivedDate,
  })[k];

  const resetFrom = (k) => {
    const idx = stepSequence.indexOf(k);
    if (idx === -1) return;
    stepSequence.slice(idx).forEach(step => setValue(step, null, { shouldDirty: true }));
  };

  const resetAfter = (k) => {
    const idx = stepSequence.indexOf(k);
    if (idx === -1) return;
    stepSequence.slice(idx + 1).forEach(step => setValue(step, null, { shouldDirty: true }));
  };

  const advanceStatus = () => {
    const today = new Date();
    if (!nextField) return;
    setValue(nextField, today, { shouldValidate: true, shouldDirty: true });
  };

  // Ensure selects show correct values when editing and lookups are loaded
  useEffect(() => {
    if (review && lookupsReady) {
      // Only reset the fields that can be affected by lookups
      reset({
        ...review,
        platformId: review.platformId ?? "",
        mediatorId: review.mediatorId ?? "",
        dealType: review.dealType ?? "",
      });
    }
  }, [review, lookupsReady, reset]);

  const onSubmit = async (data, opts = {}) => {
    // Ensure refund is computed as amount - less when submitting (less defaults to 0)
    const amt = typeof data.amountRupees === 'number' ? data.amountRupees : parseFloat(data.amountRupees ?? '0');
    let less = typeof data.lessRupees === 'number' ? data.lessRupees : parseFloat((data.lessRupees ?? '0') === '' ? '0' : data.lessRupees);
    if (!Number.isFinite(less)) less = 0;
    if (Number.isFinite(amt)) {
      data.lessRupees = less;
      data.refundAmountRupees = amt - less;
    } else {
      delete data.refundAmountRupees;
    }
    try {
      const asNew = opts.asNew ?? saveAsNew;
      const stay = opts.stay ?? stayAfterSave;
      // include version for optimistic locking when updating
      if (review && review.version != null) {
        data.version = review.version;
      }
      if (review && !asNew) {
        await updateReview(review.id, data);
        toast.show("Review updated", "success");
      } else {
        await createReview(data);
        toast.show("Review created", "success");
        if (stay) {
          reset({ ...defaultValues });
          setSaveAsNew(false);
          setStayAfterSave(false);
          setTimeout(() => firstFieldRef.current?.focus(), 0);
          return; // keep form open
        }
      }
      onSuccess?.();
    } catch (err) {
      console.error("Error saving review", err);
      if (err?.response?.status === 409) {
        toast.show("This review was updated elsewhere. Please reload.", "error");
      } else {
        toast.show("Error saving review", "error");
      }
    }
  };

  // mediator quick filter removed (unused)

  const fmtDate = (v) => {
    if (!v) return "-";
    if (typeof v === 'string' && v.length >= 10) return v.slice(0,10);
    try { return new Date(v).toISOString().slice(0,10); } catch { return String(v); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" onKeyDown={(e)=> { if (e.key === 'Escape' && onCancel) { e.preventDefault(); toast.show('Cancelled','info'); onCancel(); } }}>
      {/* Order ID */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Order ID</label>
        <input
          ref={firstFieldRef}
          {...register("orderId", {
            required: true,
            validate: (v) => (v ?? "").trim().length > 0 || "Order ID cannot be blank"
          })}
          className={`w-full rounded-md border ${errors.orderId ? 'border-red-500' : 'border-gray-300'} bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
        />
        {errors.orderId && (
          <span className="text-red-500 text-sm">{errors.orderId.message || "Order ID is required."}</span>
        )}
      </div>

      {/* Order Link */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Order Link</label>
        <input {...register("orderLink", { required: true, pattern: /^https?:\/\/.+$/ })}
               className={`w-full rounded-md border ${errors.orderLink ? 'border-red-500' : 'border-gray-300'} bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}/>
        {errors.orderLink && <span className="text-red-500 text-sm">Valid URL required.</span>}
      </div>

      {/* Product Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Product Name</label>
        <input
          {...register("productName", { required: "Product name is required" })}
          className={`w-full rounded-md border ${errors.productName ? 'border-red-500' : 'border-gray-300'} bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
        />
        {errors.productName && (
          <span className="text-red-500 text-sm">{errors.productName.message}</span>
        )}
      </div>

      {/* Deal Type & Dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Deal Type</label>
          <select {...register("dealType", { required: "Deal type is required" })} className={`w-full rounded-md border ${errors.dealType ? 'border-red-500' : 'border-gray-300'} bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}>
            <option value="">Select</option>
            <option value="REVIEW_PUBLISHED">Review Published</option>
            <option value="REVIEW_SUBMISSION">Review Submission</option>
            <option value="RATING_ONLY">Rating Only</option>
          </select>
          {errors.dealType && <span className="text-red-500 text-sm">{errors.dealType.message}</span>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Platform</label>
          <Controller
            name="platformId"
            control={control}
            rules={{ required: "Platform is required" }}
            render={({ field }) => (
              <PlatformSelect
                value={field.value}
                onChange={field.onChange}
                items={platforms}
                error={errors.platformId}
              />
            )}
          />
          {errors.platformId && <span className="text-red-500 text-sm">{errors.platformId.message}</span>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Mediator</label>
          <Controller
            name="mediatorId"
            control={control}
            rules={{ required: "Mediator is required" }}
            render={({ field }) => (
              <MediatorSelect
                value={field.value}
                onChange={field.onChange}
                items={mediators}
                error={errors.mediatorId}
              />
            )}
          />
          {errors.mediatorId && <span className="text-red-500 text-sm">{errors.mediatorId.message}</span>}
        </div>
      </div>

      {/* Amount & Less */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Amount</label>
          <input
            type="number"
            step="0.01"
            {...register("amountRupees", {
              required: "Amount is required",
              min: { value: 0, message: "Amount cannot be negative" },
              valueAsNumber: true,
            })}
            className={`w-full rounded-md border ${errors.amountRupees ? 'border-red-500' : 'border-gray-300'} bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
          />
          {errors.amountRupees && <span className="text-red-500 text-sm">{errors.amountRupees.message}</span>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Less</label>
          <input
            type="number"
            step="0.01"
            {...register("lessRupees", {
              min: { value: 0, message: "Less cannot be negative" },
              validate: (v) => {
                const less = typeof v === 'number' ? v : parseFloat(v ?? '0');
                const amt = typeof amountValue === 'number' ? amountValue : parseFloat(amountValue ?? '0');
                if (isFinite(less) && isFinite(amt) && less > amt) return "Less cannot exceed Amount";
                return true;
              },
              valueAsNumber: true,
            })}
            className={`w-full rounded-md border ${errors.lessRupees ? 'border-red-500' : 'border-gray-300'} bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
          />
          {errors.lessRupees && <span className="text-red-500 text-sm">{errors.lessRupees.message}</span>}
        </div>
      </div>

      {/* Status + Refund preview */}
      <div className="flex items-center justify-between text-sm">
        <div>Current status: <span className="font-medium capitalize">{statusPreview}</span></div>
        <button type="button" onClick={()=> { if (!dealType) { toast.show('Select Deal Type first','error'); return; } advanceStatus(); }} disabled={!dealType} className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50">Advance status</button>
      </div>
      <div className="text-xs text-gray-500 mt-1">
        Flow: {dealType === 'REVIEW_PUBLISHED' ? 'Ordered → Delivered → Review Submitted → Review Accepted → Refund Form Submitted → Payment Received'
          : dealType === 'RATING_ONLY' ? 'Ordered → Delivered → Rating Submitted → Refund Form Submitted → Payment Received'
          : dealType === 'REVIEW_SUBMISSION' ? 'Ordered → Delivered → Review Submitted → Refund Form Submitted → Payment Received'
          : 'Select a Deal Type to view steps'}
        <div>Tip: Advance sets the next missing date to today.</div>
      </div>
      <div className={`text-sm ${refundPreview < 0 ? 'text-red-600' : 'text-gray-600'}`}>
        Refund preview: ₹{Number.isFinite(refundPreview) ? refundPreview.toFixed(2) : '-'}
      </div>

      {/* Dates */}
      <div className="space-y-3 bg-gray-50 p-4 rounded-md border border-gray-200">
        {stepSequence.map((step, idx) => {
          const val = valueOf(step);
          if (val && editStep !== step) {
            return (
              <div key={step} className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase text-gray-500 inline-flex items-center gap-1">{labelOf(step)}<InformationCircleIcon className="w-3 h-3 text-gray-400" title={tipOf(step)} /></div>
                  <div className="font-medium">{fmtDate(val)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={()=> setEditStep(step)} className="text-gray-700 hover:text-gray-900" title="Edit">
                    <PencilSquareIcon className="w-4 h-4"/>
                  </button>
                  <button type="button" onClick={()=> resetFrom(step)} className="text-blue-600 hover:text-blue-800" title="Reset from here">
                    <ArrowPathIcon className="w-4 h-4"/>
                  </button>
                </div>
              </div>
            );
          }
          if (nextField === step || editStep === step) {
            return (
              <div key={step}>
                <label className="block text-sm font-medium text-gray-700 inline-flex items-center gap-1">{labelOf(step)}<InformationCircleIcon className="w-4 h-4 text-gray-400" title={tipOf(step)} /></label>
                <Controller name={step} control={control} render={({ field }) => (
                  <DatePicker
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    selected={field.value}
                    disabled={!dealType}
                    onChange={(d)=> {
                      // Enforce chronological order: date >= previous step's date
                      const prevKey = stepSequence[idx-1];
                      const prevVal = idx>0 ? valueOf(prevKey) : null;
                      if (prevVal && d && new Date(d).getTime() < new Date(prevVal).getTime()) {
                        toast.show('Date must be same or later than previous step','error');
                        return;
                      }
                      field.onChange(d);
                      resetAfter(step);
                      setEditStep(null);
                    }}
                    dateFormat="yyyy-MM-dd"
                  />
                )}/>
              </div>
            );
          }
          return null;
        })}
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <button type="button" className="px-3 py-2 border rounded-md border-gray-300 bg-white hover:bg-gray-50 text-gray-700" onClick={onCancel}>Cancel</button>
        )}
        <button
          type="button"
          className="px-3 py-2 border rounded-md border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
          onClick={handleSubmit((form)=> onSubmit(form, { stay: true, asNew: !!review }))}
        >
          Save & Add Another
        </button>
        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md shadow">
          {review ? "Update Review" : "Create Review"}
        </button>
      </div>
    </form>
  );
}

function tipOf(step) {
  const map = {
    orderedDate: 'Date when order was placed',
    deliveryDate: 'Date when product was delivered',
    reviewSubmitDate: 'When the review was submitted',
    reviewAcceptedDate: 'When the review was accepted/published',
    ratingSubmittedDate: 'When the rating was submitted',
    refundFormSubmittedDate: 'When refund form was submitted',
    paymentReceivedDate: 'When refund/payment was received',
  };
  return map[step] || '';
}

function MediatorSelect({ value, onChange, items, error }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const ref = useRef(null);
  const listRef = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  // Close on window scroll (outside scroll)
  useEffect(() => {
    const onScroll = () => setOpen(false);
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, []);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items || [];
    return (items||[]).filter(m => (m.name||'').toLowerCase().includes(q) || (m.phone||'').toLowerCase().includes(q));
  }, [items, query]);
  const selected = (items||[]).find(m => m.id === value);
  useEffect(() => {
    // keep active within range
    if (active < 0) setActive(0);
    else if (active >= filtered.length) setActive(Math.max(0, filtered.length - 1));
  }, [filtered.length, active]);
  useEffect(() => {
    // scroll active into view
    const el = listRef.current?.querySelector(`[data-index="${active}"]`);
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }, [active]);
  const openAndInit = () => {
    setOpen(o => {
      const idx = filtered.findIndex(m => m.id === value);
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
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(filtered.length-1, a+1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(0, a-1)); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(Math.max(0, filtered.length-1)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const pick = filtered[active]; if (pick) { onChange(pick.id); setOpen(false); }
    } else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
  };
  return (
    <div className="relative" ref={ref}>
      <button type="button" className={`w-full rounded-md border ${error ? 'border-red-500' : 'border-gray-300'} bg-white px-3 py-2 text-left flex items-center justify-between text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`} onClick={openAndInit} onKeyDown={onKeyDown}>
        <span>{selected ? `${selected.name}` : 'Select mediator'}</span>
        <ChevronDownIcon className="w-4 h-4 text-gray-500"/>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border rounded shadow-lg" onKeyDown={onKeyDown}>
          <div className="p-2 border-b bg-gray-50">
            <input className="w-full border rounded px-2 py-1 text-sm" placeholder="Search name or phone" value={query} onChange={(e)=> setQuery(e.target.value)} />
          </div>
          <div ref={listRef} className="max-h-48 overflow-auto text-sm">
            {filtered.map((m, idx) => (
              <button type="button" data-index={idx} key={m.id} className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${m.id===value ? 'bg-indigo-50' : ''} ${idx===active ? 'ring-1 ring-indigo-300' : ''}`} onClick={()=> { onChange(m.id); setOpen(false); }}>
                {m.name}{m.phone ? ` · ${m.phone}` : ''}
              </button>
            ))}
            {filtered.length===0 && (
              <div className="px-3 py-2 text-gray-500">No matches</div>
            )}
          </div>
          {value && (
            <div className="p-2 border-t bg-gray-50 text-right">
              <button type="button" className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800" onClick={()=> onChange("")}> <XMarkIcon className="w-3 h-3"/> Clear</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PlatformSelect({ value, onChange, items, error }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
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
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items || [];
    return (items||[]).filter(p => (p.name||'').toLowerCase().includes(q));
  }, [items, query]);
  const selected = (items||[]).find(p => p.id === value);
  useEffect(() => {
    if (active < 0) setActive(0);
    else if (active >= filtered.length) setActive(Math.max(0, filtered.length - 1));
  }, [filtered.length, active]);
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${active}"]`);
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }, [active]);
  const openAndInit = () => {
    setOpen(o => {
      const idx = filtered.findIndex(p => p.id === value);
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
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(filtered.length-1, a+1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(0, a-1)); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(Math.max(0, filtered.length-1)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const pick = filtered[active]; if (pick) { onChange(pick.id); setOpen(false); }
    } else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
  };
  return (
    <div className="relative" ref={ref}>
      <button type="button" className={`w-full rounded-md border ${error ? 'border-red-500' : 'border-gray-300'} bg-white px-3 py-2 text-left flex items-center justify-between text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`} onClick={openAndInit} onKeyDown={onKeyDown}>
        <span>{selected ? `${selected.name}` : 'Select platform'}</span>
        <ChevronDownIcon className="w-4 h-4 text-gray-500"/>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border rounded shadow-lg" onKeyDown={onKeyDown}>
          <div className="p-2 border-b bg-gray-50">
            <input className="w-full border rounded px-2 py-1 text-sm" placeholder="Search platform" value={query} onChange={(e)=> setQuery(e.target.value)} />
          </div>
          <div ref={listRef} className="max-h-48 overflow-auto text-sm">
            {filtered.map((p, idx) => (
              <button type="button" data-index={idx} key={p.id} className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${p.id===value ? 'bg-indigo-50' : ''} ${idx===active ? 'ring-1 ring-indigo-300' : ''}`} onClick={()=> { onChange(p.id); setOpen(false); }}>
                {p.name}
              </button>
            ))}
            {filtered.length===0 && (
              <div className="px-3 py-2 text-gray-500">No matches</div>
            )}
          </div>
          {value && (
            <div className="p-2 border-t bg-gray-50 text-right">
              <button type="button" className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800" onClick={()=> onChange("")}> <XMarkIcon className="w-3 h-3"/> Clear</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
