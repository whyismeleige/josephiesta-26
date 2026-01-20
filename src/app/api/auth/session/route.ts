import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Coordinator } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth/jwt';

export async function GET() {
  try {
    // Get current user from JWT
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: true,
          authenticated: false,
          coordinator: null,
        },
        { status: 200 }
      );
    }

    // Connect to database
    await connectDB();

    // Fetch fresh coordinator data
    const coordinator = await Coordinator.findById(currentUser.userId).select('-password');

    if (!coordinator || !coordinator.isActive) {
      return NextResponse.json(
        {
          success: true,
          authenticated: false,
          coordinator: null,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        authenticated: true,
        coordinator: {
          _id: coordinator._id,
          name: coordinator.name,
          email: coordinator.email,
          role: coordinator.role,
          assignedEventIds: coordinator.assignedEventIds,
          isActive: coordinator.isActive,
          lastLogin: coordinator.lastLogin,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'An error occurred while checking session',
        },
      },
      { status: 500 }
    );
  }
}