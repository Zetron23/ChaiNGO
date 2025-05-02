// my-next-app/components/auth/AuthForm.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Wallet } from 'lucide-react';
import { ethers } from 'ethers';

interface AuthFormProps {
  userType: 'Admin' | 'Donor' | 'NGO';
}

interface AuthResponse {
    _id: string;
    email: string;
    role: string;
    token?: string; // Token is optional (not sent on initial NGO signup)
    walletAddress?: string;
    message?: string;
}

// Extend the Window interface to include the ethereum property
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      on?: (event: string, callback: (...args: any[]) => void) => void;
      removeListener?: (event: string, callback: (...args: any[]) => void) => void;
      [key: string]: any; // Allow other properties
    };
  }
}

const isMetaMaskInstalled = (): boolean => {
  return typeof window?.ethereum !== 'undefined' && !!window.ethereum.isMetaMask;
};

export function AuthForm({ userType }: AuthFormProps) {
  const router = useRouter();
  const [isSigningUp, setIsSigningUp] = useState(userType !== 'Admin' ? false : false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [metaMaskAvailable, setMetaMaskAvailable] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const isAdmin = userType === 'Admin';

  useEffect(() => {
    setMetaMaskAvailable(isMetaMaskInstalled());
    if (isAdmin) setIsSigningUp(false);
    const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) setConnectedWallet(null);
        else if (connectedWallet && accounts[0].toLowerCase() !== connectedWallet.toLowerCase()) setConnectedWallet(accounts[0]);
    };
    if (isMetaMaskInstalled() && typeof window.ethereum?.on === 'function') {
        window.ethereum.on('accountsChanged', handleAccountsChanged);
    }
    return () => { 
        if (isMetaMaskInstalled() && typeof window.ethereum?.removeListener === 'function') {
            window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
    };
  }, [connectedWallet, isAdmin, userType]);

  // --- Wallet Connection Logic ---
  const connectWallet = async (): Promise<string | null> => {
      if (!isMetaMaskInstalled()) { toast.error("MetaMask Not Found"); return null; }
      setIsConnectingWallet(true);
      try {
          if (!window.ethereum) {
              throw new Error("Ethereum provider not found");
          }
          const provider = new ethers.BrowserProvider(window.ethereum as ethers.Eip1193Provider);
          const accounts: string[] = await provider.send("eth_requestAccounts", []);
          if (accounts?.length > 0) {
              const address = accounts[0]; setConnectedWallet(address);
              toast.success("Wallet Connected", { description: `Address: ${address.substring(0, 6)}...` }); return address;
          } else { toast.warning("No accounts found"); return null; }
      } catch (error: any) {
          if (error.code === 4001) toast.error("Connection Rejected");
          else toast.error("Wallet Connection Failed", { description: error.message }); return null;
      } finally { setIsConnectingWallet(false); }
  };

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          if (file.type !== 'application/pdf') { toast.error("Invalid File Type", { description: "Please upload a PDF document." }); setSelectedFile(null); setFileName(''); event.target.value = ''; return; }
          if (file.size > 5 * 1024 * 1024) { toast.error("File Too Large", { description: "Maximum file size is 5MB." }); setSelectedFile(null); setFileName(''); event.target.value = ''; return; }
          setSelectedFile(file); setFileName(file.name);
      } else { setSelectedFile(null); setFileName(''); }
  };

  // --- Form Submission Logic ---
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSigningUp && userType === 'NGO' && !selectedFile) { toast.error("Document Required"); return; }
    setIsLoading(true);
    const endpoint = isSigningUp ? 'signup' : 'signin';
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/${endpoint}/${userType}`;
    let requestBody: any;
    let requestHeaders: HeadersInit = {};
    if (isSigningUp && userType === 'NGO') {
        const formData = new FormData(); formData.append('email', email); formData.append('password', password);
        if (connectedWallet) formData.append('walletAddress', connectedWallet);
        if (selectedFile) formData.append('document', selectedFile, selectedFile.name); requestBody = formData;
    } else {
        const payload: any = { email, password }; requestBody = JSON.stringify(payload); requestHeaders['Content-Type'] = 'application/json';
    }
    try {
      const response = await fetch(apiUrl, { method: 'POST', headers: requestHeaders, body: requestBody });
      const data: AuthResponse = await response.json();
      if (!response.ok) throw new Error(data.message || `Failed to ${isSigningUp ? 'sign up' : 'sign in'}`);

      // --- Handle Success ---
      if (isSigningUp) { // Donor/NGO Signup
          console.log('Signup successful:', data);
          toast.success(data.message || "Signup Successful!", { description: userType === 'NGO' ? "Your account requires admin approval." : "Please sign in." });
          setEmail(''); setPassword(''); setConnectedWallet(null); setSelectedFile(null); setFileName(''); setIsSigningUp(false);
      } else { // Signin Success (Admin, Donor, NGO)
          console.log('Signin successful:', data);
          toast.success("Successfully Signed In!", { description: `Welcome back, ${data.email}! Redirecting...` });

          // --- NEW: Store the token in localStorage ---
          if (data.token && typeof window !== 'undefined') {
              localStorage.setItem('authToken', data.token); // Use the key 'authToken'
              console.log('Auth token stored in localStorage.');
          } else {
              console.warn('No token received or window is undefined, cannot store token.');
              // Handle cases where token might be missing (e.g., initial NGO signup response)
              if (userType === 'NGO') {
                 // This case shouldn't happen on sign-in if backend logic is correct, but good to be aware
                 toast.info("Account Status", { description: "Your NGO account might still be pending approval." });
              }
          }
          // --- End Token Storage ---

          // Navigate to dashboard (only if token was likely received, i.e., not initial NGO signup)
          if (data.token) {
             router.push(`/${userType.toLowerCase()}/dashboard`);
          }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast.error("Authentication Failed", { description: errorMessage });
    } finally { setIsLoading(false); }
  };

  // Handle Wallet Login
  const handleWalletLogin = async () => {
      setIsLoading(true);
      const address = await connectWallet();
      if (!address) { setIsLoading(false); return; }
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/signin/wallet/${userType}`;
      try {
          const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ walletAddress: address }) });
          const data: AuthResponse = await response.json();
          if (!response.ok) throw new Error(data.message || 'Failed to sign in with wallet');
          console.log('Wallet login successful:', data);
          toast.success("Successfully Signed In with Wallet!", { description: `Welcome back, ${data.email}! Redirecting...` });

          // --- NEW: Store the token in localStorage ---
          if (data.token && typeof window !== 'undefined') {
              localStorage.setItem('authToken', data.token); // Use the key 'authToken'
              console.log('Auth token stored in localStorage.');
          } else {
              console.warn('No token received or window is undefined, cannot store token.');
              // Handle cases where token might be missing
               if (userType === 'NGO') {
                 toast.info("Account Status", { description: "Your NGO account might still be pending approval." });
              }
          }
          // --- End Token Storage ---

          // Navigate to dashboard (only if token was received)
           if (data.token) {
              router.push(`/${userType.toLowerCase()}/dashboard`);
           }

      } catch (error) {
          console.error('Wallet login error:', error);
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
          toast.error("Wallet Login Failed", { description: errorMessage });
      } finally { setIsLoading(false); }
  };

  // --- Render Logic ---
  return (
    <div className="w-full max-w-md space-y-6 p-4 md:p-0">
      <h2 className="text-2xl font-semibold text-center">
        {isAdmin ? `${userType} Sign In` : (isSigningUp ? `Create ${userType} Account` : `${userType} Sign In`)}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder={isAdmin ? "admin@example.com" : "you@example.com"} required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
        </div>
        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="••••••••" required minLength={isSigningUp ? 6 : undefined} value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
          {isSigningUp && !isAdmin && <p className="text-xs text-muted-foreground">Minimum 6 characters required.</p>}
        </div>
        {/* File Upload (NGO Signup Only) */}
        {isSigningUp && userType === 'NGO' && (
            <div className="space-y-2">
                <Label htmlFor="document">Verification Document (PDF only, max 5MB) <span className="text-red-500">*</span></Label>
                <Input id="document" type="file" required accept=".pdf" onChange={handleFileChange} disabled={isLoading} className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100" />
                {fileName && <p className="text-xs text-muted-foreground">Selected: {fileName}</p>}
            </div>
        )}
        {/* Connect Wallet Button (Hidden for Admin) */}
        {isSigningUp && !isAdmin && metaMaskAvailable && (
            <div className="space-y-2 pt-2">
                <Label className="text-center block">Link Wallet (Optional)</Label>
                <Button type="button" variant="outline" className="w-full flex items-center justify-center gap-2" onClick={connectWallet} disabled={isLoading || isConnectingWallet || !!connectedWallet}>
                    {isConnectingWallet ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                    {connectedWallet ? `Connected: ${connectedWallet.substring(0, 6)}...` : 'Connect MetaMask Wallet'}
                </Button>
                {connectedWallet && <p className="text-xs text-green-600 dark:text-green-400 text-center">Wallet linked for signup.</p>}
            </div>
        )}
        {isSigningUp && !isAdmin && !metaMaskAvailable && <p className="text-xs text-muted-foreground text-center pt-2">Install MetaMask to link a wallet.</p>}
        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isLoading || (isSigningUp && isConnectingWallet)}>
          {isLoading && !isConnectingWallet ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isAdmin ? 'Sign In' : (isSigningUp ? 'Sign Up' : 'Sign In with Email')}
        </Button>
      </form>
      {/* Divider (Hidden for Admin) */}
      {!isAdmin && (
          <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or</span></div>
          </div>
      )}
      {/* Wallet Login Button (Hidden for Admin) */}
      {!isSigningUp && !isAdmin && metaMaskAvailable && (
          <Button type="button" variant="secondary" className="w-full flex items-center justify-center gap-2" onClick={handleWalletLogin} disabled={isLoading || isConnectingWallet}>
              {(isLoading || isConnectingWallet) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
              Sign In with MetaMask
          </Button>
      )}
       {!isSigningUp && !isAdmin && !metaMaskAvailable && <p className="text-xs text-muted-foreground text-center">Install MetaMask to sign in with wallet.</p>}
      {/* Toggle Link (Hidden for Admin) */}
      {!isAdmin && (
          <div className="mt-6 text-center">
            <button onClick={() => { setIsSigningUp(!isSigningUp); setConnectedWallet(null); setSelectedFile(null); setFileName(''); }} className="text-sm text-blue-600 hover:underline dark:text-blue-400" disabled={isLoading || isConnectingWallet}>
              {isSigningUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
      )}
    </div>
  );
}
