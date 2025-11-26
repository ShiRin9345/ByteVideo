import { LoginForm } from "@/features/auth";

export default function LoginPage() {
  return (
    <div className="bg-background flex min-h-svh items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}
