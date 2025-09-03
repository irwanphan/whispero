import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createMeetingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.string().datetime(),
  notes: z.string().optional(),
  participants: z.array(z.object({
    userId: z.string(),
    role: z.enum(["spv", "reviewer", "participant"])
  }))
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (fromDate && toDate) {
      where.date = {
        gte: new Date(fromDate),
        lte: new Date(toDate),
      };
    }

    const [meetings, total] = await Promise.all([
      prisma.meeting.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              globalRole: true,
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  globalRole: true,
                },
              },
            },
          },
          ttfus: {
            select: {
              id: true,
              status: true,
            },
          },
        },
        orderBy: {
          date: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.meeting.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: meetings,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching meetings:", error);
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
    const validatedData = createMeetingSchema.parse(body);

    const meeting = await prisma.meeting.create({
      data: {
        title: validatedData.title,
        date: new Date(validatedData.date),
        notes: validatedData.notes,
        createdById: session.user.id,
        participants: {
          create: validatedData.participants.map((participant) => ({
            userId: participant.userId,
            role: participant.role,
          })),
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            globalRole: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                globalRole: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: meeting,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating meeting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
