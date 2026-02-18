// ============================================
// Gemini API — Whole-Story + Illustrations
// ============================================

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

let apiKey = '';
let lastStoryBrief = '';

export function getLastStoryBrief() { return lastStoryBrief; }

export function setApiKey(key) {
    apiKey = key.trim();
    localStorage.setItem('storybuilder_api_key', apiKey);
}

export function getApiKey() {
    if (!apiKey) {
        apiKey = localStorage.getItem('storybuilder_api_key') || '';
    }
    return apiKey;
}

function describeCharacters(characters) {
    return characters.map(c => `${c.label}: ${c.appearance}`).join('\n');
}

// ----- Pass 1: Generate a creative story brief -----

export async function generateStoryBrief({ characters, setting, childName, childAge }) {
    const charList = characters.map(c => c.label).join(' and ');
    const charDescriptions = describeCharacters(characters);
    const settingLabel = setting.label;
    const age = childAge || 4;

    const nameSection = childName
        ? `- Child's Name: ${childName}\n- Child's Age: ${age}\n\nThe child MUST play an important role in the story. Pick the most fun option for their role:\n**Child's Role:** ${childName} is [The Main Hero / The Brave Sidekick / The Wise Friend / The Helper]\n**Child's Key Trait:** Give ${childName} a specific, endearing trait (e.g., '${childName} loves blue shoes', '${childName} always carries a toy wrench', '${childName} is amazing at finding lost things', '${childName} can talk to animals').`
        : `- No specific child name provided. The story should address the listener as "you" occasionally to make them feel part of the adventure.`;

    const prompt = `You are a beloved children's story creator. I need you to plan a simple, charming story concept for a ${age}-year-old.

Inputs:
- Characters: ${charList}
- Setting: ${settingLabel}
${nameSection}

Fill in this template. Keep it SIMPLE, COHERENT, and AGE-APPROPRIATE for a ${age}-year-old. The story should make logical sense from beginning to end — no surreal or confusing elements.

**The Protagonist:** ${charList} — briefly note one small personality quirk for flavor (e.g., always hums, loves puddles), but keep this minor.

**The Setting:** ${settingLabel} — describe it vividly but keep it grounded and easy for a ${age}-year-old to picture.

**The Lesson (THIS IS THE HEART OF THE STORY):** Pick ONE clear, simple lesson a ${age}-year-old can understand and remember. Examples: "it's okay to ask for help", "sharing makes things more fun", "being brave means trying even when you're scared", "everyone is good at something different", "being kind to others makes everyone happier".

**The Plot (must be DRIVEN by the lesson):** The characters want to [GOAL], but [PROBLEM] gets in the way. The PROBLEM should directly relate to the lesson — for example, if the lesson is about sharing, the problem is that someone won't share. The SOLUTION must come from the characters LEARNING the lesson. The resolution should make the child think: "Oh! That's why [lesson] is important!"

**The Tone:** Choose one: [Warm and rhyming / Gently adventurous / Cozy bedtime / Playful and fun]. Pick what's best for age ${age}.

**Special Touch:** One fun story element (e.g., a silly sound effect, a repeated phrase the characters say, a counting element).

Keep your response SHORT — just the filled-in template, 2-3 sentences per section. Output ONLY the template.`;

    const brief = await callGeminiText(prompt, { temperature: 0.85 });
    lastStoryBrief = brief;
    console.log('🧠 Story Brief (Pass 1):\n', brief);
    return brief;
}

// ----- Pass 2: Generate the ENTIRE story from the brief -----

