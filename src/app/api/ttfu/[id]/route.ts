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

export async function PATCH(
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
    const body = await request.json();

    // Validate input
    const updateSchema = z.object({
      status: z.enum(["OPEN", "IN_PROGRESS", "DONE", "REJECTED"]),
      notes: z.string().optional(),
    });

    const validatedData = updateSchema.parse(body);

    // Check if TTFU exists
    const existingTTFU = await prisma.tTFU.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!existingTTFU) {
      return NextResponse.json(
        { error: "TTFU not found" },
        { status: 404 }
      );
    }

    // Update TTFU status
    const updatedTTFU = await prisma.tTFU.update({
      where: { id: resolvedParams.id },
      data: {
        status: validatedData.status,
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

    return NextResponse.json({
      success: true,
      data: updatedTTFU,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.issues);
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating TTFU:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
