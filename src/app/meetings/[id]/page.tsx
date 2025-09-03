"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus, Calendar, Users, CheckSquare } from "lucide-react";
import { formatDateTime, getStatusColor, getRoleColor } from "@/lib/utils";

interface Meeting {
  id: string;
  title: string;
  date: string;
  notes?: string;
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
    title: string;
    description?: string;
    status: string;
    dueDate?: string;
    assignee: {
      id: string;
      name: string;
      globalRole: string;
    };
    reviewer: {
      id: string;
      name: string;
      globalRole: string;
    };
    evidences: Array<{
      id: string;
      type: string;
      description?: string;
      createdAt: string;
    }>;
  }>;
}

async function fetchMeeting(id: string) {
  const response = await fetch(`/api/meetings/${id}`);
  if (!response.ok) throw new Error("Failed to fetch meeting");
  return response.json();
}

export default function MeetingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const resolvedParams = use(params);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  const { data: meetingData, isLoading, error } = useQuery({
    queryKey: ["meeting", resolvedParams.id],
    queryFn: () => fetchMeeting(resolvedParams.id),
  });

  const meeting: Meeting = meetingData?.data;

  const getFilteredTTFUs = () => {
    if (!meeting) return [];
    if (activeTab === "all") return meeting.ttfus;
    return meeting.ttfus.filter(ttfu => ttfu.status === activeTab);
  };

  const getStatusCount = (status: string) => {
    if (!meeting) return 0;
    return meeting.ttfus.filter(ttfu => ttfu.status === status).length;
  };

  if (status === "loading" || isLoading) {
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error loading meeting</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 text-blue-600 hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Meeting not found</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 text-blue-600 hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mr-4"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{meeting.title}</h1>
              <p className="text-sm text-gray-600">
                {formatDateTime(meeting.date)} • Created by {meeting.createdBy.name}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Meeting Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Meeting Details</h2>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{formatDateTime(meeting.date)}</span>
                </div>
                
                {meeting.notes && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Notes</h3>
                    <p className="text-sm text-gray-600">{meeting.notes}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Participants</h3>
                  <div className="space-y-2">
                    {meeting.participants.map((participant) => (
                      <div key={participant.id} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{participant.user.name}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(participant.role)}`}>
                          {participant.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TTFUs */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">TTFUs</h2>
                  <button
                    onClick={() => router.push(`/meetings/${meeting.id}/ttfu/new`)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add TTFU</span>
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex space-x-8">
                  {[
                    { key: "all", label: "All", count: meeting.ttfus.length },
                    { key: "OPEN", label: "Open", count: getStatusCount("OPEN") },
                    { key: "IN_PROGRESS", label: "In Progress", count: getStatusCount("IN_PROGRESS") },
                    { key: "DONE", label: "Done", count: getStatusCount("DONE") },
                    { key: "REJECTED", label: "Rejected", count: getStatusCount("REJECTED") },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                        activeTab === tab.key
                          ? "bg-blue-100 text-blue-700"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* TTFU List */}
              <div className="divide-y divide-gray-200">
                {getFilteredTTFUs().length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-gray-600">No TTFUs found</p>
                  </div>
                ) : (
                  getFilteredTTFUs().map((ttfu) => (
                    <div
                      key={ttfu.id}
                      className="p-6 hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/ttfu/${ttfu.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">{ttfu.title}</h3>
                          {ttfu.description && (
                            <p className="mt-1 text-sm text-gray-600">{ttfu.description}</p>
                          )}
                          <div className="mt-3 flex items-center space-x-6 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Assignee:</span> {ttfu.assignee.name}
                            </div>
                            <div>
                              <span className="font-medium">Reviewer:</span> {ttfu.reviewer.name}
                            </div>
                            {ttfu.dueDate && (
                              <div>
                                <span className="font-medium">Due:</span> {formatDateTime(ttfu.dueDate)}
                              </div>
                            )}
                            <div>
                              <span className="font-medium">Evidence:</span> {ttfu.evidences.length}
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(ttfu.status)}`}>
                            {ttfu.status.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
