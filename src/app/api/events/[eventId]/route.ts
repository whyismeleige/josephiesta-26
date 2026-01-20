import { NextRequest, NextResponse } from "next/server";
import { EventService } from "@/services/eventService";
import { getCurrentUser } from "@/lib/auth/jwt";

// GET /api/events/[eventId] - Get single event
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } },
) {
  try {
    const currentUser = await getCurrentUser();
    const event = await EventService.getEventById(params.eventId);

    // Check permissions
    if (event.status !== "published" && !currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Event not published",
          },
        },
        { status: 403 },
      );
    }

    if (
      event.status !== "published" &&
      currentUser &&
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
            message: "You do not have access to this event",
          },
        },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      data: { event },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch event";
    if (message === "Event not found") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message,
          },
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message,
        },
      },
      { status: 500 },
    );
  }
}

// PUT /api/events/[eventId] - Update event
export async function PUT(
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

    // Check if user has permission
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
            message: "You do not have permission to update this event",
          },
        },
        { status: 403 },
      );
    }

    const body = await request.json();

    // Update event
    const updatedEvent = await EventService.updateEvent(params.eventId, body);

    return NextResponse.json({
      success: true,
      data: { event: updatedEvent },
      message: "Event updated successfully",
    });
  } catch (error) {
    console.error("Update event error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update event";
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message,
        },
      },
      { status: 500 },
    );
  }
}

// DELETE /api/events/[eventId] - Delete event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string } },
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only administrators can delete events",
          },
        },
        { status: 403 },
      );
    }

    await EventService.deleteEvent(params.eventId);

    return NextResponse.json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Delete event error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete event";

    if (
      message.includes("Cannot delete") ||
      message === "Event not found"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message
          },
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message
        },
      },
      { status: 500 },
    );
  }
}
