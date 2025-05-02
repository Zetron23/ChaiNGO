


            // app/donor/explore/page.tsx
    "use client";

    import React, { useState, useEffect } from 'react';
    import Link from 'next/link';
    import Image from 'next/image';
    import { ethers } from 'ethers';
    import { Button } from '@/components/ui/button';
    import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
    import { Input } from "@/components/ui/input";
    import { Progress } from '@/components/ui/progress';
    import { toast } from "sonner";
    import { Loader2, HandHeart, Wallet } from 'lucide-react';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
    import { Label } from '@/components/ui/label';
    import { Badge } from '@/components/ui/badge';
    import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"; // Keep AlertDialog if used elsewhere, Dialog is used here

    // Interface for Project Data
    interface ActiveProject {
        _id: string; contractProjectId?: number; name: string; description: string;
        fundingRequired: number; fundingRaised: number; status: string;
        ngoOwner: { _id: string; ngoName?: string; ngoLogoUrl?: string; email: string; };
        createdAt: string; totalMilestones: number;
    }

    // --- Contract Setup ---
    const contractAddress = process.env.NEXT_PUBLIC_DONATION_CONTRACT_ADDRESS || "0xYourDeployedContractAddressOnSepolia";
    const contractAbi = [
        { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" },
        { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "uint256", "name": "projectId", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "donor", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "amountToNgo", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "amountToMilestones", "type": "uint256" } ], "name": "DonationMade", "type": "event" },
        { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "uint256", "name": "projectId", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "milestoneIndex", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "MilestoneFundsReleased", "type": "event" },
        { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" } ], "name": "OwnershipTransferred", "type": "event" },
        { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "uint256", "name": "projectId", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "ngoWallet", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "ProjectFundsWithdrawn", "type": "event" },
        { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "uint256", "name": "projectId", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "ngoWallet", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "fundingGoal", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "milestoneCount", "type": "uint256" } ], "name": "ProjectRegistered", "type": "event" },
        { "inputs": [ { "internalType": "uint256", "name": "_projectId", "type": "uint256" } ], "name": "donate", "outputs": [], "stateMutability": "payable", "type": "function" },
        { "inputs": [], "name": "emergencyWithdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
        { "inputs": [ { "internalType": "uint256", "name": "_projectId", "type": "uint256" } ], "name": "getProjectDetails", "outputs": [ { "components": [ { "internalType": "uint256", "name": "id", "type": "uint256" }, { "internalType": "uint256", "name": "fundingGoal", "type": "uint256" }, { "internalType": "uint256", "name": "totalRaised", "type": "uint256" }, { "internalType": "uint256", "name": "milestoneCount", "type": "uint256" }, { "internalType": "uint256", "name": "amountPerMilestone", "type": "uint256" }, { "internalType": "uint256", "name": "initialFundsReleased", "type": "uint256" }, { "internalType": "uint256", "name": "milestonesFunded", "type": "uint256" }, { "internalType": "address payable", "name": "ngoWallet", "type": "address" }, { "internalType": "bool", "name": "exists", "type": "bool" }, { "internalType": "bool", "name": "active", "type": "bool" } ], "internalType": "struct DonationContract.Project", "name": "", "type": "tuple" } ], "stateMutability": "view", "type": "function" },
        { "inputs": [], "name": "nextProjectId", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
        { "inputs": [], "name": "owner", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" },
        { "inputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "name": "projects", "outputs": [ { "internalType": "uint256", "name": "id", "type": "uint256" }, { "internalType": "uint256", "name": "fundingGoal", "type": "uint256" }, { "internalType": "uint256", "name": "totalRaised", "type": "uint256" }, { "internalType": "uint256", "name": "milestoneCount", "type": "uint256" }, { "internalType": "uint256", "name": "amountPerMilestone", "type": "uint256" }, { "internalType": "uint256", "name": "initialFundsReleased", "type": "uint256" }, { "internalType": "uint256", "name": "milestonesFunded", "type": "uint256" }, { "internalType": "address payable", "name": "ngoWallet", "type": "address" }, { "internalType": "bool", "name": "exists", "type": "bool" }, { "internalType": "bool", "name": "active", "type": "bool" } ], "stateMutability": "view", "type": "function" },
        { "inputs": [ { "internalType": "uint256", "name": "_backendId", "type": "uint256" }, { "internalType": "uint256", "name": "_fundingGoalWei", "type": "uint256" }, { "internalType": "uint256", "name": "_milestoneCount", "type": "uint256" }, { "internalType": "address payable", "name": "_ngoWallet", "type": "address" } ], "name": "registerProject", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "nonpayable", "type": "function" },
        { "inputs": [ { "internalType": "uint256", "name": "_projectId", "type": "uint256" } ], "name": "releaseMilestonePayment", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
        { "inputs": [], "name": "renounceOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
        { "inputs": [ { "internalType": "uint256", "name": "_projectId", "type": "uint256" } ], "name": "toggleProjectActive", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
        { "inputs": [ { "internalType": "address", "name": "newOwner", "type": "address" } ], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
        { "inputs": [ { "internalType": "uint256", "name": "_projectId", "type": "uint256" }, { "internalType": "address payable", "name": "_newNgoWallet", "type": "address" } ], "name": "updateNgoWallet", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
        { "stateMutability": "payable", "type": "receive" }
    ];
    // --- End ABI ---

    const ETH_TO_USD_RATE = 100000;
    const getAuthToken = (): string | null => { if (typeof window !== 'undefined') return localStorage.getItem('authToken'); return null; };

    export default function ExploreProjectsPage() {
        const [projects, setProjects] = useState<ActiveProject[]>([]);
        const [isLoading, setIsLoading] = useState<boolean>(true);
        const [error, setError] = useState<string | null>(null);
        const [selectedProject, setSelectedProject] = useState<ActiveProject | null>(null);
        const [donationAmount, setDonationAmount] = useState<string>('');
        const [isDonating, setIsDonating] = useState<boolean>(false);
        const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

        // Fetch projects
        const fetchActiveProjects = async () => {
            console.log("EXPLORE PAGE: Fetching projects - useEffect started.");
            setIsLoading(true); setError(null);
            try {
                const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/projects`;
                console.log("EXPLORE PAGE: Attempting fetch from URL:", apiUrl);
                const response = await fetch(apiUrl);
                console.log("EXPLORE PAGE: Fetch response status:", response.status);
                if (!response.ok) { const errData = await response.json(); console.error("EXPLORE PAGE: Fetch error data:", errData); throw new Error(errData.message || `Failed to fetch projects (${response.status})`); }
                const data: ActiveProject[] = await response.json(); console.log("EXPLORE PAGE: Projects fetched successfully:", data.length); setProjects(data);
            } catch (err) { console.error("EXPLORE PAGE: Fetch projects error:", err); const msg = err instanceof Error ? err.message : "An unknown error occurred."; setError(msg); toast.error("Failed to Load Projects", { description: msg });
            } finally { console.log("EXPLORE PAGE: Fetch finished, setting loading false."); setIsLoading(false); }
        };
        useEffect(() => { fetchActiveProjects(); }, []);

        // Record donation in backend
        const recordDonationInBackend = async (projectId: string, amountEth: string, txHash: string) => {
            const token = getAuthToken(); if (!token) { console.warn("No auth token found..."); toast.warning("Donation sent, but failed to record to history."); return; }
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/donations/record`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ projectId, amountEth, transactionHash: txHash }), });
                const data = await response.json(); if (!response.ok) { console.error("Backend recording failed:", data.message); toast.error("Donation Record Failed (Backend)", { description: data.message }); } else { console.log("Donation successfully recorded in backend:", data); }
            } catch (backendError) { console.error("Error calling backend donation record:", backendError); toast.error("Failed to Save Donation Record", { description: "Blockchain donation successful, but saving failed." }); }
        };

        // --- MetaMask/Ethers Interaction ---
        const handleDonate = async () => {
            if (!selectedProject || !selectedProject.contractProjectId || !donationAmount) { toast.error("Please select a project and enter amount."); return; }
            if (isNaN(parseFloat(donationAmount)) || parseFloat(donationAmount) <= 0) { toast.error("Invalid Donation Amount"); return; }
            if (typeof window.ethereum === 'undefined') { toast.error("MetaMask Not Found"); return; }

            setIsDonating(true);
            try {
                const provider = new ethers.BrowserProvider(window.ethereum as ethers.Eip1193Provider);
                const signer = await provider.getSigner();
                const contract = new ethers.Contract(contractAddress, contractAbi, signer);
                const amountInWei = ethers.parseEther(donationAmount);

                console.log(`Donating to contract project ID: ${selectedProject.contractProjectId}, Amount: ${amountInWei.toString()} Wei`);
                const tx = await contract.donate(selectedProject.contractProjectId, { value: amountInWei });
                toast.info("Transaction Sent", { description: `Waiting for confirmation... Tx: ${tx.hash.substring(0,10)}...` });
                console.log("Transaction sent:", tx.hash);
                const receipt = await tx.wait();
                console.log("Transaction confirmed:", receipt);

                if (receipt?.status === 1) {
                    toast.success("Donation Successful!", { description: `Tx confirmed: ${receipt.transactionHash.substring(0,10)}...` });
                    await recordDonationInBackend(selectedProject._id, donationAmount, receipt.transactionHash);
                    setDonationAmount(''); setIsDialogOpen(false); setSelectedProject(null);
                    fetchActiveProjects(); // Re-fetch projects
                } else { throw new Error("Transaction failed on the blockchain."); }

            } catch (err: any) {
                console.error("Donation error:", err);
                let message = "An error occurred during donation.";
                if (err.code === 4001) { message = "Transaction rejected in MetaMask."; }
                else if (err.reason) { message = `Transaction failed: ${err.reason}`; }
                else if (err.message) { message = err.message; }
                toast.error("Donation Failed", { description: message });
            } finally { setIsDonating(false); }
        };

        // Helper to open dialog
        const openDonationDialog = (project: ActiveProject) => {
             if (!project.contractProjectId) { toast.error("Project Error", { description: "Blockchain configuration missing." }); return; }
             setSelectedProject(project); setDonationAmount(''); setIsDialogOpen(true);
        };

        const defaultLogo = 'https://placehold.co/40x40/e2e8f0/64748b?text=NGO';

        // --- Render Logic ---
        return (
            <div className="container mx-auto p-4 md:p-8">
                <div className="mb-8"> <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">Explore Active Projects</h1> <p className="text-muted-foreground">Find initiatives you care about and make a difference.</p> </div>
                {isLoading && ( <div className="flex justify-center items-center py-20"><Loader2 className="h-10 w-10 animate-spin text-slate-500" /><p className="ml-3 text-slate-500">Loading projects...</p></div> )}
                {error && ( <div className="text-center py-10 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-md"><p><strong>Error:</strong> {error}</p></div> )}
                {!isLoading && !error && projects.length === 0 && ( <div className="text-center py-10 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 p-4 rounded-md"><p>No active projects found.</p></div> )}

                {!isLoading && !error && projects.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project) => {
                            const fundingProgress = project.fundingRequired > 0 ? (project.fundingRaised / project.fundingRequired) * 100 : 0;
                            const ngoDisplayName = project.ngoOwner?.ngoName || project.ngoOwner?.email || 'Unknown NGO';
                            const logoSrc = project.ngoOwner?.ngoLogoUrl ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${project.ngoOwner.ngoLogoUrl}` : defaultLogo;
                            const raisedUSD = (project.fundingRaised * ETH_TO_USD_RATE).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
                            const goalUSD = (project.fundingRequired * ETH_TO_USD_RATE).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

                            return (
                                <Card key={project._id} className="flex flex-col overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 border dark:border-slate-800">
                                    <CardHeader className="flex flex-row items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/30">
                                        <Image src={logoSrc} alt={`${ngoDisplayName} Logo`} width={40} height={40} className="rounded-full border bg-white object-cover" priority={false} />
                                        <div> <CardTitle className="text-lg leading-tight">{project.name}</CardTitle> <CardDescription className="text-xs">By {ngoDisplayName}</CardDescription> </div>
                                    </CardHeader>
                                    <CardContent className="p-4 flex-grow space-y-3">
                                        <p className="text-sm text-muted-foreground line-clamp-3">{project.description}</p>
                                        <div>
                                            <div className="text-xs text-muted-foreground mb-1 flex justify-between">
                                                <span>{raisedUSD} <span className="opacity-70">({project.fundingRaised.toFixed(4)} ETH)</span></span>
                                                <span>Goal: {goalUSD}</span>
                                            </div>
                                            <Progress value={fundingProgress} className="h-2" />
                                        </div>
                                    </CardContent>
                                    <CardFooter className="p-4 border-t dark:border-slate-800">
                                        <Dialog open={isDialogOpen && selectedProject?._id === project._id} onOpenChange={(open) => { if (!open) setSelectedProject(null); setIsDialogOpen(open); }}>
                                            <DialogTrigger asChild>
                                                <Button className="w-full" size="sm" onClick={() => openDonationDialog(project)} disabled={!project.contractProjectId}> <HandHeart className="mr-2 h-4 w-4" /> Donate Now </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[425px]">
                                                <DialogHeader> <DialogTitle>Donate to: {selectedProject?.name}</DialogTitle> <DialogDescription> Enter the amount of Sepolia ETH you wish to donate. 60% goes directly to the NGO, 40% is held for milestones. </DialogDescription> </DialogHeader>
                                                <div className="grid gap-4 py-4">
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <Label htmlFor="amount" className="text-right">Amount (ETH)</Label>
                                                        <Input id="amount" type="number" step="0.001" min="0.0001" placeholder="e.g., 0.01" value={donationAmount} onChange={(e) => setDonationAmount(e.target.value)} className="col-span-3" disabled={isDonating} />
                                                    </div>
                                                    {donationAmount && !isNaN(parseFloat(donationAmount)) && <p className="col-span-4 text-center text-xs text-muted-foreground">Approx. ${(parseFloat(donationAmount) * ETH_TO_USD_RATE).toLocaleString()} USD</p>}
                                                </div>
                                                <DialogFooter>
                                                    <DialogClose asChild><Button type="button" variant="outline" disabled={isDonating}>Cancel</Button></DialogClose>
                                                    {/* --- CORRECTED: onClick handler --- */}
                                                    <Button type="button" onClick={handleDonate} disabled={isDonating || !donationAmount || parseFloat(donationAmount) <= 0}>
                                                        {isDonating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wallet className="mr-2 h-4 w-4"/>}
                                                        {isDonating ? 'Processing...' : 'Confirm Donation'}
                                                    </Button>
                                                    {/* --- End Correction --- */}
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }
    