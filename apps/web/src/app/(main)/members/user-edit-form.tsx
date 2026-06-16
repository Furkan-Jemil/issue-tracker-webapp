import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type UserDetails = {
  name: string | null;
  email: string;
  role: string;
};

export function UserEditForm({
  user,
  onSubmit,
}: {
  user: UserDetails;
  onSubmit: (formData: FormData) => Promise<void>;
}) {
  return (
    <Card id="edit-section">
      <CardHeader>
        <CardTitle className="text-xl">Edit User</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="user-name">Name</Label>
            <Input id="user-name" value={user.name ?? ""} readOnly />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="user-email">Email</Label>
            <Input id="user-email" value={user.email} readOnly />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role">Role</Label>
            <Select id="role" name="role" defaultValue={user.role}>
              <option value="USER">User</option>
              <option value="TESTER">Tester</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </div>
          <Button type="submit">Update Role</Button>
        </form>
      </CardContent>
    </Card>
  );
}