import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const meeting = await prisma.meeting.findUnique({
      where: {
        id: resolvedParams.id,
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
        ttfus: {
          include: {
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
              select: {
                id: true,
                type: true,
                description: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: "Meeting not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: meeting,
    });
  } catch (error) {
    console.error("Error fetching meeting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
