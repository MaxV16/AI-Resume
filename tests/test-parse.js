const { strict: assert } = require('assert');

const CHAR_LIMIT = 2851;

// test the cover letter generation logic
function generateCoverLetter(contact, experience, jobText) {
    const name = contact.split('\n')[0] || 'Applicant';
    if (!experience) return '';

    const firstJob = experience.split('\n')[0] || '';
    const companyMatch = experience.match(/,\s*(.+)/);
    const company = companyMatch ? companyMatch[1].trim() : '';

    let letter = `${name}\n`;
    const contactLines = contact.split('\n');
    if (contactLines[1]) letter += contactLines[1] + '\n';
    if (contactLines[2]) letter += contactLines[2] + '\n';
    letter += '\nDear Hiring Manager,\n\n';
    letter += `I am writing to express my interest in the position${jobText ? ` as described in your job posting` : ''}. `;
    letter += `As a ${firstJob ? 'professional with experience as ' + firstJob : 'motivated professional'}, `;
    letter += `I believe my background aligns well with the requirements of this role.\n\n`;

    if (experience) {
        letter += `In my previous role${company ? ' at ' + company : ''}, I developed skills directly relevant to this position. `;
        letter += `My experience includes:\n`;
        const bullets = experience.split('\n').filter(l => l.trim().startsWith('-')).slice(0, 3);
        bullets.forEach(b => { letter += `${b}\n`; });
        letter += '\n';
    }

    letter += `I am eager to bring my technical skills and enthusiasm to your team. `;
    letter += `I welcome the opportunity to discuss how my experience can contribute to your organisation.\n\n`;
    letter += `Thank you for considering my application.\n\n`;
    letter += `Sincerely,\n${name}`;

    return letter;
}

// test basic cover letter
const contact = `ALEX MORGAN
Dublin, Ireland | 087 123 4567
alex.morgan@example.com`;

const experience = `Developer, Tech Company
2024-Present
- Built automated workflows
- Developed API integrations`;

const letter = generateCoverLetter(contact, experience, '');

assert.ok(letter.includes('ALEX MORGAN'), 'should include name');
assert.ok(letter.includes('Dear Hiring Manager'), 'should have greeting');
assert.ok(letter.includes('Tech Company'), 'should include company');
assert.ok(letter.includes('Built automated workflows'), 'should include bullets');
assert.ok(letter.includes('Sincerely'), 'should have closing');
assert.ok(!letter.includes('--'), 'no em dashes');

// test with job description
const letterWithJob = generateCoverLetter(contact, experience, 'Software Engineer');
assert.ok(letterWithJob.includes('as described in your job posting'), 'should reference job desc');

// test empty experience
const emptyLetter = generateCoverLetter(contact, '', '');
assert.ok(emptyLetter === '', 'empty experience should return empty');

// test name extraction
const multiLineContact = `JOHN DOE
some phone
some email`;
const nameOnly = generateCoverLetter(multiLineContact, experience, '');
assert.ok(nameOnly.includes('JOHN DOE'), 'should extract first line as name');

