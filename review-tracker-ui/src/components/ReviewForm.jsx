import { useForm, Controller } from "react-hook-form";
import DatePicker from "react-datepicker";
import { useEffect, useState } from "react";
import { createReview, updateReview } from "../api/reviews";
import { useToast } from "./ToastProvider";
import { getPlatforms, getMediators } from "../api/lookups";

export default function ReviewForm({ review, onSuccess }) {
  const toast = useToast();
  const { register, handleSubmit, control, watch, formState: { errors }, reset, setValue } = useForm({
    defaultValues: review || {
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
    }
  });

  const [platforms, setPlatforms] = useState([]);
  const [mediators, setMediators] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [lookupsReady, setLookupsReady] = useState(false);

  useEffect(() => {
  async function fetchLookups() {
    try {
      const [pRes, mRes] = await Promise.all([
        getPlatforms(),
        getMediators(),
        
      ]);
      setPlatforms(pRes.data);
      setMediators(mRes.data);
      setStatuses([]);
      setLookupsReady(true);
    } catch (err) {
      console.error("Lookup fetch failed", err);
    }
  }
  fetchLookups();
}, []);

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

  // Next date field to set for advancing status
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

  const onSubmit = async (data) => {
    // Ensure refund is computed as amount - less when submitting
    const amt = typeof data.amountRupees === 'number' ? data.amountRupees : parseFloat(data.amountRupees ?? '0');
    const less = typeof data.lessRupees === 'number' ? data.lessRupees : parseFloat(data.lessRupees ?? '0');
    if (Number.isFinite(amt) && Number.isFinite(less)) {
      data.refundAmountRupees = amt - less;
    } else {
      delete data.refundAmountRupees;
    }
    try {
      if (review) {
        await updateReview(review.id, data);
        toast.show("Review updated", "success");
      } else {
        await createReview(data);
        toast.show("Review created", "success");
      }
      onSuccess?.();
    } catch (err) {
      console.error("Error saving review", err);
      toast.show("Error saving review", "error");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
      {/* Order ID */}
      <div>
        <label className="block font-medium">Order ID</label>
        <input
          {...register("orderId", {
            required: true,
            validate: (v) => (v ?? "").trim().length > 0 || "Order ID cannot be blank"
          })}
          className="border p-2 w-full rounded"
        />
        {errors.orderId && (
          <span className="text-red-500 text-sm">{errors.orderId.message || "Order ID is required."}</span>
        )}
      </div>

      {/* Order Link */}
      <div>
        <label className="block font-medium">Order Link</label>
        <input {...register("orderLink", { required: true, pattern: /^https?:\/\/.+$/ })}
               className="border p-2 w-full rounded"/>
        {errors.orderLink && <span className="text-red-500 text-sm">Valid URL required.</span>}
      </div>

      {/* Product Name */}
      <div>
        <label className="block font-medium">Product Name</label>
        <input
          {...register("productName", { required: "Product name is required" })}
          className="border p-2 w-full rounded"
        />
        {errors.productName && (
          <span className="text-red-500 text-sm">{errors.productName.message}</span>
        )}
      </div>

      {/* Deal Type & Dropdowns */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block font-medium">Deal Type</label>
          <select {...register("dealType", { required: "Deal type is required" })} className="border p-2 w-full rounded">
            <option value="">Select</option>
            <option value="REVIEW_PUBLISHED">Review Published</option>
            <option value="REVIEW_SUBMISSION">Review Submission</option>
            <option value="RATING_ONLY">Rating Only</option>
          </select>
          {errors.dealType && <span className="text-red-500 text-sm">{errors.dealType.message}</span>}
        </div>
        <div>
          <label className="block font-medium">Platform</label>
          <select {...register("platformId", { required: "Platform is required" })} className="border p-2 w-full rounded">
            <option value="">Select</option>
            {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {errors.platformId && <span className="text-red-500 text-sm">{errors.platformId.message}</span>}
        </div>
        <div>
          <label className="block font-medium">Mediator</label>
          <select {...register("mediatorId", { required: "Mediator is required" })} className="border p-2 w-full rounded">
            <option value="">Select</option>
            {mediators.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          {errors.mediatorId && <span className="text-red-500 text-sm">{errors.mediatorId.message}</span>}
        </div>
      </div>

      {/* Amount & Less */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-medium">Amount</label>
          <input
            type="number"
            step="0.01"
            {...register("amountRupees", {
              required: "Amount is required",
              min: { value: 0, message: "Amount cannot be negative" },
              valueAsNumber: true,
            })}
            className="border p-2 w-full rounded"
          />
          {errors.amountRupees && <span className="text-red-500 text-sm">{errors.amountRupees.message}</span>}
        </div>
        <div>
          <label className="block font-medium">Less</label>
          <input
            type="number"
            step="0.01"
            {...register("lessRupees", {
              required: "Less amount is required",
              min: { value: 0, message: "Less cannot be negative" },
              validate: (v) => {
                const less = typeof v === 'number' ? v : parseFloat(v ?? '0');
                const amt = typeof amountValue === 'number' ? amountValue : parseFloat(amountValue ?? '0');
                if (isFinite(less) && isFinite(amt) && less > amt) return "Less cannot exceed Amount";
                return true;
              },
              valueAsNumber: true,
            })}
            className="border p-2 w-full rounded"
          />
          {errors.lessRupees && <span className="text-red-500 text-sm">{errors.lessRupees.message}</span>}
        </div>
      </div>

      {/* Status + Refund preview */}
      <div className="flex items-center justify-between text-sm">
        <div>Current status: <span className="font-medium">{statusPreview}</span></div>
        <button type="button" onClick={advanceStatus} className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200">Advance status</button>
      </div>
      <div className={`text-sm ${refundPreview < 0 ? 'text-red-600' : 'text-gray-600'}`}>
        Refund preview: ₹{Number.isFinite(refundPreview) ? refundPreview.toFixed(2) : '-'}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-medium">Ordered Date</label>
          <Controller name="orderedDate" control={control} render={({ field }) =>
            <DatePicker className="border p-2 w-full rounded" selected={field.value} onChange={field.onChange} dateFormat="yyyy-MM-dd"/>
          }/>
        </div>
        <div>
          <label className="block font-medium">Delivery Date</label>
          <Controller name="deliveryDate" control={control} render={({ field }) =>
            <DatePicker className="border p-2 w-full rounded"
              selected={field.value}
              onChange={field.onChange}
              minDate={orderedDate}
              dateFormat="yyyy-MM-dd"/>
          }/>
        </div>
        {dealType !== 'RATING_ONLY' && (
          <div>
            <label className="block font-medium">Review Submit Date</label>
            <Controller name="reviewSubmitDate" control={control} render={({ field }) =>
              <DatePicker className="border p-2 w-full rounded"
                selected={field.value}
                onChange={field.onChange}
                minDate={deliveryDate}
                dateFormat="yyyy-MM-dd"/>
            }/>
          </div>
        )}
        {dealType === 'REVIEW_PUBLISHED' && (
          <div>
            <label className="block font-medium">Review Accepted Date</label>
            <Controller name="reviewAcceptedDate" control={control} render={({ field }) =>
              <DatePicker className="border p-2 w-full rounded"
                selected={field.value}
                onChange={field.onChange}
                minDate={reviewSubmitDate}
                dateFormat="yyyy-MM-dd"/>
            }/>
          </div>
        )}
        {dealType === 'RATING_ONLY' && (
          <div>
            <label className="block font-medium">Rating Submitted Date</label>
            <Controller name="ratingSubmittedDate" control={control} render={({ field }) =>
              <DatePicker className="border p-2 w-full rounded"
                selected={field.value}
                onChange={field.onChange}
                minDate={deliveryDate}
                dateFormat="yyyy-MM-dd"/>
            }/>
          </div>
        )}
        <div>
          <label className="block font-medium">Review Accepted Date</label>
          <Controller name="reviewAcceptedDate" control={control} render={({ field }) =>
            <DatePicker className="border p-2 w-full rounded"
              selected={field.value}
              onChange={field.onChange}
              minDate={reviewSubmitDate}
              dateFormat="yyyy-MM-dd"/>
          }/>
        </div>
        <div>
          <label className="block font-medium">Rating Submitted Date</label>
          <Controller name="ratingSubmittedDate" control={control} render={({ field }) =>
            <DatePicker className="border p-2 w-full rounded"
              selected={field.value}
              onChange={field.onChange}
              minDate={deliveryDate}
              dateFormat="yyyy-MM-dd"/>
          }/>
        </div>
        <div>
          <label className="block font-medium">Refund Form Submitted</label>
          <Controller name="refundFormSubmittedDate" control={control} render={({ field }) =>
            <DatePicker className="border p-2 w-full rounded"
              selected={field.value}
              onChange={field.onChange}
              minDate={reviewSubmitDate}
              dateFormat="yyyy-MM-dd"/>
          }/>
        </div>
        <div>
          <label className="block font-medium">Payment Received</label>
          <Controller name="paymentReceivedDate" control={control} render={({ field }) =>
            <DatePicker className="border p-2 w-full rounded"
              selected={field.value}
              onChange={field.onChange}
              minDate={refundFormSubmittedDate}
              dateFormat="yyyy-MM-dd"/>
          }/>
        </div>
      </div>

      {/* Submit */}
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        {review ? "Update Review" : "Create Review"}
      </button>
    </form>
  );
}
