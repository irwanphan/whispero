import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createTTFUSchema = z.object({
  meetingId: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  reviewerId: z.string().optional(),
  dueDate: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as { user: { id: string } } | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const meetingId = searchParams.get("meetingId");
    const status = searchParams.get("status");
    const assigneeId = searchParams.get("assigneeId");
    const reviewerId = searchParams.get("reviewerId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    
    if (meetingId) where.meetingId = meetingId;
    if (status) where.status = status;
    if (assigneeId) where.assigneeId = assigneeId;
    if (reviewerId) where.reviewerId = reviewerId;

    const [ttfus, total] = await Promise.all([
      prisma.tTFU.findMany({
        where,
        include: {
          meeting: {
            select: {
              id: true,
              title: true,
              date: true,
            },
          },
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
              globalRole: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true,
              globalRole: true,
            },
          },
          evidences: {
            include: {
              reviews: {
                include: {
                  reviewer: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.tTFU.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: ttfus,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching TTFUs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as { user: { id: string } } | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createTTFUSchema.parse(body);

    // Get current user info for auto assignment
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, globalRole: true }
    });

    // Auto assignment logic
    let assigneeId = validatedData.assigneeId;
    let reviewerId = validatedData.reviewerId;

    if (!assigneeId || !reviewerId) {
      if (currentUser?.globalRole === "SPV" || currentUser?.globalRole === "USER") {
        // Supervisor and User become assignee
        assigneeId = currentUser.id;
        
        // Find a reviewer or admin for reviewer
        const reviewer = await prisma.user.findFirst({
          where: {
            globalRole: { in: ["REVIEWER", "ADMIN"] }
          },
          select: { id: true }
        });
        reviewerId = reviewer?.id || currentUser.id;
      } else {
        // For reviewer/admin, they can assign to themselves
        assigneeId = assigneeId || currentUser?.id || "";
        reviewerId = reviewerId || currentUser?.id || "";
      }
    }

    // Validate that we have valid IDs
    if (!assigneeId || !reviewerId) {
      return NextResponse.json(
        { error: "Unable to assign TTFU. No valid assignee or reviewer found." },
        { status: 400 }
      );
    }

    const ttfu = await prisma.tTFU.create({
      data: {
        meetingId: validatedData.meetingId,
        title: validatedData.title,
        description: validatedData.description,
        assigneeId: assigneeId!,
        reviewerId: reviewerId!,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
      },
      include: {
        meeting: {
          select: {
            id: true,
            title: true,
            date: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            globalRole: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
            globalRole: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: ttfu,
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

    console.error("Error creating TTFU:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
