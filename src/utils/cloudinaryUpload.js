import { v2 as cloudinary } from 'cloudinary';
import config from '../config/config.js';

/**
 * Initialize Cloudinary configuration
 */
const initializeCloudinary = () => {
  if (!config.cloudinary || !config.cloudinary.cloudName || !config.cloudinary.apiKey) {
    console.warn('⚠️  Cloudinary credentials not found. File uploads will fail.');
    return false;
  }

  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true
  });

  console.log('✅ Cloudinary configured successfully');
  return true;
};

// Initialize on import
const isCloudinaryConfigured = initializeCloudinary();

/**
 * Upload file to Cloudinary
 * @param {Buffer|string} file - File buffer, base64 string, or file path
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result
 */
export const uploadToCloudinary = async (file, options = {}) => {
  try {
    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured) {
      throw new Error('Cloudinary not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
    }

    const uploadOptions = {
      folder: options.folder || 'emerald-capital/general',
      resource_type: 'auto',
      upload_preset: config.cloudinary.uploadPreset,
      ...options
    };

    let uploadResult;
    
    if (file instanceof Buffer) {
      // Upload from buffer
      uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              console.error('❌ Cloudinary upload stream error:', error);
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        
        uploadStream.end(file);
      });
    } else if (typeof file === 'string' && file.startsWith('data:')) {
      // Upload from base64
      uploadResult = await cloudinary.uploader.upload(file, uploadOptions);
    } else if (typeof file === 'string') {
      // Upload from file path or URL
      uploadResult = await cloudinary.uploader.upload(file, uploadOptions);
    } else {
      throw new Error('Invalid file type. Expected Buffer, base64 string, or file path.');
    }

    console.log(`✅ File uploaded to Cloudinary: ${uploadResult.public_id}`);
    
    return {
      success: true,
      public_id: uploadResult.public_id,
      url: uploadResult.secure_url,
      format: uploadResult.format,
      width: uploadResult.width,
      height: uploadResult.height,
      bytes: uploadResult.bytes,
      created_at: uploadResult.created_at,
      resource_type: uploadResult.resource_type,
      original_filename: uploadResult.original_filename,
      etag: uploadResult.etag,
      version: uploadResult.version,
      signature: uploadResult.signature
    };
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error.message);
    console.error('Error details:', error);
    throw new Error(`Failed to upload to Cloudinary: ${error.message}`);
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} options - Delete options
 * @returns {Promise<Object>} Delete result
 */
export const deleteFromCloudinary = async (publicId, options = {}) => {
  try {
    if (!isCloudinaryConfigured) {
      throw new Error('Cloudinary not configured.');
    }

    const deleteOptions = {
      resource_type: options.resourceType || 'image',
      invalidate: options.invalidate || true,
      ...options
    };

    const result = await cloudinary.uploader.destroy(publicId, deleteOptions);
    
    console.log(`🗑️  File deleted from Cloudinary: ${publicId}`);
    
    return {
      success: result.result === 'ok',
      result: result
    };
  } catch (error) {
    console.error('❌ Cloudinary delete error:', error.message);
    throw new Error(`Failed to delete from Cloudinary: ${error.message}`);
  }
};

/**
 * Generate optimized image URL with transformations
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} transformations - Image transformations
 * @returns {string} Optimized URL
 */
export const getOptimizedUrl = (publicId, transformations = {}) => {
  if (!publicId) {
    throw new Error('Public ID is required to generate URL');
  }

  const defaultTransformations = {
    quality: 'auto:good',
    fetch_format: 'auto',
    ...transformations
  };

  try {
    return cloudinary.url(publicId, {
      ...defaultTransformations,
      secure: true
    });
  } catch (error) {
    console.error('❌ Error generating Cloudinary URL:', error);
    throw new Error(`Failed to generate Cloudinary URL: ${error.message}`);
  }
};

/**
 * Upload multiple files
 * @param {Array} files - Array of files
 * @param {Object} options - Upload options
 * @returns {Promise<Array>} Array of upload results
 */
export const uploadMultipleToCloudinary = async (files, options = {}) => {
  try {
    const uploadPromises = files.map(file => uploadToCloudinary(file, options));
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('❌ Multiple upload error:', error);
    throw new Error(`Failed to upload multiple files: ${error.message}`);
  }
};

/**
 * Check if a file exists on Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<boolean>} True if file exists
 */
export const checkFileExists = async (publicId) => {
  try {
    if (!isCloudinaryConfigured) {
      return false;
    }

    const result = await cloudinary.api.resource(publicId);
    return !!result;
  } catch (error) {
    if (error.http_code === 404) {
      return false;
    }
    console.error('❌ Error checking file existence:', error);
    return false;
  }
};

/**
 * Get file info from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} File information
 */
export const getFileInfo = async (publicId) => {
  try {
    if (!isCloudinaryConfigured) {
      throw new Error('Cloudinary not configured.');
    }

    const result = await cloudinary.api.resource(publicId);
    return {
      success: true,
      ...result
    };
  } catch (error) {
    console.error('❌ Error getting file info:', error);
    throw new Error(`Failed to get file info: ${error.message}`);
  }
};

/**
 * Generate a signed upload URL (for client-side uploads)
 * @param {Object} params - Upload parameters
 * @returns {Object} Signed upload data
 */
export const generateSignedUploadUrl = (params = {}) => {
  try {
    if (!isCloudinaryConfigured) {
      throw new Error('Cloudinary not configured.');
    }

    const timestamp = Math.round(Date.now() / 1000);
    const folder = params.folder || 'emerald-capital/general';
    const publicId = params.publicId || `upload_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;

    // Generate signature
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp: timestamp,
        folder: folder,
        public_id: publicId,
        ...params
      },
      config.cloudinary.apiSecret
    );

    return {
      timestamp: timestamp,
      signature: signature,
      api_key: config.cloudinary.apiKey,
      cloud_name: config.cloudinary.cloudName,
      folder: folder,
      public_id: publicId,
      upload_url: `https://api.cloudinary.com/v1_1/${config.cloudinary.cloudName}/auto/upload`
    };
  } catch (error) {
    console.error('❌ Error generating signed URL:', error);
    throw new Error(`Failed to generate signed upload URL: ${error.message}`);
  }
};

export default {
  uploadToCloudinary,
  deleteFromCloudinary,
  getOptimizedUrl,
  uploadMultipleToCloudinary,
  checkFileExists,
  getFileInfo,
  generateSignedUploadUrl,
  isConfigured: isCloudinaryConfigured
};