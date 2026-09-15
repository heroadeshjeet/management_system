import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { sfx } from '../utils/soundEffects';

export const SoundToggle = () => {
  const [muted, setMuted] = useState(() => sfx.getMuteState());

  const handleToggle = () => {
    const nextMuted = sfx.toggleMute();
    setMuted(nextMuted);
  };

  return (
    <button
      onClick={handleToggle}
      id="sound-toggler"
      aria-label="Toggle Sound Effects"
      title={muted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
      className="flex items-center justify-center w-8 h-8 rounded-full border border-current/10 bg-current/5 hover:bg-current/10 transition-colors"
    >
      {muted ? (
        <VolumeX className="w-4 h-4 opacity-50" />
      ) : (
        <Volume2 className="w-4 h-4 text-brand-cyan" />
      )}
    </button>
  );
};
