import { NextRequest, NextResponse } from 'next/server';
import { EventService } from '@/services/eventService';
import { getCurrentUser } from '@/lib/auth/jwt';

export async function POST(
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
            message: 'You do not have permission to publish this event',
          },
        },
        { status: 403 }
      );
    }

    const publishedEvent = await EventService.publishEvent(params.eventId);

    return NextResponse.json({
      success: true,
      data: { event: publishedEvent },
      message: 'Event published successfully',
    });
  } catch (error) {
    console.error('Publish event error:', error);
    const message = error instanceof Error ? error.message : "Failed to publish event"
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