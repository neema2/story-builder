// ============================================
// Data Module Tests
// ============================================

import { describe, it, expect } from 'vitest';
import { CHARACTERS, SETTINGS, ART_STYLES, TOTAL_PAGES, LOADING_MESSAGES } from '../data.js';

describe('CHARACTERS', () => {
    it('should have at least 5 characters', () => {
        expect(CHARACTERS.length).toBeGreaterThanOrEqual(5);
    });

    it('each character should have required fields', () => {
        CHARACTERS.forEach(char => {
            expect(char).toHaveProperty('id');
            expect(char).toHaveProperty('emoji');
            expect(char).toHaveProperty('label');
            expect(char).toHaveProperty('appearance');
            expect(typeof char.id).toBe('string');
            expect(typeof char.label).toBe('string');
            expect(char.appearance.length).toBeGreaterThan(10);
        });
    });

    it('should have unique IDs', () => {
        const ids = CHARACTERS.map(c => c.id);
        expect(new Set(ids).size).toBe(ids.length);
    });
});

describe('SETTINGS', () => {
    it('should have at least 5 settings', () => {
        expect(SETTINGS.length).toBeGreaterThanOrEqual(5);
    });

    it('each setting should have required fields', () => {
        SETTINGS.forEach(s => {
            expect(s).toHaveProperty('id');
            expect(s).toHaveProperty('emoji');
            expect(s).toHaveProperty('label');
        });
    });

    it('should have unique IDs', () => {
        const ids = SETTINGS.map(s => s.id);
        expect(new Set(ids).size).toBe(ids.length);
    });
});

describe('ART_STYLES', () => {
    it('should have at least 10 art styles', () => {
        expect(ART_STYLES.length).toBeGreaterThanOrEqual(10);
    });

    it('each style should have required fields', () => {
        ART_STYLES.forEach(style => {
            expect(style).toHaveProperty('id');
            expect(style).toHaveProperty('emoji');
            expect(style).toHaveProperty('label');
            expect(style).toHaveProperty('prompt');
            expect(style.prompt.length).toBeGreaterThan(20);
        });
    });

    it('should have unique IDs', () => {
        const ids = ART_STYLES.map(s => s.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('should include children book-inspired styles', () => {
        const ids = ART_STYLES.map(s => s.id);
        expect(ids).toContain('drseuss');
        expect(ids).toContain('goodnightmoon');
        expect(ids).toContain('wildthings');
    });

    it('should include modern TV show styles', () => {
        const ids = ART_STYLES.map(s => s.id);
        expect(ids).toContain('bluey');
        expect(ids).toContain('pawpatrol');
        expect(ids).toContain('peppapig');
    });

    it('should include throwback classic styles', () => {
        const ids = ART_STYLES.map(s => s.id);
        expect(ids).toContain('turtles');
        expect(ids).toContain('transformers');
        expect(ids).toContain('voltron');
    });
});

describe('TOTAL_PAGES', () => {
    it('should be a positive number', () => {
        expect(TOTAL_PAGES).toBeGreaterThan(0);
    });

    it('should be 8', () => {
        expect(TOTAL_PAGES).toBe(8);
    });
});

describe('LOADING_MESSAGES', () => {
    it('should have at least 3 messages', () => {
        expect(LOADING_MESSAGES.length).toBeGreaterThanOrEqual(3);
    });

    it('each message should be a non-empty string', () => {
        LOADING_MESSAGES.forEach(msg => {
            expect(typeof msg).toBe('string');
            expect(msg.length).toBeGreaterThan(0);
        });
    });
});
