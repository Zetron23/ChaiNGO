// my-next-app/app/ngo/dashboard/project/[projectId]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Use useParams to get projectId
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress"; // For funding progress
import { toast } from "sonner";
// UPDATED: Added XCircle to the import
import { Loader2, ArrowLeft, Check, CircleHelp, CircleX, CheckCircle, Hourglass, RotateCcw } from 'lucide-react';

// Define structure for a single milestone
interface Milestone {
    _id: string;
    description: string;
    status: 'pending' | 'completed' | 'verified' | 'rejected';
    adminNotes?: string;
    updatedAt?: string;
}

// Define structure for a single project
interface ProjectDetails {
    _id: string;
    name: string;
    description: string;
    fundingRequired: number;
    fundingRaised: number;
    status: string;
    ngoOwner: { _id: string; ngoName?: string; email: string; };
    milestones: Milestone[];
    createdAt: string;
    updatedAt: string;
}

// Placeholder function to get the auth token
const getAuthToken = (): string | null => {
    if (typeof window !== 'undefined') return localStorage.getItem('authToken');
    return null;
};

export default function ProjectDetailPage() {
    const router = useRouter();
    const params = useParams();
    const projectId = params.projectId as string;

    const [project, setProject] = useState<ProjectDetails | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingMilestoneId, setUpdatingMilestoneId] = useState<string | null>(null);

    // Fetch project details
    useEffect(() => {
        if (!projectId) return;
        const fetchProject = async () => {
            setIsLoading(true); setError(null); const token = getAuthToken();
            if (!token) { setError("Authentication required."); setIsLoading(false); return; }
            try {
                // TODO: Replace with direct fetch: GET /api/projects/:projectId
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/projects/my-projects`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!response.ok) { const errData = await response.json(); throw new Error(errData.message || `Failed to fetch projects (${response.status})`); }
                const projectsData: ProjectDetails[] = await response.json();
                const foundProject = projectsData.find(p => p._id === projectId);
                if (!foundProject) throw new Error("Project not found or access denied.");
                setProject(foundProject);
            } catch (err) {
                console.error("Fetch project details error:", err); const msg = err instanceof Error ? err.message : "An unknown error occurred."; setError(msg); toast.error("Failed to Load Project", { description: msg });
            } finally { setIsLoading(false); }
        };
        fetchProject();
    }, [projectId]);

    // Handle marking a milestone as complete OR resubmitting a rejected one
    const handleSubmitMilestone = async (milestoneId: string) => {
        if (!project) return; setUpdatingMilestoneId(milestoneId); const token = getAuthToken();
        if (!token) { toast.error("Authentication Error"); setUpdatingMilestoneId(null); return; }
        try {
             const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/projects/${projectId}/milestones/${milestoneId}/complete`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
             const data = await response.json(); if (!response.ok) throw new Error(data.message || `Failed to update milestone (${response.status})`);
             toast.success("Milestone Submitted for Verification!");
             setProject(prevProject => { if (!prevProject) return null; return { ...prevProject, milestones: prevProject.milestones.map(m => m._id === milestoneId ? { ...m, status: 'completed', adminNotes: undefined } : m ) }; });
        } catch (err) { console.error("Submit milestone error:", err); const msg = err instanceof Error ? err.message : "An error occurred."; toast.error("Failed to Submit Milestone", { description: msg });
        } finally { setUpdatingMilestoneId(null); }
    };

    // Helper to render milestone status icon/text
    const renderMilestoneStatus = (status: Milestone['status']) => {
         switch (status) {
            case 'pending': return <Badge variant="outline"><Hourglass className="mr-1 h-3 w-3" />Pending</Badge>;
            case 'completed': return <Badge variant="secondary"><Check className="mr-1 h-3 w-3" />Awaiting Verification</Badge>;
            case 'verified': return <Badge variant="default" className="bg-green-500 hover:bg-green-600"><CheckCircle className="mr-1 h-3 w-3" />Verified</Badge>;
            case 'rejected': return <Badge variant="destructive"><CircleX className="mr-1 h-3 w-3" />Rejected</Badge>; // Uses CircleX
            default: return <Badge variant="outline"><CircleHelp className="mr-1 h-3 w-3"/>Unknown</Badge>;
        }
    };

    // --- Render Logic ---
    if (isLoading) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-10 w-10 animate-spin" /></div>;
    if (error) return <div className="container mx-auto p-8 text-center text-red-600">Error: {error} <Link href="/ngo/dashboard"><Button variant="link">Go Back</Button></Link></div>;
    if (!project) return <div className="container mx-auto p-8 text-center text-muted-foreground">Project not found. <Link href="/ngo/dashboard"><Button variant="link">Go Back</Button></Link></div>;

    const fundingProgress = project.fundingRequired > 0 ? (project.fundingRaised / project.fundingRequired) * 100 : 0;

    return (
         <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
             {/* Header provided by layout */}
             <main className="flex-1 container mx-auto p-4 md:p-8">
                <Card className="shadow-lg">
                    <CardHeader> <CardTitle className="text-2xl md:text-3xl">{project.name}</CardTitle> <CardDescription>Status: <Badge variant={project.status === 'active' ? 'default' : 'secondary'} className={project.status === 'active' ? 'bg-blue-500' : ''}>{project.status}</Badge></CardDescription> </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Description */}
                        <div> <h3 className="font-semibold mb-2 text-lg">Description</h3> <p className="text-muted-foreground text-sm">{project.description}</p> </div>
                        {/* Funding */}
                        <div> <h3 className="font-semibold mb-2 text-lg">Funding</h3> <div className="text-sm mb-1"> <span className="font-medium">${project.fundingRaised.toLocaleString()}</span> raised of <span className="font-medium">${project.fundingRequired.toLocaleString()}</span> goal </div> <Progress value={fundingProgress} className="w-full h-2" /> </div>
                        {/* Milestones */}
                        <div>
                            <h3 className="font-semibold mb-3 text-lg">Milestones & Progress</h3>
                            <ul className="space-y-4">
                                {project.milestones.map((milestone) => (
                                    <li key={milestone._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-md bg-background dark:bg-slate-900/50">
                                        <div className="flex-1 mb-2 sm:mb-0 sm:mr-4">
                                            <p className="text-sm font-medium">{milestone.description}</p>
                                            {milestone.status === 'rejected' && milestone.adminNotes && ( <p className="text-xs text-red-500 mt-1">Admin Note: {milestone.adminNotes}</p> )}
                                        </div>
                                        <div className="flex items-center space-x-2 w-full sm:w-auto justify-between">
                                            {renderMilestoneStatus(milestone.status)}
                                            {milestone.status === 'pending' && ( <Button size="sm" variant="outline" onClick={() => handleSubmitMilestone(milestone._id)} disabled={updatingMilestoneId === milestone._id}> {updatingMilestoneId === milestone._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} <span className="ml-1">Mark Complete</span> </Button> )}
                                            {milestone.status === 'rejected' && ( <Button size="sm" variant="outline" onClick={() => handleSubmitMilestone(milestone._id)} disabled={updatingMilestoneId === milestone._id} className="text-blue-600 border-blue-300 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-600 dark:hover:bg-blue-900/20"> {updatingMilestoneId === milestone._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />} <span className="ml-1">Resubmit</span> </Button> )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </CardContent>
                    <CardFooter className="text-xs text-muted-foreground border-t pt-4"> Created: {new Date(project.createdAt).toLocaleDateString()} | Last Updated: {new Date(project.updatedAt).toLocaleDateString()} </CardFooter>
                </Card>
             </main>
             {/* Footer provided by layout */}
         </div>
    );
}
