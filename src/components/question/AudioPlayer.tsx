import React, { useState, useRef } from 'react';
import { Button, Slider, Space } from 'antd';
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  SoundOutlined 
} from '@ant-design/icons';

interface AudioPlayerProps {
  audioUrl: string;
  autoPlay?: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  audioUrl, 
  autoPlay = false 
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(100);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      if (autoPlay) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleSliderChange = (value: number) => {
    setCurrentTime(value);
    if (audioRef.current) {
      audioRef.current.currentTime = value;
    }
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    if (audioRef.current) {
      audioRef.current.volume = value / 100;
    }
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div style={{ width: '100%' }}>
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        style={{ display: 'none' }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button 
          type="text" 
          onClick={togglePlay} 
          icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
          size="large"
          disabled={!audioUrl}
        />
        
        <div style={{ flex: 1 }}>
          <Slider
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSliderChange}
            step={0.1}
            tooltip={{ formatter: value => formatTime(value || 0) }}
            disabled={!audioUrl}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        
        <Space>
          <SoundOutlined />
          <Slider
            min={0}
            max={100}
            value={volume}
            onChange={handleVolumeChange}
            style={{ width: 80 }}
            disabled={!audioUrl}
          />
        </Space>
      </div>
    </div>
  );
};

export default AudioPlayer;