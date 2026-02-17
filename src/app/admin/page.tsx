export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-playfair text-(--color-text-primary) mb-6">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-xl shadow">
          <div className="text-sm text-text-secondary">
            Total Orders
          </div>
          <div className="text-2xl font-semibold mt-2">—</div>
        </div>

        <div className="p-6 bg-white rounded-xl shadow">
          <div className="text-sm text-text-secondary">
            Products
          </div>
          <div className="text-2xl font-semibold mt-2">—</div>
        </div>

        <div className="p-6 bg-white rounded-xl shadow">
          <div className="text-sm text-text-secondary">
            Customers
          </div>
          <div className="text-2xl font-semibold mt-2">—</div>
        </div>
      </div>
    </div>
  );
}
