import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import QRCode from "qrcode";
import api from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";

const tabs = [
  { id: "Menu", label: "🍕 Menu Management", icon: "🍕" },
  { id: "Tables", label: "🪑 Tables & QR Codes", icon: "🪑" },
  { id: "Staff", label: "👥 Staff Roles (Chef / Cashier)", icon: "👥" },
  { id: "Reports", label: "📊 Sales & Reports", icon: "📊" }
];

const OwnerDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("Staff"); // Start on staff tab to immediately show role assignment

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 sticky top-0 z-30 backdrop-blur-md px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-xl shadow-md shadow-indigo-500/20">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white">Owner Dashboard</h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Master Admin
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Logged in as <span className="text-slate-200 font-medium">{user?.name || "Owner"}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Quick Screen Preview Switches */}
            <Link
              to="/kitchen"
              className="text-xs bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-800/60 rounded-lg px-3 py-1.5 font-medium transition-colors flex items-center gap-1.5"
              title="Open the real-time Kitchen Display to preview what chefs see"
            >
              <span>👨‍🍳</span> Kitchen Screen
            </Link>
            <Link
              to="/cashier"
              className="text-xs bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 rounded-lg px-3 py-1.5 font-medium transition-colors flex items-center gap-1.5"
              title="Open the Cashier Billing POS to preview what cashiers see"
            >
              <span>💳</span> Cashier Screen
            </Link>
            <button
              onClick={logout}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg px-3 py-1.5 font-medium transition-colors ml-auto sm:ml-0"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 mt-6">
        {/* Navigation Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                  : "bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Views */}
        {activeTab === "Staff" && <StaffManager />}
        {activeTab === "Menu" && <MenuManager />}
        {activeTab === "Tables" && <TableManager />}
        {activeTab === "Reports" && <Reports />}
      </main>
    </div>
  );
};

