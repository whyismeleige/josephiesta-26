import { NextRequest, NextResponse } from "next/server";
import { EventService } from "@/services/eventService";
import { getCurrentUser } from "@/lib/auth/jwt";
import { z } from "zod";

// GET /api/events - List all events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const currentUser = await getCurrentUser();

    // Parse query parameters
    const filters = {
      status: searchParams.get("status") || undefined,
      category: searchParams.get("category") || undefined,
      search: searchParams.get("search") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
      coordinatorId: undefined as string | undefined,
    };

    // If not admin, show only assigned events or published events
    if (currentUser && currentUser.role !== "admin") {
      filters.coordinatorId = currentUser.userId;
    } else if (!currentUser) {
      // Public users only see published events
      filters.status = "published";
    }

    const result = await EventService.getEvents(filters);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get events error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch events";
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

// POST /api/events - Create event (Admin only)
export async function POST(request: NextRequest) {
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

    if (currentUser.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only administrators can create events",
          },
        },
        { status: 403 },
      );
    }

    const body = await request.json();

    // Validation schema
    const eventSchema = z.object({
      name: z.string().min(3).max(200),
      description: z.string().min(10).max(5000),
      category: z.enum(["technical", "cultural", "arts", "sports", "other"]),
      eventDate: z.string().or(z.date()),
      eventTime: z.string(),
      venue: z.string().max(200),
      registrationDeadline: z.string().or(z.date()),
      maxCapacity: z.number().positive().optional().nullable(),
      requiresApproval: z.boolean().optional().default(false),
      coordinatorId: z.string(),
      coordinatorContact: z.object({
        email: z.string().email(),
        phone: z.string().optional().nullable(),
      }),
      rules: z.string(),
      prizes: z.string().optional().nullable(),
      bannerUrl: z.string().url().optional().nullable(),
    });

    const validation = eventSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            details: validation.error.flatten().fieldErrors,
          },
        },
        { status: 400 },
      );
    }

    const event = await EventService.createEvent(
      validation.data,
      validation.data.coordinatorId,
    );

    return NextResponse.json(
      {
        success: true,
        data: { event },
        message: "Event created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create event error:", error);
    const message = error instanceof Error ? error.message : "Failed to create event";
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
