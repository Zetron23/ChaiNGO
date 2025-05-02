// app/ngo/layout.tsx
import React from 'react';
import { DashboardNavbar } from '@/components/DashboardNavbar'; // Import the reusable navbar

// This layout applies to all routes starting with /ngo

// TODO: In a real app, fetch dynamic NGO data (name, logo) here or via context/client component logic
// For now, we pass static props or rely on navbar's internal logic if needed.

export default function NgoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Render the navbar with NGO props */}
      {/* Pass fetched name/logo here if available */}
      <DashboardNavbar
        userRole="NGO"
        // userName={ngoData?.ngoName} // Example if data was fetched
        // userLogoUrl={ngoData?.ngoLogoUrl}
      />

      {/* Render the specific page content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Optional: Shared NGO Footer */}
       <footer className="py-4 text-center text-xs text-muted-foreground border-t">
           © {new Date().getFullYear()} ChainGo NGO Portal
      </footer>
    </div>
  );
}

// Optional: Add metadata specific to the NGO section
export const metadata = {
    title: {
        template: '%s | ChainGo NGO', // Title template for NGO pages
        default: 'ChainGo NGO Portal', // Default title
    },
    description: 'Manage your NGO profile, projects, and donations.',
};
