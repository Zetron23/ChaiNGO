// my-next-app/app/login/[userType]/page.tsx
import { AuthForm } from '@/components/auth/AuthForm';
import Link from 'next/link';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Metadata } from 'next';
import { Card, CardContent } from "@/components/ui/card"; // Import Card components

interface LoginPageProps {
  params: { userType: string; };
}

function isValidUserType(type: string): type is 'Admin' | 'Donor' | 'NGO' {
    return ['Admin', 'Donor', 'NGO'].includes(type);
}

export default function LoginPage({ params }: LoginPageProps) {
  const userType = params.userType;

  if (!isValidUserType(userType)) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-red-100 dark:bg-red-900 p-6 text-center">
            <h1 className="text-3xl font-bold text-red-700 dark:text-red-200 mb-4">Invalid User Type</h1>
            <p className="text-red-600 dark:text-red-300 mb-6">
                The user type "{params.userType}" is not recognized.
            </p>
            <Link href="/">
                <Button variant="destructive"><Home className="mr-2 h-4 w-4" /> Go Home</Button>
            </Link>
        </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-black p-4 relative">
       {/* Back to Home Button */}
       <Link href="/" className="absolute top-4 left-4 z-10">
         <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 bg-background/50 backdrop-blur-sm border">
           <Home className="h-5 w-5" />
           <span className="sr-only">Back to Home</span>
         </Button>
       </Link>

       {/* Wrap AuthForm in a Card */}
       <Card className="w-full max-w-md shadow-xl border dark:border-slate-800 bg-card/80 backdrop-blur-lg">
           <CardContent className="p-6 md:p-8">
                {/* Render the AuthForm, passing the validated userType */}
                <AuthForm userType={userType} />
           </CardContent>
       </Card>

    </div>
  );
}

export async function generateMetadata({ params }: LoginPageProps): Promise<Metadata> {
    const userType = params.userType;
    const title = isValidUserType(userType) ? `${userType} Login / Sign Up` : 'Invalid Page';
    const description = isValidUserType(userType) ? `Authenticate or create an account as ${userType}.` : 'Invalid user type specified.';
    return { title, description };
}
