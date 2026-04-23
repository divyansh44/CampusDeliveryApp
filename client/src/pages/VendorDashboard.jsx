import { useEffect, useState, useCallback } from "react";
import StatusBadge from "../components/StatusBadge";
import { useOrderRealtime } from "../hooks/useOrderRealtime";
import { api, getImageUrl } from "../lib/api";

export default function VendorDashboard() {
  const [shop, setShop] = useState(null);
  const [orders, setOrders] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [summary, setSummary] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [shopForm, setShopForm] = useState({
    name: "",
    description: "",
    category: "Food",
    location: "",
    contactNumber: "",
  });
  const [menuForm, setMenuForm] = useState({
    name: "",
    description: "",
    category: "General",
    price: 0,
  });
  const [shopImage, setShopImage] = useState(null);
  const [menuImage, setMenuImage] = useState(null);

  const loadVendorData = useCallback(async () => {
    try {
      const [vendorShop, vendorOrders, vendorSummary, vendorFeedback] = await Promise.all([
        api.getVendorShop().catch(() => null),
        api.getVendorOrders().catch(() => []),
        api.getVendorSummary().catch(() => null),
        api.getVendorFeedback().catch(() => []),
      ]);

      setShop(vendorShop);
      setOrders(vendorOrders);
      setSummary(vendorSummary);
      setFeedback(vendorFeedback);

      if (vendorShop) {
        setShopForm({
          name: vendorShop.name,
          description: vendorShop.description || "",
          category: vendorShop.category || "Food",
          location: vendorShop.location,
          contactNumber: vendorShop.contact_number || vendorShop.contactNumber || "",
        });
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
       setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVendorData();
  }, []);

  useOrderRealtime(loadVendorData);

  const handleShopSave = async () => {
    try {
      const savedShop = shop
        ? await api.updateVendorShop(shopForm)
        : await api.createShop({ ...shopForm, deliverySupported: true, pickupSupported: true, menuItems: [] });
      setShop(savedShop);
      setMessage(shop ? "Shop updated successfully." : "Shop created successfully.");
      await loadVendorData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleAddMenuItem = async () => {
    try {
      const item = await api.addMenuItem({ ...menuForm, price: Number(menuForm.price), isAvailable: true });
      if (menuImage) {
        await api.uploadMenuItemImage(item.id || item._id, menuImage);
      }
      setMenuForm({ name: "", description: "", category: "General", price: 0 });
      setMenuImage(null);
      setMessage("Menu item added successfully.");
      await loadVendorData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleStatusUpdate = async (orderId, status) => {
    try {
      await api.updateOrderStatus(orderId, status);
      await loadVendorData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleToggleMenuItem = async (item) => {
    try {
      await api.updateMenuItem(item.id || item._id, { isAvailable: !(item.isAvailable || item.is_available) });
      await loadVendorData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleDeleteMenuItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this menu item?")) return;
    try {
      await api.deleteMenuItem(itemId);
      await loadVendorData();
      setMessage("Item deleted successfully.");
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
    <div className="flex flex-col gap-10 animate-fade-in pb-20">
      {/* Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-xl p-8 md:p-12 text-white">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <span className="inline-block px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 border border-teal-500/20">
              Vendor Control Panel
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
              Manage your shop <br className="hidden md:block"/> and monitor live queues.
            </h2>
          </div>
          
          <div className="flex flex-col gap-4 min-w-[240px]">
            {message && (
               <div className={`p-3 rounded-xl border flex items-center gap-2 text-sm font-semibold backdrop-blur-md ${message.includes('success') ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
                  {message}
               </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <article className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center transform hover:-translate-y-1 transition duration-300">
           <span className="text-slate-500 font-medium uppercase tracking-wider text-xs mb-2">Completed Orders</span>
           <strong className="text-5xl font-extrabold text-slate-800">{summary?.totalOrders ?? 0}</strong>
        </article>
        <article className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center transform hover:-translate-y-1 transition duration-300">
           <span className="text-slate-500 font-medium uppercase tracking-wider text-xs mb-2">Total Revenue</span>
           <strong className="text-5xl font-extrabold text-teal-600">Rs. {Number(summary?.totalRevenue ?? 0).toFixed(0)}</strong>
        </article>
        <article className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center transform hover:-translate-y-1 transition duration-300 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-16 h-16 bg-primary-500/10 rounded-bl-full"></div>
           <span className="text-slate-500 font-medium uppercase tracking-wider text-xs mb-2 relative z-10">Active Queue</span>
           <strong className="text-5xl font-extrabold text-primary-600 relative z-10">{orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length}</strong>
        </article>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Left Column: Management */}
        <div className="lg:col-span-1 flex flex-col gap-10">
          
          <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
               {shop ? "Shop Settings" : "Create Your Shop"}
            </h3>
            <div className="flex flex-col gap-4">
              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Shop Name</label>
                 <input className="input-field" value={shopForm.name} onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })} />
              </div>
              <div className="flex gap-4">
                 <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Category</label>
                    <input className="input-field" value={shopForm.category} onChange={(e) => setShopForm({ ...shopForm, category: e.target.value })} />
                 </div>
                 <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Location</label>
                    <input className="input-field" value={shopForm.location} onChange={(e) => setShopForm({ ...shopForm, location: e.target.value })} />
                 </div>
              </div>
              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Contact</label>
                 <input className="input-field" value={shopForm.contactNumber} onChange={(e) => setShopForm({ ...shopForm, contactNumber: e.target.value })} />
              </div>
              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Description</label>
                 <textarea className="input-field min-h-[80px] resize-none" value={shopForm.description} onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })} />
              </div>
              
              <div className="pt-2">
                <button className="btn-primary w-full py-3" onClick={handleShopSave}>
                  {shop ? "Update Details" : "Create Shop"}
                </button>
              </div>

              {shop && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Shop Banner Image</label>
                  <input type="file" accept="image/*" className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" onChange={(e) => setShopImage(e.target.files?.[0] || null)} />
                  {shopImage && (
                    <button className="btn-secondary w-full py-2 flex items-center justify-center gap-2" onClick={async () => {
                        try {
                          await api.uploadShopImage(shopImage);
                          setShopImage(null);
                          await loadVendorData();
                          setMessage("Banner uploaded.");
                        } catch (error) { setMessage(error.message); }
                      }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                      Upload Now
                    </button>
                  )}
                  {shop.imageUrl && !shopImage && (
                    <div className="w-full h-32 rounded-xl overflow-hidden mt-2 border border-slate-200">
                       <img src={getImageUrl(shop.imageUrl)} alt={shop.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {shop && (
            <section className="bg-gradient-to-br from-primary-50 to-teal-50 rounded-3xl p-6 border border-primary-100 shadow-sm">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                 <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                 Add Menu Item
              </h3>
              <div className="flex flex-col gap-4">
                <input className="input-field bg-white" placeholder="Item Name" value={menuForm.name} onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })} />
                <div className="flex gap-4">
                   <input className="input-field bg-white flex-1" placeholder="Category" value={menuForm.category} onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })} />
                   <input className="input-field bg-white flex-1" type="number" placeholder="Price (Rs)" value={menuForm.price} onChange={(e) => setMenuForm({ ...menuForm, price: Number(e.target.value) })} />
                </div>
                <textarea className="input-field bg-white resize-none" placeholder="Description" value={menuForm.description} onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })} />
                
                <input type="file" accept="image/*" className="text-sm cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-white file:text-slate-600 hover:file:bg-slate-50" onChange={(e) => setMenuImage(e.target.files?.[0] || null)} />
                
                <button className="btn-primary" onClick={handleAddMenuItem}>Add to Menu</button>
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Queues & Content */}
        <div className="lg:col-span-2 flex flex-col gap-10">
          
          <section>
            <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
               Live Order Queue
               <div className="flex gap-2">
                  <span className="flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-md border border-orange-100">
                     {orders.filter(o => o.status === 'pending').length} pending
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                     {orders.filter(o => o.status === 'preparing').length} preparing
                  </span>
               </div>
            </h3>
            
            <div className="flex flex-col gap-4">
              {orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').map((order) => (
                <article className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md flex flex-col md:flex-row justify-between gap-4 transition-all" key={order.id || order._id}>
                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-start mb-2 border-b border-slate-100 pb-3">
                       <div>
                          <strong className="text-lg font-bold text-slate-800 block">Order #{String(order.id || order._id).slice(-6)}</strong>
                          <span className="text-xs text-slate-500 font-medium">Customer: {order.student_name || order.student?.name || "Student"}</span>
                       </div>
                       <StatusBadge status={order.status} />
                    </div>
                    
                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                       <span className="text-sm font-semibold text-slate-600 border-r border-slate-200 pr-4">{order.items?.length || 0} items</span>
                       <span className="text-lg font-bold text-primary-600 pl-4">Rs. {Number(order.total_price || order.totalPrice).toFixed(2)}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs font-bold">
                       <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md flex items-center gap-1 border border-slate-200">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                          {order.delivery_mode === "pickup" || order.deliveryMode === "pickup" ? "Pickup" : "Campus Delivery"}
                       </span>
                       {(order.deliveryMode === "campus_delivery" || order.delivery_mode === "campus_delivery") && (
                         <span className={`px-2 py-1 rounded-md flex items-center gap-1 border ${order.delivery_person_id || order.deliveryPerson?.name ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                           {order.delivery_person_id || order.deliveryPerson?.name ? `Driver: ${order.delivery_name || order.deliveryPerson.name}` : "Awaiting Driver"}
                         </span>
                       )}
                    </div>
                  </div>
                  
                  <div className="flex flex-row md:flex-col justify-end gap-2 shrink-0 md:pl-4 md:border-l md:border-slate-100">
                    {order.status === "pending" && (
                       <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-xl shadow-sm text-sm" onClick={() => handleStatusUpdate(order.id || order._id, "preparing")}>
                         Accept & Prepare
                       </button>
                    )}
                    {order.status === "preparing" && (
                       <button className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-xl shadow-sm text-sm" onClick={() => handleStatusUpdate(order.id || order._id, "ready")}>
                         Mark Ready
                       </button>
                    )}
                    {order.status === "ready" && (order.deliveryMode === "pickup" || order.delivery_mode === "pickup") && (
                       <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-xl shadow-sm text-sm" onClick={() => handleStatusUpdate(order.id || order._id, "delivered")}>
                         Hand to Customer
                       </button>
                    )}
                     <button className="bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 px-4 rounded-xl text-sm" onClick={() => handleStatusUpdate(order.id || order._id, "cancelled")}>
                         Cancel Order
                     </button>
                  </div>
                </article>
              ))}
              {orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length === 0 && (
                 <div className="py-12 border border-dashed border-slate-300 rounded-3xl flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                    <svg className="w-12 h-12 mb-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span className="font-medium text-lg text-slate-500 mb-1">Queue is empty</span>
                    <span className="text-sm">New orders will magically appear here.</span>
                 </div>
              )}
            </div>
          </section>

          {shop && (
            <section>
               <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6 mt-4">
                 <h3 className="text-2xl font-bold text-slate-800">Menu Preview</h3>
                 <span className="text-sm font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-md">{shop.menuItems?.length ?? 0} Listed</span>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {shop.menuItems?.map((item) => (
                    <article className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden" key={item.id || item._id}>
                       {/* Unavailable stripe */}
                       {!(item.isAvailable || item.is_available) && <div className="absolute top-0 bottom-0 left-0 w-1 bg-red-400"></div>}
                       
                       <div className="flex items-center gap-3">
                          {item.imageUrl ? (
                             <img src={getImageUrl(item.imageUrl)} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-slate-100" />
                          ) : (
                             <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200"></div>
                          )}
                          <div>
                             <strong className="text-sm font-bold text-slate-800 block truncate max-w-[120px]">{item.name}</strong>
                             <span className="text-xs font-semibold text-slate-500">Rs. {item.price}</span>
                          </div>
                       </div>
                       
                       <div className="flex flex-col gap-2 shrink-0">
                           <button 
                             className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-md transition-colors ${item.isAvailable || item.is_available ? 'text-green-600 bg-green-50 border border-green-100 hover:bg-green-100' : 'text-red-500 bg-red-50 border border-red-100 hover:bg-red-100'}`}
                             onClick={() => handleToggleMenuItem(item)}
                           >
                              {item.isAvailable || item.is_available ? 'Selling' : 'Hidden'}
                           </button>
                           <button 
                             className="text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-md text-slate-500 bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors"
                             onClick={() => handleDeleteMenuItem(item.id || item._id)}
                           >
                              Delete
                           </button>
                       </div>
                    </article>
                 ))}
               </div>
            </section>
          )}

          <section>
            <h3 className="text-2xl font-bold text-slate-800 mb-6 border-b border-slate-200 pb-4 mt-4">Recent Feedback</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feedback.map((entry) => (
                <article className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3" key={entry.id || entry._id}>
                  <div className="flex justify-between items-start">
                    <strong className="font-bold text-slate-700">{entry.student_name || entry.student?.name || "Customer"}</strong>
                    <div className="flex items-center gap-1 bg-yellow-50 text-yellow-600 px-2 py-1 rounded-md border border-yellow-100 text-xs font-bold">
                       <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                       {entry.rating} / 5
                    </div>
                  </div>
                  <p className="text-slate-600 text-sm bg-slate-50 p-3 rounded-xl">"{entry.comment || "No written review."}"</p>
                </article>
              ))}
              {!feedback.length && <p className="text-slate-500 font-medium italic">No reviews received yet.</p>}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}