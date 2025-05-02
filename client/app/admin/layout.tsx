    // app/admin/layout.tsx
    import React from 'react';
    import { DashboardNavbar } from '@/components/DashboardNavbar'; // Import the reusable navbar

    // This layout applies to all routes starting with /admin
    export default function AdminLayout({
      children,
    }: {
      children: React.ReactNode;
    }) {
      return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
          {/* Render the navbar with Admin props */}
          <DashboardNavbar userRole="Admin" />

          {/* Render the specific page content */}
          <main className="flex-1">
            {children}
          </main>

          {/* Optional: Shared Admin Footer */}
          <footer className="py-4 text-center text-xs text-muted-foreground border-t">
               © {new Date().getFullYear()} ChainGo Admin Portal
          </footer>
        </div>
      );
    }

    // Optional: Add metadata specific to the admin section
    export const metadata = {
        title: {
            template: '%s | ChainGo Admin', // Title template for admin pages
            default: 'ChainGo Admin', // Default title
        },
        description: 'Administration panel for ChainGo platform.',
    };
    