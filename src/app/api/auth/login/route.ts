import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Coordinator } from '@/lib/models';
import { comparePassword } from '@/lib/auth/password';
import { createToken, setAuthCookie } from '@/lib/auth/jwt';
import { loginSchema } from '@/lib/validation/authSchema';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: validation.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Connect to database
    await connectDB();

    // Find coordinator by email
    const coordinator = await Coordinator.findOne({ email }).select('+password');

    if (!coordinator) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        },
        { status: 401 }
      );
    }

    // Check if coordinator is active
    if (!coordinator.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ACCOUNT_INACTIVE',
            message: 'Your account has been deactivated. Please contact administrator.',
          },
        },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, coordinator.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        },
        { status: 401 }
      );
    }

    // Update last login
    coordinator.lastLogin = new Date();
    await coordinator.save();

    // Create JWT payload
    const tokenPayload = {
      userId: coordinator._id.toString(),
      email: coordinator.email,
      role: coordinator.role,
      assignedEventIds: coordinator.assignedEventIds.map(id => id.toString()),
    };

    // Create token
    const token = createToken(tokenPayload);

    // Set cookie
    await setAuthCookie(token);

    // Return success response (without password)
    return NextResponse.json(
      {
        success: true,
        data: {
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
        message: 'Login successful',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'An error occurred during login',
        },
      },
      { status: 500 }
    );
  }
}