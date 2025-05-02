// my-next-app/app/admin/dashboard/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
// Import necessary UI components used in the main content
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Interfaces remain the same
interface PendingNgo { _id: string; email: string; createdAt: string; walletAddress?: string; documentUrl?: string; }
interface PendingMilestone { projectId: string; projectName: string; ngoId: string; ngoName: string; milestoneId: string; milestoneDescription: string; milestoneSubmittedAt?: string; }

// Helper function to get token
const getAuthToken = (): string | null => {
    if (typeof window !== 'undefined') return localStorage.getItem('authToken');
    return null;
};

export default function AdminDashboardPage() {
    // State hooks remain the same
    const [pendingNgos, setPendingNgos] = useState<PendingNgo[]>([]);
    const [isLoadingNgos, setIsLoadingNgos] = useState<boolean>(true);
    const [updatingNgoId, setUpdatingNgoId] = useState<string | null>(null);
    const [pendingMilestones, setPendingMilestones] = useState<PendingMilestone[]>([]);
    const [isLoadingMilestones, setIsLoadingMilestones] = useState<boolean>(true);
    const [updatingMilestoneId, setUpdatingMilestoneId] = useState<string | null>(null); // Corrected state name
    const [error, setError] = useState<string | null>(null);

    // useEffect hook for fetching NGOs with added logging
    useEffect(() => {
        const fetchPendingNgos = async () => {
            console.log("ADMIN DASHBOARD: Fetching NGOs - useEffect started."); // <-- ADDED LOG
            setIsLoadingNgos(true);
            setError(null);
            const token = getAuthToken();
            console.log("ADMIN DASHBOARD: Token found in localStorage?", token ? `Yes (starts with ${token.substring(0, 10)}...)` : 'No'); // <-- ADDED LOG

            if (!token) {
                console.log("ADMIN DASHBOARD: No token found, exiting fetch."); // <-- ADDED LOG
                setError("Authentication required. Please log in as Admin.");
                setIsLoadingNgos(false);
                return;
            }

            try {
                 console.log("ADMIN DASHBOARD: Attempting fetch to /api/admin/pending-ngos"); // <-- ADDED LOG
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/pending-ngos`, {
                    headers: {'Authorization': `Bearer ${token}`}
                });
                console.log("ADMIN DASHBOARD: Fetch response status:", response.status); // <-- ADDED LOG

                if (!response.ok) {
                    const d = await response.json();
                    throw new Error(d.message || `Failed to fetch NGOs (${response.status})`);
                }
                const data: PendingNgo[] = await response.json();
                console.log("ADMIN DASHBOARD: NGOs fetched successfully:", data); // <-- ADDED LOG
                setPendingNgos(data);
            } catch (err) {
                console.error("ADMIN DASHBOARD: Fetch NGOs error:", err); // <-- ADDED LOG (Changed from console.error)
                setError(err instanceof Error ? err.message : "Error loading NGOs.");
                toast.error("Failed to Load NGOs", { description: err instanceof Error ? err.message : undefined });
            } finally {
                setIsLoadingNgos(false);
            }
        };
        fetchPendingNgos();
    }, []); // Empty dependency array

    // useEffect hook for fetching Milestones (logging can be added similarly if needed)
    useEffect(() => {
        const fetchPendingMilestones = async () => {
            setIsLoadingMilestones(true); setError(null); const token = getAuthToken(); if (!token) { setError("Authentication required."); setIsLoadingMilestones(false); return; }
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/pending-milestones`, { headers: {'Authorization': `Bearer ${token}`} });
                if (!response.ok) { const d = await response.json(); throw new Error(d.message || `Failed to fetch milestones (${response.status})`); }
                const data: PendingMilestone[] = await response.json(); setPendingMilestones(data);
            } catch (err) { console.error("Fetch Milestones error:", err); setError(err instanceof Error ? err.message : "Error loading milestones."); toast.error("Failed to Load Milestones", { description: err instanceof Error ? err.message : undefined }); }
            finally { setIsLoadingMilestones(false); }
        };
        fetchPendingMilestones();
    }, []);

    // Handler functions remain the same
    const handleNgoVerification = async (ngoId: string, status: 'approved' | 'rejected') => {
        setUpdatingNgoId(ngoId); const token = getAuthToken(); if (!token) { toast.error("Auth Error"); setUpdatingNgoId(null); return; }
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/verify-ngo/${ngoId}`, { method: 'PUT', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify({ status }) });
            const data = await response.json(); if (!response.ok) throw new Error(data.message || `Failed to update (${response.status})`);
            toast.success(`NGO ${status} Successfully!`); setPendingNgos(prev => prev.filter(ngo => ngo._id !== ngoId));
        } catch (err) { console.error(`Error ${status} NGO:`, err); toast.error(`Failed to ${status} NGO`, { description: err instanceof Error ? err.message : undefined }); }
        finally { setUpdatingNgoId(null); }
    };

    const handleMilestoneVerification = async (projectId: string, milestoneId: string, status: 'verified' | 'rejected') => {
         setUpdatingMilestoneId(milestoneId); // Set loading state early
         const token = getAuthToken();
         if (!token) {
             toast.error("Auth Error");
             setUpdatingMilestoneId(null); // Reset loading state on auth error
             return;
         }

         let adminNotes: string | undefined = undefined;

         if (status === 'rejected') {
             const reason = prompt("Reason for rejecting milestone:");
             if (reason === null) { // User cancelled prompt
                 setUpdatingMilestoneId(null); // Reset loading state if user cancels
                 return;
             }
             if (!reason.trim()) { // User entered empty or whitespace
                 toast.warning("Rejection reason required.");
                 setUpdatingMilestoneId(null); // Reset loading state if reason is invalid
                 return;
             }
             adminNotes = reason; // Assign valid reason
         }

         try {
             // Construct request body
             const requestBody: { status: 'verified' | 'rejected'; adminNotes?: string } = { status };
             if (adminNotes) { // Only add adminNotes if it's a valid string (i.e., status was 'rejected' and reason provided)
                 requestBody.adminNotes = adminNotes;
             }

             const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/verify-milestone/${projectId}/${milestoneId}`, {
                 method: 'PUT',
                 headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                 body: JSON.stringify(requestBody)
             });

             const data = await response.json();
             if (!response.ok) throw new Error(data.message || `Failed to update (${response.status})`);

             toast.success(`Milestone ${status} Successfully!`);
             setPendingMilestones(prev => prev.filter(m => m.milestoneId !== milestoneId));
         } catch (err) {
             console.error(`Error ${status} milestone:`, err);
             toast.error(`Failed to ${status} Milestone`, { description: err instanceof Error ? err.message : undefined });
         } finally {
             setUpdatingMilestoneId(null); // Reset loading state in finally block
         }
    };

    // --- RENDER LOGIC (Removed Header and Footer) ---
    return (
        // Container and padding provided by the layout now
        <div className="container mx-auto p-4 md:p-8">
             <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-6">Admin Dashboard</h1>

             {/* Tabs component remains the same */}
             <Tabs defaultValue="ngo-verification" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="ngo-verification">NGO Verification</TabsTrigger>
                    <TabsTrigger value="milestone-verification">Milestone Verification</TabsTrigger>
                </TabsList>

                {/* NGO Verification Tab Content */}
                <TabsContent value="ngo-verification">
                     <h2 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-300">Pending NGO Verifications</h2>
                     {isLoadingNgos && ( <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-slate-500" /><p className="ml-3 text-slate-500">Loading NGOs...</p></div> )}
                     {/* Display error if there is one */}
                     {error && !isLoadingNgos && ( <div className="text-center py-10 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-md"><p><strong>Error:</strong> {error}</p></div> )}
                     {/* Display empty state only if no error and not loading */}
                     {!isLoadingNgos && !error && pendingNgos.length === 0 && ( <div className="text-center py-10 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 p-4 rounded-md"><p>No NGOs pending verification.</p></div> )}
                     {/* Display NGO list */}
                     {!isLoadingNgos && !error && pendingNgos.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {pendingNgos.map((ngo) => (
                                <Card key={ngo._id} className="flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow duration-300">
                                    <CardHeader>
                                        <CardTitle className="text-base font-medium truncate">{ngo.email}</CardTitle>
                                        <CardDescription>Registered: {new Date(ngo.createdAt).toLocaleDateString()}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm flex-grow">
                                        {ngo.walletAddress && (<p><Badge variant="secondary">Wallet:</Badge> {ngo.walletAddress.substring(0, 6)}...{ngo.walletAddress.substring(ngo.walletAddress.length - 4)}</p>)}
                                        {ngo.documentUrl && (<a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${ngo.documentUrl}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-blue-600 hover:underline"><ExternalLink className="ml-1 h-3 w-3" /> View Document</a>)}
                                        {!ngo.documentUrl && <p className="text-muted-foreground italic text-xs">No document.</p>}
                                    </CardContent>
                                    <CardFooter className="flex justify-end gap-2 border-t pt-4 mt-4">
                                        <Button size="sm" variant="destructive" onClick={() => handleNgoVerification(ngo._id, 'rejected')} disabled={updatingNgoId === ngo._id}>{updatingNgoId === ngo._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}<span className="ml-1 hidden sm:inline">Reject</span></Button>
                                        <Button size="sm" variant="default" onClick={() => handleNgoVerification(ngo._id, 'approved')} disabled={updatingNgoId === ngo._id}>{updatingNgoId === ngo._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}<span className="ml-1 hidden sm:inline">Approve</span></Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                     )}
                </TabsContent>

                {/* Milestone Verification Tab Content */}
                <TabsContent value="milestone-verification">
                     <h2 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-300">Pending Milestone Verifications</h2>
                     {isLoadingMilestones && ( <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-slate-500" /><p className="ml-3 text-slate-500">Loading Milestones...</p></div> )}
                      {/* Display error if there is one */}
                     {error && !isLoadingMilestones && ( <div className="text-center py-10 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-md"><p><strong>Error:</strong> {error}</p></div> )}
                     {/* Display empty state only if no error and not loading */}
                     {!isLoadingMilestones && !error && pendingMilestones.length === 0 && ( <div className="text-center py-10 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 p-4 rounded-md"><p>No milestones pending verification.</p></div> )}
                     {/* Display Milestone list */}
                     {!isLoadingMilestones && !error && pendingMilestones.length > 0 && (
                        <div className="space-y-4">
                            {pendingMilestones.map((milestone) => (
                                <Card key={milestone.milestoneId} className="shadow-md hover:shadow-lg transition-shadow duration-300">
                                    <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-semibold">{milestone.milestoneDescription}</p>
                                            <p className="text-xs text-muted-foreground"> Project: <span className="font-medium">{milestone.projectName}</span> | NGO: <span className="font-medium">{milestone.ngoName}</span> </p>
                                            <p className="text-xs text-muted-foreground"> Submitted: {milestone.milestoneSubmittedAt ? new Date(milestone.milestoneSubmittedAt).toLocaleString() : 'N/A'} </p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0 w-full md:w-auto justify-end">
                                            <Button size="sm" variant="destructive" onClick={() => handleMilestoneVerification(milestone.projectId, milestone.milestoneId, 'rejected')} disabled={updatingMilestoneId === milestone.milestoneId}> {updatingMilestoneId === milestone.milestoneId ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}<span className="ml-1 hidden sm:inline">Reject</span> </Button>
                                            <Button size="sm" variant="default" onClick={() => handleMilestoneVerification(milestone.projectId, milestone.milestoneId, 'verified')} disabled={updatingMilestoneId === milestone.milestoneId}> {updatingMilestoneId === milestone.milestoneId ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}<span className="ml-1 hidden sm:inline">Verify</span> </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                     )}
                </TabsContent>
             </Tabs>
        </div>
    );
    // --- END RENDER LOGIC ---
}
