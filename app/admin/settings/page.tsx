import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";

const prisma = new PrismaClient();

export default async function AdminSettingsPage() {
  const session = await getServerSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return <div className="p-8">Admin access required.</div>;
  }
  // Example: fetch settings (stub, extend as needed)
  // const settings = await prisma.setting.findMany();
  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">System Settings</h1>
      <form className="space-y-6">
        <div>
          <label className="block font-semibold mb-1">System Name</label>
          <input
            type="text"
            className="border rounded px-3 py-1 w-full"
            placeholder="Issue Tracker"
            defaultValue="Issue Tracker"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Logo URL</label>
          <input
            type="text"
            className="border rounded px-3 py-1 w-full"
            placeholder="https://..."
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">
            Allowed Registration Domains
          </label>
          <input
            type="text"
            className="border rounded px-3 py-1 w-full"
            placeholder="example.com, company.org"
          />
          <div className="text-xs text-gray-500 mt-1">
            Comma-separated. Leave blank to allow all.
          </div>
        </div>
        <div>
          <label className="block font-semibold mb-1">
            Allow New User Registration
          </label>
          <select className="border rounded px-2 py-1">
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Export Data</label>
          <button
            type="button"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={() => {
              fetch("/api/admin/export")
                .then((res) => res.blob())
                .then((blob) => {
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "issue-tracker-export.json";
                  a.click();
                  URL.revokeObjectURL(url);
                });
            }}>
            Export All Data (JSON)
          </button>
        </div>
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Save Settings
        </button>
      </form>
    </div>
  );
}
