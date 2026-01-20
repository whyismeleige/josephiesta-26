import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICoordinator extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'coordinator';
  assignedEventIds: mongoose.Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  lastLogin: Date | null;
  updatedAt: Date;
}

const CoordinatorSchema = new Schema<ICoordinator>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'coordinator'],
        message: '{VALUE} is not a valid role',
      },
      default: 'coordinator',
    },
    assignedEventIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Event',
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: {
      transform: (doc, ret) => {
        const { password, ...rest } = ret;
        return ret;
      }
    },
    toObject: {
      transform: (doc, ret) => {
        const { password, ...rest } = ret;
        return rest;
      }
    }
  }
);

// Indexes
CoordinatorSchema.index({ email: 1 }, { unique: true });
CoordinatorSchema.index({ role: 1 });
CoordinatorSchema.index({ isActive: 1 });


const Coordinator: Model<ICoordinator> =
  mongoose.models.Coordinator || mongoose.model<ICoordinator>('Coordinator', CoordinatorSchema);

export default Coordinator;