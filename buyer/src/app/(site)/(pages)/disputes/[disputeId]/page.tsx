'use client';
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DisputeChat from '@/components/Disputes/DisputeChat';
import { useParams } from 'next/navigation';
import PageContainer from '@/components/Common/PageContainer';

// Minimal Dispute Detail Page to host the Chat
import ProtectedRoute from "@/components/Common/ProtectedRoute";

const DisputeDetailPage = () => {
    const params = useParams();
    const disputeId = params.disputeId as string;

    return (
        <ProtectedRoute
            requireAuth={true}
            redirectMessage="You must be signed in to view dispute details."
            redirectButtonText="Sign In to View"
        >
            <PageContainer>
                <div className="pt-20 pb-12">
                    <div className="max-w-4xl mx-auto">
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-gray-900">Dispute Details</h1>
                            <p className="text-gray-600">ID: {disputeId}</p>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                            <DisputeChat disputeId={disputeId} />
                        </div>
                    </div>
                </div>
            </PageContainer>
        </ProtectedRoute>
    );
};

export default DisputeDetailPage;
