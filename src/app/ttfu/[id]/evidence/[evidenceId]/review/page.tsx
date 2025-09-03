"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { IconArrowLeft, IconCheck, IconX, IconRefresh } from "@tabler/icons-react";

const createReviewSchema = z.object({
  status: z.enum(["approved", "rejected", "needs_revision"]),
  comment: z.string().optional(),
});

type CreateReviewForm = z.infer<typeof createReviewSchema>;

export default function ReviewEvidence({ 
  params 
}: { 
  params: Promise<{ id: string; evidenceId: string }> 
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const resolvedParams = use(params);

  // Fetch TTFU and evidence details
  const { data: ttfu, isLoading: ttfuLoading } = useQuery({
    queryKey: ["ttfu", resolvedParams.id],
    queryFn: async () => {
      const response = await fetch(`/api/ttfu/${resolvedParams.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch TTFU");
      }
      return response.json();
    },
  });

  // Find the specific evidence
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const evidence = ttfu?.data?.evidences?.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (e: any) => e.id === resolvedParams.evidenceId
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CreateReviewForm>({
    resolver: zodResolver(createReviewSchema),
    defaultValues: {
      status: "approved",
      comment: "",
    },
  });

  const selectedStatus = watch("status");

  const onSubmit = async (data: CreateReviewForm) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/ttfu/${resolvedParams.id}/evidence/${resolvedParams.evidenceId}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await response.json();
        // Invalidate TTFU query to refresh the data
        queryClient.invalidateQueries({ queryKey: ["ttfu", resolvedParams.id] });
        router.push(`/ttfu/${resolvedParams.id}`);
      } else {
        const errorData = await response.json();
        console.error("Review creation error:", errorData);
        
        if (response.status === 503) {
          alert("Database connection error. Please try again later.");
        } else if (response.status === 403) {
          alert(errorData.error || "You don't have permission to review this evidence");
        } else {
          alert(errorData.error || "Failed to create review");
        }
      }
    } catch (error) {
      console.error("Review creation error:", error);
      alert("An error occurred while creating the review");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading" || ttfuLoading) {
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

  if (!ttfu?.data || !evidence) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Evidence not found</p>
        </div>
      </div>
    );
  }

  // Check if user is reviewer or admin
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canReview = (session?.user as any)?.globalRole === "REVIEWER" || (session?.user as any)?.globalRole === "ADMIN";

  if (!canReview) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">You don&apos;t have permission to review this evidence</p>
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
              onClick={() => router.push(`/ttfu/${resolvedParams.id}`)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mr-4"
            >
              <IconArrowLeft className="h-4 w-4" />
              <span>Back to TTFU</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Review Evidence</h1>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* TTFU Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">TTFU: {ttfu.data.title}</h2>
          <p className="text-sm text-gray-600">{ttfu.data.description}</p>
        </div>

        {/* Evidence Details */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Evidence Details</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-700">Type:</span>
              <span className="ml-2 text-sm text-gray-900 capitalize">{evidence.type}</span>
            </div>
            
            {evidence.description && (
              <div>
                <span className="text-sm font-medium text-gray-700">Description:</span>
                <p className="mt-1 text-sm text-gray-900">{evidence.description}</p>
              </div>
            )}

            {evidence.url && (
              <div>
                <span className="text-sm font-medium text-gray-700">Link:</span>
                <a
                  href={evidence.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  View Evidence
                </a>
              </div>
            )}

            <div>
              <span className="text-sm font-medium text-gray-700">Submitted by:</span>
              <span className="ml-2 text-sm text-gray-900">{evidence.submittedBy.name}</span>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-700">Submitted on:</span>
              <span className="ml-2 text-sm text-gray-900">
                {new Date(evidence.createdAt).toLocaleDateString()} at {new Date(evidence.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>

        {/* Review Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Review Decision</h3>
          
          <div className="space-y-6">
            {/* Review Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Review Status *
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const form = document.querySelector('form');
                    if (form) {
                      const statusInput = form.querySelector('input[name="status"]') as HTMLInputElement;
                      if (statusInput) statusInput.value = "approved";
                    }
                  }}
                  className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-md border ${
                    selectedStatus === "approved"
                      ? "bg-green-50 border-green-500 text-green-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <IconCheck className="h-4 w-4" />
                  <span>Approve</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    const form = document.querySelector('form');
                    if (form) {
                      const statusInput = form.querySelector('input[name="status"]') as HTMLInputElement;
                      if (statusInput) statusInput.value = "needs_revision";
                    }
                  }}
                  className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-md border ${
                    selectedStatus === "needs_revision"
                      ? "bg-yellow-50 border-yellow-500 text-yellow-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <IconRefresh className="h-4 w-4" />
                  <span>Needs Revision</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    const form = document.querySelector('form');
                    if (form) {
                      const statusInput = form.querySelector('input[name="status"]') as HTMLInputElement;
                      if (statusInput) statusInput.value = "rejected";
                    }
                  }}
                  className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-md border ${
                    selectedStatus === "rejected"
                      ? "bg-red-50 border-red-500 text-red-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <IconX className="h-4 w-4" />
                  <span>Reject</span>
                </button>
              </div>
              
              <input
                {...register("status")}
                type="hidden"
                name="status"
              />
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
              )}
            </div>

            {/* Review Comment */}
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
                Review Comment (Optional)
              </label>
              <textarea
                {...register("comment")}
                id="comment"
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Provide feedback or comments about this evidence..."
              />
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Review Guidelines</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• <strong>Approve:</strong> Evidence meets requirements and is acceptable</p>
                <p>• <strong>Needs Revision:</strong> Evidence needs modifications before approval</p>
                <p>• <strong>Reject:</strong> Evidence does not meet requirements</p>
                <p>• <strong>Comment:</strong> Provide specific feedback to help improve the evidence</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 mt-8">
            <button
              type="button"
              onClick={() => router.push(`/ttfu/${resolvedParams.id}`)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
