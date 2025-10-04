import Newsletter from '../models/Newsletter.js';
import { validateNewsletterSubscription } from '../middleware/validation.js';

export const subscribe = async (req, res, next) => {
  try {
    // Validate request body
    const { error } = validateNewsletterSubscription(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email } = req.body;

    try {
      const subscription = await Newsletter.subscribe(email, req.ip);
      
      res.json({
        success: true,
        message: 'Successfully subscribed to newsletter',
        data: {
          subscription: {
            email: subscription.email,
            subscribedAt: subscription.createdAt,
          },
        },
      });
    } catch (subscribeError) {
      if (subscribeError.message === 'Email is already subscribed') {
        return res.status(400).json({
          success: false,
          message: 'This email is already subscribed to our newsletter',
        });
      }
      throw subscribeError;
    }
  } catch (error) {
    next(error);
  }
};

export const unsubscribe = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    try {
      await Newsletter.unsubscribe(email);
      
      res.json({
        success: true,
        message: 'Successfully unsubscribed from newsletter',
      });
    } catch (unsubscribeError) {
      if (unsubscribeError.message === 'Email not found in subscription list') {
        return res.status(404).json({
          success: false,
          message: 'Email not found in subscription list',
        });
      }
      if (unsubscribeError.message === 'Email is already unsubscribed') {
        return res.status(400).json({
          success: false,
          message: 'This email is already unsubscribed',
        });
      }
      throw unsubscribeError;
    }
  } catch (error) {
    next(error);
  }
};

export const getSubscribers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const active = req.query.active;

    const filter = {};
    if (active !== undefined) {
      filter.isActive = active === 'true';
    }

    const subscribers = await Newsletter.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Newsletter.countDocuments(filter);

    res.json({
      success: true,
      data: {
        subscribers,
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

export const getSubscriber = async (req, res, next) => {
  try {
    const subscriber = await Newsletter.findById(req.params.id);

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Subscriber not found',
      });
    }

    res.json({
      success: true,
      data: {
        subscriber,
      },
    });
  } catch (error) {
    next(error);
  }
};