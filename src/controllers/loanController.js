import LoanApplication from '../models/LoanApplication.js';
import User from '../models/User.js';
import { validateLoanApplication } from '../middleware/validation.js';

export const createLoanApplication = async (req, res, next) => {
  try {
    // Validate request body
    const { error } = validateLoanApplication(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const {
      tenor,
      loanAmountRequested,
      loanPurpose,
      purposeDescription,
      agreementConfirmed,
    } = req.body;

    // Check if user has a pending application
    const existingApplication = await LoanApplication.findOne({
      user: req.user.id,
      status: { $in: ['pending', 'under_review'] },
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending loan application',
      });
    }

    // Handle file uploads
    const documents = {};
    if (req.files) {
      if (req.files.passportPhoto) {
        documents.passportPhoto = req.files.passportPhoto[0].filename;
      }
      if (req.files.ghanaCard) {
        documents.ghanaCard = req.files.ghanaCard.map(file => file.filename);
      }
      if (req.files.lastMonthPayslip) {
        documents.lastMonthPayslip = req.files.lastMonthPayslip.map(file => file.filename);
      }
      if (req.files.bankStatement) {
        documents.bankStatement = req.files.bankStatement.map(file => file.filename);
      }
      if (req.files.signature) {
        documents.signature = req.files.signature[0].filename;
      }
      if (req.files.compulsoryPayslip) {
        documents.compulsoryPayslip = req.files.compulsoryPayslip[0].filename;
      }
    }

    // Create loan application
    const loanApplication = await LoanApplication.create({
      user: req.user.id,
      tenor,
      loanAmountRequested,
      loanPurpose,
      purposeDescription,
      agreementConfirmed,
      agreementConfirmedAt: agreementConfirmed ? new Date() : null,
      documents,
    });

    // Populate user details for response
    await loanApplication.populate('user', 'firstName lastName email phone');

    res.status(201).json({
      success: true,
      message: 'Loan application submitted successfully',
      data: {
        loanApplication,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyLoanApplications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const loanApplications = await LoanApplication.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'firstName lastName email phone');

    const total = await LoanApplication.countDocuments({ user: req.user.id });

    res.json({
      success: true,
      data: {
        loanApplications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getLoanApplication = async (req, res, next) => {
  try {
    const loanApplication = await LoanApplication.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).populate('user', 'firstName lastName email phone ghanaCardNumber');

    if (!loanApplication) {
      return res.status(404).json({
        success: false,
        message: 'Loan application not found',
      });
    }

    res.json({
      success: true,
      data: {
        loanApplication,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateLoanApplication = async (req, res, next) => {
  try {
    const loanApplication = await LoanApplication.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!loanApplication) {
      return res.status(404).json({
        success: false,
        message: 'Loan application not found',
      });
    }

    // Only allow updates for pending applications
    if (loanApplication.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update application that is already under review',
      });
    }

    const allowedUpdates = ['loanPurpose', 'purposeDescription'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Handle file updates if provided
    if (req.files) {
      Object.keys(req.files).forEach(field => {
        if (loanApplication.documents[field] && req.files[field]) {
          if (Array.isArray(loanApplication.documents[field])) {
            loanApplication.documents[field] = req.files[field].map(file => file.filename);
          } else {
            loanApplication.documents[field] = req.files[field][0].filename;
          }
        }
      });
    }

    Object.assign(loanApplication, updates);
    await loanApplication.save();

    res.json({
      success: true,
      message: 'Loan application updated successfully',
      data: {
        loanApplication,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLoanApplication = async (req, res, next) => {
  try {
    const loanApplication = await LoanApplication.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!loanApplication) {
      return res.status(404).json({
        success: false,
        message: 'Loan application not found',
      });
    }

    // Only allow deletion for pending applications
    if (loanApplication.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete application that is already under review',
      });
    }

    await LoanApplication.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Loan application deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Admin/Officer functions
export const getAllLoanApplications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const officerCode = req.query.officerCode;

    const filter = {};
    if (status) filter.status = status;
    if (officerCode) filter['accountOfficer.code'] = officerCode;

    const loanApplications = await LoanApplication.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'firstName lastName email phone ghanaCardNumber employer');

    const total = await LoanApplication.countDocuments(filter);

    res.json({
      success: true,
      data: {
        loanApplications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateLoanStatus = async (req, res, next) => {
  try {
    const { status, feedback, officerRating, approvedAmount, interestRate } = req.body;

    const loanApplication = await LoanApplication.findById(req.params.id);

    if (!loanApplication) {
      return res.status(404).json({
        success: false,
        message: 'Loan application not found',
      });
    }

    // Update application
    if (status) {
      await loanApplication.updateStatus(status, req.user.id, feedback);
    }

    if (feedback) loanApplication.feedback = feedback;
    if (officerRating) loanApplication.officerRating = officerRating;
    if (approvedAmount) loanApplication.approvedAmount = approvedAmount;
    if (interestRate) loanApplication.interestRate = interestRate;

    // Set account officer if not set
    if (!loanApplication.accountOfficer) {
      loanApplication.accountOfficer = {
        code: req.user.staffNumber || req.user.id,
        name: `${req.user.firstName} ${req.user.lastName}`,
        email: req.user.email,
      };
    }

    await loanApplication.save();

    res.json({
      success: true,
      message: 'Loan application updated successfully',
      data: {
        loanApplication,
      },
    });
  } catch (error) {
    next(error);
  }
};