"use client";
import React, { useState, useEffect, useRef } from "react";
import { ordersApi, OrderMessage } from "@/services/orders";
import { format } from "date-fns";

interface OrderChatProps {
    orderId: string; // externalId
    currentUserId?: string; // To better identify "Me" vs "Them" if needed, though role is usually enough
    currentUserRole?: 'buyer' | 'seller';
}

const OrderChat: React.FC<OrderChatProps> = ({ orderId, currentUserId, currentUserRole }) => {
    const [messages, setMessages] = useState<OrderMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isDisputed, setIsDisputed] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchMessages = async () => {
        try {
            const response = await ordersApi.getOrderMessages(orderId);
            if (response.success) {
                setMessages(response.data.messages);
                setIsDisputed(response.data.isDisputed);
            }
        } catch (err: any) {
            console.error("Failed to fetch messages", err);
            // Don't set global error on poll failure to avoid UI flicker, just log
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        // Initial fetch
        setIsLoading(true);
        fetchMessages().finally(() => {
            setIsLoading(false);
            // Scroll to bottom on initial load
            setTimeout(scrollToBottom, 100);
        });

        // POLLING: Fetch every 10 seconds
        intervalRef.current = setInterval(fetchMessages, 10000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [orderId]);

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages.length]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        if (isDisputed) {
            setError("Chat is read-only because the order is in dispute.");
            return;
        }

        setIsSending(true);
        setError(null);

        try {
            const response = await ordersApi.postOrderMessage(orderId, newMessage);
            if (response.success) {
                setMessages((prev) => [...prev, response.data]);
                setNewMessage("");
                scrollToBottom();
            }
        } catch (err: any) {
            console.error("Failed to send message", err);
            setError(err.response?.data?.error || "Failed to send message");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 mt-6 shadow-sm overflow-hidden flex flex-col h-[500px]">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    Order Chat
                </h3>
                {isDisputed && (
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full border border-red-200">
                        Read Only (Disputed)
                    </span>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" ref={chatContainerRef}>
                {isLoading && messages.length === 0 ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-10">
                        <p>No messages yet.</p>
                        {!isDisputed && <p className="text-sm">Start the conversation with the seller.</p>}
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMe = currentUserRole // If role provided, use it
                            ? msg.senderRole === currentUserRole
                            : msg.senderUserId === currentUserId; // Fallback to ID check if implemented

                        // Fallback for visual testing if role not perfectly propagated (assume Buyer context for now)
                        // In Buyer App, "Me" is Buyer.
                        const isMyMessage = msg.senderRole === 'buyer';

                        return (
                            <div
                                key={msg._id || idx}
                                className={`flex flex-col ${isMyMessage ? "items-end" : "items-start"}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${isMyMessage
                                            ? "bg-blue text-white rounded-tr-none"
                                            : "bg-white text-gray-800 border border-gray-200 rounded-tl-none"
                                        }`}
                                >
                                    <p className="whitespace-pre-wrap break-words">{msg.messageText}</p>
                                </div>
                                <div className="flex items-center gap-2 mt-1 px-1">
                                    <span className="text-[10px] text-gray-400 font-medium">
                                        {isMyMessage ? "You" : "Seller"}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                        {msg.createdAt ? format(new Date(msg.createdAt), "MMM d, h:mm a") : "Just now"}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="relative">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={isDisputed ? "Chat is disabled due to dispute" : "Type a message..."}
                            disabled={isSending || isDisputed}
                            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue/50 disabled:bg-gray-100 disabled:text-gray-400 transition-all text-sm"
                            maxLength={2000}
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || isSending || isDisputed}
                            className={`px-5 py-2.5 rounded-lg flex items-center justify-center transition-all font-medium text-sm ${!newMessage.trim() || isSending || isDisputed
                                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    : "bg-blue text-white hover:bg-blue-dark shadow-sm hover:shadow"
                                }`}
                        >
                            {isSending ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            )}
                        </button>
                    </div>
                    {error && (
                        <p className="text-red-500 text-xs mt-2 absolute bottom-[-20px] left-1">
                            {error}
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
};

export default OrderChat;
