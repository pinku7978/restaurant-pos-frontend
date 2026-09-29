import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";

const MenuPage = () => {
  const [searchParams] = useSearchParams();
  const qrToken = searchParams.get("table");
  const { user, logout } = useAuth();

  const [table, setTable] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [cart, setCart] = useState([]); // [{ menuItemId, name, portionSize, price, quantity }]
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1: resolve the QR token into table + restaurant info
  useEffect(() => {
    if (!qrToken) return;
    api
      .get(`/tables/token/${qrToken}`)
      .then(({ data }) => setTable(data))
      .catch(() => setError("Invalid or expired table QR code."));
  }, [qrToken]);

  // Step 2: once we know the restaurant, load its menu
  useEffect(() => {
    if (!table) return;
    const rId = table.restaurantId?._id || table.restaurantId;
    api
      .get(`/menu/${rId}`)
      .then(({ data }) => setMenuItems(data))
      .catch(() => setError("Failed to load restaurant menu"));
  }, [table]);

  const startSession = async () => {
    if (!table) return;
    setError("");
    try {
      const { data } = await api.post("/sessions", { tableId: table._id });
      setSessionId(data._id);
      setSuccess("Ordering session started! You can now add dishes to cart.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to start session");
    }
  };

  const addToCart = (item, portion) => {
    setCart((prev) => {
      const existing = prev.find(
        (p) => p.menuItemId === item._id && p.portionSize === portion.size
      );
      if (existing) {
        return prev.map((p) =>
          p.menuItemId === item._id && p.portionSize === portion.size
            ? { ...p, quantity: p.quantity + 1 }
            : p
        );
      }
      return [
        ...prev,
        {
          menuItemId: item._id,
          name: item.name,
          portionSize: portion.size,
          price: portion.price,
          quantity: 1
        }
      ];
    });
  };

  const removeFromCart = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const placeOrder = async () => {
    if (!sessionId) {
      setError("Please click 'Start Ordering' first to begin a session for this table.");
      return;
    }
    if (cart.length === 0) return;

    setLoading(true);
    setError("");
    try {
      await api.post("/orders", { sessionId, tableId: table._id, items: cart });
      setCart([]);
      setSuccess("Order sent straight to kitchen chef!");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  const requestBill = async () => {
    if (!sessionId) return;
    try {
      const { data } = await api.post(`/sessions/${sessionId}/request-bill`);
      alert(`Bill requested for Table ${table?.tableNumber}! Total amount: ₹${data.totalAmount}. The cashier will settle your payment shortly.`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to request bill");
    }
  };

  if (!qrToken) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 text-center">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full shadow-2xl">
          <span className="text-4xl block mb-3">📱</span>
          <h1 className="text-xl font-bold text-white mb-2">No Table Detected</h1>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            To view the dining menu and place orders, please scan the QR code located on your table, or open a table link from the Owner Dashboard.
          </p>
          <div className="space-y-2">
            <Link
              to="/"
              className="block w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors"
            >
              Go to Home Portals
            </Link>
            <Link
              to="/owner"
              className="block w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2 rounded-xl text-xs transition-colors border border-slate-700"
            >
              Open Owner Dashboard (To View Tables)
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const cartTotal = cart.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-36">
      {/* Top Diner Bar */}
      <header className="sticky top-0 z-20 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md px-4 py-3">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-sm font-bold text-white">
              {table ? table.restaurantId?.name || "Restaurant Menu" : "Loading..."}
            </h1>
            <p className="text-[11px] text-amber-400 font-semibold">
              {table ? `Table #${table.tableNumber}` : "Detecting table..."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">
              {user ? user.name : "Diner"}
            </span>
            <button
              onClick={logout}
              className="text-[10px] text-slate-400 hover:text-white border border-slate-700 px-2 py-1 rounded"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs">
            ✅ {success}
          </div>
        )}

        {!sessionId && table && (
          <div className="bg-gradient-to-r from-emerald-950/50 to-teal-950/40 border border-emerald-800/60 p-4 rounded-2xl text-center">
            <p className="text-xs text-emerald-200 mb-3">
              Ready to dine at Table #{table.tableNumber}? Start your ordering session below.
            </p>
            <button
              onClick={startSession}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-600/25 transition-colors cursor-pointer"
            >
              🚀 Start Ordering for Table #{table.tableNumber}
            </button>
          </div>
        )}

        {/* Menu Items */}
        {["starter", "main", "dessert", "drink"].map((category) => {
          const items = menuItems.filter((i) => i.category === category);
          if (items.length === 0) return null;

          return (
            <div key={category} className="space-y-2">
              <h2 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 px-1 pt-2 flex items-center gap-1.5">
                <span>{category === "starter" ? "🥗" : category === "main" ? "🍛" : category === "dessert" ? "🍰" : "🥤"}</span>
                {category} Course
              </h2>

              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item._id}
                    className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="text-xs font-bold text-white">{item.name}</h3>
                        <span className="text-[10px] text-slate-400 capitalize">
                          {item.category}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3 pt-2.5 border-t border-slate-800/80">
                      {item.portions?.map((portion) => (
                        <button
                          key={portion.size}
                          onClick={() => addToCart(item, portion)}
                          className="bg-slate-950 hover:bg-indigo-600 text-slate-200 hover:text-white border border-slate-700 hover:border-indigo-500 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          + {portion.size} • ₹{portion.price}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {menuItems.length === 0 && (
          <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-xl text-xs text-slate-400">
            No dishes available for this restaurant yet.
          </div>
        )}
      </main>

      {/* Floating Bottom Drawer / Cart */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 border-t border-slate-800 p-4 shadow-2xl backdrop-blur-md">
          <div className="max-w-md mx-auto space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-white">
                🛒 Cart ({cart.reduce((a, c) => a + c.quantity, 0)} items)
              </span>
              <span className="text-sm font-black text-emerald-400">
                Total: ₹{cartTotal}
              </span>
            </div>

            {/* Cart Items Preview */}
            <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
              {cart.map((c, i) => (
                <div key={i} className="flex justify-between items-center text-xs py-1 border-b border-slate-800">
                  <span className="text-slate-300 truncate">
                    {c.quantity}x {c.name} ({c.portionSize})
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-200 font-semibold">₹{c.price * c.quantity}</span>
                    <button
                      onClick={() => removeFromCart(i)}
                      className="text-red-400 hover:text-red-300 text-xs px-1"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={placeOrder}
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
            >
              {loading ? "Sending to Kitchen..." : `Send Order to Kitchen (₹${cartTotal}) →`}
            </button>
          </div>
        </div>
      )}

      {/* Call for Bill button */}
      {sessionId && (
        <div className="max-w-md mx-auto px-4 mt-6">
          <button
            onClick={requestBill}
            className="w-full bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-600/40 font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
          >
            🔔 Request Final Bill from Cashier
          </button>
        </div>
      )}
    </div>
  );
};

export default MenuPage;
