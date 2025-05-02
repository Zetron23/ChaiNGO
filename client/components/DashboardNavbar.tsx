// components/DashboardNavbar.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Building, ShieldCheck, LogOut, Menu, X, LayoutDashboard, HandHeart, User, Search } from 'lucide-react'; // Added User, Search
import { Button } from "@/components/ui/button";
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { cn } from '@/lib/utils';

// Define navigation link structure
interface NavLink {
  href: string;
  label: string;
  icon?: React.ElementType; // Optional icon component
}

// Define props for the navbar
interface DashboardNavbarProps {
  userRole: 'Admin' | 'NGO' | 'Donor';
  userName?: string; // e.g., NGO Name, "Admin", or "Donor Portal"
  userLogoUrl?: string; // Optional logo URL (mainly for NGO)
}

// Placeholder for logout function (replace with actual logic)
const handleLogout = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        window.location.href = '/'; // Redirect to home
    }
};

const defaultLogo = 'https://placehold.co/40x40/e2e8f0/64748b?text=Logo'; // Placeholder

export function DashboardNavbar({ userRole, userName, userLogoUrl }: DashboardNavbarProps) {
    const pathname = usePathname(); // Get current path
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    // Define links based on role
    let navLinks: NavLink[] = [];
    let BrandIcon: React.ElementType = LayoutDashboard; // Default icon
    let brandName = userName || 'Dashboard';
    let brandLogo = defaultLogo;
    let brandLink = '/'; // Default link

    if (userRole === 'Admin') {
        navLinks = [
            { href: '/admin/dashboard', label: 'Verification', icon: ShieldCheck },
            // Add more admin links here
        ];
        BrandIcon = ShieldCheck;
        brandName = userName || 'Admin Panel';
        brandLink = '/admin/dashboard';
    } else if (userRole === 'NGO') {
         navLinks = [
            { href: '/ngo/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { href: '/ngo/dashboard/create-project', label: 'Create Project' },
            { href: '/ngo/dashboard/edit-profile', label: 'Profile' },
            // Add more NGO links here
        ];
        BrandIcon = Building;
        brandName = userName || 'NGO Portal';
        // Use provided logo or default
        brandLogo = userLogoUrl ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${userLogoUrl}` : defaultLogo;
        brandLink = '/ngo/dashboard';
    } else if (userRole === 'Donor') {
        // --- UPDATED Donor Links ---
        navLinks = [
            { href: '/donor/dashboard', label: 'My Dashboard', icon: User }, // Link to the main dashboard
            { href: '/donor/explore', label: 'Explore Projects', icon: Search }, // Link to explore page
            // { href: '/donor/donations', label: 'My Donations', icon: HandHeart }, // Example future link
        ];
        // --- End Update ---
        BrandIcon = HandHeart; // Use Donor specific icon
        brandName = userName || 'Donor Portal';
        brandLink = '/donor/dashboard'; // Brand links to main dashboard
        // Donors likely don't have a specific logo here, so we won't use brandLogo for them
    }


    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center"> {/* Increased height slightly */}
                {/* Brand */}
                <div className="mr-4 flex">
                    <Link href={brandLink} className="mr-6 flex items-center space-x-2">
                         {/* Show logo only for NGO for now */}
                         {userRole === 'NGO' ? (
                             <Image
                                key={brandLogo} // Add key to help React update if src changes
                                src={brandLogo} alt={brandName} width={36} height={36}
                                className="rounded-full border object-cover" // Added object-cover
                                onError={(e) => { (e.target as HTMLImageElement).src = defaultLogo; }}
                                priority
                             />
                         ) : (
                             // Show icon for Admin and Donor
                             <BrandIcon className="h-6 w-6" />
                         )}
                        <span className="font-bold">{brandName}</span>
                    </Link>
                </div>

                {/* Desktop Navigation */}
                <NavigationMenu className="hidden md:flex flex-1">
                    <NavigationMenuList>
                        {navLinks.map((link) => (
                            <NavigationMenuItem key={link.href}>
                                {/* --- CORRECTED: Use legacyBehavior + asChild --- */}
                                <Link href={link.href} legacyBehavior passHref>
                                    <NavigationMenuLink
                                        asChild // Add asChild to NavigationMenuLink
                                        className={cn(
                                            navigationMenuTriggerStyle(), // Apply base styles
                                            // Apply active styles conditionally
                                            (pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href)))
                                                ? "bg-accent text-accent-foreground"
                                                : ""
                                        )}
                                    >
                                        {/* Explicit <a> tag as the child */}
                                        <a>{link.label}</a>
                                    </NavigationMenuLink>
                                </Link>
                                {/* --- End Correction --- */}
                            </NavigationMenuItem>
                        ))}
                    </NavigationMenuList>
                </NavigationMenu>

                {/* Right side actions (Desktop) */}
                <div className="hidden md:flex flex-1 items-center justify-end space-x-3">
                    <ThemeToggle />
                    <Button variant="ghost" size="sm" onClick={handleLogout}>
                       <LogOut className="mr-2 h-4 w-4" /> Logout
                    </Button>
                </div>

                {/* Mobile Menu Button & Sheet */}
                <div className="md:hidden flex flex-1 justify-end">
                     <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                        {/* Ensure SheetTrigger has exactly one valid child element */}
                        <SheetTrigger asChild>
                             <Button variant="ghost" size="icon">
                                <Menu className="h-6 w-6" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                             <div className="flex justify-between items-center mb-6">
                                 <span className="font-semibold">{brandName}</span>
                                 <SheetClose asChild>
                                     <Button variant="ghost" size="icon">
                                         <X className="h-5 w-5" />
                                         <span className="sr-only">Close menu</span>
                                     </Button>
                                 </SheetClose>
                             </div>
                             <nav className="flex flex-col space-y-2 mb-6">
                                {navLinks.map((link) => (
                                    <SheetClose key={link.href} asChild>
                                        <Link
                                            href={link.href}
                                            className={cn(
                                                "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                                                (pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href)))
                                                    ? "bg-accent text-accent-foreground"
                                                    : "text-muted-foreground"
                                            )}
                                        >
                                            {link.icon && <link.icon className="mr-2 h-4 w-4" />}
                                            {link.label}
                                        </Link>
                                    </SheetClose>
                                ))}
                            </nav>
                            <div className="flex items-center justify-between border-t pt-4">
                                <span className="text-sm text-muted-foreground">Theme</span>
                                <ThemeToggle />
                            </div>
                             <Button variant="outline" size="sm" onClick={handleLogout} className="w-full mt-6">
                                <LogOut className="mr-2 h-4 w-4" /> Logout
                            </Button>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
