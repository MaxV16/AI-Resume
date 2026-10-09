const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const CHAR_LIMIT = 2851;
const A4_CHARS_PER_PAGE = 3200;

let apiKey = localStorage.getItem('deepseek_api_key') || '';
let parsedData = null;
let activeKeywords = null;
let activeJobTitle = '';
let coverLetterText = '';
let interviewData = [];
let interviewAsk = [];
let interviewOpen = [];
let isConnected = false;
let chatHistory = [];

const masterCv = document.getElementById('master-cv');
const jobDesc = document.getElementById('job-description');
const btnApi = document.getElementById('btn-api');
const btnParse = document.getElementById('btn-parse');
const btnRegenerateCover = document.getElementById('btn-regenerate-cover');
const btnExportCv = document.getElementById('btn-export-cv');
const btnExportCover = document.getElementById('btn-export-cover');
const skillsSelect = document.getElementById('skills-select');
const skillsCopy = document.getElementById('skills-copy');
const btnCopySkills = document.getElementById('btn-copy-skills');
const interviewFormat = document.getElementById('interview-format');
const btnGenerateInterview = document.getElementById('btn-generate-interview');
const interviewQuestion = document.getElementById('interview-question');
const interviewAnswer = document.getElementById('interview-answer');
const interviewExtra = document.getElementById('interview-extra');
const chatLog = document.getElementById('chat-log');
const chatInput = document.getElementById('chat-input');
const btnChatSend = document.getElementById('btn-chat-send');
const loadingText = document.getElementById('loading-text');
const apiModal = document.getElementById('api-modal');
const apiKeyInput = document.getElementById('api-key-input');
const btnSaveKey = document.getElementById('btn-save-key');
const btnTestConnection = document.getElementById('btn-test-connection');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnClearKey = document.getElementById('btn-clear-key');
const apiStatus = document.getElementById('api-status');
const testStatus = document.getElementById('test-status');
const loading = document.getElementById('loading');
const charCount = document.getElementById('char-count');
const pageEstimate = document.getElementById('page-estimate');
const atsScore = document.getElementById('ats-score');
const charWarning = document.getElementById('char-warning');
const pageWarning = document.getElementById('page-warning');
const cvPreview = document.getElementById('cv-preview');
const coverPreview = document.getElementById('cover-letter-preview');
const missingWarning = document.getElementById('missing-warning');
const atsBreakdown = document.getElementById('ats-breakdown');

const fields = {
    contact: document.getElementById('field-contact'),
    education: document.getElementById('field-education'),
    techSkills: document.getElementById('field-tech-skills'),
    softSkills: document.getElementById('field-soft-skills'),
    experience: document.getElementById('field-experience'),
    projects: document.getElementById('field-projects'),
};

