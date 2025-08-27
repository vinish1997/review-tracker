export default function Dashboard() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white shadow p-4 rounded">Total Reviews: 0</div>
        <div className="bg-white shadow p-4 rounded">Payment Received: ₹0</div>
        <div className="bg-white shadow p-4 rounded">Pending Reviews: 0</div>
      </div>
    </div>
  );
}
