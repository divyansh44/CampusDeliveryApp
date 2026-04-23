import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import { useOrderRealtime } from "../hooks/useOrderRealtime";
import { api } from "../lib/api";

export default function StudentDashboard() {
  const [shops, setShops] = useState([]);
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [reviewOrderId, setReviewOrderId] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, comment: "" });

  // Report Issue state
  const [reportOrderId, setReportOrderId] = useState(null);
  const [reportDescription, setReportDescription] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [shopData, orderData] = await Promise.all([api.getShops(), api.getMyOrders()]);
      setShops(shopData);
      setOrders(orderData);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (order) => {
    try {
      await api.createFeedback({
        shopId: order.shop_id || order.shop?._id || order.shop?.id,
        orderId: order.id || order._id,
        rating: feedbackForm.rating,
        comment: feedbackForm.comment,
      });
      setMessage("Thank you! Your feedback has been submitted.");
      setReviewOrderId(null);
      setFeedbackForm({ rating: 5, comment: "" });
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      await api.cancelOrder(orderId);
      setMessage("Order cancelled successfully.");
      await loadData();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleReportIssue = async (orderId) => {
    if (!reportDescription.trim() || reportDescription.trim().length < 5) {
      setMessage("Please describe the issue in at least 5 characters.");
      return;
    }
    setReportSubmitting(true);
    try {
      await api.reportOrderIssue(orderId, reportDescription);
      setMessage("Issue reported! Our admin team will follow up with you.");
      setReportOrderId(null);
      setReportDescription("");
      await loadData();
      setTimeout(() => setMessage(""), 5000);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setReportSubmitting(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useOrderRealtime(loadData);

  return (
    <div className="flex flex-col gap-10 animate-fade-in pb-20">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 to-teal-700 p-8 md:p-12 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-xl">
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-4 border border-white/20">
              Student Dashboard
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
              Browse, order, and track live.
            </h2>
            <p className="text-primary-100 text-lg">
              Watch your orders update in real-time as vendors prepare them and drivers pick them up.
            </p>
          </div>
          <Link to="/cart" className="flex items-center gap-2 bg-white text-primary-600 hover:bg-slate-50 font-semibold py-3 px-8 rounded-xl shadow-lg transition-transform transform hover:-translate-y-1 self-start md:self-auto">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
            Open Cart
          </Link>
        </div>
      </section>

      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 shadow-sm ${
          message.toLowerCase().includes("reported") || message.toLowerCase().includes("issue")
            ? "bg-amber-50 text-amber-700 border-amber-200"
            : message.toLowerCase().includes("thank") || message.toLowerCase().includes("success") || message.toLowerCase().includes("cancelled")
            ? "bg-green-50 text-green-600 border-green-100"
            : "bg-red-50 text-red-500 border-red-100"
        }`}>
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          {message}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <svg className="animate-spin h-10 w-10 text-primary-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        </div>
      ) : (
        <>
          {/* ── Available Shops ── */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h3 className="text-2xl font-bold text-slate-800">Available Shops</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {shops.map((shop) => (
                <article key={shop.id || shop._id} className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-slate-800">{shop.name}</h3>
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${shop.is_open || shop.isOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {shop.is_open || shop.isOpen ? "OPEN" : "CLOSED"}
                    </span>
                  </div>

                  <p className="text-slate-500 text-sm mb-6 flex-1 line-clamp-2">
                    {shop.description || "Campus menu available."}
                  </p>

                  <div className="flex justify-between items-center text-sm text-slate-400 mb-6 font-medium">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      {shop.location}
                    </span>
                    <span className="px-2 py-1 bg-slate-100 rounded-md">
                      {shop.menuItems?.length ?? 0} items
                    </span>
                  </div>

                  <Link to={`/shops/${shop.id || shop._id}`} className="w-full btn-secondary text-center">
                    Browse menu
                  </Link>
                </article>
              ))}

              {!shops.length && (
                <div className="col-span-full py-10 text-center bg-slate-50 border border-slate-100 rounded-2xl">
                  <p className="text-slate-500 mb-2 font-medium">No shops found right now.</p>
                </div>
              )}
            </div>
          </section>

          {/* ── My Orders ── */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mt-6">
              <h3 className="text-2xl font-bold text-slate-800">My Orders</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orders.map((order) => {
                const orderId = order.id || order._id;
                const status = order.status;
                const canCancel = status === "pending";
                const canReport = (status === "picked_up" || status === "delivered") && status !== "issue_reported";
                const isReported = status === "issue_reported";

                return (
                  <article className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group" key={orderId}>
                    {/* Status corner accent */}
                    <div className={`absolute top-0 right-0 w-16 h-16 transform translate-x-8 -translate-y-8 rotate-45 ${
                      status === "delivered" ? "bg-green-500" :
                      status === "cancelled" ? "bg-red-500" :
                      status === "issue_reported" ? "bg-orange-500" :
                      "bg-primary-500"
                    } opacity-20 group-hover:opacity-100 transition-opacity`}></div>

                    <div className="flex items-start justify-between mb-4 relative z-10">
                      <div>
                        <strong className="text-lg text-slate-800 block truncate max-w-[200px]">{order.shop_name || order.shop?.name}</strong>
                        <span className="text-xs text-slate-400 font-medium">
                          {order.created_at || order.createdAt ? new Date(order.created_at || order.createdAt).toLocaleString() : ""}
                        </span>
                      </div>
                      <StatusBadge status={status} />
                    </div>

                    <div className="flex flex-col gap-2 p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4">
                      <div className="flex justify-between items-center text-sm font-semibold">
                        <span className="text-slate-600 border-b border-slate-200 pb-2 w-full flex justify-between">
                          Items: <span className="text-slate-800">{order.items?.length || 0}</span>
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-bold pt-1">
                        <span className="text-slate-500">Total:</span>
                        <span className="text-primary-600 text-lg">Rs. {Number(order.total_price || order.totalPrice).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs font-medium mt-auto">
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md border border-blue-100 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        {order.delivery_mode === "pickup" || order.deliveryMode === "pickup" ? "Pickup" : "Campus Delivery"}
                      </span>

                      {(order.delivery_name || order.deliveryPerson?.name) && (
                        <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-md border border-amber-100 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          Driver: {order.delivery_name || order.deliveryPerson?.name}
                        </span>
                      )}
                    </div>

                    {/* ── Cancel Order (pending only) ── */}
                    {canCancel && (
                      <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                        <button
                          className="text-sm font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors border border-red-100"
                          onClick={() => handleCancelOrder(orderId)}
                        >
                          Cancel Order
                        </button>
                      </div>
                    )}

                    {/* ── Preparation-started notice ── */}
                    {["preparing", "ready"].includes(status) && (
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          Preparation has started — cancellation is no longer available.
                        </p>
                      </div>
                    )}

                    {/* ── Issue already reported badge ── */}
                    {isReported && (
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <p className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          Issue reported — our admin team is reviewing this.
                        </p>
                      </div>
                    )}

                    {/* ── Report Issue + Leave Feedback buttons ── */}
                    {canReport && reportOrderId !== orderId && (
                      <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center gap-2">
                        <button
                          className="text-sm font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-4 py-2 rounded-lg transition-colors border border-orange-200 flex items-center gap-1.5"
                          onClick={() => { setReportOrderId(orderId); setReportDescription(""); }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          Report Issue
                        </button>
                        {status === "delivered" && reviewOrderId !== orderId && (
                          <button
                            className="text-sm font-bold text-primary-600 hover:text-primary-700 bg-primary-50 px-4 py-2 rounded-lg transition-colors border border-primary-100"
                            onClick={() => { setReviewOrderId(orderId); setFeedbackForm({ rating: 5, comment: "" }); }}
                          >
                            Leave Feedback
                          </button>
                        )}
                      </div>
                    )}

                    {/* ── Report Issue form ── */}
                    {reportOrderId === orderId && (
                      <div className="mt-4 pt-4 border-t border-slate-100 animate-slide-up">
                        <h4 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          Report a Delivery Issue
                        </h4>
                        <p className="text-xs text-slate-400 mb-3">e.g., driver consumed food, wrong delivery, order tampered.</p>
                        <textarea
                          className="w-full text-sm p-3 border border-orange-200 rounded-xl mb-3 focus:ring-2 focus:ring-orange-400 focus:outline-none resize-none"
                          rows="3"
                          placeholder="Describe what happened with your delivery..."
                          value={reportDescription}
                          onChange={(e) => setReportDescription(e.target.value)}
                        ></textarea>
                        <div className="flex gap-2 justify-end">
                          <button
                            className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg"
                            onClick={() => { setReportOrderId(null); setReportDescription(""); }}
                          >
                            Cancel
                          </button>
                          <button
                            className="px-4 py-2 text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-lg shadow-sm disabled:opacity-60"
                            onClick={() => handleReportIssue(orderId)}
                            disabled={reportSubmitting}
                          >
                            {reportSubmitting ? "Submitting..." : "Submit Report"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── Leave Feedback form ── */}
                    {reviewOrderId === orderId && (
                      <div className="mt-4 pt-4 border-t border-slate-100 animate-slide-up">
                        <h4 className="text-sm font-bold text-slate-800 mb-2">Rate your order</h4>
                        <div className="flex gap-2 mb-3">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                              className={`transition-colors ${feedbackForm.rating >= star ? "text-yellow-400" : "text-slate-200"}`}
                            >
                              <svg className="w-6 h-6 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            </button>
                          ))}
                        </div>
                        <textarea
                          className="w-full text-sm p-3 border border-slate-200 rounded-xl mb-3 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                          rows="2"
                          placeholder="How was the food and delivery?"
                          value={feedbackForm.comment}
                          onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
                        ></textarea>
                        <div className="flex gap-2 justify-end">
                          <button className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg" onClick={() => setReviewOrderId(null)}>Cancel</button>
                          <button className="px-4 py-2 text-sm font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-sm" onClick={() => handleFeedbackSubmit(order)}>Submit</button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}

              {!orders.length && (
                <div className="col-span-full py-12 text-center bg-white border border-dashed border-slate-300 rounded-2xl">
                  <svg className="mx-auto h-12 w-12 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                  <p className="text-slate-500 mb-1 font-medium text-lg">No orders yet</p>
                  <p className="text-slate-400 text-sm">Start your first order by browsing the shops above.</p>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}