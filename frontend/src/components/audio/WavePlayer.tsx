import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause, Download, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

interface WavePlayerProps {
  audioUrl: string;
  height?: number;
  waveColor?: string;
  progressColor?: string;
  onReady?: () => void;
  showDownload?: boolean;
  downloadFilename?: string;
  className?: string;
}

export function WavePlayer({
  audioUrl,
  height = 40,
  waveColor = "#7c3aed",
  progressColor = "#a855f7",
  onReady,
  showDownload = true,
  downloadFilename = "generation.mp3",
  className,
}: WavePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize WaveSurfer
    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor,
      progressColor,
      height,
      cursorWidth: 1,
      cursorColor: progressColor,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
    });

    wavesurferRef.current = ws;

    ws.on("ready", () => {
      setIsReady(true);
      setDuration(formatTime(ws.getDuration()));
      if (onReady) onReady();
    });

    ws.on("audioprocess", (time) => {
      setCurrentTime(formatTime(time));
    });

    ws.on("seeking", () => {
      setCurrentTime(formatTime(ws.getCurrentTime()));
    });

    ws.on("finish", () => {
      setIsPlaying(false);
      setCurrentTime(formatTime(ws.getDuration()));
    });

    ws.on("play", () => setIsPlaying(true));
    ws.on("pause", () => setIsPlaying(false));
    ws.on("error", (err) => {
      console.error("WaveSurfer Error:", err);
      setHasError(true);
    });

    ws.load(audioUrl);

    return () => {
      ws.destroy();
    };
  }, [audioUrl, height, waveColor, progressColor, onReady]);

  const togglePlay = () => {
    if (wavesurferRef.current && isReady) {
      wavesurferRef.current.playPause();
    }
  };

  if (hasError) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-red-400 p-2 bg-red-950/20 rounded-md border border-red-900/50", className)}>
        <AlertCircle className="h-4 w-4" />
        Failed to load audio.
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3 bg-zinc-900/50 rounded-lg p-2 border border-zinc-800", className)}>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-zinc-300 hover:text-white hover:bg-zinc-800"
        onClick={togglePlay}
        disabled={!isReady}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
      </Button>

      <div className="flex-1 relative min-w-0">
        {!isReady && (
          <div className="absolute inset-0 flex items-center">
            <div className="h-2 w-full bg-zinc-800 rounded animate-pulse" />
          </div>
        )}
        <div 
          ref={containerRef} 
          className={cn("w-full transition-opacity duration-300", isReady ? "opacity-100" : "opacity-0")}
        />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="text-[10px] tabular-nums text-zinc-500 font-medium">
          {currentTime} / {duration}
        </div>

        {showDownload && isReady && (
          <div className="pl-1 border-l border-zinc-800">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-zinc-800"
              asChild
            >
              <a href={audioUrl} download={downloadFilename} target="_blank" rel="noreferrer">
                <Download className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
