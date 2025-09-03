import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createEvidenceSchema = z.object({
  type: z.enum(["link", "file"]),
  url: z.string().url().optional(),
  filePath: z.string().optional(),
  description: z.string().optional(),
});

export async function POST(
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
    const validatedData = createEvidenceSchema.parse(body);

    // Check if TTFU exists
    const ttfu = await prisma.tTFU.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!ttfu) {
      return NextResponse.json(
        { error: "TTFU not found" },
        { status: 404 }
      );
    }

    // Validate evidence data based on type
    if (validatedData.type === "link" && !validatedData.url) {
      return NextResponse.json(
        { error: "URL is required for link evidence" },
        { status: 400 }
      );
    }

    if (validatedData.type === "file" && !validatedData.filePath) {
      return NextResponse.json(
        { error: "File path is required for file evidence" },
        { status: 400 }
      );
    }

    const evidence = await prisma.evidence.create({
      data: {
        ttfuId: resolvedParams.id,
        type: validatedData.type,
        url: validatedData.url || null,
        filePath: validatedData.filePath || null,
        description: validatedData.description || null,
        submittedById: session.user.id,
      },
      include: {
        submittedBy: {
          select: {
            id: true,
            name: true,
            email: true,
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
    });

    return NextResponse.json({
      success: true,
      data: evidence,
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

    console.error("Error creating evidence:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
