import React from 'react';
import { analyticsAPI } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export default function AdminAnalytics() {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const chartRef = React.useRef(null);
  const chartInstance = React.useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await analyticsAPI.adminSummary();
      setData(res.data);
      renderChart(res.data);
    } catch (e) {
      console.error('Failed to load analytics', e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load();
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  const renderChart = async (d) => {
    if (!chartRef.current) return;
    try {
      const { default: Chart } = await import('chart.js/auto');
      if (chartInstance.current) chartInstance.current.destroy();
      const ctx = chartRef.current.getContext('2d');
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Sales', 'Orders', 'Wallet In', 'Wallet Out', 'Forum Threads', 'Forum Posts', 'New Users'],
          datasets: [
            {
              label: 'Admin Metrics',
              data: [
                d.sales || 0,
                d.orders || 0,
                d.wallet_in || 0,
                d.wallet_out || 0,
                d.forum_threads || 0,
                d.forum_posts || 0,
                d.new_users || 0,
              ],
              backgroundColor: 'rgba(59, 130, 246, 0.5)',
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: { beginAtZero: true },
          },
        },
      });
    } catch (err) {
      console.warn('Chart rendering failed (Chart.js missing?)', err);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">Admin Analytics</h1>
      {data ? (
        <>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { label: 'Sales', value: data.sales },
              { label: 'Orders', value: data.orders },
              { label: 'Wallet In', value: data.wallet_in },
              { label: 'Wallet Out', value: data.wallet_out },
              { label: 'Forum Threads', value: data.forum_threads },
              { label: 'Forum Posts', value: data.forum_posts },
              { label: 'New Users', value: data.new_users },
            ].map((item) => (
              <Card key={item.label}>
                <CardHeader>
                  <CardTitle className="text-sm text-[hsl(var(--muted-foreground))]">{item.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-semibold">{item.value ?? 0}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <canvas ref={chartRef} height="200" />
            </CardContent>
          </Card>
        </>
      ) : (
        <p className="text-[hsl(var(--muted-foreground))]">No data.</p>
      )}
    </div>
  );
}
