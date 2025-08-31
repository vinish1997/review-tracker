import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { getPlatforms, getMediators } from "../api/lookups";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [platformMap, setPlatformMap] = useState({});
  const [mediatorMap, setMediatorMap] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("/api/reviews/dashboard").then(res => setData(res.data));
    Promise.all([getPlatforms(), getMediators()]).then(([p, m]) => {
      setPlatformMap(Object.fromEntries((p.data||[]).map(x=>[x.id, x.name])));
      setMediatorMap(Object.fromEntries((m.data||[]).map(x=>[x.id, x.name])));
    });
  }, []);

  const d = data || { statusCounts: {}, platformCounts: {}, dealTypeCounts: {}, mediatorCounts: {} };
  const statusEntries = Object.entries(d.statusCounts || {});
  const platformEntries = useMemo(() => Object.entries(d.platformCounts || {})
    .map(([id,c]) => [platformMap[id] || id, c])
    .sort((a,b) => b[1]-a[1])
  , [d.platformCounts, platformMap]);
  const dealEntries = useMemo(() => Object.entries(d.dealTypeCounts || {})
    .map(([code,c]) => [dealTypeLabel(code), c])
    .sort((a,b) => b[1]-a[1])
  , [d.dealTypeCounts]);
  const mediatorEntries = useMemo(() => Object.entries(d.mediatorCounts || {})
    .map(([id,c]) => [mediatorMap[id] || id, c])
    .sort((a,b) => b[1]-a[1])
  , [d.mediatorCounts, mediatorMap]);

  if (!data) return <p>Loading...</p>;
  const donutColors = {
    'ordered': '#94a3b8',
    'delivered': '#38bdf8',
    'review submitted': '#f59e0b',
    'review accepted': '#22c55e',
    'rating submitted': '#a78bfa',
    'refund form submitted': '#f97316',
    'payment received': '#10b981',
    'unknown': '#e5e7eb'
  };
  const totalStatus = statusEntries.reduce((s, [,v]) => s + v, 0) || 1;
  let acc = 0;
  const donutStops = statusEntries.map(([k,v]) => {
    const start = (acc/totalStatus)*100; acc += v; const end = (acc/totalStatus)*100;
    const color = donutColors[k] || '#999';
    return `${color} ${start}% ${end}%`;
  });
  const donut = { style: { background: `conic-gradient(${donutStops.join(',')})` }, legend: Object.fromEntries(statusEntries.map(([k])=>[k, donutColors[k]||'#999'])) };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="-m-6 p-6 rounded-b-xl bg-gradient-to-r from-indigo-50 via-white to-emerald-50">
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600">A quick overview of your review operations</p>
      </div>
      <div className="grid grid-cols-7 gap-4">
        <Card title="Total Reviews" value={data.totalReviews} onClick={()=> navigate('/reviews')} clickable />
        <Card title="Payment Received" value={`₹${data.totalPaymentReceived}`} onClick={()=> navigate('/archive')} clickable />
        <Card title="Avg Refund" value={`₹${data.averageRefund}`} />
        <Card title="Pending Review/Rating" value={Number(data.statusCounts?.["ordered"]||0)+Number(data.statusCounts?.["delivered"]||0)} onClick={()=> navigate('/reviews?preset=pending-review-rating')} clickable />
        <Card title="Pending Refund Form" value={Number(data.statusCounts?.["review submitted"]||0)+Number(data.statusCounts?.["review accepted"]||0)+Number(data.statusCounts?.["rating submitted"]||0)} onClick={()=> navigate('/reviews?preset=pending-refund-form')} clickable />
        <Card title="Pending Payment" value={Number(data.statusCounts?.["refund form submitted"]||0)} onClick={()=> navigate('/reviews?preset=pending-payment')} clickable />
        <Card title="Payment Pending Amt" value={`₹${data.paymentPendingAmount || 0}`} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Panel title="By Status">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full" style={donut.style} />
            <List entries={statusEntries} legend={donut.legend} />
          </div>
        </Panel>
        <Panel title="Platforms (Count)">
          <Pie entries={platformEntries} />
        </Panel>
        <Panel title="Deal Types (Count)">
          <Pie entries={dealEntries} />
        </Panel>
        <Panel title="Mediators (Count)">
          <Pie entries={mediatorEntries} />
        </Panel>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Panel title="Amount Received by Platform">
          <BarCurrency entries={Object.entries(d.amountReceivedByPlatform||{}).map(([id,amt])=>[platformMap[id]||id, Number(amt)])} />
        </Panel>
        <Panel title="Amount Pending by Platform">
          <BarCurrency entries={Object.entries(d.amountPendingByPlatform||{}).map(([id,amt])=>[platformMap[id]||id, Number(amt)])} />
        </Panel>
        <Panel title="Amount Received by Mediator">
          <BarCurrency entries={Object.entries(d.amountReceivedByMediator||{}).map(([id,amt])=>[mediatorMap[id]||id, Number(amt)])} />
        </Panel>
        <Panel title="Amount Pending by Mediator">
          <BarCurrency entries={Object.entries(d.amountPendingByMediator||{}).map(([id,amt])=>[mediatorMap[id]||id, Number(amt)])} />
        </Panel>
      </div>
    </div>
  );
}

