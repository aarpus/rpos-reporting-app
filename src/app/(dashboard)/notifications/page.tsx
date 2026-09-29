import {
  LuBadgeDollarSign,
  LuBell,
  LuMail,
  LuReceiptText,
} from "react-icons/lu";

const notifications = [
  {
    title: "New message arrived",
    description: "Elsie McElroy sent you a new message.",
    time: "5h ago",
    icon: LuMail,
    unread: true,
  },
  {
    title: "Transaction approved",
    description: "The payment of $75.00 was completed successfully.",
    time: "10h ago",
    icon: LuBadgeDollarSign,
    unread: true,
  },
  {
    title: "Upcoming bill",
    description: "Invoice EST-INV012 is due in three days.",
    time: "12h ago",
    icon: LuReceiptText,
    unread: false,
  },
] as const;

export default function NotificationsPage() {
  return (
    <div className="space-y-6 px-3 py-6 sm:px-5 lg:px-6">
      <div>
        <p className="text-sm font-medium text-primary-500">Updates</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-text-primary sm:text-[28px]">
          Notifications
        </h1>
        <p className="mt-2 text-sm text-text-tertiary">
          Keep up with account activity and important reminders.
        </p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-card-border bg-card-surface-area shadow-xs">
        <div className="flex items-center gap-3 border-b border-card-border px-4 py-4 sm:px-5">
          <span className="grid size-10 place-items-center rounded-xl bg-badge-primary-background text-badge-primary-icon-color">
            <LuBell className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-semibold text-text-primary">Recent activity</h2>
            <p className="text-xs text-text-tertiary">2 unread notifications</p>
          </div>
        </div>

        <ul className="divide-y divide-card-border">
          {notifications.map(({ title, description, time, icon: Icon, unread }) => (
            <li key={title} className="flex gap-3 px-4 py-4 sm:gap-4 sm:px-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-full border border-card-border bg-background-gray-secondary text-icon-secondary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
                  <span className="shrink-0 text-xs text-text-tertiary">{time}</span>
                </div>
                <p className="mt-1 text-sm leading-5 text-text-secondary">{description}</p>
              </div>
              {unread && (
                <span className="mt-2 size-2 shrink-0 rounded-full bg-primary-500" aria-label="Unread" />
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
