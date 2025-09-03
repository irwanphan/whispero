"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { IconArrowLeft, IconEye, IconFileText, IconCalendar, IconUser } from "@tabler/icons-react";
import { formatDateTime, getStatusColor } from "@/lib/utils";

interface TTFU {
  id: string;
  title: string;
  description?: string;
  status: string;
  dueDate?: string;
  meeting: {
    id: string;
    title: string;
    date: string;
  };
  assignee: {
    id: string;
    name: string;
    email: string;
    globalRole: string;
  };
  reviewer: {
    id: string;
    name: string;
    email: string;
    globalRole: string;
  };
  evidences: Array<{
    id: string;
    type: string;
    url?: string;
    description?: string;
    submittedBy: {
      id: string;
      name: string;
      globalRole: string;
    };
    reviews: Array<{
      id: string;
      status: string;
      comment?: string;
      reviewer: {
        id: string;
        name: string;
      };
    }>;
  }>;
  createdAt: string;
  updatedAt: string;
}

async function fetchTTFUsForReview() {
  const response = await fetch("/api/ttfu");
  if (!response.ok) throw new Error("Failed to fetch TTFUs");
  return response.json();
}

export default function ReviewerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    
    // Check if user is reviewer or admin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (session?.user as any)?.globalRole;
    if (userRole !== "REVIEWER" && userRole !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [session, status, router]);

  const { data: ttfuData, isLoading } = useQuery({
    queryKey: ["ttfus-for-review"],
    queryFn: fetchTTFUsForReview,
  });

  const ttfuList: TTFU[] = ttfuData?.data || [];

  // Filter TTFUs where current user is the reviewer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (session?.user as any)?.globalRole;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session?.user as any)?.id;
  
  const assignedTTFUs = ttfuList.filter(ttfu => {
    if (userRole === "ADMIN") return true; // Admin can see all TTFUs
    return ttfu.reviewer.id === userId;
  });

  // Filter TTFUs that have evidences pending review
  const pendingReviewTTFUs = assignedTTFUs.filter(ttfu => {
    return ttfu.evidences.some(evidence => {
      // Check if current user hasn't reviewed this evidence yet
      return !evidence.reviews.some(review => review.reviewer.id === userId);
    });
  });

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

  // Check if user is reviewer or admin
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canAccess = (session?.user as any)?.globalRole === "REVIEWER" || (session?.user as any)?.globalRole === "ADMIN";
  if (!canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">You don&apos;t have permission to access this page</p>
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
              <IconArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Reviewer Dashboard</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Total Assigned TTFUs</h3>
            <p className="text-3xl font-bold text-blue-600">{assignedTTFUs.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Pending Review</h3>
            <p className="text-3xl font-bold text-yellow-600">{pendingReviewTTFUs.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Completed Reviews</h3>
            <p className="text-3xl font-bold text-green-600">{assignedTTFUs.length - pendingReviewTTFUs.length}</p>
          </div>
        </div>

        {/* TTFUs Pending Review */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">TTFUs Pending Review</h2>
            <p className="text-sm text-gray-600 mt-1">
              TTFUs with evidence that need your review
            </p>
          </div>

          {pendingReviewTTFUs.length === 0 ? (
            <div className="p-6 text-center">
              <IconFileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No TTFUs pending review</p>
              <p className="text-sm text-gray-400 mt-1">All assigned TTFUs have been reviewed</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {pendingReviewTTFUs.map((ttfu) => {
                // Find evidences that need review
                const pendingEvidences = ttfu.evidences.filter(evidence => {
                  return !evidence.reviews.some(review => review.reviewer.id === userId);
                });

                return (
                  <div key={ttfu.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-1">{ttfu.title}</h3>
                        {ttfu.description && (
                          <p className="text-gray-600 text-sm mb-2">{ttfu.description}</p>
                        )}
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <IconCalendar className="h-4 w-4" />
                            <span>Due: {ttfu.dueDate ? formatDateTime(ttfu.dueDate) : "No due date"}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <IconUser className="h-4 w-4" />
                            <span>Assignee: {ttfu.assignee.name}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <IconFileText className="h-4 w-4" />
                            <span>{pendingEvidences.length} evidence(s) pending review</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded ${getStatusColor(ttfu.status)}`}>
                          {ttfu.status}
                        </span>
                        <button
                          onClick={() => router.push(`/ttfu/${ttfu.id}`)}
                          className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          <IconEye className="h-4 w-4" />
                          <span>Review</span>
                        </button>
                      </div>
                    </div>

                    {/* Meeting Info */}
                    <div className="bg-gray-50 rounded-md p-3">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Meeting:</span> {ttfu.meeting.title} • {formatDateTime(ttfu.meeting.date)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* All Assigned TTFUs */}
        {assignedTTFUs.length > pendingReviewTTFUs.length && (
          <div className="bg-white rounded-lg shadow mt-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">All Assigned TTFUs</h2>
              <p className="text-sm text-gray-600 mt-1">
                All TTFUs assigned to you for review
              </p>
            </div>

            <div className="divide-y divide-gray-200">
              {assignedTTFUs.map((ttfu) => {
                const pendingEvidences = ttfu.evidences.filter(evidence => {
                  return !evidence.reviews.some(review => review.reviewer.id === userId);
                });

                return (
                  <div key={ttfu.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-1">{ttfu.title}</h3>
                        {ttfu.description && (
                          <p className="text-gray-600 text-sm mb-2">{ttfu.description}</p>
                        )}
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <IconCalendar className="h-4 w-4" />
                            <span>Due: {ttfu.dueDate ? formatDateTime(ttfu.dueDate) : "No due date"}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <IconUser className="h-4 w-4" />
                            <span>Assignee: {ttfu.assignee.name}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <IconFileText className="h-4 w-4" />
                            <span>{ttfu.evidences.length} evidence(s) • {pendingEvidences.length} pending</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded ${getStatusColor(ttfu.status)}`}>
                          {ttfu.status}
                        </span>
                        <button
                          onClick={() => router.push(`/ttfu/${ttfu.id}`)}
                          className="flex items-center space-x-2 bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        >
                          <IconEye className="h-4 w-4" />
                          <span>View</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
