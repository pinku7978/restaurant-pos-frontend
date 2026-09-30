import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";

const statusFlow = { new: "preparing", preparing: "ready", ready: "served" };
const statusLabel = { new: "New", preparing: "Preparing", ready: "Ready", served: "Served" };
const statusColor = {
  new: "bg-red-500/20 text-red-300 border-red-500/40",
  preparing: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  ready: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
};

/** Reads an order aloud, e.g. "1 full butter chicken, table 7" */
const announceOrder = (order, muted) => {
  if (muted || !("speechSynthesis" in window)) return;
  order.items?.forEach((item) => {
    const sentence = `${item.quantity} ${item.portionSize} ${item.name}, table ${order.tableNumber || ""}`;
    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.lang = "en-IN";
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  });
};

const KitchenDisplay = () => {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  const fetchOrders = () => {
    setLoading(true);
    api.get("/orders/kitchen")
      .then(({ data }) => setOrders(data))
      .catch((err) => console.error("Error fetching kitchen orders:", err))
      .finally(() => setLoading(false));
  };

  // Initial load: fetch all active kitchen orders
  useEffect(() => {
    fetchOrders();
  }, []);

  // Real-time channel with Socket.IO
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      const restaurantId = user?.restaurantId;
      if (restaurantId) {
        socket.emit("join_room", { restaurantId, screen: "kitchen" });
      }
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.warn("Kitchen socket error:", err.message);
      setConnected(false);
    });

    socket.on("new_order", (order) => {
      setOrders((prev) => {
        // avoid duplicate orders if socket emits multiple times
        if (prev.some((o) => o._id === order._id)) return prev;
        return [order, ...prev];
      });
      announceOrder(order, muted);
    });

    return () => socket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.restaurantId, muted]);

  const updateItemStatus = async (orderId, itemId, currentStatus) => {
    const nextStatus = statusFlow[currentStatus];
    if (!nextStatus) return;

    try {
      await api.patch(`/orders/${orderId}/items/${itemId}`, { status: nextStatus });

      setOrders((prev) =>
        prev
          .map((order) => {
            if (order._id !== orderId) return order;
            const items = order.items.map((item) =>
              item._id === itemId ? { ...item, status: nextStatus } : item
            );
            return { ...order, items };
          })
          // drop orders where every item is now served
          .filter((order) => order.items.some((item) => item.status !== "served"))
      );
    } catch (err) {
      console.error("Failed to update item status:", err);
      alert(err.response?.data?.message || "Failed to update item status");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 pb-20">
      {/* Kitchen Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 mb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center text-xl shadow-lg shadow-amber-500/10">
            👨‍🍳
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Kitchen Display System (KDS)</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Live Kitchen
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
              Active Orders in Queue: <strong className="text-white">{orders.length}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={fetchOrders}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg px-2.5 py-1.5 font-medium transition-colors cursor-pointer"
            title="Refresh order queue manually"
          >
            🔄 Refresh
          </button>

          {user?.role === "owner" && (
            <Link
              to="/owner"
              className="text-xs bg-indigo-950/80 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-700/60 rounded-lg px-3 py-1.5 font-medium transition-colors"
            >
              ← Back to Owner
            </Link>
          )}

          <button
            onClick={() => setMuted((m) => !m)}
            className={`text-xs border rounded-lg px-3 py-1.5 font-medium transition-colors ${
              muted
                ? "bg-slate-800 text-slate-400 border-slate-700"
                : "bg-amber-950/60 text-amber-300 border-amber-800/60"
            }`}
          >
            {muted ? "🔇 Speech Muted" : "🔊 Audio Voice ON"}
          </button>

          <button
            onClick={logout}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg px-3 py-1.5 font-medium transition-colors ml-auto sm:ml-0"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Orders Grid */}
      {loading ? (
        <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-2xl text-xs text-slate-400">
          Loading active kitchen orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="p-16 text-center bg-slate-900/40 border border-slate-800 rounded-2xl max-w-lg mx-auto mt-8">
          <span className="text-4xl block mb-3">🍳</span>
          <h2 className="text-base font-bold text-white mb-1">Kitchen Queue is Clean!</h2>
          <p className="text-xs text-slate-400">
            No pending dishes right now. As soon as customers order from tables, order tickets will appear here with live speech announcement.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {orders.map((order) => {
            const tableNum =
              order.tableNumber ??
              order.tableId?.tableNumber ??
              (typeof order.tableId === "string" ? order.tableId.slice(-4) : "—");

            const activeItems = order.items?.filter((i) => i.status !== "served") || [];
            if (activeItems.length === 0) return null;

            return (
              <div
                key={order._id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center pb-3 mb-3 border-b border-slate-800">
                    <div>
                      <span className="text-xs text-slate-400 block">Table</span>
                      <span className="text-xl font-black text-amber-400">#{tableNum}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-1 rounded-md">
                      {new Date(order.placedAt || order.createdAt || Date.now()).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {activeItems.map((item) => (
                      <div
                        key={item._id}
                        className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl flex flex-col justify-between gap-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-bold text-white">
                              {item.quantity}x {item.name}
                            </p>
                            <span className="text-[11px] text-slate-400">
                              Portion: {item.portionSize}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                              statusColor[item.status] || "bg-slate-800 text-slate-300"
                            }`}
                          >
                            {statusLabel[item.status] || item.status}
                          </span>
                        </div>

                        {statusFlow[item.status] && (
                          <button
                            onClick={() => updateItemStatus(order._id, item._id, item.status)}
                            className="w-full bg-slate-800 hover:bg-amber-600 hover:text-white text-slate-200 border border-slate-700 hover:border-amber-500 text-xs font-semibold py-1.5 rounded-lg transition-colors cursor-pointer mt-1"
                          >
                            Mark as {statusLabel[statusFlow[item.status]]} →
                          </button>
                        )}
                      </div>
                    ))}
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

export default KitchenDisplay;
