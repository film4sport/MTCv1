'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth, useSocial, useBookings, useDerived } from '../lib/store';
import { useToast } from '../lib/toast';
import DashboardHeader from '../components/DashboardHeader';
import { downloadICS } from '../lib/calendar';
import { supabase } from '../../lib/supabase';

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ backgroundColor: '#f5f2eb' }} />}>
      <MessagesContent />
    </Suspense>
  );
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();
  const { conversations, sendMessage, markConversationRead, deleteConversation, deleteMessage } = useSocial();
  const { bookings } = useBookings();
  const { members } = useDerived();
  const { showToast } = useToast();
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
  const [confirmedBookings, setConfirmedBookings] = useState<Set<string>>(new Set());

  const confirmAttendance = useCallback(async (courtName: string, date: string, time: string) => {
    if (!currentUser) return;
    // Find the booking by court + date + time
    const booking = bookings.find(b =>
      b.courtName === courtName && b.date === date && b.time === time && b.status === 'confirmed'
    );
    if (!booking) { showToast('Booking not found.', 'error'); return; }
    const key = `${booking.id}-${currentUser.id}`;
    if (confirmedBookings.has(key)) return;

    // Optimistic UI
    setConfirmedBookings(prev => new Set(prev).add(key));
    showToast('Attendance confirmed!');

    try {
      const res = await fetch('/api/email-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, participantId: currentUser.id, via: 'dashboard' }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Rollback
      setConfirmedBookings(prev => { const s = new Set(prev); s.delete(key); return s; });
      showToast('Failed to confirm. Try again.', 'error');
    }
  }, [currentUser, bookings, confirmedBookings, showToast]);

  // Auto-open conversation from query param (e.g. from Partners page)
  useEffect(() => {
    const toId = searchParams.get('to');
    if (toId) setSelectedConvo(toId);
  }, [searchParams]);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewConvo, setShowNewConvo] = useState(false);
  const [memberActiveIndex, setMemberActiveIndex] = useState(-1);
  const [replyTo, setReplyTo] = useState<{ id: string; text: string; fromName: string } | null>(null);
  const [msgSearchQuery, setMsgSearchQuery] = useState('');
  const [msgSearchOpen, setMsgSearchOpen] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, number>>({}); // memberId → timeout id
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastTypingSentRef = useRef(0);

  // Typing indicator — Supabase Realtime broadcast
  useEffect(() => {
    if (!currentUser) return;
    const channel = supabase.channel('typing-indicators', { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload?.toId === currentUser.id && payload?.fromId) {
          // Show typing for this user, clear after 3s
          setTypingUsers(prev => {
            const existing = prev[payload.fromId];
            if (existing) clearTimeout(existing);
            const timeout = window.setTimeout(() => {
              setTypingUsers(p => { const next = { ...p }; delete next[payload.fromId]; return next; });
            }, 3000);
            return { ...prev, [payload.fromId]: timeout };
          });
        }
      })
      .subscribe();
    typingChannelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [currentUser?.id]);

  const broadcastTyping = useCallback((toId: string) => {
    if (!currentUser || !typingChannelRef.current) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < 2000) return; // Throttle: max once per 2s
    lastTypingSentRef.current = now;
    typingChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { fromId: currentUser.id, toId } });
  }, [currentUser]);

  const activeConvo = conversations.find(c => c.memberId === selectedConvo);
  // For new conversations with no messages yet, look up the member name
  const selectedMember = selectedConvo ? members.find(m => m.id === selectedConvo) : null;
  const activeName = activeConvo?.memberName || selectedMember?.name || '';

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

  const [sending, setSending] = useState(false);
  const handleSend = async () => {
    if (!messageText.trim() || !selectedConvo || sending) return;
    setSending(true);
    const savedReply = replyTo;
    const text = replyTo
      ? `[reply:${replyTo.fromName}:${replyTo.text.slice(0, 80)}]\n${messageText.trim()}`
      : messageText.trim();
    setMessageText('');
    setReplyTo(null);
    try {
      await sendMessage(selectedConvo, text);
      showToast('Message sent');
    } catch {
      // Restore reply context so user can retry
      if (savedReply) setReplyTo(savedReply);
      setMessageText(messageText);
    } finally {
      setSending(false);
    }
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

  const filteredMembers = members
    .filter(m =>
      m.id !== currentUser?.id &&
      (!searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.role === 'admin' && 'mono tennis club'.includes(searchQuery.toLowerCase())))
    )
    .sort((a, b) => {
      // Pin admins (Mono Tennis Club) to the top
      if (a.role === 'admin' && b.role !== 'admin') return -1;
      if (b.role === 'admin' && a.role !== 'admin') return 1;
      return a.name.localeCompare(b.name);
    });

  // Reset active index when search changes
  useEffect(() => { setMemberActiveIndex(-1); }, [searchQuery]);

  const handleMemberKeyDown = (e: React.KeyboardEvent) => {
    if (filteredMembers.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMemberActiveIndex(prev => (prev + 1) % filteredMembers.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMemberActiveIndex(prev => (prev <= 0 ? filteredMembers.length - 1 : prev - 1));
    } else if (e.key === 'Enter' && memberActiveIndex >= 0) {
      e.preventDefault();
      startNewConvo(filteredMembers[memberActiveIndex].id);
    } else if (e.key === 'Escape') {
      setSearchQuery('');
      setShowNewConvo(false);
    }
  };

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
    <div className="min-h-screen dashboard-gradient-bg">
      <DashboardHeader title="Messages" />

      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto animate-slideUp">
        <div className="glass-card flex rounded-2xl border overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)', height: 'calc(100vh - 160px)', minHeight: 500 }}>

          {/* Conversation List — hidden on mobile when chat is open */}
          <div className={`w-full sm:w-80 shrink-0 border-r flex flex-col ${mobileShowChat ? 'hidden sm:flex' : 'flex'}`} style={{ borderColor: '#f0ede6' }}>
            <div className="p-4 border-b" style={{ borderColor: '#f0ede6' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm" style={{ color: '#2a2f1e' }}>Conversations</h3>
                <button
                  onClick={() => setShowNewConvo(!showNewConvo)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:shadow-md active:scale-95"
                  style={{ background: showNewConvo ? '#4a5528' : '#6b7a3d', boxShadow: '0 2px 8px rgba(107, 122, 61, 0.3)' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d={showNewConvo ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"}/>
                  </svg>
                  {showNewConvo ? 'Close' : 'New Message'}
                </button>
              </div>
              {showNewConvo && (
                <div className="mb-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleMemberKeyDown}
                    placeholder="Search members..."
                    role="combobox"
                    aria-label="Search members to message"
                    aria-expanded={!!searchQuery && filteredMembers.length > 0}
                    aria-controls="member-search-listbox"
                    aria-autocomplete="list"
                    aria-activedescendant={memberActiveIndex >= 0 ? `member-option-${memberActiveIndex}` : undefined}
                    className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-[#6b7a3d]/20"
                    style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }}
                    autoFocus
                  />
                  <div role="listbox" id="member-search-listbox" className="mt-1 max-h-40 overflow-y-auto rounded-lg border" style={{ borderColor: '#e0dcd3' }}>
                    {filteredMembers.map((m, i) => {
                      const hasConvo = conversations.some(c => c.memberId === m.id);
                      const displayName = m.role === 'admin' ? 'Mono Tennis Club' : m.name;
                      return (
                        <button
                          key={m.id}
                          id={`member-option-${i}`}
                          role="option"
                          aria-selected={memberActiveIndex === i}
                          onClick={() => startNewConvo(m.id)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between"
                          style={{ color: '#2a2f1e', backgroundColor: memberActiveIndex === i ? 'rgba(107, 122, 61, 0.08)' : undefined }}
                        >
                          <span className="flex items-center gap-2">
                            {displayName}
                            {m.role === 'admin' && <svg className="w-3.5 h-3.5 opacity-50" fill="none" stroke="#6b7a3d" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>}
                          </span>
                          {hasConvo && <span className="text-[0.6rem] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(107,122,61,0.1)', color: '#6b7a3d' }}>existing</span>}
                        </button>
                      );
                    })}
                    {filteredMembers.length === 0 && (
                      <p className="px-3 py-2 text-xs" style={{ color: '#6b7266' }}>No members found</p>
                    )}
                  </div>
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
                    <div
                      key={convo.memberId}
                      className="group relative w-full text-left px-4 py-3 border-b transition-all duration-200 cursor-pointer"
                      style={{
                        borderColor: '#f0ede6',
                        background: selectedConvo === convo.memberId ? 'rgba(107, 122, 61, 0.06)' : 'transparent',
                      }}
                      onClick={() => { setSelectedConvo(convo.memberId); setMsgSearchQuery(''); setMsgSearchOpen(false); }}
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
                        <button
                          onClick={(e) => { e.stopPropagation(); if (selectedConvo === convo.memberId) setSelectedConvo(null); deleteConversation(convo.memberId); showToast('Conversation deleted'); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all"
                          title="Delete conversation"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="#e74c3c" viewBox="0 0 24 24" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
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
                    {activeName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm" style={{ color: '#2a2f1e' }}>{activeName}</p>
                    <p className="text-xs" style={{ color: '#6b7266' }}>Member</p>
                  </div>
                  <button
                    onClick={() => { setMsgSearchOpen(o => !o); setMsgSearchQuery(''); }}
                    className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
                    aria-label="Search messages"
                  >
                    <svg className="w-4 h-4" fill="none" stroke={msgSearchOpen ? '#6b7a3d' : '#6b7266'} viewBox="0 0 24 24" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                  </button>
                </div>
                {msgSearchOpen && (
                  <div className="px-4 sm:px-5 py-2 border-b" style={{ borderColor: '#f0ede6' }}>
                    <input
                      type="text"
                      placeholder="Search messages..."
                      value={msgSearchQuery}
                      onChange={e => setMsgSearchQuery(e.target.value)}
                      autoFocus
                      className="w-full px-3 py-1.5 text-sm rounded-lg border outline-none focus:ring-1"
                      style={{ borderColor: '#e0ddd4', background: '#faf9f5', color: '#2a2f1e' }}
                    />
                    {msgSearchQuery && (
                      <p className="text-xs mt-1" style={{ color: '#6b7266' }}>
                        {activeConvo?.messages.filter(m => m.text.toLowerCase().includes(msgSearchQuery.toLowerCase())).length || 0} matches
                      </p>
                    )}
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
                  {!activeConvo && selectedConvo && (
                    <div className="flex-1 flex items-center justify-center h-full">
                      <div className="text-center py-12 animate-fadeIn">
                        <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(107, 122, 61, 0.08)' }}>
                          <svg className="w-6 h-6" fill="none" stroke="#6b7a3d" viewBox="0 0 24 24" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                          </svg>
                        </div>
                        <p className="text-sm font-medium" style={{ color: '#2a2f1e' }}>Start a conversation with {activeName.split(' ')[0]}</p>
                        <p className="text-xs mt-1" style={{ color: '#6b7266' }}>Type a message below</p>
                      </div>
                    </div>
                  )}
                  {activeConvo?.messages.map(msg => {
                    const isMine = msg.fromId === currentUser?.id;
                    const msgSearchMatch = !msgSearchQuery || msg.text.toLowerCase().includes(msgSearchQuery.toLowerCase());
                    // Detect booking calendar marker [booking:courtName:date:time]
                    const bookingMatch = msg.text.match(/\[booking:([^:]+):(\d{4}-\d{2}-\d{2}):([^\]]+)\]/);
                    // Detect reply-to quote [reply:Name:quoted text]
                    const replyMatch = msg.text.match(/^\[reply:([^:]+):([^\]]*)\]\n?([\s\S]*)$/);
                    const displayText = replyMatch
                      ? replyMatch[3].trim()
                      : (bookingMatch ? msg.text.replace(bookingMatch[0], '').trim() : msg.text);
                    const quotedReply = replyMatch ? { fromName: replyMatch[1], text: replyMatch[2] } : null;

                    return (
                      <div key={msg.id} className={`group/msg flex ${isMine ? 'justify-end' : 'justify-start'} animate-fadeIn`} style={msgSearchQuery && !msgSearchMatch ? { opacity: 0.2, transition: 'opacity 0.2s' } : undefined}>
                        {/* Action buttons — delete (sent) and reply (all) */}
                        {isMine && (
                          <div className="self-center flex gap-0.5 opacity-0 group-hover/msg:opacity-100 transition-all mr-1">
                            <button
                              onClick={() => setReplyTo({ id: msg.id, text: msg.text, fromName: msg.from })}
                              className="p-1 rounded-lg hover:bg-gray-100 transition-all"
                              title="Reply"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="#aaa" viewBox="0 0 24 24" strokeWidth="2">
                                <polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 00-4-4H4" />
                              </svg>
                            </button>
                            <button
                              onClick={() => { deleteMessage(selectedConvo!, msg.id); showToast('Message deleted'); }}
                              className="p-1 rounded-lg hover:bg-red-50 transition-all"
                              title="Delete message"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="#ccc" viewBox="0 0 24 24" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        )}
                        {!isMine && (
                          <div className="self-center flex gap-0.5 opacity-0 group-hover/msg:opacity-100 transition-all order-2 ml-1">
                            <button
                              onClick={() => setReplyTo({ id: msg.id, text: msg.text, fromName: msg.from })}
                              className="p-1 rounded-lg hover:bg-gray-100 transition-all"
                              title="Reply"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="#aaa" viewBox="0 0 24 24" strokeWidth="2">
                                <polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 00-4-4H4" />
                              </svg>
                            </button>
                          </div>
                        )}
                        <div
                          className="max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 transition-all group/bubble"
                          style={{
                            background: isMine ? '#6b7a3d' : '#f5f2eb',
                            color: isMine ? '#fff' : '#2a2f1e',
                            borderBottomRightRadius: isMine ? 4 : 16,
                            borderBottomLeftRadius: isMine ? 16 : 4,
                          }}
                        >
                          {/* Quoted reply */}
                          {quotedReply && (
                            <div className="mb-1.5 px-2.5 py-1.5 rounded-lg text-[0.7rem] border-l-2" style={{
                              background: isMine ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.04)',
                              borderColor: isMine ? 'rgba(255,255,255,0.4)' : '#6b7a3d',
                              opacity: 0.85,
                            }}>
                              <span className="font-semibold">{quotedReply.fromName}</span>
                              <p className="truncate mt-0.5">{quotedReply.text}</p>
                            </div>
                          )}
                          <p className="text-sm whitespace-pre-line">{displayText}</p>
                          {bookingMatch && (() => {
                            const bCourtName = bookingMatch[1];
                            const bDate = bookingMatch[2];
                            const bTime = bookingMatch[3];
                            const matchedBooking = bookings.find(b => b.courtName === bCourtName && b.date === bDate && b.time === bTime && b.status === 'confirmed');
                            const isConfirmed = matchedBooking && currentUser ? confirmedBookings.has(`${matchedBooking.id}-${currentUser.id}`) : false;
                            return (
                              <div className="mt-2 flex flex-wrap gap-2">
                                <button
                                  onClick={() => downloadICS([{ title: `Tennis — ${bCourtName}`, date: bDate, time: bTime, duration: 60, location: `${bCourtName} — Mono Tennis Club` }], 'mtc-booking.ics')}
                                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                                  style={{ background: isMine ? 'rgba(255,255,255,0.15)' : 'rgba(107, 122, 61, 0.1)', color: isMine ? '#fff' : '#6b7a3d' }}
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  Add to Calendar
                                </button>
                                {!isMine && (
                                  <button
                                    onClick={() => confirmAttendance(bCourtName, bDate, bTime)}
                                    disabled={isConfirmed}
                                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                                    style={{ background: isConfirmed ? 'rgba(107,122,61,0.15)' : (isMine ? 'rgba(255,255,255,0.15)' : 'rgba(107, 122, 61, 0.1)'), color: isMine ? '#fff' : '#6b7a3d' }}
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    {isConfirmed ? 'Confirmed' : 'Confirm Attendance'}
                                  </button>
                                )}
                              </div>
                            );
                          })()}
                          {/* Timestamp + read receipt — click to show full date */}
                          <div className="flex items-center gap-1 mt-1 group/ts cursor-default">
                            <p className="text-[0.6rem] opacity-60">
                              <span className="group-hover/ts:hidden">{new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                              <span className="hidden group-hover/ts:inline">{new Date(msg.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                            </p>
                            {isMine && (
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: msg.read ? 0.8 : 0.4 }}>
                                <polyline points="20 6 9 17 4 12" />
                                {msg.read && <polyline points="15 6 4 17" style={{ opacity: 0.6 }} />}
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {/* Typing indicator */}
                  {selectedConvo && typingUsers[selectedConvo] && (
                    <div className="flex justify-start animate-fadeIn">
                      <div className="rounded-2xl px-4 py-2.5" style={{ background: '#f5f2eb', borderBottomLeftRadius: 4 }}>
                        <div className="flex gap-1 items-center h-5">
                          <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#6b7a3d', animationDelay: '0ms' }} />
                          <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#6b7a3d', animationDelay: '150ms' }} />
                          <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#6b7a3d', animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply-to preview + Input */}
                <div className="p-3 sm:p-4 border-t" style={{ borderColor: '#f0ede6' }}>
                  {replyTo && (
                    <div className="mb-2 px-3 py-2 rounded-lg flex items-center gap-2 text-xs border-l-2" style={{ background: 'rgba(107,122,61,0.05)', borderColor: '#6b7a3d' }}>
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="#6b7a3d" viewBox="0 0 24 24" strokeWidth="2">
                        <polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 00-4-4H4" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold" style={{ color: '#6b7a3d' }}>{replyTo.fromName}</span>
                        <p className="truncate" style={{ color: '#6b7266' }}>{replyTo.text.slice(0, 80)}</p>
                      </div>
                      <button onClick={() => setReplyTo(null)} className="shrink-0 p-1 rounded hover:bg-black/5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="#999" viewBox="0 0 24 24" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => { setMessageText(e.target.value); if (selectedConvo) broadcastTyping(selectedConvo); }}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message..."
                      aria-label="Type a message"
                      maxLength={500}
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#6b7a3d]/20 transition-shadow"
                      style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!messageText.trim() || sending}
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
