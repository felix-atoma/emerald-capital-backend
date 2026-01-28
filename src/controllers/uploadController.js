import { uploadToCloudinary, deleteFromCloudinary, getOptimizedUrl } from '../utils/cloudinaryUpload.js';
import config from '../config/config.js';

/**
 * Upload single file to Cloudinary
 */
export const uploadImage = async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please select a file.'
      });
    }

    // Validate file size
    if (req.file.size > config.upload.maxFileSize) {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size is ${config.upload.maxFileSize / (1024 * 1024)}MB`
      });
    }

    // Determine folder and transformations based on type
    const { type = 'general' } = req.query;
    const folderConfig = getFolderConfig(type);
    
    console.log(`📤 Uploading ${req.file.originalname} (${req.file.size} bytes) to ${folderConfig.folder}`);

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(req.file.buffer, {
      folder: folderConfig.folder,
      public_id: folderConfig.publicId,
      transformation: folderConfig.transformation,
      resource_type: 'auto',
      filename_override: req.file.originalname
    });

    // Generate optimized URLs for images
    const optimizedUrls = uploadResult.resource_type === 'image' 
      ? generateOptimizedUrls(uploadResult.public_id)
      : {};

    // Prepare response data
    const responseData = {
      public_id: uploadResult.public_id,
      url: uploadResult.url,
      format: uploadResult.format,
      width: uploadResult.width,
      height: uploadResult.height,
      bytes: uploadResult.bytes,
      resource_type: uploadResult.resource_type,
      folder: folderConfig.displayFolder,
      type: type,
      original_filename: req.file.originalname,
      mimetype: req.file.mimetype,
      uploaded_at: new Date().toISOString()
    };

    // Add optimized URLs for images
    if (Object.keys(optimizedUrls).length > 0) {
      responseData.optimized_urls = optimizedUrls;
      responseData.thumbnail_url = optimizedUrls.thumbnail;
      responseData.medium_url = optimizedUrls.medium;
    }

    res.status(200).json({
      success: true,
      message: `File uploaded successfully to ${config.cloudinary.cloudName || 'Cloudinary'}`,
      data: responseData
    });

  } catch (error) {
    console.error('❌ Upload controller error:', error);
    
    // Handle specific errors
    let statusCode = 500;
    let errorMessage = 'Error uploading file';
    let errorDetails = config.nodeEnv === 'development' ? error.message : undefined;

    if (error.message.includes('Cloudinary not configured')) {
      statusCode = 503;
      errorMessage = 'File upload service is temporarily unavailable. Please try again later.';
    } else if (error.message.includes('File type not supported')) {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error.message.includes('too large')) {
      statusCode = 400;
      errorMessage = error.message;
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: errorDetails,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Upload multiple files to Cloudinary
 */
export const uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded. Please select files.'
      });
    }

    const { type = 'general' } = req.query;
    const folderConfig = getFolderConfig(type);

    console.log(`📤 Uploading ${req.files.length} files to ${folderConfig.folder}`);

    const uploadPromises = req.files.map(file => 
      uploadToCloudinary(file.buffer, {
        folder: folderConfig.folder,
        public_id: `${folderConfig.baseId}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        transformation: folderConfig.transformation,
        resource_type: 'auto',
        filename_override: file.originalname
      })
    );

    const results = await Promise.all(uploadPromises);

    const uploadedFiles = results.map((result, index) => {
      const file = req.files[index];
      const optimizedUrls = result.resource_type === 'image' 
        ? generateOptimizedUrls(result.public_id)
        : {};

      return {
        public_id: result.public_id,
        url: result.url,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        resource_type: result.resource_type,
        original_filename: file.originalname,
        mimetype: file.mimetype,
        optimized_urls: optimizedUrls,
        thumbnail_url: optimizedUrls.thumbnail,
        index: index
      };
    });

    res.status(200).json({
      success: true,
      message: `${uploadedFiles.length} files uploaded successfully`,
      data: {
        total: uploadedFiles.length,
        successful: uploadedFiles.length,
        failed: 0,
        files: uploadedFiles
      }
    });

  } catch (error) {
    console.error('❌ Multiple upload controller error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error uploading files',
      error: config.nodeEnv === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Delete file from Cloudinary
 */
export const deleteImage = async (req, res) => {
  try {
    const { publicId } = req.params;
    
    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'File ID is required'
      });
    }

    console.log(`🗑️  Deleting file: ${publicId}`);

    // Delete from Cloudinary
    const result = await deleteFromCloudinary(publicId, {
      resourceType: req.query.resourceType || 'image',
      invalidate: req.query.invalidate !== 'false'
    });
    
    if (result.success) {
      res.json({
        success: true,
        message: 'File deleted successfully',
        data: {
          public_id: publicId,
          deleted_at: new Date().toISOString()
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'File not found or already deleted',
        data: {
          public_id: publicId
        }
      });
    }
  } catch (error) {
    console.error('❌ Delete controller error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error deleting file',
      error: config.nodeEnv === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get optimized URL for existing image
 */
export const getOptimizedImageUrl = async (req, res) => {
  try {
    const { publicId } = req.params;
    const { width, height, crop, quality, format } = req.query;
    
    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required'
      });
    }

    const transformations = {};
    if (width) transformations.width = parseInt(width);
    if (height) transformations.height = parseInt(height);
    if (crop) transformations.crop = crop;
    if (quality) transformations.quality = quality;
    if (format) transformations.fetch_format = format;

    const optimizedUrl = getOptimizedUrl(publicId, transformations);
    
    res.json({
      success: true,
      data: {
        public_id: publicId,
        optimized_url: optimizedUrl,
        transformations: transformations,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Get optimized URL error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error generating optimized URL',
      error: config.nodeEnv === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get upload configuration
 */
export const getUploadConfig = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        cloudinary: {
          configured: !!config.cloudinary.cloudName,
          cloud_name: config.cloudinary.cloudName || 'Not configured',
          max_file_size: `${config.upload.maxFileSize / (1024 * 1024)}MB`,
          allowed_types: {
            images: config.upload.allowedImageTypes,
            files: config.upload.allowedFileTypes
          }
        },
        endpoints: {
          single_upload: '/api/upload/image?type={blog|profile|document|general}',
          multiple_upload: '/api/upload/images?type={blog|profile|document|general}',
          delete: '/api/upload/:publicId',
          optimize: '/api/upload/optimize/:publicId'
        },
        limits: {
          max_file_size: config.upload.maxFileSize,
          max_files: 5
        }
      }
    });
  } catch (error) {
    console.error('❌ Get upload config error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error getting upload configuration',
      error: config.nodeEnv === 'development' ? error.message : undefined
    });
  }
};

