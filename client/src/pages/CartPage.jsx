import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

export default function CartPage() {
  const [cart, setCart] = useState(null);
  const [message, setMessage] = useState("");
  const [deliveryMode, setDeliveryMode] = useState("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);

  const loadCart = async () => {
    try {
      const cartData = await api.getCart();
      setCart(cartData);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const handleQuantityChange = async (menuItemId, quantity) => {
    try {
      const nextCart = await api.updateCartItem(menuItemId, quantity);
      setCart(nextCart);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleRemove = async (menuItemId) => {
    try {
      await api.removeCartItem(menuItemId);
      await loadCart();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleCheckout = async () => {
    try {
      const order = await api.checkoutCart({ deliveryMode, deliveryAddress, notes });
      setMessage(
        `Order placed successfully with status: ${order.status.replaceAll('_', ' ').toUpperCase()}.${order.delivery_person_id ? " Assigned to driver." : ""}`
      );
      setCart(null);
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-20 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
        <Link to="/student" className="text-slate-400 hover:text-primary-600 transition-colors p-2 rounded-full hover:bg-slate-100">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        </Link>
        <div>
          <span className="text-primary-600 font-semibold tracking-wide uppercase text-xs mb-1 block">Checkout</span>
          <h2 className="text-3xl font-extrabold text-slate-800">Your Cart</h2>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 shadow-sm ${message.includes('success') ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span className="font-medium">{message}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <svg className="animate-spin h-8 w-8 text-primary-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        </div>
      ) : !cart || cart.items?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-dashed border-slate-300">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Your cart is feeling light</h3>
          <p className="text-slate-500 mb-6">Explore our campus shops to find something delicious.</p>
          <Link to="/student" className="btn-primary">Browse Shops</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-1 border-b border-slate-100 pb-4">
                Order from <span className="text-primary-600">{cart.shop_name}</span>
              </h3>
              
              <div className="divide-y divide-slate-100">
                {cart.items.map((item) => (
                  <article className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4" key={item.menu_item_id}>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800 text-lg mb-1">{item.name}</h4>
                      <p className="text-slate-500 text-sm font-medium">Rs. {Number(item.price).toFixed(2)} each</p>
                    </div>
                    
                    <div className="flex items-center gap-6 justify-between sm:justify-end w-full sm:w-auto">
                      <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
                        <button 
                          className="w-8 h-8 flex items-center justify-center bg-white rounded-md text-slate-600 shadow-sm hover:text-primary-600 transition-colors"
                          onClick={() => handleQuantityChange(item.menu_item_id, Math.max(1, item.quantity - 1))}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path></svg>
                        </button>
                        <span className="w-10 text-center font-bold text-slate-700">{item.quantity}</span>
                        <button 
                          className="w-8 h-8 flex items-center justify-center bg-white rounded-md text-slate-600 shadow-sm hover:text-primary-600 transition-colors"
                          onClick={() => handleQuantityChange(item.menu_item_id, item.quantity + 1)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        </button>
                      </div>
                      
                      <div className="text-right min-w-[80px]">
                        <strong className="text-lg text-slate-800 block">Rs. {Number(item.subtotal).toFixed(2)}</strong>
                        <button 
                          className="text-xs text-red-500 hover:text-red-700 font-medium tracking-wide"
                          onClick={() => handleRemove(item.menu_item_id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>

          {/* Checkout Panel */}
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 flex flex-col gap-6 sticky top-24">
            <h3 className="text-xl font-bold text-slate-800">Checkout</h3>
            
            <div className="flex justify-between items-end pb-4 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Subtotal</span>
              <strong className="text-3xl text-primary-600">Rs. {Number(cart.total_price).toFixed(2)}</strong>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Delivery Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    className={`border rounded-xl p-3 cursor-pointer transition-all ${deliveryMode === 'pickup' ? 'bg-primary-50 border-primary-500 text-primary-700 ring-1 ring-primary-500' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                    onClick={() => setDeliveryMode('pickup')}
                  >
                    <div className="flex items-center gap-2 font-semibold">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                      Pickup
                    </div>
                  </div>
                  <div 
                    className={`border rounded-xl p-3 cursor-pointer transition-all ${deliveryMode === 'campus_delivery' ? 'bg-primary-50 border-primary-500 text-primary-700 ring-1 ring-primary-500' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                    onClick={() => setDeliveryMode('campus_delivery')}
                  >
                    <div className="flex items-center gap-2 font-semibold">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      Delivery
                    </div>
                  </div>
                </div>
              </div>

              <div className={`overflow-hidden transition-all duration-300 ${deliveryMode === 'campus_delivery' ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Campus Address</label>
                <input
                  className="input-field py-2.5"
                  placeholder="e.g. Block A, Room 101"
                  value={deliveryAddress}
                  onChange={(event) => setDeliveryAddress(event.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Special Notes</label>
                <textarea
                  className="input-field min-h-[100px] resize-none"
                  placeholder="Any allergies or special instructions?"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </div>

              <button className="btn-primary w-full mt-2 py-4 text-lg items-center justify-center flex gap-2" onClick={handleCheckout}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                Place Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}