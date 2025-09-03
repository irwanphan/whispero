import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createReviewSchema = z.object({
  status: z.enum(["approved", "rejected", "needs_revision"]),
  comment: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; evidenceId: string }> }
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as { user: { id: string; globalRole: string } } | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const body = await request.json();
    const validatedData = createReviewSchema.parse(body);

    // Check if user is reviewer or admin
    if (session.user.globalRole !== "REVIEWER" && session.user.globalRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Only reviewers and admins can review evidence" },
        { status: 403 }
      );
    }

    // Check if evidence exists
    const evidence = await prisma.evidence.findUnique({
      where: { id: resolvedParams.evidenceId },
      include: {
        ttfu: {
          select: {
            id: true,
            reviewerId: true,
          },
        },
      },
    });

    if (!evidence) {
      return NextResponse.json(
        { error: "Evidence not found" },
        { status: 404 }
      );
    }

    // Check if user is the assigned reviewer for this TTFU
    if (evidence.ttfu.reviewerId !== session.user.id && session.user.globalRole !== "ADMIN") {
      return NextResponse.json(
        { error: "You are not the assigned reviewer for this TTFU" },
        { status: 403 }
      );
    }

    // Check if review already exists
    const existingReview = await prisma.review.findFirst({
      where: {
        evidenceId: resolvedParams.evidenceId,
        reviewerId: session.user.id,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this evidence" },
        { status: 400 }
      );
    }

    const review = await prisma.review.create({
      data: {
        evidenceId: resolvedParams.evidenceId,
        reviewerId: session.user.id,
        status: validatedData.status,
        comment: validatedData.comment || null,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            globalRole: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: review,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.issues);
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    // Handle database connection errors
    if (error instanceof Error && error.message.includes("Can't reach database server")) {
      console.error("Database connection error:", error.message);
      return NextResponse.json(
        { error: "Database connection error. Please try again later." },
        { status: 503 }
      );
    }

    console.error("Error creating review:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
