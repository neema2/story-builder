// ============================================
// Story Builder — Main App Controller
// ============================================

import './style.css';
import { CHARACTERS, SETTINGS, ART_STYLES, TOTAL_PAGES, LOADING_MESSAGES } from './data.js';
import { setApiKey, getApiKey, validateApiKey, generateStoryBrief, generateWholeStory, generateIllustration, getLastStoryBrief } from './api.js';
import { isSpeechSupported, startListening, stopListening, getIsListening, readAloud, stopReading, isReading } from './voice.js';

// ----- App State -----
const state = {
  screen: 'welcome',
  childName: '',
  childAge: 4,
  selectedCharacters: [],
  selectedSetting: null,
  selectedArtStyle: ART_STYLES[0],     // default: watercolor
  pages: [],                            // { text, imageUrl }
  currentPage: 0,
  storyBrief: '',                       // the filled template from Pass 1
};

const app = document.getElementById('app');

// ----- Sparkle Effects -----
function spawnSparkles(x, y, count = 8) {
  const container = document.getElementById('sparkles-container');
  const colors = ['#fbbf24', '#f97316', '#ec4899', '#a78bfa', '#34d399', '#22d3ee'];
  for (let i = 0; i < count; i++) {
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle';
    sparkle.style.left = `${x + (Math.random() - 0.5) * 60}px`;
    sparkle.style.top = `${y}px`;
    sparkle.style.background = colors[Math.floor(Math.random() * colors.length)];
    sparkle.style.width = sparkle.style.height = `${4 + Math.random() * 8}px`;
    container.appendChild(sparkle);
    sparkle.addEventListener('animationend', () => sparkle.remove());
  }
}