// Helper functions
const getFolderConfig = (type) => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substr(2, 9);
  
  const configs = {
    blog: {
      folder: 'emerald-capital/blog-images',
      displayFolder: 'blog-images',
      baseId: 'blog',
      publicId: `blog_${timestamp}_${randomStr}`,
      transformation: [
        { width: 1200, crop: 'limit' },
        { quality: 'auto:good' }
      ]
    },
    profile: {
      folder: 'emerald-capital/profiles',
      displayFolder: 'profiles',
      baseId: 'profile',
      publicId: `profile_${timestamp}_${randomStr}`,
      transformation: [
        { width: 400, height: 400, crop: 'thumb', gravity: 'face' },
        { quality: 'auto:good' }
      ]
    },
    document: {
      folder: 'emerald-capital/documents',
      displayFolder: 'documents',
      baseId: 'doc',
      publicId: `doc_${timestamp}_${randomStr}`,
      transformation: []
    },
    general: {
      folder: 'emerald-capital/general',
      displayFolder: 'general',
      baseId: 'file',
      publicId: `file_${timestamp}_${randomStr}`,
      transformation: []
    }
  };

  return configs[type] || configs.general;
};

const generateOptimizedUrls = (publicId) => {
  return {
    thumbnail: getOptimizedUrl(publicId, {
      width: 300,
      height: 200,
      crop: 'fill',
      quality: 'auto:good',
      fetch_format: 'auto'
    }),
    medium: getOptimizedUrl(publicId, {
      width: 800,
      crop: 'limit',
      quality: 'auto:good',
      fetch_format: 'auto'
    }),
    large: getOptimizedUrl(publicId, {
      width: 1200,
      crop: 'limit',
      quality: 'auto:good',
      fetch_format: 'auto'
    }),
    original: getOptimizedUrl(publicId, {
      quality: 'auto:best',
      fetch_format: 'auto'
    })
  };
};