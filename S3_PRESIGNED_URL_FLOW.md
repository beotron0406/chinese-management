# S3 Pre-signed URL Upload Flow

## Overview
The frontend now uses pre-signed URLs for secure S3 uploads. This approach keeps AWS credentials on the backend only.

## Flow

### 1. Frontend Request for Pre-signed URL
```typescript
// Frontend calls backend API
POST http://26.112.47.221:3000/file-upload/presigned-url
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "fileName": "image.jpg",
  "fileType": "image/jpeg",
  "folder": "images/word-definitions"
}
```

### 2. Backend Generates Pre-signed URL
Backend should respond with:
```json
{
  "presignedUrl": "https://hanzii-lab.s3.ap-southeast-2.amazonaws.com/images/word-definitions/uuid.jpg?X-Amz-Algorithm=...",
  "publicUrl": "https://hanzii-lab.s3.ap-southeast-2.amazonaws.com/images/word-definitions/uuid.jpg"
}
```

### 3. Frontend Uploads to S3
Frontend uploads directly to S3 using the pre-signed URL:
```javascript
// XMLHttpRequest PUT to presignedUrl with file as body
xhr.open('PUT', presignedUrl);
xhr.setRequestHeader('Content-Type', file.type);
xhr.send(file);
```

### 4. Frontend Uses Public URL
Once uploaded, frontend uses `publicUrl` in form data sent to your API.

## Allowed Folders
- `images/word-definitions` - Word definition images
- `audio/word-pronunciations` - Word pronunciation audio
- `images/lessons` - Lesson content images
- `audio/lessons` - Lesson content audio
- `images/questions` - Question images
- `audio/questions` - Question audio

## Backend Implementation Requirements

### Dependencies Needed
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner uuid
```

### Environment Variables
```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-southeast-2
AWS_S3_BUCKET_NAME=hanzii-lab
```

### API Endpoint Structure
```typescript
// POST /file-upload/presigned-url
export async function POST(request) {
  const { fileName, fileType, folder } = await request.json();

  // 1. Validate folder and file type
  // 2. Generate unique filename with UUID
  // 3. Create S3 PutObjectCommand
  // 4. Generate pre-signed URL (5 minute expiry)
  // 5. Return { presignedUrl, publicUrl }
}
```

### Validation Rules
- Only allow specific folders (listed above)
- Image files only in `images/*` folders
- Audio files only in `audio/*` folders
- File size limits (handled on frontend)
- 5-minute expiry on pre-signed URLs

## Frontend Changes Made

### Files Modified
1. `src/utils/s3Upload.ts` - Updated to use pre-signed URL flow
2. `src/components/content/forms/WordDefinitionForm.tsx` - File upload UI
3. `src/components/common/UploadModal.tsx` - Upload progress modal

### Dependencies Removed
- `@aws-sdk/client-s3` (no longer needed on frontend)
- `@aws-sdk/s3-request-presigner` (no longer needed on frontend)

### Key Features
- Real upload progress tracking with XMLHttpRequest
- File validation (type, size)
- Upload status modal with progress bar
- Error handling for failed uploads
- Preview of uploaded files
- Organized folder structure in S3

## Usage Example
```typescript
// In WordDefinitionForm
const result = await uploadWordImageToS3(file, onProgress);
if (result.success) {
  // Use result.url in form submission
  form.setFieldValue(['data', 'picture_url'], result.url);
}
```

## Security Benefits
- AWS credentials never exposed to frontend
- Pre-signed URLs have short expiry (5 minutes)
- File type and folder validation on backend
- Authentication required for pre-signed URL generation
- No direct S3 access from frontend