# TTS Implementation - Complete Guide

## 📦 What Was Created

### API Routes (Backend Proxy)
1. **`/api/audio-gen/tts`** - Generate TTS audio
2. **`/api/audio-gen/health`** - Check TTS service status
3. **`/api/audio-gen/voices`** - Get available voices

### React Components
1. **`TTSModal`** - Full-featured modal with TTS generation
2. **`TTSButton`** - Simple button to open TTS modal
3. **`WordFormWithTTS`** - Example word form with TTS integration

### Services
1. **`ttsService`** - TypeScript service for TTS API calls

---

## 🚀 Quick Start

### 1. Set Environment Variable

Add to `.env.local`:
```env
TTS_API_BASE_URL=http://localhost:9880
```

### 2. Use TTSButton in Your Form

```tsx
import TTSButton from "@/components/shared/TTSButton";

function MyForm() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  return (
    <Form>
      <Form.Item label="Chinese Text" name="text">
        <Input />
      </Form.Item>

      <Form.Item label="Audio">
        <TTSButton
          text={form.getFieldValue("text")}
          onAudioGenerated={setAudioUrl}
        />
        {audioUrl && <audio src={audioUrl} controls />}
      </Form.Item>
    </Form>
  );
}
```

### 3. Or Use Service Directly

```tsx
import { ttsService } from "@/services/ttsService";

async function generateAudio() {
  // Get as URL
  const audioUrl = await ttsService.generateTTSUrl("你好世界", "female");
  
  // Or get as File
  const audioFile = await ttsService.generateTTSFile("你好世界", "female");
  
  // Or download directly
  await ttsService.downloadTTS("你好世界", "female", "hello.wav");
}
```

---

## 📁 File Structure

```
src/
├── app/
│   └── api/
│       └── audio-gen/
│           ├── tts/route.ts          ✅ Generate TTS
│           ├── health/route.ts       ✅ Health check
│           └── voices/route.ts       ✅ Get voices
├── components/
│   └── shared/
│       ├── TTSModal.tsx              ✅ Main modal component
│       ├── TTSButton.tsx             ✅ Button component
│       └── examples/
│           └── WordFormWithTTS.tsx   ✅ Example usage
└── services/
    └── ttsService.ts                 ✅ TTS service utilities
```

---

## 🎯 Features

### TTSModal Features
- ✅ Chinese text input with character counter (max 500)
- ✅ 4 voice options (male, female, child, uncle)
- ✅ Real-time audio preview
- ✅ Play/pause controls
- ✅ Download audio file (.wav)
- ✅ Built-in audio player
- ✅ Loading states
- ✅ Error handling
- ✅ Vietnamese UI
- ✅ Auto cleanup on close

### TTSButton Features
- ✅ One-click to open modal
- ✅ Pre-fill text support
- ✅ Customizable appearance
- ✅ Callback on audio generated
- ✅ Disabled state support

---

## 🔧 API Endpoints

### POST /api/audio-gen/tts
Generate TTS audio from text.

**Request:**
```json
{
  "text": "你好世界",
  "voice": "female"
}
```

**Response:** Binary audio/wav file

### GET /api/audio-gen/health
Check TTS service status.

**Response:**
```json
{
  "status": "ok"
}
```

### GET /api/audio-gen/voices
Get available voices.

**Response:**
```json
{
  "voices": [
    {
      "id": "male",
      "name": "Male Voice",
      "description": "Adult male voice"
    }
  ]
}
```

---

## 💡 Usage Examples

### Example 1: Simple Usage
```tsx
<TTSButton text="你好" />
```

### Example 2: With Callback
```tsx
<TTSButton
  text="你好世界"
  onAudioGenerated={(url) => console.log("Audio URL:", url)}
  buttonType="primary"
/>
```

### Example 3: In Form with Watch
```tsx
const text = Form.useWatch("simplified", form);

<TTSButton
  text={text}
  onAudioGenerated={handleAudioGenerated}
  disabled={!text}
/>
```

