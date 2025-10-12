import User from '../models/User.js';
import Account from '../models/Account.js'; // Import Account model
import { generateAuthTokens } from '../utils/tokenGenerator.js';
import { generateAccountNumber } from '../utils/accountNumberGenerator.js';
import { validateUserRegistration, validateUserLogin } from '../middleware/validation.js';

export const register = async (req, res, next) => {
  const session = await User.startSession();
  session.startTransaction();

  try {
    // Validate request body
    const { error } = validateUserRegistration(req.body);
    if (error) {
      await session.abortTransaction();
      session.endSession();
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
      await session.abortTransaction();
      session.endSession();
      
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

    // Create user (without accountNumber field)
    const user = await User.create([{
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
      // REMOVED: accountNumber field
    }], { session });

    // Create account in Account collection
    const account = await Account.create([{
      user: user[0]._id,
      balance: 0.00,
      accountNumber: accountNumber,
      currency: 'GHS'
    }], { session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Generate token
    const tokens = generateAuthTokens(user[0]);

    // Remove password from output
    user[0].password = undefined;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user[0],
        account: {
          accountNumber: account[0].accountNumber,
          balance: account[0].balance,
          currency: account[0].currency
        },
        tokens,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
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
        { email: username }
      ]
    }).select('+password');

    if (!user || !(await user.correctPassword(password))) {
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

    if (!(await user.correctPassword(currentPassword))) {
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

// Function to fix existing users without accounts
export const createMissingAccounts = async (req, res, next) => {
  try {
    const usersWithoutAccounts = await User.aggregate([
      {
        $lookup: {
          from: 'accounts',
          localField: '_id',
          foreignField: 'user',
          as: 'accounts'
        }
      },
      {
        $match: {
          'accounts.0': { $exists: false }
        }
      }
    ]);

    const results = [];
    
    for (const user of usersWithoutAccounts) {
      try {
        const accountNumber = generateAccountNumber();
        const account = await Account.create({
          user: user._id,
          balance: 0.00,
          accountNumber: accountNumber,
          currency: 'GHS'
        });
        
        results.push({
          userId: user._id,
          email: user.email,
          accountNumber: account.accountNumber,
          status: 'success'
        });
      } catch (error) {
        results.push({
          userId: user._id,
          email: user.email,
          status: 'failed',
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Processed ${usersWithoutAccounts.length} users without accounts`,
      data: results
    });
  } catch (error) {
    next(error);
  }
};