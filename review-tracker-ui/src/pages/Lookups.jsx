import { useCallback, useEffect, useRef, useState } from "react";
import {
  pagePlatforms,
  pageMediators,
  savePlatform,
  saveMediator,
  deletePlatform,
  deleteMediator,
} from "../api/lookups";
import Modal from "../components/Modal";
import { PlusIcon, PencilSquareIcon, TrashIcon, EllipsisVerticalIcon, PhoneIcon } from "@heroicons/react/24/outline";
import DropdownPortal from "../components/DropdownPortal";
import useToast from "../components/useToast";
import FAB from "../components/FAB";

export default function Lookups() {
  const [tab, setTab] = useState("platforms"); // platforms | mediators
  // Platforms state
  const [pf, setPf] = useState({ items: [], page: 0, size: 10, totalPages: 0, totalElements: 0, sort: "name", dir: "ASC" });


  // Status lookups removed

  // Mediators state
  const [md, setMd] = useState({ items: [], page: 0, size: 10, totalPages: 0, totalElements: 0, sort: "name", dir: "ASC" });
  // Edit modals
  const [pfModal, setPfModal] = useState(null); // {id,name}
  const [mdModal, setMdModal] = useState(null); // {id,name,phone}

  const toast = useToast();

  const loadPlatforms = useCallback(async (overrides = {}) => {
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
  }, [pf.page, pf.size, pf.sort, pf.dir]);

  const loadMediators = useCallback(async (overrides = {}) => {
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
  }, [md.page, md.size, md.sort, md.dir]);

  useEffect(() => { loadPlatforms(); loadMediators(); }, [loadPlatforms, loadMediators]);




  // Delete modal
  const [delModal, setDelModal] = useState(null); // {type,id,name}

  return (
    <div>
      {/* Header */}
      <div className="p-6 rounded-t-xl bg-gradient-to-r from-indigo-50 via-white to-emerald-50">
        <h2 className="text-2xl font-bold text-gray-900">Manage Lookups</h2>
        <p className="text-gray-600">Platforms and mediators settings</p>
      </div>

      {/* Body Card */}
      <div className="bg-white p-4 rounded-b-xl shadow text-gray-900">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          {[
            { key: "platforms", label: "Platforms" },
            { key: "mediators", label: "Mediators" },
          ].map(t => (
            <button
              key={t.key}
              className={`px-4 py-2 -mb-px border-b-2 ${tab === t.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600'}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'platforms' && (
          <section className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Platforms</h3>
              <button onClick={() => setPfModal({})} className="hidden md:inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
                <PlusIcon className="w-4 h-4" /> Add Platform
              </button>
            </div>

            <LookupTable
              items={pf.items}
              columns={[{ key: 'name', label: 'Name' }]}
              onEditRow={(row) => setPfModal({ ...row })}
              onDelete={(id) => setDelModal({ type: 'platform', id, name: (pf.items.find(x => x.id === id)?.name) || '' })}
              page={pf.page} size={pf.size} totalPages={pf.totalPages} totalElements={pf.totalElements}
              setPage={(p) => loadPlatforms({ page: p })}
              setSize={(s) => loadPlatforms({ size: s, page: 0 })}
              sort={pf.sort} dir={pf.dir}
              onSort={(field, dir) => loadPlatforms({ sort: field, dir, page: 0 })}
            />
          </section>
        )}

        {/* Statuses tab removed */}

        {tab === 'mediators' && (
          <section className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Mediators</h3>
              <button onClick={() => setMdModal({})} className="hidden md:inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
                <PlusIcon className="w-4 h-4" /> Add Mediator
              </button>
            </div>
            <LookupTable
              items={md.items}
              columns={[{ key: 'name', label: 'Name' }, { key: 'phone', label: 'Phone' }]}
              onEditRow={(row) => setMdModal({ ...row })}
              onDelete={(id) => setDelModal({ type: 'mediator', id, name: (md.items.find(x => x.id === id)?.name) || '' })}
              page={md.page} size={md.size} totalPages={md.totalPages} totalElements={md.totalElements}
              setPage={(p) => loadMediators({ page: p })}
              setSize={(s) => loadMediators({ size: s, page: 0 })}
              sort={md.sort} dir={md.dir}
              onSort={(field, dir) => loadMediators({ sort: field, dir, page: 0 })}
            />
          </section>
        )}

        {/* Edit Modals */}
        <Modal open={!!pfModal} title="Edit Platform" onClose={() => setPfModal(null)}>
          <form onSubmit={async (e) => { e.preventDefault(); if (!pfModal.name?.trim()) return; try { await savePlatform(pfModal); setPfModal(null); await loadPlatforms(); toast.show('Platform saved', 'success'); } catch (e) { console.error(e); toast.show('Failed to save platform', 'error'); } }}>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={pfModal?.name || ''} onChange={(e) => setPfModal({ ...(pfModal || {}), name: e.target.value })} />
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" className="px-3 py-1 border rounded-md border-gray-300 bg-white hover:bg-gray-50" onClick={() => setPfModal(null)}>Cancel</button>
              <button type="submit" className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md">Save</button>
            </div>
          </form>
        </Modal>
        <Modal open={!!mdModal} title="Edit Mediator" onClose={() => setMdModal(null)}>
          <form onSubmit={async (e) => { e.preventDefault(); if (!mdModal.name?.trim()) return; if (mdModal.phone && !/^\+?\d{8,15}$/.test(mdModal.phone)) return; try { await saveMediator(mdModal); setMdModal(null); await loadMediators(); toast.show('Mediator saved', 'success'); } catch (e) { console.error(e); toast.show('Failed to save mediator', 'error'); } }}>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-3" value={mdModal?.name || ''} onChange={(e) => setMdModal({ ...(mdModal || {}), name: e.target.value })} />
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={mdModal?.phone || ''} onChange={(e) => setMdModal({ ...(mdModal || {}), phone: e.target.value })} placeholder="e.g. 919876543210" />
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" className="px-3 py-1 border rounded-md border-gray-300 bg-white hover:bg-gray-50" onClick={() => setMdModal(null)}>Cancel</button>
              <button type="submit" className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md">Save</button>
            </div>
          </form>
        </Modal>

      </div>

      <Modal open={!!delModal} title="Confirm Delete" onClose={() => setDelModal(null)}>
        <p className="mb-4">Are you sure you want to delete {delModal?.type} <span className="font-semibold">{delModal?.name}</span>?</p>
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1 border rounded-md border-gray-300 bg-white hover:bg-gray-50" onClick={() => setDelModal(null)}>Cancel</button>
          <button className="px-3 py-1 bg-red-600 text-white rounded-md" onClick={async () => {
            try {
              if (delModal?.type === 'platform') await deletePlatform(delModal.id);
              if (delModal?.type === 'mediator') await deleteMediator(delModal.id);
              setDelModal(null);
              await Promise.all([loadPlatforms(), loadMediators()]);
              toast.show('Deleted', 'success');
            } catch (e) { console.error(e); toast.show('Delete failed', 'error'); }
          }}>Delete</button>
        </div>
      </Modal>
      <FAB onClick={() => tab === 'platforms' ? setPfModal({}) : setMdModal({})} />
    </div>
  );
}
function LookupTable({ items, columns, onEditRow, onDelete, page, size, totalPages, totalElements, setPage, setSize, sort, dir, onSort }) {
  const [openRow, setOpenRow] = useState(null);
  const menuRef = useRef(null);
  const [colWidths, setColWidths] = useState({});

  return (
    <div>

      <table className="hidden md:table w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 text-left">
            {columns.map(c => (
              <th
                key={c.key}
                className="p-2 border cursor-pointer select-none relative group"
                onClick={() => {
                  const nextDir = sort === c.key && (dir || 'ASC').toUpperCase() === 'ASC' ? 'DESC' : 'ASC';
                  onSort?.(c.key, nextDir);
                }}
                title="Click to sort"
                style={{ width: colWidths[c.key] ? `${colWidths[c.key]}px` : undefined, minWidth: colWidths[c.key] ? `${colWidths[c.key]}px` : undefined }}
              >
                {c.label}{sort === c.key ? ((dir || 'ASC').toUpperCase() === 'ASC' ? ' ▲' : ' ▼') : ''}
                <span
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const startX = e.clientX;
                    const startW = colWidths[c.key] || e.currentTarget.parentElement.offsetWidth;
                    const onMove = (ev) => {
                      const delta = ev.clientX - startX;
                      const next = Math.max(80, startW + delta);
                      setColWidths(w => ({ ...w, [c.key]: next }));
                    };
                    const onUp = () => {
                      window.removeEventListener('mousemove', onMove);
                      window.removeEventListener('mouseup', onUp);
                    };
                    window.addEventListener('mousemove', onMove);
                    window.addEventListener('mouseup', onUp);
                  }}
                  onDoubleClick={() => {
                    const estimator = (text) => 16 + Math.min(600, (String(text || '').length * 8));
                    const maxContent = Math.max(...items.map(r => estimator(r[c.key])));
                    setColWidths(w => ({ ...w, [c.key]: Math.max(80, maxContent) }));
                  }}
                  className="absolute top-0 right-0 h-full w-1 cursor-col-resize opacity-0 group-hover:opacity-100"
                  role="separator"
                  aria-orientation="vertical"
                />
              </th>
            ))}
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(row => (
            <tr key={row.id} className="border-b">
              {columns.map(c => (
                <td key={c.key} className="p-2" style={{ width: colWidths[c.key] ? `${colWidths[c.key]}px` : undefined }}>{row[c.key] || '-'}</td>
              ))}
              <td className="p-2">
                <div className="relative inline-block">
                  <button ref={openRow === row.id ? menuRef : null} className="px-2 py-1 border rounded-md border-gray-300 bg-white hover:bg-gray-50" onClick={() => setOpenRow(prev => prev === row.id ? null : row.id)}>
                    <EllipsisVerticalIcon className="w-5 h-5 text-gray-600" />
                  </button>
                  <DropdownPortal open={openRow === row.id} anchorRef={menuRef} onClose={() => setOpenRow(null)} preferred="up" align="right" className="w-40 overflow-hidden">
                    <button className="block w-full text-left px-3 py-2 hover:bg-gray-50 inline-flex items-center gap-2" onClick={() => { setOpenRow(null); onEditRow?.(row); }}>
                      <PencilSquareIcon className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button className="block w-full text-left px-3 py-2 hover:bg-gray-50 text-red-600 inline-flex items-center gap-2" onClick={() => { setOpenRow(null); onDelete(row.id); }}>
                      <TrashIcon className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </DropdownPortal>
                </div>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td className="p-4 text-center text-gray-500" colSpan={columns.length + 1}>No items.</td></tr>
          )}

        </tbody>
      </table>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {items.map(row => (
          <div key={row.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center active:bg-gray-50 transition-colors" onClick={() => setOpenRow(prev => prev === row.id ? null : row.id)}>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">{row.name}</div>
              {row.phone && (
                <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <PhoneIcon className="w-3 h-3" /> {row.phone}
                </div>
              )}
            </div>
            <div className="relative">
              <button onClick={(e) => { e.stopPropagation(); setOpenRow(prev => prev === row.id ? null : row.id); }} className="p-2 -mr-2 text-gray-400">
                <EllipsisVerticalIcon className="w-5 h-5" />
              </button>
              <DropdownPortal open={openRow === row.id} onClose={() => setOpenRow(null)} align="right" className="w-32">
                <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2" onClick={() => { setOpenRow(null); onEditRow?.(row); }}>
                  <PencilSquareIcon className="w-4 h-4" /> Edit
                </button>
                <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2" onClick={() => { setOpenRow(null); onDelete(row.id); }}>
                  <TrashIcon className="w-4 h-4" /> Delete
                </button>
              </DropdownPortal>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="text-center py-8 text-gray-500">No items.</div>}
      </div>
      <div className="flex items-center justify-between mt-3 text-sm text-gray-700">
        <div>Showing page {page + 1} of {Math.max(totalPages, 1)} ({totalElements} items)</div>
        <div className="space-x-2">
          <button disabled={page <= 0} onClick={() => setPage(page - 1)} className="px-3 py-1 border rounded-md border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50">Prev</button>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} className="px-3 py-1 border rounded-md border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50">Next</button>
          <select value={size} onChange={(e) => setSize(Number(e.target.value))} className="ml-2 border rounded-md border-gray-300 bg-white px-2 py-1">
            {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}/page</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
