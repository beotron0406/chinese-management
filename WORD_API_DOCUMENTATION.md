# Word Management API Documentation

## Overview

This document provides comprehensive documentation for the refactored Word Management APIs. The new architecture simplifies the multi-language word management system to support Vietnamese language only (with potential for future expansion) and provides unified endpoints for managing words with their senses and translations.

---

## Breaking Changes Summary

### Entity Changes

#### **1. Word Entity**
**Removed Fields:**
- `characterCount` - Character count tracking removed for simplification
- `isCompound` - Compound word flag removed

**Remaining Fields:**
- `id` (PrimaryGeneratedColumn)
- `simplified` (string, required, unique)
- `traditional` (string, optional)
- `createdAt` (timestamp)

#### **2. WordSense Entity**
**Removed Fields:**
- `exampleContext` - Example usage text removed
- `usageContext` - Usage context (formal, casual, etc.) removed

**Added Fields:**
- `imageUrl` (string, optional, max 500 chars) - URL to image resource
- `audioUrl` (string, optional, max 500 chars) - URL to audio resource

**Auto-Generated Fields:**
- `senseNumber` - Now automatically incremented per word (handled by service layer)

**Remaining Fields:**
- `id` (PrimaryGeneratedColumn)
- `wordId` (foreign key)
- `senseNumber` (auto-incremented)
- `pinyin` (string, required)
- `partOfSpeech` (string, optional)
- `hskLevel` (integer, optional, 1-9)
- `isPrimary` (boolean, default false)
- `imageUrl` (string, optional)
- `audioUrl` (string, optional)

#### **3. WordSenseTranslation Entity**
**Renamed Fields:**
- `usageNotes` → `additionalDetail`

**Default Values:**
- `language` - Defaults to 'vn' (Vietnamese)

**Remaining Fields:**
- `id` (PrimaryGeneratedColumn)
- `wordSenseId` (foreign key)
- `language` (string, default 'vn')
- `translation` (text, required)
- `additionalDetail` (text, optional)

---

## New Unified API Endpoints

### Authentication
All endpoints require JWT authentication with either Admin or User role.

**Headers:**
```
Authorization: Bearer {jwt_token}
```

---

### 1. Search Word (Check Existence)

**Endpoint:** `GET /words/search`

**Description:** Search for a word by its simplified form to check if it exists before creating.

**Authorization:** Admin only

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| simplified | string | Yes | Simplified Chinese character(s) to search for |

**Response:**
```json
{
  "exists": true,
  "wordId": 5,
  "word": {
    "id": 5,
    "simplified": "你好",
    "traditional": "你好",
    "createdAt": "2024-01-15T10:30:00Z",
    "senses": [
      {
        "id": 12,
        "senseNumber": 1,
        "pinyin": "nǐ hǎo",
        "partOfSpeech": "interjection",
        "hskLevel": 1,
        "isPrimary": true,
        "imageUrl": null,
        "audioUrl": "https://s3.amazonaws.com/audio/nihao.mp3",
        "translation": {
          "id": 45,
          "language": "vn",
          "translation": "xin chào",
          "additionalDetail": "Lời chào thông dụng nhất"
        }
      }
    ]
  }
}
```

**When word doesn't exist:**
```json
{
  "exists": false,
  "wordId": null,
  "word": null
}
```

---

### 2. Get All Words (List with Pagination)

**Endpoint:** `GET /words`

**Description:** Retrieve all words with pagination and search capabilities. Returns words with all senses and Vietnamese translations only.

**Authorization:** User or Admin

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number |
| limit | number | No | 10 | Items per page |
| search | string | No | - | Search in simplified or traditional |
| sortBy | string | No | 'id' | Field to sort by |
| sortOrder | string | No | 'ASC' | Sort direction (ASC/DESC) |

**Response:**
```json
{
  "words": [
    {
      "id": 5,
      "simplified": "你好",
      "traditional": "你好",
      "createdAt": "2024-01-15T10:30:00Z",
      "senses": [
        {
          "id": 12,
          "senseNumber": 1,
          "pinyin": "nǐ hǎo",
          "partOfSpeech": "interjection",
          "hskLevel": 1,
          "isPrimary": true,
          "imageUrl": null,
          "audioUrl": "https://s3.amazonaws.com/audio/nihao.mp3",
          "translation": {
            "id": 45,
            "language": "vn",
            "translation": "xin chào",
            "additionalDetail": "Lời chào thông dụng nhất"
          }
        }
      ]
    }
  ],
  "total": 150,
  "page": 1,
  "totalPages": 15
}
```

---

### 3. Get Single Word

**Endpoint:** `GET /words/:id`

**Description:** Retrieve a single word with all its senses and Vietnamese translations.

**Authorization:** User or Admin

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | number | Yes | Word ID |

