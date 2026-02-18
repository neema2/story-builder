// ============================================
// Voice — Speech input + Read-to-me output
// ============================================

// ----- Speech Recognition (Voice Input) -----

let recognition = null;
let isListening = false;

export function isSpeechSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function startListening(onResult, onEnd) {
    if (!isSpeechSupported()) return false;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
    };

    recognition.onend = () => {
        isListening = false;
        if (onEnd) onEnd();
    };

    recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        isListening = false;
        if (onEnd) onEnd();
    };

    recognition.start();
    isListening = true;
    return true;
}

export function stopListening() {
    if (recognition && isListening) {
        recognition.stop();
        isListening = false;
    }
}

export function getIsListening() {
    return isListening;
}

// ----- Speech Synthesis (Read to Me) -----

let currentUtterance = null;

export function isSynthesisSupported() {
    return 'speechSynthesis' in window;
}

export function readAloud(text, onEnd) {
    if (!isSynthesisSupported()) return false;

    // Stop any current reading
    stopReading();

    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.rate = 0.85; // Slightly slower for kids
    currentUtterance.pitch = 1.1; // Slightly higher pitch — friendlier
    currentUtterance.volume = 1.0;

    // Try to find a nice voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
        v.name.includes('Samantha') || // macOS
        v.name.includes('Google UK English Female') ||
        v.name.includes('Karen') ||
        (v.lang === 'en-US' && v.name.includes('Female'))
    );
    if (preferred) {
        currentUtterance.voice = preferred;
    }

    currentUtterance.onend = () => {
        currentUtterance = null;
        if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(currentUtterance);
    return true;
}

export function stopReading() {
    window.speechSynthesis.cancel();
    currentUtterance = null;
}

export function isReading() {
    return window.speechSynthesis.speaking;
}

// Preload voices (they load async)
if (isSynthesisSupported()) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };
}
