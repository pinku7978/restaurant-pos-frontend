import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import { loadRazorpayScript } from "../../utils/razorpay";

const MenuPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTableParam = searchParams.get("table");
  const { user, logout } = useAuth();

  const [qrToken, setQrToken] = useState(() => {
    return urlTableParam || localStorage.getItem("resto_table_token") || "";
  });

  const [table, setTable] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [cart, setCart] = useState([]); // [{ menuItemId, name, portionSize, price, quantity }]
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [billStatus, setBillStatus] = useState(null); // { requested: true, amount: 0, billId: null, paid: false }
  const [paymentSuccessModal, setPaymentSuccessModal] = useState(null);

  // Available tables when no table is selected
  const [availableTables, setAvailableTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [manualToken, setManualToken] = useState("");

  // Sync token from URL param if present
  useEffect(() => {
    if (urlTableParam) {
      localStorage.setItem("resto_table_token", urlTableParam);
      setQrToken(urlTableParam);
    }
  }, [urlTableParam]);

  // Step 1: resolve the QR token into table + restaurant info
  useEffect(() => {
    if (!qrToken) {
      setLoadingTables(true);
      api
        .get("/tables/public")
        .then(({ data }) => setAvailableTables(data))
        .catch(() => {})
        .finally(() => setLoadingTables(false));
      return;
    }

    api
      .get(`/tables/token/${qrToken}`)
      .then(({ data }) => {
        setTable(data);
        localStorage.setItem("resto_table_token", qrToken);
        setError("");
      })
      .catch(() => {
        setError("Invalid or expired table QR code. Please pick a table below.");
        localStorage.removeItem("resto_table_token");
        setQrToken("");
      });
  }, [qrToken]);

  // Step 2: once we know the restaurant, load its menu & existing sessions
  useEffect(() => {
    if (!table) return;
    const rId = table.restaurantId?._id || table.restaurantId;

    // Load Menu
    api
      .get(`/menu/${rId}`)
      .then(({ data }) => setMenuItems(data))
      .catch(() => setError("Failed to load restaurant menu"));

    // Check for existing active session on this table so diner doesn't have to restart
    api
      .get(`/sessions/table/${table._id}`)
      .then(async ({ data }) => {
        if (data && data.length > 0) {
          const active = data[0];
          setSessionId(active._id);
          if (active.status === "bill_requested") {
            try {
              const { data: bill } = await api.get(`/bills/session/${active._id}`);
              setBillStatus({ requested: true, amount: bill.totalAmount, billId: bill._id });
            } catch {
              setBillStatus({ requested: true });
            }
          }
        }
      })
      .catch(() => {});
  }, [table]);

  const handleSelectTable = (selectedTable) => {
    if (selectedTable?.qrToken) {
      localStorage.setItem("resto_table_token", selectedTable.qrToken);
      setSearchParams({ table: selectedTable.qrToken });
      setQrToken(selectedTable.qrToken);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualToken.trim()) {
      localStorage.setItem("resto_table_token", manualToken.trim());
      setSearchParams({ table: manualToken.trim() });
      setQrToken(manualToken.trim());
      setManualToken("");
    }
  };

  const switchTable = () => {
    localStorage.removeItem("resto_table_token");
    setSearchParams({});
    setQrToken("");
    setTable(null);
    setSessionId(null);
    setCart([]);
    setBillStatus(null);
  };

  const startSession = async () => {
    if (!table) return;
    setError("");
    try {
      const { data } = await api.post("/sessions", { tableId: table._id });
      setSessionId(data._id);
      setSuccess("Ordering session started! You can now add dishes to cart.");
      setTimeout(() => setSuccess(""), 4000);
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
      setSuccess("Order sent straight to kitchen chef! 👨‍🍳 Watch the Kitchen Display update in real-time.");
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  const requestBill = async () => {
    if (!sessionId) return;
    try {
      setLoading(true);
      const { data } = await api.post(`/sessions/${sessionId}/request-bill`);
      setBillStatus({ requested: true, amount: data.totalAmount, billId: data._id });
      setSuccess(`Bill requested for Table #${table?.tableNumber}! Total: ₹${data.totalAmount}. The cashier has received this on their POS.`);
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to request bill");
    } finally {
      setLoading(false);
    }
  };

  // Pay Online via Razorpay
  const payOnline = async () => {
    if (!sessionId && !billStatus?.billId) {
      setError("No active dining session found to pay.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let targetBillId = billStatus?.billId;
      let billTotal = billStatus?.amount;

      // If bill is not yet generated, request it now
      if (!targetBillId) {
        const { data: generatedBill } = await api.post(`/sessions/${sessionId}/request-bill`);
        targetBillId = generatedBill._id;
        billTotal = generatedBill.totalAmount;
        setBillStatus({ requested: true, amount: billTotal, billId: targetBillId });
      }

      // 1. Create order on backend
      const { data: orderData } = await api.post(`/bills/${targetBillId}/create-payment-order`);

      // 2. Load script
      const scriptReady = await loadRazorpayScript();
      if (!scriptReady) {
        throw new Error("Unable to load Razorpay Checkout SDK. Please verify internet connection.");
      }

      // 3. Launch Checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: table?.restaurantId?.name || "Restaurant Bill",
        description: `Dining Bill for Table #${table?.tableNumber}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            setLoading(true);
            await api.post(`/bills/${targetBillId}/verify-payment`, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });

            setPaymentSuccessModal({
              paymentId: response.razorpay_payment_id,
              amount: billTotal || (orderData.amount / 100),
              tableNumber: table?.tableNumber
            });
            setBillStatus({ requested: true, paid: true, amount: billTotal });
            setSessionId(null);
            setCart([]);
            localStorage.removeItem("resto_table_token");
          } catch (verifyErr) {
            setError(verifyErr.response?.data?.message || "Payment verification failed. Please check with the cashier.");
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: user?.name || "Diner",
          contact: user?.phone || ""
        },
        theme: {
          color: "#4f46e5"
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        setError(`Payment failed: ${response.error?.description || "Payment cancelled or rejected"}`);
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      console.error("Razorpay initiation error:", err);
      setError(err.response?.data?.message || err.message || "Failed to initiate payment");
      setLoading(false);
    }
  };

  // If no table is active, show the interactive Table Selector
  if (!qrToken || !table) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-lg w-full shadow-2xl space-y-6">
          <div className="text-center">
            <span className="text-4xl block mb-2">🍽️</span>
            <h1 className="text-xl font-bold text-white mb-1">Select Dining Table</h1>
            <p className="text-xs text-slate-400">
              Pick a table to view the digital menu and start ordering dishes straight to the kitchen.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs">
              ⚠️ {error}
            </div>
          )}

          {/* List of active tables */}
          <div>
            <h2 className="text-xs font-semibold text-slate-300 mb-3 flex items-center justify-between">
              <span>Registered Tables in Restaurant</span>
              {loadingTables && <span className="text-[10px] text-indigo-400">Refreshing...</span>}
            </h2>

            {loadingTables ? (
              <div className="text-center py-6 text-xs text-slate-500">Loading tables...</div>
            ) : availableTables.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
                No dining tables created yet. Please sign in as Owner to create dining tables.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                {availableTables.map((t) => (
                  <button
                    key={t._id}
                    onClick={() => handleSelectTable(t)}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-700 hover:border-pink-500 hover:bg-pink-950/20 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-white group-hover:text-pink-300">
                        Table #{t.tableNumber}
                      </span>
                      <span className="text-xs">🪑</span>
                    </div>
                    <span className="text-[10px] text-slate-400 truncate block">
                      {t.restaurantId?.name || "Main Dining"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Or Manual Table Token */}
          <div className="pt-4 border-t border-slate-800">
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Or Enter Table QR Token / Code
            </label>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Paste table QR token..."
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white flex-1 focus:outline-none focus:border-pink-500"
              />
              <button
                type="submit"
                className="bg-pink-600 hover:bg-pink-500 text-white font-semibold rounded-lg px-4 py-2 text-xs transition-colors cursor-pointer"
              >
                Connect Table →
              </button>
            </form>
          </div>

          {/* Quick link navigation */}
          <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80">
            <Link to="/" className="hover:text-white transition-colors">
              ← Portal Home
            </Link>
            {user?.role === "owner" && (
              <Link to="/owner" className="text-indigo-400 hover:text-indigo-300 font-medium">
                Owner Dashboard →
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const cartTotal = cart.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-36">
      {/* Payment Success Celebration Modal */}
      {paymentSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-full flex items-center justify-center text-3xl mx-auto shadow-lg shadow-emerald-500/20">
              ✓
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Payment Successful!</h2>
              <p className="text-xs text-slate-400 mt-0.5">Thank you for dining with us</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Table:</span>
                <span className="font-bold text-white">#{paymentSuccessModal.tableNumber}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Amount Paid:</span>
                <span className="font-extrabold text-emerald-400 text-sm">₹{paymentSuccessModal.amount}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Payment ID:</span>
                <span className="font-mono text-[10px] text-slate-300 truncate max-w-[140px]">
                  {paymentSuccessModal.paymentId}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Gateway:</span>
                <span className="font-semibold text-indigo-400">Razorpay Verified</span>
              </div>
            </div>

            <button
              onClick={() => {
                setPaymentSuccessModal(null);
                setBillStatus(null);
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-lg shadow-emerald-600/30"
            >
              Done & Finish
            </button>
          </div>
        </div>
      )}

      {/* Top Diner Bar */}
      <header className="sticky top-0 z-20 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md px-4 py-3">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-sm font-bold text-white">
              {table.restaurantId?.name || "Restaurant Menu"}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Table #{table.tableNumber}
              </span>
              <button
                onClick={switchTable}
                className="text-[10px] text-slate-400 hover:text-pink-300 underline cursor-pointer"
              >
                Change Table
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-300 font-medium">
              {user ? user.name : "Diner"}
            </span>
            <button
              onClick={logout}
              className="text-[10px] text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-2.5 py-1 rounded transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
            <span>✅</span>
            <span>{success}</span>
          </div>
        )}

        {/* Bill requested banner */}
        {billStatus?.requested && !billStatus?.paid && (
          <div className="bg-amber-950/50 border border-amber-800/80 p-4 rounded-2xl text-amber-200 text-xs space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🧾</span>
                <div>
                  <p className="font-bold text-sm text-white">Bill Generated</p>
                  <p className="text-[11px] text-amber-300/80">Table #{table?.tableNumber} is ready to settle</p>
                </div>
              </div>
              {billStatus.amount ? (
                <span className="font-black text-emerald-400 text-lg">₹{billStatus.amount}</span>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={payOnline}
                disabled={loading}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2 px-3 rounded-xl text-xs transition-all shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>💳</span>
                <span>Pay Online</span>
              </button>
              <div className="text-center text-[10px] text-amber-300/70 flex items-center justify-center border border-amber-800/50 rounded-xl px-2">
                Or pay Cash at Counter
              </div>
            </div>
          </div>
        )}

        {!sessionId && table && !billStatus?.requested && (
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
            No dishes added for this restaurant yet. (Owner can add items from the Menu tab in Owner Dashboard)
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

      {/* Payment and Bill Request Buttons */}
      {sessionId && (
        <div className="max-w-md mx-auto px-4 mt-6 space-y-2.5">
          <button
            onClick={payOnline}
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl text-xs shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>💳</span>
            <span>{loading ? "Connecting to Razorpay..." : "Pay Online Now (Razorpay UPI / Cards)"}</span>
          </button>

          <button
            onClick={requestBill}
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-600/40 font-semibold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>🔔</span>
            <span>Request Bill from Cashier (Cash Payment)</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MenuPage;
