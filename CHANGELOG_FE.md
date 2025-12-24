# Frontend Changelog

## [2025-12-22] Bool Question Types Enhancement

### New Features

#### 🎯 Question Statement Support
- **`question_bool_audio_text`** now includes a `statementContent` field
  - This is the statement that users evaluate as true/false based on the audio content
  - Supports both simple text (Vietnamese, English) and Chinese with pinyin
  - Uses the `TextContentInput` component for easy toggling between text modes

#### 🖼️ New Question Type: `question_bool_image_text`
- Similar to `question_bool_audio_text` but with image instead of audio
- Fields:
  - `instruction` - Instructions for the question
  - `image` / `image_url` - The question image
  - `alt` - Alt text for accessibility
  - `statementContent` - Statement to evaluate (text or Chinese with pinyin)
  - `correctAnswer` - Boolean (true/false)
  - `explanation` - Optional explanation

### Data Structure Changes

#### Updated: `BoolAudioTextQuestionData`
```typescript
interface BoolAudioTextQuestionData {
  instruction: string;
  audio: string;
  audio_url?: string;
  transcriptContent?: TextContent;  // Audio transcript
  english?: string;
  statementContent: TextContent;    // NEW - Statement to judge
  correctAnswer: boolean;
  explanation?: string;
}
```

#### New: `BoolImageTextQuestionData`
```typescript
interface BoolImageTextQuestionData {
  instruction: string;
  image: string;
  image_url?: string;
  alt?: string;
  statementContent: TextContent;
  correctAnswer: boolean;
  explanation?: string;
}
```

### UI Changes
- Bool question category now shows two options: "Âm Thanh" (Audio) and "Hình Ảnh" (Image)
- Question display shows statement in a highlighted blue box
- Form includes statement input with Chinese/text toggle switch

### Files Changed
- `src/types/questionType.ts` - Added `statementContent`, `BoolImageTextQuestionData`
- `src/enums/question-type.enum.ts` - Added `BoolImageText`
- `src/types/itemTypes.ts` - Updated interfaces
- `src/components/question/forms/BoolAudioTextForm.tsx` - Added statement section
- `src/components/question/forms/BoolImageTextForm.tsx` - **NEW FILE**
- `src/components/items/ItemModal.tsx` - Integrated new form
- `src/app/(admin)/.../items/page.tsx` - Updated display components

### Backend Changes (HanziiLab_BE)
- `src/modules/lessons/enums/question-type.enum.ts` - Added `BOOL_IMAGE_TEXT`
- `LESSON_API_DOCUMENTATION.md` - Updated with new data structures
