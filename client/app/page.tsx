// my-next-app/app/page.tsx
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, HandHeart, Building, UserCog } from 'lucide-react'; // Added relevant icons

// Define the user types and their details with icons
const userRoles = [
  { type: 'Admin', description: 'Manage application settings and users.', href: '/login/Admin', icon: UserCog },
  { type: 'Donor', description: 'View donation history and manage profile.', href: '/login/Donor', icon: HandHeart },
  { type: 'NGO', description: 'Manage campaigns and track donations.', href: '/login/NGO', icon: Building },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 pt-12 md:pt-20 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-black">
      <header className="mb-16 text-center max-w-3xl">
        {/* Placeholder Logo */}
        <Image
          src="/placeholder-logo.svg" // Path relative to the 'public' directory
          alt="App Logo"
          width={100}
          height={100}
          className=" mb-0 mx-auto"
          onError={(e) => { (e.target as HTMLImageElement).src = 'client\public\placeholder-logo.svg'; }}
        />
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-4">
          Welcome to ChaiNGO
        </h1>
        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400">
          Connecting communities for impactful change. Choose your role to get started.
        </p>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl w-full">
        {userRoles.map((role) => (
          <Card
            key={role.type}
            className="bg-white dark:bg-slate-900/80 backdrop-blur-sm shadow-lg hover:shadow-xl border border-slate-200 dark:border-slate-800 transition-all duration-300 rounded-xl overflow-hidden group hover:-translate-y-1"
          >
            <CardHeader className="p-6 items-center text-center">
              {/* Icon */}
              <div className="mb-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300">
                  <role.icon className="w-6 h-6" />
              </div>
              <CardTitle className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                {role.type}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 flex flex-col items-center text-center">
              <CardDescription className="text-slate-600 dark:text-slate-400 mb-6 h-16"> {/* Adjusted height */}
                {role.description}
              </CardDescription>
              {/* Use Next.js Link for client-side navigation */}
              <Link href={role.href} className="w-full mt-auto">
                <Button
                  variant="default" // Use default variant for primary action
                  className="w-full group-hover:bg-slate-700 dark:group-hover:bg-slate-200 dark:group-hover:text-slate-900 transition-colors duration-300"
                >
                  Continue as {role.type}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </main>

      <footer className="mt-20 text-center text-slate-500 dark:text-slate-400 text-sm">
        © {new Date().getFullYear()} ChainGo. All rights reserved.
      </footer>
    </div>
  );
}
