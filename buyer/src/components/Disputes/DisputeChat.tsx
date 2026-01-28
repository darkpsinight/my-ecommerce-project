import React, { useState, useEffect, useRef } from 'react';
import { disputesApi, DisputeMessage } from '@/services/disputes';
import { useSelector } from 'react-redux';
// @ts-ignore
import { RootState } from '@/redux/store';

interface DisputeChatProps {
    disputeId: string;
}

const DisputeChat: React.FC<DisputeChatProps> = ({ disputeId }) => {
    const [messages, setMessages] = useState<DisputeMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const user = useSelector((state: RootState) => state.userInfoReducer.info);

    const fetchMessages = async () => {
        try {
            setError(null);
            const response = await disputesApi.getMessages(disputeId);
            if (response.success) {
                setMessages(response.data);
            }
        } catch (err: any) {
            console.error('Failed to fetch messages:', err);
            setError('Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
        // Poll every 10 seconds for new messages since we don't have websockets
        const intervalId = setInterval(fetchMessages, 10000);
        return () => clearInterval(intervalId);
    }, [disputeId]);

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setSending(true);
        try {
            const response = await disputesApi.postMessage(disputeId, newMessage);
            if (response.success) {
                setNewMessage('');
                // Optimistically add message or re-fetch
                setMessages(prev => [...prev, response.data]);
            }
        } catch (err: any) {
            console.error('Failed to send message:', err);
            alert('Failed to send message. Please try again.');
        } finally {
            setSending(false);
        }
    };

    if (loading) return <div className="p-4 text-center">Loading chat...</div>;

    return (
        <div className="flex flex-col h-[600px] border border-gray-200 rounded-lg bg-white shadow-sm">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-800">Dispute Conversation</h3>
                <p className="text-sm text-gray-500">Messages are final and cannot be deleted.</p>
            </div>

            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" style={{ maxHeight: '500px', minHeight: '400px' }}>
                {error && <div className="text-red-500 text-center">{error}</div>}

                {messages.length === 0 && !error && (
                    <div className="text-center text-gray-400 py-10">
                        No messages yet. Start the conversation.
                    </div>
                )}

                {messages.map((msg) => {
                    const isMe = msg.senderId === user?.uid;
                    const isAdmin = msg.senderRole === 'ADMIN';

                    return (
                        <div key={msg._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[80%] rounded-lg p-3 ${isMe
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : isAdmin
                                    ? 'bg-purple-100 border border-purple-200 text-purple-900 rounded-bl-none'
                                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                                }`}>
                                <div className="flex justify-between items-center mb-1 gap-4">
                                    <span className={`text-xs font-bold ${isMe ? 'text-blue-100' : 'text-gray-500'}`}>
                                        {isAdmin ? 'CodeSale Support' : (isMe ? 'You' : msg.senderRole)}
                                    </span>
                                    <span className={`text-xs ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                        {new Date(msg.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                <p className="whitespace-pre-wrap text-sm">{msg.messageBody}</p>
                            </div>
                        </div>
                    );
                })}

            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-gray-200 bg-white">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={2000}
                        disabled={sending}
                    />
                    <button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        className={`px-6 py-2 rounded-lg font-medium text-white transition-colors ${sending || !newMessage.trim()
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        {sending ? 'Sending...' : 'Send'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default DisputeChat;
