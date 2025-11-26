import { RegisterForm } from "@/features/auth";

export default function RegisterPage() {
  return (
    <div className="bg-background flex min-h-svh items-center justify-center p-4">
      <div className="w-full max-w-md">
        <RegisterForm />
      </div>
    </div>
  );
}
