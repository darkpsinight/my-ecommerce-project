# Nano Banana Skill — Placeholder Image Generator

## Skill Name
**Nano Banana — Placeholder Image Generator**

---

## Purpose
Generate clean, realistic placeholder images for **frontend UI, landing pages, dashboards, and marketing layouts** using **Nano Banana Pro (Gemini Image Preview)**.

This skill is optimized for **design realism**, not artistic creativity, so generated images can be dropped directly into real product layouts during development.

---

## When to Use
Use this skill when:

- Designing frontend layouts before final assets exist
- Building SaaS landing pages
- Creating dashboards and admin panels
- Prototyping marketing sections
- Replacing empty image blocks during UI/UX work
- Creating visually consistent mockups for reviews or demos

---

## Output Goals
Generated images must:

- Look realistic and production-ready
- Match modern SaaS and web UI aesthetics
- Avoid text, logos, and branding
- Fit common layout sections without manual editing
- Be suitable for temporary frontend usage

---

## Prompt Construction Rules
Every prompt **must include**:

1. UI context (where the image will be used)
2. Subject description
3. Visual style
4. Composition / framing
5. Explicit placeholder intent
6. Clear constraints

---

## Standard Prompt Template

Create a realistic placeholder image for a WEBSITE FRONTEND.

Context:
<hero section | landing page | dashboard | pricing section | testimonial card | feature block>

Subject:
<what the image visually represents>

Style:
<modern SaaS | minimal | clean | bold | dark UI | light UI>

Composition:
<wide hero | centered object | background | abstract | card image>

Constraints:

No text

No logos

No branding

Neutral, professional appearance

Designed to fit a real product website

Purpose:
This image is a temporary placeholder for frontend design.


---

## Preset Prompt Examples

### 1. Landing Page Hero Image
Create a realistic placeholder image for a WEBSITE FRONTEND.

Context:
Landing page hero section

Subject:
Abstract illustration suggesting technology and trust

Style:
Modern SaaS, clean, light background

Composition:
Wide hero image with soft gradients and subtle depth

Constraints:

No text

No logos

No branding

Neutral, professional appearance

Purpose:
This image is a temporary placeholder for frontend design.


---

### 2. Dashboard Preview Image
Create a realistic placeholder image for a WEBSITE FRONTEND.

Context:
Product dashboard preview section

Subject:
Generic web application dashboard with charts and cards

Style:
Modern admin UI, minimal, light mode

Composition:
Straight-on dashboard screenshot style

Constraints:

No readable text

No logos

No real company names

Neutral UI colors

Purpose:
This image is a temporary placeholder for frontend design.


---

### 3. Feature Card Image
Create a realistic placeholder image for a WEBSITE FRONTEND.

Context:
Feature block image

Subject:
Abstract visual representing speed and automation

Style:
Minimal, modern, soft gradients

Composition:
Centered abstract object suitable for card layout

Constraints:

No text

No logos

No branding

Purpose:
This image is a temporary placeholder for frontend design.


---

### 4. Testimonial Avatar Image
Create a realistic placeholder image for a WEBSITE FRONTEND.

Context:
Testimonial card avatar

Subject:
Professional person portrait, neutral expression

Style:
Clean, corporate, friendly

Composition:
Centered head-and-shoulders portrait

Constraints:

No famous people

No logos

Neutral background

Purpose:
This image is a temporary placeholder for frontend design.


---

## Technical Configuration (Nano Banana Pro)

- Model: `gemini-3-pro-image-preview`
- Response Modalities: `IMAGE`, `TEXT`
- Image Size: `1K`
- External branding disabled by prompt constraints
- Output suitable for direct frontend insertion

---

## API Request Template (REST)

```bash
#!/bin/bash
set -e -E

GEMINI_API_KEY="$GEMINI_API_KEY"
MODEL_ID="gemini-3-pro-image-preview"
GENERATE_CONTENT_API="streamGenerateContent"

cat << EOF > request.json
{
    "contents": [
      {
        "role": "user",
        "parts": [
          {
            "text": "INSERT_INPUT_HERE"
          },
        ]
      },
    ],
    "generationConfig": {
      "responseModalities": ["IMAGE", "TEXT", ],
      "imageConfig": {
        "image_size": "1K"
      },
    },
    "tools": [
      {
        "googleSearch": {
        }
      },
    ],
}
EOF

curl \
-X POST \
-H "Content-Type: application/json" \
"https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:${GENERATE_CONTENT_API}?key=${GEMINI_API_KEY}" -d '@request.json'
