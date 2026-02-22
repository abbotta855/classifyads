import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { adminAPI } from '../utils/api';
import Layout from './Layout';
import { useToast } from './Toast';

export default function AdminForumModeration() {
  const [threads, setThreads] = React.useState([]);
  const [reports, setReports] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('threads'); // 'threads' or 'reports'
  const [statusFilter, setStatusFilter] = React.useState('all');
  const { showToast } = useToast();

  const fetchThreads = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getForumThreads(statusFilter);
      setThreads(res.data.data || res.data || []);
    } catch (e) {
      console.error('Failed to fetch threads', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getForumReports(statusFilter);
      setReports(res.data.data || res.data || []);
    } catch (e) {
      console.error('Failed to fetch reports', e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'threads') {
      fetchThreads();
    } else {
      fetchReports();
    }
  }, [activeTab, statusFilter]);

  const handleLockThread = async (id) => {
    try {
      await adminAPI.lockThread(id);
      fetchThreads();
    } catch (e) {
      showToast('Failed to lock thread', 'error');
    }
  };

  const handleUnlockThread = async (id) => {
    try {
      await adminAPI.unlockThread(id);
      fetchThreads();
    } catch (e) {
      showToast('Failed to unlock thread', 'error');
    }
  };

  const handleStickyThread = async (id) => {
    try {
      await adminAPI.stickyThread(id);
      fetchThreads();
    } catch (e) {
      showToast('Failed to pin thread', 'error');
    }
  };

  const handleUnstickyThread = async (id) => {
    try {
      await adminAPI.unstickyThread(id);
      fetchThreads();
    } catch (e) {
      showToast('Failed to unpin thread', 'error');
    }
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await adminAPI.deleteForumPost(id);
      fetchThreads();
      fetchReports();
    } catch (e) {
      showToast('Failed to delete post', 'error');
    }
  };

  const handleResolveReport = async (id, action) => {
    try {
      await adminAPI.resolveForumReport(id, { action });
      fetchReports();
    } catch (e) {
      showToast('Failed to resolve report', 'error');
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-6">Forum Moderation</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => setActiveTab('threads')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'threads'
                ? 'border-b-2 border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
                : 'text-[hsl(var(--muted-foreground))]'
            }`}
          >
            Threads
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'reports'
                ? 'border-b-2 border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
                : 'text-[hsl(var(--muted-foreground))]'
            }`}
          >
            Reports
          </button>
        </div>

        {/* Filter */}
        <div className="mb-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        {activeTab === 'threads' && (
          <Card>
            <CardHeader>
              <CardTitle>Forum Threads</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-8">Loading threads...</p>
              ) : threads.length === 0 ? (
                <p className="text-center py-8 text-[hsl(var(--muted-foreground))]">No threads found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Title</th>
                        <th className="text-left p-3">Author</th>
                        <th className="text-left p-3">Replies</th>
                        <th className="text-left p-3">Views</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {threads.map((thread) => (
                        <tr key={thread.id} className="border-b hover:bg-[hsl(var(--accent))]">
                          <td className="p-3">
                            <a href={`/forum/${thread.slug}`} className="text-[hsl(var(--primary))] hover:underline">
                              {thread.title}
                            </a>
                          </td>
                          <td className="p-3">{thread.author?.name || 'N/A'}</td>
                          <td className="p-3">{thread.post_count || 0}</td>
                          <td className="p-3">{thread.views || 0}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-xs ${
                              thread.is_locked ? 'bg-red-100 text-red-800' :
                              thread.is_pinned ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {thread.is_locked ? 'Locked' : thread.is_pinned ? 'Pinned' : 'Active'}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              {thread.is_locked ? (
                                <Button size="sm" variant="outline" onClick={() => handleUnlockThread(thread.id)}>
                                  Unlock
                                </Button>
                              ) : (
                                <Button size="sm" variant="outline" onClick={() => handleLockThread(thread.id)}>
                                  Lock
                                </Button>
                              )}
                              {thread.is_pinned ? (
                                <Button size="sm" variant="outline" onClick={() => handleUnstickyThread(thread.id)}>
                                  Unpin
                                </Button>
                              ) : (
                                <Button size="sm" variant="outline" onClick={() => handleStickyThread(thread.id)}>
                                  Pin
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'reports' && (
          <Card>
            <CardHeader>
              <CardTitle>Forum Reports</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-8">Loading reports...</p>
              ) : reports.length === 0 ? (
                <p className="text-center py-8 text-[hsl(var(--muted-foreground))]">No reports found.</p>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <Card key={report.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold mb-2">Reported by: {report.user?.name || 'N/A'}</p>
                            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">
                              Reason: {report.reason}
                            </p>
                            {report.details && (
                              <p className="text-sm mb-2">{report.details}</p>
                            )}
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">
                              Post: {report.post?.content?.substring(0, 100)}...
                            </p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">
                              Thread: {report.post?.thread?.title}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResolveReport(report.id, 'dismiss')}
                            >
                              Dismiss
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (window.confirm('Delete the reported post?')) {
                                  handleResolveReport(report.id, 'delete_post');
                                }
                              }}
                            >
                              Delete Post
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
