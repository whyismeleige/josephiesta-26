
import connectDB from '@/lib/db/mongodb';
import { Registration, Event, Form } from '@/lib/models';
import { syncRegistrationToSheet } from '@/lib/api/googleSheets';
import { v4 as uuidv4 } from 'uuid';
import { FormService } from './formService';

export class RegistrationService {
  /**
   * Generate unique registration ID
   */
  static generateRegistrationId(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');
    return `REG-${year}-${random}`;
  }

  /**
   * Extract email, name, phone from form data
   */
  static extractQuickAccessFields(formData: any, formFields: any[]) {
    let email = null;
    let name = null;
    let phone = null;

    for (const field of formFields) {
      const value = formData[field.id];

      if (field.type === 'email' && !email) {
        email = value;
      }

      if (
        (field.label.toLowerCase().includes('name') ||
          field.label.toLowerCase().includes('team')) &&
        !name
      ) {
        name = value;
      }

      if (field.type === 'phone' && !phone) {
        phone = value;
      }
    }

    return { email, name, phone };
  }

  /**
   * Create registration
   */
  static async createRegistration(eventId: string, formData: any) {
    await connectDB();

    // Get event
    const event = await Event.findById(eventId);

    if (!event) {
      throw new Error('Event not found');
    }

    // Check if event is published and open for registration
    if (event.status !== 'published') {
      throw new Error('Event is not open for registration');
    }

    // Check deadline
    if (new Date() > event.registrationDeadline) {
      throw new Error('Registration deadline has passed');
    }

    // Check capacity
    if (event.maxCapacity && event.stats.totalRegistrations >= event.maxCapacity) {
      throw new Error('Event has reached maximum capacity');
    }

    // Get form
    const form = await Form.findOne({ eventId, isActive: true });

    if (!form) {
      throw new Error('Registration form not found');
    }

    // Validate form data
    const validation = FormService.validateFormData(formData, form.fields);

    if (!validation.isValid) {
      throw new Error(JSON.stringify(validation.errors));
    }

    // Extract quick access fields
    const { email, name, phone } = this.extractQuickAccessFields(
      formData,
      form.fields
    );

    if (!email) {
      throw new Error('Email is required');
    }

    // Check for duplicate registration
    const existingRegistration = await Registration.findOne({
      eventId,
      email,
    });

    if (existingRegistration) {
      throw new Error('You have already registered for this event');
    }

    // Generate registration ID
    const registrationId = this.generateRegistrationId();

    // Determine initial status
    const initialStatus = event.requiresApproval ? 'pending' : 'approved';

    // Create registration
    const registration = await Registration.create({
      registrationId,
      eventId,
      formData,
      email,
      name,
      phone,
      status: initialStatus,
      submittedAt: new Date(),
    });

    // Update event stats
    event.stats.totalRegistrations += 1;
    
    await event.save();

    // Sync to Google Sheets (async, don't wait)
    syncRegistrationToSheet(eventId.toString(), registration).catch((err) => {
      console.error('Sheet sync error:', err);
    });

    return registration;
  }

  /**
   * Get registrations for event
   */
  static async getRegistrations(
    eventId: string,
    filters: {
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) {
    await connectDB();

    const query: any = { eventId };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.search) {
      query.$or = [
        { email: { $regex: filters.search, $options: 'i' } },
        { name: { $regex: filters.search, $options: 'i' } },
        { phone: { $regex: filters.search, $options: 'i' } },
        { registrationId: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [registrations, total] = await Promise.all([
      Registration.find(query)
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Registration.countDocuments(query),
    ]);

    return {
      registrations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update registration status
   */
  static async updateRegistrationStatus(
    registrationId: string,
    status: 'approved' | 'rejected',
    statusNote?: string
  ) {
    await connectDB();

    const registration = await Registration.findById(registrationId);

    if (!registration) {
      throw new Error('Registration not found');
    }

    const oldStatus = registration.status;
    registration.status = status;
    registration.statusNote = statusNote || null;

    if (status === 'approved') {
      registration.approvedAt = new Date();
    } else if (status === 'rejected') {
      registration.rejectedAt = new Date();
    }

    await registration.save();

    // Update event stats
    const event = await Event.findById(registration.eventId);
    

    // Sync to Google Sheets
    syncRegistrationToSheet(
      registration.eventId.toString(),
      registration
    ).catch((err) => {
      console.error('Sheet sync error:', err);
    });

    return registration;
  }
}