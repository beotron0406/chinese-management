# TTS API Guide for Frontend

## Overview
Chinese Text-to-Speech API with 4 voice options.

---

## Endpoint

**POST** `/audio-gen/tts`

### Request

```json
{
  "text": "你好世界",
  "voice": "female"
}
```

| Field | Type | Required | Options |
|-------|------|----------|---------|
| `text` | string | ✅ | Chinese text to speak |
| `voice` | string | ✅ | `male`, `female`, `child`, `uncle` |

### Response

- **Content-Type**: `audio/wav`
- **Body**: Binary audio file

---

## Usage Examples

### JavaScript (Fetch)

```javascript
async function generateSpeech(text, voice = 'female') {
  const response = await fetch('/audio-gen/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, voice }),
  });

  if (!response.ok) throw new Error('TTS generation failed');

  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  
  // Play audio
  const audio = new Audio(audioUrl);
  audio.play();
}

// Example
generateSpeech('你好，我是小明', 'child');
```

### With Audio Element (React)

```tsx
const [audioUrl, setAudioUrl] = useState<string | null>(null);

const playText = async (text: string, voice: string) => {
  const res = await fetch('/audio-gen/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice }),
  });
  
  const blob = await res.blob();
  setAudioUrl(URL.createObjectURL(blob));
};

return <audio src={audioUrl} autoPlay controls />;
```

---

## Other Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/audio-gen/health` | Check TTS service status |
| GET | `/audio-gen/voices` | List available voices |

---

## Voice Descriptions

| Voice | Description |
|-------|-------------|
| `male` | Adult male voice |
| `female` | Adult female voice |
| `child` | Child voice |
| `uncle` | Older male voice |