### Example 4: Service Usage
```tsx
import { ttsService } from "@/services/ttsService";

// Generate and play
const url = await ttsService.generateTTSUrl("你好", "female");
const audio = new Audio(url);
audio.play();

// Generate and save as File
const file = await ttsService.generateTTSFile("你好", "female");
// Upload file to S3 or storage

// Direct download
await ttsService.downloadTTS("你好", "female", "greeting.wav");
```

---

## 🎨 Props Reference

### TTSModal Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| visible | boolean | ✅ | Modal visibility |
| onClose | () => void | ✅ | Close handler |
| initialText | string | ❌ | Pre-fill text |
| onAudioGenerated | (url: string) => void | ❌ | Callback when audio generated |

### TTSButton Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| text | string | "" | Text to generate audio from |
| onAudioGenerated | (url: string) => void | - | Callback when audio generated |
| buttonText | string | "Tạo giọng nói" | Button label |
| buttonType | string | "default" | Button type |
| size | string | "middle" | Button size |
| disabled | boolean | false | Disable button |

---

## 🔄 Integration Flow

1. **User clicks TTSButton** → Opens TTSModal
2. **User enters Chinese text** → Validates input
3. **User selects voice** → Updates voice option
4. **User clicks "Tạo giọng nói"** → Sends request to `/api/audio-gen/tts`
5. **API proxies to TTS service** → Gets audio from external service
6. **Returns audio blob** → Creates object URL
7. **Shows preview** → User can play/download
8. **Calls callback** → Parent component receives audio URL
9. **Parent saves/uploads** → Store audio URL in database

---

## 📝 Common Use Cases

### Use Case 1: Word Creation Form
When creating a new word, generate audio for pronunciation.

### Use Case 2: Sentence Builder
Generate audio for example sentences.

### Use Case 3: Lesson Content
Create audio files for lesson content.

### Use Case 4: Flashcard Creation
Generate audio for flashcard practice.

---

## ⚠️ Important Notes

1. **Audio URLs are temporary** - Use `URL.createObjectURL()`, must be uploaded to permanent storage
2. **Memory cleanup** - Always revoke URLs with `URL.revokeObjectURL()` when done
3. **File size** - WAV files can be large, consider converting to MP3
4. **TTS Service** - Must be running on configured URL (default: http://localhost:9880)
5. **CORS** - Ensure TTS service allows CORS from your frontend

---

## 🐛 Troubleshooting

### TTS Service Not Available
```tsx
// Check service health
const health = await ttsService.checkHealth();
console.log(health.status); // "ok" or "error"
```

### Audio Not Playing
- Check browser console for errors
- Verify audio format is supported
- Test with different browsers

### Download Not Working
- Check browser download permissions
- Verify file is generated correctly
- Try different browsers

---

## 🚀 Next Steps

1. ✅ **Test the components** - Try TTSButton in your forms
2. ✅ **Implement upload** - Add S3 upload in `ttsService.uploadAudio()`
3. ✅ **Store URLs** - Save audio URLs to database
4. ✅ **Add to forms** - Integrate into word/sentence creation forms
5. ✅ **Optimize** - Consider caching frequently used audio

---

## 📚 Related Files

- [TTS_API_GUIDE.md](./TTS_API_GUIDE.md) - Original TTS API documentation
- [TTS_COMPONENT_USAGE.md](./TTS_COMPONENT_USAGE.md) - Component usage guide
- [WordFormWithTTS.tsx](../src/components/shared/examples/WordFormWithTTS.tsx) - Example implementation

---

## 🎉 Ready to Use!

Everything is set up and ready. Just:
1. Make sure TTS service is running
2. Import and use `TTSButton` or `TTSModal`
3. Handle the generated audio URL
4. Save to your storage/database

Enjoy creating audio content! 🎵
