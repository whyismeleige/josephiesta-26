import connectDB from '@/lib/db/mongodb';
import { Event, Registration, Form, Sheet } from '@/lib/models';
import { createGoogleSheet } from '@/lib/api/googleSheets';

export class EventService {
  /**
   * Get all events with filters
   */
  static async getEvents(filters: {
    status?: string;
    category?: string;
    search?: string;
    coordinatorId?: string;
    page?: number;
    limit?: number;
  }) {
    await connectDB();

    const query: any = {};

    // Apply filters
    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.coordinatorId) {
      query.coordinatorId = filters.coordinatorId;
    }

    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    // Execute query
    const [events, total] = await Promise.all([
      Event.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Event.countDocuments(query),
    ]);

    return {
      events,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single event by ID
   */
  static async getEventById(eventId: string) {
    await connectDB();

    const event = await Event.findById(eventId).lean();

    if (!event) {
      throw new Error('Event not found');
    }

    return event;
  }

  /**
   * Create new event
   */
  static async createEvent(eventData: any, coordinatorId: string) {
    await connectDB();

    const event = await Event.create({
      ...eventData,
      coordinatorId,
      status: 'draft',
      hasForm: false,
      stats: {
        totalRegistrations: 0,
        pendingRegistrations: 0,
        approvedRegistrations: 0,
        rejectedRegistrations: 0,
      },
    });

    return event;
  }

  /**
   * Update event
   */
  static async updateEvent(eventId: string, updateData: any) {
    await connectDB();

    const event = await Event.findByIdAndUpdate(
      eventId,
      { $set: { ...updateData, updatedAt: new Date() } },
      { new: true, runValidators: true }
    );

    if (!event) {
      throw new Error('Event not found');
    }

    return event;
  }

  /**
   * Delete event (only if draft and no registrations)
   */
  static async deleteEvent(eventId: string) {
    await connectDB();

    const event = await Event.findById(eventId);

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.status !== 'draft') {
      throw new Error('Cannot delete published event');
    }

    const registrationCount = await Registration.countDocuments({ eventId });

    if (registrationCount > 0) {
      throw new Error('Cannot delete event with registrations');
    }

    // Delete associated form
    await Form.deleteMany({ eventId });

    // Delete event
    await Event.findByIdAndDelete(eventId);

    return { success: true };
  }

  /**
   * Publish event (creates Google Sheet)
   */
  static async publishEvent(eventId: string) {
    await connectDB();

    const event = await Event.findById(eventId);

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.status !== 'draft') {
      throw new Error('Event is already published');
    }

    // Check if form exists
    const form = await Form.findOne({ eventId, isActive: true });

    if (!form) {
      throw new Error('Please create a registration form before publishing');
    }

    // Create Google Sheet
    try {
      const sheetData = await createGoogleSheet(eventId.toString(), event.name, form.fields);

      // Update event
      event.status = 'published';
      event.publishedAt = new Date();
      event.sheetId = sheetData.sheetId;
      
      await event.save();

      // Create sheet record
      await Sheet.create({
        eventId,
        sheetId: sheetData.sheetId,
        sheetUrl: sheetData.sheetUrl,
        columnMapping: sheetData.columnMapping,
        lastSyncStatus: 'success',
        totalRowsSynced: 0,
        failedSyncCount: 0,
      });

      return event;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Creation Error";
      throw new Error(`Failed to create Google Sheet: ${message}`);
    }
  }

  /**
   * Close registrations
   */
  static async closeRegistrations(eventId: string) {
    await connectDB();

    const event = await Event.findByIdAndUpdate(
      eventId,
      {
        $set: {
          status: 'closed',
          closedAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!event) {
      throw new Error('Event not found');
    }

    return event;
  }

  /**
   * Check if registrations should auto-close
   */
  static async autoCloseRegistrations() {
    await connectDB();

    const now = new Date();

    // Close events past deadline
    await Event.updateMany(
      {
        status: 'published',
        registrationDeadline: { $lt: now },
      },
      {
        $set: {
          status: 'closed',
          closedAt: now,
        },
      }
    );

    // Close events at capacity
    const events = await Event.find({
      status: 'published',
      maxCapacity: { $ne: null },
    });

    for (const event of events) {
      if (event.stats.totalRegistrations >= event.maxCapacity!) {
        event.status = 'closed';
        event.closedAt = now;
        await event.save();
      }
    }
  }
}