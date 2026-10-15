import { useCallback, useEffect, useState } from "react";

export function useExecutionPlayback(duration: number) {
  const [position, setPosition] = useState(0);
  const [requestedPlaying, setPlaying] = useState(false);
  const [resetVersion, setResetVersion] = useState(0);
  const tick = Math.min(position, duration);
  const playing = requestedPlaying && tick < duration;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setPosition((previous) => Math.min(duration, previous + 1));
    }, 420);
    return () => window.clearInterval(timer);
  }, [playing, duration]);

  const reset = useCallback(() => {
    setPlaying(false);
    setPosition(0);
    setResetVersion((previous) => previous + 1);
  }, []);
  const seek = (value: number) => {
    setPlaying(false);
    setPosition(Math.max(0, Math.min(duration, value)));
  };
  const toggle = () => {
    if (tick >= duration) setPosition(0);
    setPlaying(!playing);
  };
  return {
    tick,
    playing,
    reset,
    seek,
    toggle,
    resetVersion,
    step: () => seek(tick + 1),
  };
}
