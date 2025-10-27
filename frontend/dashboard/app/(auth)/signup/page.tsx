import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignUpForm } from "@/components/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-brand-dark">Create Account</CardTitle>
        <CardDescription className="text-brand-dark">
          Enter your details below to create a new account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <SignUpForm />
          <p className="text-center text-sm text-brand-dark">
            Already have an account?{" "}
            <Link href="/signin" className="text-brand-dark font-semibold hover:text-brand-light transition">
              Sign in
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
