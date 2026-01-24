'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

type Msg = { id: string; role: 'user' | 'assistant'; text: string };

export default function ChatbotPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { id: 'm0', role: 'assistant', text: 'LLMChatbot is currently disabled. We’ll design it based on SQL data next.' },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((p) => [...p, { id: `u_${Date.now()}`, role: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/llmchatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json().catch(() => ({}));
      const reply = res.ok ? (data?.message ?? 'OK') : (data?.error ?? 'Request failed');

      setMessages((p) => [...p, { id: `a_${Date.now()}`, role: 'assistant', text: String(reply) }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        {/* <Button onClick={() => setIsOpen(true)} className="h-12 rounded-full shadow-lg">
          LLM Chat
        </Button> */}
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-96 shadow-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">LLMChatbot</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex flex-col h-[460px]">
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-3 py-3">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
          </ScrollArea>
          <div className="border-t p-3 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message…"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter') send();
              }}
            />
            <Button onClick={send} disabled={!input.trim() || loading}>
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


