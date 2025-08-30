import { useEffect, useState } from "react";
import { getMediators, saveMediator } from "../api/lookups";

export default function Lookups() {
  const [mediators, setMediators] = useState([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getMediators();
      setMediators(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const addMediator = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await saveMediator({ name, phone });
      setName("");
      setPhone("");
      await load();
    } catch (err) {
      console.error("Failed to save mediator", err);
      alert("Failed to save mediator");
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Manage Lookups</h2>

      <section className="mb-8">
        <h3 className="text-xl font-semibold mb-2">Mediators</h3>
        <form onSubmit={addMediator} className="flex gap-3 items-end mb-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input value={name} onChange={(e)=>setName(e.target.value)} className="border p-2 rounded" placeholder="Mediator name" />
          </div>
          <div>
            <label className="block text-sm font-medium">Phone</label>
            <input value={phone} onChange={(e)=>setPhone(e.target.value)} className="border p-2 rounded" placeholder="e.g. 919876543210" />
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Add</button>
        </form>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Phone</th>
              </tr>
            </thead>
            <tbody>
              {mediators.map(m => (
                <tr key={m.id} className="border-b">
                  <td className="p-2">{m.name}</td>
                  <td className="p-2">{m.phone || "-"}</td>
                </tr>
              ))}
              {mediators.length === 0 && (
                <tr><td className="p-2" colSpan="2">No mediators.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