**Response:**
```json
{
  "id": 5,
  "simplified": "你好",
  "traditional": "你好",
  "createdAt": "2024-01-15T10:30:00Z",
  "senses": [
    {
      "id": 12,
      "senseNumber": 1,
      "pinyin": "nǐ hǎo",
      "partOfSpeech": "interjection",
      "hskLevel": 1,
      "isPrimary": true,
      "imageUrl": null,
      "audioUrl": "https://s3.amazonaws.com/audio/nihao.mp3",
      "translation": {
        "id": 45,
        "language": "vn",
        "translation": "xin chào",
        "additionalDetail": "Lời chào thông dụng nhất"
      }
    },
    {
      "id": 13,
      "senseNumber": 2,
      "pinyin": "nǐ hǎo",
      "partOfSpeech": "adjective",
      "hskLevel": 2,
      "isPrimary": false,
      "imageUrl": null,
      "audioUrl": null,
      "translation": {
        "id": 46,
        "language": "vn",
        "translation": "tốt bụng, thân thiện",
        "additionalDetail": "Tính cách tốt"
      }
    }
  ]
}
```

---

### 4. Create Complete Word

**Endpoint:** `POST /words`

**Description:** Create a complete word with sense and translation. Handles two scenarios:
1. **New Word:** When `wordId` is not provided, creates word + sense + translation
2. **Existing Word:** When `wordId` is provided, creates sense + translation for that word only

**Authorization:** Admin only

**Request Body:**

**Scenario A: Create New Word (wordId not provided)**
```json
{
  "word": {
    "simplified": "你好",
    "traditional": "你好"
  },
  "sense": {
    "pinyin": "nǐ hǎo",
    "partOfSpeech": "interjection",
    "hskLevel": 1,
    "isPrimary": true,
    "imageUrl": null,
    "audioUrl": "https://s3.amazonaws.com/audio/nihao.mp3"
  },
  "translation": {
    "language": "vn",
    "translation": "xin chào",
    "additionalDetail": "Lời chào thông dụng nhất"
  }
}
```

**Scenario B: Add Sense to Existing Word (wordId provided)**
```json
{
  "wordId": 5,
  "sense": {
    "pinyin": "nǐ hǎo",
    "partOfSpeech": "adjective",
    "hskLevel": 2,
    "isPrimary": false,
    "imageUrl": null,
    "audioUrl": null
  },
  "translation": {
    "language": "vn",
    "translation": "tốt bụng, thân thiện",
    "additionalDetail": "Tính cách tốt"
  }
}
```

**Response:**
Returns the complete word with all senses (same format as GET /words/:id)

**Validation Rules:**
- `word.simplified` is required when wordId is not provided
- `sense.pinyin` is required
- `translation.translation` is required
- `translation.language` defaults to 'vn' if not provided
- `sense.senseNumber` is auto-generated
- Duplicate simplified words are rejected with error

---

### 5. Update Complete Word by Sense ID

**Endpoint:** `PATCH /words/senses/:senseId`

**Description:** Update word, sense, and translation together using the same unified structure as POST. All fields in the body are optional.

**Authorization:** Admin only

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| senseId | number | Yes | Word Sense ID to update |

**Request Body:**
```json
{
  "word": {
    "simplified": "你好",
    "traditional": "你好"
  },
  "sense": {
    "pinyin": "nǐ hǎo",
    "partOfSpeech": "interjection",
    "hskLevel": 1,
    "isPrimary": true,
    "imageUrl": "https://s3.amazonaws.com/images/nihao.jpg",
    "audioUrl": "https://s3.amazonaws.com/audio/nihao.mp3"
  },
  "translation": {
    "language": "vn",
    "translation": "xin chào",
    "additionalDetail": "Updated detail: Lời chào thông dụng"
  }
}
```

**Response:**
Returns the complete word with all senses (same format as GET /words/:id)

**Notes:**
- Can update word-level fields (affects all senses of that word)
- Can update sense-specific fields
- Can update translation fields
- All fields are optional - only provided fields will be updated
- If translation doesn't exist for the sense, it will be created

---

### 6. Delete Word

**Endpoint:** `DELETE /words/:id`

**Description:** Delete a word and all its senses and translations (cascade delete).

**Authorization:** Admin only

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | number | Yes | Word ID to delete |

**Response:**
```
HTTP 204 No Content
```

---

### 7. Delete Word Sense

**Endpoint:** `DELETE /words/senses/:senseId`

**Description:** Delete a specific sense and its translation. The word itself remains.

**Authorization:** Admin only

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| senseId | number | Yes | Word Sense ID to delete |

**Response:**
```
HTTP 204 No Content
```

---

## Frontend Integration Guide

### Unified Form Structure

The same TypeScript interface can be used for both CREATE and EDIT operations:

