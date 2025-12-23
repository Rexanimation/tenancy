import React from 'react';
import { Navigate } from 'react-router-dom';
import useTenancy from '../hooks/useTenancy';

interface ProtectedRouteProps {
    children: React.ReactElement;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { currentUser, loading } = useTenancy();

    if (loading) return null; // Or a spinner

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    // Tenant Approval Guard
    if (currentUser.role === 'renter' && currentUser.status !== 'approved') {
        // If the status is rejected, we might want to show that specifically, 
        // but user asked for "pending-approval" page. 
        // We can handle both in the pending page or separate routes.
        // For now, redirect to pending which seems to be the user's focus.
        return <Navigate to="/pending-approval" replace />;
    }

    // Also handle rejected specifically if needed, but for now map non-approved renters here
    if (currentUser.role === 'renter' && currentUser.status === 'rejected') {
        return <Navigate to="/pending-approval" replace />;
    }


    return children;
}
