"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const formatSeconds = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
};

interface AudioPlayerProps {
  src: string;
  name?: string;
}

export function AudioPlayer({ src, name }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setProgress(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration || 0);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const progressPercent = useMemo(() => {
    if (!duration) return 0;
    return (progress / duration) * 100;
  }, [duration, progress]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    await audio.play();
    setIsPlaying(true);
  };

  const handleSeek = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setProgress(value);
  };

  return (
    <div className="audioCard">
      <audio ref={audioRef} src={src} preload="metadata" />
      <div className="audioMeta">
        <p>{name ?? "Audio reflection"}</p>
      </div>
      <div className="audioControls">
        <button type="button" onClick={togglePlay} className="audioBtn">
          {isPlaying ? "Pause" : "Play"}
        </button>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={progress}
          onChange={(event) => handleSeek(Number(event.target.value))}
          className="audioRange"
          aria-label="Audio progress"
        />
        <span className="audioTime">
          {formatSeconds(progress)} / {formatSeconds(duration)}
        </span>
      </div>
      <div className="audioTrackFill" style={{ width: `${progressPercent}%` }} />
    </div>
  );
}
