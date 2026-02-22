import React from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from './Layout';
import { orderAPI } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useToast } from './Toast';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [cancelling, setCancelling] = React.useState(false);
  const { showToast } = useToast();

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await orderAPI.get(id);
        setOrder(res.data);
      } catch (e) {
        console.error('Failed to load order', e);
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      await orderAPI.update(id, { status: 'cancelled' });
      const res = await orderAPI.get(id);
      setOrder(res.data);
      showToast('Order cancelled successfully', 'success');
    } catch (e) {
      showToast(e.response?.data?.error || 'Failed to cancel order', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center py-8">
            <p className="text-[hsl(var(--muted-foreground))]">Loading order...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-[hsl(var(--muted-foreground))] mb-4">Order not found</p>
              <Link to="/orders">
                <Button variant="outline">Back to Orders</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/orders" className="text-[hsl(var(--primary))] hover:underline text-sm">
            ← Back to Orders
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Order #{order.id}</CardTitle>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                {order.status.toUpperCase()}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Order Info */}
            <div>
              <h3 className="font-semibold mb-2">{order.title}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[hsl(var(--muted-foreground))]">Order Date:</span>
                  <span className="ml-2">{new Date(order.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
                <div>
                  <span className="text-[hsl(var(--muted-foreground))]">Payment Method:</span>
                  <span className="ml-2">{order.payment_method || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[hsl(var(--muted-foreground))]">Quantity:</span>
                  <span className="ml-2">{order.quantity}</span>
                </div>
                <div>
                  <span className="text-[hsl(var(--muted-foreground))]">Unit Price:</span>
                  <span className="ml-2">Rs. {parseFloat(order.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[hsl(var(--muted-foreground))]">Total Amount:</span>
                  <span className="ml-2 font-semibold text-lg">Rs. {parseFloat(order.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Product Info */}
            {order.ad && (
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Product Details</h4>
                <div className="flex gap-4">
                  {order.ad.photos && order.ad.photos[0] && (
                    <img
                      src={order.ad.photos[0].photo_url}
                      alt={order.title}
                      className="w-24 h-24 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{order.ad.title}</p>
                    <Link
                      to={`/ads/${order.ad.slug || order.ad.id}`}
                      className="text-[hsl(var(--primary))] hover:underline text-sm"
                    >
                      View Product →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Shipping Address */}
            {order.shipping_address && (
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Shipping Address</h4>
                <p className="text-sm text-[hsl(var(--muted-foreground))] whitespace-pre-line">
                  {order.shipping_address}
                </p>
              </div>
            )}

            {/* Notes */}
            {order.notes && (
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Notes</h4>
                <p className="text-sm text-[hsl(var(--muted-foreground))] whitespace-pre-line">
                  {order.notes}
                </p>
              </div>
            )}

            {/* Actions */}
            {order.status === 'pending' && (
              <div className="border-t pt-4">
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={cancelling}
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