function init() {
    updateApiStatus();

    btnApi.addEventListener('click', () => {
        apiKeyInput.value = apiKey;
        testStatus.textContent = '';
        apiModal.style.display = 'flex';
    });

    btnCloseModal.addEventListener('click', () => {
        apiModal.style.display = 'none';
    });

    btnSaveKey.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (!key) {
            alert('Please enter an API key.');
            return;
        }
        if (!key.startsWith('sk-')) {
            alert('API key should start with "sk-". Check your key and try again.');
            return;
        }
        apiKey = key;
        localStorage.setItem('deepseek_api_key', apiKey);
        isConnected = true;
        updateApiStatus();
        apiModal.style.display = 'none';
    });

    btnClearKey.addEventListener('click', () => {
        apiKey = '';
        isConnected = false;
        localStorage.removeItem('deepseek_api_key');
        apiKeyInput.value = '';
        updateApiStatus();
    });

    btnTestConnection.addEventListener('click', async () => {
        const key = apiKeyInput.value.trim();
        if (!key) {
            testStatus.textContent = 'Enter a key first';
            testStatus.style.color = 'var(--danger)';
            return;
        }
        if (!key.startsWith('sk-')) {
            testStatus.textContent = 'Key should start with sk-';
            testStatus.style.color = 'var(--danger)';
            return;
        }

        testStatus.textContent = 'Testing...';
        testStatus.style.color = 'var(--warning)';

        try {
            const resp = await fetch(DEEPSEEK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`,
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [{ role: 'user', content: 'hi' }],
                    max_tokens: 5,
                }),
            });

            if (resp.ok) {
                testStatus.textContent = 'Connection OK';
                testStatus.style.color = 'var(--success)';
            } else {
                const err = await resp.json().catch(() => ({}));
                testStatus.textContent = `Failed: ${err.error?.message || resp.statusText || resp.status}`;
                testStatus.style.color = 'var(--danger)';
            }
        } catch (err) {
            testStatus.textContent = `Network error: ${err.message}`;
            testStatus.style.color = 'var(--danger)';
        }
    });

    btnParse.addEventListener('click', parseCv);
    btnRegenerateCover.addEventListener('click', () => generateCoverLetterAI(true));
    btnExportCv.addEventListener('click', () => exportPdf('cv'));
    btnExportCover.addEventListener('click', () => exportPdf('cover'));

    skillsSelect.addEventListener('change', updateSkillsCopy);

    btnCopySkills.addEventListener('click', () => {
        if (!skillsCopy.value.trim()) return;
        navigator.clipboard.writeText(skillsCopy.value).then(() => {
            const original = btnCopySkills.textContent;
            btnCopySkills.textContent = 'Copied';
            setTimeout(() => { btnCopySkills.textContent = original; }, 1200);
        });
    });

    btnGenerateInterview.addEventListener('click', generateInterviewQuestions);
    interviewFormat.addEventListener('change', renderInterviewAnswer);
    interviewQuestion.addEventListener('change', renderInterviewAnswer);

    btnChatSend.addEventListener('click', sendChat);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChat();
        }
    });
    document.querySelectorAll('.chip[data-chat]').forEach(chip => {
        chip.addEventListener('click', () => {
            chatInput.value = chip.dataset.chat;
            sendChat();
        });
    });

    Object.values(fields).forEach(f => {
        f.addEventListener('input', updatePreview);
    });

    apiModal.addEventListener('click', (e) => {
        if (e.target === apiModal) apiModal.style.display = 'none';
    });
}

function updateApiStatus() {
    if (apiKey && isConnected) {
        apiStatus.textContent = 'Connected';
        apiStatus.classList.add('connected');
    } else if (apiKey) {
        apiStatus.textContent = 'Saved (not tested)';
        apiStatus.classList.remove('connected');
    } else {
        apiStatus.textContent = 'Not connected';
        apiStatus.classList.remove('connected');
    }
}

async function callDeepSeek(systemPrompt, userPrompt, temperature) {
    const response = await fetch(DEEPSEEK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature,
            max_tokens: 4096,
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `API error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty response from API');
    return parseJsonResponse(content);
}

function chatContext() {
    const jobText = jobDesc.value.trim();
    const ats = calculateAtsScore(buildCvText(), jobText);
    const parts = ats.parts.map(p => `${p.label} ${p.points}/${p.max}`).join(', ');
    const iv = interviewData.map(d => d.question).slice(0, 8).join(' | ');
    const master = masterCv.value.trim();
    return [
        `Master CV pasted by the user (the source of truth):\n${master ? master.slice(0, 5000) : '(none pasted)'}`,
        `Target job description:\n${jobText ? jobText.slice(0, 4000) : '(none provided)'}`,
        `Current Contact:\n${fields.contact.value}`,
        `Current Education:\n${fields.education.value}`,
        `Current Technical Skills:\n${fields.techSkills.value}`,
        `Current Soft Skills:\n${fields.softSkills.value}`,
        `Current Professional Experience:\n${fields.experience.value}`,
        `Current Projects:\n${fields.projects.value}`,
        `Current cover letter:\n${coverLetterText || '(not generated yet)'}`,
        `Current ATS match: ${ats.score} percent. Breakdown: ${parts}.`,
        `Interview questions already prepared: ${iv || '(none yet)'}`,
    ].join('\n\n');
}

function buildChatSystemPrompt() {
    return `You are the AI assistant built into this resume builder. The user talks to you in plain English. You can answer questions AND you can directly edit the CV for them. You have full visibility of their CV, the master CV they pasted, the job description, the cover letter and the ATS score, all listed under APP STATE at the end.

You MUST reply with a single JSON object and nothing else. Shape:
{"reply":"your message to the user","updates":{"contact":"","education":"","techSkills":"","softSkills":"","experience":"","projects":""},"coverLetter":"","action":"none"}

How to behave:
- To change the CV, put the FULL new text of each changed field inside "updates" (allowed keys: contact, education, techSkills, softSkills, experience, projects). Never return a partial diff. If you are not changing a field, leave it out of "updates" entirely.
- If the user asks for something, actually do it in "updates". Do not just describe the change.
- "reply" is your plain-language answer or a one-line summary of what you changed. Always present.
- "coverLetter": put the full cover letter text here when the user asks you to write or change the cover letter, otherwise leave it "".
- "action": "regenerateCover" to produce a fresh tailored cover letter, "generateInterview" to produce interview questions and STAR answers, or "none".
- Work only from the master CV and current CV. Never invent employers, dates, degrees, metrics or responsibilities, and never add a technology the master CV does not mention or clearly imply. You may reorder, reword, tighten and re-emphasise.
- Write experience bullets as action + what the work does, detects or prevents + method or tooling + outcome, without repeating the same claim twice.
- Technical Skills are 4 to 5 bullet lines of technologies, languages and tools only, never sentences, job-relevant items first. Soft Skills are 3 short keyword-rich sentences with no near-duplicate ideas. Professional Experience keeps every role with at least one bullet, most relevant first.
- Keep the whole CV within ${CHAR_LIMIT} characters.
- Never use em dashes; use hyphens or commas instead.
- Be concise and practical.

APP STATE:
${chatContext()}`;
}

function appendChat(role, text) {
    const div = document.createElement('div');
    div.className = 'chat-msg ' + role;
    div.textContent = text;
    chatLog.appendChild(div);
    chatLog.scrollTop = chatLog.scrollHeight;
}

const CHAT_FIELDS = ['contact', 'education', 'techSkills', 'softSkills', 'experience', 'projects'];
const CHAT_FIELD_ALIASES = {
    contact: 'contact', contactdetails: 'contact', contactinfo: 'contact',
    education: 'education', qualifications: 'education',
    technicalskills: 'techSkills', techskills: 'techSkills', tech: 'techSkills', technical: 'techSkills', skills: 'techSkills',
    softskills: 'softSkills', soft: 'softSkills',
    experience: 'experience', professionalexperience: 'experience', workexperience: 'experience', employment: 'experience',
    projects: 'projects', project: 'projects', projectexperience: 'projects',
};

function normalizeChatFields(source) {
    const out = {};
    if (!source || typeof source !== 'object' || Array.isArray(source)) return out;
    Object.keys(source).forEach(rawKey => {
        if (CHAT_FIELDS.includes(rawKey)) {
            if (typeof source[rawKey] === 'string' && source[rawKey].trim()) out[rawKey] = source[rawKey].trim();
            return;
        }
        const norm = String(rawKey).replace(/[^a-zA-Z]/g, '').toLowerCase();
        const target = CHAT_FIELD_ALIASES[norm];
        if (target && typeof source[rawKey] === 'string' && source[rawKey].trim()) out[target] = source[rawKey].trim();
    });
    return out;
}

function applyChatUpdates(result) {
    if (!result || typeof result !== 'object') return false;
    let changed = false;

    const merged = {};
    Object.assign(merged, normalizeChatFields(result.updates));
    Object.assign(merged, normalizeChatFields(result.cv));
    Object.assign(merged, normalizeChatFields(result.fields));
    Object.assign(merged, normalizeChatFields(result));
    Object.keys(merged).forEach(key => {
        if (fields[key]) {
            fields[key].value = merged[key];
            changed = true;
        }
    });

    const meta = (result.updates && typeof result.updates === 'object') ? result.updates : result;
    if (Array.isArray(meta.keywords)) {
        const kws = meta.keywords.map(k => String(k).toLowerCase().trim()).filter(Boolean);
        if (kws.length) activeKeywords = kws;
    }
    if (typeof meta.company === 'string' && meta.company.trim()) {
        parsedData = parsedData || {};
        parsedData.company = meta.company.trim();
    }
    if (typeof meta.jobTitle === 'string' && meta.jobTitle.trim()) {
        activeJobTitle = meta.jobTitle.trim();
        parsedData = parsedData || {};
        parsedData.jobTitle = meta.jobTitle.trim();
    }

    let newCover = '';
    if (typeof result.coverLetter === 'string' && result.coverLetter.trim()) newCover = result.coverLetter.trim();
    else if (result.updates && typeof result.updates.coverLetter === 'string' && result.updates.coverLetter.trim()) newCover = result.updates.coverLetter.trim();
    else if (result.cv && typeof result.cv.coverLetter === 'string' && result.cv.coverLetter.trim()) newCover = result.cv.coverLetter.trim();
    if (newCover) {
        coverLetterText = newCover;
        changed = true;
    }

    return changed;
}

async function callDeepSeekChat(messages, temperature) {
    const response = await fetch(DEEPSEEK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages,
            temperature,
            max_tokens: 4096,
            response_format: { type: 'json_object' },
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `API error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty response from API');
    return content.trim();
}

function extractChatJson(content) {
    if (!content) return { reply: '', action: 'none' };
    const text = String(content).replace(/```json/gi, '').replace(/```/g, '').trim();
    try {
        return JSON.parse(text);
    } catch (e) {}
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end > start) {
        try {
            return JSON.parse(text.slice(start, end + 1));
        } catch (e) {}
    }
    return { reply: text, action: 'none' };
}

async function sendChat() {
    if (!apiKey) {
        alert('Please connect your DeepSeek API key first.');
        btnApi.click();
        return;
    }

    const text = chatInput.value.trim();
    if (!text) return;

    appendChat('user', text);
    chatHistory.push({ role: 'user', content: text });
    chatInput.value = '';
    showLoading('Thinking...');

    let action = 'none';
    try {
        const messages = [
            { role: 'system', content: buildChatSystemPrompt() },
            ...chatHistory.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
        ];
        const content = await callDeepSeekChat(messages, 0.4);

        const result = extractChatJson(content);

        const changed = applyChatUpdates(result);
        if (changed) {
            enforceCharLimit();
            updatePreview();
        }

        const reply = (result && typeof result.reply === 'string' && result.reply.trim()) ? result.reply.trim() : 'Done.';
        const shown = reply + (changed ? '\n\n(CV updated.)' : '');
        chatHistory.push({ role: 'assistant', content: shown });
        if (chatHistory.length > 12) chatHistory = chatHistory.slice(-12);
        appendChat('assistant', shown);

        action = (result && typeof result.action === 'string') ? result.action : 'none';

        const lower = text.toLowerCase();
        if (action === 'none') {
            if (/\binterview\b/.test(lower) && /(question|prep|prepare|generate|star|answer)/.test(lower)) {
                action = 'generateInterview';
            } else if (/cover letter/.test(lower) && /(write|rewrite|regenerate|redo|new|generate|change|update|tailor|shorten|longer)/.test(lower)) {
                action = 'regenerateCover';
            }
        }
    } catch (err) {
        appendChat('assistant', 'Error: ' + err.message);
    } finally {
        hideLoading();
    }

    if (action === 'generateInterview') {
        generateInterviewQuestions();
    } else if (action === 'regenerateCover') {
        generateCoverLetterAI(true);
    }
}

async function parseCv() {
    if (!apiKey) {
        alert('Please connect your DeepSeek API key first.');
        btnApi.click();
        return;
    }

    const cvText = masterCv.value.trim();
    if (!cvText) {
        alert('Please paste your CV first.');
        return;
    }

    loading.style.display = 'flex';

    try {
        const systemPrompt = buildSystemPrompt();
        const jobText = jobDesc.value.trim();
        const userPrompt = `Here is my CV:\n\n${cvText}${jobText ? '\n\nJob Description:\n' + jobText : ''}`;

        let parsed = await callDeepSeek(systemPrompt, userPrompt, 0.3);
        let current = parsed;

        fillFields(current);
        enforceCharLimit();

        if (jobText) {
            let cov = keywordCoverage(buildCvText(), jobText);
            const first = current.keywords;
            activeKeywords = Array.isArray(first) && first.length
                ? first.map(k => String(k).toLowerCase().trim()).filter(Boolean)
                : null;
            let tries = 0;
            while (tries < 3 && activeKeywords && cov.total && cov.matched / cov.total < 0.9 && cov.missing.length) {
                const correctionPrompt = `Here is my original CV:\n\n${cvText}\n\nHere is the current tailored CV JSON:\n${JSON.stringify(current, null, 2)}\n\nJob Description:\n${jobText}\n\nThese important keywords from the job description are not clearly present yet: ${cov.missing.join(', ')}.\n\nRewrite the CV so it truthfully includes as many of these keywords as my original CV genuinely supports, using the employer's exact wording. Read the original CV carefully and infer equivalent wording: if it shows a university degree or current study, express that as a third level qualification; if it shows a security, IT, support or operations role, that supports security concepts, incident response and troubleshooting. Never invent experience that is not implied by the original CV. Keep every section full and stay under ${CHAR_LIMIT} characters. Return the same JSON structure only.`;
                const corrected = await callDeepSeek(systemPrompt, correctionPrompt, 0.25);
                fillFields(corrected);
                enforceCharLimit();
                const nextCov = keywordCoverage(buildCvText(), jobText);
                if (nextCov.matched > cov.matched) {
                    current = corrected;
                    cov = nextCov;
                    const ck = corrected.keywords;
                    activeKeywords = Array.isArray(ck) && ck.length
                        ? ck.map(k => String(k).toLowerCase().trim()).filter(Boolean)
                        : activeKeywords;
                } else {
                    fillFields(current);
                    enforceCharLimit();
                    break;
                }
                tries++;
            }

            const roleTitlesWithoutBullets = () => parseEntryBlocks(fields.experience.value).filter(e => e.bullets.length === 0).map(e => e.title);
            let roleTries = 0;
            while (roleTries < 2 && roleTitlesWithoutBullets().length) {
                const missingRoles = roleTitlesWithoutBullets();
                const fixPrompt = `Here is my original CV:\n\n${cvText}\n\nHere is the current tailored CV JSON:\n${JSON.stringify(current, null, 2)}\n\nEvery role in the experience section must have bullet points. These roles currently have none: ${missingRoles.join('; ')}. Add 1 to 2 truthful bullets to each of those roles using only what my original CV states about that role, and keep the rest of the CV unchanged. Return the same JSON structure only.`;
                try {
                    const fixed = await callDeepSeek(systemPrompt, fixPrompt, 0.2);
                    if (fixed && typeof fixed.experience === 'string' && fixed.experience.trim()) {
                        current = fixed;
                        fillFields(current);
                        enforceCharLimit();
                    } else {
                        break;
                    }
                } catch (err) {
                    break;
                }
                roleTries++;
            }

            const masterBulletsFor = (title) => {
                const stop = ['engineer', 'technician', 'intern', 'internship', 'systems', 'system', 'payment', 'payments', 'information', 'services', 'service', 'company', 'analyst', 'associate', 'graduate'];
                const words = (title.toLowerCase().match(/[a-z]{4,}/g) || []).filter(w => !stop.includes(w));
                const lines = cvText.split('\n').map(l => l.trim()).filter(Boolean);
                let bestStart = -1;
                let bestScore = 0;
                for (let i = 0; i < lines.length; i++) {
                    const l = lines[i].toLowerCase();
                    const score = words.filter(w => l.includes(w)).length;
                    if (score > bestScore) {
                        bestScore = score;
                        bestStart = i;
                    }
                }
                if (bestStart < 0 || bestScore === 0) return [];
                const out = [];
                for (let i = bestStart + 1; i < lines.length && out.length < 2; i++) {
                    const t = lines[i];
                    const isPoint = /^(\d+[.)]|[-*•])\s+/.test(t);
                    if (isPoint) {
                        out.push(t.replace(/^(\d+[.)]|[-*•])\s*/, '').replace(/^(\d+[.)]|[-*•])\s*/, ''));
                    } else if (out.length) {
                        break;
                    } else if (i - bestStart > 4) {
                        break;
                    }
                }
                return out;
            };
            let expEntries = parseEntryBlocks(fields.experience.value);
            let expChanged = false;
            expEntries = expEntries.map(e => {
                if (e.bullets.length === 0) {
                    const mb = masterBulletsFor(e.title);
                    if (mb.length) {
                        expChanged = true;
                        return { title: e.title, meta: e.meta, bullets: mb };
                    }
                }
                return e;
            });
            if (expChanged) {
                fields.experience.value = expEntries.map(e => [e.title, e.meta, ...e.bullets.map(b => '- ' + b)].filter(Boolean).join('\n')).join('\n');
                current.experience = fields.experience.value;
                enforceCharLimit();
            }

            const masterLower = cvText.toLowerCase();
            const softTerms = ['communication', 'teamwork', 'team player', 'collaborat', 'problem solving', 'problem-solving', 'time management', 'adaptab', 'leadership', 'mentor', 'stakeholder', 'customer', 'presentation', 'professional', 'organis', 'priorit', 'attention to detail', 'multitask', 'orientated', 'oriented', 'curios', 'enthusias', 'willingness', 'eager', 'initiative', 'proactive', 'dependab', 'reliab', 'interpersonal', 'empath', 'resilien', 'flexib', 'approachable', 'motivat', 'integrity', 'accountab', 'creativ', 'negotiat', 'analytical', 'troubleshoot'];
            const addGrounded = () => {
                const cvNow = buildCvText().toLowerCase();
                let n = 0;
                for (const kw of keywordCoverage(buildCvText(), jobText).missing) {
                    if (n >= 10) break;
                    if (cvNow.includes(kw)) continue;
                    const parts = kw.split(' ').filter(w => w.length >= 3);
                    if (!parts.length || !parts.some(w => masterLower.includes(w))) continue;
                    const isEdu = /qualification|degree|third level|level \d/.test(kw);
                    const isSoft = softTerms.some(t => kw.includes(t));
                    if (isEdu) {
                        const cur = fields.education.value.trim();
                        if (!cur.toLowerCase().includes(kw)) {
                            fields.education.value = cur ? cur + '\n' + kw : kw;
                            n++;
                        }
                        continue;
                    }
                    if (isSoft) {
                        const softLines = fields.softSkills.value.split('\n').filter(l => l.trim());
                        if (softLines.length >= 4) continue;
                        const existing = fields.softSkills.value.toLowerCase();
                        if (parts.every(w => existing.includes(w))) continue;
                        fields.softSkills.value = fields.softSkills.value.trim() ? fields.softSkills.value.trim() + '\nSkilled in ' + kw + '.' : 'Skilled in ' + kw + '.';
                        n++;
                        continue;
                    }
                    const lines = fields.techSkills.value.split('\n').filter(l => l.trim());
                    const matchIdx = lines.findIndex(l => l.toLowerCase().split(/[^a-z0-9]+/).some(w => w.length >= 4 && parts.includes(w)));
                    if (matchIdx >= 0) {
                        lines[matchIdx] = lines[matchIdx].replace(/\s*$/, '') + ', ' + kw;
                        fields.techSkills.value = lines.join('\n');
                        n++;
                    }
                }
                return n;
            };
            addGrounded();
            enforceCharLimit();
            addGrounded();
            enforceCharLimit();
        }

        parsedData = current;
        const finalKeywords = current.keywords;
        activeKeywords = Array.isArray(finalKeywords) && finalKeywords.length
            ? finalKeywords.map(k => String(k).toLowerCase().trim()).filter(Boolean)
            : activeKeywords;
        activeJobTitle = typeof current.jobTitle === 'string' ? current.jobTitle.trim() : '';
        loading.style.display = 'none';
        btnExportCv.disabled = false;
        btnExportCover.disabled = false;
        btnRegenerateCover.disabled = false;
        updatePreview();

        generateCoverLetterAI(false);

    } catch (err) {
        loading.style.display = 'none';
        alert('Parse error: ' + err.message);
    }
}

