import Link from "next/link";
import dynamic from "next/dynamic";

const DashboardCharts = dynamic(
  () => import("@/components/dashboard/DashboardCharts"),
  { ssr: false },
);

export default function DashboardPage() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="mb-4">
        <Link href="/issues" className="text-blue-600 hover:underline">
          View All Issues
        </Link>
      </div>
      <DashboardCharts />
    </div>
  );
}
