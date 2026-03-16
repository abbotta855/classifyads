import React from 'react';
import { analyticsAPI } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export default function UserAnalytics() {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const chartRef = React.useRef(null);
  const chartInstance = React.useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await analyticsAPI.userSummary();
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
      if (chartInstance.current) chartInstance.current.destroy();
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
          labels: ['My Sales', 'My Orders', 'Wallet In', 'Wallet Out', 'My Threads', 'My Posts'],
          datasets: [
            {
              label: 'My Metrics',
              data: [
                d.my_sales || 0,
                d.my_orders || 0,
                d.wallet_in || 0,
                d.wallet_out || 0,
                d.forum_threads || 0,
                d.forum_posts || 0,
              ],
              backgroundColor: 'rgba(16, 185, 129, 0.5)',
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } },
        },
      });
    } catch (err) {
      console.warn('Chart rendering failed (Chart.js missing?)', err);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">My Analytics</h1>
      {data ? (
        <>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { label: 'My Sales', value: data.my_sales },
              { label: 'My Orders', value: data.my_orders },
              { label: 'Wallet In', value: data.wallet_in },
              { label: 'Wallet Out', value: data.wallet_out },
              { label: 'My Forum Threads', value: data.forum_threads },
              { label: 'My Forum Posts', value: data.forum_posts },
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
