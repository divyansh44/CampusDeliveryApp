import { useCallback, useEffect, useState } from "react";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { useOrderRealtime } from "../hooks/useOrderRealtime";
import { api } from "../lib/api";

export default function DeliveryDashboard() {
  const { refreshProfile, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [availablePool, setAvailablePool] = useState([]);
  const [message, setMessage] = useState("");
  const [currentZone, setCurrentZone] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [deliveryOrders, poolOrders] = await Promise.all([
        api.getMyDeliveries(),
        api.getAvailableDeliveries(),
        refreshProfile()
      ]);
      setOrders(deliveryOrders);
      setAvailablePool(poolOrders);
      setCurrentZone(user?.currentZone || user?.current_zone || "");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }, [refreshProfile, user?.current_zone, user?.currentZone]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useOrderRealtime(loadData);

  const handleAvailability = async (isAvailable) => {
    try {
      await api.updateDeliveryAvailability({ isAvailable, currentZone });
      await loadData();
      setMessage(isAvailable ? "You are now ONLINE and available for assignments." : "You are marked OFFLINE.");
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleStatus = async (orderId, status) => {
    try {
      await api.updateOrderStatus(orderId, status);
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleAccept = async (orderId) => {
    try {
      await api.acceptDelivery(orderId);
      await loadData();
      setMessage("Order accepted! It is now in your active routes.");
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

  const isOnline = user?.is_available || user?.isAvailable;

  return (
    <div className="flex flex-col gap-10 animate-fade-in pb-20 max-w-5xl mx-auto">
      
      {/* Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-xl p-8 md:p-12 text-white">
         <div className={`absolute top-0 right-0 -mr-10 -mt-10 w-64 h-64 rounded-full blur-3xl ${isOnline ? 'bg-green-500/20' : 'bg-slate-500/20'}`}></div>
         
         <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8 h-full">
            <div className="flex-1">
               <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 border border-white/10">
                 Driver Control
               </span>
               <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
                 Navigate campus, <br/> complete drops.
               </h2>
               <p className="text-slate-300 font-medium max-w-md line-clamp-2">
                 Watch assigned orders pop up instantly. Move items from the counter to the doorstep.
               </p>
            </div>
            
            <div className="bg-white/10 border border-white/10 p-6 rounded-3xl backdrop-blur-md flex flex-col justify-center items-center text-center w-full md:w-64 shrink-0 transition-colors">
               <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${isOnline ? 'bg-green-500/20 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-slate-500/20 text-slate-400'}`}>
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
               </div>
               <span className="text-sm font-bold uppercase tracking-widest text-slate-300">Status</span>
               <strong className={`text-2xl font-extrabold transition-colors ${isOnline ? 'text-green-400' : 'text-slate-400'}`}>
                 {isOnline ? 'ONLINE' : 'OFFLINE'}
               </strong>
            </div>
         </div>
      </section>

      {/* Floating alert */}
      {message && (
        <div className={`px-6 py-3 rounded-xl border flex items-center gap-2 text-sm font-semibold shadow-sm mx-auto animate-slide-up ${message.includes('ONLINE') ? 'bg-green-50 text-green-600 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
           {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
         
         {/* Settings panel */}
         <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm md:col-span-1 sticky top-24">
            <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Availability</h3>
            
            <div className="flex flex-col gap-6">
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">My Campus Zone</label>
                  <input
                    className="input-field py-3 text-lg"
                    placeholder="e.g. Block C"
                    value={currentZone}
                    onChange={(event) => setCurrentZone(event.target.value)}
                  />
                  <span className="text-xs text-slate-400 mt-2 block font-medium">Keep this updated so closest orders get routed to you automatically.</span>
               </div>
               
               <div className="grid grid-cols-2 gap-3 mt-2 border-t border-slate-100 pt-6">
                 <button 
                   className={`rounded-xl py-3 text-sm font-bold transition-all border ${isOnline ? 'bg-green-500 text-white border-green-600 ring-2 ring-green-200 shadow-md transform -translate-y-0.5' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                   onClick={() => handleAvailability(true)}
                 >
                   GO ONLINE
                 </button>
                 <button 
                   className={`rounded-xl py-3 text-sm font-bold transition-all border ${!isOnline ? 'bg-slate-600 text-white border-slate-700 ring-2 ring-slate-200 shadow-md transform -translate-y-0.5' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                   onClick={() => handleAvailability(false)}
                 >
                   GO OFFLINE
                 </button>
               </div>
            </div>
         </section>

          {/* Open Assignments Pool */}
          <section className="md:col-span-2 flex flex-col gap-6 mt-6 md:mt-0">
             <h3 className="text-2xl font-bold text-slate-800 flex items-center justify-between border-b border-slate-200 pb-4">
               Available Orders Pool
               <span className="text-sm font-bold bg-green-50 text-green-600 px-3 py-1 rounded-lg border border-green-100">
                  {availablePool.length} Waiting
               </span>
             </h3>
             
             <div className="flex flex-col gap-5">
                {availablePool.map((order) => (
                   <article className="bg-white rounded-2xl border border-green-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden" key={order.id || order._id}>
                      <div className="absolute left-0 top-0 bottom-0 w-2 bg-green-500"></div>
                      
                      <div className="pl-4 flex flex-col gap-4">
                         <div className="flex justify-between items-start">
                            <div>
                               <span className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-1 block">New Route Available</span>
                               <strong className="text-xl font-bold text-slate-800 leading-tight">Deliver to: <br className="hidden md:block"/><span className="text-green-600">{order.student_name || order.student?.name || "Student"}</span></strong>
                            </div>
                            <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full border border-green-200 shadow-sm animate-pulse">READY NOW</span>
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="flex items-start gap-3">
                               <div className="mt-1 flex items-center justify-center bg-white rounded-full p-2 text-slate-400 border border-slate-200 shadow-sm shrink-0">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                               </div>
                               <div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Pickup Shop</span>
                                  <span className="text-sm font-bold text-slate-700">{order.shop_name || order.shop?.name}</span>
                               </div>
                            </div>
                            <div className="flex items-start gap-3">
                               <div className="mt-1 flex items-center justify-center bg-white rounded-full p-2 text-primary-400 border border-primary-200 shadow-sm shrink-0">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                               </div>
                               <div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Dropoff Address</span>
                                  <span className="text-sm font-bold text-slate-700">{order.delivery_address || order.deliveryAddress || "Unknown Counter"}</span>
                               </div>
                            </div>
                         </div>
                         
                         <div className="flex justify-end gap-3 pt-2 mt-2 border-t border-slate-100">
                             <button 
                               className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 shadow-md transition-transform transform hover:-translate-y-0.5 w-full md:w-auto justify-center" 
                               onClick={() => handleAccept(order.id || order._id)}
                             >
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                               Accept Route
                             </button>
                         </div>
                      </div>
                   </article>
                ))}
                
                {!availablePool.length && (
                  <div className="py-10 flex flex-col items-center justify-center bg-slate-50 rounded-3xl border border-dashed border-slate-300">
                     <svg className="w-12 h-12 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                     <span className="text-slate-500 font-medium text-center text-sm">No new orders waiting for pickup in the campus yet.</span>
                  </div>
                )}
             </div>

          {/* Deliveries */}
          <section className="flex flex-col gap-6 mt-10">
             <h3 className="text-2xl font-bold text-slate-800 flex items-center justify-between border-b border-slate-200 pb-4">
               My Active Deliveries
               <span className="text-sm font-bold bg-primary-50 text-primary-600 px-3 py-1 rounded-lg border border-primary-100">
                  {orders.length} Routes
               </span>
             </h3>
            
            <div className="flex flex-col gap-5">
               {orders.map((order) => (
                  <article className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden" key={order.id || order._id}>
                     {/* Side colored bar */}
                     <div className={`absolute left-0 top-0 bottom-0 w-2 ${order.status === 'ready' ? 'bg-blue-500' : 'bg-teal-500'}`}></div>
                     
                     <div className="pl-4 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                           <div>
                              <span className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-1 block">Task details</span>
                              <strong className="text-xl font-bold text-slate-800 leading-tight">Deliver to: <br className="hidden md:block"/><span className="text-primary-600">{order.student_name || order.student?.name || "Student"}</span></strong>
                           </div>
                           <StatusBadge status={order.status} />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                           <div className="flex items-start gap-3">
                              <div className="mt-1 flex items-center justify-center bg-white rounded-full p-2 text-slate-400 border border-slate-200 shadow-sm shrink-0">
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                              </div>
                              <div>
                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Pickup Shop</span>
                                 <span className="text-sm font-bold text-slate-700">{order.shop_name || order.shop?.name}</span>
                              </div>
                           </div>
                           <div className="flex items-start gap-3">
                              <div className="mt-1 flex items-center justify-center bg-white rounded-full p-2 text-primary-400 border border-primary-200 shadow-sm shrink-0">
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                              </div>
                              <div>
                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Dropoff Address</span>
                                 <span className="text-sm font-bold text-slate-700">{order.delivery_address || order.deliveryAddress || "Unknown Counter"}</span>
                              </div>
                           </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 pt-2 mt-2 border-t border-slate-100">
                           {order.status === "ready" && (
                              <button 
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 shadow-md transition-transform transform hover:-translate-y-0.5 w-full md:w-auto justify-center" 
                                onClick={() => handleStatus(order.id || order._id, "picked_up")}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                Picked Up
                              </button>
                           )}
                           {order.status === "picked_up" && (
                              <button 
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 shadow-md transition-transform transform hover:-translate-y-0.5 w-full md:w-auto justify-center" 
                                onClick={() => handleStatus(order.id || order._id, "delivered")}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                                Reached Handover
                              </button>
                           )}
                        </div>
                     </div>
                  </article>
               ))}
               
               {!orders.length && (
                 <div className="py-20 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-300">
                    <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                    <span className="text-xl font-bold text-slate-600 mb-1">Queue is Clear</span>
                    <span className="text-slate-500 font-medium text-center">Accept an order from the pool above to start your route.</span>
                 </div>
               )}
            </div>
         </section>
         </section>
      </div>
    </div>
  );
}