import { useState } from "react";

const NOTIFS = [
  { id: 1, title: "Deal moved to Negotiation", desc: "Acme Corp moved by Sarah Mitchell", time: "2 min ago", read: false },
  { id: 2, title: "New lead assigned to you", desc: "TechCorp Solutions — Score: 92", time: "18 min ago", read: false },
  { id: 3, title: "Task overdue", desc: "Follow up with Initech Ltd. was due yesterday", time: "1 hr ago", read: false },
  { id: 4, title: "Contact updated", desc: "Robert Chen's information was updated", time: "3 hr ago", read: true },
  { id: 5, title: "Deal closed", desc: "Globex Corp — $48,500 closed by Alex Monroe", time: "Yesterday", read: true },
];

export function NotificationsPage() {
  const [list, setList] = useState(NOTIFS);
  return (
    <div className="space-y-5 max-w-2xl pb-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Notifications</h1>
        <button onClick={() => setList(p => p.map(n => ({ ...n, read: true })))} className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Mark all as read</button>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm overflow-hidden divide-y divide-slate-50 dark:divide-slate-700/40">
        {list.map(n => (
          <div
            key={n.id}
            onClick={() => setList(p => p.map(x => x.id === n.id ? { ...x, read: true } : x))}
            className={`flex items-start gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer ${!n.read ? "bg-indigo-50/50 dark:bg-indigo-950/15" : ""}`}
          >
            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!n.read ? "bg-indigo-500" : "bg-transparent"}`} />
            <div className="flex-1">
              <p className={`text-sm text-slate-900 dark:text-white leading-snug ${!n.read ? "font-semibold" : "font-medium"}`}>{n.title}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{n.desc}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{n.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
