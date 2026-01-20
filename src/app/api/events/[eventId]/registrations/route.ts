import { NextRequest, NextResponse } from "next/server";
import { RegistrationService } from "@/services/registrationService";
import { getCurrentUser } from "@/lib/auth/jwt";
import { EventService } from "@/services/eventService";

export async function GET(
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
        (coordinator) => coordinator.toString() !== currentUser.userId,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You do not have permission to view registrations",
          },
        },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);

    const filters = {
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    };

    const result = await RegistrationService.getRegistrations(
      params.eventId,
      filters,
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get registrations error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Failed to fetch registrations",
        },
      },
      { status: 500 },
    );
  }
}
