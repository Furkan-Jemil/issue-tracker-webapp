import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <form
        action={auth.signIn}
        method="post"
        className="space-y-4 bg-white p-8 rounded shadow w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-4">Sign In</h1>
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="w-full border p-2 rounded"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          className="w-full border p-2 rounded"
        />
        <Button type="submit" className="w-full">
          Sign In
        </Button>
      </form>
    </div>
  );
}