function pruneSkills() {
    const stop = new Set(['that', 'this', 'with', 'from', 'into', 'through', 'across', 'within', 'your', 'their', 'strong', 'clear', 'good', 'well', 'also', 'such', 'using', 'used', 'able', 'ability', 'skills', 'skill', 'work', 'working', 'level', 'based']);
    const sig = (s) => new Set(String(s).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length >= 4 && !stop.has(w)));

    const softLines = fields.softSkills.value.split('\n').map(l => l.trim()).filter(Boolean);
    const keptSoft = [];
    const keptWords = [];
    for (const line of softLines) {
        const w = sig(line);
        const dup = keptWords.some(k => {
            if (!w.size || !k.size) return false;
            const shared = [...w].filter(x => k.has(x)).length;
            return shared / Math.min(w.size, k.size) >= 0.6;
        });
        if (!dup && keptSoft.length < 4) {
            keptSoft.push(line);
            keptWords.push(w);
        }
    }
    fields.softSkills.value = keptSoft.join('\n');

    const techLines = fields.techSkills.value.split('\n').map(l => l.trim()).filter(Boolean);
    const seen = new Set();
    const outTech = [];
    for (const line of techLines) {
        const colon = line.indexOf(':');
        let label = '';
        let body = line;
        if (colon > 0 && colon < 40) {
            label = line.slice(0, colon).trim();
            body = line.slice(colon + 1);
        }
        const tokens = body.split(',').map(t => t.trim()).filter(Boolean);
        const keptTokens = tokens.filter(t => {
            const key = t.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
        if (label && keptTokens.length) outTech.push(label + ': ' + keptTokens.join(', '));
        else if (!label && keptTokens.length) outTech.push(keptTokens.join(', '));
    }
    fields.techSkills.value = outTech.join('\n');
}

function enforceCharLimit() {
    pruneSkills();
    const trimmable = ['experience', 'projects', 'education', 'techSkills', 'softSkills'];
    const floor = { projects: 2, education: 1, techSkills: 4, softSkills: 3 };
    const isBullet = (l) => /^\s*[-*•]/.test(l);

    const experienceMinBullets = () => {
        const lines = fields.experience.value.split('\n').filter(l => l.trim());
        const headers = lines.filter(l => !isBullet(l)).length;
        return Math.max(1, Math.round(headers / 2));
    };

    let guard = 0;
    while (buildCvText().length > CHAR_LIMIT && guard < 2000) {
        let target = null;
        let largest = 0;
        for (const key of trimmable) {
            const lines = fields[key].value.split('\n').filter(l => l.trim());
            let removable;
            let size;
            if (key === 'experience') {
                const bullets = lines.filter(isBullet).length;
                removable = bullets - experienceMinBullets();
                size = bullets;
            } else {
                removable = lines.length - (floor[key] || 1);
                size = lines.length;
            }
            if (removable > 0 && size >= largest) {
                largest = size;
                target = key;
            }
        }
        if (!target) break;
        const all = fields[target].value.split('\n').filter(l => l.trim());
        if (target === 'experience') {
            const groups = {};
            let lastHeader = -1;
            for (let i = 0; i < all.length; i++) {
                if (isBullet(all[i])) {
                    if (!groups[lastHeader]) groups[lastHeader] = [];
                    groups[lastHeader].push(i);
                } else {
                    lastHeader = i;
                }
            }
            let bestLast = -1;
            let bestCount = 1;
            for (const h of Object.keys(groups)) {
                const arr = groups[h];
                if (arr.length > bestCount) {
                    bestCount = arr.length;
                    bestLast = arr[arr.length - 1];
                }
            }
            if (bestLast < 0) break;
            all.splice(bestLast, 1);
        } else {
            all.pop();
        }
        fields[target].value = all.join('\n');
        guard++;
    }
}

function parseJsonResponse(content) {
    let jsonStr = content.trim();
    jsonStr = jsonStr.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    try {
        return JSON.parse(jsonStr);
    } catch (e) {
        const match = jsonStr.match(/\{[\s\S]*\}/);
        if (match) {
            try {
                return JSON.parse(match[0]);
            } catch (e2) {
                throw new Error('Could not parse AI response as JSON. Try regenerating.');
            }
        }
        throw new Error('No JSON found in AI response. Try regenerating.');
    }
}

function buildSystemPrompt() {
    return `You are an expert CV writer and ATS optimization specialist. Parse CV data and output it in a strict template format.

RULES:
- Output ONLY valid JSON. No markdown, no extra text, no code fences.
- Do NOT use em dashes anywhere. Use hyphens or commas instead.
- Target the full character budget: aim for 2700 to ${CHAR_LIMIT} characters so the CV fills one A4 page. Only go shorter if the source CV genuinely has little content. Never exceed ${CHAR_LIMIT} characters.
- There is NO profile, summary, objective or achievements section. Fold the strongest supporting detail from the master CV into the experience, project and skills bullets, and omit anything that does not fit.
- Never leave a section a single bare line. A near-empty Projects or Skills section is a failure.
    - PROFESSIONAL EXPERIENCE is the centrepiece of the CV and carries the most weight. Include EVERY role from the master CV and rank them by relevance to the job, most relevant first and then most recent: give the most relevant or most recent role 4 to 6 bullets, each other clearly relevant role 2 to 3 bullets, and a partly relevant role a compact 1 to 2 bullets. Never drop a role, never let a less relevant role grow large, and never output a role with no bullets underneath it.
    - Write every experience bullet as ACTION + WHAT IT DOES, DETECTS OR PREVENTS + METHOD OR TOOLING + OUTCOME, in one or two lines. Lead with a strong action verb. State concretely what the work detects, fixes or improves, and how findings are validated (for example validating findings with a security tool), not just the task. Do not restate the same claim twice across bullets or sections. Quantify only with figures the master CV actually contains; otherwise describe the concrete qualitative impact. Never invent metrics, employers, dates, degrees or responsibilities.
    - TECHNICAL SKILLS: output 4 to 5 bullet lines. Each line is technologies, languages, tools or a short category label followed by comma-separated names, for example Identity & Access Management: AWS IAM, Identity Center, Active Directory. Put the categories and items the job asks for first (for a security or cloud role, Identity & Access Management first). Use concrete skills only, never repeat an item across lines, and never pad with generic or duplicated phrases. Never write a sentence, trait or soft skill here. Do not add any technology the master CV does not mention or clearly imply.
    - SOFT SKILLS: output exactly 3 bullet lines. Each line is a single evidence-based sentence of roughly 8 to 14 words that names the skill and naturally includes the relevant job keywords. Never repeat or near-duplicate an idea, and never output a bare phrase.
    - PROJECTS: choose the single most relevant project from the master CV for this job. Output its name plus tech stack on the first line, then 1 to 2 short bullets, one short sentence each, covering what the project does and the relevant outcome. Only list technologies the project actually uses.
    - Use strong action verbs (built, developed, led, automated, optimized, etc.). Lead every bullet with an action verb and, where the master CV supports a number, a measurable outcome.
    - Quantify achievements where possible (%, numbers, time saved), but never invent a figure.
    - ATS-friendly: standard headings, no tables, no graphics, no columns, plain text only.
    - Prioritise the must-have requirements of the job: the job title, the requirements or qualifications bullets, and the first responsibilities. Mirror their exact wording where the candidate's experience truthfully supports it, and lead the CV with the strongest matching evidence. When a job description is provided, tailor the CV to it: reorder and rephrase so the candidate's real experience maps onto what the employer asks for, and surface the most relevant material in the top third of the page. The job description shapes emphasis and ordering; it must never crowd out or replace the candidate's actual content.
    - Never add technologies, tools or responsibilities the master CV does not mention or clearly imply. Relevance and truthfulness matter more than keyword count.
    - Place each important keyword in BOTH the relevant skills line AND at least one dated experience or project bullet, because ATS systems reward keywords proven in context, not only listed.
    - Never repeat a keyword more than about four times: keyword stuffing is penalised.
    - Include EVERY relevant role and skill from the source CV. Never drop experience that relates to the target job.
    - Optimise for a human recruiter too: make every bullet specific, achievement-focused and easy to scan. No generic filler such as hardworking, team player or good communicator.
    - In the EDUCATION section list at most six relevant modules, choosing the ones most relevant to the job description. For a student or recent graduate, always state the expected graduation date and keep it easy to find.
    - Extract and structure the CV data.


OUTPUT FORMAT (JSON):
{
    "company": "The employer company name if the job description names one, otherwise an empty string.",
    "jobTitle": "The exact job title being applied for if the job description gives one, otherwise an empty string.",
    "keywords": ["15 to 25 of the most important ATS keywords from the job description, most important first. Each keyword must be short: 1 to 3 words, never a full sentence or clause. Mix the employer's exact wording with standard synonyms. Only terms the candidate genuinely has or can honestly claim."],
    "contact": "FULL NAME\\nPhone | Email\\nLocation\\nLinkedIn: url | GitHub: url",
    "education": "Degree, Institution\\nYears, Location\\n- Grade: ...\\n- Relevant Modules: ...\\n- Activities: ...",
    "techSkills": "4 to 5 bullet lines of technologies, languages and tools only, job-relevant first, e.g. Identity & Access Management: AWS IAM, Identity Center, Active Directory\\nCloud & DevOps: AWS, Docker, Kubernetes",
    "softSkills": "exactly 3 bullet lines, each a short evidence-based sentence of roughly 8 to 14 words with the job keywords woven in, e.g. Strong troubleshooting skills proven resolving access issues through to resolution.",
    "experience": "Job Title, Company\\nDates, Location\\n- Bullet 1\\n- Bullet 2\\n- Bullet 3\\n- Bullet 4",
    "projects": "Most relevant Project Name (Tech Stack)\\n- One short sentence on what it does and its outcome\\n- One short sentence on the key feature or impact"
}`;
}

function fillFields(data) {
    fields.contact.value = data.contact || '';
    fields.education.value = data.education || '';
    fields.techSkills.value = data.techSkills || '';
    fields.softSkills.value = data.softSkills || '';
    fields.experience.value = data.experience || '';
    fields.projects.value = data.projects || '';
}

function buildCvText() {
    const sections = [
        fields.contact.value.trim(),
        'EDUCATION',
        fields.education.value.trim(),
        'SKILLS',
        'Technical Skills',
        fields.techSkills.value.trim(),
        'Soft Skills',
        fields.softSkills.value.trim(),
        'PROFESSIONAL EXPERIENCE',
        fields.experience.value.trim(),
        'PROJECTS',
        fields.projects.value.trim(),
    ];
    return sections.filter(s => s).join('\n\n');
}

function updatePreview() {
    const cvText = buildCvText();
    const jobText = jobDesc.value.trim();
    cvPreview.innerHTML = formatCvHtml(jobText);

    const coverText = coverLetterText || 'Your tailored cover letter will appear here after you run Parse & Auto-Fill.';
    coverPreview.textContent = coverText;

    const count = cvText.length;
    charCount.textContent = `${count} / ${CHAR_LIMIT} chars`;

    if (count > CHAR_LIMIT) {
        charCount.className = 'stat danger';
        charWarning.style.display = 'block';
    } else if (count >= CHAR_LIMIT * 0.9) {
        charCount.className = 'stat good';
        charWarning.style.display = 'none';
    } else if (count >= CHAR_LIMIT * 0.7) {
        charCount.className = 'stat warning';
        charWarning.style.display = 'none';
    } else {
        charCount.className = 'stat';
        charWarning.style.display = 'none';
    }

    const pages = Math.ceil(cvText.length / A4_CHARS_PER_PAGE);
    pageEstimate.textContent = `~${pages} page${pages > 1 ? 's' : ''}`;
    if (pages > 1) {
        pageEstimate.className = 'stat warning';
        pageWarning.style.display = 'block';
    } else {
        pageEstimate.className = 'stat';
        pageWarning.style.display = 'none';
    }

    const coverage = (jobText || activeKeywords) ? keywordCoverage(cvText, jobText) : { matched: 0, total: 0, missing: [] };
    if (coverage.total && coverage.missing.length) {
        missingWarning.textContent = 'Keywords to add: ' + coverage.missing.slice(0, 6).join(', ');
        missingWarning.style.display = 'block';
    } else {
        missingWarning.style.display = 'none';
    }

    const ats = calculateAtsScore(cvText, jobText);
    atsScore.textContent = `Match: ${ats.score}%`;
    if (ats.score >= 80) {
        atsScore.className = 'stat good';
    } else if (ats.score >= 55) {
        atsScore.className = 'stat warning';
    } else {
        atsScore.className = 'stat danger';
    }

    renderAtsBreakdown(ats);
    updateSkillsCopy();
}

function buildSkillGroups() {
    const cleanToken = (t) => t.replace(/^[-*\s]+/, '').replace(/[\s.,;:]+$/, '').trim();
    const isSkill = (t) => {
        const s = cleanToken(t);
        if (!s) return false;
        if (s.split(/\s+/).length > 5) return false;
        if (/[.!?]$/.test(t.trim())) return false;
        return true;
    };

    const techLines = fields.techSkills.value.split('\n').map(l => l.trim()).filter(Boolean);
    const softLines = fields.softSkills.value.split('\n').map(l => l.trim()).filter(Boolean);
    const groups = [];
    const techAll = [];

    techLines.forEach(line => {
        const colon = line.indexOf(':');
        if (colon > 0 && colon < 40) {
            const label = cleanToken(line.slice(0, colon));
            const values = line.slice(colon + 1).split(',').map(cleanToken).filter(isSkill);
            if (values.length) groups.push({ label, value: values.join(', ') });
            techAll.push(...values);
        } else {
            const values = line.split(',').map(cleanToken).filter(isSkill);
            techAll.push(...values);
        }
    });

    const softVocab = [
        ['communicat', 'Communication'],
        ['collaborat', 'Collaboration'],
        ['teamwork', 'Teamwork'],
        ['team player', 'Team Player'],
        ['problem solv', 'Problem Solving'],
        ['troubleshoot', 'Troubleshooting'],
        ['analy', 'Analytical Thinking'],
        ['stakeholder', 'Stakeholder Communication'],
        ['time management', 'Time Management'],
        ['adaptab', 'Adaptability'],
        ['mentor', 'Mentoring'],
        ['leadership', 'Leadership'],
        ['process oriented', 'Process Orientation'],
        ['attention to detail', 'Attention to Detail'],
        ['presentat', 'Presentation'],
        ['public speaking', 'Public Speaking'],
        ['interpersonal', 'Interpersonal Skills'],
        ['planning', 'Planning'],
        ['priorit', 'Prioritisation'],
        ['initiative', 'Initiative'],
        ['proactive', 'Proactivity'],
        ['dependab', 'Dependability'],
        ['ownership', 'Ownership'],
        ['multitask', 'Multitasking'],
        ['resilien', 'Resilience'],
        ['empath', 'Empathy'],
        ['critical thinking', 'Critical Thinking'],
        ['negotiat', 'Negotiation'],
        ['creativ', 'Creativity'],
        ['curios', 'Curiosity'],
    ];
    const softFound = new Map();
    softLines.forEach(line => {
        const lower = line.toLowerCase();
        softVocab.forEach(([stem, label]) => { if (lower.includes(stem)) softFound.set(label, label); });
    });
    const softAll = [...softFound.values()];

    const techUnique = [...new Set(techAll)];
    const softUnique = [...new Set(softAll)];
    const result = [];
    if (techUnique.length) result.push({ label: 'All Technical Skills', value: techUnique.join(', ') });
    if (softUnique.length) result.push({ label: 'All Soft Skills', value: softUnique.join(', ') });
    groups.forEach(g => {
        if (!result.some(r => r.label === g.label)) result.push(g);
    });
    const everything = [...new Set([...techUnique, ...softUnique])];
    if (everything.length) {
        result.unshift({ label: 'Everything', value: everything.join(', ') });
    }
    return result;
}

function updateSkillsCopy() {
    const groups = buildSkillGroups();
    const previous = skillsSelect.value;

    if (!groups.length) {
        skillsSelect.innerHTML = '<option value="">No skills yet</option>';
        skillsCopy.value = '';
        btnCopySkills.disabled = true;
        return;
    }

    skillsSelect.innerHTML = groups.map((g, i) => `<option value="${i}">${escapeHtml(g.label)}</option>`).join('');
    if (previous !== '' && groups[previous]) skillsSelect.value = previous;

    const selected = groups[skillsSelect.value] || groups[0];
    skillsCopy.value = selected ? selected.value : '';
    btnCopySkills.disabled = !skillsCopy.value;
}

function renderAtsBreakdown(ats) {
    const rows = ats.parts.map(p => {
        const ok = p.points >= p.max * 0.6;
        const cls = ok ? 'good' : p.points > 0 ? 'warning' : 'danger';
        const note = p.note ? `<span class="ats-note">${escapeHtml(p.note)}</span>` : '';
        return `<div class="ats-row"><span class="ats-label">${escapeHtml(p.label)}${note}</span><span class="ats-bar"><span class="ats-fill ${cls}" style="width: ${Math.round((p.points / p.max) * 100)}%"></span></span><span class="ats-pts">${p.points}/${p.max}</span></div>`;
    }).join('');
    atsBreakdown.innerHTML = `<div class="ats-title" id="ats-toggle">ATS Match Breakdown <span class="ats-caret">v</span></div><div class="ats-rows">${rows}</div>`;
    atsBreakdown.style.display = ats.parts.length ? 'block' : 'none';
    const toggle = document.getElementById('ats-toggle');
    if (toggle) {
        toggle.addEventListener('click', () => atsBreakdown.classList.toggle('collapsed'));
    }
}

async function generateCoverLetterAI(isManual = false) {
    if (!apiKey) {
        if (isManual) {
            alert('Please connect your DeepSeek API key first.');
            btnApi.click();
        }
        return;
    }
    if (!parsedData && !jobDesc.value.trim()) {
        if (isManual) alert('Run Parse & Auto-Fill first so the cover letter has content to work from.');
        return;
    }

    showLoading('Writing your cover letter...');

    try {
        const company = (parsedData && parsedData.company) ? parsedData.company : '';
        const jobTitle = (parsedData && parsedData.jobTitle) ? parsedData.jobTitle : '';
        const cvText = buildCvText();
        const jobText = jobDesc.value.trim();

        const systemPrompt = 'You are an expert cover letter writer. Write in UK and Irish English. Output ONLY the plain text of the letter, no markdown, no code fences, no headings. Do NOT use em dashes anywhere; use hyphens or commas instead. Never invent experience, employers, dates, grades or achievements: only use what is in the candidate CV data.';
        const userPrompt = `Write a tailored cover letter for this candidate.

Candidate CV:
${cvText}

${company ? 'Target company: ' + company + '\n' : ''}${jobTitle ? 'Target role: ' + jobTitle + '\n' : ''}${jobText ? 'Job description:\n' + jobText + '\n' : ''}
Requirements:
- Three to four short paragraphs, under 350 words.
- Address it to the hiring manager, and name the company and the exact role or graduate programme in the opening paragraph.
- Map two or three of the candidate's real achievements and skills to what the employer is looking for. Be specific, not generic.
- If you know the company (for example a well known employer), you may add one credible sentence about why this company in particular appeals, based only on general public knowledge and the job description. Do not invent recent news or facts you are unsure of.
- Close by thanking them and expressing interest in discussing the role.
- End with a professional sign off and the candidate name.`;

        const response = await fetch(DEEPSEEK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                temperature: 0.5,
                max_tokens: 2048,
            }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error?.message || `API error ${response.status}`);
        }

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error('Empty response from API');

        content = content.trim().replace(/```[a-z]*\s*/gi, '').replace(/```/g, '').trim();
        coverLetterText = content;
        updatePreview();

    } catch (err) {
        alert('Cover letter error: ' + err.message);
    } finally {
        hideLoading();
    }
}

