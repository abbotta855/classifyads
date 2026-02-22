import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { forumAPI } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from './ui/UserAvatar';
import ThumbsUpButton from './ui/ThumbsUpButton';
import { useToast } from './Toast';

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
      showToast(e.response?.data?.error || 'Failed to post reply', 'error');
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
  const questionHasReaction = question?.user_reactions?.includes('useful') || question?.user_reactions?.includes('like');

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      {/* Back Link */}
      <Link to="/forum" className="text-[hsl(var(--primary))] hover:underline text-sm">
        ← Back to forum
      </Link>

      {/* Question Section - Highlighted */}
      {question && (
      <Card className="border-2 border-[hsl(var(--primary))] bg-[hsl(var(--primary)))]/5">
        <CardHeader className="bg-[hsl(var(--primary))]/10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-2 py-1 rounded">
                QUESTION
              </span>
              {threadData.category && (
                <span className="text-xs bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] px-2 py-1 rounded">
                  {threadData.category.name}
                </span>
              )}
            </div>
            <CardTitle className="text-xl">{threadData.title}</CardTitle>
        </CardHeader>
          <CardContent className="space-y-4 pt-4">
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
                <div className="prose prose-sm max-w-none bg-[hsl(var(--background))] p-4 rounded-md border border-[hsl(var(--border))]">
                  <p className="whitespace-pre-line text-[hsl(var(--foreground))] leading-relaxed">
                    {question.content}
                  </p>
                </div>
                <div className="mt-4">
                  <ThumbsUpButton
                    count={questionReactionCount}
                    isActive={questionHasReaction}
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
              const replyHasReaction = reply?.user_reactions?.includes('helpful');
              return (
                <Card key={reply.id} className="border-l-4 border-l-[hsl(var(--primary))]">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <UserAvatar
                        src={reply.author?.profile_picture}
                        name={reply.author?.name}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] px-2 py-1 rounded">
                            ANSWER
                          </span>
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
                        <div className="prose prose-sm max-w-none mb-3 bg-[hsl(var(--background))] p-3 rounded-md border border-[hsl(var(--border))]">
                          <p className="whitespace-pre-line text-[hsl(var(--foreground))] leading-relaxed">
                            {reply.content}
                          </p>
                        </div>
                        <ThumbsUpButton
                          count={replyReactionCount}
                          isActive={replyHasReaction}
                          onClick={() => handleReaction(reply.id, 'helpful')}
                          disabled={!user || reacting.has(reply.id)}
                          label="helpful"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
            <div className="p-4 bg-orange-50 dark:bg-orange-950/50 border border-orange-400 dark:border-orange-700 rounded-md">
              <p className="text-sm text-gray-900 dark:text-gray-100">
                <Link to="/login" className="font-semibold underline hover:no-underline text-blue-600 dark:text-blue-400">
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
