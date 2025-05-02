// my-next-app/app/ngo/dashboard/create-project/page.tsx
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
// Removed Link, ThemeToggle, ArrowLeft imports as they are in layout/navbar
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from 'lucide-react';

const getAuthToken = (): string | null => { /* ... */ if (typeof window !== 'undefined') return localStorage.getItem('authToken'); return null; };

export default function CreateProjectPage() {
    const router = useRouter();
    // State hooks remain the same
    const [projectName, setProjectName] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [fundingRequired, setFundingRequired] = useState('');
    const [milestonesInput, setMilestonesInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // handleSubmit function remains the same
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault(); setIsSubmitting(true); const token = getAuthToken();
        if (!token) { toast.error("Authentication Error"); setIsSubmitting(false); return; }
        if (!projectName || !projectDescription || !fundingRequired || !milestonesInput) { toast.error("Missing Fields"); setIsSubmitting(false); return; }
        if (isNaN(Number(fundingRequired)) || Number(fundingRequired) < 0) { toast.error("Invalid Funding Amount"); setIsSubmitting(false); return; }
        const payload = { name: projectName, description: projectDescription, fundingRequired: Number(fundingRequired), milestonesInput: milestonesInput };
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/projects`, { method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify(payload) });
            const data = await response.json(); if (!response.ok) throw new Error(data.message || `Failed to create project (${response.status})`);
            toast.success("Project Created Successfully!"); router.push('/ngo/dashboard');
        } catch (err) { console.error("Create project error:", err); const msg = err instanceof Error ? err.message : "An error occurred."; toast.error("Failed to Create Project", { description: msg });
        } finally { setIsSubmitting(false); }
    };

    // --- RENDER LOGIC (Removed Header and Footer) ---
    return (
        // Container and padding provided by the layout now
         <div className="container mx-auto p-4 md:p-8 flex justify-center">
            <Card className="w-full max-w-2xl shadow-lg">
                <CardHeader>
                    <CardTitle>Create New Project</CardTitle>
                    <CardDescription>Define your new initiative and its funding goals.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                        {/* Project Name */}
                        <div className="space-y-2">
                            <Label htmlFor="projectName">Project Name <span className="text-red-500">*</span></Label>
                            <Input id="projectName" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g., Clean Water Initiative for Village X" maxLength={100} required disabled={isSubmitting}/>
                        </div>
                        {/* Project Description */}
                        <div className="space-y-2">
                            <Label htmlFor="projectDescription">Project Description <span className="text-red-500">*</span></Label>
                            <Textarea id="projectDescription" value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} placeholder="Describe the project's goals, activities, and expected impact..." rows={5} maxLength={1000} required disabled={isSubmitting}/>
                            <p className="text-xs text-muted-foreground text-right">{projectDescription.length} / 1000</p>
                        </div>
                        {/* Funding Required */}
                        <div className="space-y-2">
                            <Label htmlFor="fundingRequired">Total Funding Required ($) <span className="text-red-500">*</span></Label>
                            <Input id="fundingRequired" type="number" value={fundingRequired} onChange={(e) => setFundingRequired(e.target.value)} placeholder="e.g., 5000" min="0" step="any" required disabled={isSubmitting}/>
                        </div>
                        {/* Milestones */}
                        <div className="space-y-2">
                            <Label htmlFor="milestonesInput">Project Milestones / Impact Metrics <span className="text-red-500">*</span></Label>
                            <Textarea id="milestonesInput" value={milestonesInput} onChange={(e) => setMilestonesInput(e.target.value)} placeholder="Separate each milestone or metric with a caret symbol (^). e.g., Purchase water filters^Install filters in 50 households^Conduct hygiene workshops" rows={5} required disabled={isSubmitting}/>
                            <p className="text-xs text-muted-foreground">Separate items using the '^' character.</p>
                        </div>
                    </CardContent>
                    <CardFooter className="border-t pt-6">
                        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {isSubmitting ? 'Creating Project...' : 'Create Project'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
    // --- END RENDER LOGIC ---
}
