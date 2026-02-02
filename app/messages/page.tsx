'use client';

import { useState, useEffect } from 'react';
import { sendConfirmationEmail } from '@/lib/email/sendConfirmationEmail';

type Conversation = {
  id: string;
  type: string;
  created_by: string;
  direct_key: string;
  created_at: string;
  display_name: string;
  display_email: string;
};
type Message = {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
  avatar: string;
};

type PageContext = {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export default function Messages() {
  const [isOpen, setOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isInviteSent, setIsInviteSent] = useState(false);
  const [inviteSentMessage, setInviteSentMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const defaultPageContext: PageContext = {
    page: 1,
    limit: 10,
    totalCount: 0, 
    totalPages: 0,
    hasNextPage: true,
    hasPrevPage: false,
  };
  const [pageContext, setPageContext] = useState<PageContext>(defaultPageContext);
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch(`/api/conversations?page=${page}&limit=${limit}`, {
          credentials: 'include',
        });
        const json = await response.json().catch(() => null);
        if (!response.ok) {
          console.error('Failed to fetch conversations:', json?.error || response.statusText);
          return;
        }
        if (!json?.data) {
          console.error('Invalid conversations response format');
          return;
        }
        const { results, page_context } = json.data;
        setConversations(Array.isArray(results) ? results : []);
        setPageContext(page_context || defaultPageContext);
      } catch (error) {
        console.error('Error fetching conversations:', (error as any)?.message || 'Unknown error');
      }
    };
    fetchConversations();
  }, [page, limit]);
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      // Post message to API for the selected friend
      setNewMessage('');
    }
  };
  const getMessages = async (conversation_id: string) => {
    const response = await fetch(`/api/conversations/${conversation_id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id }),
    });
    const data = await response.json();
    setMessages(data);
  }
  const openInviteFriendModal = () => {
    setOpen(true)
  }
  const close = () => {
    setOpen(false)
  }
  const sendInvite = async (email) => {
    const data = await fetch('/api/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const response = await data.json();
    if (response.ok) {
      setInviteSentMessage({
        type: 'success',
        message: response.data.message,
      });
      setIsInviteSent(true);
      close();
      const appBaseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL;
      let actionLink = `${appBaseUrl}/invites/accept?inviteId=${response.data.invite_id}`;
      let emailSent = await sendConfirmationEmail({ to: email, confirmationLink: actionLink });
      if (!emailSent) {
        setInviteSentMessage({
          type: 'error',
          message: 'Failed to send confirmation email',
        });
        setIsInviteSent(false);
        close();
      }
    } else {
      setInviteSentMessage({
        type: 'error',
        message: response.error || response.statusText,
      });
      setIsInviteSent(false);
      close();
    }
  }
  const Modal = () => {
    const [email, setEmail] = useState('');
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-10">
      
      {/* MODAL */}
      <div
        className="
          relative bg-white text-black
          h-[225px]
          w-full
          sm:w-3/4
          md:w-1/2
          lg:w-1/3
          max-w-none
          rounded-lg
          h-48
          flex flex-col
        "
      >
        {/* HEADER */}
        <div className="p-4 flex justify-between items-center border-b shrink-0">
          <span className="font-medium">Invite User</span>
          <button onClick={close} className="text-sm text-gray-600">
            close
          </button>
        </div>

        {/* BODY (GROWS) */}
        <div className="flex-1 p-4 text-base">
          <div className="w-full pe-8">
            <input
              type="email"
              placeholder="Your email"
              className="
                placeholder:text-sm
                w-full p-2
                border border-t-0 border-l-0 border-r-0
                rounded-none
                outline-none
                text-base
                bg-white
              "
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-3 border-t shrink-0">
          <button
            type="button"
            className="py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            onClick={() => sendInvite(email)}
          >
            Invite
          </button>
        </div>
      </div>
    </div>

    )
  }
  return (
    <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-6 w-full p-4 lg:p-0 h-full">
      {/* Friends Section */}
      <Modal/>
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg lg:col-span-1 order-2 lg:order-1">
        <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold">Friends</h2>
        </div>
        <div className="p-4 lg:p-6 max-h-64 lg:max-h-none overflow-y-auto">
          <div className="space-y-4">
            <button 
              className="w-full px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors touch-manipulation"
              onClick={openInviteFriendModal}
            >
              Invite Friend
            </button>
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  className="flex items-start space-x-3 lg:space-x-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer touch-manipulation w-full"
                >
                  <div className="relative w-8 h-8 flex-shrink-0">
                    <img
                      src={`https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face`}
                      alt={conversation.display_name}
                      className="rounded-full w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `data:image/svg+xml,${encodeURIComponent(
                          `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="16">${conversation.display_name.split(' ').map(n => n[0]).join('')}</text></svg>`
                        )}`;
                      }}
                    />
                  </div>
                  <div className="flex flex-col justify-start items-start">
                    <span className="text-sm truncate">{conversation.display_name}</span>
                    <small className="text-xs text-gray-500 dark:text-gray-400"><em>{conversation.display_email}</em></small>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Messages Section */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg lg:col-span-2 order-1 lg:order-2 flex flex-col h-[70vh] lg:h-auto">
        <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="font-semibold">Messages</h2>
        </div>
        <div className="p-4 lg:p-6 flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto pr-2 lg:pr-4 space-y-4 mb-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            {messages.map((message) => (
              <div key={message.id} className="flex items-start space-x-3 lg:space-x-4">
                <div className="relative w-8 h-8 flex-shrink-0">
                  <img
                    src={message.avatar}
                    alt={message.sender}
                    className="rounded-full w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="16">${message.sender.split(' ').map(n => n[0]).join('')}</text></svg>`;
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold truncate">{message.sender}</h4>
                    <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">{message.timestamp}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 break-words">{message.content}</p>
                </div>
              </div>
            ))}
          </div>
          
          <form onSubmit={handleSendMessage} className="flex space-x-2 flex-shrink-0">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-3 lg:px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white min-w-0"
            />
            <button 
              type="submit"
              className="px-3 lg:px-4 py-2 text-sm text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors touch-manipulation flex-shrink-0"
            >
              Send
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}