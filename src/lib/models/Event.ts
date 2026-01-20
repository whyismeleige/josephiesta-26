import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEvent extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  category: 'technical' | 'cultural' | 'arts' | 'sports' | 'other';
  eventDate: Date;
  eventTime: string;
  venue: string;
  registrationDeadline: Date;
  maxCapacity: number | null;
  requiresApproval: boolean;
  coordinators: {
    id: mongoose.Types.ObjectId;
    email: string;
    phone: string | null;
  }[],
  rules: string;
  prizes: string | null;
  bannerUrl: string | null;
  status: 'draft' | 'published' | 'closed' | 'completed' | 'cancelled';
  hasForm: boolean;
  sheetId: string | null;
  formId: mongoose.Types.ObjectId,
  stats: {
    totalRegistrations: number;
  };
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  closedAt: Date | null;
}

const EventSchema = new Schema<IEvent>(
  {
    name: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
      minlength: [3, 'Event name must be at least 3 characters'],
      maxlength: [200, 'Event name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    category: {
      type: String,
      enum: {
        values: ['technical', 'cultural', 'arts', 'sports', 'other'],
        message: '{VALUE} is not a valid category',
      },
      required: [true, 'Event category is required'],
    },
    eventDate: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    eventTime: {
      type: String,
      required: [true, 'Event time is required'],
      trim: true,
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
      maxlength: [200, 'Venue cannot exceed 200 characters'],
    },
    registrationDeadline: {
      type: Date,
      required: [true, 'Registration deadline is required'],
    },
    maxCapacity: {
      type: Number,
      default: null,
      min: [1, 'Capacity must be at least 1'],
    },
    coordinators: [{
      id: {
        type: Schema.Types.ObjectId,
        ref: 'Coordinator',
        required: [true, 'Coordinator is required'],
      },
      email: {
        type: String,
        required: [true, 'Coordinator email is required'],
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
      },
      phone: {
        type: String,
        default: null,
      },
    }],
    rules: {
      type: String,
      required: [true, 'Event rules are required'],
      trim: true,
    },
    prizes: {
      type: String,
      default: null,
      trim: true,
    },
    bannerUrl: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'published', 'closed', 'completed', 'cancelled'],
        message: '{VALUE} is not a valid status',
      },
      default: 'draft',
    },
    hasForm: {
      type: Boolean,
      default: false,
    },
    sheetId: {
      type: String,
      default: null,
    },
    formId: {
      type: Schema.Types.ObjectId,
      ref: "Form"
    },
    stats: {
      totalRegistrations: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
EventSchema.index({ coordinatorId: 1 });
EventSchema.index({ status: 1 });
EventSchema.index({ category: 1 });
EventSchema.index({ eventDate: 1 });
EventSchema.index({ registrationDeadline: 1 });
EventSchema.index({ status: 1, eventDate: 1 }); // Compound index
EventSchema.index({ status: 1, category: 1 }); // Compound index
EventSchema.index({ name: 'text', description: 'text' }); // Text search

// Virtual for checking if registration is open
EventSchema.virtual('isRegistrationOpen').get(function () {
  const now = new Date();
  const deadlinePassed = now > this.registrationDeadline;
  const capacityFull = this.maxCapacity !== null &&
    this.stats.totalRegistrations >= this.maxCapacity;

  return this.status === 'published' && !deadlinePassed && !capacityFull;
});

const Event: Model<IEvent> =
  mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);

export default Event;