function keywordCoverage(cvText, jobText) {
    const keywords = (activeKeywords && activeKeywords.length) ? activeKeywords : extractJobKeywords(jobText);
    if (!keywords.length) return { matched: 0, total: 0, missing: [] };

    const lower = cvText.toLowerCase();
    const missing = [];
    let matched = 0;
    for (const kw of keywords) {
        const term = String(kw).toLowerCase().trim();
        if (!term) continue;
        let hit;
        if (term.includes(' ')) {
            if (lower.includes(term)) {
                hit = true;
            } else {
                const parts = term.split(/\s+/).filter(w => w.length >= 3);
                hit = parts.length > 0 && parts.every(w => lower.includes(w));
            }
        } else {
            hit = lower.includes(term);
        }
        if (hit) matched++;
        else missing.push(kw);
    }
    return { matched, total: keywords.length, missing };
}

function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function keywordRegex(jobText) {
    const source = (activeKeywords && activeKeywords.length) ? activeKeywords : extractJobKeywords(jobText);
    const keywords = [...new Set(source)].sort((a, b) => b.length - a.length);
    if (!keywords.length) return null;
    const pattern = keywords.map(k => escapeRegex(k)).join('|');
    return new RegExp(`\\b(${pattern})\\b`, 'gi');
}

function extractJobTitle(jobText) {
    if (!jobText || !jobText.trim()) return [];
    const roleRx = /\b(engineer|developer|analyst|administrator|graduate|intern|internship|consultant|manager|technician|specialist|associate|architect|scientist|designer|officer|coordinator|lead|programmer|tester|support|operations|management|security|cloud|network|data|identity|access)\b/i;
    const skipStart = /^(apply|add|follow|share|report|jobs|job|advice|employers|events|study|search|log|post|view|save|show|hide|back|next|previous|filter|sort|featured|related|about|legal|privacy|terms|cookies|accessibility|guides|publications|recruitment|awards|course|menu|home)\b/i;
    const filler = new Set(['and', 'the', 'for', 'with', 'team', 'teams', 'our', 'your', 'their', 'this', 'that', 'you', 'will', 'are', 'role', 'job', 'position', 'apply', 'part', 'within', 'across', 'based', 'new', 'all', 'who', 'has', 'have', 'looking', 'join', 'it', 'is', 'to', 'of', 'in', 'on', 'at', 'be', 'as', 'or', 'by', 'an', 'a']);
    const lines = jobText.split('\n').map(l => l.trim()).filter(Boolean);
    let titleLine = '';
    for (const line of lines) {
        const words = line.split(/\s+/);
        if (words.length < 2 || words.length > 14) continue;
        if (skipStart.test(line)) continue;
        if (!roleRx.test(line)) continue;
        titleLine = line;
        break;
    }
    if (!titleLine) return [];
    const terms = titleLine.toLowerCase().replace(/[^a-z0-9+#\s]/g, ' ').split(/\s+/)
        .filter(w => w.length >= 2 && !filler.has(w));
    return [...new Set(terms)].slice(0, 8);
}

function calculateAtsScore(cvText, jobText) {
    if (!cvText.trim()) return { score: 0, parts: [], matched: 0, total: 0 };
    const job = (jobText || '').trim();
    const lowerCv = cvText.toLowerCase();

    const keywords = (activeKeywords && activeKeywords.length) ? activeKeywords : (job ? extractJobKeywords(job) : []);
    const total = keywords.length;
    const weightOf = (term) => term.split(' ').length;
    const skillsText = (fields.techSkills.value + ' ' + fields.softSkills.value).toLowerCase();
    const expText = (fields.experience.value + ' ' + fields.projects.value).toLowerCase();

    const hit = (text, term) => {
        const t = String(term).toLowerCase().trim();
        if (!t) return false;
        if (text.includes(t)) return true;
        if (t.includes(' ')) {
            const parts = t.split(/\s+/).filter(w => w.length >= 3);
            return parts.length > 0 && parts.every(w => text.includes(w));
        }
        return false;
    };

    let matched = 0;
    let totalW = 0;
    let matchedW = 0;
    let skillsHits = 0;
    let expHits = 0;
    keywords.forEach(kw => {
        const w = weightOf(kw);
        totalW += w;
        if (hit(lowerCv, kw)) { matched++; matchedW += w; }
        if (hit(skillsText, kw)) skillsHits += w;
        if (hit(expText, kw)) expHits += w;
    });

    const parts = [];

    let kwPts = 0;
    if (job && totalW) {
        const cov = matchedW / totalW;
        kwPts = Math.round(30 * Math.min(1, cov / 0.75));
    }
    parts.push({ label: 'Keyword Match', points: kwPts, max: 30, note: total ? `${matched}/${total} terms` : 'add a job description' });

    let sePts = 0;
    if (job && totalW) {
        const placed = skillsHits + expHits;
        sePts = Math.round(20 * Math.min(1, placed / (2 * totalW)));
    }
    parts.push({ label: 'Skills + Experience', points: sePts, max: 20, note: job ? 'keywords proven in context' : 'add a job description' });

    const titleWords = activeJobTitle ? extractJobTitle(activeJobTitle) : (job ? extractJobTitle(job) : []);
    const titleHits = titleWords.filter(w => lowerCv.includes(w)).length;
    const titlePts = titleWords.length ? Math.round(15 * (titleHits / titleWords.length)) : 0;
    parts.push({ label: 'Job Title Match', points: titlePts, max: 15, note: titleWords.length ? `${titleHits}/${titleWords.length} title terms` : 'add a job description' });

    const metricsRx = /\d+%|\b\d+\+|\$\d+|\b\d+x\b|\b\d+\.\d+%/g;
    const expMetrics = (expText.match(metricsRx) || []).length;
    const qPts = expMetrics >= 4 ? 15 : expMetrics >= 2 ? 10 : expMetrics >= 1 ? 5 : 0;
    parts.push({ label: 'Quantified Impact', points: qPts, max: 15, note: `${expMetrics} numbers in experience` });

    const verbs = cvText.match(/\b(built|developed|led|automated|optimized|designed|implemented|created|managed|improved|delivered|launched|engineered|architected|streamlined|reduced|increased|integrated|monitored|resolved|migrated|deployed|collaborated|presented|mentored|supported|maintained)\b/gi) || [];
    const vPts = verbs.length >= 6 ? 10 : verbs.length >= 3 ? 6 : verbs.length >= 1 ? 3 : 0;
    parts.push({ label: 'Action Verbs', points: vPts, max: 10, note: `${verbs.length} strong verbs` });

    let struct = 0;
    const headings = (cvText.match(/education|skills|professional experience|experience|projects/gi) || []).length;
    if (headings >= 4) struct += 5; else if (headings >= 2) struct += 3;
    const contactInfo = fields.contact.value;
    if (/@/.test(contactInfo) && /\b\d{7,}\b/.test(contactInfo) && contactInfo.split('\n').filter(l => l.trim()).length >= 3) struct += 4;
    struct = Math.min(struct, 10);
    parts.push({ label: 'Structure & Contact', points: struct, max: 10, note: '' });

    const jdActive = Boolean((job && total) || (activeKeywords && activeKeywords.length));
    const visibleParts = jdActive ? parts : parts.filter(p => p.label === 'Quantified Impact' || p.label === 'Action Verbs' || p.label === 'Structure & Contact');
    const raw = visibleParts.reduce((sum, p) => sum + p.points, 0);
    const maxPossible = jdActive ? 100 : 35;
    const score = Math.max(0, Math.min(100, Math.round((raw / maxPossible) * 100)));

    return { score, parts: visibleParts, matched, total };
}

function extractJobKeywords(jobText) {
    if (!jobText || !jobText.trim()) return [];
    const cutMarkers = /\b(related jobs|similar jobs|you may also like|sectors|share this job|report job|report this job|employer info|employer information|featured jobs|featured employers|join gradireland|sign up|about us|follow us|copyright|privacy policy|terms of use|applicant privacy)\b/i;
    const cutAt = jobText.search(cutMarkers);
    if (cutAt > 200) jobText = jobText.slice(0, cutAt);
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their', 'what', 'which', 'who', 'whom', 'where', 'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'because', 'as', 'until', 'while', 'about', 'between', 'through', 'during', 'before', 'after', 'above', 'below', 'from', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'also', 'etc', 'ie', 'eg', 'experience', 'work', 'job', 'role', 'position', 'team', 'company', 'description', 'requirements', 'required', 'skills', 'ability', 'including', 'include', 'includes', 'within', 'across', 'using', 'use', 'used', 'strong', 'good', 'excellent', 'knowledge', 'understanding', 'familiar', 'proficient', 'working', 'related', 'plus', 'minimum', 'preferred', 'equivalent', 'years', 'year', 'level', 'degree', 'bachelor', 'master', 'phd', 'education', 'graduate', 'undergraduate', 'minimum', 'desired', 'ideal', 'candidate', 'applicant', 'application', 'apply', 'applied', 'hiring', 'join', 'looking', 'seeking', 'help', 'make', 'ensure', 'provide', 'support', 'build', 'maintain', 'develop', 'design', 'implement', 'manage', 'create', 'write', 'test', 'deploy', 'monitor', 'troubleshoot', 'resolve', 'analyze', 'improve', 'optimize', 'collaborate', 'communicate', 'participate', 'contribute', 'drive', 'lead', 'mentor', 'coach', 'train', 'coordinate', 'plan', 'organize', 'prioritize', 'execute', 'deliver', 'achieve', 'meet', 'exceed', 'target', 'goal', 'objective', 'deadline', 'budget', 'quality', 'performance', 'safety', 'compliance', 'security', 'risk', 'data', 'system', 'process', 'project', 'product', 'service', 'solution', 'technology', 'platform', 'tool', 'framework', 'language', 'library', 'database', 'server', 'client', 'user', 'customer', 'business', 'stakeholder', 'vendor', 'partner', 'internal', 'external', 'global', 'local', 'remote', 'hybrid', 'office', 'travel', 'shift', 'weekend', 'holiday', 'benefit', 'salary', 'compensation', 'package', 'perk', 'bonus', 'equity', 'insurance', 'retirement', 'leave', 'vacation', 'sick', 'parental', 'disability', 'relocation', 'visa', 'sponsorship', 'background', 'check', 'drug', 'screen', 'reference', 'verification', 'clearance', 'certification', 'license', 'accreditation', 'member', 'association', 'society', 'group', 'community', 'industry', 'sector', 'field', 'domain', 'area', 'specialty', 'expertise', 'focus', 'passion', 'interest', 'hobby', 'activity', 'volunteer', 'club', 'sport', 'music', 'art', 'travel', 'food', 'culture', 'language', 'reading', 'writing', 'speaking', 'listening', 'learning', 'teaching', 'training', 'development', 'growth', 'career', 'professional', 'personal', 'life', 'balance', 'wellness', 'health', 'fitness', 'mental', 'physical', 'emotional', 'social', 'spiritual', 'financial', 'environmental', 'sustainable', 'ethical', 'diverse', 'inclusive', 'equitable', 'accessible', 'universal', 'human', 'rights', 'justice', 'peace', 'freedom', 'democracy', 'equality', 'equity', 'diversity', 'inclusion', 'belonging', 'respect', 'integrity', 'honesty', 'trust', 'transparency', 'accountability', 'responsibility', 'ownership', 'initiative', 'proactive', 'reliable', 'dependable', 'flexible', 'adaptable', 'versatile', 'resourceful', 'creative', 'innovative', 'strategic', 'analytical', 'critical', 'logical', 'systematic', 'detail', 'organized', 'efficient', 'productive', 'effective', 'successful', 'results', 'outcomes', 'impact', 'value', 'benefit', 'advantage', 'edge', 'differentiator', 'unique', 'special', 'exceptional', 'outstanding', 'remarkable', 'extraordinary', 'phenomenal', 'incredible', 'amazing', 'awesome', 'fantastic', 'wonderful', 'great', 'excellent', 'superb', 'superior', 'premium', 'deluxe', 'luxury', 'exclusive', 'elite', 'top', 'best', 'leading', 'forefront', 'cutting', 'edge', 'state', 'art', 'world', 'class', 'first', 'premier', 'prime', 'chief', 'main', 'primary', 'major', 'key', 'core', 'central', 'essential', 'vital', 'critical', 'crucial', 'important', 'significant', 'substantial', 'considerable', 'meaningful', 'relevant', 'applicable', 'suitable', 'appropriate', 'fitting', 'proper', 'correct', 'right', 'accurate', 'precise', 'exact', 'specific', 'particular', 'certain', 'definite', 'clear', 'obvious', 'evident', 'apparent', 'noticeable', 'visible', 'seen', 'known', 'understood', 'recognized', 'acknowledged', 'accepted', 'established', 'proven', 'verified', 'validated', 'confirmed', 'tested', 'tried', 'true', 'real', 'actual', 'genuine', 'authentic', 'original', 'natural', 'pure', 'clean', 'clear', 'fresh', 'new', 'modern', 'current', 'recent', 'latest', 'up', 'date', 'trendy', 'popular', 'fashionable', 'stylish', 'cool', 'hot', 'happening', 'buzz', 'viral', 'meme', 'trend', 'fad', 'craze', 'phenomenon', 'sensation', 'hit', 'smash', 'blockbuster', 'mega', 'super', 'ultra', 'hyper', 'extra', 'over', 'above', 'beyond', 'excess', 'surplus', 'spare', 'left', 'remaining', 'rest', 'balance', 'difference', 'gap', 'space', 'room', 'capacity', 'capability', 'potential', 'possibility', 'opportunity', 'chance', 'probability', 'likelihood', 'odds', 'risk', 'uncertainty', 'doubt', 'question', 'issue', 'problem', 'challenge', 'obstacle', 'barrier', 'hurdle', 'difficulty', 'complexity', 'complication', 'nuance', 'subtlety', 'detail', 'aspect', 'facet', 'element', 'component', 'part', 'piece', 'segment', 'section', 'division', 'department', 'unit', 'module', 'function', 'feature', 'characteristic', 'attribute', 'property', 'quality', 'trait', 'behavior', 'pattern', 'trend', 'cycle', 'rhythm', 'flow', 'pace', 'speed', 'velocity', 'rate', 'frequency', 'interval', 'period', 'duration', 'length', 'span', 'stretch', 'extent', 'degree', 'level', 'intensity', 'magnitude', 'scale', 'size', 'scope', 'range', 'reach', 'span', 'spread', 'coverage', 'breadth', 'depth', 'height', 'width', 'thickness', 'volume', 'mass', 'weight', 'density', 'concentration', 'pressure', 'temperature', 'humidity', 'moisture', 'dryness', 'wetness', 'heat', 'cold', 'warmth', 'coolness', 'light', 'dark', 'brightness', 'shade', 'shadow', 'color', 'hue', 'tint', 'tone', 'saturation', 'contrast', 'vibrancy', 'clarity', 'sharpness', 'blur', 'focus', 'resolution', 'definition', 'precision', 'accuracy', 'fidelity', 'realism', 'authenticity', 'credibility', 'reliability', 'validity', 'soundness', 'robustness', 'strength', 'durability', 'resilience', 'stability', 'consistency', 'coherence', 'congruity', 'harmony', 'balance', 'symmetry', 'proportion', 'ratio', 'percentage', 'fraction', 'decimal', 'number', 'digit', 'figure', 'numeral', 'integer', 'whole', 'count', 'tally', 'total', 'sum', 'aggregate', 'gross', 'net', 'average', 'mean', 'median', 'mode', 'range', 'variance', 'deviation', 'distribution', 'frequency', 'probability', 'statistics', 'data', 'info', 'information', 'knowledge', 'wisdom', 'insight', 'understanding', 'comprehension', 'grasp', 'awareness', 'consciousness', 'perception', 'cognition', 'thought', 'thinking', 'reasoning', 'logic', 'rationale', 'argument', 'case', 'point', 'view', 'perspective', 'angle', 'stance', 'position', 'attitude', 'opinion', 'belief', 'conviction', 'value', 'principle', 'standard', 'norm', 'benchmark', 'criterion', 'metric', 'measure', 'indicator', 'gauge', 'yardstick', 'touchstone', 'litmus', 'test', 'trial', 'experiment', 'pilot', 'prototype', 'model', 'sample', 'example', 'instance', 'case', 'illustration', 'demonstration', 'proof', 'evidence', 'verification', 'validation', 'confirmation', 'substantiation', 'corroboration', 'authentication', 'certification', 'endorsement', 'approval', 'acceptance', 'agreement', 'consensus', 'unanimity', 'accord', 'harmony', 'unity', 'solidarity', 'cohesion', 'integration', 'synthesis', 'fusion', 'blend', 'mixture', 'combination', 'compound', 'composite', 'alloy', 'amalgam', 'hybrid', 'cross', 'mix', 'fusion', 'mashup', 'remix', 'reinterpretation', 'reinvention', 'transformation', 'conversion', 'adaptation', 'modification', 'alteration', 'change', 'shift', 'switch', 'swap', 'exchange', 'replacement', 'substitution', 'alternative', 'option', 'choice', 'selection', 'preference', 'priority', 'precedence', 'advantage', 'edge', 'lead', 'upper', 'hand', 'leverage', 'influence', 'power', 'authority', 'control', 'command', 'dominance', 'supremacy', 'hegemony', 'monopoly', 'oligopoly', 'cartel', 'trust', 'syndicate', 'consortium', 'alliance', 'coalition', 'partnership', 'collaboration', 'cooperation', 'coordination', 'teamwork', 'synergy', 'combined', 'joint', 'shared', 'mutual', 'reciprocal', 'bilateral', 'multilateral', 'transnational', 'international', 'global', 'worldwide', 'universal', 'cosmic', 'galactic', 'interstellar', 'interplanetary', 'intergalactic', 'interdimensional', 'multidimensional', 'multiverse', 'parallel', 'alternate', 'alternative', 'different', 'diverse', 'various', 'sundry', 'assorted', 'miscellaneous', 'mixed', 'heterogeneous', 'eclectic', 'varied', 'diversified', 'comprehensive', 'inclusive', 'exhaustive', 'complete', 'total', 'absolute', 'utter', 'sheer', 'pure', 'sheer', 'outright', 'downright', 'plain', 'simple', 'mere', 'bare', 'sheer', 'utter', 'total', 'complete', 'absolute', 'full', 'entire', 'whole', 'intact', 'undivided', 'unified', 'consolidated', 'integrated', 'merged', 'fused', 'blended', 'amalgamated', 'incorporated', 'assimilated', 'absorbed', 'digested', 'understood', 'grasped', 'comprehended', 'apprehended', 'perceived', 'discerned', 'recognized', 'identified', 'distinguished', 'differentiated', 'discriminated', 'segregated', 'separated', 'isolated', 'detached', 'disconnected', 'disengaged', 'disjoined', 'divided', 'split', 'parted', 'broken', 'fractured', 'fragmented', 'shattered', 'smashed', 'crushed', 'cracked', 'split', 'torn', 'ripped', 'rended', 'severed', 'cut', 'chopped', 'sliced', 'diced', 'minced', 'ground', 'crushed', 'powdered', 'pulverized', 'liquefied', 'dissolved', 'melted', 'fused', 'smelted', 'refined', 'purified', 'cleansed', 'washed', 'rinsed', 'sanitized', 'sterilized', 'disinfected', 'decontaminated', 'detoxified', 'neutralized', 'counteracted', 'offset', 'balanced', 'equalized', 'leveled', 'flattened', 'smoothed', 'evened', 'aligned', 'adjusted', 'calibrated', 'tuned', 'regulated', 'controlled', 'managed', 'governed', 'ruled', 'dominated', 'commanded', 'led', 'guided', 'directed', 'steered', 'piloted', 'navigated', 'driven', 'ridden', 'flown', 'sailed', 'cruised', 'voyaged', 'journeyed', 'traveled', 'toured', 'visited', 'explored', 'discovered', 'found', 'located', 'situated', 'positioned', 'placed', 'set', 'put', 'laid', 'laid', 'installed', 'mounted', 'fixed', 'attached', 'fastened', 'secured', 'anchored', 'moored', 'dockedbertied', 'linked', 'connected', 'joined', 'united', 'coupled', 'paired', 'matched', 'teamed', 'grouped', 'clustered', 'bundled', 'packed', 'wrapped', 'boxed', 'cased', 'covered', 'coated', 'painted', 'painted', 'colored', 'tinted', 'dyed', 'stained', 'shaded', 'shadowed', 'darkened', 'lightened', 'brightened', 'illuminated', 'lit', 'glowed', 'shone', 'sparkled', 'glittered', 'glimmered', 'gleamed', 'glowed', 'radiated', 'emitted', 'released', 'discharged', 'ejected', 'expelled', 'propelled', 'launched', 'thrown', 'tossed', 'cast', 'flung', 'hurled', 'pitched', 'lobbed', 'chucked', 'heaved', 'hoisted', 'lifted', 'raised', 'elevated', 'uplifted', 'boosted', 'enhanced', 'improved', 'upgraded', 'updated', 'modernized', 'renovated', 'refurbished', 'restored', 'renewed', 'revived', 'resuscitated', 'revitalized', 'rejuvenated', 'regenerated', 'reborn', 'reincarnated', 'transformed', 'metamorphosed', 'transfigured', 'converted', 'changed', 'altered', 'modified', 'adjusted', 'adapted', 'tailored', 'customized', 'personalized', 'individualized', 'specialized', 'specific', 'particular', 'distinct', 'unique', 'singular', 'sole', 'only', 'lone', 'solitary', 'isolated', 'secluded', 'segregated', 'separated', 'detached', 'disconnected', 'disjoined', 'divided', 'split', 'parted', 'broken', 'fractured', 'fragmented', 'disrupted', 'disturbed', 'interrupted', 'discontinued', 'suspended', 'paused', 'halted', 'stopped', 'ceased', 'ended', 'terminated', 'concluded', 'finished', 'completed', 'done', 'over', 'through', 'past', 'gone', 'departed', 'left', 'exited', 'withdrawn', 'retreated', 'retired', 'resigned', 'abdicated', 'renounced', 'relinquished', 'surrendered', 'yielded', 'capitulated', 'submitted', 'succumbed', 'given', 'up', 'ceded', 'conceded', 'granted', 'accorded', 'awarded', 'bestowed', 'conferred', 'presented', 'donated', 'contributed', 'gifted', 'bequeathed', 'left', 'willed', 'passed', 'handed', 'delivered', 'transferred', 'transmitted', 'conveyed', 'communicated', 'imparted', 'shared', 'distributed', 'dispersed', 'disseminated', 'spread', 'scattered', 'sown', 'planted', 'seeded', 'grown', 'cultivated', 'nurtured', 'fostered', 'nourished', 'fed', 'sustained', 'maintained', 'supported', 'upheld', 'sustained', 'borne', 'carried', 'transported', 'conveyed', 'shipped', 'freighted', 'hauled', 'towed', 'tugged', 'pulled', 'dragged', 'drawn', 'attracted', 'magnetized', 'hypnotized', 'mesmerized', 'captivated', 'charmed', 'enchanted', 'bewitched', 'spellbound', 'transported', 'entranced', 'ecstatic', 'elated', 'euphoric', 'overjoyed', 'thrilled', 'exhilarated', 'excited', 'energized', 'electrified', 'galvanized', 'stimulated', 'motivated', 'inspired', 'encouraged', 'heartened', 'emboldened', 'empowered', 'enabled', 'facilitated', 'assisted', 'aided', 'helped', 'supported', 'backed', 'endorsed', 'sponsored', 'funded', 'financed', 'subsidized', 'underwritten', 'guaranteed', 'warranted', 'certified', 'attested', 'vouched', 'sworn', 'pledged', 'promised', 'committed', 'obligated', 'bound', 'liable', 'responsible', 'accountable', 'answerable', 'amenable', 'subject', 'open', 'susceptible', 'prone', 'vulnerable', 'exposed', 'liable', 'likely', 'apt', 'inclined', 'disposed', 'predisposed', 'tend', 'lean', 'gravitate', 'gravitated', 'drifted', 'wandered', 'roamed', 'rambled', 'meandered', 'zigzagged', 'crisscrossed', 'traversed', 'crossed', 'intersected', 'met', 'converged', 'merged', 'joined', 'united', 'combined', 'integrated', 'fused', 'blended', 'mixed', 'stirred', 'shaken', 'whipped', 'beaten', 'chopped', 'cut', 'sliced', 'minced', 'diced', 'ground', 'crushed', 'smashed', 'shattered', 'broken', 'fractured', 'splintered', 'split', 'cracked', 'snapped', 'popped', 'burst', 'exploded', 'detonated', 'ignited', 'fired', 'lit', 'burned', 'blazed', 'flamed', 'glowed', 'smoldered', 'charred', 'scorched', 'seared', 'burned', 'baked', 'roasted', 'toasted', 'grilled', 'fried', 'boiled', 'steamed', 'poached', 'simmered', 'stewed', 'braised', 'sauteed', 'stir', 'deep', 'flash', 'pan', 'grilled', 'barbecued', 'smoked', 'cured', 'aged', 'fermented', 'pickled', 'preserved', 'canned', 'bottled', 'jarred', 'packed', 'stored', 'saved', 'kept', 'held', 'retained', 'maintained', 'preserved', 'conserved', 'protected', 'guarded', 'defended', 'shielded', 'screened', 'sheltered', 'housed', 'accommodated', 'lodged', 'quartered', 'billeted', 'stationed', 'posted', 'positioned', 'located', 'placed', 'situated', 'established', 'settled', 'rooted', 'anchored', 'grounded', 'based', 'founded', 'built', 'constructed', 'erected', 'raised', 'elevated', 'lifted', 'hoisted', 'boosted', 'promoted', 'advanced', 'elevated', 'upgraded', 'upgraded', 'enhanced', 'improved', 'bettered', 'ameliorated', 'upgraded', 'updated', 'modernized', 'revolutionized', 'transformed', 'reformed', 'overhauled', 'remodeled', 'redesigned', 'refashioned', 'restyled', 'reworked', 'revised', 'amended', 'corrected', 'fixed', 'repaired', 'mended', 'patched', 'restored', 'renewed', 'revived', 'resurrected', 'reincarnated', 'regenerated', 'reborn', 'reborned']);

    const navWords = new Set(['jobs', 'job', 'advice', 'employers', 'employer', 'events', 'event', 'study', 'search', 'login', 'log', 'post', 'follow', 'following', 'verified', 'logo', 'image', 'apply', 'share', 'report', 'sectors', 'locations', 'location', 'featured', 'related', 'about', 'legal', 'privacy', 'terms', 'cookies', 'accessibility', 'guides', 'publications', 'recruitment', 'awards', 'course', 'courses', 'gradireland', 'gradsims', 'cibyl', 'gti', 'targetjobs', 'copyright', 'registered', 'england', 'organisation', 'website', 'home', 'menu', 'filter', 'sort', 'page', 'advert', 'advertisement', 'advertising', 'scheme', 'programme', 'programmes', 'program', 'roles', 'opportunity', 'opportunities', 'graduates', 'teams', 'candidates', 'desire', 'appetite', 'willingness', 'enthusiastic', 'enthusiasm', 'curiosity', 'curious', 'welcome', 'welcomes', 'inclusive', 'diverse', 'diversity', 'inclusion', 'commitment', 'committed', 'supportive', 'collaborative', 'fosters', 'fostering', 'innovation', 'innovative', 'meaningful', 'positive', 'shaping', 'talented', 'exciting', 'dynamic', 'growth', 'accelerate', 'accelerating', 'career', 'careers', 'journey', 'journeys', 'leadership', 'senior', 'continuous', 'offers', 'offering', 'provides', 'tailored', 'structured', 'goals', 'realworld', 'deliver', 'delivering', 'exceptional', 'investing', 'future', 'believe', 'belief', 'making', 'linkedin', 'twitter', 'youtube', 'instagram', 'tiktok', 'facebook', 'snapchat', 'ltd', 'futures', 'www', 'com', 'http', 'https', 'org', 'net', 'ie', 'uk', 'nbsp', 'amp', 'dublin', 'cork', 'galway', 'limerick', 'waterford', 'ireland', 'london', 'birmingham', 'manchester', 'remote', 'hybrid', 'onsite', 'relocation', 'vhi', 'cie', 'ey', 'accenture', 'deloitte', 'pwc', 'kpmg', 'undefined', 'background', 'applying', 'applicants', 'applicant', 'accommodation', 'accommodations', 'sustainability', 'sustainable', 'planet', 'healthcare', 'dental', 'hospital', 'hospitals', 'clinical', 'medical', 'benefits', 'benefit', 'salary', 'competitive', 'perks', 'perk', 'values', 'equal', 'equity', 'belonging', 'disability', 'disabilities', 'neurodivergence', 'confidential', 'confidentiality', 'reasonable', 'responsible', 'responsibility', 'responsibilities', 'members', 'overview', 'vacancy', 'apprenticeship', 'internships', 'placement', 'fulltime', 'parttime', 'permanent', 'contract', 'temporary', 'hours', 'week', 'month', 'days', 'date', 'closing', 'deadline', 'posted', 'starting', 'starts', 'begins', 'alongside', 'throughout', 'whilst', 'everyone', 'someone', 'something', 'anything', 'everything', 'knowledge', 'passion', 'passionate', 'excited', 'developing', 'develop', 'developed', 'learning', 'learn', 'grow', 'working', 'works', 'work', 'environment', 'environments', 'business', 'businesses', 'customers', 'customer', 'clients', 'client', 'company', 'companies', 'stakeholders', 'stakeholder', 'realtime', 'world', 'class', 'first', 'third', 'level', 'qualifications', 'holder', 'field', 'sector', 'area', 'areas', 'teamwork', 'independently', 'issues', 'concepts', 'familiarity', 'oriented', 'resolution', 'relationships', 'communications', 'qualification', 'qualifications', 'enterprises', 'implemented', 'resolving', 'basic', 'third', 'desired', 'outcomes', 'achieve', 'adhere', 'agreed', 'timelines', 'meaningful', 'focus', 'proven', 'abilities', 'ability', 'throughout', 'via', 'including', 'ensuring', 'supporting', 'managing', 'building', 'maintaining', 'designing', 'creating', 'writing', 'testing', 'deploying', 'monitoring', 'analyzing', 'improving', 'optimizing', 'collaborating', 'communicating', 'participating', 'contributing', 'driving', 'leading', 'mentoring', 'coordinate', 'coordinating', 'planning', 'organizing', 'prioritizing', 'executing', 'delivering', 'achieving', 'meeting', 'exceeding', 'coras', 'iompair', 'ireann', 'conditions', 'consulting', 'commute']);
    const allowWords = new Set(['security', 'compliance', 'risk', 'data', 'system', 'systems', 'project', 'product', 'service', 'technology', 'platform', 'tool', 'framework', 'language', 'library', 'database', 'server', 'cloud', 'network', 'networking', 'infrastructure', 'operations', 'testing', 'integration', 'deployment', 'configuration', 'automation', 'monitoring', 'migration', 'agile', 'scrum', 'api', 'identity', 'access', 'troubleshooting', 'qualification', 'cyber', 'enterprise', 'enterprises', 'environment', 'environments']);

    const clean = jobText.toLowerCase().replace(/[^a-z0-9+#\s]/g, ' ');
    const rawWords = clean.split(/\s+/).filter(Boolean);
    const isStop = (w) => {
        if (allowWords.has(w)) return false;
        return w.length < 3 || /^\d+$/.test(w) || stopWords.has(w) || navWords.has(w);
    };

    const counts = new Map();
    const bump = (term) => {
        if (!term) return;
        counts.set(term, (counts.get(term) || 0) + 1);
    };

    for (const w of rawWords) {
        if (!isStop(w)) bump(w);
    }

    const sentences = jobText.toLowerCase().replace(/[^a-z0-9+#.\s!?;]/g, ' ').split(/[.!?;\n]+/);
    for (const sentence of sentences) {
        const words = sentence.split(/\s+/).filter(Boolean);
        const run = [];
        const flush = () => {
            for (let i = 0; i < run.length; i++) {
                if (i + 1 < run.length) bump(run[i] + ' ' + run[i + 1]);
                if (i + 2 < run.length) bump(run[i] + ' ' + run[i + 1] + ' ' + run[i + 2]);
            }
            run.length = 0;
        };
        for (const w of words) {
            if (isStop(w)) flush();
            else run.push(w);
        }
        flush();
    }

    return [...counts.entries()]
        .sort((a, b) => {
            if (b[1] !== a[1]) return b[1] - a[1];
            const aw = a[0].split(' ').length;
            const bw = b[0].split(' ').length;
            if (bw !== aw) return bw - aw;
            return b[0].length - a[0].length;
        })
        .map(([term]) => term)
        .slice(0, 30);
}

function boldKeywords(text, jobText) {
    let result = escapeHtml(text);

    const metricsPattern = /\b(\d+%|\b\d+\+|\$\d+(?:,\d{3})*(?:\.\d+)?[KMB]?|\b\d+x\b|\b\d+\.\d+%)(?=\s|$|[^\w%])/g;
    result = result.replace(metricsPattern, '<strong>$1</strong>');

    if (jobText && jobText.trim()) {
        const rx = keywordRegex(jobText);
        if (rx) result = result.replace(rx, '<strong>$1</strong>');
    }

    return result;
}

function splitTopLevelComma(text) {
    let depth = 0;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === '(' || ch === '[') depth++;
        else if (ch === ')' || ch === ']') depth--;
        else if (ch === ',' && depth === 0) {
            return [text.slice(0, i).trim(), text.slice(i + 1).trim()];
        }
    }
    return [text.trim(), ''];
}

const CONTACT_ICONS = {
    email: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    phone: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 3h4l2 5-3 1a12 12 0 0 0 5 5l1-3 5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 4a1 1 0 0 1 1-1z"/></svg>',
    location: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    github: '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.72c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.36 1.09 2.94.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M4.98 3.5A2.5 2.5 0 1 0 5 8.5a2.5 2.5 0 0 0 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05C20.4 8.65 21 11 21 14.1V21h-4v-6.1c0-1.45-.03-3.3-2-3.3-2 0-2.3 1.57-2.3 3.2V21H9z"/></svg>'
};

function parseContact(contactText) {
    const lines = contactText.split('\n').map(l => l.trim()).filter(Boolean);
    const name = lines[0] || '';
    const tokens = [];
    for (const line of lines.slice(1)) {
        line.split('|').forEach(part => {
            const cleaned = part.trim().replace(/^(email|e-mail|phone|tel|mobile|location|address|linkedin|github|portfolio|website)\s*:\s*/i, '').trim();
            if (cleaned) tokens.push(cleaned);
        });
    }

    let email = '', phone = '', location = '', github = '', linkedin = '';
    for (const token of tokens) {
        if (!email && /@/.test(token)) { email = token; continue; }
        if (!github && /github/i.test(token)) { github = token; continue; }
        if (!linkedin && /linkedin/i.test(token)) { linkedin = token; continue; }
        const digits = (token.match(/\d/g) || []).length;
        if (!phone && digits >= 7 && !/[a-z]{4,}/i.test(token)) { phone = token; continue; }
        if (!location) location = token;
    }
    return { name, email, phone, location, github, linkedin };
}

function contactUrl(value, domain) {
    const v = String(value || '').trim();
    if (!v) return '';
    if (/^https?:\/\//i.test(v)) return v;
    if (v.toLowerCase().startsWith(domain)) return 'https://' + v;
    return 'https://' + domain + '/' + v.replace(/^\/+/, '');
}

function renderContact(contactText) {
    const p = parseContact(contactText);
    const items = [];
    if (p.email) items.push(`<span class="c-item">${CONTACT_ICONS.email}${escapeHtml(p.email)}</span>`);
    if (p.phone) items.push(`<span class="c-item">${CONTACT_ICONS.phone}${escapeHtml(p.phone)}</span>`);
    if (p.location) items.push(`<span class="c-item">${CONTACT_ICONS.location}${escapeHtml(p.location)}</span>`);
    if (p.github) items.push(`<span class="c-item">${CONTACT_ICONS.github}<a href="${escapeHtml(contactUrl(p.github, 'github.com'))}">${escapeHtml(p.github)}</a></span>`);
    if (p.linkedin) items.push(`<span class="c-item">${CONTACT_ICONS.linkedin}<a href="${escapeHtml(contactUrl(p.linkedin, 'linkedin.com'))}">${escapeHtml(p.linkedin)}</a></span>`);

    let html = '<div class="cv-header">';
    if (p.name) html += `<h1>${escapeHtml(p.name)}</h1>`;
    if (items.length) html += `<div class="contact-row">${items.join('')}</div>`;
    html += '</div>';
    return html;
}

function renderEducation(text, jobText) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    let html = '';
    let idx = 0;
    if (lines.length && !lines[0].startsWith('-')) {
        const [degree, institution] = splitTopLevelComma(lines[0]);
        html += `<p class="entry-title"><strong>${escapeHtml(degree)}</strong>`;
        if (institution) html += `, <em>${escapeHtml(institution)}</em>`;
        html += '</p>';
        idx = 1;
    }
    for (; idx < lines.length; idx++) {
        const line = lines[idx];
        if (line.startsWith('-')) {
            html += `<p class="bullet">${boldKeywords(line.slice(1).trim(), jobText)}</p>`;
        } else {
            html += `<p class="meta">${boldKeywords(line, jobText)}</p>`;
        }
    }
    return html;
}

function renderSkillItems(text, jobText) {
    const lines = text.split('\n').map(l => l.trim().replace(/^[-*•]\s*/, '')).filter(Boolean);
    const items = lines.map(line => {
        const colon = line.indexOf(':');
        if (colon > 0 && colon < 40) {
            const category = line.slice(0, colon).trim();
            const value = line.slice(colon + 1).trim();
            return `<li><strong>${escapeHtml(category)}:</strong> ${boldKeywords(value, jobText)}</li>`;
        }
        return `<li>${boldKeywords(line, jobText)}</li>`;
    }).join('');
    return `<ul class="skill-list">${items}</ul>`;
}

function parseEntryBlocks(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const entries = [];
    let i = 0;
    while (i < lines.length) {
        if (lines[i].startsWith('-')) { i++; continue; }
        const title = lines[i];
        i++;
        let meta = '';
        if (i < lines.length && !lines[i].startsWith('-')) {
            meta = lines[i];
            i++;
        }
        const bullets = [];
        while (i < lines.length && lines[i].startsWith('-')) {
            bullets.push(lines[i].slice(1).trim());
            i++;
        }
        entries.push({ title, meta, bullets });
    }
    return entries;
}

function renderTimeline(text, jobText, splitTitle) {
    const entries = parseEntryBlocks(text);
    return entries.map(entry => {
        let titleHtml;
        if (splitTitle) {
            const [title, company] = splitTopLevelComma(entry.title);
            titleHtml = `<strong>${escapeHtml(title)}</strong>`;
            if (company) titleHtml += `, <em>${escapeHtml(company)}</em>`;
        } else {
            titleHtml = `<strong>${escapeHtml(entry.title)}</strong>`;
        }

        let datesHtml = '<div class="entry-dates"></div>';
        if (entry.meta) {
            const metaParts = entry.meta.split(',').map(s => s.trim());
            datesHtml = `<div class="entry-dates">${escapeHtml(metaParts[0] || '')}`;
            if (metaParts.length > 1) datesHtml += `<br>${escapeHtml(metaParts.slice(1).join(', '))}`;
            datesHtml += '</div>';
        }

        const bullets = entry.bullets.map(b => `<li>${boldKeywords(b, jobText)}</li>`).join('');
        return `<div class="entry">${datesHtml}<div class="entry-body"><p class="entry-title">${titleHtml}</p>${bullets ? `<ul>${bullets}</ul>` : ''}</div></div>`;
    }).join('');
}

function formatCvHtml(jobText) {
    let html = renderContact(fields.contact.value);

    const education = fields.education.value.trim();
    if (education) html += `<h2>Education</h2>${renderEducation(education, jobText)}`;

    const tech = fields.techSkills.value.trim();
    const soft = fields.softSkills.value.trim();
    if (tech || soft) {
        html += '<h2>Skills</h2><div class="skills-grid">';
        if (tech) html += `<div><h3>Technical Skills</h3>${renderSkillItems(tech, jobText)}</div>`;
        if (soft) html += `<div><h3>Soft Skills</h3>${renderSkillItems(soft, jobText)}</div>`;
        html += '</div>';
    }

    const experience = fields.experience.value.trim();
    if (experience) html += `<h2>Professional Experience</h2>${renderTimeline(experience, jobText, true)}`;

    const projects = fields.projects.value.trim();
    if (projects) html += `<h2>Projects</h2>${renderTimeline(projects, jobText, false)}`;

    return html;
}

function formatCoverHtml(coverText, jobText) {
    let html = '';
    const lines = coverText.split('\n');
    let inParagraph = false;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
            if (inParagraph) {
                html += '</p>';
                inParagraph = false;
            }
            html += '<br>';
            continue;
        }

        if (/^(Dear|Sincerely)/.test(trimmed)) {
            if (inParagraph) html += '</p>';
            html += `<p class="salutation">${boldKeywords(trimmed, jobText)}</p>`;
            inParagraph = false;
            continue;
        }

        const bolded = boldKeywords(trimmed, jobText);

        if (!inParagraph) {
            html += '<p>';
            inParagraph = true;
        } else {
            html += ' ';
        }
        html += bolded;
    }
    if (inParagraph) html += '</p>';

    return html;
}

