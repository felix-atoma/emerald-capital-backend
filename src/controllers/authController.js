import User from '../models/User.js';
import { generateAuthTokens } from '../utils/tokenGenerator.js';
import { generateAccountNumber } from '../utils/accountNumberGenerator.js';
import { validateUserRegistration, validateUserLogin } from '../middleware/validation.js';

export const register = async (req, res, next) => {
  try {
    // Validate request body
    const { error } = validateUserRegistration(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const {
      sex, firstName, lastName, middleName, dateOfBirth,
      phone, otherPhone, ghanaCardNumber, email, homeAddress, region,
      nextOfKin, nextOfKinPhone, employmentType, employer, staffNumber,
      employmentDate, gradeLevel, lastMonthPay, username, password,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email },
        { ghanaCardNumber },
        { username },
        { phone }
      ]
    });

    if (existingUser) {
      let field = 'user';
      if (existingUser.email === email) field = 'email';
      else if (existingUser.ghanaCardNumber === ghanaCardNumber) field = 'Ghana Card number';
      else if (existingUser.username === username) field = 'username';
      else if (existingUser.phone === phone) field = 'phone';

      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    // Generate account number
    const accountNumber = generateAccountNumber();

    // Create user
    const user = await User.create({
      sex,
      firstName,
      lastName,
      middleName,
      dateOfBirth: new Date(dateOfBirth),
      phone,
      otherPhone,
      ghanaCardNumber: ghanaCardNumber.toUpperCase(),
      email: email.toLowerCase(),
      homeAddress,
      region,
      nextOfKin,
      nextOfKinPhone,
      employmentType,
      employer,
      staffNumber,
      employmentDate: new Date(employmentDate),
      gradeLevel,
      lastMonthPay,
      username,
      password,
      accountNumber,
    });

    // Generate token
    const tokens = generateAuthTokens(user);

    // Remove password from output
    user.password = undefined;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    // Validate request body
    const { error } = validateUserLogin(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { username, password } = req.body;

    // Find user and include password for verification
    const user = await User.findOne({
      $or: [
        { username },
        { email: username },
        { accountNumber: username }
      ]
    }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const tokens = generateAuthTokens(user);

    // Remove password from output
    user.password = undefined;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const allowedUpdates = [
      'phone', 'otherPhone', 'email', 'homeAddress', 'region',
      'nextOfKin', 'nextOfKinPhone'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters',
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!(await user.correctPassword(currentPassword, user.password))) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};