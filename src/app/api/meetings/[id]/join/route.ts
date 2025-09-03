import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const joinMeetingSchema = z.object({
  role: z.enum(["spv", "reviewer", "participant"]),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const body = await request.json();
    const validatedData = joinMeetingSchema.parse(body);

    // Check if user is already a participant
    const existingParticipant = await prisma.meetingParticipant.findUnique({
      where: {
        meetingId_userId: {
          meetingId: resolvedParams.id,
          userId: session.user.id,
        },
      },
    });

    if (existingParticipant) {
      return NextResponse.json(
        { error: "Already a participant in this meeting" },
        { status: 400 }
      );
    }

    // Add user as participant
    const participant = await prisma.meetingParticipant.create({
      data: {
        meetingId: resolvedParams.id,
        userId: session.user.id,
        role: validatedData.role,
      },
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
    });

    return NextResponse.json({
      success: true,
      data: participant,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error joining meeting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
