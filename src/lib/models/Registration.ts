import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRegistration extends Document {
  _id: mongoose.Types.ObjectId;
  registrationId: string;
  eventId: mongoose.Types.ObjectId;
  formData: {
    [key: string]: any;
  };
  email: string;
  name: string | null;
  phone: string | null;
  status: 'pending' | 'approved' | 'rejected';
  statusNote: string | null;
  qrCodeUrl: string | null;
  qrCodeData: string | null;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded' | null;
  paymentId: string | null;
  amountPaid: number | null;
  sheetRowNumber: number | null;
  lastSyncedAt: Date | null;
  submittedAt: Date;
  updatedAt: Date;
  approvedAt: Date | null;
  rejectedAt: Date | null;
}

const RegistrationSchema = new Schema<IRegistration>(
  {
    registrationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    formData: {
      type: Schema.Types.Mixed,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
      index: true,
    },
    name: {
      type: String,
      default: null,
      trim: true,
    },
    phone: {
      type: String,
      default: null,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved', // Auto-approve unless event requires approval
      index: true,
    },
    statusNote: {
      type: String,
      default: null,
      trim: true,
    },
    qrCodeUrl: {
      type: String,
      default: null,
    },
    qrCodeData: {
      type: String,
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: null,
    },
    paymentId: {
      type: String,
      default: null,
    },
    amountPaid: {
      type: Number,
      default: null,
      min: 0,
    },
    sheetRowNumber: {
      type: Number,
      default: null,
    },
    lastSyncedAt: {
      type: Date,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
RegistrationSchema.index({ registrationId: 1 }, { unique: true });
RegistrationSchema.index({ eventId: 1 });
RegistrationSchema.index({ email: 1, eventId: 1 }, { unique: true }); // Prevent duplicate registrations
RegistrationSchema.index({ status: 1 });
RegistrationSchema.index({ submittedAt: -1 });
RegistrationSchema.index({ eventId: 1, status: 1 });
RegistrationSchema.index({ eventId: 1, email: 1 });

const Registration: Model<IRegistration> = 
  mongoose.models.Registration || mongoose.model<IRegistration>('Registration', RegistrationSchema);

export default Registration;