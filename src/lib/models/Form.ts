import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFormField {
  id: string;
  type: 'text' | 'textarea' | 'email' | 'phone' | 'dropdown' | 'checkbox' | 'radio' | 'date' | 'time' | 'image';
  label: string;
  placeholder: string | null;
  helpText: string | null;
  required: boolean;
  validation: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  } | null;
  options: string[] | null;
  defaultValue: string | null;
  conditionalLogic: {
    showIf: {
      fieldId: string;
      operator: 'equals' | 'not_equals' | 'contains';
      value: string;
    };
  } | null;
  order: number;
}

export interface IForm extends Document {
  _id: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  fields: IFormField[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FormFieldSchema = new Schema<IFormField>({
  id: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['text', 'textarea', 'email', 'phone', 'dropdown', 'checkbox', 'radio', 'date', 'time', 'image'],
    required: true,
  },
  label: {
    type: String,
    required: true,
    trim: true,
  },
  placeholder: {
    type: String,
    default: null,
  },
  helpText: {
    type: String,
    default: null,
  },
  required: {
    type: Boolean,
    default: false,
  },
  validation: {
    type: Schema.Types.Mixed,
    default: null,
  },
  options: {
    type: [String],
    default: null,
  },
  defaultValue: {
    type: String,
    default: null,
  },
  conditionalLogic: {
    type: Schema.Types.Mixed,
    default: null,
  },
  order: {
    type: Number,
    required: true,
  },
}, { _id: false });

const FormSchema = new Schema<IForm>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    fields: {
      type: [FormFieldSchema],
      required: true,
      validate: {
        validator: function(fields: IFormField[]) {
          return fields.length > 0;
        },
        message: 'Form must have at least one field',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
FormSchema.index({ eventId: 1 });
FormSchema.index({ eventId: 1, isActive: 1 });
FormSchema.index({ isActive: 1 });

const Form: Model<IForm> = 
  mongoose.models.Form || mongoose.model<IForm>('Form', FormSchema);

export default Form;