import React from 'react';
import { Button } from './ui/button';
import { liveChatAPI, supportAPI } from '../utils/api';

const POLL_INTERVAL_MS = 6000;
const AVAILABILITY_INTERVAL_MS = 30000;

export default function SupportChatWidget() {
  const [online, setOnline] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState('');
  const [error, setError] = React.useState(null);

  const pollRef = React.useRef(null);
  const availabilityRef = React.useRef(null);

  const fetchAvailability = React.useCallback(async () => {
    try {
      const res = await supportAPI.getAvailability();
      setOnline(!!res.data?.online);
    } catch (e) {
      // ignore
    }
  }, []);

  const loadChat = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await liveChatAPI.createOrGetChat();
      const chatRes = await liveChatAPI.getChat();
      const msgs = chatRes.data?.messages || [];
      setMessages(msgs);
      await liveChatAPI.markRead();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load chat');
    } finally {
      setLoading(false);
    }
  }, []);

  const startPolling = React.useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(loadChat, POLL_INTERVAL_MS);
  }, [loadChat]);

  const stopPolling = React.useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    fetchAvailability();
    availabilityRef.current = setInterval(fetchAvailability, AVAILABILITY_INTERVAL_MS);
    return () => {
      if (availabilityRef.current) clearInterval(availabilityRef.current);
      stopPolling();
    };
  }, [fetchAvailability, stopPolling]);

  React.useEffect(() => {
    if (open) {
      loadChat();
      startPolling();
    } else {
      stopPolling();
    }
  }, [open, loadChat, startPolling, stopPolling]);

  const handleSend = async () => {
    if (!input.trim()) return;
    try {
      const text = input.trim();
      setInput('');
      await liveChatAPI.sendMessage(text);
      await loadChat();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to send message');
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex flex-col items-end gap-2">
        {open && (
          <div className="w-80 h-96 rounded-lg shadow-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] flex flex-col">
            <div className="p-3 border-b border-[hsl(var(--border))] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${online ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-sm font-medium">Support Chat</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                ✕
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
              {loading && <div className="text-[hsl(var(--muted-foreground))]">Loading…</div>}
              {error && <div className="text-red-500 text-xs">{error}</div>}
              {!loading && !error && messages.length === 0 && (
                <div className="text-[hsl(var(--muted-foreground))]">Start a conversation with support.</div>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`px-3 py-2 rounded-lg max-w-[80%] ${
                      m.sender_type === 'user'
                        ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                        : 'bg-[hsl(var(--accent))] text-[hsl(var(--foreground))]'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.message}</div>
                    <div className="text-[10px] opacity-70 mt-1">
                      {m.sent_at ? new Date(m.sent_at).toLocaleString() : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-[hsl(var(--border))] space-y-2">
              <textarea
                className="w-full border rounded-md text-sm p-2 resize-none"
                rows={2}
                placeholder={online ? 'Type your message…' : 'Support is offline'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={!online}
              />
              <Button className="w-full" onClick={handleSend} disabled={!online || !input.trim()}>
                Send
              </Button>
            </div>
          </div>
        )}
        <Button
          onClick={() => setOpen((v) => !v)}
          className="shadow-lg"
          variant={online ? 'default' : 'outline'}
        >
          {online ? 'Chat with Support' : 'Support Offline'}
        </Button>
      </div>
    </div>
  );
}


