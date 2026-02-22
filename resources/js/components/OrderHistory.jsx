import React from 'react';
import { Link } from 'react-router-dom';
import Layout from './Layout';
import { orderAPI } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

export default function OrderHistory() {
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState('');
  const [meta, setMeta] = React.useState(null);

  const loadOrders = async (status = '') => {
    setLoading(true);
    try {
      const res = await orderAPI.list(status || undefined);
      const data = res.data;
      if (Array.isArray(data)) {
        setOrders(data);
        setMeta(null);
      } else {
        setOrders(data.data || []);
        setMeta(data);
      }
    } catch (e) {
      console.error('Failed to load orders', e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadOrders(statusFilter);
  }, [statusFilter]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My Orders</h1>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
            >
              <option value="">All Orders</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-[hsl(var(--muted-foreground))]">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-[hsl(var(--muted-foreground))]">No orders found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                      <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">{order.title}</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm text-[hsl(var(--muted-foreground))]">
                        <div>
                          <span className="font-medium">Quantity:</span> {order.quantity}
                        </div>
                        <div>
                          <span className="font-medium">Price:</span> Rs. {parseFloat(order.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <div>
                          <span className="font-medium">Total:</span> Rs. {parseFloat(order.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <div>
                          <span className="font-medium">Payment:</span> {order.payment_method || 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <Link to={`/orders/${order.id}`}>
                        <Button variant="outline">View Details</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta && (meta.prev_page_url || meta.next_page_url) && (
          <div className="flex justify-between items-center mt-6">
            <Button
              variant="outline"
              onClick={() => {
                const url = new URL(meta.prev_page_url, window.location.origin);
                const page = url.searchParams.get('page') || 1;
                loadOrders(statusFilter);
              }}
              disabled={!meta.prev_page_url || loading}
            >
              Previous
            </Button>
            <span className="text-sm text-[hsl(var(--muted-foreground))]">
              Page {meta.current_page} of {meta.last_page}
            </span>
            <Button
              onClick={() => {
                const url = new URL(meta.next_page_url, window.location.origin);
                const page = url.searchParams.get('page') || 1;
                loadOrders(statusFilter);
              }}
              disabled={!meta.next_page_url || loading}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}

