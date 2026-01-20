import { NextRequest, NextResponse } from 'next/server';
import { FormService } from '@/services/formService';
import { getCurrentUser } from '@/lib/auth/jwt';
import { EventService } from '@/services/eventService';

// GET /api/events/[eventId]/form - Get form schema
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const form = await FormService.getFormByEventId(params.eventId);

    if (!form) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Form not found for this event',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { form },
    });
  } catch (error) {
    console.error('Get form error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to fetch form',
        },
      },
      { status: 500 }
    );
  }
}

// PUT /api/events/[eventId]/form - Create or update form
export async function PUT(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    // Check permission
    const event = await EventService.getEventById(params.eventId);

    if (
      currentUser.role !== 'admin' &&
      event.coordinators.find((coordinator) => coordinator.toString() !== currentUser.userId)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to edit this form',
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate fields array
    if (!body.fields || !Array.isArray(body.fields) || body.fields.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Form must have at least one field',
          },
        },
        { status: 400 }
      );
    }

    const result = await FormService.upsertForm(params.eventId, body.fields);

    return NextResponse.json({
      success: true,
      data: result,
      message: result.warning || 'Form saved successfully',
    });
  } catch (error) {
    console.error('Upsert form error:', error);
    const message = error instanceof Error ? error.message : "Failed to save form"
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message
        },
      },
      { status: 500 }
    );
  }
}