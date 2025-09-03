"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { IconArrowLeft, IconCheck, IconX, IconRefresh, IconClock } from "@tabler/icons-react";

const updateTTFUStatusSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "DONE", "REJECTED"]),
  notes: z.string().optional(),
});

type UpdateTTFUStatusForm = z.infer<typeof updateTTFUStatusSchema>;

export default function UpdateTTFUStatus({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const resolvedParams = use(params);

  // Fetch TTFU details
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

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<UpdateTTFUStatusForm>({
    resolver: zodResolver(updateTTFUStatusSchema),
    defaultValues: {
      status: ttfu?.data?.status || "OPEN",
      notes: "",
    },
  });

  const selectedStatus = watch("status");

  const onSubmit = async (data: UpdateTTFUStatusForm) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/ttfu/${resolvedParams.id}`, {
        method: "PATCH",
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
        console.error("TTFU status update error:", errorData);
        alert(errorData.error || "Failed to update TTFU status");
      }
    } catch (error) {
      console.error("TTFU status update error:", error);
      alert("An error occurred while updating the TTFU status");
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

  if (!ttfu?.data) {
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
              onClick={() => router.push(`/ttfu/${resolvedParams.id}`)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mr-4"
            >
              <IconArrowLeft className="h-4 w-4" />
              <span>Back to TTFU</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Update TTFU Status</h1>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* TTFU Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">TTFU: {ttfu.data.title}</h2>
          <p className="text-sm text-gray-600">{ttfu.data.description}</p>
          <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
            <span>Assignee: {ttfu.data.assignee.name}</span>
            <span>Reviewer: {ttfu.data.reviewer.name}</span>
            <span>Due: {ttfu.data.dueDate ? new Date(ttfu.data.dueDate).toLocaleDateString() : "No due date"}</span>
          </div>
        </div>

        {/* Status Update Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Update Status</h3>
          
          <div className="space-y-6">
            {/* Status Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                TTFU Status *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const form = document.querySelector('form');
                    if (form) {
                      const statusInput = form.querySelector('input[name="status"]') as HTMLInputElement;
                      if (statusInput) statusInput.value = "OPEN";
                    }
                  }}
                  className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-md border ${
                    selectedStatus === "OPEN"
                      ? "bg-gray-50 border-gray-500 text-gray-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <IconClock className="h-4 w-4" />
                  <span>Open</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    const form = document.querySelector('form');
                    if (form) {
                      const statusInput = form.querySelector('input[name="status"]') as HTMLInputElement;
                      if (statusInput) statusInput.value = "IN_PROGRESS";
                    }
                  }}
                  className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-md border ${
                    selectedStatus === "IN_PROGRESS"
                      ? "bg-blue-50 border-blue-500 text-blue-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <IconRefresh className="h-4 w-4" />
                  <span>In Progress</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    const form = document.querySelector('form');
                    if (form) {
                      const statusInput = form.querySelector('input[name="status"]') as HTMLInputElement;
                      if (statusInput) statusInput.value = "DONE";
                    }
                  }}
                  className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-md border ${
                    selectedStatus === "DONE"
                      ? "bg-green-50 border-green-500 text-green-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <IconCheck className="h-4 w-4" />
                  <span>Done</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    const form = document.querySelector('form');
                    if (form) {
                      const statusInput = form.querySelector('input[name="status"]') as HTMLInputElement;
                      if (statusInput) statusInput.value = "REJECTED";
                    }
                  }}
                  className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-md border ${
                    selectedStatus === "REJECTED"
                      ? "bg-red-50 border-red-500 text-red-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <IconX className="h-4 w-4" />
                  <span>Rejected</span>
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

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes (Optional)
              </label>
              <textarea
                {...register("notes")}
                id="notes"
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add notes about the status update..."
              />
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Status Guidelines</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• <strong>Open:</strong> Task is created and waiting to be started</p>
                <p>• <strong>In Progress:</strong> Task is currently being worked on</p>
                <p>• <strong>Done:</strong> Task has been completed successfully</p>
                <p>• <strong>Rejected:</strong> Task has been rejected or cancelled</p>
                <p>• <strong>Note:</strong> Evidence review is separate from TTFU status</p>
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
              {isSubmitting ? "Updating..." : "Update Status"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
