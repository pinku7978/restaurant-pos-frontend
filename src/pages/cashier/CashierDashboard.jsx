import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import { loadRazorpayScript } from "../../utils/razorpay";

const CashierDashboard = () => {
  const { user, logout } = useAuth();
  const [bills, setBills] = useState([]);
  const [alertBillId, setAlertBillId] = useState(null); // highlights newest bill
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [processingBillId, setProcessingBillId] = useState(null);
  const [successToast, setSuccessToast] = useState("");
  const audioRef = useRef(null);

  // Load pending bills initially
  const loadBills = () => {
    setLoading(true);
    api.get("/bills/pending")
      .then(({ data }) => setBills(data))
      .catch((err) => console.error("Error loading bills:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBills();
  }, []);

  // Socket.IO real-time listener for bill requests & payments
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socket.on("connect", () => {
      setConnected(true);
      const restaurantId = user?.restaurantId;
      if (restaurantId) {
        socket.emit("join_room", { restaurantId, screen: "cashier" });
      }
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.warn("Cashier socket error:", err.message);
      setConnected(false);
    });

    socket.on("bill_requested", (bill) => {
      setBills((prev) => {
        const filtered = prev.filter((b) => b._id !== bill._id);
        return [bill, ...filtered];
      });
      setAlertBillId(bill._id);
      audioRef.current?.play().catch(() => {});
    });

    socket.on("bill_paid", ({ billId }) => {
      setBills((prev) => prev.filter((b) => b._id !== billId));
    });

    return () => socket.disconnect();
  }, [user?.restaurantId]);

  // Offline / Manual settlement (Cash or external card)
  const markPaid = async (billId, paymentMethod) => {
    try {
      await api.patch(`/bills/${billId}/pay`, { paymentMethod });
      setBills((prev) => prev.filter((b) => b._id !== billId));
      setSuccessToast(`Bill settled successfully as ${paymentMethod.toUpperCase()}`);
      setTimeout(() => setSuccessToast(""), 4000);
    } catch (err) {
      console.error("Failed to mark bill paid:", err);
      alert(err.response?.data?.message || "Failed to settle bill");
    }
  };

  // Reception Razorpay flow: opens Razorpay Checkout with UPI QR / Cards
  const collectRazorpay = async (bill) => {
    try {
      setProcessingBillId(bill._id);

      // 1. Create order on backend
      const { data: orderData } = await api.post(`/bills/${bill._id}/create-payment-order`);

      // 2. Load script
      const scriptReady = await loadRazorpayScript();
      if (!scriptReady) {
        throw new Error("Unable to load Razorpay Checkout SDK");
      }

      const tableNum =
        bill.tableId?.tableNumber ??
        bill.tableNumber ??
        (typeof bill.tableId === "string" ? bill.tableId.slice(-4) : "—");

      // 3. Launch Checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "RestoPulse Front Desk POS",
        description: `Settle Table #${tableNum} Bill`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            await api.post(`/bills/${bill._id}/verify-payment`, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });
            setBills((prev) => prev.filter((b) => b._id !== bill._id));
            setSuccessToast(`Table #${tableNum} settled via Razorpay! Payment ID: ${response.razorpay_payment_id}`);
            setTimeout(() => setSuccessToast(""), 5000);
          } catch (verifyErr) {
            alert(verifyErr.response?.data?.message || "Payment verification failed");
          } finally {
            setProcessingBillId(null);
          }
        },
        prefill: {
          name: "Front Desk Diner",
          contact: ""
        },
        theme: {
          color: "#059669"
        },
        modal: {
          ondismiss: function () {
            setProcessingBillId(null);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        alert(`Payment failed: ${response.error?.description || "Transaction rejected"}`);
        setProcessingBillId(null);
      });
      rzp.open();
    } catch (err) {
      console.error("Cashier Razorpay error:", err);
      alert(err.response?.data?.message || err.message || "Failed to start Razorpay payment");
      setProcessingBillId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 pb-20">
      {/* Audio notification sound */}
      <audio
        ref={audioRef}
        src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="
      />

      {/* Cashier Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 mb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-xl shadow-lg shadow-emerald-500/10">
            💳
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Cashier Billing & POS</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Front Desk
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                connected
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  : "bg-red-500/20 text-red-300 border-red-500/30"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                {connected ? "Socket Online" : "Reconnecting..."}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Pending Bills Awaiting Settlement: <strong className="text-white">{bills.length}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {user?.role === "owner" && (
            <Link
              to="/owner"
              className="text-xs bg-indigo-950/80 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-700/60 rounded-lg px-3 py-1.5 font-medium transition-colors"
            >
              ← Back to Owner Dashboard
            </Link>
          )}

          <button
            onClick={loadBills}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg px-3 py-1.5 font-medium transition-colors"
          >
            🔄 Refresh
          </button>

          <button
            onClick={logout}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg px-3 py-1.5 font-medium transition-colors ml-auto sm:ml-0"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Floating Success Alert Toast */}
      {successToast && (
        <div className="mb-6 p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-700/80 text-emerald-200 text-xs flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
            <span className="text-base">✅</span>
            <span className="font-semibold">{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast("")}
            className="text-emerald-400 hover:text-white text-xs px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Bills Grid */}
      {loading ? (
        <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-2xl text-xs text-slate-400">
          Loading pending bills...
        </div>
      ) : bills.length === 0 ? (
        <div className="p-16 text-center bg-slate-900/40 border border-slate-800 rounded-2xl max-w-lg mx-auto mt-8">
          <span className="text-4xl block mb-3">🧾</span>
          <h2 className="text-base font-bold text-white mb-1">No Pending Bills</h2>
          <p className="text-xs text-slate-400">
            All customer tables are settled up. When diners click "Get Bill" at their table, the bill will pop up here with an audio chime.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {bills.map((bill) => {
            const tableNum =
              bill.tableId?.tableNumber ??
              bill.tableNumber ??
              (typeof bill.tableId === "string" ? bill.tableId.slice(-4) : "—");

            const isFlashing = bill._id === alertBillId;
            const isProcessing = processingBillId === bill._id;

            return (
              <div
                key={bill._id}
                onClick={() => setAlertBillId(null)}
                className={`bg-slate-900/90 border rounded-2xl p-4 shadow-xl flex flex-col justify-between transition-all ${
                  isFlashing
                    ? "border-emerald-500 ring-2 ring-emerald-500/50"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="flex justify-between items-center pb-3 mb-3 border-b border-slate-800">
                    <div>
                      <span className="text-xs text-slate-400 block">Table</span>
                      <span className="text-xl font-black text-white">#{tableNum}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                      Payment Due
                    </span>
                  </div>

                  {/* Items breakdown */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                    {bill.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs py-1 border-b border-slate-800/60">
                        <span className="text-slate-300 truncate mr-2">
                          {item.quantity}x {item.portionSize} {item.name}
                        </span>
                        <span className="text-slate-400 font-medium whitespace-nowrap">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-400">Total Amount:</span>
                    <span className="text-lg font-black text-emerald-400">
                      ₹{bill.totalAmount}
                    </span>
                  </div>
                </div>

                {/* Settle Payment Buttons */}
                <div className="space-y-2 mt-5 pt-3 border-t border-slate-800">
                  {/* Razorpay Online / QR Collection */}
                  <button
                    onClick={() => collectRazorpay(bill)}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span>💳</span>
                    <span>{isProcessing ? "Opening Razorpay POS..." : "Collect via Razorpay (UPI QR / Card)"}</span>
                  </button>

                  {/* Manual Cash or Card Settlement */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => markPaid(bill._id, "cash")}
                      disabled={isProcessing}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-semibold py-2 px-3 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>💵</span>
                      <span>Cash</span>
                    </button>
                    <button
                      onClick={() => markPaid(bill._id, "card")}
                      disabled={isProcessing}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-semibold py-2 px-3 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>📠</span>
                      <span>External POS</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CashierDashboard;
