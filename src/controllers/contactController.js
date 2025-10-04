import ContactMessage from '../models/ContactMessage.js';
import { validateContactMessage } from '../middleware/validation.js';
import nodemailer from 'nodemailer';
import config from '../config/config.js';

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: config.email.service,
    auth: {
      user: config.email.username,
      pass: config.email.password,
    },
  });
};

export const createContactMessage = async (req, res, next) => {
  try {
    // Validate request body
    const { error } = validateContactMessage(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { name, email, phone, website, message, agreedToTerms } = req.body;

    // Create contact message
    const contactMessage = await ContactMessage.create({
      name,
      email,
      phone,
      website,
      message,
      agreedToTerms,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // Send confirmation email to user
    try {
      const transporter = createTransporter();
      
      const mailOptions = {
        from: config.email.username,
        to: email,
        subject: 'Thank you for contacting Emerald Capital',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af;">Thank You for Contacting Emerald Capital</h2>
            <p>Dear ${name},</p>
            <p>We have received your message and will get back to you within 24 hours.</p>
            <p><strong>Your Message:</strong></p>
            <p style="background-color: #f3f4f6; padding: 15px; border-radius: 5px;">${message}</p>
            <p>Best regards,<br>Emerald Capital Team</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    // Send notification to admin
    try {
      const transporter = createTransporter();
      
      const adminMailOptions = {
        from: config.email.username,
        to: config.email.username,
        subject: 'New Contact Form Submission',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            <p><strong>Website:</strong> ${website || 'Not provided'}</p>
            <p><strong>Message:</strong></p>
            <p style="background-color: #f3f4f6; padding: 15px; border-radius: 5px;">${message}</p>
            <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
          </div>
        `,
      };

      await transporter.sendMail(adminMailOptions);
    } catch (adminEmailError) {
      console.error('Failed to send admin notification email:', adminEmailError);
    }

    res.status(201).json({
      success: true,
      message: 'Thank you for your message. We will contact you within 24 hours.',
      data: {
        contactMessage: {
          id: contactMessage._id,
          name: contactMessage.name,
          email: contactMessage.email,
          submittedAt: contactMessage.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getContactMessages = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const filter = {};
    if (status) filter.status = status;

    const contactMessages = await ContactMessage.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ContactMessage.countDocuments(filter);

    res.json({
      success: true,
      data: {
        contactMessages,
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

export const getContactMessage = async (req, res, next) => {
  try {
    const contactMessage = await ContactMessage.findById(req.params.id);

    if (!contactMessage) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found',
      });
    }

    // Mark as read if it's new
    if (contactMessage.status === 'new') {
      contactMessage.status = 'read';
      await contactMessage.save();
    }

    res.json({
      success: true,
      data: {
        contactMessage,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateContactMessageStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const contactMessage = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!contactMessage) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found',
      });
    }

    res.json({
      success: true,
      message: 'Contact message status updated successfully',
      data: {
        contactMessage,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteContactMessage = async (req, res, next) => {
  try {
    const contactMessage = await ContactMessage.findByIdAndDelete(req.params.id);

    if (!contactMessage) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found',
      });
    }

    res.json({
      success: true,
      message: 'Contact message deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};