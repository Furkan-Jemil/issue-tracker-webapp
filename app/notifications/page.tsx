"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/notifications?limit=50")
      .then((res) => res.json())
      .then((data) => {
        setNotifications(data.notifications || []);
        setLoading(false);
      });
  }, []);

  async function markAllAsRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    fetch("/api/notifications?limit=50")
      .then((res) => res.json())
      .then((data) => setNotifications(data.notifications || []));
    router.refresh();
  }

  async function markOneAsRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    router.refresh();
  }

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4 flex items-center justify-between">
        Notifications
        <button
          className="ml-4 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          onClick={markAllAsRead}>
          Mark all as read
        </button>
      </h1>
      {loading ? (
        <div>Loading...</div>
      ) : notifications.length === 0 ? (
        <div>No notifications.</div>
      ) : (
        <ul>
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`mb-2 p-3 rounded flex items-center justify-between ${n.isRead ? "bg-gray-100" : "bg-blue-100"}`}>
              <div>
                <div>{n.message}</div>
                <div className="text-xs text-gray-500">
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
              {!n.isRead && (
                <button
                  className="ml-4 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                  onClick={() => markOneAsRead(n.id)}>
                  Mark as read
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
