    // my-next-app/app/ngo/dashboard/page.tsx
    "use client";

    import React, { useState, useEffect } from 'react';
    import Link from 'next/link';
    import Image from 'next/image';
    import { Button } from '@/components/ui/button';
    import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
    import { Badge } from "@/components/ui/badge";
    import { toast } from "sonner";
    import { Loader2, PlusCircle, Building, Mail, Wallet, FileText, CheckCircle, AlertTriangle, XCircle, Edit } from 'lucide-react';
    // Removed ThemeToggle, LogOut as they are in layout

    // Interfaces remain the same
    interface NgoDetails { _id: string; email: string; role: string; walletAddress?: string; verificationStatus: 'pending' | 'approved' | 'rejected' | 'not_required'; createdAt: string; documentUrl?: string; ngoName?: string; ngoDescription?: string; ngoLogoUrl?: string; }
    interface Project { _id: string; name: string; description: string; fundingRequired: number; fundingRaised: number; status: 'draft' | 'active' | 'completed' | 'cancelled'; createdAt: string; }

    // --- Placeholder Conversion Rate ---
    const ETH_TO_USD_RATE = 100000; // Based on 0.0001 ETH = $10 USD
    // ---

    const getAuthToken = (): string | null => { /* ... */ if (typeof window !== 'undefined') return localStorage.getItem('authToken'); return null; };
    // Removed handleLogout

    export default function NgoDashboardPage() {
        const [ngoDetails, setNgoDetails] = useState<NgoDetails | null>(null);
        const [projects, setProjects] = useState<Project[]>([]);
        const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(true);
        const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(true);
        const [error, setError] = useState<string | null>(null);

        // Fetch NGO Details and Projects
        useEffect(() => {
            const fetchData = async () => {
                setIsLoadingDetails(true); setIsLoadingProjects(true); setError(null);
                const token = getAuthToken();
                if (!token) { setError("Authentication required."); setIsLoadingDetails(false); setIsLoadingProjects(false); return; }
                try {
                    const detailsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/ngo/profile`, { headers: { 'Authorization': `Bearer ${token}` } });
                    if (!detailsResponse.ok) { const errData = await detailsResponse.json(); throw new Error(errData.message || `Failed to fetch NGO details (${detailsResponse.status})`); }
                    const detailsData: NgoDetails = await detailsResponse.json(); setNgoDetails(detailsData); setIsLoadingDetails(false);
                    if (detailsData.verificationStatus === 'approved') {
                        const projectsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/projects/my-projects`, { headers: { 'Authorization': `Bearer ${token}` } });
                        if (!projectsResponse.ok) { const errData = await projectsResponse.json(); throw new Error(errData.message || `Failed to fetch projects (${projectsResponse.status})`); }
                        const projectsData: Project[] = await projectsResponse.json(); setProjects(projectsData);
                    } else { setProjects([]); }
                } catch (err) { console.error("Fetch NGO data error:", err); const msg = err instanceof Error ? err.message : "An unknown error occurred."; setError(msg); toast.error("Failed to Load Data", { description: msg });
                } finally { setIsLoadingDetails(false); setIsLoadingProjects(false); }
            };
            fetchData();
        }, []);

        // Helper function to render status badge
        const getStatusBadge = (status: NgoDetails['verificationStatus']) => {
            switch (status) {
                case 'approved': return <Badge variant="default" className="bg-green-500 hover:bg-green-600"><CheckCircle className="mr-1 h-3 w-3" />Approved</Badge>;
                case 'pending': return <Badge variant="secondary"><AlertTriangle className="mr-1 h-3 w-3 text-yellow-500" />Pending Approval</Badge>;
                case 'rejected': return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>;
                default: return <Badge variant="outline">Unknown</Badge>;
            }
         };

        const defaultLogo = 'https://placehold.co/100x100/e2e8f0/64748b?text=Logo'; // Placeholder

        // Render logic (refactored to use layout)
        return (
            // Container and padding provided by the layout
            <div className="container mx-auto p-4 md:p-8">
                {isLoadingDetails && ( <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-slate-500" /><p className="ml-3 text-slate-500">Loading Details...</p></div> )}
                {error && ( <div className="text-center py-10 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-md"><p><strong>Error:</strong> {error}</p></div> )}

                {/* NGO Details Section */}
                {!isLoadingDetails && ngoDetails && (
                    <Card className="mb-8 shadow-md overflow-hidden">
                       <CardHeader className="flex flex-row items-start justify-between space-x-4 bg-slate-50 dark:bg-slate-900/50 p-4 md:p-6">
                            <div className="flex items-center space-x-4">
                                <Image src={ngoDetails.ngoLogoUrl ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${ngoDetails.ngoLogoUrl}` : defaultLogo} alt={ngoDetails.ngoName || 'NGO Logo'} width={80} height={80} className="rounded-md border bg-white dark:bg-slate-800 object-cover" priority />
                                <div> <CardTitle className="text-xl md:text-2xl">{ngoDetails.ngoName || <span className="italic text-muted-foreground">Name not set</span>}</CardTitle> <CardDescription className="mt-1">{getStatusBadge(ngoDetails.verificationStatus)}</CardDescription> </div>
                            </div>
                            <Link href="/ngo/dashboard/edit-profile"> <Button variant="outline" size="sm"><Edit className="mr-1 h-3 w-3" /> Edit Profile</Button> </Link>
                        </CardHeader>
                        <CardContent className="p-4 md:p-6 space-y-3 text-sm">
                            <p className="text-muted-foreground">{ngoDetails.ngoDescription || <span className="italic">No description provided.</span>}</p>
                            <hr className="my-3 dark:border-slate-800" />
                            <p className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" /> {ngoDetails.email}</p>
                            {ngoDetails.walletAddress && (<p className="flex items-center"><Wallet className="mr-2 h-4 w-4 text-muted-foreground" /> {ngoDetails.walletAddress}</p>)}
                            {ngoDetails.documentUrl && (<a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${ngoDetails.documentUrl}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-blue-600 hover:underline"><FileText className="mr-2 h-4 w-4" /> View Verification Document</a>)}
                            {ngoDetails.verificationStatus === 'pending' && <p className="text-yellow-600 dark:text-yellow-400 text-xs">Account pending approval.</p>}
                            {ngoDetails.verificationStatus === 'rejected' && <p className="text-red-600 dark:text-red-400 text-xs">Account verification rejected.</p>}
                        </CardContent>
                    </Card>
                )}

                {/* Projects Section */}
                {!isLoadingDetails && ngoDetails?.verificationStatus === 'approved' && (
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4"> <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-300">Your Projects</h2> <Link href="/ngo/dashboard/create-project"> <Button><PlusCircle className="mr-2 h-4 w-4" /> Create New Project</Button> </Link> </div>
                        {/* Project List */}
                        {isLoadingProjects && ( <div className="flex justify-center items-center py-6"><Loader2 className="h-6 w-6 animate-spin text-slate-500" /><p className="ml-2 text-slate-500">Loading projects...</p></div> )}
                        {!isLoadingProjects && projects.length === 0 && ( <p className="text-center py-6 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 p-4 rounded-md">No projects created yet.</p> )}
                        {!isLoadingProjects && projects.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {projects.map(project => {
                                    // Calculate USD equivalents
                                    const raisedUSD = (project.fundingRaised * ETH_TO_USD_RATE).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
                                    const goalUSD = (project.fundingRequired * ETH_TO_USD_RATE).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
                                    return (
                                        <Link key={project._id} href={`/ngo/dashboard/project/${project._id}`} className="block hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
                                            <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300 border dark:border-slate-800">
                                                <CardHeader><CardTitle className="text-lg">{project.name}</CardTitle><CardDescription>Status: <Badge variant={project.status === 'active' ? 'default' : 'secondary'} className={project.status === 'active' ? 'bg-blue-500 hover:bg-blue-600' : ''}>{project.status}</Badge></CardDescription></CardHeader>
                                                <CardContent className="flex-grow">
                                                    <p className="text-sm text-muted-foreground mb-2 line-clamp-3">{project.description}</p>
                                                    {/* Display USD Placeholder */}
                                                    <p className="text-sm font-medium">Funding: {raisedUSD} / {goalUSD}</p>
                                                    <p className="text-xs text-muted-foreground">({project.fundingRaised.toFixed(4)} / {project.fundingRequired.toFixed(4)} ETH)</p>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }
    