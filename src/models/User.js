// models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

const userSchema = new mongoose.Schema({
  // Personal Information
  sex: {
    type: String,
    enum: ['male', 'female'],
    required: true,
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters'],
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters'],
  },
  middleName: {
    type: String,
    trim: true,
    maxlength: [50, 'Middle name cannot exceed 50 characters'],
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required'],
  },
  
  // Contact Information
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    validate: {
      validator: function(v) {
        return /^\+?[\d\s-()]{10,}$/.test(v);
      },
      message: 'Please enter a valid phone number',
    },
  },
  otherPhone: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^\+?[\d\s-()]{10,}$/.test(v);
      },
      message: 'Please enter a valid phone number',
    },
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  
  // Identification
  ghanaCardNumber: {
    type: String,
    required: [true, 'Ghana Card number is required'],
    unique: true,
    uppercase: true,
    match: [/^GHA-[A-Z0-9]{9}-[A-Z0-9]$/, 'Please provide a valid Ghana Card number'],
  },
  
  // Address Information
  homeAddress: {
    type: String,
    required: [true, 'Home address is required'],
    maxlength: [255, 'Address cannot exceed 255 characters'],
  },
  region: {
    type: String,
    required: [true, 'Region is required'],
    enum: [
      'Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central', 
      'Northern', 'Upper East', 'Upper West', 'Volta', 'Bono',
      'Bono East', 'Ahafo', 'Savannah', 'North East', 'Oti', 'Western North'
    ],
  },
  
  // Next of Kin Information
  nextOfKin: [{
    relationship: {
      type: String,
      enum: ['spouse', 'parent', 'child', 'sibling', 'other'],
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
  }],
  nextOfKinPhone: {
    type: String,
    required: [true, 'Next of kin phone is required'],
    validate: {
      validator: function(v) {
        return /^\+?[\d\s-()]{10,}$/.test(v);
      },
      message: 'Please enter a valid phone number',
    },
  },
  
  // Employment Information
  employmentType: [{
    type: String,
    enum: [
      'civilService', 'police', 'military', 'immigration', 'fire',
      'education', 'health', 'private', 'other'
    ],
  }],
  employer: {
    type: String,
    required: [true, 'Employer is required'],
    trim: true,
  },
  staffNumber: {
    type: String,
    required: [true, 'Staff number is required'],
    trim: true,
  },
  employmentDate: {
    type: Date,
    required: [true, 'Employment date is required'],
  },
  gradeLevel: {
    type: String,
    required: [true, 'Grade level is required'],
    trim: true,
  },
  lastMonthPay: {
    type: Number,
    required: [true, 'Last month pay is required'],
    min: [0, 'Salary cannot be negative'],
  },
  
  // Account Information
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    minlength: [4, 'Username must be at least 4 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false,
  },
  accountNumber: {
    type: String,
    unique: true,
  },
  
  // Account Status
  isVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'officer'],
    default: 'user',
  },
  
  // Timestamps
  lastLogin: Date,
}, {
  timestamps: true,
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ ghanaCardNumber: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ username: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// FIXED: Instance method to check password - only one parameter needed
userSchema.methods.correctPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check if user changed password after token was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

const User = mongoose.model('User', userSchema);

export default User;