```typescript
interface WordFormData {
  wordId?: number;  // Only for adding sense to existing word
  word?: {
    simplified: string;
    traditional?: string;
  };
  sense: {
    pinyin: string;
    partOfSpeech?: string;
    hskLevel?: number;
    isPrimary?: boolean;
    imageUrl?: string;
    audioUrl?: string;
  };
  translation: {
    language?: string;  // Defaults to 'vn'
    translation: string;
    additionalDetail?: string;
  };
}
```

### Example Workflows

#### Create New Word Flow

1. User enters word in form
2. **Debounced Search:** Call `GET /words/search?simplified=你好`
3. **If word exists:** Show existing word data, offer to add new sense
4. **If word doesn't exist:** Enable full form for word creation
5. Submit to `POST /words` with appropriate payload

#### Edit Word Flow

1. Fetch word data: `GET /words/:id`
2. Display in same form used for creation
3. User modifies data
4. Submit to `PATCH /words/senses/:senseId`

---

## Migration Guide

### For Existing Data

If you have existing data with the old structure:

1. **Remove deprecated fields** from Word entity:
   - Drop `is_compound` column
   - Drop `character_count` column

2. **Update WordSense** entity:
   - Drop `example_context` column
   - Drop `usage_context` column
   - Add `image_url` column (VARCHAR(500), nullable)
   - Add `audio_url` column (VARCHAR(500), nullable)

3. **Update WordSenseTranslation** entity:
   - Rename `usage_notes` column to `additional_detail`

### Database Migration SQL

```sql
-- Word table
ALTER TABLE words DROP COLUMN is_compound;
ALTER TABLE words DROP COLUMN character_count;

-- WordSense table
ALTER TABLE word_senses DROP COLUMN example_context;
ALTER TABLE word_senses DROP COLUMN usage_context;
ALTER TABLE word_senses ADD COLUMN image_url VARCHAR(500);
ALTER TABLE word_senses ADD COLUMN audio_url VARCHAR(500);

-- WordSenseTranslation table
ALTER TABLE word_sense_translations CHANGE usage_notes additional_detail TEXT;
ALTER TABLE word_sense_translations ALTER COLUMN language SET DEFAULT 'vn';
```

---

## Error Handling

### Common Error Responses

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "Word with ID 123 not found",
  "error": "Not Found"
}
```

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "Word with this simplified form already exists. Use wordId to add a new sense.",
  "error": "Bad Request"
}
```

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**403 Forbidden:**
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

---

## Testing

### Sample Requests (using cURL)

#### Search for Word
```bash
curl -X GET "http://localhost:3000/words/search?simplified=你好" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Create New Word
```bash
curl -X POST "http://localhost:3000/words" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "word": {
      "simplified": "你好",
      "traditional": "你好"
    },
    "sense": {
      "pinyin": "nǐ hǎo",
      "partOfSpeech": "interjection",
      "hskLevel": 1,
      "isPrimary": true
    },
    "translation": {
      "translation": "xin chào",
      "additionalDetail": "Lời chào thông dụng"
    }
  }'
```

#### Add Sense to Existing Word
```bash
curl -X POST "http://localhost:3000/words" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "wordId": 5,
    "sense": {
      "pinyin": "nǐ hǎo",
      "partOfSpeech": "adjective",
      "hskLevel": 2,
      "isPrimary": false
    },
    "translation": {
      "translation": "tốt bụng",
      "additionalDetail": "Tính cách"
    }
  }'
```

#### Update Word
```bash
curl -X PATCH "http://localhost:3000/words/senses/12" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sense": {
      "imageUrl": "https://example.com/image.jpg",
      "audioUrl": "https://example.com/audio.mp3"
    },
    "translation": {
      "additionalDetail": "Updated detail"
    }
  }'
```

---

## Collateral Damage Assessment

### Files Affected by Changes

1. **✅ RAG Content Extraction Service** - Updated to remove references to `exampleContext`, `characterCount`, and `isCompound`
2. **⚠️ Postman Collection** - Needs manual update for test requests
3. **⚠️ RAG Implementation Guide** - Updated to remove `exampleContext` references
4. **✅ Build Process** - All TypeScript compilation errors fixed

### Files NOT Affected

- **Lesson entities and services** - No dependencies on word entity fields
- **Grammar entities** - Independent module structure
- **User management** - No direct word entity dependencies
- **Authentication** - No dependencies

---

## Next Steps

1. **Update Postman Collection** with new endpoint structures
2. **Create seed scripts** for words using new structure
3. **Frontend implementation** using unified form structure
4. **Add validation** for Vietnamese translation quality
5. **Consider adding** image/audio upload endpoints for media management

---

## Support

For questions or issues with the Word API:
- Check Swagger documentation at `/api` endpoint
- Review source code at `src/modules/words/`
- Report issues via project issue tracker

**Last Updated:** January 2025