function escapeHtml(text) {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const PDF_CSS = `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
body {
    font-family: Calibri, 'Segoe UI', Lato, Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.3;
    color: #1a1a1a;
    margin: 0;
    padding: 10mm 10mm;
    max-width: 210mm;
}
a { color: inherit; text-decoration: none; }
.cv-header { margin-bottom: 6pt; }
.cv-header h1 {
    font-size: 19pt;
    font-weight: 700;
    margin: 0 0 4pt;
    letter-spacing: -0.3pt;
}
.contact-row {
    display: flex;
    flex-wrap: wrap;
    gap: 3pt 12pt;
    font-size: 9pt;
    color: #222;
}
.contact-row .c-item { display: inline-flex; align-items: center; gap: 3pt; }
.contact-row svg { flex-shrink: 0; }
h2 {
    font-size: 11.5pt;
    font-weight: 700;
    margin: 8pt 0 3pt;
    padding-bottom: 1.5pt;
    border-bottom: 1.2pt solid #000;
}
h3 { font-size: 10pt; font-weight: 700; margin: 0 0 2pt; }
p { margin: 0 0 2pt; }
p.bullet { padding-left: 12pt; text-indent: -9pt; }
p.meta { color: #333; }
.skills-grid { display: flex; gap: 16pt; }
.skills-grid > div { flex: 1; }
.skill-list { list-style: disc; margin: 0; padding-left: 11pt; }
.entry { display: flex; gap: 10pt; margin-bottom: 5pt; }
.entry-dates { flex: 0 0 76pt; font-size: 9pt; color: #333; }
.entry-body { flex: 1; }
.entry-title { margin: 0 0 2pt; }
ul { margin: 0; padding-left: 11pt; }
li { margin-bottom: 1.5pt; }
p, li { break-inside: avoid; }
strong { font-weight: 700; }
em { font-style: italic; }
p.salutation { font-weight: 700; }
`;

function exportPdf(type) {
    const jobText = jobDesc.value.trim();
    let bodyHtml, title;

    if (type === 'cv') {
        if (!buildCvText().trim()) {
            alert('Nothing to export yet.');
            return;
        }
        bodyHtml = formatCvHtml(jobText);
        title = 'CV';
    } else {
        const coverText = coverLetterText;
        if (!coverText || !coverText.trim()) {
            alert('Nothing to export yet.');
            return;
        }
        bodyHtml = formatCoverHtml(coverText, jobText);
        title = 'Cover Letter';
    }

    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>${PDF_CSS}</style></head><body>${bodyHtml}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => {
        win.print();
    }, 300);
}

