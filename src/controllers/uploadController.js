import fs from 'fs';
import path from 'path';

// Upload image controller
export const uploadImage = async (req, res) => {
  try {
    console.log('📤 Upload request received');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Check if file exists
    if (!fs.existsSync(req.file.path)) {
      return res.status(500).json({
        success: false,
        message: 'File upload failed - file not saved'
      });
    }

    // Determine the URL path based on upload type
    let urlPath = '';
    if (req.query.type === 'blog') {
      urlPath = `/uploads/blog-images/${req.file.filename}`;
    } else if (req.query.type === 'profile') {
      urlPath = `/uploads/profiles/${req.file.filename}`;
    } else if (req.query.type === 'document') {
      urlPath = `/uploads/documents/${req.file.filename}`;
    } else {
      urlPath = `/uploads/general/${req.file.filename}`;
    }

    console.log('✅ File uploaded successfully:', {
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      url: urlPath
    });

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: urlPath,
        path: req.file.path
      }
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    
    // Clean up the file if there was an error
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to upload file',
      error: error.message
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