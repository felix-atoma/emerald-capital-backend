import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

export const uploadImage = async (req, res) => {
  try {
    if (!req.file && !req.files) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Handle single file upload
    if (req.file) {
      const file = req.file;
      
      // Resize image if it's an image file
      if (file.mimetype.startsWith('image/')) {
        const resizedImagePath = path.join(
          path.dirname(file.path),
          'resized-' + file.filename
        );
        
        await sharp(file.path)
          .resize(1200, 800, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .toFile(resizedImagePath);
        
        // Delete original and rename resized
        await fs.unlink(file.path);
        await fs.rename(resizedImagePath, file.path);
        
        // Create thumbnail
        const thumbnailPath = path.join(
          path.dirname(file.path),
          'thumb-' + file.filename
        );
        
        await sharp(file.path)
          .resize(300, 200)
          .toFile(thumbnailPath);
      }
      
      const fileUrl = `/uploads/${file.path.split('uploads/')[1]}`;
      
      return res.status(200).json({
        success: true,
        data: {
          filename: file.filename,
          originalname: file.originalname,
          path: fileUrl,
          size: file.size,
          mimetype: file.mimetype
        }
      });
    }
    
    // Handle multiple files upload
    if (req.files) {
      const files = req.files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        path: `/uploads/${file.path.split('uploads/')[1]}`,
        size: file.size,
        mimetype: file.mimetype
      }));
      
      return res.status(200).json({
        success: true,
        data: files
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteImage = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join('uploads', filename);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // Delete the file
    await fs.unlink(filePath);
    
    // Also delete thumbnail if exists
    const thumbPath = path.join('uploads', 'thumb-' + filename);
    try {
      await fs.unlink(thumbPath);
    } catch {
      // Thumbnail might not exist, that's okay
    }
    
    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};