"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import { 
  Plus, 
  Calendar, 
  Users, 
  CheckSquare, 
  LogOut,
  Search,
  Filter
} from "lucide-react";
import { formatDateTime, getStatusColor } from "@/lib/utils";

interface Meeting {
  id: string;
  title: string;
  date: string;
  createdBy: {
    id: string;
    name: string;
    globalRole: string;
  };
  participants: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      globalRole: string;
    };
    role: string;
  }>;
  ttfus: Array<{
    id: string;
    status: string;
  }>;
}

async function fetchMeetings(fromDate?: string, toDate?: string) {
  const params = new URLSearchParams();
  if (fromDate) params.append("fromDate", fromDate);
  if (toDate) params.append("toDate", toDate);
  
  const response = await fetch(`/api/meetings?${params.toString()}`);
  if (!response.ok) throw new Error("Failed to fetch meetings");
  return response.json();
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dateFilter, setDateFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  const getDateRange = () => {
    const now = new Date();
    switch (dateFilter) {
      case "today":
        return {
          fromDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(),
          toDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString(),
        };
      case "week":
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return {
          fromDate: startOfWeek.toISOString(),
          toDate: endOfWeek.toISOString(),
        };
      default:
        return {};
    }
  };

  const { data: meetingsData, isLoading, error } = useQuery({
    queryKey: ["meetings", dateFilter],
    queryFn: () => fetchMeetings(getDateRange().fromDate, getDateRange().toDate),
  });

  const meetings = meetingsData?.data || [];
  const filteredMeetings = meetings.filter((meeting: Meeting) =>
    meeting.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusCount = (meetings: Meeting[]) => {
    const counts = { open: 0, inProgress: 0, done: 0, rejected: 0 };
    meetings.forEach(meeting => {
      meeting.ttfus.forEach(ttfu => {
        switch (ttfu.status) {
          case "OPEN":
            counts.open++;
            break;
          case "IN_PROGRESS":
            counts.inProgress++;
            break;
          case "DONE":
            counts.done++;
            break;
          case "REJECTED":
            counts.rejected++;
            break;
        }
      });
    });
    return counts;
  };

  const statusCounts = getStatusCount(meetings);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">PDCA TTFU Tracker</h1>
              <p className="text-sm text-gray-600">Welcome back, {session.user?.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{session.user?.email}</span>
              <button
                onClick={() => signOut()}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Meetings</p>
                <p className="text-2xl font-bold text-gray-900">{meetings.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckSquare className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Open TTFUs</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.open}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckSquare className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.inProgress}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckSquare className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.done}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search meetings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                  </select>
                </div>
              </div>
              <button
                onClick={() => router.push("/meetings/new")}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Plus className="h-4 w-4" />
                <span>New Meeting</span>
              </button>
            </div>
          </div>
        </div>

        {/* Meetings List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Meetings</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {isLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading meetings...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <p className="text-red-600">Error loading meetings</p>
              </div>
            ) : filteredMeetings.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-600">No meetings found</p>
              </div>
            ) : (
              filteredMeetings.map((meeting: Meeting) => (
                <div
                  key={meeting.id}
                  className="p-6 hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/meetings/${meeting.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{meeting.title}</h3>
                      <div className="mt-2 flex items-center space-x-6 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDateTime(meeting.date)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{meeting.participants.length} participants</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <CheckSquare className="h-4 w-4" />
                          <span>{meeting.ttfus.length} TTFUs</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {meeting.ttfus.length > 0 && (
                        <div className="flex space-x-1">
                          {meeting.ttfus.slice(0, 3).map((ttfu, index) => (
                            <div
                              key={index}
                              className={`w-3 h-3 rounded-full ${getStatusColor(ttfu.status)}`}
                              title={ttfu.status}
                            />
                          ))}
                          {meeting.ttfus.length > 3 && (
                            <span className="text-xs text-gray-500">+{meeting.ttfus.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
