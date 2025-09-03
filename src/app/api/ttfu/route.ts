import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createTTFUSchema = z.object({
  meetingId: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  assigneeId: z.string(),
  reviewerId: z.string(),
  dueDate: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
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

    const where: any = {};
    
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
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createTTFUSchema.parse(body);

    const ttfu = await prisma.tTFU.create({
      data: {
        meetingId: validatedData.meetingId,
        title: validatedData.title,
        description: validatedData.description,
        assigneeId: validatedData.assigneeId,
        reviewerId: validatedData.reviewerId,
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
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating TTFU:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
