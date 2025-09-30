// No need for AWS SDK on frontend with pre-signed URLs
// Backend will handle S3 credentials and generate pre-signed URLs

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

// API base URL for backend requests
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://26.112.47.221:3000";

/**
 * Request a pre-signed URL from the backend
 */
const getPresignedUrl = async (
  fileName: string,
  fileType: string,
  folder: string
): Promise<{ uploadUrl: string; fileUrl: string }> => {
  const token = localStorage.getItem("auth_token");

  console.log('🔹 Requesting presigned URL:', { fileName, fileType, folder });

  const response = await fetch(`${API_BASE_URL}/file-upload/presigned-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({
      filename: fileName,
      contentType: fileType,
      folder,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('❌ Presigned URL request failed:', errorData);
    throw new Error(errorData.message || 'Failed to get pre-signed URL');
  }

  const result = await response.json();
  console.log('✅ Presigned URL response:', result);

  // Backend may return data in a wrapped format: { data: { presignedUrl, publicUrl } }
  const urlData = result.data || result;
  console.log('🔹 Extracted URL data:', urlData);

  return urlData;
};

/**
 * Upload a file to S3 using pre-signed URL from backend
 */
export const uploadFileToS3 = async (
  file: File,
  folder: string = 'uploads',
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  try {
    console.log('📤 Starting file upload:', { fileName: file.name, fileType: file.type, folder });

    // Step 1: Get pre-signed URL from backend
    const { uploadUrl, fileUrl } = await getPresignedUrl(
      file.name,
      file.type,
      folder
    );

    console.log('🔗 Using presigned URL:', uploadUrl);
    console.log('🌐 Public URL will be:', fileUrl);

    // Step 2: Upload file directly to S3 using pre-signed URL
    const xhr = new XMLHttpRequest();

    return new Promise((resolve) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          console.log('✅ Upload successful!');
          resolve({
            success: true,
            url: fileUrl,
          });
        } else {
          console.error('❌ Upload failed:', {
            status: xhr.status,
            statusText: xhr.statusText,
            response: xhr.responseText,
            responseXML: xhr.responseXML,
          });
          resolve({
            success: false,
            error: `Upload failed with status: ${xhr.status} - ${xhr.responseText || xhr.statusText}`,
          });
        }
      });

      xhr.addEventListener('error', () => {
        resolve({
          success: false,
          error: 'Network error during upload',
        });
      });

      xhr.open('PUT', uploadUrl);
      // Set Content-Type to match what was used to generate the presigned URL
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });

  } catch (error) {
    console.error('S3 Upload Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
};

/**
 * Upload a file to S3 based on content/question type
 * @param file - The file to upload
 * @param type - The content or question type (e.g., 'content_word_definition', 'question_audio_image')
 * @param fileType - Either 'images' or 'audio'
 * @param onProgress - Optional progress callback
 */
export const uploadFileByType = (
  file: File,
  type: string,
  fileType: 'images' | 'audio',
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  // Convert type to folder name (e.g., 'content_word_definition' -> 'content-word-definition')
  // Convert underscores to hyphens
  const folderName = type.replace(/_/g, '-');

  const folder = `${folderName}/${fileType}`;
  return uploadFileToS3(file, folder, onProgress);
};

/**
 * Upload an image file to S3 based on type
 */
export const uploadImageByType = (
  file: File,
  type: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  return uploadFileByType(file, type, 'images', onProgress);
};

/**
 * Upload an audio file to S3 based on type
 */
export const uploadAudioByType = (
  file: File,
  type: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  return uploadFileByType(file, type, 'audio', onProgress);
};

/**
 * Validate file type and size
 */
export const validateFile = (
  file: File,
  type: 'image' | 'audio',
  maxSizeMB: number = 10
): { isValid: boolean; error?: string } => {
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }

  // Check file type
  if (type === 'image') {
    if (!file.type.startsWith('image/')) {
      return {
        isValid: false,
        error: 'Please select a valid image file',
      };
    }
  } else if (type === 'audio') {
    if (!file.type.startsWith('audio/')) {
      return {
        isValid: false,
        error: 'Please select a valid audio file',
      };
    }
  }

  return { isValid: true };
};