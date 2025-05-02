// my-next-app/app/ngo/dashboard/edit-profile/page.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
// Removed Link, ThemeToggle, ArrowLeft imports
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Upload } from 'lucide-react';

// Interface and getAuthToken remain the same
interface NgoProfileData { ngoName?: string; ngoDescription?: string; ngoLogoUrl?: string; email?: string; }
const getAuthToken = (): string | null => { /* ... */ if (typeof window !== 'undefined') return localStorage.getItem('authToken'); return null; };

export default function EditNgoProfilePage() {
    const router = useRouter();
    // State hooks remain the same
    const [profileData, setProfileData] = useState<NgoProfileData>({});
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [ngoName, setNgoName] = useState('');
    const [ngoDescription, setNgoDescription] = useState('');
    const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // useEffect hook remains the same
    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoading(true); setError(null); const token = getAuthToken(); if (!token) { setError("Authentication required."); setIsLoading(false); return; }
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/ngo/profile`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!response.ok) { const errData = await response.json(); throw new Error(errData.message || `Failed to fetch profile (${response.status})`); }
                const data: NgoProfileData = await response.json(); setProfileData(data); setNgoName(data.ngoName || ''); setNgoDescription(data.ngoDescription || ''); setLogoPreview(data.ngoLogoUrl ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${data.ngoLogoUrl}` : null);
            } catch (err) { console.error("Fetch profile error:", err); const msg = err instanceof Error ? err.message : "An error occurred."; setError(msg); toast.error("Failed to Load Profile", { description: msg });
            } finally { setIsLoading(false); }
        };
        fetchProfile();
    }, []);

    // handleLogoChange and handleSubmit remain the same
    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => { /* ... */ };
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault(); setIsSaving(true); const token = getAuthToken(); if (!token) { toast.error("Authentication Error"); setIsSaving(false); return; }
        const formData = new FormData(); formData.append('ngoName', ngoName); formData.append('ngoDescription', ngoDescription);
        if (selectedLogoFile) formData.append('ngoLogo', selectedLogoFile, selectedLogoFile.name);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/ngo/profile`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
            const data = await response.json(); if (!response.ok) throw new Error(data.message || `Failed to update profile (${response.status})`);
            toast.success("Profile Updated Successfully!"); router.push('/ngo/dashboard');
        } catch (err) { console.error("Update profile error:", err); const msg = err instanceof Error ? err.message : "An error occurred."; setError(msg); toast.error("Failed to Update Profile", { description: msg });
        } finally { setIsSaving(false); }
    };

    const defaultLogo = 'https://placehold.co/150x150/e2e8f0/64748b?text=Logo';

    // --- RENDER LOGIC (Removed Header and Footer) ---
    if (isLoading) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-10 w-10 animate-spin" /></div>;
    if (error) return <div className="flex justify-center items-center min-h-screen text-red-600 p-6">Error loading profile: {error}</div>;

    return (
        // Container and padding provided by the layout now
         <div className="container mx-auto p-4 md:p-8 flex justify-center">
            <Card className="w-full max-w-2xl shadow-lg">
                <CardHeader>
                    <CardTitle>Edit NGO Profile</CardTitle>
                    <CardDescription>Update your organization's public information.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                        {/* Logo Upload */}
                        <div className="flex flex-col items-center space-y-4">
                             <Label>Organization Logo (Optional, Max 2MB)</Label>
                             <Image src={logoPreview || defaultLogo} alt="NGO Logo Preview" width={128} height={128} className="rounded-lg border bg-muted object-cover w-32 h-32" onError={(e) => { (e.target as HTMLImageElement).src = defaultLogo; }}/>
                             <Input id="ngoLogo" type="file" accept="image/*" ref={fileInputRef} onChange={handleLogoChange} className="hidden" disabled={isSaving}/>
                             <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isSaving}> <Upload className="mr-2 h-4 w-4"/> Change Logo </Button>
                        </div>
                        {/* NGO Name */}
                        <div className="space-y-2">
                            <Label htmlFor="ngoName">Organization Name</Label>
                            <Input id="ngoName" value={ngoName} onChange={(e) => setNgoName(e.target.value)} placeholder="Your Organization Name" maxLength={100} disabled={isSaving}/>
                        </div>
                        {/* NGO Description */}
                        <div className="space-y-2">
                            <Label htmlFor="ngoDescription">Description</Label>
                            <Textarea id="ngoDescription" value={ngoDescription} onChange={(e) => setNgoDescription(e.target.value)} placeholder="Tell us about your organization's mission and work..." rows={5} maxLength={1000} disabled={isSaving}/>
                            <p className="text-xs text-muted-foreground text-right">{ngoDescription.length} / 1000</p>
                        </div>
                    </CardContent>
                    <CardFooter className="border-t pt-6">
                        <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
    // --- END RENDER LOGIC ---
}
