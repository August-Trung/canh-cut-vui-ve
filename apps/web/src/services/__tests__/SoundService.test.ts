// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { SoundService } from '../SoundService';
import { useGameStore } from '../../stores/gameStore';

describe('SoundService', () => {
  let mockOscillator: {
    type: string;
    frequency: {
      value: number;
      setValueAtTime: ReturnType<typeof vi.fn>;
      linearRampToValueAtTime: ReturnType<typeof vi.fn>;
      exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
    };
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    onended: (() => void) | null;
  };

  let mockGain: {
    gain: {
      value: number;
      setValueAtTime: ReturnType<typeof vi.fn>;
      linearRampToValueAtTime: ReturnType<typeof vi.fn>;
      exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
    };
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  };

  let mockAudioContext: {
    state: AudioContextState;
    currentTime: number;
    destination: Record<string, unknown>;
    resume: ReturnType<typeof vi.fn>;
    createOscillator: ReturnType<typeof vi.fn>;
    createGain: ReturnType<typeof vi.fn>;
  };

  let MockAudioContextClass: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setActivePinia(createPinia());

    mockOscillator = {
      type: 'sine',
      frequency: {
        value: 440,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null,
    };

    mockGain = {
      gain: {
        value: 1,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    mockAudioContext = {
      state: 'running',
      currentTime: 0,
      destination: {},
      resume: vi.fn().mockResolvedValue(undefined),
      createOscillator: vi.fn().mockImplementation(() => ({ ...mockOscillator })),
      createGain: vi.fn().mockImplementation(() => ({ ...mockGain })),
    };

    MockAudioContextClass = vi.fn().mockImplementation(() => mockAudioContext);
    (window as unknown as { AudioContext: unknown }).AudioContext = MockAudioContextClass;
  });

  afterEach(() => {
    delete (window as unknown as { AudioContext?: unknown }).AudioContext;
  });

  it('resumes suspended AudioContext on interaction/sound call', () => {
    mockAudioContext.state = 'suspended';
    const soundService = new SoundService();

    soundService.playPop();

    expect(mockAudioContext.resume).toHaveBeenCalled();
  });

  it('does not play audio if gameStore.audioMuted is true', () => {
    const gameStore = useGameStore();
    gameStore.setAudioMuted(true);

    const soundService = new SoundService();
    soundService.playPop();
    soundService.playHatchFanfare();
    soundService.playChirp();
    soundService.playEat();

    expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
  });

  it('plays bubble pop chime on playPop()', () => {
    const soundService = new SoundService();
    soundService.playPop();

    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    expect(mockAudioContext.createGain).toHaveBeenCalled();
  });

  it('plays celebratory multi-tone fanfare on playHatchFanfare()', () => {
    const soundService = new SoundService();
    soundService.playHatchFanfare();

    // Fanfare plays multiple notes (major chord arpeggio, e.g. 4 notes)
    expect(mockAudioContext.createOscillator.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it('plays cute chirp on playChirp()', () => {
    const soundService = new SoundService();
    soundService.playChirp();

    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    expect(mockAudioContext.createGain).toHaveBeenCalled();
  });

  it('plays playful munch/crunch sound on playEat()', () => {
    const soundService = new SoundService();
    soundService.playEat();

    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    expect(mockAudioContext.createGain).toHaveBeenCalled();
  });
});