// ----- Emoji Scene Builder -----
const SCENE_GRADIENTS = {
  space: 'linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  jungle: 'linear-gradient(180deg, #134e5e 0%, #71b280 100%)',
  ocean: 'linear-gradient(180deg, #2193b0 0%, #6dd5ed 40%, #1a5276 100%)',
  castle: 'linear-gradient(180deg, #667eea 0%, #764ba2 60%, #f093fb 100%)',
  racetrack: 'linear-gradient(180deg, #74b9ff 0%, #a29bfe 40%, #636e72 100%)',
  volcano: 'linear-gradient(180deg, #eb4d4b 0%, #f0932b 50%, #6ab04c 100%)',
  arctic: 'linear-gradient(180deg, #dfe6e9 0%, #74b9ff 50%, #0984e3 100%)',
  clouds: 'linear-gradient(180deg, #a8e6cf 0%, #dcedc1 30%, #ffd3b6 60%, #ff9a9e 100%)',
  city: 'linear-gradient(180deg, #2d3436 0%, #636e72 40%, #fdcb6e 100%)',
};

const SCENE_DECORATIONS = {
  space: ['⭐', '🌟', '💫', '🪐', '🌙', '✨'],
  jungle: ['🌿', '🍃', '🌺', '🦋', '🌸', '🍄'],
  ocean: ['🐠', '🐙', '🫧', '🐚', '🪸', '💎'],
  castle: ['✨', '👑', '🏰', '⭐', '💎', '🌟'],
  racetrack: ['🏁', '💨', '⚡', '🔥', '💫', '🌟'],
  volcano: ['🔥', '💥', '🌋', '⭐', '🪨', '💎'],
  arctic: ['❄️', '🌨️', '⛄', '🐧', '💎', '✨'],
  clouds: ['☁️', '🌤️', '🌈', '⭐', '🦅', '💫'],
  city: ['🏙️', '🌃', '⭐', '💡', '🚦', '✨'],
};

function buildEmojiScene(characters, setting) {
  const gradient = SCENE_GRADIENTS[setting?.id] || SCENE_GRADIENTS.space;
  const decorations = SCENE_DECORATIONS[setting?.id] || SCENE_DECORATIONS.space;
  const charEmojis = characters.map(c => c.emoji);

  let decoHtml = '';
  for (let i = 0; i < 14; i++) {
    const emoji = decorations[i % decorations.length];
    const left = 5 + Math.random() * 90;
    const top = 5 + Math.random() * 75;
    const size = 1.5 + Math.random() * 2;
    const delay = Math.random() * 3;
    const duration = 2.5 + Math.random() * 2;
    decoHtml += `<span style="position:absolute;left:${left}%;top:${top}%;font-size:${size}rem;animation:float ${duration}s ease-in-out ${delay}s infinite;opacity:0.7;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.2))">${emoji}</span>`;
  }

  let charHtml = '';
  charEmojis.forEach((emoji, i) => {
    const offset = charEmojis.length === 1 ? 0 : (i === 0 ? -25 : 25);
    charHtml += `<span style="font-size:5rem;animation:float 3s ease-in-out ${i * 0.3}s infinite;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.3));transform:translateX(${offset}%)">${emoji}</span>`;
  });

  return `
    <div class="emoji-scene" style="width:100%;height:100%;background:${gradient};display:flex;align-items:center;justify-content:center;gap:20px;position:relative;overflow:hidden;border-radius:12px">
      ${decoHtml}
      ${charHtml}
    </div>
  `;
}

// ----- Screen Rendering -----
function render() {
  switch (state.screen) {
    case 'story':
      document.body.style.background = 'var(--bg-night)';
      break;
    case 'end':
      document.body.style.background = 'var(--bg-warm)';
      break;
    case 'loading':
      document.body.style.background = 'var(--bg-sky)';
      break;
    default:
      document.body.style.background = 'var(--bg-gradient)';
  }

  app.innerHTML = '';

  switch (state.screen) {
    case 'welcome': renderWelcome(); break;
    case 'characters': renderCharacters(); break;
    case 'setting': renderSetting(); break;
    case 'personalize': renderPersonalize(); break;
    case 'loading': renderLoading(); break;
    case 'story': renderStory(); break;
    case 'end': renderEnd(); break;
  }

  requestAnimationFrame(() => {
    const screen = app.querySelector('.screen');
    if (screen) screen.classList.add('active');
  });
}

// ----- Welcome Screen -----
function renderWelcome() {
  const hasKey = !!getApiKey();

  const screen = document.createElement('div');
  screen.className = 'screen';
  screen.innerHTML = `
    <span class="title-emoji">📖</span>
    <h1 class="title">Story Builder</h1>
    <p class="subtitle">Let's make a magical story together! Pick your characters, choose a place, and watch the magic happen! ✨</p>
    ${!hasKey ? `
      <div class="api-key-section">
        <input type="password" id="api-key-input" placeholder="Paste your Gemini API key here" autocomplete="off" />
        <button class="btn btn-secondary" id="save-key-btn">🔑 Save Key</button>
      </div>
    ` : ''}
    <button class="btn btn-primary" id="start-btn" ${!hasKey ? 'style="opacity:0.5;pointer-events:none"' : ''}>
      🚀 Let's Go!
    </button>
    ${hasKey ? '<button class="btn btn-secondary" id="change-key-btn" style="font-size:0.85rem;padding:10px 20px;min-height:auto;">🔑 Change API Key</button>' : ''}
  `;

  app.appendChild(screen);

  if (!hasKey) {
    const input = screen.querySelector('#api-key-input');
    const saveBtn = screen.querySelector('#save-key-btn');
    const startBtn = screen.querySelector('#start-btn');

    saveBtn.addEventListener('click', async () => {
      const key = input.value.trim();
      if (!key) return;
      saveBtn.textContent = '⏳ Checking...';
      const valid = await validateApiKey(key);
      if (valid) {
        setApiKey(key);
        startBtn.style.opacity = '1';
        startBtn.style.pointerEvents = 'all';
        saveBtn.textContent = '✅ Key saved!';
        input.style.display = 'none';
        spawnSparkles(window.innerWidth / 2, window.innerHeight / 2, 20);
      } else {
        saveBtn.textContent = '❌ Invalid key — try again';
        setTimeout(() => { saveBtn.textContent = '🔑 Save Key'; }, 2000);
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveBtn.click();
    });
  }

  screen.querySelector('#start-btn').addEventListener('click', (e) => {
    spawnSparkles(e.clientX, e.clientY, 15);
    state.selectedCharacters = [];
    state.selectedSetting = null;
    state.selectedArtStyle = ART_STYLES[0];
    state.childName = '';
    state.childAge = 4;
    state.pages = [];
    state.currentPage = 0;
    state.screen = 'characters';
    render();
  });

  const changeKeyBtn = screen.querySelector('#change-key-btn');
  if (changeKeyBtn) {
    changeKeyBtn.addEventListener('click', () => {
      localStorage.removeItem('storybuilder_api_key');
      setApiKey('');
      render();
    });
  }
}

// Character categories (by index ranges in the CHARACTERS array)
const CHARACTER_CATEGORIES = [
  { label: '⚔️ Fantasy & Fairy Tale', start: 0, end: 11 },
  { label: '🐾 Animals', start: 12, end: 40 },
  { label: '🚗 Vehicles', start: 41, end: 50 },
  { label: '👷 Jobs & Helpers', start: 51, end: 62 },
  { label: '🤖 Robots & Sci-Fi', start: 63, end: 64 },
];

const ART_STYLE_CATEGORIES = [
  { label: '📚 Children\'s Books', start: 0, end: 11 },
  { label: '📺 Modern Kids\' TV', start: 12, end: 19 },
  { label: '🕹️ Throwback Classics', start: 20, end: 27 },
  { label: '🎨 General Art Styles', start: 28, end: 43 },
];

// ----- Characters Screen -----
function renderCharacters() {
  const screen = document.createElement('div');
  screen.className = 'screen screen-wide';
  screen.innerHTML = `
    <h2 class="title" style="font-size: clamp(1.5rem,6vw,2.5rem)">🎭 Who's in our story?</h2>
    <p class="subtitle">Pick 1 or 2 characters! Tap to choose.</p>
    <div class="categorized-picker" id="char-picker"></div>
    ${isSpeechSupported() ? '<button class="btn btn-icon" id="voice-btn" title="Say a character name">🎤</button>' : ''}
    <button class="btn btn-primary" id="next-btn" style="opacity:0.5;pointer-events:none">Next ➡️</button>
  `;

  const picker = screen.querySelector('#char-picker');
  CHARACTER_CATEGORIES.forEach(cat => {
    const section = document.createElement('div');
    section.className = 'category-section';
    section.innerHTML = `<h3 class="category-header">${cat.label}</h3>`;
    const grid = document.createElement('div');
    grid.className = 'card-grid card-grid-wide';

    const items = CHARACTERS.slice(cat.start, cat.end + 1);
    items.forEach(char => {
      const card = document.createElement('div');
      card.className = 'card bounce-in';
      card.dataset.id = char.id;
      card.innerHTML = `<span class="card-emoji">${char.emoji}</span><span class="card-label">${char.label}</span>`;
      card.addEventListener('click', (e) => {
        const isSelected = state.selectedCharacters.find(c => c.id === char.id);
        if (isSelected) {
          state.selectedCharacters = state.selectedCharacters.filter(c => c.id !== char.id);
          card.classList.remove('selected');
        } else if (state.selectedCharacters.length < 2) {
          state.selectedCharacters.push(char);
          card.classList.add('selected');
          spawnSparkles(e.clientX, e.clientY, 10);
        }
        updateNextBtn();
      });
      grid.appendChild(card);
    });
    section.appendChild(grid);
    picker.appendChild(section);
  });

  const nextBtn = screen.querySelector('#next-btn');
  function updateNextBtn() {
    const enabled = state.selectedCharacters.length >= 1;
    nextBtn.style.opacity = enabled ? '1' : '0.5';
    nextBtn.style.pointerEvents = enabled ? 'all' : 'none';
  }

  nextBtn.addEventListener('click', (e) => {
    spawnSparkles(e.clientX, e.clientY, 15);
    state.screen = 'setting';
    render();
  });

  const voiceBtn = screen.querySelector('#voice-btn');
  if (voiceBtn) {
    voiceBtn.addEventListener('click', () => {
      if (getIsListening()) {
        stopListening();
        voiceBtn.classList.remove('recording');
        return;
      }
      voiceBtn.classList.add('recording');
      startListening((transcript) => {
        const lower = transcript.toLowerCase();
        const match = CHARACTERS.find(c => lower.includes(c.label.toLowerCase()));
        if (match && !state.selectedCharacters.find(c => c.id === match.id) && state.selectedCharacters.length < 2) {
          state.selectedCharacters.push(match);
          const card = grid.querySelector(`[data-id="${match.id}"]`);
          if (card) card.classList.add('selected');
          spawnSparkles(window.innerWidth / 2, window.innerHeight / 2, 12);
          updateNextBtn();
        }
      }, () => { voiceBtn.classList.remove('recording'); });
    });
  }

  app.appendChild(screen);
}

const SETTING_CATEGORIES = [
  { label: '🌿 Nature & Outdoors', start: 0, end: 9 },
  { label: '✨ Fantasy & Magic', start: 10, end: 19 },
  { label: '🏙️ Urban & Modern', start: 20, end: 29 },
  { label: '🌊 Water & Ocean', start: 30, end: 35 },
  { label: '🚀 Space & Sci-Fi', start: 36, end: 41 },
];

// ----- Setting Screen -----
function renderSetting() {
  const screen = document.createElement('div');
  screen.className = 'screen screen-wide';
  screen.innerHTML = `
    <h2 class="title" style="font-size: clamp(1.5rem,6vw,2.5rem)">🌍 Where does it happen?</h2>
    <p class="subtitle">Pick a place for the adventure!</p>
    <div class="categorized-picker" id="setting-picker"></div>
    <div style="display:flex;gap:12px">
      <button class="btn btn-secondary" id="back-btn">⬅️ Back</button>
      <button class="btn btn-primary" id="next-btn" style="opacity:0.5;pointer-events:none">Next ➡️</button>
    </div>
  `;

  const picker = screen.querySelector('#setting-picker');
  SETTING_CATEGORIES.forEach(cat => {
    const section = document.createElement('div');
    section.className = 'category-section';
    section.innerHTML = `<h3 class="category-header">${cat.label}</h3>`;
    const grid = document.createElement('div');
    grid.className = 'card-grid card-grid-wide';

    const items = SETTINGS.slice(cat.start, cat.end + 1);
    items.forEach(setting => {
      const card = document.createElement('div');
      card.className = 'card bounce-in';
      card.dataset.id = setting.id;
      card.innerHTML = `<span class="card-emoji">${setting.emoji}</span><span class="card-label">${setting.label}</span>`;
      card.addEventListener('click', (e) => {
        picker.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        state.selectedSetting = setting;
        spawnSparkles(e.clientX, e.clientY, 10);
        updateNextBtn();
      });
      grid.appendChild(card);
    });
    section.appendChild(grid);
    picker.appendChild(section);
  });

  const nextBtn = screen.querySelector('#next-btn');
  function updateNextBtn() {
    nextBtn.style.opacity = state.selectedSetting ? '1' : '0.5';
    nextBtn.style.pointerEvents = state.selectedSetting ? 'all' : 'none';
  }

  nextBtn.addEventListener('click', (e) => {
    spawnSparkles(e.clientX, e.clientY, 15);
    state.screen = 'personalize';
    render();
  });

  screen.querySelector('#back-btn').addEventListener('click', () => {
    state.screen = 'characters';
    render();
  });

  app.appendChild(screen);
}

// ----- Personalize Screen (Name + Age + Art Style) -----
function renderPersonalize() {
  const screen = document.createElement('div');
  screen.className = 'screen screen-wide';
  screen.innerHTML = `
    <h2 class="title" style="font-size: clamp(1.5rem,6vw,2.5rem)">🌟 Make It Personal!</h2>

    <div class="personalize-section">
      <div class="personalize-row">
        <div class="personalize-field" style="flex:2">
          <label class="personalize-label">👶 Child's Name <span style="opacity:0.6;font-weight:400">(optional)</span></label>
          <input type="text" id="child-name-input" class="name-input" placeholder="e.g. Emma, Liam, Aiden..." value="${state.childName}" autocomplete="off" maxlength="20" />
        </div>
        <div class="personalize-field" style="flex:1">
          <label class="personalize-label">🎂 Age</label>
          <div class="age-picker">
            <button class="age-btn" id="age-down">−</button>
            <span class="age-display" id="age-display">${state.childAge}</span>
            <button class="age-btn" id="age-up">+</button>
          </div>
        </div>
      </div>
      <p class="personalize-hint">We'll tailor the story to their age and weave their name in! ✨</p>
    </div>

    <div class="personalize-section">
      <label class="personalize-label">🖌️ Illustration Style</label>
      <div class="categorized-picker" id="style-picker"></div>
    </div>

    <div style="display:flex;gap:12px">
      <button class="btn btn-secondary" id="back-btn">⬅️ Back</button>
      <button class="btn btn-primary" id="go-btn">✨ Make My Story!</button>
    </div>
  `;

  // Art style grid with categories
  const picker = screen.querySelector('#style-picker');
  ART_STYLE_CATEGORIES.forEach(cat => {
    const section = document.createElement('div');
    section.className = 'category-section';
    section.innerHTML = `<h3 class="category-header">${cat.label}</h3>`;
    const grid = document.createElement('div');
    grid.className = 'card-grid card-grid-wide';

    const items = ART_STYLES.slice(cat.start, cat.end + 1);
    items.forEach(style => {
      const card = document.createElement('div');
      card.className = `card bounce-in ${style.id === state.selectedArtStyle.id ? 'selected' : ''}`;
      card.dataset.id = style.id;
      card.innerHTML = `<span class="card-emoji">${style.emoji}</span><span class="card-label">${style.label}</span>`;
      card.addEventListener('click', (e) => {
        picker.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        state.selectedArtStyle = style;
        spawnSparkles(e.clientX, e.clientY, 8);
      });
      grid.appendChild(card);
    });
    section.appendChild(grid);
    picker.appendChild(section);
  });

  // Name input
  const nameInput = screen.querySelector('#child-name-input');
  nameInput.addEventListener('input', () => {
    state.childName = nameInput.value.trim();
  });

  // Age picker
  const ageDisplay = screen.querySelector('#age-display');
  screen.querySelector('#age-down').addEventListener('click', (e) => {
    if (state.childAge > 2) {
      state.childAge--;
      ageDisplay.textContent = state.childAge;
      spawnSparkles(e.clientX, e.clientY, 4);
    }
  });
  screen.querySelector('#age-up').addEventListener('click', (e) => {
    if (state.childAge < 12) {
      state.childAge++;
      ageDisplay.textContent = state.childAge;
      spawnSparkles(e.clientX, e.clientY, 4);
    }
  });

  screen.querySelector('#go-btn').addEventListener('click', (e) => {
    spawnSparkles(e.clientX, e.clientY, 25);
    state.childName = nameInput.value.trim();
    state.screen = 'loading';
    state.pages = [];
    state.currentPage = 0;
    render();
    startStoryGeneration();
  });

  screen.querySelector('#back-btn').addEventListener('click', () => {
    state.childName = nameInput.value.trim();
    state.screen = 'setting';
    render();
  });

  app.appendChild(screen);

  // Auto-focus the name input
  requestAnimationFrame(() => nameInput.focus());
}

// ----- Loading Screen -----
function renderLoading() {
  const msg = LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
  const screen = document.createElement('div');
  screen.className = 'screen';
  screen.innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner">🪄</div>
      <p class="loading-text" id="loading-msg">${msg}</p>
      <p class="subtitle" style="font-size:0.95rem;opacity:0.7">
        ${state.childName ? `A story for <strong>${state.childName}</strong> with ` : ''}
        ${state.selectedCharacters.map(c => c.emoji).join(' ')} in ${state.selectedSetting?.emoji || ''} ${state.selectedSetting?.label || ''}
      </p>
      <p class="subtitle" style="font-size:0.85rem;opacity:0.5">
        ${state.selectedArtStyle.emoji} ${state.selectedArtStyle.label} style
      </p>
    </div>
  `;
  app.appendChild(screen);

  const loadingMsg = screen.querySelector('#loading-msg');
  const interval = setInterval(() => {
    if (state.screen !== 'loading') { clearInterval(interval); return; }
    loadingMsg.textContent = LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
  }, 2500);
}

// ----- Story Generation -----
async function startStoryGeneration() {
  try {
    // Pass 1: Generate a creative story brief
    const storyBrief = await generateStoryBrief({
      characters: state.selectedCharacters,
      setting: state.selectedSetting,
      childName: state.childName,
      childAge: state.childAge,
    });

    // Pass 2: Write the full story from the brief
    const storyPages = await generateWholeStory({
      storyBrief,
      totalPages: TOTAL_PAGES,
      childName: state.childName,
      childAge: state.childAge,
    });

    state.storyBrief = storyBrief;
    state.pages = storyPages.map(text => ({ text, imageUrl: null }));
    state.currentPage = 0;

    // Wait for page 1 illustration to finish BEFORE showing the story
    await generateIllustrationForPage(0);

    state.screen = 'story';
    render();

    // Pre-fetch page 2's illustration while they read page 1
    generateIllustrationForPage(1);

  } catch (error) {
    console.error('Story generation failed:', error);
    const loadingContainer = document.querySelector('.loading-container');
    if (loadingContainer) {
      loadingContainer.innerHTML = `
        <div class="loading-spinner" style="animation:none">😅</div>
        <p class="loading-text">Oops! The magic wand needs a rest.</p>
        <p class="subtitle" style="font-size:0.9rem;opacity:0.8;max-width:350px">
          ${error.message?.includes('quota') || error.message?.includes('429')
          ? 'Too many stories at once! Wait a moment and try again.'
          : 'Something went wrong. Let\'s try again!'}
        </p>
        <div style="display:flex;gap:12px;margin-top:8px">
          <button class="btn btn-secondary" id="error-back-btn">⬅️ Go Back</button>
          <button class="btn btn-primary" id="error-retry-btn">🔄 Try Again!</button>
        </div>
      `;
      loadingContainer.querySelector('#error-retry-btn')?.addEventListener('click', (e) => {
        spawnSparkles(e.clientX, e.clientY, 10);
        state.pages = [];
        state.currentPage = 0;
        render();
        startStoryGeneration();
      });
      loadingContainer.querySelector('#error-back-btn')?.addEventListener('click', () => {
        state.screen = 'personalize';
        render();
      });
    }
  }
}

async function generateIllustrationForPage(pageIndex) {
  if (pageIndex >= state.pages.length) return;
  const page = state.pages[pageIndex];
  if (page.imageUrl) return;

  try {
    const imageUrl = await generateIllustration({
      characters: state.selectedCharacters,
      setting: state.selectedSetting,
      storyText: page.text,
      pageNumber: pageIndex + 1,
      totalPages: TOTAL_PAGES,
      artStylePrompt: state.selectedArtStyle.prompt,
    });

    if (imageUrl) {
      state.pages[pageIndex].imageUrl = imageUrl;
      if (state.screen === 'story' && state.currentPage === pageIndex) {
        fadeInIllustration(imageUrl);
      }
    }
  } catch (err) {
    console.warn(`Failed to generate illustration for page ${pageIndex + 1}:`, err.message);
  }
}

function fadeInIllustration(imageUrl) {
  const frame = document.querySelector('.book-page-frame');
  if (!frame) return;

  const img = document.createElement('img');
  img.src = imageUrl;
  img.alt = 'Story illustration';
  img.style.opacity = '0';
  img.style.transition = 'opacity 0.8s ease';

  const emojiScene = frame.querySelector('.emoji-scene');
  img.onload = () => {
    img.style.opacity = '1';
    if (emojiScene) {
      emojiScene.style.transition = 'opacity 0.5s ease';
      emojiScene.style.opacity = '0';
      setTimeout(() => emojiScene.remove(), 500);
    }
  };

  frame.insertBefore(img, frame.firstChild);
}

// ----- Story Screen -----
function renderStory() {
  const page = state.pages[state.currentPage];
  if (!page) return;

  const isLastPage = state.currentPage === state.pages.length - 1;

  const screen = document.createElement('div');
  screen.className = 'screen';
  screen.style.padding = '0';

  screen.innerHTML = `
    <div class="book-wrapper">
      <div class="book-page-frame fade-in">
        ${page.imageUrl
      ? `<img src="${page.imageUrl}" alt="Story illustration" />`
      : buildEmojiScene(state.selectedCharacters, state.selectedSetting)
    }
        <div class="book-text-overlay">${page.text}</div>
      </div>
      <div class="book-nav">
        ${state.currentPage > 0
      ? '<button class="book-nav-btn" id="prev-btn">⬅️</button>'
      : '<div style="width:44px"></div>'
    }
        <button class="book-nav-btn" id="read-btn" title="Read to me">🔊</button>
        <div class="page-dots">
          ${state.pages.map((_, i) =>
      `<button class="page-dot ${i === state.currentPage ? 'active' : ''}" data-page="${i}"></button>`
    ).join('')}
        </div>
        ${isLastPage
      ? '<button class="book-nav-btn primary" id="finish-btn">🎉</button>'
      : '<button class="book-nav-btn primary" id="next-page-btn">➡️</button>'
    }
        <button class="book-nav-btn" id="prompt-btn" title="Show story prompt">📋</button>
      </div>
    </div>
  `;

  app.appendChild(screen);

  // --- Event Listeners ---
  const prevBtn = screen.querySelector('#prev-btn');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      stopReading();
      state.currentPage--;
      render();
    });
  }

  const nextPageBtn = screen.querySelector('#next-page-btn');
  if (nextPageBtn) {
    nextPageBtn.addEventListener('click', async (e) => {
      spawnSparkles(e.clientX, e.clientY, 10);
      stopReading();
      state.currentPage++;

      if (!state.pages[state.currentPage]?.imageUrl) {
        // Image not ready yet — show text, then await image and update
        render();
        await generateIllustrationForPage(state.currentPage);
      } else {
        // Image already prefetched — render with it immediately
        render();
      }

      // Pre-fetch the NEXT page's illustration
      if (state.currentPage + 1 < state.pages.length) {
        generateIllustrationForPage(state.currentPage + 1);
      }
    });
  }

  const finishBtn = screen.querySelector('#finish-btn');
  if (finishBtn) {
    finishBtn.addEventListener('click', (e) => {
      spawnSparkles(e.clientX, e.clientY, 30);
      stopReading();
      state.screen = 'end';
      render();
    });
  }

  const readBtn = screen.querySelector('#read-btn');
  if (readBtn && page.text) {
    readBtn.addEventListener('click', () => {
      if (isReading()) {
        stopReading();
        readBtn.textContent = '🔊';
      } else {
        readBtn.textContent = '⏹️';
        readAloud(page.text, () => { readBtn.textContent = '🔊'; });
      }
    });
  }

  screen.querySelectorAll('.page-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      const targetPage = parseInt(dot.dataset.page);
      if (targetPage < state.pages.length) {
        stopReading();
        state.currentPage = targetPage;
        render();
        generateIllustrationForPage(targetPage);
      }
    });
  });

  // Show Prompt button
  const promptBtn = screen.querySelector('#prompt-btn');
  if (promptBtn) {
    promptBtn.addEventListener('click', () => showPromptModal());
  }
}

// ----- Prompt Modal -----
function showPromptModal() {
  const brief = state.storyBrief || getLastStoryBrief() || 'No story brief available.';

  const overlay = document.createElement('div');
  overlay.className = 'prompt-modal-overlay';
  overlay.innerHTML = `
    <div class="prompt-modal">
      <h3 class="prompt-modal-title">🧠 Story Brief (Pass 1)</h3>
      <div class="prompt-modal-content">${brief.replace(/\n/g, '<br>')}</div>
      <button class="btn btn-primary prompt-modal-close" id="close-prompt-modal">Close</button>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('active'));

  const close = () => {
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 300);
  };

  overlay.querySelector('#close-prompt-modal').addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
}

