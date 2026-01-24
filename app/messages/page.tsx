'use client';

import { useState, useMemo } from 'react';

type Message = {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
  avatar: string;
};

const FRIENDS = ['John Doe', 'Sarah Smith', 'Emma Wilson'];

export default function Messages() {
  const [messages] = useState<Message[]>([
    {
      id: 1,
      sender: 'John Doe',
      content: 'Hey, how\'s your workout routine going?',
      timestamp: '10:30 AM',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face'
    },
    {
      id: 2,
      sender: 'Sarah Smith',
      content: 'I completed today\'s meditation session!',
      timestamp: '11:45 AM',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face'
    }
  ]);

  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {

      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-6 w-full p-4 lg:p-0 h-full">
      {/* Friends Section */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg lg:col-span-1 order-2 lg:order-1">
        <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold">Friends</h2>
        </div>
        <div className="p-4 lg:p-6 max-h-64 lg:max-h-none overflow-y-auto">
          <div className="space-y-4">
            <button 
              className="w-full px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors touch-manipulation"
            >
              Invite Friend
            </button>
            <div className="space-y-2">
              {FRIENDS.map((friend) => (
                <div
                  key={friend}
                  className="flex items-center space-x-3 lg:space-x-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer touch-manipulation"
                >
                  <div className="relative w-8 h-8 flex-shrink-0">
                    <img
                      src={`https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face`}
                      alt={friend}
                      className="rounded-full w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `data:image/svg+xml,${encodeURIComponent(
                          `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="16">${friend.split(' ').map(n => n[0]).join('')}</text></svg>`
                        )}`;
                      }}
                    />
                  </div>
                  <span className="text-sm truncate">{friend}</span>
                </div>
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