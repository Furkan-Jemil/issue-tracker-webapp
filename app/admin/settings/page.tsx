import prisma from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { getAppSession } from "@/lib/auth/session";
import ExportDataButton from "./ExportDataButton";



export default async function AdminSettingsPage() {
  const session = await getAppSession();
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
          <label htmlFor="system-name" className="block font-semibold mb-1">
            System Name
          </label>
          <input
            id="system-name"
            type="text"
            className="border rounded px-3 py-1 w-full"
            placeholder="Issue Tracker"
            defaultValue="Issue Tracker"
          />
        </div>
        <div>
          <label htmlFor="logo-url" className="block font-semibold mb-1">
            Logo URL
          </label>
          <input
            id="logo-url"
            type="text"
            className="border rounded px-3 py-1 w-full"
            placeholder="https://..."
          />
        </div>
        <div>
          <label
            htmlFor="registration-domains"
            className="block font-semibold mb-1">
            Allowed Registration Domains
          </label>
          <input
            id="registration-domains"
            type="text"
            className="border rounded px-3 py-1 w-full"
            placeholder="example.com, company.org"
          />
          <div className="text-xs text-gray-500 mt-1">
            Comma-separated. Leave blank to allow all.
          </div>
        </div>
        <div>
          <label
            htmlFor="allow-registration"
            className="block font-semibold mb-1">
            Allow New User Registration
          </label>
          <select id="allow-registration" className="border rounded px-2 py-1">
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Export Data</label>
          <ExportDataButton />
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
