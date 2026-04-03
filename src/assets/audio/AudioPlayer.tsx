import { useRef, useState, useEffect } from "react";

interface Props {
  audioUrl: string;
  image: string;
  title: string;
}

export default function AudioPlayer({ audioUrl, image, title }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    const onTimeUpdate = () => setProgress(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration);

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoaded);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoaded);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  };

  const seek = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime += seconds;
  };

  const handleProgressChange = (e: any) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Number(e.target.value);
    setProgress(Number(e.target.value));
  };

  const handleVolumeChange = (e: any) => {
    if (!audioRef.current) return;
    const vol = Number(e.target.value);
    audioRef.current.volume = vol;
    setVolume(vol);
  };

  const changeSpeed = (s: number) => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = s;
    setSpeed(s);
  };

  const formatTime = (time: number) => {
    if (!time) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div className="w-full max-w-md mx-auto bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
      {/* Fondo blur */}
      <div className="absolute inset-0 -z-10">
        <img
          src={image}
          className="w-full h-full object-cover blur-2xl scale-110 opacity-30"
        />
      </div>

      {/* Imagen portada */}
      <div className="relative w-full h-56">
        <img src={image} alt="cover" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4">
          <p className="text-white text-sm font-semibold truncate">{title}</p>
        </div>
      </div>

      {/* Controles */}
      <div className="p-4">
        {/* Barra progreso */}
        <input
          type="range"
          min={0}
          max={duration}
          value={progress}
          onChange={handleProgressChange}
          className="w-full"
        />

        {/* Tiempo */}
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Botones */}
        <div className="flex justify-center items-center gap-4 mt-4">
          <button
            onClick={() => seek(-10)}
            className="bg-zinc-700 text-white px-3 py-1 rounded"
          >
            -10s
          </button>

          <button
            onClick={togglePlay}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>

          <button
            onClick={() => seek(10)}
            className="bg-zinc-700 text-white px-3 py-1 rounded"
          >
            +10s
          </button>
        </div>

        {/* Volumen */}
        <div className="mt-4">
          <label className="text-xs text-gray-400">Volumen</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={handleVolumeChange}
            className="w-full"
          />
        </div>

        {/* Velocidad */}
        <div className="mt-3 flex justify-center gap-2">
          {[0.5, 1, 1.5, 2].map((s) => (
            <button
              key={s}
              onClick={() => changeSpeed(s)}
              className={`px-2 py-1 rounded text-xs ${
                speed === s
                  ? "bg-blue-500 text-white"
                  : "bg-zinc-700 text-gray-300"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Audio */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
    </div>
  );
}
