# TTS Component Usage Guide

## Components Created

### 1. TTSModal
Full-featured modal for creating TTS audio from Chinese text.

### 2. TTSButton  
Simple button that opens the TTS modal.

---

## Usage Examples

### Basic Usage with TTSButton

```tsx
import TTSButton from "@/components/shared/TTSButton";

function MyComponent() {
  return (
    <TTSButton 
      text="你好世界"
      buttonText="Tạo giọng nói"
    />
  );
}
```

### With Callback

```tsx
import TTSButton from "@/components/shared/TTSButton";

function MyComponent() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleAudioGenerated = (url: string) => {
    console.log("Audio generated:", url);
    setAudioUrl(url);
    // You can now save this URL to your database or use it elsewhere
  };

  return (
    <TTSButton 
      text="你好世界"
      onAudioGenerated={handleAudioGenerated}
      buttonType="primary"
    />
  );
}
```

### In a Form (Word Creation Example)

```tsx
import { Form, Input, Button } from "antd";
import TTSButton from "@/components/shared/TTSButton";

function WordForm() {
  const [form] = Form.useForm();
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleAudioGenerated = async (url: string) => {
    setAudioUrl(url);
    // Convert blob URL to file if needed for upload
    const response = await fetch(url);
    const blob = await response.blob();
    // Upload blob to your storage (S3, etc.)
  };

  return (
    <Form form={form}>
      <Form.Item label="Chinese Text" name="simplified">
        <Input placeholder="输入中文" />
      </Form.Item>

      <Form.Item label="Pinyin" name="pinyin">
        <Input placeholder="pinyin" />
      </Form.Item>

      <Form.Item label="Audio">
        <TTSButton
          text={form.getFieldValue("simplified")}
          onAudioGenerated={handleAudioGenerated}
          buttonText="Tạo giọng nói"
        />
        {audioUrl && (
          <audio src={audioUrl} controls style={{ marginTop: 8, width: "100%" }} />
        )}
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          Create Word
        </Button>
      </Form.Item>
    </Form>
  );
}
```

### Using TTSModal Directly

```tsx
import { useState } from "react";
import { Button } from "antd";
import TTSModal from "@/components/shared/TTSModal";

function MyComponent() {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <Button onClick={() => setModalVisible(true)}>
        Open TTS
      </Button>

      <TTSModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        initialText="你好"
        onAudioGenerated={(url) => console.log("Generated:", url)}
      />
    </>
  );
}
```

---

## Props

### TTSButton Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `text` | string | `""` | Chinese text to pre-fill |
| `onAudioGenerated` | (url: string) => void | - | Callback when audio is generated |
| `buttonText` | string | `"Tạo giọng nói"` | Button text |
| `buttonType` | string | `"default"` | Ant Design button type |
| `size` | string | `"middle"` | Button size |
| `disabled` | boolean | `false` | Disable button |

### TTSModal Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `visible` | boolean | required | Modal visibility |
| `onClose` | () => void | required | Close callback |
| `initialText` | string | `""` | Pre-fill text |
| `onAudioGenerated` | (url: string) => void | - | Callback when audio is generated |

---

## Features

✅ Text input with character counter  
✅ 4 voice options (male, female, child, uncle)  
✅ Audio preview with play/pause  
✅ Download audio file  
✅ Built-in audio player  
✅ Loading states  
✅ Error handling  
✅ Vietnamese UI  

---

## API Configuration

Set the TTS API base URL in your environment variables:

```env
TTS_API_BASE_URL=http://localhost:9880
```

Or it will default to `http://localhost:9880`
