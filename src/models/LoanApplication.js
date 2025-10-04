import mongoose from 'mongoose';

const loanApplicationSchema = new mongoose.Schema({
  // Applicant Reference
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
  },
  
  // Loan Details
  tenor: {
    type: Number,
    required: [true, 'Loan tenor is required'],
    min: [1, 'Tenor must be at least 1 month'],
    max: [24, 'Tenor cannot exceed 24 months'],
  },
  loanAmountRequested: {
    type: Number,
    required: [true, 'Loan amount is required'],
    min: [1000, 'Minimum loan amount is GHS 1000'],
    max: [50000, 'Maximum loan amount is GHS 50,000'],
  },
  loanPurpose: {
    type: String,
    required: [true, 'Loan purpose is required'],
    enum: ['education', 'family/feeding', 'healthcare', 'housing', 'business', 'other'],
  },
  purposeDescription: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  
  // Application Status
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'disbursed', 'completed'],
    default: 'pending',
  },
  statusHistory: [{
    status: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reason: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
  
  // Review Information
  officerRating: {
    type: Number,
    min: 1,
    max: 5,
  },
  accountOfficer: {
    code: String,
    name: String,
    email: String,
  },
  feedback: {
    type: String,
    maxlength: [1000, 'Feedback cannot exceed 1000 characters'],
  },
  reviewNotes: [{
    note: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
  
  // Financial Details
  approvedAmount: {
    type: Number,
    min: 0,
  },
  interestRate: {
    type: Number,
    default: 0,
  },
  monthlyInstallment: {
    type: Number,
    min: 0,
  },
  disbursementDate: Date,
  expectedCompletionDate: Date,
  
  // Documents
  documents: {
    passportPhoto: String,
    ghanaCard: [String], // Front and back
    lastMonthPayslip: [String],
    bankStatement: [String],
    signature: String,
    compulsoryPayslip: String,
  },
  
  // Agreement
  agreementConfirmed: {
    type: Boolean,
    default: false,
  },
  agreementConfirmedAt: Date,
  termsAccepted: Boolean,
  
  // Timestamps
  submittedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes
loanApplicationSchema.index({ user: 1 });
loanApplicationSchema.index({ status: 1 });
loanApplicationSchema.index({ submittedAt: -1 });
loanApplicationSchema.index({ 'accountOfficer.code': 1 });

// Virtual for loan duration in months
loanApplicationSchema.virtual('durationMonths').get(function() {
  return this.tenor;
});

// Virtual for total repayment amount
loanApplicationSchema.virtual('totalRepayment').get(function() {
  if (this.approvedAmount && this.interestRate) {
    const interest = (this.approvedAmount * this.interestRate) / 100;
    return this.approvedAmount + interest;
  }
  return 0;
});

// Method to update status
loanApplicationSchema.methods.updateStatus = function(newStatus, officerId, reason = '') {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    changedBy: officerId,
    reason: reason,
    timestamp: new Date(),
  });
  return this.save();
};

// Static method to get applications by status
loanApplicationSchema.statics.getByStatus = function(status) {
  return this.find({ status }).populate('user', 'firstName lastName email phone');
};

const LoanApplication = mongoose.model('LoanApplication', loanApplicationSchema);

export default LoanApplication;