function Card({ title, value, onClick, clickable }) {
  return (
    <div className={`bg-white/90 ring-1 ring-gray-100 shadow-sm p-4 rounded-lg ${clickable ? 'cursor-pointer hover:shadow-md transition' : ''}`} onClick={onClick}>
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="bg-white shadow p-4 rounded">
      <div className="text-lg font-semibold mb-2">{title}</div>
      {children}
    </div>
  );
}

function List({ entries, legend }) {
  if (!entries.length) return <div className="text-sm text-gray-500">No data</div>;
  return (
    <ul className="space-y-1 text-sm">
      {entries.map(([k, v]) => (
        <li key={k} className="flex justify-between items-center">
          <span className="capitalize inline-flex items-center gap-2">
            {legend && <span className="inline-block w-3 h-3 rounded-sm" style={{background: legend[k]}} />}
            {k}
          </span>
          <span className="font-medium">{v}</span>
        </li>
      ))}
    </ul>
  );
}

function Bars({ entries }) {
  if (!entries.length) return <div className="text-sm text-gray-500">No data</div>;
  const total = entries.reduce((s, [,v]) => s + v, 0) || 1;
  return (
    <div className="space-y-2">
      {entries.map(([k, v]) => {
        const pct = Math.round((v/total)*100);
        return (
          <div key={k} className="text-sm">
            <div className="flex justify-between"><span className="capitalize">{k}</span><span>{v} ({pct}%)</span></div>
            <div className="w-full h-2 bg-gray-200 rounded">
              <div className="h-2 bg-blue-500 rounded" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Pie({ entries }) {
  if (!entries.length) return <div className="text-sm text-gray-500">No data</div>;
  const colors = ['#60a5fa','#34d399','#fbbf24','#f472b6','#a78bfa','#f87171','#10b981','#f59e0b','#22c55e','#ef4444','#06b6d4'];
  const total = entries.reduce((s, [,v]) => s + v, 0) || 1;
  let acc = 0;
  const stops = entries.map(([k,v],i)=>{ const start=(acc/total)*100; acc+=v; const end=(acc/total)*100; const color=colors[i%colors.length]; return `${color} ${start}% ${end}%`; });
  const legend = Object.fromEntries(entries.map(([k],i)=>[k, colors[i%colors.length]]));
  return (
    <div className="flex items-center gap-4">
      <div className="w-24 h-24 rounded-full" style={{ background: `conic-gradient(${stops.join(',')})` }} />
      <List entries={entries} legend={legend} />
    </div>
  );
}

function BarCurrency({ entries }) {
  if (!entries.length) return <div className="text-sm text-gray-500">No data</div>;
  const max = Math.max(...entries.map(([,v]) => v||0), 1);
  return (
    <div className="space-y-2">
      {entries.sort((a,b)=> b[1]-a[1]).map(([k, v]) => {
        const pct = Math.round(((v||0)/max)*100);
        return (
          <div key={k} className="text-sm">
            <div className="flex justify-between"><span className="capitalize">{k}</span><span>₹{v||0}</span></div>
            <div className="w-full h-2 bg-gray-200 rounded">
              <div className="h-2 bg-indigo-500 rounded" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function dealTypeLabel(code) {
  switch (code) {
    case 'REVIEW_PUBLISHED': return 'Review Published';
    case 'REVIEW_SUBMISSION': return 'Review Submission';
    case 'RATING_ONLY': return 'Rating Only';
    case 'unknown': return 'Unknown';
    default: return code || '-';
  }
}
