"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { IconArrowLeft, IconPlus } from "@tabler/icons-react";

const createTTFUSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  assigneeId: z.string().min(1, "Assignee is required"),
  reviewerId: z.string().min(1, "Reviewer is required"),
  dueDate: z.string().optional(),
});

type CreateTTFUForm = z.infer<typeof createTTFUSchema>;

interface User {
  id: string;
  name: string;
  email: string;
  globalRole: string;
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  participants: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      globalRole: string;
    };
    role: string;
  }>;
}

async function fetchMeeting(id: string) {
  const response = await fetch(`/api/meetings/${id}`);
  if (!response.ok) throw new Error("Failed to fetch meeting");
  return response.json();
}

async function fetchUsers() {
  const response = await fetch("/api/users");
  if (!response.ok) throw new Error("Failed to fetch users");
  return response.json();
}

export default function NewTTFU({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const resolvedParams = use(params);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  const { data: meetingData } = useQuery({
    queryKey: ["meeting", resolvedParams.id],
    queryFn: () => fetchMeeting(resolvedParams.id),
  });

  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const meeting: Meeting = meetingData?.data;
  const users: User[] = usersData?.data || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CreateTTFUForm>({
    resolver: zodResolver(createTTFUSchema),
    defaultValues: {
      title: "",
      description: "",
      assigneeId: "",
      reviewerId: "",
      dueDate: "",
    },
  });

  const assigneeId = watch("assigneeId");

  const onSubmit = async (data: CreateTTFUForm) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/ttfu", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          meetingId: resolvedParams.id,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        router.push(`/ttfu/${result.data.id}`);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create TTFU");
      }
    } catch (error) {
      alert("An error occurred while creating the TTFU");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
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

  if (!meeting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Meeting not found</p>
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
              onClick={() => router.push(`/meetings/${resolvedParams.id}`)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mr-4"
            >
              <IconArrowLeft className="h-4 w-4" />
              <span>Back to Meeting</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Create New TTFU</h1>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Meeting: {meeting.title}</h2>
          <p className="text-sm text-gray-600">Date: {new Date(meeting.date).toLocaleDateString()}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                TTFU Title
              </label>
              <input
                {...register("title")}
                type="text"
                id="title"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter TTFU title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description (Optional)
              </label>
              <textarea
                {...register("description")}
                id="description"
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter TTFU description..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="assigneeId" className="block text-sm font-medium text-gray-700">
                  Assignee
                </label>
                <select
                  {...register("assigneeId")}
                  id="assigneeId"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Assignee</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.globalRole})
                    </option>
                  ))}
                </select>
                {errors.assigneeId && (
                  <p className="mt-1 text-sm text-red-600">{errors.assigneeId.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="reviewerId" className="block text-sm font-medium text-gray-700">
                  Reviewer
                </label>
                <select
                  {...register("reviewerId")}
                  id="reviewerId"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Reviewer</option>
                  {users
                    .filter((user) => user.globalRole === "manager")
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} (Manager)
                      </option>
                    ))}
                </select>
                {errors.reviewerId && (
                  <p className="mt-1 text-sm text-red-600">{errors.reviewerId.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                Due Date (Optional)
              </label>
              <input
                {...register("dueDate")}
                type="date"
                id="dueDate"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 mt-8">
            <button
              type="button"
              onClick={() => router.push(`/meetings/${resolvedParams.id}`)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create TTFU"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
