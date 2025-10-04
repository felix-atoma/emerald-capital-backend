import mongoose from 'mongoose';
import validator from 'validator';

const newsletterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  subscriptionSource: {
    type: String,
    default: 'website',
  },
  ipAddress: String,
  unsubscribedAt: Date,
}, {
  timestamps: true,
});

// Index for better query performance
newsletterSchema.index({ email: 1 });
newsletterSchema.index({ isActive: 1 });

// Static method to subscribe email
newsletterSchema.statics.subscribe = async function(email, ipAddress = '') {
  const existing = await this.findOne({ email });
  
  if (existing) {
    if (!existing.isActive) {
      existing.isActive = true;
      existing.unsubscribedAt = null;
      existing.ipAddress = ipAddress;
      return await existing.save();
    }
    throw new Error('Email is already subscribed');
  }
  
  return await this.create({
    email,
    ipAddress,
  });
};

// Static method to unsubscribe email
newsletterSchema.statics.unsubscribe = async function(email) {
  const subscription = await this.findOne({ email });
  
  if (!subscription) {
    throw new Error('Email not found in subscription list');
  }
  
  if (!subscription.isActive) {
    throw new Error('Email is already unsubscribed');
  }
  
  subscription.isActive = false;
  subscription.unsubscribedAt = new Date();
  return await subscription.save();
};

const Newsletter = mongoose.model('Newsletter', newsletterSchema);

export default Newsletter;