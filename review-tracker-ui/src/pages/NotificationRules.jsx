import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { PlusIcon, TrashIcon, PencilSquareIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import useToast from "../components/useToast";
import Modal from "../components/Modal";
import FAB from "../components/FAB";
import CustomSelect from "../components/CustomSelect";
import { Controller, useForm } from "react-hook-form";

const API_BASE = "http://localhost:8080/api/notifications/rules";

export default function NotificationRules() {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
    const toast = useToast();

    const fetchRules = useCallback(async () => {
        try {
            const res = await axios.get(API_BASE);
            setRules(res.data);
        } catch (err) {
            console.error(err);
            toast.show("Failed to load rules", "error");
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchRules();
    }, [fetchRules]);

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this rule?")) return;
        try {
            await axios.delete(`${API_BASE}/${id}`);
            toast.show("Rule deleted", "success");
            fetchRules();
        } catch (error) {
            console.error(error);
            toast.show("Failed to delete rule", "error");
        }
    };

    const openCreate = () => {
        setEditingRule(null);
        setModalOpen(true);
    };

    const openEdit = (rule) => {
        setEditingRule(rule);
        setModalOpen(true);
    };

    const handleSave = async (data) => {
        try {
            if (editingRule) {
                await axios.put(`${API_BASE}/${editingRule.id}`, data);
                toast.show("Rule updated", "success");
            } else {
                await axios.post(API_BASE, data);
                toast.show("Rule created", "success");
            }
            setModalOpen(false);
            fetchRules();
        } catch (err) {
            console.error(err);
            toast.show("Failed to save rule", "error");
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <Link to="/notifications" className="text-indigo-600 hover:underline flex items-center gap-1 mb-2 text-sm"><ArrowLeftIcon className="w-3 h-3" /> Back to Notifications</Link>
                    <h1 className="text-2xl font-bold text-gray-800">Notification Rules</h1>
                </div>
                <button onClick={openCreate} className="hidden md:flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                    <PlusIcon className="w-5 h-5" /> Create Rule
                </button>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <>
                    {/* Mobile Card List */}
                    <div className="md:hidden space-y-4 pb-20">
                        {rules.map(rule => (
                            <div key={rule.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${rule.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {rule.active ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => openEdit(rule)} className="p-2 text-indigo-600 bg-indigo-50 rounded-lg">
                                            <PencilSquareIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDelete(rule.id)} className="p-2 text-red-600 bg-red-50 rounded-lg">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="text-sm text-gray-600 space-y-1 bg-gray-50 p-3 rounded-lg">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Trigger:</span>
                                        <span className="font-medium text-gray-900">{rule.daysAfter}d after {rule.triggerField}</span>
                                    </div>
                                    {rule.missingField && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">If Missing:</span>
                                            <span className="font-medium text-gray-900">{rule.missingField}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Type:</span>
                                        <span className={`font-medium ${rule.type === 'URGENT' ? 'text-red-600' : rule.type === 'WARNING' ? 'text-orange-600' : 'text-blue-600'}`}>
                                            {rule.type}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {rules.length === 0 && <div className="text-center text-gray-500 py-10">No rules defined.</div>}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block bg-white shadow rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {rules.length === 0 && (
                                    <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-500">No rules defined.</td></tr>
                                )}
                                {rules.map((rule) => (
                                    <tr key={rule.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                                            <div className="text-xs text-gray-500">{rule.active ? "Active" : "Inactive"}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {rule.daysAfter} days after <span className="font-mono bg-gray-100 px-1 rounded">{rule.triggerField}</span>
                                            {rule.missingField && <> if <span className="font-mono bg-gray-100 px-1 rounded">{rule.missingField}</span> is missing</>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${rule.type === 'URGENT' ? 'bg-red-100 text-red-800' : rule.type === 'WARNING' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                                                {rule.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => openEdit(rule)} className="text-indigo-600 hover:text-indigo-900 mr-4"><PencilSquareIcon className="w-5 h-5" /></button>
                                            <button onClick={() => handleDelete(rule.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            <RuleModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} rule={editingRule} />
            <FAB onClick={openCreate} />
        </div>
    );
}

function RuleModal({ open, onClose, onSave, rule }) {
    const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
        defaultValues: {
            name: "",
            triggerField: "orderedDate",
            daysAfter: 7,
            missingField: "",
            excludeStatus: "",
            type: "WARNING",
            messageTemplate: "Order {orderId} requires attention.",
            actionUrl: "/reviews/edit/{id}",
            active: true
        }
    });

    // Reset form when modal opens
    useEffect(() => {
        if (open) {
            reset(rule || {
                name: "",
                triggerField: "orderedDate",
                daysAfter: 7,
                missingField: "",
                excludeStatus: "",
                type: "WARNING",
                messageTemplate: "Order {orderId} requires attention.",
                actionUrl: "/reviews/edit/{id}",
                active: true
            });
        }
    }, [open, rule, reset]);

    const inputClass = "mt-1 block w-full rounded-lg border-gray-300 bg-gray-50 focus:bg-white px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors text-gray-900";
    const labelClass = "block text-sm font-semibold text-gray-700 mb-1";

    return (
        <Modal open={open} onClose={onClose} title={rule ? "Edit Rule" : "Create Rule"}>
            <form onSubmit={handleSubmit(onSave)} className="space-y-5">
                <div>
                    <label className={labelClass}>Rule Name</label>
                    <input {...register("name", { required: "Name is required" })} className={inputClass} placeholder="e.g. Review Reminder" />
                    {errors.name && <span className="text-red-500 text-xs mt-1 block">{errors.name.message}</span>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                        <label className={labelClass}>Trigger Field</label>
                        <Controller
                            name="triggerField"
                            control={control}
                            render={({ field }) => (
                                <CustomSelect
                                    {...field}
                                    options={[
                                        { value: "orderedDate", label: "Ordered Date" },
                                        { value: "deliveryDate", label: "Delivery Date" },
                                        { value: "reviewSubmitDate", label: "Review Submit Date" },
                                        { value: "reviewAcceptedDate", label: "Review Accepted Date" },
                                        { value: "ratingSubmittedDate", label: "Rating Submitted Date" },
                                        { value: "refundFormSubmittedDate", label: "Refund Form Submitted" },
                                        { value: "paymentReceivedDate", label: "Payment Received Date" }
                                    ]}
                                    className={inputClass.replace("px-4 py-2.5", "")}
                                />
                            )}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Days After</label>
                        <input type="number" {...register("daysAfter", { required: true, min: 0 })} className={inputClass} />
                    </div>
                </div>

                <div>
                    <label className={labelClass}>Missing Condition (Optional)</label>
                    <Controller
                        name="missingField"
                        control={control}
                        render={({ field }) => (
                            <CustomSelect
                                {...field}
                                options={[
                                    { value: "", label: "(None - Always Trigger)" },
                                    { value: "deliveryDate", label: "Delivery Date" },
                                    { value: "reviewSubmitDate", label: "Review Submit Date" },
                                    { value: "reviewAcceptedDate", label: "Review Accepted Date" },
                                    { value: "ratingSubmittedDate", label: "Rating Submitted Date" },
                                    { value: "refundFormSubmittedDate", label: "Refund Form Submitted" },
                                    { value: "paymentReceivedDate", label: "Payment Received Date" }
                                ]}
                                className={inputClass.replace("px-4 py-2.5", "")}
                            />
                        )}
                    />
                    <p className="text-xs text-gray-500 mt-1">Only notify if this field is still empty.</p>
                </div>

                <div>
                    <label className={labelClass}>Exclude Status (Optional)</label>
                    <Controller
                        name="excludeStatus"
                        control={control}
                        render={({ field }) => (
                            <CustomSelect
                                {...field}
                                options={[
                                    { value: "", label: "(None)" },
                                    { value: "ordered", label: "Ordered" },
                                    { value: "delivered", label: "Delivered" },
                                    { value: "review submitted", label: "Review Submitted" },
                                    { value: "review accepted", label: "Review Accepted" },
                                    { value: "rating submitted", label: "Rating Submitted" },
                                    { value: "refund form submitted", label: "Refund Form Submitted" },
                                    { value: "payment received", label: "Payment Received" }
                                ]}
                                className={inputClass.replace("px-4 py-2.5", "")}
                            />
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
                    <div>
                        <label className={labelClass}>Notification Type</label>
                        <Controller
                            name="type"
                            control={control}
                            render={({ field }) => (
                                <CustomSelect
                                    {...field}
                                    options={[
                                        { value: "INFO", label: "Info (Blue)" },
                                        { value: "WARNING", label: "Warning (Orange)" },
                                        { value: "URGENT", label: "Urgent (Red)" }
                                    ]}
                                    className={inputClass.replace("px-4 py-2.5", "")}
                                />
                            )}
                        />
                    </div>
                    <div className="flex items-center h-full pt-6">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center">
                                <input type="checkbox" {...register("active")} className="peer h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-all cursor-pointer" />
                            </div>
                            <span className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">Active Rule</span>
                        </label>
                    </div>
                </div>

                <div>
                    <label className={labelClass}>Message Template</label>
                    <input {...register("messageTemplate", { required: true })} className={inputClass} />
                    <p className="text-xs text-gray-500 mt-1">Variables: <code className="bg-gray-100 px-1 rounded">{`{orderId}`}</code>, <code className="bg-gray-100 px-1 rounded">{`{days}`}</code></p>
                </div>

                <div>
                    <label className={labelClass}>Action URL</label>
                    <input {...register("actionUrl", { required: true })} className={inputClass} />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm">Cancel</button>
                    <button type="submit" className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-colors text-sm">Save Rule</button>
                </div>
            </form>
        </Modal>
    );
}
