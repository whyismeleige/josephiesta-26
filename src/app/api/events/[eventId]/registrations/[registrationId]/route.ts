
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import {Event, Registration} from "@/lib/models"

export async function GET(
  request: NextRequest,
  { params }: { params: { registrationId: string } }
) {
  try {
    await connectDB();

    const registration = await Registration.findOne({
      registrationId: params.registrationId,
    }).lean();

    if (!registration) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Registration not found',
          },
        },
        { status: 404 }
      );
    }

    const event = await Event.findById(registration.eventId).lean();

    return NextResponse.json({
      success: true,
      data: {
        registration: {
          registrationId: registration.registrationId,
          eventName: event?.name,
          eventDate: event?.eventDate,
          eventVenue: event?.venue,
          status: registration.status,
          submittedAt: registration.submittedAt,
          formData: registration.formData,
          qrCodeUrl: registration.qrCodeUrl,
        },
      },
    });
  } catch (error) {
    console.error('Registration lookup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to fetch registration',
        },
      },
      { status: 500 }
    );
  }
}