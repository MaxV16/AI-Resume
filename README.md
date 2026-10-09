# AI Resume Builder

A dark-mode, single-page web app that uses the DeepSeek API to parse your master CV, auto-fill a strict template, and generate an ATS-optimized CV and cover letter. Export both as PDF.

## Features

- Master CV box: paste your full resume, AI parses it into structured fields
- DeepSeek API integration: bring your own key, stored only in your browser
- Strict template format: contact, education, skills, experience, projects (no profile, no referees)
- Live preview with job description keywords shown in bold
- Character counter (hard limit: 2,851 characters) and one-page A4 layout with a compact 10pt style, plus a page fit warning
- Single Match score with an expandable breakdown (keyword match, skills proven in context, job title match, quantified impact, action verbs, structure and contact)
- Missing keyword warnings: shows job description terms not yet in your CV
- Auto-tailoring: Parse &amp; Auto-Fill rewrites the CV around the job description and its key terms, keeping every section full, running up to three AI correction passes and then automatically adding any remaining grounded keywords the master CV supports, targeting roughly 90 percent keyword coverage
- Technical Skills as 4 to 5 bullet lines of technologies and tools (no sentences), and Soft Skills as 3 short keyword-rich sentences
- Every role in the experience section always keeps at least one bullet, even when it is only partly relevant
- Experience as the centrepiece: roles are ranked by relevance, every role is kept (the most relevant with 4 to 6 evidence-first ACTION + METHOD + OUTCOME bullets, other roles 2 to 3, and a partly relevant role a compact 1 to 2 bullet entry)
- Evidence-first bullets: each bullet states what the work does, detects or prevents, the method or tooling, and the outcome, without restating the same claim twice
- Must-have prioritisation: the job title, requirements and first responsibilities are mirrored exactly where truthful, and the strongest matching evidence is surfaced first
- Truthful tailoring: the AI never adds technologies, metrics or responsibilities the master CV does not support, and never pads skills with generic or duplicated phrases
- Education keeps the expected graduation date visible for students and recent graduates
- Projects: the single most relevant project from your master CV, with 1 to 2 short bullets
- LinkedIn and GitHub links in the exported CV header are clickable hyperlinks
- Skills for Applications: dropdown of real skills (no sentences) to copy straight into an ATS or careers site
- Interview Prep: generates "tell me about yourself", "why this company", role-specific STAR answers, questions to ask the interviewer, and open source talking points where relevant
- AI cover letter: generated automatically after Parse &amp; Auto-Fill, naming the company and role, with a **Regenerate Cover Letter** button
- AI Assistant chat: talk to the AI in plain English and it answers questions, edits the CV fields directly, rewrites the cover letter, adds missing keywords, and generates interview questions, all with visibility of your CV, job description and ATS score
- Export CV and cover letter as PDF
- Dark mode only
- No em dashes anywhere

## Quick Start

### Option 1: Docker

Pull the prebuilt image from Docker Hub:

```bash
docker run -p 8080:80 mk758/ai-resume-builder:latest
```

Or build it yourself:

```bash
docker build -t ai-resume-builder .
docker run -p 8080:80 ai-resume-builder
```

Then open http://localhost:8080

### Option 2: Homebrew (macOS)

```bash
brew tap your-username/ai-resume
brew install ai-resume-builder
ai-resume-builder
```

### Option 3: Install Script

macOS / Linux:

```bash
chmod +x scripts/install-macos.sh
sudo scripts/install-macos.sh
ai-resume-builder
```

Windows (PowerShell as admin):

```powershell
powershell -ExecutionPolicy Bypass -File scripts/install-windows.ps1
ai-resume-builder
```

### Option 4: Just open the file

Open `index.html` in any modern browser. No build step, no server needed.

## Usage

1. Click **Connect DeepSeek API** and enter your DeepSeek API key. The key is stored in your browser's local storage and never sent anywhere except DeepSeek.

2. Paste your full CV into the **Master CV** box.

3. Optionally paste a job description for better tailoring.

4. Click **Parse & Auto-Fill**. The AI extracts your details and fills in all template fields.

5. Edit any field. The preview, character count, keyword match, and Match score update live. Job description keywords appear in bold in the preview.

6. Watch the character counter. If you exceed 2,851 characters, you will get a warning. If the CV will not fit on one A4 page, you will get a page warning.