// ----- End Screen -----
function renderEnd() {
  const screen = document.createElement('div');
  screen.className = 'screen';
  screen.innerHTML = `
    <div class="end-celebration">🎉</div>
    <h1 class="title">The End!</h1>
    <p class="subtitle">
      ${state.childName
      ? `What an amazing story for <strong>${state.childName}</strong> about`
      : 'What a great story about'}
      ${state.selectedCharacters.map(c => `${c.emoji} ${c.label}`).join(' and ')}
      in ${state.selectedSetting?.emoji} ${state.selectedSetting?.label}!
    </p>
    <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center">
      <button class="btn btn-primary" id="new-story-btn">🚀 New Story!</button>
      <button class="btn btn-secondary" id="read-again-btn">📖 Read Again</button>
    </div>
  `;

  app.appendChild(screen);

  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      spawnSparkles(Math.random() * window.innerWidth, Math.random() * window.innerHeight, 12);
    }, i * 300);
  }

  screen.querySelector('#new-story-btn').addEventListener('click', (e) => {
    spawnSparkles(e.clientX, e.clientY, 20);
    state.screen = 'welcome';
    render();
  });

  screen.querySelector('#read-again-btn').addEventListener('click', () => {
    state.currentPage = 0;
    state.screen = 'story';
    render();
  });
}

// ----- Init -----
render();
