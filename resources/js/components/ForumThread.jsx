import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { forumAPI } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from './ui/UserAvatar';
import ThumbsUpButton from './ui/ThumbsUpButton';

export default function ForumThread() {
  const { slug } = useParams();
  const [thread, setThread] = React.useState(null);
  const [reply, setReply] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [replying, setReplying] = React.useState(false);
  const [reacting, setReacting] = React.useState(new Set());
  const { user } = useAuth();

  const load = async () => {
    setLoading(true);
    try {
      const res = await forumAPI.getThread(slug);
      setThread(res.data);
    } catch (e) {
      console.error('Failed to load thread', e);
      setThread(null);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (slug) load();
  }, [slug]);

  const handleReply = async () => {
    if (!reply.trim() || !thread?.thread?.id) return;
    setReplying(true);
    try {
      await forumAPI.reply(thread.thread.id, reply);
      setReply('');
      load();
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to post reply');
    } finally {
      setReplying(false);
    }
  };

  const handleReaction = async (postId, reactionType) => {
    if (reacting.has(postId)) return;
    setReacting(prev => new Set(prev).add(postId));
    
    try {
      await forumAPI.react(postId, reactionType);
      // Reload to get updated counts
      load();
    } catch (e) {
      console.error('Failed to react', e);
    } finally {
      setReacting(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  if (loading && !thread) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-[hsl(var(--muted))] rounded w-3/4"></div>
                <div className="h-4 bg-[hsl(var(--muted))] rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!thread || !thread.thread) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-[hsl(var(--muted-foreground))] mb-4">Thread not found</p>
            <Link to="/forum" className="text-[hsl(var(--primary))] hover:underline">
              ← Back to forum
        </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { thread: threadData, question, replies = [] } = thread;
  const questionReactionCount = (question?.reaction_counts?.useful || 0) + (question?.reaction_counts?.like || 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      {/* Back Link */}
      <Link to="/forum" className="text-[hsl(var(--primary))] hover:underline text-sm">
        ← Back to forum
      </Link>

      {/* Question Section */}
      {question && (
      <Card>
        <CardHeader>
            <CardTitle className="text-xl">{threadData.title}</CardTitle>
            {threadData.category && (
              <span className="text-xs bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] px-2 py-1 rounded inline-block mt-2">
                {threadData.category.name}
              </span>
            )}
        </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <UserAvatar
                src={question.author?.profile_picture}
                name={question.author?.name}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold">{question.author?.name || 'Unknown'}</span>
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">
                    • {new Date(question.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-line text-[hsl(var(--foreground))]">
                    {question.content}
                  </p>
                </div>
                <div className="mt-4">
                  <ThumbsUpButton
                    count={questionReactionCount}
                    isActive={false} // TODO: Check if user has reacted
                    onClick={() => handleReaction(question.id, 'useful')}
                    disabled={!user || reacting.has(question.id)}
                    label="useful"
                  />
                </div>
              </div>
            </div>
        </CardContent>
      </Card>
      )}

      {/* Replies Section */}
      <Card>
        <CardHeader>
          <CardTitle>
            {replies.length === 0 ? 'No replies yet' : `${replies.length} ${replies.length === 1 ? 'Reply' : 'Replies'}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {replies.length === 0 ? (
            <p className="text-[hsl(var(--muted-foreground))] text-center py-4">
              Be the first to reply to this thread!
            </p>
          ) : (
            replies.map((reply) => {
              const replyReactionCount = reply.reaction_counts?.helpful || 0;
              return (
                <div key={reply.id} className="flex gap-4 pb-6 border-b border-[hsl(var(--border))] last:border-0 last:pb-0">
                  <UserAvatar
                    src={reply.author?.profile_picture}
                    name={reply.author?.name}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">{reply.author?.name || 'Unknown'}</span>
                      <span className="text-sm text-[hsl(var(--muted-foreground))]">
                        • {new Date(reply.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="prose prose-sm max-w-none mb-3">
                      <p className="whitespace-pre-line text-[hsl(var(--foreground))]">
                        {reply.content}
                      </p>
                    </div>
                    <ThumbsUpButton
                      count={replyReactionCount}
                      isActive={false} // TODO: Check if user has reacted
                      onClick={() => handleReaction(reply.id, 'helpful')}
                      disabled={!user || reacting.has(reply.id)}
                      label="helpful"
                    />
                  </div>
            </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Reply Form */}
      <Card>
        <CardHeader>
          <CardTitle>Post a reply</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {user ? (
            <>
          <Textarea
                rows={6}
                placeholder="Write your reply..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
                disabled={replying}
          />
              <Button 
                onClick={handleReply} 
                disabled={!reply.trim() || replying || !threadData.id}
              >
                {replying ? 'Posting...' : 'Post Reply'}
          </Button>
            </>
          ) : (
            <div className="p-4 bg-[hsl(var(--muted))] rounded-md">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                <Link to="/login" className="text-[hsl(var(--primary))] hover:underline">
                  Login
                </Link>
                {' '}to reply to this thread.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
