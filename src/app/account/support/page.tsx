'use client';

import { useState, useEffect } from 'react';
import { Headphones, Plus, MessageSquare, Clock, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { EmptyState } from '@/components/account/EmptyState';
import { SkeletonCard } from '@/components/account/SkeletonLoader';

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
type TicketCategory = 'order' | 'payment' | 'delivery' | 'return' | 'product' | 'account' | 'general';

interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  category: TicketCategory;
  description: string;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
  order_id?: string;
}

interface Message {
  id: string;
  message: string;
  is_staff: boolean;
  created_at: string;
  sender: { full_name: string; avatar_url?: string };
}

const STATUS_CONFIG = {
  open: { label: 'Open', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: MessageSquare },
  in_progress: { label: 'In Progress', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', icon: Loader2 },
  resolved: { label: 'Resolved', color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: CheckCircle },
  closed: { label: 'Closed', color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200', icon: XCircle },
};

const CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: 'order', label: 'Order Issue' },
  { value: 'payment', label: 'Payment Issue' },
  { value: 'delivery', label: 'Delivery Issue' },
  { value: 'return', label: 'Return/Refund' },
  { value: 'product', label: 'Product Issue' },
  { value: 'account', label: 'Account Issue' },
  { value: 'general', label: 'General Enquiry' },
];

function timeAgo(str: string) {
  const diff = Date.now() - new Date(str).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function SupportPage() {
  const { user, profile } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    subject: '', category: 'general' as TicketCategory, description: '', order_id: ''
  });

  const supabase = createClient();

  useEffect(() => { if (user) fetchTickets(); }, [user]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      setTickets((data || []) as SupportTicket[]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (ticketId: string) => {
    const { data } = await supabase
      .from('support_messages')
      .select('id, message, is_staff, created_at, sender:users(full_name, avatar_url)')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    setMessages((data || []) as unknown as Message[]);
  };

  const openTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    await fetchMessages(ticket.id);
  };

  const handleSubmitTicket = async () => {
    if (!form.subject.trim() || !form.description.trim()) return;
    try {
      setSubmitting(true);
      const { data, error } = await supabase.from('support_tickets').insert({
        user_id: user!.id,
        subject: form.subject.trim(),
        category: form.category,
        description: form.description.trim(),
        order_id: form.order_id.trim() || null,
        status: 'open',
      }).select().single();

      if (error) throw error;

      // Insert initial message
      await supabase.from('support_messages').insert({
        ticket_id: data.id,
        sender_id: user!.id,
        message: form.description.trim(),
        is_staff: false,
      });

      setForm({ subject: '', category: 'general', description: '', order_id: '' });
      setShowForm(false);
      fetchTickets();
    } catch {
      alert('Failed to create ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    try {
      setSending(true);
      await supabase.from('support_messages').insert({
        ticket_id: selectedTicket.id,
        sender_id: user!.id,
        message: replyText.trim(),
        is_staff: false,
      });
      await supabase.from('support_tickets').update({ updated_at: new Date().toISOString() }).eq('id', selectedTicket.id);
      setReplyText('');
      fetchMessages(selectedTicket.id);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Help & Support</h1>
          <p className="text-sm text-gray-400 mt-0.5">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setSelectedTicket(null); }}
          className="flex items-center gap-2 bg-[#FF6B00] hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Ticket
        </button>
      </div>

      {/* Ticket Detail View */}
      {selectedTicket ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <button onClick={() => setSelectedTicket(null)} className="text-xs text-[#FF6B00] font-bold hover:underline mb-1 block">← Back to tickets</button>
              <h2 className="font-extrabold text-gray-900">{selectedTicket.subject}</h2>
              <p className="text-xs text-gray-400 mt-0.5">#{selectedTicket.ticket_number} · {timeAgo(selectedTicket.created_at)}</p>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_CONFIG[selectedTicket.status]?.bg} ${STATUS_CONFIG[selectedTicket.status]?.color}`}>
              {STATUS_CONFIG[selectedTicket.status]?.label}
            </span>
          </div>

          {/* Messages */}
          <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.is_staff ? '' : 'flex-row-reverse'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${msg.is_staff ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-[#FF6B00]'}`}>
                  {msg.is_staff ? 'S' : (profile?.full_name?.[0] || 'U')}
                </div>
                <div className={`max-w-[75%] rounded-2xl p-3 ${msg.is_staff ? 'bg-blue-50' : 'bg-orange-50'}`}>
                  <p className="text-sm text-gray-800 leading-relaxed">{msg.message}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{timeAgo(msg.created_at)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Reply Box */}
          {selectedTicket.status !== 'closed' && (
            <div className="p-4 border-t border-gray-100 flex gap-3">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your reply..."
                rows={2}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-[#FF6B00]"
              />
              <button
                onClick={handleReply}
                disabled={!replyText.trim() || sending}
                className="bg-[#FF6B00] hover:bg-orange-600 text-white font-bold px-4 rounded-xl text-sm transition-colors disabled:opacity-40"
              >
                {sending ? '...' : 'Send'}
              </button>
            </div>
          )}
        </div>
      ) : showForm ? (
        /* New Ticket Form */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-extrabold text-gray-900">Create Support Ticket</h2>

          <div>
            <label className="text-xs font-bold text-gray-700 mb-1 block">Category</label>
            <select
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#FF6B00]"
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as TicketCategory }))}
            >
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 mb-1 block">Subject *</label>
            <input
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#FF6B00]"
              value={form.subject}
              onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
              placeholder="Brief description of your issue"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 mb-1 block">Order ID (optional)</label>
            <input
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#FF6B00]"
              value={form.order_id}
              onChange={(e) => setForm((p) => ({ ...p, order_id: e.target.value }))}
              placeholder="e.g. ORD-12345"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 mb-1 block">Description *</label>
            <textarea
              rows={5}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#FF6B00] resize-none"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Describe your issue in detail..."
            />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-700 font-bold py-3 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
            <button
              onClick={handleSubmitTicket}
              disabled={submitting || !form.subject.trim() || !form.description.trim()}
              className="flex-1 bg-[#FF6B00] hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </div>
      ) : (
        /* Tickets List */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-5 space-y-3">{[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}</div>
          ) : tickets.length === 0 ? (
            <EmptyState
              icon={Headphones}
              title="No support tickets"
              description="Have an issue? Create a ticket and our team will help you out."
              actionLabel="Create Ticket"
              onAction={() => setShowForm(true)}
            />
          ) : (
            <div className="divide-y divide-gray-50">
              {tickets.map((ticket) => {
                const config = STATUS_CONFIG[ticket.status];
                const Icon = config?.icon || MessageSquare;
                return (
                  <button
                    key={ticket.id}
                    onClick={() => openTicket(ticket)}
                    className="w-full text-left p-5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm">{ticket.subject}</p>
                        <p className="text-xs text-gray-400 mt-0.5">#{ticket.ticket_number} · {CATEGORIES.find((c) => c.value === ticket.category)?.label}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{ticket.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${config?.bg} ${config?.color}`}>
                          {ticket.status === 'in_progress' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
                          {config?.label}
                        </span>
                        <p className="text-[11px] text-gray-400">{timeAgo(ticket.created_at)}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
