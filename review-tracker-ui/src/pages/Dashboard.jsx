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
          <List entries={statusEntries} />
        </Panel>
        <Panel title="By Platform">
          <List entries={platformEntries} />
        </Panel>
        <Panel title="By Deal Type">
          <List entries={dealEntries} />
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

function List({ entries }) {
  if (!entries.length) return <div className="text-sm text-gray-500">No data</div>;
  return (
    <ul className="space-y-1 text-sm">
      {entries.map(([k, v]) => (
        <li key={k} className="flex justify-between"><span className="capitalize">{k}</span><span className="font-medium">{v}</span></li>
      ))}
    </ul>
  );
}
