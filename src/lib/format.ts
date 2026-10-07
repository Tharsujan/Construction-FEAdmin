const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const LABELS: Record<string, string> = {
  Pending: "Pending",
  Confirmed: "Confirmed",
  OutForDelivery: "Out for delivery",
  Delivered: "Delivered",
  Cancelled: "Cancelled",
  Unpaid: "Unpaid",
  Paid: "Paid",
  Requested: "Requested",
  Active: "Active",
  Returned: "Returned",
  Available: "Available",
  Rented: "Rented",
  Maintenance: "Maintenance",
  Planned: "Planned",
  InProgress: "In progress",
  Completed: "Completed",
  OnHold: "On hold",
  Bag: "Bag",
  Ton: "Ton",
};

const CLIENT_SITE: Record<string, string> = {
  Planned: "Upcoming",
  InProgress: "Ongoing",
};

export function label(value: string) {
  return LABELS[value] ?? value;
}

export function clientSiteLabel(status: string) {
  return CLIENT_SITE[status] ?? null;
}

export function money(value: number) {
  const formatted = new Intl.NumberFormat("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `Rs ${formatted}`;
}

export function formatQty(value: number) {
  return new Intl.NumberFormat("en-LK", { maximumFractionDigits: 3 }).format(value);
}

export function formatDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  const monthName = MONTHS[Number(month) - 1] ?? month;
  return `${Number(day)} ${monthName} ${year}`;
}

export function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const monthName = MONTHS[date.getMonth()];
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${date.getDate()} ${monthName} ${date.getFullYear()}, ${hours}:${minutes}`;
}

export function todayInput() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function assignmentPhase(startDate: string, endDate: string, today = todayInput()) {
  if (endDate < today) return "Finished";
  if (startDate > today) return "Scheduled";
  return "On site";
}

export function safeNext(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.startsWith("/login")) return "/";
  return value;
}

export function errorText(error: unknown, fallback = "The request could not be completed.") {
  return error instanceof Error ? error.message : fallback;
}

export function isAdminRole(role: string) {
  return role.toLowerCase() === "admin";
}
