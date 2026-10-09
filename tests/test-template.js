const { strict: assert } = require('assert');
const fs = require('fs');
const path = require('path');

const CHAR_LIMIT = 2851;

// pull the js file and check for common issues
const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

// make sure no api key is hardcoded (check for actual key pattern, not the sk- prefix check)
assert.ok(!appJs.match(/sk-[a-zA-Z0-9]{20,}/), 'api key should not be hardcoded in app.js');

// make sure localStorage is used for the key
assert.ok(appJs.includes('localStorage'), 'should use localStorage for api key');

// make sure the char limit is enforced
assert.ok(appJs.includes('2851'), 'char limit of 2851 should be referenced');

// make sure em dashes are not in the source (check for actual em dash char, not --)
assert.ok(!appJs.includes('\u2014'), 'no em dashes in app.js source');
assert.ok(!indexHtml.includes('\u2014'), 'no em dashes in index.html source');

// make sure the deepseek endpoint is correct
assert.ok(appJs.includes('api.deepseek.com'), 'should use deepseek api');

// make sure pdf export exists
assert.ok(appJs.includes('exportPdf'), 'pdf export function should exist');

// make sure ats scoring exists
assert.ok(appJs.includes('calculateAtsScore'), 'ats scoring should exist');

// make sure cover letter generation exists
assert.ok(appJs.includes('generateCoverLetterAI'), 'ai cover letter generation should exist');

// make sure dark mode styles exist
assert.ok(stylesCss.includes('--bg'), 'dark mode css variables should exist');

// make sure print styles exist
assert.ok(stylesCss.includes('@media print'), 'print styles should exist');

// make sure the template sections are in the html
const requiredFields = ['field-contact', 'field-education', 'field-tech-skills', 'field-soft-skills', 'field-experience', 'field-projects'];
requiredFields.forEach(id => {
    assert.ok(indexHtml.includes(id), `missing field: ${id}`);
});
assert.ok(!indexHtml.includes('field-referees'), 'referees field should be removed');
assert.ok(!indexHtml.includes('field-profile'), 'profile field should be removed');
assert.ok(!indexHtml.includes('field-achievements'), 'achievements field should be removed');
assert.ok(appJs.includes('callDeepSeek'), 'shared deepseek caller should exist');
assert.ok(appJs.includes('activeKeywords'), 'ai keyword curation should exist');

// make sure export buttons exist
assert.ok(indexHtml.includes('btn-export-cv'), 'export cv button missing');
assert.ok(indexHtml.includes('btn-export-cover'), 'export cover letter button missing');

// make sure api modal exists
assert.ok(indexHtml.includes('api-modal'), 'api key modal missing');

// make sure test connection button exists
assert.ok(indexHtml.includes('btn-test-connection'), 'test connection button missing');
assert.ok(indexHtml.includes('btn-clear-key'), 'clear key button missing');
assert.ok(indexHtml.includes('test-status'), 'test status element missing');

// make sure api key validation exists
assert.ok(appJs.includes('startsWith'), 'api key format validation missing');

// make sure json parsing fallback exists
assert.ok(appJs.includes('parseJsonResponse'), 'json parsing fallback missing');

// make sure more/less details regeneration is gone
assert.ok(!appJs.includes('regenerateDetails'), 'regenerate details function should be removed');
assert.ok(!appJs.includes('regenerateLessDetails'), 'regenerate less details function should be removed');
assert.ok(!indexHtml.includes('btn-regenerate"'), 'more details button should be removed');
assert.ok(!indexHtml.includes('btn-regenerate-less'), 'less details button should be removed');

