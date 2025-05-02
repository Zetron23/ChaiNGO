    // app/donor/dashboard/page.tsx
    "use client";

    import React, { useState, useEffect } from 'react';
    import Link from 'next/link';
    import { Button } from '@/components/ui/button';
    import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
    import { toast } from "sonner";
    import { Loader2, User, Wallet, CalendarDays, HandHeart, Target } from 'lucide-react'; // Added icons

    // Interface for Donor Profile Data
    interface DonorProfile {
        _id: string;
        email: string;
        role: string;
        walletAddress?: string;
        createdAt: string;
    }

    // Interface for Donation Summary (placeholders for now)
    interface DonationSummary {
        totalDonated: number; // This is placeholder ETH amount from backend
        projectsSupported: number;
    }

    // Interface for the combined API response
    interface DonorDataResponse {
        profile: DonorProfile;
        summary: DonationSummary;
    }

    // --- Placeholder Conversion Rate ---
    const ETH_TO_USD_RATE = 100000; // Based on 0.0001 ETH = $10 USD
    // ---

    // Helper function to get auth token
    const getAuthToken = (): string | null => {
        if (typeof window !== 'undefined') return localStorage.getItem('authToken');
        return null;
    };

    export default function DonorDashboardPage() {
        const [profile, setProfile] = useState<DonorProfile | null>(null);
        const [summary, setSummary] = useState<DonationSummary | null>(null);
        const [isLoading, setIsLoading] = useState<boolean>(true);
        const [error, setError] = useState<string | null>(null);

        useEffect(() => {
            const fetchDonorData = async () => {
                setIsLoading(true);
                setError(null);
                const token = getAuthToken();

                if (!token) {
                    setError("Authentication required. Please log in.");
                    setIsLoading(false);
                    // Optionally redirect to login
                    // router.push('/login/Donor');
                    return;
                }

                try {
                    // Fetch donor profile and summary data
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/donor/profile`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    });
                    if (!response.ok) {
                        const errData = await response.json();
                        throw new Error(errData.message || `Failed to fetch donor data (${response.status})`);
                    }
                    const data: DonorDataResponse = await response.json();
                    setProfile(data.profile);
                    setSummary(data.summary);
                } catch (err) {
                    console.error("Fetch donor data error:", err);
                    const msg = err instanceof Error ? err.message : "An unknown error occurred.";
                    setError(msg);
                    toast.error("Failed to Load Dashboard Data", { description: msg });
                } finally {
                    setIsLoading(false);
                }
            };
            fetchDonorData();
        }, []); // Empty dependency array ensures this runs once on mount

        // Loading state display
        if (isLoading) return <div className="flex justify-center items-center py-20"><Loader2 className="h-10 w-10 animate-spin text-slate-500" /><p className="ml-3 text-slate-500">Loading Dashboard...</p></div>;
        // Error state display
        if (error) return <div className="container mx-auto p-8 text-center text-red-600">Error: {error}</div>;

        // Calculate placeholder USD value for summary
        const totalDonatedUSD = summary ? (summary.totalDonated * ETH_TO_USD_RATE).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '$0.00';

        // Main dashboard content
        return (
            // Container and padding provided by the layout
            <div className="container mx-auto p-4 md:p-8 space-y-8">
                {/* Welcome Message */}
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
                    Welcome, Donor!
                </h1>

                {/* Profile & Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Profile Card */}
                    <Card className="md:col-span-2 shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><User className="w-5 h-5" /> Your Profile</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            {profile ? (
                                <>
                                    <p><strong>Email:</strong> {profile.email}</p>
                                    {profile.walletAddress && (
                                        <p><strong>Wallet:</strong> <span className="font-mono break-all">{profile.walletAddress}</span></p>
                                    )}
                                    <p className="text-muted-foreground flex items-center"><CalendarDays className="mr-2 h-4 w-4"/> <strong>Member Since:</strong> {new Date(profile.createdAt).toLocaleDateString()}</p>
                                </>
                            ) : (
                                <p className="text-muted-foreground">Could not load profile details.</p>
                            )}
                        </CardContent>
                        {/* Optional Footer for Edit Profile link later */}
                        {/* <CardFooter><Button variant="outline" size="sm">Edit Profile</Button></CardFooter> */}
                    </Card>

                    {/* Donation Summary Card */}
                    <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><HandHeart className="w-5 h-5" /> Donation Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {summary ? (
                                <>
                                    <div className="text-center">
                                        {/* --- UPDATED Display --- */}
                                        <p className="text-3xl font-bold">{totalDonatedUSD}</p>
                                        <p className="text-sm text-muted-foreground">Total Donated (Approx.)</p>
                                        {/* --- End Update --- */}
                                    </div>
                                    <div className="text-center">
                                        <p className="text-3xl font-bold">{summary.projectsSupported}</p>
                                        <p className="text-sm text-muted-foreground">Projects Supported</p>
                                    </div>
                                </>
                            ) : (
                                <p className="text-muted-foreground text-center">Summary data unavailable.</p>
                            )}
                        </CardContent>
                        {/* Optional Footer for Donation History link later */}
                        {/* <CardFooter><Button variant="outline" size="sm">View History</Button></CardFooter> */}
                    </Card>
                </div>

                {/* Call to Action */}
                <Card className="shadow-md bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
                    <CardHeader>
                        <CardTitle>Ready to Make an Impact?</CardTitle>
                        <CardDescription>Explore active projects seeking funding and help support meaningful causes.</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Link href="/donor/explore">
                            <Button size="lg">Explore Projects Now</Button>
                        </Link>
                    </CardFooter>
                </Card>

            </div>
        );
    }
    