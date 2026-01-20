import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/jwt";
import { EventService } from "@/services/eventService";
import { batchSyncRegistrations } from "@/lib/api/googleSheets";

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } },
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        },
        { status: 401 },
      );
    }

    // Check permission
    const event = await EventService.getEventById(params.eventId);

    if (
      currentUser.role !== "admin" &&
      event.coordinators.find(
        (coordinator) => coordinator.id.toString() !== currentUser.userId,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You do not have permission to sync this sheet",
          },
        },
        { status: 403 },
      );
    }

    // Perform batch sync
    const result = await batchSyncRegistrations(params.eventId);

    return NextResponse.json({
      success: true,
      data: {
        syncStatus: result.failed === 0 ? "success" : "partial",
        totalRegistrations: result.total,
        synced: result.success,
        failed: result.failed,
      },
      message: `Synced ${result.success} of ${result.total} registrations`,
    });
  } catch (error) {
    console.error("Manual sync error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to sync sheet";
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: message,
        },
      },
      { status: 500 },
    );
  }
}
