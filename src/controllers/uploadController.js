import fs from 'fs';
import path from 'path';

// Upload image controller
// uploadController.js - uploadImage function
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Construct the URL that matches your static file serving
    let filePath = '';
    if (req.query.type === 'blog') {
      filePath = `blog-images/${req.file.filename}`;
    } else if (req.query.type === 'profile') {
      filePath = `profiles/${req.file.filename}`;
    } else if (req.query.type === 'document') {
      filePath = `documents/${req.file.filename}`;
    } else {
      filePath = `general/${req.file.filename}`;
    }

    const fullUrl = `${req.protocol}://${req.get('host')}/uploads/${filePath}`;

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: `/uploads/${filePath}`,
        url: fullUrl,
        type: req.query.type || 'general'
      }
    });
  } catch (error) {
    console.error('Upload controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Delete image controller
export const deleteImage = async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Determine the directory based on query type
    let filePath = '';
    if (req.query.type === 'blog') {
      filePath = path.join('uploads', 'blog-images', filename);
    } else if (req.query.type === 'profile') {
      filePath = path.join('uploads', 'profiles', filename);
    } else if (req.query.type === 'document') {
      filePath = path.join('uploads', 'documents', filename);
    } else {
      filePath = path.join('uploads', 'general', filename);
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Delete the file
    fs.unlinkSync(filePath);

    console.log('🗑️ File deleted:', filePath);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: error.message
    });
  }
};