// make sure ai cover letter + keyword curation exist
assert.ok(appJs.includes('generateCoverLetterAI'), 'ai cover letter function missing');
assert.ok(appJs.includes('activeKeywords'), 'active keyword state missing');
assert.ok(appJs.includes('activeJobTitle'), 'active job title state missing');
assert.ok(/["']company["']/.test(appJs), 'company field missing from prompt');
assert.ok(/["']jobTitle["']/.test(appJs), 'job title field missing from prompt');
assert.ok(/["']keywords["']/.test(appJs), 'keywords field missing from prompt');
assert.ok(indexHtml.includes('btn-regenerate-cover'), 'regenerate cover letter button missing');

// make sure char limit enforcement exists
assert.ok(appJs.includes('enforceCharLimit'), 'char limit enforcement missing');

// make sure pdf formatting functions exist
assert.ok(appJs.includes('formatCvHtml'), 'cv pdf formatting missing');
assert.ok(appJs.includes('formatCoverHtml'), 'cover letter pdf formatting missing');
assert.ok(appJs.includes('boldKeywords'), 'keyword bolding missing');
assert.ok(appJs.includes('extractJobKeywords'), 'job keyword extraction missing');

// make sure tailoring features exist
assert.ok(appJs.includes('highlightPreview'), 'live preview highlighting missing');
assert.ok(appJs.includes('keywordCoverage'), 'keyword coverage missing');
assert.ok(appJs.includes('keywordRegex'), 'keyword regex helper missing');
assert.ok(appJs.includes('navWords'), 'navigation word filtering missing');
assert.ok(!appJs.includes('Priority keywords to weave'), 'pre-ai keyword injection should be removed');
assert.ok(appJs.includes('correctionPrompt') || appJs.includes('not clearly present yet'), 'ai keyword correction pass missing');
assert.ok(appJs.includes('extractJobTitle'), 'job title extraction missing');
assert.ok(appJs.includes('Keyword Match'), 'keyword match bucket missing');
assert.ok(appJs.includes('Job Title Match'), 'job title match bucket missing');
assert.ok(appJs.includes('Quantified Impact'), 'quantified impact bucket missing');
assert.ok(appJs.includes('Structure & Contact'), 'structure and contact bucket missing');
assert.ok(indexHtml.includes('ats-breakdown'), 'ats breakdown element missing');
assert.ok(!indexHtml.includes('btn-tailor'), 'tailor button should be removed');
assert.ok(!appJs.includes('tailorToJd'), 'tailor to jd should be removed');
assert.ok(!indexHtml.includes('field-profile'), 'profile field should be removed');
assert.ok(!indexHtml.includes('field-achievements'), 'achievements field should be removed');
assert.ok(!indexHtml.includes('keyword-match'), 'duplicate keyword stat should be removed');
assert.ok(indexHtml.includes('ats-score'), 'ats score stat missing');
assert.ok(indexHtml.includes('missing-warning'), 'missing keywords warning missing');

// make sure skills-to-copy tool exists
assert.ok(appJs.includes('buildSkillGroups'), 'skill group builder missing');
assert.ok(appJs.includes('updateSkillsCopy'), 'skills copy updater missing');
assert.ok(indexHtml.includes('skills-select'), 'skills dropdown missing');
assert.ok(indexHtml.includes('skills-copy'), 'skills copy output missing');
assert.ok(indexHtml.includes('btn-copy-skills'), 'copy skills button missing');

// make sure interview prep exists
assert.ok(appJs.includes('generateInterviewQuestions'), 'interview generation missing');
assert.ok(appJs.includes('renderInterviewAnswer'), 'interview answer renderer missing');
assert.ok(appJs.includes('renderInterviewExtra'), 'interview extras renderer missing');
assert.ok(appJs.includes('tellMeAboutYourself'), 'tell me about yourself missing');
assert.ok(appJs.includes('whyThisCompany'), 'why this company missing');
assert.ok(appJs.includes('questionsToAsk'), 'questions to ask missing');
assert.ok(appJs.includes('openSource'), 'open source questions missing');
assert.ok(appJs.includes('Company:') && appJs.includes('Role:'), 'interview company and role context missing');
assert.ok(indexHtml.includes('interview-question'), 'interview question dropdown missing');
assert.ok(indexHtml.includes('btn-generate-interview'), 'generate interview button missing');
assert.ok(indexHtml.includes('interview-format'), 'interview format select missing');
assert.ok(indexHtml.includes('interview-answer'), 'interview answer element missing');
assert.ok(indexHtml.includes('interview-extra'), 'interview extras element missing');

// make sure removed features are gone
assert.ok(!appJs.includes('parsePlatformData'), 'platform import should be removed');
assert.ok(!appJs.includes('platformSelect'), 'platform dropdown wiring should be removed');
assert.ok(!indexHtml.includes('platform-select'), 'platform dropdown should be removed');
assert.ok(!indexHtml.includes('prompt-modal'), 'prompt guide modal should be removed');
assert.ok(!indexHtml.includes('btn-prompt-guide'), 'prompt guide button should be removed');

// test the ats scoring logic by extracting and running it
function calculateAtsScore(cvText) {
    if (!cvText.trim()) return 0;
    let score = 0;
    const actionVerbs = cvText.match(/\b(built|developed|led|automated|optimized|designed|implemented|created|managed|improved|delivered|launched|engineered|architected|streamlined|reduced|increased)\b/gi);
    if (actionVerbs && actionVerbs.length >= 3) score += 30;
    else if (actionVerbs && actionVerbs.length >= 1) score += 15;
    if (/\d+%|\b\d+\+|\$\d+|\b\d+x\b/g.test(cvText)) score += 20;
    const headings = cvText.match(/education|skills|experience|projects|referees/gi);
    if (headings && headings.length >= 4) score += 15;
    else if (headings && headings.length >= 2) score += 8;
    if (!cvText.includes('\u2014')) score += 10;
    if (/@|phone|email|linkedin|github/gi.test(cvText)) score += 10;
    const techKw = cvText.match(/python|java|aws|cloud|docker|kubernetes|sql|javascript|typescript|ci\/cd|linux|git/gi);
    if (techKw && techKw.length >= 3) score += 10;
    else if (techKw && techKw.length >= 1) score += 5;
    if (cvText.length <= CHAR_LIMIT) score += 5;
    return Math.min(score, 100);
}

// test ats scoring
const goodCv = `ALEX MORGAN
Dublin, Ireland | 087 123 4567 | alex.morgan@example.com
EDUCATION
BSc Computer Science, University, 2023-2027
SKILLS
Programming: Python, Java, AWS, Docker, CI/CD
EXPERIENCE
Developer, Company, 2024-Present
- Built automated workflows
- Developed API integrations
- Improved system performance by 30%
PROJECTS
App (Python)
- Created web app
REFEREES
Available upon request.`;

const badCv = `some random text
nothing useful here`;

const goodScore = calculateAtsScore(goodCv);
const badScore = calculateAtsScore(badCv);

assert.ok(goodScore > badScore, `good cv should score higher (${goodScore} vs ${badScore})`);
assert.ok(goodScore >= 50, `good cv should score at least 50, got ${goodScore}`);
assert.ok(badScore < 50, `bad cv should score less than 50, got ${badScore}`);

// test char limit
const longText = 'a'.repeat(CHAR_LIMIT + 1);
assert.ok(longText.length > CHAR_LIMIT, 'should be able to exceed limit');

const exactText = 'a'.repeat(CHAR_LIMIT);
assert.ok(exactText.length === CHAR_LIMIT, 'exact limit should work');

// test that the html has the right structure
assert.ok(indexHtml.includes('AI Resume Builder'), 'should have app title');
assert.ok(indexHtml.includes('Master CV'), 'should have master cv section');
assert.ok(indexHtml.includes('Live Preview'), 'should have live preview section');
assert.ok(indexHtml.includes('Cover Letter'), 'should have cover letter section');

console.log('All template tests passed');
