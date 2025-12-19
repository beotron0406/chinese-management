export type VoiceType = "male" | "female" | "child" | "uncle";

export interface TTSRequest {
  text: string;
  voice: VoiceType;
}

export interface VoiceOption {
  id: VoiceType;
  name: string;
  description: string;
}

export interface TTSHealthStatus {
  status: "ok" | "error";
  message?: string;
}

class TTSService {
  private baseUrl = "/api/audio-gen";

  /**
   * Generate TTS audio from text
   */
  async generateTTS(text: string, voice: VoiceType = "female"): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, voice }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Failed to generate TTS");
    }

    return await response.blob();
  }

  /**
   * Generate TTS and return as URL
   */
  async generateTTSUrl(
    text: string,
    voice: VoiceType = "female"
  ): Promise<string> {
    const blob = await this.generateTTS(text, voice);
    return URL.createObjectURL(blob);
  }

  /**
   * Generate TTS and return as File object
   */
  async generateTTSFile(
    text: string,
    voice: VoiceType = "female",
    filename?: string
  ): Promise<File> {
    const blob = await this.generateTTS(text, voice);
    const name = filename || `tts_${Date.now()}.wav`;
    return new File([blob], name, { type: "audio/wav" });
  }

  /**
   * Download TTS audio
   */
  async downloadTTS(
    text: string,
    voice: VoiceType = "female",
    filename?: string
  ): Promise<void> {
    const blob = await this.generateTTS(text, voice);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || `tts_${Date.now()}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Check TTS service health
   */
  async checkHealth(): Promise<TTSHealthStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        status: "error",
        message: "TTS service unavailable",
      };
    }
  }

  /**
   * Get available voices
   */
  async getVoices(): Promise<VoiceOption[]> {
    try {
      const response = await fetch(`${this.baseUrl}/voices`);
      const data = await response.json();
      return data.voices || this.getDefaultVoices();
    } catch (error) {
      return this.getDefaultVoices();
    }
  }

  /**
   * Get default voice options
   */
  private getDefaultVoices(): VoiceOption[] {
    return [
      { id: "male", name: "Male Voice", description: "Adult male voice" },
      { id: "female", name: "Female Voice", description: "Adult female voice" },
      { id: "child", name: "Child Voice", description: "Child voice" },
      { id: "uncle", name: "Uncle Voice", description: "Older male voice" },
    ];
  }

  /**
   * Upload audio blob to storage (S3, etc.)
   * This is a placeholder - implement based on your storage solution
   */
  async uploadAudio(blob: Blob, filename: string): Promise<string> {
    // TODO: Implement your upload logic here
    // Example: Upload to S3 using presigned URL
    throw new Error("Upload functionality not implemented");
  }
}

export const ttsService = new TTSService();
