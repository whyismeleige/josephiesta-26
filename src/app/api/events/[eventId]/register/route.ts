
import { NextRequest, NextResponse } from 'next/server';
import { RegistrationService } from '@/services/registrationService';

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const body = await request.json();

    if (!body.formData || typeof body.formData !== 'object') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid form data',
          },
        },
        { status: 400 }
      );
    }

    const registration = await RegistrationService.createRegistration(
      params.eventId,
      body.formData
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          registration: {
            registrationId: registration.registrationId,
            eventId: registration.eventId,
            status: registration.status,
            submittedAt: registration.submittedAt,
          },
        },
        message: 'Registration successful! Check your email for confirmation.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    const message = error instanceof Error ? error.message : "Failed to process registration"
    // Handle validation errors
    if (message.startsWith('{')) {
      try {
        const validationErrors = JSON.parse(message);
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Please check your form inputs',
              details: validationErrors,
            },
          },
          { status: 400 }
        );
      } catch (e) {
        // Not JSON, continue
      }
    }

    // Handle business logic errors
    if (
      message.includes('not open') ||
      message.includes('deadline') ||
      message.includes('capacity') ||
      message.includes('already registered')
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'REGISTRATION_CLOSED',
            message
          },
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to process registration',
        },
      },
      { status: 500 }
    );
  }
}
