import { useEffect, useState } from "react";
import axios from "axios";

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    axios.get("/api/reviews/dashboard").then(res => setData(res.data));
  }, []);

  if (!data) return <p>Loading...</p>;

  const statusEntries = Object.entries(data.statusCounts || {});
  const platformEntries = Object.entries(data.platformCounts || {});
  const dealEntries = Object.entries(data.dealTypeCounts || {});
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
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Dashboard</h2>
      <div className="grid grid-cols-3 gap-4">
        <Card title="Total Reviews" value={data.totalReviews} />
        <Card title="Payment Received" value={`₹${data.totalPaymentReceived}`} />
        <Card title="Pending Reviews" value={data.reviewsPending} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Panel title="By Status">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full" style={donut.style} />
            <List entries={statusEntries} legend={donut.legend} />
          </div>
        </Panel>
        <Panel title="By Platform">
          <Bars entries={platformEntries} />
        </Panel>
        <Panel title="By Deal Type">
          <Bars entries={dealEntries} />
        </Panel>
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="bg-white shadow p-4 rounded">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
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