function showLoading(message) {
    if (loadingText) loadingText.textContent = message || 'Working...';
    loading.style.display = 'flex';
}

function hideLoading() {
    loading.style.display = 'none';
}

function generateInterviewQuestions() {
    if (!apiKey) {
        alert('Please connect your DeepSeek API key first.');
        btnApi.click();
        return;
    }

    const jobText = jobDesc.value.trim();
    if (!jobText) {
        alert('Paste a job description first so the questions match the role.');
        return;
    }

    showLoading('Preparing interview questions...');

    const cvSummary = {
        education: fields.education.value.trim(),
        techSkills: fields.techSkills.value.trim(),
        softSkills: fields.softSkills.value.trim(),
        experience: fields.experience.value.trim(),
        projects: fields.projects.value.trim(),
    };

    const company = (parsedData && parsedData.company) ? String(parsedData.company).trim() : '';
    const roleName = (parsedData && parsedData.jobTitle) ? String(parsedData.jobTitle).trim() : '';

    const systemPrompt = 'You are an interview coach. Output ONLY valid JSON. No markdown, no code fences. Do NOT use em dashes anywhere. When a company is named in the job description, use that exact company name in your answers.';

    const contextLine = `${company ? `Company: ${company}\n` : ''}${roleName ? `Role: ${roleName}\n` : ''}Role and job description:\n${jobText}\n\nCandidate background:\n${JSON.stringify(cvSummary, null, 2)}`;

    const userPrompt = `${contextLine}\n\nPrepare interview material for this specific role. Use the candidate's real background and correlate it with what the employer and role are looking for. Do not invent experience.

1. "tellMeAboutYourself": a natural 60 to 90 second spoken answer that connects the candidate's real background to this role.
2. "whyThisCompany": a persuasive answer to "why do you want this job and why this company" that correlates the candidate's real experience with the employer's needs, and names the company if it appears in the description.
3. "questions": 8 likely interview questions for this role, most likely first, each with a STAR answer (Situation, Task, Action, Result) built ONLY from the candidate's real background.
4. "questionsToAsk": 5 thoughtful questions the candidate could ask the interviewer, specific to this role and company.
5. "openSource": if the company is known for open source (for example Red Hat, IBM, Canonical, SUSE, Mozilla) or the description mentions open source, give 3 to 4 open source related questions or talking points. Otherwise an empty array.

Return JSON in this shape:
{
  "tellMeAboutYourself": "...",
  "whyThisCompany": "...",
  "questions": [ { "question": "...", "situation": "...", "task": "...", "action": "...", "result": "..." } ],
  "questionsToAsk": [ "..." ],
  "openSource": [ "..." ]
}`;

    fetch(DEEPSEEK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.5,
            max_tokens: 4096,
        }),
    })
        .then(resp => {
            if (!resp.ok) throw new Error(`API error ${resp.status}`);
            return resp.json();
        })
        .then(data => {
            const content = data.choices?.[0]?.message?.content;
            if (!content) throw new Error('Empty response from API');
            const parsed = parseJsonResponse(content);
            const starQuestions = Array.isArray(parsed.questions) ? parsed.questions : [];
            interviewData = [];
            if (parsed.tellMeAboutYourself) {
                interviewData.push({ question: 'Tell me about yourself', paragraph: parsed.tellMeAboutYourself });
            }
            if (parsed.whyThisCompany) {
                interviewData.push({ question: 'Why do you want this job and why this company?', paragraph: parsed.whyThisCompany });
            }
            starQuestions.forEach(q => interviewData.push(q));
            interviewAsk = Array.isArray(parsed.questionsToAsk) ? parsed.questionsToAsk : [];
            interviewOpen = Array.isArray(parsed.openSource) ? parsed.openSource : [];
            if (!interviewData.length) throw new Error('No questions returned. Try again.');
            interviewQuestion.disabled = false;
            interviewQuestion.innerHTML = interviewData.map((item, i) => `<option value="${i}">${escapeHtml(item.question || ('Question ' + (i + 1)))}</option>`).join('');
            interviewQuestion.value = '0';
            renderInterviewAnswer();
            renderInterviewExtra();
        })
        .catch(err => {
            alert('Interview error: ' + err.message);
        })
        .finally(() => {
            hideLoading();
        });
}

