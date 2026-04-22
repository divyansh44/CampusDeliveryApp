import { useEffect, useState } from "react";
import StatusBadge from "../components/StatusBadge";
import { useOrderRealtime } from "../hooks/useOrderRealtime";
import { api } from "../lib/api";

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [shops, setShops] = useState([]);
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    try {
      const [summaryData, userData, shopData, orderData] = await Promise.all([
        api.getAdminSummary(),
        api.getAdminUsers(),
        api.getAdminShops(),
        api.getAdminOrders(),
      ]);
      setSummary(summaryData);
      setUsers(userData);
      setShops(shopData);
      setOrders(orderData);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  useOrderRealtime(loadAdminData);

  const toggleUserStatus = async (user) => {
    try {
      await api.updateUserStatus(user.id || user._id, !(user.is_active || user.isActive));
      await loadAdminData();
      setMessage("User status updated.");
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.message);
    }
  };

  if (loading) {
     return (
       <div className="flex justify-center items-center py-20 h-screen">
          <svg className="animate-spin h-10 w-10 text-primary-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
       </div>
     );
  }

  return (
    <div className="flex flex-col gap-10 animate-fade-in pb-20 max-w-7xl mx-auto">
      
      {/* Admin Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-xl p-8 md:p-12 text-white">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-red-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <span className="inline-block px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 border border-red-500/20">
              System Administration
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
              Monitor network health <br className="hidden md:block"/> and global traffic.
            </h2>
            <p className="text-slate-300 font-medium">
              Overwatch privileges enabled. Intervene in user availability and monitor all cross-campus movement.
            </p>
          </div>
          
          {message && (
             <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 font-semibold text-sm backdrop-blur-md flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                {message}
             </div>
          )}
        </div>
      </section>

      {/* Global KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <article className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
           <span className="text-slate-500 font-medium uppercase tracking-wider text-xs mb-2">Registered Users</span>
           <strong className="text-4xl font-extrabold text-slate-800 mt-auto">{summary?.totalUsers ?? 0}</strong>
        </article>
        <article className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
           <span className="text-slate-500 font-medium uppercase tracking-wider text-xs mb-2">Partner Shops</span>
           <strong className="text-4xl font-extrabold text-blue-600 mt-auto">{summary?.totalShops ?? 0}</strong>
        </article>
        <article className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
           <span className="text-slate-500 font-medium uppercase tracking-wider text-xs mb-2">All Time Orders</span>
           <strong className="text-4xl font-extrabold text-primary-600 mt-auto">{summary?.totalOrders ?? 0}</strong>
        </article>
        <article className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
           <span className="text-slate-500 font-medium uppercase tracking-wider text-xs mb-2">System Revenue</span>
           <strong className="text-4xl font-extrabold text-teal-600 mt-auto">Rs. {Number(summary?.totalRevenue ?? 0).toFixed(0)}</strong>
        </article>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        
        <div className="flex flex-col gap-10">
           {/* Users Table / List */}
           <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[600px]">
             <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
               <h3 className="text-xl font-bold text-slate-800">User Network</h3>
               <span className="text-sm font-semibold text-slate-500 px-3 py-1 bg-white rounded-md border border-slate-200">{users.length} Total</span>
             </div>
             
             <div className="overflow-y-auto custom-scrollbar p-2">
               <div className="flex flex-col gap-2 p-4">
                 {users.map((u) => (
                   <article className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow flex items-center justify-between gap-4" key={u.id || u._id}>
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shrink-0 border border-slate-200">
                           <span className="font-bold text-slate-500 uppercase">{u.name?.charAt(0) || "U"}</span>
                        </div>
                        <div>
                           <strong className="text-slate-800 font-bold block leading-tight">{u.name}</strong>
                           <span className="text-xs text-slate-400 font-medium">{u.email}</span>
                        </div>
                     </div>
                     
                     <div className="flex items-center gap-6 shrink-0">
                        <div className="flex flex-col items-end">
                           <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mb-1 ${u.role === 'admin' ? 'bg-red-50 text-red-600' : u.role === 'vendor' ? 'bg-blue-50 text-blue-600' : u.role === 'delivery' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                              {u.role}
                           </span>
                           <span className={`flex items-center gap-1 text-xs font-bold ${u.is_active || u.isActive ? 'text-green-500' : 'text-red-400'}`}>
                              <span className={`w-2 h-2 rounded-full ${u.is_active || u.isActive ? 'bg-green-500' : 'bg-red-400'}`}></span>
                              {u.is_active || u.isActive ? 'Active' : 'Banned'}
                           </span>
                        </div>
                        <button 
                           className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${u.is_active || u.isActive ? 'hover:bg-red-50 text-red-600 border-red-200 hover:border-red-300' : 'hover:bg-green-50 text-green-600 border-green-200 hover:border-green-300'}`}
                           onClick={() => toggleUserStatus(u)}
                        >
                           {u.is_active || u.isActive ? 'Suspend' : 'Reactivate'}
                        </button>
                     </div>
                   </article>
                 ))}
               </div>
             </div>
           </section>

           {/* Shops Table */}
           <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 max-h-[600px] overflow-y-auto custom-scrollbar">
             <h3 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-4 mb-6">Registered Shops</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {shops.map((shop) => (
                 <article className="border border-slate-100 rounded-2xl p-5 hover:shadow-md transition-shadow relative overflow-hidden" key={shop.id || shop._id}>
                   <div className="absolute top-0 right-0 p-3">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-wider ${shop.is_open || shop.isOpen ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                         {shop.is_open || shop.isOpen ? 'OPEN' : 'CLOSED'}
                      </span>
                   </div>
                   <h4 className="text-lg font-bold text-slate-800 mb-1 pr-16 leading-tight">{shop.name}</h4>
                   <p className="text-slate-500 text-sm font-medium mb-4">{shop.location}</p>
                   
                   <div className="flex flex-col gap-1 border-t border-slate-100 pt-3">
                     <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Operator / Owner</span>
                     <span className="text-sm font-bold text-slate-700">{shop.owner_name || shop.owner?.name || "Vendor"}</span>
                   </div>
                   <div className="mt-3 flex gap-2">
                     <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-bold">
                        {shop.menuItems?.length ?? 0} Menu Items
                     </span>
                   </div>
                 </article>
               ))}
             </div>
           </section>
        </div>

        {/* Global Orders Feed */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[600px] xl:h-auto">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
             <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
                Live Logistics Feed
             </h3>
          </div>
          
          <div className="overflow-y-auto custom-scrollbar flex-1 p-6">
            <div className="flex flex-col gap-4">
               {orders.map((order) => (
                  <article className="border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3" key={order.id || order._id}>
                     <div className="flex items-start justify-between">
                        <div>
                           <strong className="text-lg font-bold text-slate-800 block leading-tight">{order.shop_name || order.shop?.name}</strong>
                           <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{order.created_at || order.createdAt ? new Date(order.created_at || order.createdAt).toLocaleString() : ''}</span>
                        </div>
                        <StatusBadge status={order.status} />
                     </div>
                     
                     <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-2">
                        <div className="flex-1">
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Purchaser</span>
                           <span className="text-sm font-bold text-slate-700 truncate block">{order.student_name || order.student?.name || "Student"}</span>
                        </div>
                        <div className="w-px h-8 bg-slate-200 shrink-0"></div>
                        <div className="flex-1">
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Total Value</span>
                           <span className="text-sm font-bold text-primary-600 block">Rs. {Number(order.total_price || order.totalPrice).toFixed(2)}</span>
                        </div>
                     </div>
                     
                     <div className="flex flex-wrap gap-2 text-xs font-bold pt-1">
                        <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded-md border border-slate-200">
                           {order.delivery_mode === "pickup" || order.deliveryMode === "pickup" ? "Pickup Delivery" : "Campus Delivery"}
                        </span>
                        {(order.delivery_mode === "campus_delivery" || order.deliveryMode === "campus_delivery") && (
                           <span className={`px-2 py-1 rounded-md border ${order.delivery_person_id || order.deliveryPerson?.name ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                             Driver: {order.delivery_name || order.deliveryPerson?.name || "Unassigned"}
                           </span>
                        )}
                     </div>
                  </article>
               ))}
               
               {!orders.length && (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                     <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                     <span className="font-medium text-lg text-slate-500 mb-1">No Orders Tracking</span>
                     <span className="text-sm">Global system is currently quiet.</span>
                  </div>
               )}
            </div>
          </div>
        </section>
        
      </div>
    </div>
  );
}