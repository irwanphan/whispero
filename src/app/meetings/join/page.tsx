"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { IconArrowLeft, IconUsers, IconCalendar, IconSquareCheck } from "@tabler/icons-react";
import { formatDateTime, formatDateRange } from "@/lib/utils";

interface Meeting {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
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
    status: string;
  }>;
}

async function fetchAvailableMeetings() {
  const response = await fetch("/api/meetings");
  if (!response.ok) throw new Error("Failed to fetch meetings");
  return response.json();
}

async function joinMeeting(meetingId: string, role: string) {
  const response = await fetch(`/api/meetings/${meetingId}/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ role }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to join meeting");
  }
  return response.json();
}

export default function JoinMeeting() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [joiningMeeting, setJoiningMeeting] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  const { data: meetingsData, isLoading, error, refetch } = useQuery({
    queryKey: ["available-meetings"],
    queryFn: fetchAvailableMeetings,
  });

  const meetings: Meeting[] = meetingsData?.data || [];

  const handleJoinMeeting = async (meetingId: string, role: string) => {
    setJoiningMeeting(meetingId);
    try {
      await joinMeeting(meetingId, role);
      refetch(); // Refresh the list
      alert("Successfully joined the meeting!");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to join meeting. Please try again.";
      alert(errorMessage);
    } finally {
      setJoiningMeeting(null);
    }
  };

  const isUserInMeeting = (meeting: Meeting) => {
    return meeting.participants.some(p => p.user.id === (session?.user as { id: string })?.id);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
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
          <div className="flex items-center py-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mr-4"
            >
              <IconArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Join Available Meetings</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="text-center">
            <p className="text-red-600">Error loading meetings</p>
          </div>
        ) : meetings.length === 0 ? (
          <div className="text-center">
            <p className="text-gray-600">No meetings available to join</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {meetings.map((meeting) => (
              <div key={meeting.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{meeting.title}</h3>
                    <div className="mt-2 flex items-center space-x-6 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <IconCalendar className="h-4 w-4" />
                        <span>{formatDateTime(meeting.date)} • {formatDateRange(meeting.startTime, meeting.endTime)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <IconUsers className="h-4 w-4" />
                        <span>{meeting.participants.length} participants</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <IconSquareCheck className="h-4 w-4" />
                        <span>{meeting.ttfus.length} TTFUs</span>
                      </div>
                    </div>
                    {meeting.notes && (
                      <p className="mt-2 text-sm text-gray-600">{meeting.notes}</p>
                    )}
                    <div className="mt-3">
                      <p className="text-sm text-gray-600">
                        Created by: <span className="font-medium">{meeting.createdBy.name}</span>
                      </p>
                    </div>
                  </div>
                  <div className="ml-6">
                    {isUserInMeeting(meeting) ? (
                      <div className="flex items-center space-x-2">
                        <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
                          Already Joined
                        </span>
                        <button
                          onClick={() => router.push(`/meetings/${meeting.id}`)}
                          className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                        >
                          View
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <select
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          onChange={(e) => {
                            if (e.target.value) {
                              handleJoinMeeting(meeting.id, e.target.value);
                            }
                          }}
                          disabled={joiningMeeting === meeting.id}
                        >
                          <option value="">Join as...</option>
                          <option value="participant">Participant</option>
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {(session?.user as any)?.globalRole === "manager" && (
                            <option value="reviewer">Reviewer</option>
                          )}
                        </select>
                        {joiningMeeting === meeting.id && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
