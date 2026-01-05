import React from 'react';
import Layout from './Layout';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';
import { orderAPI } from '../utils/api';
import axios from 'axios';

function getCart() {
  try {
    const raw = localStorage.getItem('demo_cart');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem('demo_cart', JSON.stringify(cart));
}

export default function CartPage() {
  const [cart, setCart] = React.useState(getCart());
  const [processing, setProcessing] = React.useState(false);
  const [message, setMessage] = React.useState(null);

  const updateQuantity = (ad_id, qty) => {
    const next = cart.map((item) =>
      item.ad_id === ad_id
        ? { ...item, quantity: Math.max(1, qty), total: Math.max(1, qty) * item.price }
        : item
    );
    setCart(next);
    saveCart(next);
  };

  const removeItem = (ad_id) => {
    const next = cart.filter((item) => item.ad_id !== ad_id);
    setCart(next);
    saveCart(next);
  };

  const total = cart.reduce((sum, item) => sum + (item.total || 0), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setMessage({ type: 'error', text: 'Cart is empty.' });
      return;
    }
    setProcessing(true);
    try {
      const items = cart.map((item) => ({
        ad_id: item.ad_id,
        quantity: item.quantity,
      }));
      const res = await orderAPI.checkout(items);
      setMessage({ type: 'success', text: res.data?.message || 'Checkout complete (demo).' });
      setCart([]);
      saveCart([]);
    } catch (e) {
      if (e.response?.status === 402 && e.response?.data?.needs_top_up) {
        setMessage({
          type: 'error',
          text: 'Insufficient wallet balance. Please add funds to your e-wallet to complete purchase.',
        });
        window.location.href = '/user_dashboard/e-wallet';
        return;
      }
      const msg =
        e.response?.data?.error ||
        e.response?.data?.message ||
        e.message ||
        'Failed to checkout.';
      setMessage({ type: 'error', text: msg });
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

        {message && (
          <div
            className={`mb-4 p-3 rounded ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {cart.length === 0 ? (
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


