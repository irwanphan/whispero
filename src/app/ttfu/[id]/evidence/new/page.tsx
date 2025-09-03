"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { IconArrowLeft, IconLink } from "@tabler/icons-react";

const createEvidenceSchema = z.object({
  type: z.enum(["link", "file"]),
  url: z.string().url().optional(),
  filePath: z.string().optional(),
  description: z.string().optional(),
});

type CreateEvidenceForm = z.infer<typeof createEvidenceSchema>;

export default function NewEvidence({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const evidenceType = "link"; // Default to link only

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
  } = useForm<CreateEvidenceForm>({
    resolver: zodResolver(createEvidenceSchema),
    defaultValues: {
      type: "link",
      url: "",
      description: "",
    },
  });

  const onSubmit = async (data: CreateEvidenceForm) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/ttfu/${resolvedParams.id}/evidence`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          type: evidenceType,
        }),
      });

      if (response.ok) {
        await response.json();
        router.push(`/ttfu/${resolvedParams.id}`);
      } else {
        const errorData = await response.json();
        console.error("Evidence creation error:", errorData);
        
        if (response.status === 503) {
          alert("Database connection error. Please try again later.");
        } else {
          alert(errorData.error || "Failed to create evidence");
        }
      }
    } catch (error) {
      console.error("Evidence creation error:", error);
      alert("An error occurred while creating the evidence");
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
            <h1 className="text-2xl font-bold text-gray-900">Add Evidence</h1>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">TTFU: {ttfu.data.title}</h2>
          <p className="text-sm text-gray-600">{ttfu.data.description}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            {/* Evidence Type - Link Only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Evidence Type
              </label>
              <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 border border-blue-500 text-blue-700 rounded-md">
                <IconLink className="h-4 w-4" />
                <span>Link (Google Drive/Dropbox)</span>
              </div>
            </div>

            {/* URL Input for Link Evidence */}
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                Link URL *
              </label>
              <div className="mt-1 relative">
                <input
                  {...register("url")}
                  type="url"
                  id="url"
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 pl-10 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://drive.google.com/... or https://dropbox.com/..."
                />
                <IconLink className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              {errors.url && (
                <p className="mt-1 text-sm text-red-600">{errors.url.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Paste the sharing link from Google Drive, Dropbox, or other cloud storage
              </p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                {...register("description")}
                id="description"
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe what this evidence proves or contains..."
              />
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Evidence Guidelines</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• <strong>Link Evidence:</strong> Use Google Drive, Dropbox, or other cloud storage links</p>
                <p>• <strong>Description:</strong> Explain what the evidence proves or contains</p>
                <p>• <strong>Review Process:</strong> Evidence will be reviewed by assigned reviewers</p>
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
              {isSubmitting ? "Adding..." : "Add Evidence"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
