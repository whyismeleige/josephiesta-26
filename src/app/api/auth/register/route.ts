import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Coordinator } from '@/lib/models';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';
import { getCurrentUser } from '@/lib/auth/jwt';
import { registerSchema } from '@/lib/validation/authSchema';

export async function POST(request: NextRequest) {
    try {
        // Check if user is authenticated and is admin
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

        if (currentUser.role !== 'admin') {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'Only administrators can create coordinator accounts',
                    },
                },
                { status: 403 }
            );
        }

        // Parse request body
        const body = await request.json();

        // Validate input
        const validation = registerSchema.safeParse(body);
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

        const { name, email, password, role } = validation.data;

        // Validate password strength
        const passwordValidation = validatePasswordStrength(password);
        if (!passwordValidation.isValid) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'WEAK_PASSWORD',
                        message: 'Password does not meet requirements',
                        details: passwordValidation.errors,
                    },
                },
                { status: 400 }
            );
        }

        // Connect to database
        await connectDB();

        // Check if email already exists
        const existingCoordinator = await Coordinator.findOne({ email });
        if (existingCoordinator) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'DUPLICATE_EMAIL',
                        message: 'A coordinator with this email already exists',
                    },
                },
                { status: 409 }
            );
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create coordinator
        const coordinator = await Coordinator.create({
            name,
            email,
            password: hashedPassword,
            role,
            assignedEventIds: [],
            isActive: true,
        });

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
                        createdAt: coordinator.createdAt,
                    },
                },
                message: 'Coordinator account created successfully',
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Register error:', error);

        // Handle Mongoose duplicate key error
        if ((error as any).code === 11000) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'DUPLICATE_EMAIL',
                        message: 'A coordinator with this email already exists',
                    },
                },
                { status: 409 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'SERVER_ERROR',
                    message: 'An error occurred during registration',
                },
            },
            { status: 500 }
        );
    }
}
