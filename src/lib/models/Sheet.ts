import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISheet extends Document {
  _id: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  sheetId: string;
  sheetUrl: string;
  columnMapping: {
    [key: string]: string;
  };
  lastSyncStatus: 'success' | 'failed' | 'pending';
  lastSyncError: string | null;
  lastSyncedAt: Date | null;
  nextSyncAt: Date | null;
  totalRowsSynced: number;
  failedSyncCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const SheetSchema = new Schema<ISheet>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      unique: true, // One sheet per event
      index: true,
    },
    sheetId: {
      type: String,
      required: true,
      index: true,
    },
    sheetUrl: {
      type: String,
      required: true,
    },
    columnMapping: {
      type: Schema.Types.Mixed,
      required: true,
    },
    lastSyncStatus: {
      type: String,
      enum: ['success', 'failed', 'pending'],
      default: 'pending',
      index: true,
    },
    lastSyncError: {
      type: String,
      default: null,
    },
    lastSyncedAt: {
      type: Date,
      default: null,
    },
    nextSyncAt: {
      type: Date,
      default: null,
    },
    totalRowsSynced: {
      type: Number,
      default: 0,
      min: 0,
    },
    failedSyncCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
SheetSchema.index({ eventId: 1 }, { unique: true });
SheetSchema.index({ sheetId: 1 });
SheetSchema.index({ lastSyncStatus: 1 });

const Sheet: Model<ISheet> = 
  mongoose.models.Sheet || mongoose.model<ISheet>('Sheet', SheetSchema);

export default Sheet;