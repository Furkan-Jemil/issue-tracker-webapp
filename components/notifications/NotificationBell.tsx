import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NotificationBell({ userId }: { userId: string }) {
  const [unread, setUnread] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/notifications/unread?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => setUnread(data.count || 0));
  }, [userId, pathname]);

  return (
    <Link href="/notifications" className="relative inline-block">
      <Bell className="w-6 h-6" />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs px-1.5 py-0.5">
          {unread}
        </span>
      )}
    </Link>
  );
}
