'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '../lib/store';
import DashboardHeader from '../components/DashboardHeader';
import { downloadICS } from '../lib/calendar';
import { haptic } from '../lib/utils';

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ backgroundColor: '#f5f2eb' }} />}>
      <MessagesContent />
    </Suspense>
  );
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const { currentUser, conversations, members, sendMessage, markConversationRead, showToast } = useApp();
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);

  // Auto-open conversation from query param (e.g. from Partners page)
  useEffect(() => {
    const toId = searchParams.get('to');
    if (toId) setSelectedConvo(toId);
  }, [searchParams]);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewConvo, setShowNewConvo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConvo = conversations.find(c => c.memberId === selectedConvo);

  // Mark conversation as read when selected
  useEffect(() => {
    if (selectedConvo) {
      markConversationRead(selectedConvo);
    }
  }, [selectedConvo, markConversationRead]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConvo?.messages.length]);

  const handleSend = () => {
    if (!messageText.trim() || !selectedConvo) return;
    haptic('light');
    sendMessage(selectedConvo, messageText.trim());
    setMessageText('');
    showToast('Message sent');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNewConvo = (memberId: string) => {
    setSelectedConvo(memberId);
    setShowNewConvo(false);
    setSearchQuery('');
  };

  const filteredMembers = members.filter(m =>
    m.id !== currentUser?.id &&
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !conversations.some(c => c.memberId === m.id)
  );

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 1) return `${Math.max(1, Math.floor(diffMs / 60000))}m ago`;
    if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
    if (diffHours < 48) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // On mobile: show chat full-screen when a conversation is selected
  const mobileShowChat = selectedConvo !== null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f2eb' }}>
      <DashboardHeader title="Messages" />

      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto animate-slideUp">
        <div className="flex rounded-2xl border overflow-hidden" style={{ background: '#fff', borderColor: '#e0dcd3', height: 'calc(100vh - 160px)', minHeight: 500 }}>

          {/* Conversation List — hidden on mobile when chat is open */}
          <div className={`w-full sm:w-80 shrink-0 border-r flex flex-col ${mobileShowChat ? 'hidden sm:flex' : 'flex'}`} style={{ borderColor: '#f0ede6' }}>
            <div className="p-4 border-b" style={{ borderColor: '#f0ede6' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm" style={{ color: '#2a2f1e' }}>Conversations</h3>
                <button
                  onClick={() => setShowNewConvo(!showNewConvo)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-gray-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="#6b7a3d" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                  </svg>
                </button>
              </div>
              {showNewConvo && (
                <div className="mb-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search members..."
                    className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-[#6b7a3d]/20"
                    style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }}
                    autoFocus
                  />
                  {searchQuery && (
                    <div className="mt-1 max-h-32 overflow-y-auto rounded-lg border" style={{ borderColor: '#e0dcd3' }}>
                      {filteredMembers.map(m => (
                        <button
                          key={m.id}
                          onClick={() => startNewConvo(m.id)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                          style={{ color: '#2a2f1e' }}
                        >
                          {m.name}
                        </button>
                      ))}
                      {filteredMembers.length === 0 && (
                        <p className="px-3 py-2 text-xs" style={{ color: '#6b7266' }}>No members found</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-8 text-center animate-fadeIn">
                  <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(107, 122, 61, 0.08)' }}>
                    <svg className="w-6 h-6" fill="none" stroke="#6b7a3d" viewBox="0 0 24 24" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="font-medium text-sm mb-1" style={{ color: '#2a2f1e' }}>No conversations yet</p>
                  <p className="text-xs" style={{ color: '#6b7266' }}>Start a chat with a member</p>
                </div>
              ) : (
                [...conversations]
                  .sort((a, b) => new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime())
                  .map(convo => (
                    <button
                      key={convo.memberId}
                      onClick={() => setSelectedConvo(convo.memberId)}
                      className="w-full text-left px-4 py-3 border-b transition-all duration-200"
                      style={{
                        borderColor: '#f0ede6',
                        background: selectedConvo === convo.memberId ? 'rgba(107, 122, 61, 0.06)' : 'transparent',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'rgba(107, 122, 61, 0.1)', color: '#6b7a3d' }}>
                          {convo.memberName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium truncate" style={{ color: '#2a2f1e' }}>{convo.memberName}</span>
                            <span className="text-[0.65rem] shrink-0" style={{ color: '#6b7266' }}>{formatTime(convo.lastTimestamp)}</span>
                          </div>
                          <p className="text-xs truncate mt-0.5" style={{ color: '#6b7266' }}>{convo.lastMessage}</p>
                        </div>
                        {convo.unread > 0 && (
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[0.6rem] font-bold text-white shrink-0" style={{ background: '#6b7a3d' }}>
                            {convo.unread}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
              )}
            </div>
          </div>

          {/* Chat Area — full width on mobile when open */}
          <div className={`flex-1 flex flex-col ${mobileShowChat ? 'flex' : 'hidden sm:flex'}`}>
            {!selectedConvo ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center animate-fadeIn">
                  <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(107, 122, 61, 0.08)' }}>
                    <svg className="w-8 h-8" fill="none" stroke="#6b7a3d" viewBox="0 0 24 24" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                    </svg>
                  </div>
                  <p className="font-medium text-sm mb-1" style={{ color: '#2a2f1e' }}>No conversation selected</p>
                  <p className="text-xs mb-4" style={{ color: '#6b7266' }}>Pick a chat or start a new one</p>
                  <button
                    onClick={() => setShowNewConvo(true)}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-white btn-press"
                    style={{ background: '#6b7a3d' }}
                  >
                    New Message
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Chat header with back button on mobile */}
                <div className="px-4 sm:px-5 py-3 border-b flex items-center gap-3" style={{ borderColor: '#f0ede6' }}>
                  <button
                    onClick={() => setSelectedConvo(null)}
                    className="sm:hidden p-1.5 -ml-1 rounded-lg hover:bg-black/5 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="#2a2f1e" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                    </svg>
                  </button>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(107, 122, 61, 0.1)', color: '#6b7a3d' }}>
                    {(activeConvo?.memberName || '').split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: '#2a2f1e' }}>{activeConvo?.memberName}</p>
                    <p className="text-xs" style={{ color: '#6b7266' }}>Member</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
                  {activeConvo?.messages.map(msg => {
                    const isMine = msg.fromId === currentUser?.id;
                    // Detect booking calendar marker [booking:courtName:date:time]
                    const bookingMatch = msg.text.match(/\[booking:([^:]+):(\d{4}-\d{2}-\d{2}):([^\]]+)\]/);
                    const displayText = bookingMatch ? msg.text.replace(bookingMatch[0], '').trim() : msg.text;
                    return (
                      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                        <div
                          className="max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 transition-all"
                          style={{
                            background: isMine ? '#6b7a3d' : '#f5f2eb',
                            color: isMine ? '#fff' : '#2a2f1e',
                            borderBottomRightRadius: isMine ? 4 : 16,
                            borderBottomLeftRadius: isMine ? 16 : 4,
                          }}
                        >
                          <p className="text-sm whitespace-pre-line">{displayText}</p>
                          {bookingMatch && (
                            <button
                              onClick={() => {
                                downloadICS([{
                                  title: `Tennis — ${bookingMatch[1]}`,
                                  date: bookingMatch[2],
                                  time: bookingMatch[3],
                                  duration: 60,
                                  location: `${bookingMatch[1]} — Mono Tennis Club`,
                                }], 'mtc-booking.ics');
                              }}
                              className="mt-2 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                              style={{
                                background: isMine ? 'rgba(255,255,255,0.15)' : 'rgba(107, 122, 61, 0.1)',
                                color: isMine ? '#fff' : '#6b7a3d',
                              }}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Add to Calendar
                            </button>
                          )}
                          <p className="text-[0.6rem] mt-1 opacity-60">
                            {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 sm:p-4 border-t" style={{ borderColor: '#f0ede6' }}>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message..."
                      maxLength={500}
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#6b7a3d]/20 transition-shadow"
                      style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!messageText.trim()}
                      className="px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50 active:scale-95"
                      style={{ background: '#6b7a3d' }}
                    >
                      Send
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
