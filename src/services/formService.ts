import connectDB from '@/lib/db/mongodb';
import { Form, Event, Registration } from "@/lib/models"

export class FormService {
  /**
   * Get form for event
   */
  static async getFormByEventId(eventId: string) {
    await connectDB();

    const form = await Form.findOne({
      eventId,
      isActive: true,
    }).lean();

    return form;
  }

  /**
   * Create or update form
   */
  static async upsertForm(eventId: string, fields: any[]) {
    await connectDB();

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Check if form already exists
    const existingForm = await Form.findOne({ eventId, isActive: true });

    // Check if event has registrations
    const registrationCount = await Registration.countDocuments({ eventId });

    if (existingForm && registrationCount > 0) {
      // Deactivate old form and create new version
      existingForm.isActive = false;
      await existingForm.save();

      const newForm = await Form.create({
        eventId,
        fields,
        isActive: true,
      });

      return {
        form: newForm,
        warning: 'Form updated. Changes will only apply to new registrations.',
      };
    } else if (existingForm) {
      // Update existing form (no registrations yet)
      existingForm.fields = fields;
      existingForm.updatedAt = new Date();
      await existingForm.save();

      return {
        form: existingForm,
        warning: null,
      };
    } else {
      // Create new form
      const newForm = await Form.create({
        eventId,
        fields,
        isActive: true,
      });

      // Update event to mark it has a form
      event.hasForm = true;
      await event.save();

      return {
        form: newForm,
        warning: null,
      };
    }
  }

  /**
   * Validate form data against schema
   */
  static validateFormData(formData: any, formFields: any[]): {
    isValid: boolean;
    errors: { [key: string]: string };
  } {
    const errors: { [key: string]: string } = {};

    for (const field of formFields) {
      const value = formData[field.id];

      // Check required fields
      if (field.required && (!value || value === '')) {
        errors[field.id] = `${field.label} is required`;
        continue;
      }

      // Skip validation if field is optional and empty
      if (!value) continue;

      // Type-specific validation
      if (field.type === 'email') {
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(value)) {
          errors[field.id] = 'Invalid email format';
        }
      }

      if (field.type === 'phone') {
        const phoneRegex = /^\+?[1-9]\d{9,14}$/;
        if (!phoneRegex.test(value.replace(/[\s-]/g, ''))) {
          errors[field.id] = 'Invalid phone number';
        }
      }

      // Custom validation rules
      if (field.validation) {
        if (field.validation.minLength && value.length < field.validation.minLength) {
          errors[field.id] = `Minimum ${field.validation.minLength} characters required`;
        }

        if (field.validation.maxLength && value.length > field.validation.maxLength) {
          errors[field.id] = `Maximum ${field.validation.maxLength} characters allowed`;
        }

        if (field.validation.pattern) {
          const regex = new RegExp(field.validation.pattern);
          if (!regex.test(value)) {
            errors[field.id] = `Invalid format for ${field.label}`;
          }
        }

        if (field.validation.min && parseFloat(value) < field.validation.min) {
          errors[field.id] = `Minimum value is ${field.validation.min}`;
        }

        if (field.validation.max && parseFloat(value) > field.validation.max) {
          errors[field.id] = `Maximum value is ${field.validation.max}`;
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}