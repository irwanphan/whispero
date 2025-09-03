"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import { useQuery } from "@tanstack/react-query";
import { IconArrowLeft, IconPlus, IconCalendar, IconUser, IconSquareCheck, IconFileText } from "@tabler/icons-react";
import { formatDateTime, getStatusColor, getRoleColor } from "@/lib/utils";

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

async function fetchTTFU(id: string) {
  const response = await fetch(`/api/ttfu/${id}`);
  if (!response.ok) throw new Error("Failed to fetch TTFU");
  return response.json();
}

export default function TTFUDetail({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const resolvedParams = use(params);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  const { data: ttfuData, isLoading, error } = useQuery({
    queryKey: ["ttfu", resolvedParams.id],
    queryFn: () => fetchTTFU(resolvedParams.id),
  });

  const ttfu: TTFU = ttfuData?.data;

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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error loading TTFU</p>
        </div>
      </div>
    );
  }

  if (!ttfu) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">TTFU not found</p>
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
              onClick={() => router.push(`/meetings/${ttfu.meeting.id}`)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mr-4"
            >
              <IconArrowLeft className="h-4 w-4" />
              <span>Back to Meeting</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">TTFU Details</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* TTFU Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{ttfu.title}</h2>
              <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(ttfu.status)}`}>
                {ttfu.status}
              </span>
            </div>

            {ttfu.description && (
              <p className="text-gray-600 mb-4">{ttfu.description}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <IconCalendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  Due: {ttfu.dueDate ? formatDateTime(ttfu.dueDate) : "No due date"}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <IconUser className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  Assignee: {ttfu.assignee.name}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <IconSquareCheck className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  Reviewer: {ttfu.reviewer.name}
                </span>
              </div>
            </div>
          </div>

          {/* Meeting Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Related Meeting</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{ttfu.meeting.title}</p>
                <p className="text-sm text-gray-600">{formatDateTime(ttfu.meeting.date)}</p>
              </div>
              <button
                onClick={() => router.push(`/meetings/${ttfu.meeting.id}`)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                View Meeting
              </button>
            </div>
          </div>

          {/* Evidences */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Evidences</h3>
              <button
                onClick={() => router.push(`/ttfu/${ttfu.id}/evidence/new`)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <IconPlus className="h-4 w-4" />
                <span>Add Evidence</span>
              </button>
            </div>

            {ttfu.evidences.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No evidences submitted yet</p>
            ) : (
              <div className="space-y-4">
                {ttfu.evidences.map((evidence) => (
                  <div key={evidence.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <IconFileText className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{evidence.type}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        by {evidence.submittedBy.name}
                      </span>
                    </div>
                    
                    {evidence.description && (
                      <p className="text-gray-600 text-sm mb-2">{evidence.description}</p>
                    )}

                    {evidence.url && (
                      <a
                        href={evidence.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View Evidence
                      </a>
                    )}

                    {/* Reviews */}
                    {evidence.reviews.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Reviews</h4>
                        <div className="space-y-2">
                          {evidence.reviews.map((review) => (
                            <div key={review.id} className="flex items-start space-x-2">
                              <span className={`px-2 py-1 text-xs rounded ${getStatusColor(review.status)}`}>
                                {review.status}
                              </span>
                              <span className="text-sm text-gray-600">
                                by {review.reviewer.name}
                              </span>
                              {review.comment && (
                                <span className="text-sm text-gray-500">- {review.comment}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