export async function generateWholeStory({ storyBrief, totalPages, childName, childAge }) {
    const age = childAge || 4;

    const nameInstruction = childName
        ? `CRITICAL: Weave ${childName}'s name naturally into BOTH dialogue and narration throughout the story. ${childName} should feel like an essential part of the solution — not just mentioned, but actively involved. Make ${childName} feel like the most important person in the story!`
        : '';

    const prompt = `You are an expert children's story author writing a bedtime picture book for a ${age}-year-old.

Here is the story concept:

--- STORY BRIEF ---
${storyBrief}
--- END BRIEF ---

Write this as a ${totalPages}-page storybook. Follow the concept above closely.

RULES:
- 2-3 short sentences per page that RHYME - every page must RHYME, but you can get creative with patterns
- Clear story arc: beginning → middle → happy ending
- The story must make LOGICAL SENSE — each page should follow naturally from the last
- Keep it simple, warm, and easy to follow for a ${age}-year-old
- Use vocabulary appropriate for age ${age}
- THE LESSON IS THE MOST IMPORTANT PART: The problem in the story should come from NOT knowing the lesson. The solution should come from DISCOVERING the lesson. The second-to-last page should show the characters understanding the lesson. The final page should gently state or show the lesson so the child clearly understands the takeaway.
${nameInstruction}

Format: [PAGE 1] text, [PAGE 2] text, etc. Output ONLY the ${totalPages} pages.`;

    const fullText = await callGeminiText(prompt, { temperature: 0.7 });

    // Parse pages by splitting on [PAGE N] markers
    const pages = [];
    const parts = fullText.split(/\[PAGE\s*\d+\]/i).filter(s => s.trim());

    for (const part of parts) {
        const cleaned = part
            .trim()
            .toUpperCase()
            .replace(/["\u201C\u201D\u2018\u2019]/g, '')
            .replace(/\n+/g, '\n');

        if (cleaned.length > 5) {
            pages.push(cleaned);
        }
    }

    if (pages.length === 0) {
        const chunks = fullText.split(/\n\n+/).filter(c => c.trim().length > 10);
        for (const chunk of chunks) {
            const cleaned = chunk.trim().toUpperCase().replace(/["\u201C\u201D\u2018\u2019]/g, '').replace(/\n+/g, '\n');
            if (cleaned) pages.push(cleaned);
        }
    }

    if (pages.length === 0) {
        throw new Error('Could not parse story pages from response');
    }

    console.log(`✅ Generated ${pages.length} story pages`);
    pages.forEach((p, i) => console.log(`  Page ${i + 1}: ${p.substring(0, 60)}...`));
    return pages;
}

// ----- Character Reference Sheet Generation (Pass 2.5) -----

export async function generateCharacterSheet({ characters, artStylePrompt }) {
    const charDescriptions = describeCharacters(characters);

    const prompt = `You are a character designer for a children's picture book. I need you to create an EXACT, LOCKED-IN visual reference sheet for the following characters, rendered in a specific art style.

CHARACTERS:
${charDescriptions}

ART STYLE: ${artStylePrompt}

For EACH character, provide an ultra-detailed visual specification that an illustrator could follow to draw the EXACT same character every single time. Include:
- Exact body shape, proportions, and size relative to the scene
- Exact color palette (use specific color names like "warm honey-gold" not just "brown")
- Facial features: eye shape, color, expression, mouth, nose
- Clothing/accessories: every detail, pattern, and color
- Distinguishing marks or unique features
- Default pose and body language
- How they look in the specified art style

Be extremely specific — two different artists reading this should draw nearly identical characters.

Output ONLY the character reference descriptions, one per character.`;

    const sheet = await callGeminiText(prompt, { temperature: 0.3 });
    console.log('🧠 Character Sheet (Pass 2.5):\n', sheet);
    return sheet;
}

// ----- Illustration Generation (no text in image) -----

export async function generateIllustration({ characters, setting, storyText, pageNumber, totalPages, artStylePrompt, characterSheet, referenceImageBase64 }) {
    const charDescriptions = characterSheet || describeCharacters(characters);
    const settingLabel = setting.label;

    const referenceInstruction = referenceImageBase64
        ? `\nREFERENCE IMAGE PROVIDED: A reference illustration is attached. You MUST draw the characters with the EXACT SAME appearance, proportions, colors, and style as shown in the reference image. Match the art style precisely.`
        : '';

    const prompt = `CRITICAL RULE: This illustration must contain ABSOLUTELY NO text, words, letters, numbers, captions, titles, labels, watermarks, signatures, or writing of ANY kind anywhere in the image. This is a WORDLESS illustration — purely visual, zero text.

Create a children's picture book illustration for this scene:

"${storyText}"

CHARACTER VISUAL REFERENCE (draw EXACTLY as described — same colors, proportions, features on every page):
${charDescriptions}
${referenceInstruction}

SETTING: ${settingLabel}

ART STYLE: ${artStylePrompt}

RULES:
- Make the characters BIG, expressive, and the center of the scene
- Characters must look IDENTICAL to their reference descriptions on every single page
- Fill the entire image with the illustration — no borders or margins
- ZERO text anywhere — no words, letters, numbers, signs, labels, or writing of any kind
- The illustration should be colorful, warm, and full of detail
- Capture the emotion and action described in the scene

FINAL REMINDER: The image must be completely FREE of any text, letters, or writing. Purely visual, no words at all.`;

    try {
        // Build reference image parts for multimodal input
        let imageParts = null;
        if (referenceImageBase64) {
            // Extract the base64 data and mime type from the data URL
            const match = referenceImageBase64.match(/^data:(.+?);base64,(.+)$/);
            if (match) {
                imageParts = [{ inlineData: { mimeType: match[1], data: match[2] } }];
                console.log('📎 Reference image attached for page', pageNumber);
            }
        }
        return await callGeminiImage(prompt, imageParts);
    } catch (err) {
        console.warn('Illustration generation failed:', err.message);
        return null;
    }
}

// ----- Retry helper -----

async function withRetry(fn, { maxRetries = 2, baseDelay = 3000 } = {}) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            const isRateLimit = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('RATE_LIMIT') || err.message?.includes('RESOURCE_EXHAUSTED');
            if (isRateLimit && attempt < maxRetries) {
                const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
                console.log(`Rate limited, retrying in ${Math.round(delay / 1000)}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw err;
        }
    }
}

// ----- Text generation -----

const TEXT_MODELS = ['gemini-3-pro-preview', 'gemini-3-flash-preview', 'gemini-2.5-flash'];

async function callGeminiText(prompt, { temperature = 0.8 } = {}) {
    const key = getApiKey();
    if (!key) throw new Error('No API key set');

    let lastError;
    for (const model of TEXT_MODELS) {
        try {
            const result = await withRetry(async () => {
                const response = await fetch(`${API_BASE}/models/${model}:generateContent?key=${key}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { temperature, maxOutputTokens: 4096 }
                    })
                });

                if (!response.ok) {
                    const err = await response.json().catch(() => ({}));
                    throw new Error(err.error?.message || `API error ${response.status}`);
                }

                const data = await response.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!text) throw new Error('No text in response');
                return text.trim();
            });
            console.log(`✅ Text generated with model: ${model}`);
            return result;
        } catch (err) {
            console.warn(`Model ${model} failed:`, err.message);
            lastError = err;
        }
    }
    throw lastError || new Error('All models failed');
}