function renderInterviewAnswer() {
    const idx = parseInt(interviewQuestion.value, 10);
    const item = interviewData[idx];
    if (!item) {
        interviewAnswer.textContent = 'Paste a job description, then generate to see tailored questions and STAR answers.';
        return;
    }

    const question = escapeHtml(item.question || '');

    if (item.paragraph) {
        interviewAnswer.innerHTML = `<p class="q">${question}</p><p>${escapeHtml(String(item.paragraph))}</p>`;
        return;
    }

    const star = [
        ['Situation', item.situation],
        ['Task', item.task],
        ['Action', item.action],
        ['Result', item.result],
    ];

    if (interviewFormat.value === 'paragraph') {
        const body = star.filter(s => s[1]).map(s => `<span class="star-label">${s[0]}:</span> ${escapeHtml(String(s[1]))}`).join(' ');
        interviewAnswer.innerHTML = `<p class="q">${question}</p><p>${body}</p>`;
    } else {
        const list = star.filter(s => s[1]).map(s => `<li><span class="star-label">${s[0]}:</span> ${escapeHtml(String(s[1]))}</li>`).join('');
        interviewAnswer.innerHTML = `<p class="q">${question}</p><ul>${list}</ul>`;
    }
}

function renderInterviewExtra() {
    let html = '';
    if (interviewAsk.length) {
        html += `<h4>Questions to ask the interviewer</h4><ul>${interviewAsk.map(q => `<li>${escapeHtml(String(q))}</li>`).join('')}</ul>`;
    }
    if (interviewOpen.length) {
        html += `<h4>Open source</h4><ul>${interviewOpen.map(q => `<li>${escapeHtml(String(q))}</li>`).join('')}</ul>`;
    }
    interviewExtra.innerHTML = html;
    interviewExtra.style.display = html ? 'block' : 'none';
}

init();
