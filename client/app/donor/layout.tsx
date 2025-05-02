    // app/donor/layout.tsx
    import React from 'react';
    import { DashboardNavbar } from '@/components/DashboardNavbar'; // Import the reusable navbar

    // This layout applies to all routes starting with /donor
    export default function DonorLayout({
      children,
    }: {
      children: React.ReactNode;
    }) {
      // TODO: Fetch donor-specific info if needed for the navbar (e.g., name)
      // For now, just passing the role.
      return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
          {/* Render the navbar with Donor props */}
          <DashboardNavbar userRole="Donor" userName="Donor Portal" />

          {/* Render the specific page content */}
          <main className="flex-1">
            {children}
          </main>

          {/* Optional: Shared Donor Footer */}
          <footer className="py-4 text-center text-xs text-muted-foreground border-t">
               © {new Date().getFullYear()} ChainGo Donor Portal
          </footer>
        </div>
      );
    }

    // Optional: Add metadata specific to the donor section
    export const metadata = {
        title: {
            template: '%s | ChainGo Donor', // Title template for donor pages
            default: 'ChainGo Donor Portal', // Default title
        },
        description: 'Explore projects and manage your donations.',
    };
    