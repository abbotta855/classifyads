import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { forumAPI } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

// Minimal thread view placeholder. Replace with full thread + replies UI.
export default function ForumThread() {
  const { slug } = useParams();
  const [thread, setThread] = React.useState(null);
  const [reply, setReply] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await forumAPI.getThread(slug);
      setThread(res.data);
    } catch (e) {
      console.error('Failed to load thread', e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (slug) load();
  }, [slug]);

  const handleReply = async () => {
    if (!reply.trim()) return;
    try {
      await forumAPI.replyThread(slug, { content: reply });
      setReply('');
      load();
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to post reply');
    }
  };

  if (!thread) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <p>{loading ? 'Loading…' : 'Thread not found'}</p>
        <Link to="/forum/threads" className="text-blue-600 underline">
          Back to threads
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{thread.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-[hsl(var(--muted-foreground))]">{thread.content}</p>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">By {thread.user?.name || 'Unknown'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Replies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(thread.replies || []).map((r) => (
            <div key={r.id} className="rounded border border-[hsl(var(--border))] p-3">
              <div className="text-sm font-semibold">{r.user?.name || 'Unknown'}</div>
              <div className="text-sm text-[hsl(var(--muted-foreground))] whitespace-pre-line">{r.content}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Post a reply</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            rows={4}
            placeholder="Write your reply"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
          <Button onClick={handleReply} disabled={!reply.trim() || loading}>
            Reply
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

