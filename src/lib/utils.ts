import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateRange(startTime: Date | string, endTime: Date | string) {
  const start = formatTime(startTime);
  const end = formatTime(endTime);
  return `${start} - ${end}`;
}

export function getStatusColor(status: string) {
  switch (status) {
    case "OPEN":
      return "bg-gray-100 text-gray-800";
    case "IN_PROGRESS":
      return "bg-yellow-100 text-yellow-800";
    case "DONE":
      return "bg-green-100 text-green-800";
    case "REJECTED":
      return "bg-red-100 text-red-800";
    case "approved":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    case "needs_revision":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getRoleColor(role: string) {
  switch (role) {
    case "ADMIN":
      return "bg-purple-100 text-purple-800";
    case "SPV":
      return "bg-blue-100 text-blue-800";
    case "REVIEWER":
      return "bg-orange-100 text-orange-800";
    case "USER":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
