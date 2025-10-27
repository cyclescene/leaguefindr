import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignInForm } from "@/components/auth/sign-in-form";

export default function SignInPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-brand-dark">Sign In</CardTitle>
        <CardDescription className="text-brand-dark">
          Enter your email and password to sign in to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <SignInForm />
          <p className="text-center text-sm text-brand-dark">
            Don't have an account?{" "}
            <Link href="/signup" className="text-brand-dark font-semibold hover:text-brand-light transition">
              Sign up
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
