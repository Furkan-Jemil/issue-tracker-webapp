import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LogoutPage() {
  return (
    <div className="mx-auto flex w-full max-w-md items-center justify-center px-4 py-8 md:py-14">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Sign Out</CardTitle>
          <CardDescription>
            End your current session and return to login.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action="/api/auth/sign-out" method="post" className="space-y-4">
            <input type="hidden" name="callbackURL" value="/login" />
            <Button type="submit" className="w-full">
              Sign Out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
