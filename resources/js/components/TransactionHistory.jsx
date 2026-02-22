import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from './Layout';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import axios from 'axios';

export default function TransactionHistory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [transactions, setTransactions] = React.useState([]);
  const [meta, setMeta] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [typeFilter, setTypeFilter] = React.useState(searchParams.get('type') || '');
  const [statusFilter, setStatusFilter] = React.useState(searchParams.get('status') || '');

  const fetchTransactions = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', page);

      const res = await axios.get('/api/wallet/transactions', { params });
      const data = res.data;
      
      if (Array.isArray(data)) {
        setTransactions(data);
        setMeta(null);
      } else if (data.data && Array.isArray(data.data)) {
        setTransactions(data.data);
        setMeta(data);
      } else {
        setTransactions([]);
        setMeta(null);
      }
    } catch (e) {
      console.error('Failed to fetch transactions', e);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchTransactions(1);
  }, [typeFilter, statusFilter]);

  React.useEffect(() => {
    const params = new URLSearchParams();
    if (typeFilter) params.set('type', typeFilter);
    if (statusFilter) params.set('status', statusFilter);
    setSearchParams(params);
  }, [typeFilter, statusFilter]);

  const handlePageChange = (url) => {
    if (!url) return;
    const params = new URL(url, window.location.origin);
    const page = params.searchParams.get('page') || 1;
    fetchTransactions(page);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-bold mb-6">Transaction History</h1>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Filter by Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full h-10 rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
                >
                  <option value="">All Types</option>
                  <option value="deposit">Deposit</option>
                  <option value="withdraw">Withdraw</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Filter by Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-10 rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8">Loading transactions...</p>
            ) : transactions.length === 0 ? (
              <p className="text-center py-8 text-[hsl(var(--muted-foreground))]">No transactions found.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Date</th>
                        <th className="text-left p-3">Type</th>
                        <th className="text-left p-3">Amount</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Payment Method</th>
                        <th className="text-left p-3">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="border-b hover:bg-[hsl(var(--accent))]">
                          <td className="p-3 text-sm">
                            {new Date(tx.created_at).toLocaleString()}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              tx.type === 'deposit' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {tx.type === 'deposit' ? 'Deposit' : 'Withdraw'}
                            </span>
                          </td>
                          <td className="p-3 font-semibold">
                            ${parseFloat(tx.amount || 0).toFixed(2)}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-xs ${
                              tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                              tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="p-3 text-sm">{tx.payment_method || 'N/A'}</td>
                          <td className="p-3 text-sm text-[hsl(var(--muted-foreground))]">
                            {tx.description || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {meta && (meta.prev_page_url || meta.next_page_url) && (
                  <div className="flex justify-between items-center mt-6 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(meta.prev_page_url)}
                      disabled={!meta.prev_page_url || loading}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-[hsl(var(--muted-foreground))]">
                      Page {meta.current_page} of {meta.last_page}
                    </span>
                    <Button
                      onClick={() => handlePageChange(meta.next_page_url)}
                      disabled={!meta.next_page_url || loading}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