// ----- Image generation -----

const IMAGE_MODELS = ['gemini-3-pro-image-preview', 'gemini-2.0-flash-exp-image-generation'];

async function callGeminiImage(prompt, referenceImageParts = null) {
    const key = getApiKey();
    if (!key) throw new Error('No API key set');

    // Build the parts array: reference image(s) first, then the text prompt
    const parts = [];
    if (referenceImageParts) {
        parts.push(...referenceImageParts);
    }
    parts.push({ text: prompt });

    let lastError;
    for (const model of IMAGE_MODELS) {
        try {
            const result = await withRetry(async () => {
                const response = await fetch(`${API_BASE}/models/${model}:generateContent?key=${key}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts }],
                        generationConfig: { responseModalities: ['IMAGE', 'TEXT'] }
                    })
                });

                if (!response.ok) {
                    const err = await response.json().catch(() => ({}));
                    throw new Error(err.error?.message || `Image API error ${response.status}`);
                }

                const data = await response.json();
                const responseParts = data.candidates?.[0]?.content?.parts || [];

                for (const part of responseParts) {
                    if (part.inlineData) {
                        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    }
                }

                throw new Error('No image in response');
            }, { maxRetries: 1, baseDelay: 4000 });
            console.log(`✅ Image generated with model: ${model}`);
            return result;
        } catch (err) {
            console.warn(`Image model ${model} failed:`, err.message);
            lastError = err;
        }
    }
    throw lastError || new Error('All image models failed');
}

// ----- Validate key -----
export async function validateApiKey(key) {
    try {
        const response = await fetch(`${API_BASE}/models?key=${key}&pageSize=1`);
        return response.ok || response.status === 429;
    } catch {
        return false;
    }
}
