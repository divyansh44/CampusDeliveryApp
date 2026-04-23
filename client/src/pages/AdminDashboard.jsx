import { useEffect, useState } from "react";
import StatusBadge from "../components/StatusBadge";
import { useOrderRealtime } from "../hooks/useOrderRealtime";
import { api } from "../lib/api";

const TABS = ["overview", "issues", "users", "shops", "orders", "feedback"];
const TAB_LABELS = { overview: "Overview", issues: "Reported Issues", users: "Users", shops: "Shops", orders: "Orders", feedback: "Feedback" };

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [shops, setShops] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reportedOrders, setReportedOrders] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [resolveId, setResolveId] = useState(null);
  const [resolveForm, setResolveForm] = useState({ resolution: "", refund: false, banDriver: false });
  const [resolving, setResolving] = useState(false);
  const [userFilter, setUserFilter] = useState("all");

  const loadAdminData = async () => {
    try {
      const [s, u, sh, o, r, f] = await Promise.all([
        api.getAdminSummary(), api.getAdminUsers(), api.getAdminShops(),
        api.getAdminOrders(), api.getAdminReportedOrders(), api.getAdminFeedback(),
      ]);
      setSummary(s); setUsers(u); setShops(sh); setOrders(o); setReportedOrders(r); setFeedback(f);
    } catch (error) { setMessage(error.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAdminData(); }, []);
  useOrderRealtime(loadAdminData);

  const flash = (msg) => { setMessage(msg); setTimeout(() => setMessage(""), 4000); };

  const toggleUserStatus = async (user) => {
    try {
      await api.updateUserStatus(user.id, !(user.is_active));
      await loadAdminData();
      flash(`${user.name} has been ${user.is_active ? "suspended" : "reactivated"}.`);
    } catch (e) { flash(e.message); }
  };

  const handleResolve = async (orderId) => {
    if (!resolveForm.resolution.trim()) return flash("Resolution note is required.");
    setResolving(true);
    try {
      const res = await api.resolveOrderIssue(orderId, resolveForm);
      flash(res ? "Issue resolved successfully." : "Issue resolved.");
      setResolveId(null);
      setResolveForm({ resolution: "", refund: false, banDriver: false });
      await loadAdminData();
    } catch (e) { flash(e.message); }
    finally { setResolving(false); }
  };

  if (loading) return (
    <div className="flex justify-center items-center py-20 h-screen">
      <svg className="animate-spin h-10 w-10 text-primary-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
    </div>
  );

  const filteredUsers = userFilter === "all" ? users : users.filter(u => u.role === userFilter);

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-20 max-w-7xl mx-auto">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-xl p-8 md:p-12 text-white">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-red-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 border border-red-500/20">
            System Administration
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-2">Admin Control Panel</h2>
          <p className="text-slate-400 font-medium">Manage users, shops, orders, reported issues, and platform feedback.</p>
        </div>
      </section>

      {/* Message */}
      {message && (
        <div className="bg-slate-800 text-white p-4 rounded-xl border border-slate-700 flex items-center gap-3 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-green-400 shrink-0"></span>
          <span className="font-medium text-sm">{message}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${tab === t ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"}`}>
            {TAB_LABELS[t]}
            {t === "issues" && reportedOrders.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-orange-500 text-white rounded-full text-[10px] font-bold">{reportedOrders.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ═══════════ OVERVIEW TAB ═══════════ */}
      {tab === "overview" && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: "Users", value: summary?.totalUsers ?? 0, color: "text-slate-800" },
              { label: "Shops", value: summary?.totalShops ?? 0, color: "text-blue-600" },
              { label: "Orders", value: summary?.totalOrders ?? 0, color: "text-primary-600" },
              { label: "Active Orders", value: summary?.activeOrders ?? 0, color: "text-teal-600" },
              { label: "Open Issues", value: summary?.reportedIssues ?? 0, color: reportedOrders.length > 0 ? "text-orange-600" : "text-green-600" },
            ].map(kpi => (
              <article key={kpi.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-slate-500 font-medium uppercase tracking-wider text-[10px] block mb-1">{kpi.label}</span>
                <strong className={`text-3xl font-extrabold ${kpi.color}`}>{kpi.value}</strong>
              </article>
            ))}
          </div>
          <article className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-slate-500 font-medium uppercase tracking-wider text-xs">System Revenue</span>
            <strong className="text-4xl font-extrabold text-teal-600 block mt-1">Rs. {Number(summary?.totalRevenue ?? 0).toLocaleString()}</strong>
          </article>
          {reportedOrders.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:bg-orange-100 transition-colors" onClick={() => setTab("issues")}>
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shrink-0">{reportedOrders.length}</div>
              <div>
                <strong className="text-orange-800 block">Pending Issue Reports</strong>
                <span className="text-orange-600 text-sm">Students have reported delivery problems that need admin review →</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════ REPORTED ISSUES TAB ═══════════ */}
      {tab === "issues" && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse"></div>
            Active Issue Reports ({reportedOrders.length})
          </h3>
          {reportedOrders.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center">
              <p className="text-green-700 font-bold text-lg mb-1">All clear!</p>
              <p className="text-green-600 text-sm">No pending issue reports. The campus delivery network is running smoothly.</p>
            </div>
          ) : (
            reportedOrders.map(order => {
              const oid = order.id || order._id;
              return (
                <article key={oid} className="bg-white border border-orange-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    {/* Order details */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <strong className="text-lg text-slate-800">{order.shop_name}</strong>
                          <span className="text-xs text-slate-400 block">{new Date(order.updated_at || order.created_at).toLocaleString()}</span>
                        </div>
                        <StatusBadge status={order.status} />
                      </div>
                      {/* Issue description */}
                      <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                        <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest block mb-1">Reported Issue</span>
                        <p className="text-sm text-orange-900 font-medium">{order.issue_description || "No description provided."}</p>
                      </div>
                      {/* People involved */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Student (Reporter)</span>
                          <span className="text-sm font-bold text-slate-700 block">{order.student_name}</span>
                          <span className="text-xs text-slate-400">{order.student_email}</span>
                          {order.student_phone && <span className="text-xs text-slate-400 block">{order.student_phone}</span>}
                        </div>
                        {order.delivery_name && (
                          <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest block mb-1">Delivery Driver (Accused)</span>
                            <span className="text-sm font-bold text-red-700 block">{order.delivery_name}</span>
                            <span className="text-xs text-red-400">{order.delivery_email}</span>
                            {order.delivery_phone && <span className="text-xs text-red-400 block">{order.delivery_phone}</span>}
                          </div>
                        )}
                      </div>
                      {/* Items + total */}
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-slate-500">Items: <strong className="text-slate-700">{order.items?.length || 0}</strong></span>
                        <span className="text-slate-500">Total: <strong className="text-primary-600">Rs. {Number(order.total_price).toFixed(2)}</strong></span>
                      </div>
                    </div>

                    {/* Resolution panel */}
                    <div className="lg:w-80 shrink-0">
                      {resolveId === oid ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 animate-slide-up">
                          <h4 className="text-sm font-bold text-slate-800">Resolve this Issue</h4>
                          <textarea className="w-full text-sm p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none" rows="3"
                            placeholder="Resolution notes (e.g., confirmed driver misconduct, issued refund...)"
                            value={resolveForm.resolution} onChange={e => setResolveForm({ ...resolveForm, resolution: e.target.value })} />
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="checkbox" checked={resolveForm.refund} onChange={e => setResolveForm({ ...resolveForm, refund: e.target.checked })}
                              className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                            <span className="text-slate-700 font-medium">Approve Refund</span>
                          </label>
                          {order.delivery_person_id && (
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                              <input type="checkbox" checked={resolveForm.banDriver} onChange={e => setResolveForm({ ...resolveForm, banDriver: e.target.checked })}
                                className="w-4 h-4 rounded border-red-300 text-red-600 focus:ring-red-500" />
                              <span className="text-red-600 font-medium">Suspend Driver</span>
                            </label>
                          )}
                          <div className="flex gap-2 pt-1">
                            <button className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-lg" onClick={() => setResolveId(null)}>Cancel</button>
                            <button className="px-4 py-2 text-sm font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-sm disabled:opacity-60"
                              onClick={() => handleResolve(oid)} disabled={resolving}>
                              {resolving ? "Resolving..." : "Resolve Issue"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-sm transition-colors"
                          onClick={() => { setResolveId(oid); setResolveForm({ resolution: "", refund: false, banDriver: false }); }}>
                          Take Action
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}

      {/* ═══════════ USERS TAB ═══════════ */}
      {tab === "users" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-800">User Network ({filteredUsers.length})</h3>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              {["all", "student", "vendor", "delivery", "admin"].map(r => (
                <button key={r} onClick={() => setUserFilter(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${userFilter === r ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-y-auto max-h-[600px] custom-scrollbar">
              <div className="flex flex-col gap-1 p-3">
                {filteredUsers.map(u => (
                  <article className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow flex items-center justify-between gap-4" key={u.id}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shrink-0 border border-slate-200">
                        <span className="font-bold text-slate-500 uppercase">{u.name?.charAt(0) || "U"}</span>
                      </div>
                      <div>
                        <strong className="text-slate-800 font-bold block leading-tight">{u.name}</strong>
                        <span className="text-xs text-slate-400 font-medium">{u.email}</span>
                        {u.phone && <span className="text-xs text-slate-400 block">{u.phone}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 shrink-0">
                      <div className="flex flex-col items-end">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mb-1 ${
                          u.role === "admin" ? "bg-red-50 text-red-600" : u.role === "vendor" ? "bg-blue-50 text-blue-600" : u.role === "delivery" ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-600"
                        }`}>{u.role}</span>
                        <span className={`flex items-center gap-1 text-xs font-bold ${u.is_active ? "text-green-500" : "text-red-400"}`}>
                          <span className={`w-2 h-2 rounded-full ${u.is_active ? "bg-green-500" : "bg-red-400"}`}></span>
                          {u.is_active ? "Active" : "Suspended"}
                        </span>
                      </div>
                      {u.role !== "admin" && (
                        <button className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${u.is_active ? "hover:bg-red-50 text-red-600 border-red-200" : "hover:bg-green-50 text-green-600 border-green-200"}`}
                          onClick={() => toggleUserStatus(u)}>
                          {u.is_active ? "Suspend" : "Reactivate"}
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ SHOPS TAB ═══════════ */}
      {tab === "shops" && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-800">Registered Shops ({shops.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shops.map(shop => (
              <article className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-md transition-shadow relative overflow-hidden" key={shop.id}>
                <div className="absolute top-0 right-0 p-3">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-wider ${shop.is_open ? "bg-green-50 text-green-600 border border-green-100" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                    {shop.is_open ? "OPEN" : "CLOSED"}
                  </span>
                </div>
                <h4 className="text-lg font-bold text-slate-800 mb-1 pr-16 leading-tight">{shop.name}</h4>
                <p className="text-slate-500 text-sm font-medium mb-4">{shop.location}</p>
                <div className="border-t border-slate-100 pt-3 space-y-1">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Owner</span>
                  <span className="text-sm font-bold text-slate-700 block">{shop.owner_name}</span>
                  <span className="text-xs text-slate-400">{shop.owner_email}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════ ORDERS TAB ═══════════ */}
      {tab === "orders" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
              All Orders ({orders.length})
            </h3>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-y-auto max-h-[700px] custom-scrollbar p-4 space-y-3">
              {orders.map(order => (
                <article className="border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow" key={order.id}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <strong className="text-lg font-bold text-slate-800">{order.shop_name}</strong>
                      <span className="text-xs text-slate-400 font-semibold block">{new Date(order.created_at).toLocaleString()}</span>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Student</span>
                      <span className="text-sm font-bold text-slate-700 truncate block">{order.student_name || "Student"}</span>
                    </div>
                    <div className="w-px h-8 bg-slate-200 shrink-0"></div>
                    <div className="flex-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Total</span>
                      <span className="text-sm font-bold text-primary-600 block">Rs. {Number(order.total_price).toFixed(2)}</span>
                    </div>
                    <div className="w-px h-8 bg-slate-200 shrink-0"></div>
                    <div className="flex-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Mode</span>
                      <span className="text-sm font-bold text-slate-600 block">{order.delivery_mode === "pickup" ? "Pickup" : "Delivery"}</span>
                    </div>
                  </div>
                  {order.delivery_name && (
                    <div className="mt-2 text-xs text-slate-500">Driver: <strong className="text-slate-700">{order.delivery_name}</strong></div>
                  )}
                  {order.issue_description && order.issue_description.startsWith("[RESOLVED]") && (
                    <div className="mt-2 text-xs text-green-600 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                      <strong>Resolved:</strong> {order.issue_description.replace("[RESOLVED] ", "").split(" | Original:")[0]}
                    </div>
                  )}
                </article>
              ))}
              {!orders.length && (
                <div className="py-16 text-center text-slate-400">
                  <p className="font-medium text-lg">No orders yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ FEEDBACK TAB ═══════════ */}
      {tab === "feedback" && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-800">Platform Feedback ({feedback.length})</h3>
          {feedback.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center">
              <p className="text-slate-500 font-medium">No feedback submitted yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {feedback.map(fb => (
                <article key={fb.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <strong className="text-slate-800 font-bold block">{fb.shop_name}</strong>
                      <span className="text-xs text-slate-400">{new Date(fb.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <svg key={s} className={`w-4 h-4 ${fb.rating >= s ? "text-yellow-400" : "text-slate-200"} fill-current`} viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  {fb.comment && <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">{fb.comment}</p>}
                  <div className="mt-3 text-xs text-slate-400 font-medium">By: {fb.student_name} ({fb.student_email})</div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}