/** Owner creates chef/cashier accounts and views existing staff */
const StaffManager = () => {
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", password: "", role: "chef" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const loadStaff = () => {
    setFetching(true);
    api.get("/staff")
      .then(({ data }) => setStaff(data))
      .catch((err) => console.error("Failed to load staff:", err))
      .finally(() => setFetching(false));
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.post("/staff", form);
      setSuccess(`Successfully created ${form.role.toUpperCase()} account for ${form.name}! They can now log in using phone ${form.phone}.`);
      setForm({ name: "", phone: "", password: "", role: "chef" });
      loadStaff();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create staff account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro info box */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 border border-indigo-900/40 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>👥</span> Staff Role Management
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            As the restaurant owner, you assign specific roles to your team.
            Create a <strong className="text-amber-300">Chef</strong> account for kitchen staff, or a <strong className="text-emerald-300">Cashier</strong> account for front-desk billing.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/staff-login"
            target="_blank"
            className="text-xs bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 rounded-lg px-3 py-2 font-medium transition-colors whitespace-nowrap"
          >
            Open Staff Login Screen ↗
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Create Staff Form */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl h-fit">
          <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <span>➕</span> Assign New Staff Role
          </h3>
          <p className="text-xs text-slate-400 mb-5">
            Fill out the details below to generate their login credentials.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs">
              ✅ {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Staff Member Name <span className="text-red-400">*</span>
              </label>
              <input
                placeholder="e.g. Ramesh Kumar"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Phone Number (Login ID) <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                placeholder="e.g. 9811122233"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Staff will enter this phone number on the Staff Login screen.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Assigned Role <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: "chef" })}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    form.role === "chef"
                      ? "bg-amber-950/50 border-amber-500/80 text-amber-200 ring-1 ring-amber-500"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <span className="text-base block mb-0.5">👨‍🍳 Chef</span>
                  <span className="text-[11px] text-slate-400 block leading-tight">
                    Kitchen Display & order preparation
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: "cashier" })}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    form.role === "cashier"
                      ? "bg-emerald-950/50 border-emerald-500/80 text-emerald-200 ring-1 ring-emerald-500"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <span className="text-base block mb-0.5">💳 Cashier</span>
                  <span className="text-[11px] text-slate-400 block leading-tight">
                    POS billing & payment settlements
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Temporary Password <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                placeholder="Assign a password for this staff"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/25 transition-all text-xs disabled:opacity-60 cursor-pointer"
            >
              {loading ? "Creating Staff Account..." : `Assign & Create ${form.role === "chef" ? "Chef" : "Cashier"} Account`}
            </button>
          </form>
        </div>

        {/* Right: Staff Directory */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>📋</span> Active Staff Directory
            </h3>
            <span className="text-xs text-slate-400">
              {staff.length} team member(s)
            </span>
          </div>

          {fetching ? (
            <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-2xl text-xs text-slate-400">
              Loading staff accounts...
            </div>
          ) : staff.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-2xl">
              <span className="text-3xl block mb-2">🧑‍🍳</span>
              <p className="text-sm font-semibold text-white">No staff accounts created yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Use the form on the left to add your first Chef or Cashier. Once created, they can log in immediately.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {staff.map((s) => (
                <div
                  key={s._id}
                  className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${
                          s.role === "owner"
                            ? "bg-indigo-500/20 text-indigo-300"
                            : s.role === "chef"
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-emerald-500/20 text-emerald-300"
                        }`}
                      >
                        {s.role === "owner" ? "👑" : s.role === "chef" ? "👨‍🍳" : "💳"}
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-white">{s.name}</p>
                        <p className="text-[11px] text-slate-400">📞 {s.phone}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                        s.role === "owner"
                          ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                          : s.role === "chef"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      }`}
                    >
                      {s.role}
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Screen Access:</span>
                    <span className="text-slate-300 font-medium">
                      {s.role === "owner"
                        ? "/owner (All screens)"
                        : s.role === "chef"
                        ? "/kitchen (Orders)"
                        : "/cashier (POS)"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/** Add + list menu items */
const MenuManager = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", category: "main", price: "", size: "Full" });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const restaurantId = user?.restaurantId;

  const loadItems = () => {
    if (!restaurantId) return;
    setFetching(true);
    api.get(`/menu/${restaurantId}`)
      .then(({ data }) => setItems(data))
      .catch((err) => console.error("Failed to load menu items:", err))
      .finally(() => setFetching(false));
  };

  useEffect(() => {
    if (restaurantId) {
      loadItems();
    }
  }, [restaurantId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/menu", {
        name: form.name,
        description: form.description,
        category: form.category,
        images: [],
        portions: [{ size: form.size, price: Number(form.price) }]
      });
      setForm({ name: "", description: "", category: "main", price: "", size: "Full" });
      loadItems();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add menu item");
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (item) => {
    try {
      await api.patch(`/menu/${item._id}`, { isAvailable: !item.isAvailable });
      loadItems();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Item Form */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
          <span>➕</span> Add New Menu Item
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Items added here appear instantly on customer digital menus.
        </p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <input
            placeholder="Item name (e.g. Butter Chicken)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 sm:col-span-2"
            required
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
          >
            <option value="starter">Starter</option>
            <option value="main">Main Course</option>
            <option value="dessert">Dessert</option>
            <option value="drink">Drink</option>
          </select>
          <input
            placeholder="Portion (e.g. Full, Half)"
            value={form.size}
            onChange={(e) => setForm({ ...form, size: e.target.value })}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
            required
          />
          <input
            type="number"
            placeholder="Price in ₹"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
            required
          />
          <input
            placeholder="Description (ingredients, dietary flags)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 sm:col-span-2 md:col-span-3"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg py-2 text-xs transition-colors cursor-pointer"
          >
            {loading ? "Adding..." : "Add Item"}
          </button>
        </form>
      </div>

      {/* Menu List */}
      <div>
        <h3 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
          <span>🍽️ Menu Items ({items.length})</span>
        </h3>

        {fetching ? (
          <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-2xl text-xs text-slate-400">
            Loading menu...
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-2xl text-xs text-slate-400">
            No dishes added yet. Use the form above to add your first dish.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {items.map((item) => (
              <div key={item._id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-semibold text-xs text-white">{item.name}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 capitalize border border-slate-700">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">
                    {item.description || "No description provided"}
                  </p>
                  <div className="space-y-1">
                    {item.portions?.map((p, i) => (
                      <p key={i} className="text-xs text-slate-200">
                        <span className="text-slate-400">{p.size}:</span> ₹{p.price}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
                  <span className={`text-[11px] font-medium ${item.isAvailable !== false ? "text-emerald-400" : "text-red-400"}`}>
                    {item.isAvailable !== false ? "● Available" : "○ Sold Out"}
                  </span>
                  <button
                    onClick={() => toggleAvailability(item)}
                    className="text-[11px] text-slate-300 hover:text-white border border-slate-700 px-2 py-1 rounded-md"
                  >
                    Toggle Status
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/** Create tables and show downloadable QR codes */
const TableManager = () => {
  const [tables, setTables] = useState([]);
  const [tableNumber, setTableNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  const loadTables = async () => {
    setFetching(true);
    try {
      const { data } = await api.get("/tables");
      const origin = window.location.origin;

      // Ensure every table has a high-res QR code pointing directly to current frontend origin
      const enriched = await Promise.all(
        data.map(async (item) => {
          const directUrl = `${origin}/order?table=${item.table.qrToken}`;
          let qr = item.qrCodeImage;
          try {
            qr = await QRCode.toDataURL(directUrl, {
              width: 400,
              margin: 2,
              color: { dark: "#0f172a", light: "#ffffff" }
            });
          } catch (_) {}
          return {
            ...item,
            orderingUrl: directUrl,
            qrCodeImage: qr
          };
        })
      );
      setTables(enriched);
    } catch (err) {
      console.error("Failed to load tables:", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/tables", { tableNumber: Number(tableNumber) });
      setTableNumber("");
      loadTables();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create table");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = (tableId, url) => {
    navigator.clipboard.writeText(url);
    setCopiedId(tableId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Create Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
          <span>➕</span> Add Restaurant Dining Table
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Each table receives a unique scannable QR code encoded with your deployed frontend URL (<code>{window.location.origin}</code>).
        </p>
        <form onSubmit={handleCreate} className="flex gap-3 max-w-md">
          <input
            type="number"
            placeholder="Table number (e.g. 1)"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white flex-1 focus:outline-none focus:border-indigo-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg px-4 py-2 text-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            {loading ? "Generating..." : "Generate Table & QR"}
          </button>
        </form>
      </div>

      {/* Tables Grid */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-white">
            🪑 Registered Tables & Digital QR Cards ({tables.length})
          </h3>
          <button
            onClick={loadTables}
            className="text-xs text-slate-400 hover:text-white border border-slate-800 bg-slate-900 px-3 py-1 rounded-lg transition-colors cursor-pointer"
          >
            🔄 Refresh Tables
          </button>
        </div>

        {fetching ? (
          <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-2xl text-xs text-slate-400">
            Loading tables...
          </div>
        ) : tables.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-2xl text-xs text-slate-400">
            No tables added yet. Enter a table number above to generate your first QR code.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tables.map(({ table, qrCodeImage, orderingUrl }) => (
              <div key={table._id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center flex flex-col justify-between hover:border-slate-700 transition-all">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-sm text-white">Table {table.tableNumber}</span>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                      QR Active
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl inline-block shadow-inner mb-2">
                    <img
                      src={qrCodeImage}
                      alt={`QR for table ${table.tableNumber}`}
                      className="w-32 h-32 mx-auto"
                    />
                  </div>

                  <p className="text-[10px] text-slate-400 font-mono truncate px-1 mb-2" title={orderingUrl}>
                    {orderingUrl}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <div className="grid grid-cols-2 gap-1.5">
                    <a
                      href={qrCodeImage}
                      download={`table-${table.tableNumber}-qr.png`}
                      className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 rounded-lg block transition-colors border border-slate-700 text-center"
                    >
                      📥 Download
                    </a>
                    <button
                      onClick={() => copyLink(table._id, orderingUrl)}
                      className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 rounded-lg block transition-colors border border-slate-700 text-center cursor-pointer"
                    >
                      {copiedId === table._id ? "✅ Copied!" : "📋 Copy Link"}
                    </button>
                  </div>

                  <a
                    href={`/menu?table=${table.qrToken}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full text-xs text-indigo-400 hover:text-indigo-300 py-1 block transition-colors"
                  >
                    Open Diner Screen ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Reports = () => {
  const [performance, setPerformance] = useState(null);
  const [sales, setSales] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/reports/item-performance").then(({ data }) => setPerformance(data)).catch(console.error),
      api.get("/reports/sales-summary").then(({ data }) => setSales(data)).catch(console.error)
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-2xl text-xs text-slate-400">
        Loading sales reports & performance metrics...
      </div>
    );
  }

  const totalSales = sales?.dailyTotals?.reduce((acc, curr) => acc + (curr.totalSales || 0), 0) || 0;
  const totalBills = sales?.dailyTotals?.reduce((acc, curr) => acc + (curr.billsCount || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
          <span className="text-xs text-slate-400 font-medium">Total Revenue Settled</span>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">₹{totalSales}</p>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
          <span className="text-xs text-slate-400 font-medium">Total Paid Bills</span>
          <p className="text-2xl font-extrabold text-indigo-400 mt-1">{totalBills}</p>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
          <span className="text-xs text-slate-400 font-medium">Top Dish by Volume</span>
          <p className="text-lg font-bold text-amber-300 mt-1 truncate">
            {performance?.bestSellers?.[0]?._id || "No sales yet"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Best Sellers */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <span>🔥</span> Best Selling Dishes
          </h3>
          {performance?.bestSellers?.length ? (
            <div className="space-y-3">
              {performance.bestSellers.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-800 text-xs">
                  <div>
                    <span className="font-semibold text-slate-200">{item._id}</span>
                    <span className="block text-[11px] text-slate-400">{item.quantitySold} units sold</span>
                  </div>
                  <span className="font-bold text-emerald-400">₹{item.revenue}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No dish sales recorded yet.</p>
          )}
        </div>

        {/* Daily Sales */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <span>📈</span> Daily Sales History
          </h3>
          {sales?.dailyTotals?.length ? (
            <div className="space-y-3">
              {sales.dailyTotals.map((day, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-800 text-xs">
                  <div>
                    <span className="font-semibold text-slate-200">{day._id}</span>
                    <span className="block text-[11px] text-slate-400">{day.billsCount} bills settled</span>
                  </div>
                  <span className="font-bold text-emerald-400">₹{day.totalSales}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No settled bills yet today.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
