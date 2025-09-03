import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as { user: { id: string } } | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;

    const ttfu = await prisma.tTFU.findUnique({
      where: {
        id: resolvedParams.id,
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
        evidences: {
          include: {
            submittedBy: {
              select: {
                id: true,
                name: true,
                globalRole: true,
              },
            },
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
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!ttfu) {
      return NextResponse.json(
        { error: "TTFU not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: ttfu,
    });
  } catch (error) {
    console.error("Error fetching TTFU:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
