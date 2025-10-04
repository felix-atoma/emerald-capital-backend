import mongoose from 'mongoose';
import validator from 'validator';

const contactMessageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  phone: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^\+?[\d\s-()]{10,}$/.test(v);
      },
      message: 'Please enter a valid phone number',
    },
  },
  website: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || validator.isURL(v);
      },
      message: 'Please enter a valid website URL',
    },
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    maxlength: [2000, 'Message cannot exceed 2000 characters'],
  },
  agreedToTerms: {
    type: Boolean,
    required: [true, 'You must agree to the terms and conditions'],
  },
  status: {
    type: String,
    enum: ['new', 'read', 'replied', 'archived'],
    default: 'new',
  },
  ipAddress: String,
  userAgent: String,
}, {
  timestamps: true,
});

// Index for better query performance
contactMessageSchema.index({ email: 1 });
contactMessageSchema.index({ status: 1 });
contactMessageSchema.index({ createdAt: -1 });

const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);

export default ContactMessage;