// test keyword extraction
function extractJobKeywords(jobText) {
    if (!jobText || !jobText.trim()) return [];
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their', 'what', 'which', 'who', 'whom', 'where', 'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'because', 'as', 'until', 'while', 'about', 'between', 'through', 'during', 'before', 'after', 'above', 'below', 'from', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'also', 'etc', 'ie', 'eg', 'experience', 'work', 'job', 'role', 'position', 'team', 'company', 'description', 'requirements', 'required', 'skills', 'ability', 'including', 'include', 'includes', 'within', 'across', 'using', 'use', 'used', 'strong', 'good', 'excellent', 'knowledge', 'understanding', 'familiar', 'proficient', 'working', 'related', 'plus', 'minimum', 'preferred', 'equivalent', 'years', 'year', 'level', 'degree', 'bachelor', 'master', 'phd', 'education', 'graduate', 'undergraduate', 'minimum', 'desired', 'ideal', 'candidate', 'applicant', 'application', 'apply', 'applied', 'hiring', 'join', 'looking', 'seeking', 'help', 'make', 'ensure', 'provide', 'support', 'build', 'maintain', 'develop', 'design', 'implement', 'manage', 'create', 'write', 'test', 'deploy', 'monitor', 'troubleshoot', 'resolve', 'analyze', 'improve', 'optimize', 'collaborate', 'communicate', 'participate', 'contribute', 'drive', 'lead', 'mentor', 'coach', 'train', 'coordinate', 'plan', 'organize', 'prioritize', 'execute', 'deliver', 'achieve', 'meet', 'exceed', 'target', 'goal', 'objective', 'deadline', 'budget', 'quality', 'performance', 'safety', 'compliance', 'security', 'risk', 'data', 'system', 'process', 'project', 'product', 'service', 'solution', 'technology', 'platform', 'tool', 'framework', 'language', 'library', 'database', 'server', 'client', 'user', 'customer', 'business', 'stakeholder', 'vendor', 'partner', 'internal', 'external', 'global', 'local', 'remote', 'hybrid', 'office', 'travel', 'shift', 'weekend', 'holiday', 'benefit', 'salary', 'compensation', 'package', 'perk', 'bonus', 'equity', 'insurance', 'retirement', 'leave', 'vacation', 'sick', 'parental', 'disability', 'relocation', 'visa', 'sponsorship', 'background', 'check', 'drug', 'screen', 'reference', 'verification', 'clearance', 'certification', 'license', 'accreditation', 'member', 'association', 'society', 'group', 'community', 'industry', 'sector', 'field', 'domain', 'area', 'specialty', 'expertise', 'focus', 'passion', 'interest', 'hobby', 'activity', 'volunteer', 'club', 'sport', 'music', 'art', 'travel', 'food', 'culture', 'language', 'reading', 'writing', 'speaking', 'listening', 'learning', 'teaching', 'training', 'development', 'growth', 'career', 'professional', 'personal', 'life', 'balance', 'wellness', 'health', 'fitness', 'mental', 'physical', 'emotional', 'social', 'spiritual', 'financial', 'environmental', 'sustainable', 'ethical', 'diverse', 'inclusive', 'equitable', 'accessible', 'universal', 'human', 'rights', 'justice', 'peace', 'freedom', 'democracy', 'equality', 'equity', 'diversity', 'inclusion', 'belonging', 'respect', 'integrity', 'honesty', 'trust', 'transparency', 'accountability', 'responsibility', 'ownership', 'initiative', 'proactive', 'reliable', 'dependable', 'flexible', 'adaptable', 'versatile', 'resourceful', 'creative', 'innovative', 'strategic', 'analytical', 'critical', 'logical', 'systematic', 'detail', 'organized', 'efficient', 'productive', 'effective', 'successful', 'results', 'outcomes', 'impact', 'value', 'benefit', 'advantage', 'edge', 'differentiator', 'unique', 'special', 'exceptional', 'outstanding', 'remarkable', 'extraordinary', 'phenomenal', 'incredible', 'amazing', 'awesome', 'fantastic', 'wonderful', 'great', 'excellent', 'superb', 'superior', 'premium', 'deluxe', 'luxury', 'exclusive', 'elite', 'top', 'best', 'leading', 'forefront', 'cutting', 'edge', 'state', 'art', 'world', 'class', 'first', 'premier', 'prime', 'chief', 'main', 'primary', 'major', 'key', 'core', 'central', 'essential', 'vital', 'critical', 'crucial', 'important', 'significant', 'substantial', 'considerable', 'meaningful', 'relevant', 'applicable', 'suitable', 'appropriate', 'fitting', 'proper', 'correct', 'right', 'accurate', 'precise', 'exact', 'specific', 'particular', 'certain', 'definite', 'clear', 'obvious', 'evident', 'apparent', 'noticeable', 'visible', 'seen', 'known', 'understood', 'recognized', 'acknowledged', 'accepted', 'established', 'proven', 'verified', 'validated', 'confirmed', 'tested', 'tried', 'true', 'real', 'actual', 'genuine', 'authentic', 'original', 'natural', 'pure', 'clean', 'clear', 'fresh', 'new', 'modern', 'current', 'recent', 'latest', 'up', 'date', 'trendy', 'popular', 'fashionable', 'stylish', 'cool', 'hot', 'happening', 'buzz', 'viral', 'meme', 'trend', 'fad', 'craze', 'phenomenon', 'sensation', 'hit', 'smash', 'blockbuster', 'mega', 'super', 'ultra', 'hyper', 'extra', 'over', 'above', 'beyond', 'excess', 'surplus', 'spare', 'left', 'remaining', 'rest', 'balance', 'difference', 'gap', 'space', 'room', 'capacity', 'capability', 'potential', 'possibility', 'opportunity', 'chance', 'probability', 'likelihood', 'odds', 'risk', 'uncertainty', 'doubt', 'question', 'issue', 'problem', 'challenge', 'obstacle', 'barrier', 'hurdle', 'difficulty', 'complexity', 'complication', 'nuance', 'subtlety', 'detail', 'aspect', 'facet', 'element', 'component', 'part', 'piece', 'segment', 'section', 'division', 'department', 'unit', 'module', 'function', 'feature', 'characteristic', 'attribute', 'property', 'quality', 'trait', 'behavior', 'pattern', 'trend', 'cycle', 'rhythm', 'flow', 'pace', 'speed', 'velocity', 'rate', 'frequency', 'interval', 'period', 'duration', 'length', 'span', 'stretch', 'extent', 'degree', 'level', 'intensity', 'magnitude', 'scale', 'size', 'scope', 'range', 'reach', 'span', 'spread', 'coverage', 'breadth', 'depth', 'height', 'width', 'thickness', 'volume', 'mass', 'weight', 'density', 'concentration', 'pressure', 'temperature', 'humidity', 'moisture', 'dryness', 'wetness', 'heat', 'cold', 'warmth', 'coolness', 'light', 'dark', 'brightness', 'shade', 'shadow', 'color', 'hue', 'tint', 'tone', 'saturation', 'contrast', 'vibrancy', 'clarity', 'sharpness', 'blur', 'focus', 'resolution', 'definition', 'precision', 'accuracy', 'fidelity', 'realism', 'authenticity', 'credibility', 'reliability', 'validity', 'soundness', 'robustness', 'strength', 'durability', 'resilience', 'stability', 'consistency', 'coherence', 'congruity', 'harmony', 'balance', 'symmetry', 'proportion', 'ratio', 'percentage', 'fraction', 'decimal', 'number', 'digit', 'figure', 'numeral', 'integer', 'whole', 'count', 'tally', 'total', 'sum', 'aggregate', 'gross', 'net', 'average', 'mean', 'median', 'mode', 'range', 'variance', 'deviation', 'distribution', 'frequency', 'probability', 'statistics', 'data', 'info', 'information', 'knowledge', 'wisdom', 'insight', 'understanding', 'comprehension', 'grasp', 'awareness', 'consciousness', 'perception', 'cognition', 'thought', 'thinking', 'reasoning', 'logic', 'rationale', 'argument', 'case', 'point', 'view', 'perspective', 'angle', 'stance', 'position', 'attitude', 'opinion', 'belief', 'conviction', 'value', 'principle', 'standard', 'norm', 'benchmark', 'criterion', 'metric', 'measure', 'indicator', 'gauge', 'yardstick', 'touchstone', 'litmus', 'test', 'trial', 'experiment', 'pilot', 'prototype', 'model', 'sample', 'example', 'instance', 'case', 'illustration', 'demonstration', 'proof', 'evidence', 'verification', 'validation', 'confirmation', 'substantiation', 'corroboration', 'authentication', 'certification', 'endorsement', 'approval', 'acceptance', 'agreement', 'consensus', 'unanimity', 'accord', 'harmony', 'unity', 'solidarity', 'cohesion', 'integration', 'synthesis', 'fusion', 'blend', 'mixture', 'combination', 'compound', 'composite', 'alloy', 'amalgam', 'hybrid', 'cross', 'mix', 'fusion', 'mashup', 'remix', 'reinterpretation', 'reinvention', 'transformation', 'conversion', 'adaptation', 'modification', 'alteration', 'change', 'shift', 'switch', 'swap', 'exchange', 'replacement', 'substitution', 'alternative', 'option', 'choice', 'selection', 'preference', 'priority', 'precedence', 'advantage', 'edge', 'lead', 'upper', 'hand', 'leverage', 'influence', 'power', 'authority', 'control', 'command', 'dominance', 'supremacy', 'hegemony', 'monopoly', 'oligopoly', 'cartel', 'trust', 'syndicate', 'consortium', 'alliance', 'coalition', 'partnership', 'collaboration', 'cooperation', 'coordination', 'teamwork', 'synergy', 'combined', 'joint', 'shared', 'mutual', 'reciprocal', 'bilateral', 'multilateral', 'transnational', 'international', 'global', 'worldwide', 'universal', 'cosmic', 'galactic', 'interstellar', 'interplanetary', 'intergalactic', 'interdimensional', 'multidimensional', 'multiverse', 'parallel', 'alternate', 'alternative', 'different', 'diverse', 'various', 'sundry', 'assorted', 'miscellaneous', 'mixed', 'heterogeneous', 'eclectic', 'varied', 'diversified', 'comprehensive', 'inclusive', 'exhaustive', 'complete', 'total', 'absolute', 'utter', 'sheer', 'pure', 'sheer', 'outright', 'downright', 'plain', 'simple', 'mere', 'bare', 'sheer', 'utter', 'total', 'complete', 'absolute', 'full', 'entire', 'whole', 'intact', 'undivided', 'unified', 'consolidated', 'integrated', 'merged', 'fused', 'blended', 'amalgamated', 'incorporated', 'assimilated', 'absorbed', 'digested', 'understood', 'grasped', 'comprehended', 'apprehended', 'perceived', 'discerned', 'recognized', 'identified', 'distinguished', 'differentiated', 'discriminated', 'segregated', 'separated', 'isolated', 'detached', 'disconnected', 'disengaged', 'disjoined', 'divided', 'split', 'parted', 'broken', 'fractured', 'fragmented', 'shattered', 'smashed', 'crushed', 'cracked', 'split', 'torn', 'ripped', 'rended', 'severed', 'cut', 'chopped', 'sliced', 'diced', 'minced', 'ground', 'crushed', 'powdered', 'pulverized', 'liquefied', 'dissolved', 'melted', 'fused', 'smelted', 'refined', 'purified', 'cleansed', 'washed', 'rinsed', 'sanitized', 'sterilized', 'disinfected', 'decontaminated', 'detoxified', 'neutralized', 'counteracted', 'offset', 'balanced', 'equalized', 'leveled', 'flattened', 'smoothed', 'evened', 'aligned', 'adjusted', 'calibrated', 'tuned', 'regulated', 'controlled', 'managed', 'governed', 'ruled', 'dominated', 'commanded', 'led', 'guided', 'directed', 'steered', 'piloted', 'navigated', 'driven', 'ridden', 'flown', 'sailed', 'cruised', 'voyaged', 'journeyed', 'traveled', 'toured', 'visited', 'explored', 'discovered', 'found', 'located', 'situated', 'positioned', 'placed', 'set', 'put', 'laid', 'laid', 'installed', 'mounted', 'fixed', 'attached', 'fastened', 'secured', 'anchored', 'moored', 'dockedbertied', 'linked', 'connected', 'joined', 'united', 'coupled', 'paired', 'matched', 'teamed', 'grouped', 'clustered', 'bundled', 'packed', 'wrapped', 'boxed', 'cased', 'covered', 'coated', 'painted', 'painted', 'colored', 'tinted', 'dyed', 'stained', 'shaded', 'shadowed', 'darkened', 'lightened', 'brightened', 'illuminated', 'lit', 'glowed', 'shone', 'sparkled', 'glittered', 'glimmered', 'gleamed', 'glowed', 'radiated', 'emitted', 'released', 'discharged', 'ejected', 'expelled', 'propelled', 'launched', 'thrown', 'tossed', 'cast', 'flung', 'hurled', 'pitched', 'lobbed', 'chucked', 'heaved', 'hoisted', 'lifted', 'raised', 'elevated', 'uplifted', 'boosted', 'enhanced', 'improved', 'upgraded', 'updated', 'modernized', 'renovated', 'refurbished', 'restored', 'renewed', 'revived', 'resuscitated', 'revitalized', 'rejuvenated', 'regenerated', 'reborn', 'reincarnated', 'transformed', 'metamorphosed', 'transfigured', 'converted', 'changed', 'altered', 'modified', 'adjusted', 'adapted', 'tailored', 'customized', 'personalized', 'individualized', 'specialized', 'specific', 'particular', 'distinct', 'unique', 'singular', 'sole', 'only', 'lone', 'solitary', 'isolated', 'secluded', 'segregated', 'separated', 'detached', 'disconnected', 'disjoined', 'divided', 'split', 'parted', 'broken', 'fractured', 'fragmented', 'disrupted', 'disturbed', 'interrupted', 'discontinued', 'suspended', 'paused', 'halted', 'stopped', 'ceased', 'ended', 'terminated', 'concluded', 'finished', 'completed', 'done', 'over', 'through', 'past', 'gone', 'departed', 'left', 'exited', 'withdrawn', 'retreated', 'retired', 'resigned', 'abdicated', 'renounced', 'relinquished', 'surrendered', 'yielded', 'capitulated', 'submitted', 'succumbed', 'given', 'up', 'ceded', 'conceded', 'granted', 'accorded', 'awarded', 'bestowed', 'conferred', 'presented', 'donated', 'contributed', 'gifted', 'bequeathed', 'left', 'willed', 'passed', 'handed', 'delivered', 'transferred', 'transmitted', 'conveyed', 'communicated', 'imparted', 'shared', 'distributed', 'dispersed', 'disseminated', 'spread', 'scattered', 'sown', 'planted', 'seeded', 'grown', 'cultivated', 'nurtured', 'fostered', 'nourished', 'fed', 'sustained', 'maintained', 'supported', 'upheld', 'sustained', 'borne', 'carried', 'transported', 'conveyed', 'shipped', 'freighted', 'hauled', 'towed', 'tugged', 'pulled', 'dragged', 'drawn', 'attracted', 'magnetized', 'hypnotized', 'mesmerized', 'captivated', 'charmed', 'enchanted', 'bewitched', 'spellbound', 'transported', 'entranced', 'ecstatic', 'elated', 'euphoric', 'overjoyed', 'thrilled', 'exhilarated', 'excited', 'energized', 'electrified', 'galvanized', 'stimulated', 'motivated', 'inspired', 'encouraged', 'heartened', 'emboldened', 'empowered', 'enabled', 'facilitated', 'assisted', 'aided', 'helped', 'supported', 'backed', 'endorsed', 'sponsored', 'funded', 'financed', 'subsidized', 'underwritten', 'guaranteed', 'warranted', 'certified', 'attested', 'vouched', 'sworn', 'pledged', 'promised', 'committed', 'obligated', 'bound', 'liable', 'responsible', 'accountable', 'answerable', 'amenable', 'subject', 'open', 'susceptible', 'prone', 'vulnerable', 'exposed', 'liable', 'likely', 'apt', 'inclined', 'disposed', 'predisposed', 'tend', 'lean', 'gravitate', 'gravitated', 'drifted', 'wandered', 'roamed', 'rambled', 'meandered', 'zigzagged', 'crisscrossed', 'traversed', 'crossed', 'intersected', 'met', 'converged', 'merged', 'joined', 'united', 'combined', 'integrated', 'fused', 'blended', 'mixed', 'stirred', 'shaken', 'whipped', 'beaten', 'chopped', 'cut', 'sliced', 'minced', 'diced', 'ground', 'crushed', 'smashed', 'shattered', 'broken', 'fractured', 'splintered', 'split', 'cracked', 'snapped', 'popped', 'burst', 'exploded', 'detonated', 'ignited', 'fired', 'lit', 'burned', 'blazed', 'flamed', 'glowed', 'smoldered', 'charred', 'scorched', 'seared', 'burned', 'baked', 'roasted', 'toasted', 'grilled', 'fried', 'boiled', 'steamed', 'poached', 'simmered', 'stewed', 'braised', 'sauteed', 'stir', 'deep', 'flash', 'pan', 'grilled', 'barbecued', 'smoked', 'cured', 'aged', 'fermented', 'pickled', 'preserved', 'canned', 'bottled', 'jarred', 'packed', 'stored', 'saved', 'kept', 'held', 'retained', 'maintained', 'preserved', 'conserved', 'protected', 'guarded', 'defended', 'shielded', 'screened', 'sheltered', 'housed', 'accommodated', 'lodged', 'quartered', 'billeted', 'stationed', 'posted', 'positioned', 'located', 'placed', 'situated', 'established', 'settled', 'rooted', 'anchored', 'grounded', 'based', 'founded', 'built', 'constructed', 'erected', 'raised', 'elevated', 'lifted', 'hoisted', 'boosted', 'promoted', 'advanced', 'elevated', 'upgraded', 'upgraded', 'enhanced', 'improved', 'bettered', 'ameliorated', 'upgraded', 'updated', 'modernized', 'revolutionized', 'transformed', 'reformed', 'overhauled', 'remodeled', 'redesigned', 'refashioned', 'restyled', 'reworked', 'revised', 'amended', 'corrected', 'fixed', 'repaired', 'mended', 'patched', 'restored', 'renewed', 'revived', 'resurrected', 'reincarnated', 'regenerated', 'reborn', 'reborned']);

    const words = jobText.toLowerCase().split(/\s+/);
    const keywords = words.filter(w => {
        const cleaned = w.replace(/[^a-z0-9+#]/g, '');
        return cleaned.length >= 3 && !stopWords.has(cleaned);
    });
    return [...new Set(keywords)].slice(0, 30);
}

const jobText = 'We are looking for a Python developer with AWS and Docker experience. Must have strong communication skills.';
const keywords = extractJobKeywords(jobText);
assert.ok(keywords.includes('python'), 'should extract python');
assert.ok(keywords.includes('developer'), 'should extract developer');
assert.ok(keywords.includes('aws'), 'should extract aws');
assert.ok(keywords.includes('docker'), 'should extract docker');
assert.ok(keywords.includes('communication'), 'should extract communication');

const noKeywords = extractJobKeywords('');
assert.ok(noKeywords.length === 0, 'empty job text should return no keywords');

// test keyword bolding
function escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function boldKeywords(text, jobText) {
    if (!jobText || !jobText.trim()) return escapeHtml(text);
    const keywords = extractJobKeywords(jobText);
    let result = escapeHtml(text);
    const metricsPattern = /\b(\d+%|\b\d+\+|\$\d+(?:,\d{3})*(?:\.\d+)?[KMB]?|\b\d+x\b|\b\d+\.\d+%)(?=\s|$|[^\w%])/g;
    result = result.replace(metricsPattern, '<strong>$1</strong>');
    for (const kw of keywords) {
        const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b(${escaped})\\b`, 'gi');
        result = result.replace(regex, '<strong>$1</strong>');
    }
    return result;
}

const boldResult = boldKeywords('Built Python apps on AWS with 30% improvement', jobText);
assert.ok(boldResult.includes('<strong>Built</strong>') || boldResult.includes('<strong>Python</strong>'), 'should bold keywords');
assert.ok(boldResult.includes('<strong>30%</strong>'), 'should bold metrics');

const noJobBold = boldKeywords('some text', '');
assert.ok(!noJobBold.includes('<strong>'), 'no job text means no bolding');

// test cv html formatting
function formatCvHtml(cvText, jobText) {
    let html = '';
    const lines = cvText.split('\n');
    let inSection = false;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
            html += '<br>';
            continue;
        }

        if (/^(EDUCATION|SKILLS|PROFESSIONAL EXPERIENCE|PROJECTS|REFEREES)$/i.test(trimmed)) {
            html += `<h2>${trimmed}</h2>`;
            inSection = true;
        } else if (/^(Technical Skills|Soft Skills)$/i.test(trimmed)) {
            html += `<h3>${trimmed}</h3>`;
        } else if (/^- /i.test(trimmed)) {
            html += `<p class="bullet">${boldKeywords(trimmed, jobText)}</p>`;
        } else if (inSection && trimmed.includes(',')) {
            const parts = trimmed.split(',');
            if (parts.length >= 2) {
                html += `<p><strong>${parts[0]}</strong>${parts.slice(1).join(',')}</p>`;
            } else {
                html += `<p>${boldKeywords(trimmed, jobText)}</p>`;
            }
        } else {
            html += `<p>${boldKeywords(trimmed, jobText)}</p>`;
        }
    }

    return html;
}

const cvText = `ALEX MORGAN
EDUCATION
BSc Computer Science, University, 2023-2027
SKILLS
Technical Skills
Python, AWS, Docker
PROFESSIONAL EXPERIENCE
Developer, Tech Co, 2024-Present
- Built Python apps on AWS with 30% improvement`;

const cvHtml = formatCvHtml(cvText, jobText);
assert.ok(cvHtml.includes('<h2>EDUCATION</h2>'), 'should have h2 for sections');
assert.ok(cvHtml.includes('<h3>Technical Skills</h3>'), 'should have h3 for subsections');
assert.ok(cvHtml.includes('<p class="bullet">'), 'should have bullet paragraphs');
assert.ok(cvHtml.includes('<strong>Python</strong>'), 'should bold keywords in cv html');

// test cover letter html formatting
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

    const metricsPattern = /\b(\d+%|\b\d+\+|\$\d+(?:,\d{3})*(?:\.\d+)?[KMB]?|\b\d+x\b|\b\d+\.\d+%)(?=\s|$|[^\w%])/g;
        const bolded = boldKeywords(trimmed, jobText).replace(metricsPattern, '<strong>$1</strong>');

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

const coverText = `ALEX MORGAN
087 123 4567 | alex.morgan@example.com

Dear Hiring Manager,

I am writing to express my interest in the position as described in your job posting. I improved performance by 40% using Python and AWS.

Sincerely,
ALEX MORGAN`;

const coverHtml = formatCoverHtml(coverText, jobText);
assert.ok(coverHtml.includes('<p class="salutation">Dear Hiring Manager,</p>'), 'should format salutation');
assert.ok(coverHtml.includes('<strong>40%</strong>'), 'should bold metrics in cover html');

// test trim functions
function trimFieldProjects(text) {
    const lines = text.split('\n').filter(l => l.trim());
    const header = lines[0] || '';
    const bullets = lines.filter(l => l.trim().startsWith('-'));
    const keptBullets = bullets.slice(0, Math.max(1, Math.floor(bullets.length / 2)));
    return [header, ...keptBullets].join('\n');
}

const projectsInput = `Project One (Python)
- Did this
- Did that
- Did something else
- Did another thing`;

const trimmedProjects = trimFieldProjects(projectsInput);
assert.ok(trimmedProjects.includes('Project One'), 'should keep project header');
assert.ok((trimmedProjects.match(/-/g) || []).length <= 2, 'should reduce bullets');

// test skill group building
function buildSkillGroups(tech, soft) {
    const techLines = tech.split('\n').map(l => l.trim()).filter(Boolean);
    const softLines = soft.split('\n').map(l => l.trim()).filter(Boolean);
    const groups = [];
    let techAll = [];
    techLines.forEach(line => {
        const colon = line.indexOf(':');
        if (colon > 0 && colon < 40) {
            const label = line.slice(0, colon).trim();
            const values = line.slice(colon + 1).split(',').map(s => s.trim()).filter(Boolean);
            groups.push({ label, value: values.join(', ') });
            techAll = techAll.concat(values);
        } else {
            techAll = techAll.concat(line.split(',').map(s => s.trim()).filter(Boolean));
        }
    });
    let softAll = [];
    softLines.forEach(line => {
        const colon = line.indexOf(':');
        const values = (colon > 0 && colon < 40 ? line.slice(colon + 1) : line).split(',').map(s => s.trim()).filter(Boolean);
        softAll = softAll.concat(values);
    });
    const result = [];
    if (techAll.length) result.push({ label: 'All Technical Skills', value: techAll.join(', ') });
    if (softAll.length) result.push({ label: 'All Soft Skills', value: softAll.join(', ') });
    groups.forEach(g => { if (!result.some(r => r.label === g.label)) result.push(g); });
    const everything = [...techAll, ...softAll];
    if (everything.length) result.unshift({ label: 'Everything', value: [...new Set(everything)].join(', ') });
    return result;
}

const skillGroups = buildSkillGroups('Security: IAM, AWS\nNetworking: DNS, TCP/IP', 'Communication, Teamwork');
assert.ok(skillGroups[0].label === 'Everything', 'everything group should be first');
assert.ok(skillGroups.some(g => g.label === 'All Technical Skills' && g.value.includes('AWS')), 'should build all technical group');
assert.ok(skillGroups.some(g => g.label === 'Security' && g.value === 'IAM, AWS'), 'should build category group');
assert.ok(skillGroups.some(g => g.value.includes('Teamwork')), 'should include soft skills');

// test star answer formatting
function formatStarAnswer(item, format) {
    const star = [['Situation', item.situation], ['Task', item.task], ['Action', item.action], ['Result', item.result]];
    if (format === 'paragraph') {
        return star.filter(s => s[1]).map(s => s[0] + ': ' + s[1]).join(' ');
    }
    return star.filter(s => s[1]).map(s => s[0] + ': ' + s[1]);
}

const sampleQ = { question: 'Tell me about a time', situation: 'A', task: 'B', action: 'C', result: 'D' };
const paraStar = formatStarAnswer(sampleQ, 'paragraph');
const bulletStar = formatStarAnswer(sampleQ, 'bullets');
assert.ok(typeof paraStar === 'string' && paraStar.includes('Situation: A') && paraStar.includes('Result: D'), 'paragraph star should join fields');
assert.ok(Array.isArray(bulletStar) && bulletStar.length === 4, 'bullet star should return four lines');

console.log('All parse tests passed');
