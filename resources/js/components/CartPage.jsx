import React from 'react';
import Layout from './Layout';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';
import { orderAPI, cartAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';

export default function CartPage() {
  const { user } = useAuth();
  const [cart, setCart] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [processing, setProcessing] = React.useState(false);
  const { showToast } = useToast();

  const loadCart = async () => {
    if (!user) {
      setCart([]);
      setLoading(false);
      return;
    }
    try {
      const res = await cartAPI.get();
      setCart(res.data.items || []);
    } catch (e) {
      console.error('Failed to load cart', e);
      setCart([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadCart();
  }, [user]);

  const updateQuantity = async (ad_id, qty) => {
    try {
      await cartAPI.update(ad_id, Math.max(1, qty));
      await loadCart();
    } catch (e) {
      showToast(e.response?.data?.error || 'Failed to update quantity', 'error');
    }
  };

  const removeItem = async (ad_id) => {
    try {
      await cartAPI.remove(ad_id);
      await loadCart();
    } catch (e) {
      showToast(e.response?.data?.error || 'Failed to remove item', 'error');
    }
  };

  const total = cart.reduce((sum, item) => sum + (item.total || 0), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      showToast('Cart is empty.', 'error');
      return;
    }
    setProcessing(true);
    try {
      const items = cart.map((item) => ({
        ad_id: item.ad_id,
        quantity: item.quantity,
      }));
      const res = await orderAPI.checkout(items);
      showToast(res.data?.message || 'Checkout complete (demo).', 'success');
      // Clear cart after successful checkout
      await cartAPI.clear();
      await loadCart();
    } catch (e) {
      if (e.response?.status === 402 && e.response?.data?.needs_top_up) {
        showToast('Insufficient wallet balance. Please add funds to your e-wallet to complete purchase.', 'error');
        window.location.href = '/user_dashboard/e-wallet';
        return;
      }
      const msg =
        e.response?.data?.error ||
        e.response?.data?.message ||
        e.message ||
        'Failed to checkout.';
      showToast(msg, 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Your Cart</h1>
          <Link to="/">
            <Button variant="outline">Continue Shopping</Button>
          </Link>
        </div>

        {loading ? (
          <div className="p-6 border rounded bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
            Loading cart...
          </div>
        ) : !user ? (
          <div className="p-6 border rounded bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
            Please <Link to="/login" className="text-[hsl(var(--primary))] hover:underline">login</Link> to view your cart.
          </div>
        ) : cart.length === 0 ? (
          <div className="p-6 border rounded bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
            Cart is empty.
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => (
              <div
                key={item.ad_id}
                className="border rounded p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-16 h-16 object-cover rounded" />
                  ) : (
                    <div className="w-16 h-16 bg-[hsl(var(--muted))] rounded" />
                  )}
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      Price: Rs. {item.price?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.ad_id, parseInt(e.target.value, 10) || 1)}
                    className="w-20 border rounded px-2 py-1"
                  />
                  <div className="text-sm font-semibold">
                    Rs. {item.total?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => removeItem(item.ad_id)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between border-t pt-4">
              <div className="text-lg font-semibold">Total: Rs. {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              <Button onClick={handleCheckout} disabled={processing}>
                {processing ? 'Processing...' : 'Checkout (Demo)'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}


