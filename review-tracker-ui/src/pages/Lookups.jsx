import { useEffect, useState } from "react";
import {
  pagePlatforms,
  pageStatuses,
  pageMediators,
  savePlatform,
  saveStatus,
  saveMediator,
  deletePlatform,
  deleteStatus,
  deleteMediator,
} from "../api/lookups";

export default function Lookups() {
  const [tab, setTab] = useState("platforms"); // platforms | statuses | mediators
  // Platforms state
  const [pf, setPf] = useState({ items: [], page: 0, size: 10, totalPages: 0, totalElements: 0, sort: "name", dir: "ASC" });
  const [pfName, setPfName] = useState("");
  const [pfEditing, setPfEditing] = useState({}); // id -> { name }

  // Statuses state
  const [st, setSt] = useState({ items: [], page: 0, size: 10, totalPages: 0, totalElements: 0, sort: "name", dir: "ASC" });
  const [stName, setStName] = useState("");
  const [stEditing, setStEditing] = useState({});

  // Mediators state
  const [md, setMd] = useState({ items: [], page: 0, size: 10, totalPages: 0, totalElements: 0, sort: "name", dir: "ASC" });
  const [mdName, setMdName] = useState("");
  const [mdPhone, setMdPhone] = useState("");
  const [mdEditing, setMdEditing] = useState({}); // id -> { name, phone }

  const loadPlatforms = async (overrides = {}) => {
    const params = { page: pf.page, size: pf.size, sort: pf.sort, dir: pf.dir, ...overrides };
    const { data } = await pagePlatforms(params);
    setPf({
      items: data.content || [],
      page: data.page ?? 0,
      size: data.size ?? params.size,
      totalPages: data.totalPages ?? 0,
      totalElements: data.totalElements ?? 0,
      sort: params.sort,
      dir: params.dir,
    });
  };

  const loadStatuses = async (overrides = {}) => {
    const params = { page: st.page, size: st.size, sort: st.sort, dir: st.dir, ...overrides };
    const { data } = await pageStatuses(params);
    setSt({
      items: data.content || [],
      page: data.page ?? 0,
      size: data.size ?? params.size,
      totalPages: data.totalPages ?? 0,
      totalElements: data.totalElements ?? 0,
      sort: params.sort,
      dir: params.dir,
    });
  };

  const loadMediators = async (overrides = {}) => {
    const params = { page: md.page, size: md.size, sort: md.sort, dir: md.dir, ...overrides };
    const { data } = await pageMediators(params);
    setMd({
      items: data.content || [],
      page: data.page ?? 0,
      size: data.size ?? params.size,
      totalPages: data.totalPages ?? 0,
      totalElements: data.totalElements ?? 0,
      sort: params.sort,
      dir: params.dir,
    });
  };

  useEffect(() => { loadPlatforms(); loadStatuses(); loadMediators(); }, []);

  const addPlatform = async (e) => {
    e.preventDefault();
    if (!pfName.trim()) return;
    await savePlatform({ name: pfName });
    setPfName("");
    await loadPlatforms();
  };
  const addStatus = async (e) => {
    e.preventDefault();
    if (!stName.trim()) return;
    await saveStatus({ name: stName });
    setStName("");
    await loadStatuses();
  };
  const addMediator = async (e) => {
    e.preventDefault();
    if (!mdName.trim()) return;
    await saveMediator({ name: mdName, phone: mdPhone });
    setMdName(""); setMdPhone("");
    await loadMediators();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Manage Lookups</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {[
          { key: "platforms", label: "Platforms" },
          { key: "statuses", label: "Statuses" },
          { key: "mediators", label: "Mediators" },
        ].map(t => (
          <button
            key={t.key}
            className={`px-4 py-2 -mb-px border-b-2 ${tab===t.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600'}`}
            onClick={()=> setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'platforms' && (
      <section className="mb-8">
        <h3 className="text-xl font-semibold mb-2">Platforms</h3>
        <form onSubmit={addPlatform} className="flex gap-3 items-end mb-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input value={pfName} onChange={(e)=>setPfName(e.target.value)} className="border p-2 rounded" placeholder="Platform name" />
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Add</button>
        </form>
        <LookupTable
          items={pf.items}
          columns={[{key:'name', label:'Name'}]}
          editing={pfEditing}
          onEditChange={setPfEditing}
          onSave={async (row)=> { await savePlatform(row); setPfEditing({}); await loadPlatforms(); }}
          onDelete={async (id)=> { await deletePlatform(id); await loadPlatforms(); }}
          page={pf.page} size={pf.size} totalPages={pf.totalPages} totalElements={pf.totalElements}
          setPage={(p)=> loadPlatforms({ page: p })}
          setSize={(s)=> loadPlatforms({ size: s, page: 0 })}
          sort={pf.sort} dir={pf.dir}
          onSort={(field, dir)=> loadPlatforms({ sort: field, dir, page: 0 })}
        />
      </section>
      )}

      {tab === 'statuses' && (
      <section className="mb-8">
        <h3 className="text-xl font-semibold mb-2">Statuses</h3>
        <form onSubmit={addStatus} className="flex gap-3 items-end mb-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input value={stName} onChange={(e)=>setStName(e.target.value)} className="border p-2 rounded" placeholder="Status name" />
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Add</button>
        </form>
        <LookupTable
          items={st.items}
          columns={[{key:'name', label:'Name'}]}
          editing={stEditing}
          onEditChange={setStEditing}
          onSave={async (row)=> { await saveStatus(row); setStEditing({}); await loadStatuses(); }}
          onDelete={async (id)=> { await deleteStatus(id); await loadStatuses(); }}
          page={st.page} size={st.size} totalPages={st.totalPages} totalElements={st.totalElements}
          setPage={(p)=> loadStatuses({ page: p })}
          setSize={(s)=> loadStatuses({ size: s, page: 0 })}
          sort={st.sort} dir={st.dir}
          onSort={(field, dir)=> loadStatuses({ sort: field, dir, page: 0 })}
        />
      </section>
      )}

      {tab === 'mediators' && (
      <section className="mb-8">
        <h3 className="text-xl font-semibold mb-2">Mediators</h3>
        <form onSubmit={addMediator} className="flex gap-3 items-end mb-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input value={mdName} onChange={(e)=>setMdName(e.target.value)} className="border p-2 rounded" placeholder="Mediator name" />
          </div>
          <div>
            <label className="block text-sm font-medium">Phone</label>
            <input value={mdPhone} onChange={(e)=>setMdPhone(e.target.value)} className="border p-2 rounded" placeholder="e.g. 919876543210" />
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Add</button>
        </form>
        <LookupTable
          items={md.items}
          columns={[{key:'name', label:'Name'}, {key:'phone', label:'Phone'}]}
          editing={mdEditing}
          onEditChange={setMdEditing}
          onSave={async (row)=> {
            // E.164-ish validation (allow optional +, 8-15 digits)
            if (row.phone && !/^\+?\d{8,15}$/.test(row.phone)) {
              alert('Please enter a valid phone number (8-15 digits, optionally starting with +)');
              return;
            }
            await saveMediator(row); setMdEditing({}); await loadMediators();
          }}
          onDelete={async (id)=> { await deleteMediator(id); await loadMediators(); }}
          page={md.page} size={md.size} totalPages={md.totalPages} totalElements={md.totalElements}
          setPage={(p)=> loadMediators({ page: p })}
          setSize={(s)=> loadMediators({ size: s, page: 0 })}
          sort={md.sort} dir={md.dir}
          onSort={(field, dir)=> loadMediators({ sort: field, dir, page: 0 })}
        />
      </section>
      )}
    </div>
  );
}

function LookupTable({ items, columns, editing, onEditChange, onSave, onDelete, page, size, totalPages, totalElements, setPage, setSize, sort, dir, onSort }) {
  const [localEditing, setLocalEditing] = useState(editing || {});
  useEffect(() => { setLocalEditing(editing || {}); }, [editing]);

  const startEdit = (row) => {
    setLocalEditing({ [row.id || "new"]: { ...row } });
    onEditChange?.({ [row.id || "new"]: { ...row } });
  };
  const cancelEdit = () => { setLocalEditing({}); onEditChange?.({}); };
  const updateField = (id, key, value) => {
    const next = { ...(localEditing[id] || {}), [key]: value };
    const updated = { ...localEditing, [id]: next };
    setLocalEditing(updated);
    onEditChange?.(updated);
  };

  return (
    <div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200 text-left">
            {columns.map(c => (
              <th
                key={c.key}
                className="p-2 border cursor-pointer select-none"
                onClick={()=> {
                  const nextDir = sort === c.key && (dir||'ASC').toUpperCase()==='ASC' ? 'DESC' : 'ASC';
                  onSort?.(c.key, nextDir);
                }}
                title="Click to sort"
              >
                {c.label}{sort===c.key ? ( (dir||'ASC').toUpperCase()==='ASC' ? ' ▲' : ' ▼') : ''}
              </th>
            ))}
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(row => {
            const edit = localEditing[row.id];
            return (
              <tr key={row.id} className="border-b">
                {columns.map(c => (
                  <td key={c.key} className="p-2">
                    {edit ? (
                      <input className="border p-2 rounded w-full" value={edit[c.key] ?? ""} onChange={(e)=> updateField(row.id, c.key, e.target.value)} />
                    ) : (
                      row[c.key] || "-"
                    )}
                  </td>
                ))}
                <td className="p-2 space-x-2">
                  {edit ? (
                    <>
                      <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={()=> onSave(edit)}>Save</button>
                      <button className="px-3 py-1 border rounded" onClick={cancelEdit}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="bg-yellow-500 text-white px-3 py-1 rounded" onClick={()=> startEdit(row)}>Edit</button>
                      <button className="bg-red-600 text-white px-3 py-1 rounded" onClick={()=> { if (window.confirm('Delete this item?')) onDelete(row.id); }}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
          {items.length === 0 && (
            <tr><td className="p-4 text-center text-gray-500" colSpan={columns.length+1}>No items.</td></tr>
          )}
        </tbody>
      </table>
      <div className="flex items-center justify-between mt-3 text-sm text-gray-700">
        <div>Showing page {page + 1} of {Math.max(totalPages, 1)} ({totalElements} items)</div>
        <div className="space-x-2">
          <button disabled={page <= 0} onClick={()=> setPage(page - 1)} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
          <button disabled={page >= totalPages - 1} onClick={()=> setPage(page + 1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
          <select value={size} onChange={(e)=> setSize(Number(e.target.value))} className="ml-2 border p-1 rounded">
            {[10,20,50,100].map(n => <option key={n} value={n}>{n}/page</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