7. Check the **Match** score and the expandable breakdown to see how well your CV matches common ATS criteria. Missing keywords the master CV genuinely supports are added automatically; only terms it truly cannot support are listed.

8. A tailored cover letter is generated automatically after Parse &amp; Auto-Fill, naming the company and role. Click **Regenerate Cover Letter** to rewrite it.

9. Open **Skills for Applications**, pick a group, and copy the skills to paste into an ATS or careers site form.

10. Open **Interview Prep**, choose bullet points or a paragraph, and click **Generate Questions** for "tell me about yourself", "why this company", role-specific questions with STAR answers, questions to ask the interviewer, and open source talking points.

11. Use the **AI Assistant** box at the bottom to ask questions or request changes in plain English (for example "tighten my experience bullets" or "rewrite my cover letter for this company"). It can see your CV, job description, cover letter, ATS breakdown and interview data, and edits the CV fields directly.

12. Click **Export CV as PDF** or **Export Cover Letter as PDF** to save.

## ATS Match Score

There is a single **Match** score, with a breakdown you can expand. It is a client-side heuristic modelled on what real ATS systems and recruiters weigh most:

- Keyword Match (30): how many job description terms appear in your CV, weighted so multi-word phrases (like "access management") count for more
- Skills + Experience (20): keywords that are proven in context, not just listed in a skills line
- Job Title Match (15): how closely your CV reflects the target job title
- Quantified Impact (15): numbers, percentages and other measurable results in your experience
- Action Verbs (10): strong verbs like built, automated, led
- Structure & Contact (10): standard headings plus completed email, phone and location

Practical targets: 75 percent or higher coverage of the job description is strong and tends to reach a human reviewer. No score guarantees passage through any specific system.

Keywords are extracted from the job description with navigation and boilerplate stripped out, and phrases are only formed within a sentence so you do not get junk terms. Missing terms the master CV supports are woven in automatically; only genuinely unsupported terms are listed under the preview.

The AI also tailors automatically: when a job description is present, **Parse & Auto-Fill** reads it directly, weaves its exact keywords into your skills and bullets, keeps PROFESSIONAL EXPERIENCE the centrepiece, aims close to the full 2,851 character budget, and runs up to three correction passes and then auto-adds any remaining grounded keywords, until roughly 90 percent of the key terms are present. It never invents experience, and if the role is unrelated to your master CV the coverage will naturally be lower.

## Template Format

The app enforces this exact structure:

```
# FULL NAME
Phone | Email
Location
LinkedIn: url | GitHub: url

## EDUCATION
Degree, Institution
Years, Location
- Grade: ...
- Relevant Modules: ...

## SKILLS
Technical Skills
- Cloud & DevOps: AWS, Docker, Kubernetes
- Networking: TCP/IP, DNS, VPNs
- Programming: Python, Java, TypeScript
- Systems & Monitoring: Linux, Windows
- Security & Forensics: Incident Response, IAM

Soft Skills
- Strong communication skills built through cross-team collaboration.
- Analytical problem solving applied to live incidents.

## PROFESSIONAL EXPERIENCE
Job Title, Company
Dates, Location
- Bullet 1
- Bullet 2
- Bullet 3
- Bullet 4

## PROJECTS
Most relevant Project Name (Tech Stack)
- One short sentence on what it does and its outcome
- One short sentence on the key feature or impact
```

## API Key Security

- Your DeepSeek API key is stored only in your browser's `localStorage`
- It is never hardcoded in the source code
- It is never logged or sent to any server other than DeepSeek
- The `.gitignore` excludes `.env`, `*.key`, and other secret files
- The Docker image contains no keys

## Running Tests

```bash
bash tests/run-tests.sh
```

Tests check for:
- No hardcoded API keys
- Correct template structure
- Character limit enforcement
- ATS scoring logic
- AI cover letter generation
- No em dashes in source

## Docker Hub

Pull the prebuilt image:

```bash
docker run -p 8080:80 mk758/ai-resume-builder:latest
```

To push your own image:

```bash
docker build -t yourusername/ai-resume-builder:latest .
docker push yourusername/ai-resume-builder:latest
```

## Uninstall

macOS / Linux:

```bash
sudo scripts/uninstall-macos.sh
```

Windows (PowerShell as admin):

```powershell
powershell -ExecutionPolicy Bypass -File scripts/uninstall-windows.ps1
```

## License

Apache 2.0. See LICENSE file.
