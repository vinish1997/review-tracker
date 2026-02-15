import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { PlusIcon, TrashIcon, PencilSquareIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import useToast from "../components/useToast";
import Modal from "../components/Modal";
import { useForm } from "react-hook-form";

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
                <button onClick={openCreate} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                    <PlusIcon className="w-5 h-5" /> Create Rule
                </button>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="bg-white shadow rounded-lg overflow-hidden">
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
            )}

            <RuleModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} rule={editingRule} />
        </div>
    );
}

function RuleModal({ open, onClose, onSave, rule }) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
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

    return (
        <Modal open={open} onClose={onClose} title={rule ? "Edit Rule" : "Create Rule"}>
            <form onSubmit={handleSubmit(onSave)} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input {...register("name", { required: "Name is required" })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                    {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Trigger Field</label>
                        <select {...register("triggerField")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                            <option value="orderedDate">Ordered Date</option>
                            <option value="deliveryDate">Delivery Date</option>
                            <option value="reviewSubmitDate">Review Submit Date</option>
                            <option value="reviewAcceptedDate">Review Accepted Date</option>
                            <option value="ratingSubmittedDate">Rating Submitted Date</option>
                            <option value="refundFormSubmittedDate">Refund Form Submitted</option>
                            <option value="paymentReceivedDate">Payment Received Date</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Days After</label>
                        <input type="number" {...register("daysAfter", { required: true, min: 0 })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Missing Field (Optional)</label>
                    <select {...register("missingField")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                        <option value="">None</option>
                        <option value="deliveryDate">Delivery Date</option>
                        <option value="reviewSubmitDate">Review Submit Date</option>
                        <option value="reviewAcceptedDate">Review Accepted Date</option>
                        <option value="ratingSubmittedDate">Rating Submitted Date</option>
                        <option value="refundFormSubmittedDate">Refund Form Submitted</option>
                        <option value="paymentReceivedDate">Payment Received Date</option>
                    </select>
                    <p className="text-xs text-gray-500">Notify only if this field is empty.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Exclude Status (Optional)</label>
                    <input {...register("excludeStatus")} placeholder="e.g. payment received" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <select {...register("type")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                            <option value="INFO">Info</option>
                            <option value="WARNING">Warning</option>
                            <option value="URGENT">Urgent</option>
                        </select>
                    </div>
                    <div className="flex items-center pt-6">
                        <input type="checkbox" {...register("active")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                        <label className="ml-2 block text-sm text-gray-900">Active</label>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Message Template</label>
                    <input {...register("messageTemplate", { required: true })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                    <p className="text-xs text-gray-500">Variables: {`{orderId}`}, {`{days}`}</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Action URL</label>
                    <input {...register("actionUrl", { required: true })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                </div>

                <div className="flex justify-end pt-2">
                    <button type="button" onClick={onClose} className="mr-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
                    <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">Save</button>
                </div>
            </form>
        </Modal>
    );
}
