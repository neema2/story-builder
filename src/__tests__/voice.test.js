// ============================================
// Voice Module Tests
// ============================================

import { describe, it, expect, vi, beforeAll } from 'vitest';

// Set up speechSynthesis mock BEFORE importing voice module
// (voice.js runs top-level code on import that needs these)
beforeAll(() => {
    window.speechSynthesis = {
        speak: vi.fn(),
        cancel: vi.fn(),
        speaking: false,
        getVoices: vi.fn().mockReturnValue([]),
        onvoiceschanged: null,
    };
});

describe('Voice Module', () => {
    it('isSpeechSupported returns a boolean', async () => {
        const { isSpeechSupported } = await import('../voice.js');
        expect(typeof isSpeechSupported()).toBe('boolean');
    });

    it('getIsListening returns false initially', async () => {
        const { getIsListening } = await import('../voice.js');
        expect(getIsListening()).toBe(false);
    });

    it('isReading returns false when speechSynthesis.speaking is false', async () => {
        const { isReading } = await import('../voice.js');
        window.speechSynthesis.speaking = false;
        expect(isReading()).toBe(false);
    });
});
