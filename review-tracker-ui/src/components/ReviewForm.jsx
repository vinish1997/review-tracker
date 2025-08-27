import { useForm, Controller } from "react-hook-form";
import DatePicker from "react-datepicker";
import { useEffect, useState } from "react";
import { createReview, updateReview } from "../api/reviews";
import { getPlatforms, getMediators, getStatuses } from "../api/lookups";

export default function ReviewForm({ review, onSuccess }) {
  const { register, handleSubmit, control, watch, formState: { errors } } = useForm({
    defaultValues: review || {
      orderId: "",
      orderLink: "",
      productName: "",
      platformId: "",
      mediatorId: "",
      statusId: "Ordered",
      amount: 0,
      less: 0,
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

  useEffect(() => {
  async function fetchLookups() {
    try {
      const [pRes, mRes, sRes] = await Promise.all([
        getPlatforms(),
        getMediators(),
        getStatuses()
      ]);
      setPlatforms(pRes.data);
      setMediators(mRes.data);
      setStatuses(sRes.data);
    } catch (err) {
      console.error("Lookup fetch failed", err);
    }
  }
  fetchLookups();
}, []);

  const orderedDate = watch("orderedDate");
  const deliveryDate = watch("deliveryDate");
  const reviewSubmitDate = watch("reviewSubmitDate");
  const refundFormSubmittedDate = watch("refundFormSubmittedDate");

  const onSubmit = async (data) => {
    try {
      if (review) {
        await updateReview(review.id, data);
      } else {
        await createReview(data);
      }
      onSuccess?.();
    } catch (err) {
      console.error("Error saving review", err);
      alert("Error saving review");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
      {/* Order ID */}
      <div>
        <label className="block font-medium">Order ID</label>
        <input {...register("orderId", { required: true, pattern: /^[a-zA-Z0-9]+$/ })}
               className="border p-2 w-full rounded"/>
        {errors.orderId && <span className="text-red-500 text-sm">Order ID is required and must be alphanumeric.</span>}
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
        <input {...register("productName", { required: true })}
               className="border p-2 w-full rounded"/>
      </div>

      {/* Dropdowns */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block font-medium">Platform</label>
          <select {...register("platformId", { required: true })} className="border p-2 w-full rounded">
            <option value="">Select</option>
            {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block font-medium">Mediator</label>
          <select {...register("mediatorId", { required: true })} className="border p-2 w-full rounded">
            <option value="">Select</option>
            {mediators.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block font-medium">Status</label>
          <select {...register("statusId", { required: true })} className="border p-2 w-full rounded">
            {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Amount & Less */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-medium">Amount</label>
          <input type="number" {...register("amount", { required: true, min: 0 })}
                 className="border p-2 w-full rounded"/>
        </div>
        <div>
          <label className="block font-medium">Less</label>
          <input type="number" {...register("less", { required: true, min: 0 })}
                 className="border p-2 w-full rounded"/>
        </div>
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
