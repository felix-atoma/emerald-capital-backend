import Joi from 'joi';

// User validation schemas
export const validateUserRegistration = (data) => {
  const schema = Joi.object({
    sex: Joi.string().valid('male', 'female').required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    middleName: Joi.string().max(50).allow(''),
    dateOfBirth: Joi.date().max('now').required(),
    phone: Joi.string().pattern(/^\+?[\d\s-()]{10,}$/).required(),
    otherPhone: Joi.string().pattern(/^\+?[\d\s-()]{10,}$/).allow(''),
    ghanaCardNumber: Joi.string().pattern(/^GHA-[A-Z0-9]{9}-[A-Z0-9]$/).required(),
    email: Joi.string().email().required(),
    homeAddress: Joi.string().min(10).max(255).required(),
    region: Joi.string().valid(
      'Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central', 
      'Northern', 'Upper East', 'Upper West', 'Volta', 'Bono',
      'Bono East', 'Ahafo', 'Savannah', 'North East', 'Oti', 'Western North'
    ).required(),
    nextOfKin: Joi.array().items(
      Joi.object({
        relationship: Joi.string().valid('spouse', 'parent', 'child', 'sibling', 'other').required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
      })
    ).min(1).required(),
    nextOfKinPhone: Joi.string().pattern(/^\+?[\d\s-()]{10,}$/).required(),
    employmentType: Joi.array().items(
      Joi.string().valid(
        'civilService', 'police', 'military', 'immigration', 'fire',
        'education', 'health', 'private', 'other'
      )
    ).min(1).required(),
    employer: Joi.string().required(),
    staffNumber: Joi.string().required(),
    employmentDate: Joi.date().max('now').required(),
    gradeLevel: Joi.string().required(),
    lastMonthPay: Joi.number().min(0).required(),
    username: Joi.string().min(4).max(30).required(),
    password: Joi.string().min(8).required(),
    agreementConfirmed: Joi.boolean().valid(true).required(),
  });

  return schema.validate(data);
};

export const validateUserLogin = (data) => {
  const schema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
    rememberMe: Joi.boolean(),
  });

  return schema.validate(data);
};

export const validateLoanApplication = (data) => {
  const schema = Joi.object({
    tenor: Joi.number().integer().min(1).max(24).required(),
    loanAmountRequested: Joi.number().min(1000).max(50000).required(),
    loanPurpose: Joi.string().valid('education', 'family/feeding', 'healthcare', 'housing', 'business', 'other').required(),
    purposeDescription: Joi.string().max(500).allow(''),
    agreementConfirmed: Joi.boolean().valid(true).required(),
  });

  return schema.validate(data);
};

export const validateContactMessage = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^\+?[\d\s-()]{10,}$/).allow(''),
    website: Joi.string().uri().allow(''),
    message: Joi.string().min(10).max(2000).required(),
    agreedToTerms: Joi.boolean().valid(true).required(),
  });

  return schema.validate(data);
};

export const validateNewsletterSubscription = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
  });

  return schema.validate(data);
};

// Validation middleware
export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    next();
  };
};