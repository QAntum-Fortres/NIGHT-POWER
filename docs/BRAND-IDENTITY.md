# 🎨 QAntum Brand Identity Guidelines

> **Generated**: December 31, 2025  
> **Author**: DIMITAR PRODROMOV  
> **Purpose**: Consistent brand presentation across all channels

---

## 🏷️ Brand Overview

### Brand Name
**QAntum** (with capital Q and A)

- ✅ Correct: QAntum, QANTUM
- ❌ Wrong: Qantum, quantum, Quantum, QA-ntum

### Brand Etymology
**QA** (Quality Assurance) + **Quantum** (revolutionary, next-level)
> "Quality Assurance at the quantum level - infinitely precise, impossibly fast"

### Tagline Options
1. **Primary**: "Test. Secure. Dominate." 
2. **Developer-focused**: "Tests that fix themselves"
3. **Enterprise**: "Unified Security & QA Platform"
4. **Ghost Mode**: "See everything. Be unseen."

---

## 🎨 Color Palette

### Primary Colors

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| **QAntum Blue** | `#2563EB` | 37, 99, 235 | Primary brand color, CTAs |
| **QAntum Dark** | `#1E293B` | 30, 41, 59 | Text, backgrounds |
| **QAntum White** | `#F8FAFC` | 248, 250, 252 | Backgrounds, text |

### Secondary Colors

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| **Success Green** | `#22C55E` | 34, 197, 94 | Success states, passed tests |
| **Warning Amber** | `#F59E0B` | 245, 158, 11 | Warnings, pending |
| **Error Red** | `#EF4444` | 239, 68, 68 | Errors, failed tests |
| **Ghost Purple** | `#8B5CF6` | 139, 92, 246 | Ghost Mode features |
| **Security Cyan** | `#06B6D4` | 6, 182, 212 | Security features |

### Gradient
```css
/* QAntum Signature Gradient */
background: linear-gradient(135deg, #2563EB 0%, #8B5CF6 100%);
```

---

## 🔤 Typography

### Primary Font: Inter
- **Headers**: Inter Bold (700)
- **Body**: Inter Regular (400)
- **Code**: JetBrains Mono

### Font Sizes
```css
/* Headings */
h1: 3rem (48px)    /* Hero headlines */
h2: 2.25rem (36px) /* Section headers */
h3: 1.5rem (24px)  /* Subsections */
h4: 1.25rem (20px) /* Card headers */

/* Body */
body: 1rem (16px)  /* Default text */
small: 0.875rem (14px) /* Captions */

/* Code */
code: 0.875rem (14px) /* Monospace */
```

### Text Styles
```css
/* Headlines */
font-family: 'Inter', sans-serif;
font-weight: 700;
letter-spacing: -0.02em;

/* Body */
font-family: 'Inter', sans-serif;
font-weight: 400;
line-height: 1.6;

/* Code */
font-family: 'JetBrains Mono', monospace;
font-weight: 400;
```

---

## 🖼️ Logo Usage

### Primary Logo
```
     ____    _              _                   
    / __ \  / \   _ __  | |_ _   _ _ __ ___  
   | |  | |/ _ \ | '_ \ | __| | | | '_ ` _ \ 
   | |__| / ___ \| | | || |_| |_| | | | | | |
    \___\_\_/   \_\_| |_| \__|\__,_|_| |_| |_|
```

### Logo Variations
1. **Full Logo**: QAntum + Icon
2. **Wordmark**: QAntum text only
3. **Icon**: Q symbol only (for favicons, apps)
4. **Monochrome**: Single color version

### Clear Space
- Minimum clear space: 1x logo height on all sides
- Never place logo on busy backgrounds
- Never stretch, rotate, or modify

### Minimum Sizes
- **Print**: 25mm width minimum
- **Digital**: 100px width minimum
- **Favicon**: 32x32px

---

## 🎭 Brand Voice & Tone

### Voice Characteristics

| Attribute | Description | Example |
|-----------|-------------|---------|
| **Confident** | We know our product is great | "QAntum doesn't just test. It dominates." |
| **Technical** | We speak developer language | "Zero-config TypeScript setup in 2 minutes" |
| **Direct** | No fluff, get to the point | "Your tests are flaky. We fix that." |
| **Honest** | Never overpromise | "AI helps, but you still need good tests" |

### Tone by Context

| Context | Tone | Example |
|---------|------|---------|
| Marketing | Bold, confident | "Selenium is history. QAntum is the future." |
| Documentation | Clear, helpful | "To install QAntum, run: npx qantum init" |
| Error Messages | Friendly, solution-oriented | "Test failed. Here's how to fix it:" |
| Social Media | Casual, witty | "POV: You just discovered AI self-healing tests 🤯" |

### Words to Use
- ✅ Powerful, Fast, Secure, Intelligent, Automated
- ✅ Enterprise-grade, Battle-tested, Zero-config
- ✅ Unified, Streamlined, Effortless

### Words to Avoid
- ❌ Simple (implies lack of power)
- ❌ Cheap (use "affordable" or "fair pricing")
- ❌ Best (subjective, unprovable)
- ❌ Revolutionary (overused)

---

## 📝 Writing Guidelines

### Headlines
- Use sentence case (not Title Case)
- Keep under 10 words
- Lead with benefit, not feature
- Use power verbs

**Good:**
> "Ship 10x faster with AI-powered tests"

**Bad:**
> "Our Revolutionary Testing Platform Uses Advanced AI Technology"

### Body Copy
- Short paragraphs (3-4 sentences max)
- Use bullet points for lists
- Include code examples when relevant
- Write for scanning, not reading

### CTAs
- Action-oriented verbs
- Create urgency without being pushy
- Be specific about what happens

**Good:**
> "Start free trial" | "See demo" | "Get QAntum"

**Bad:**
> "Submit" | "Click here" | "Learn more"

---

## 🖥️ UI Components

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: #2563EB;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  border: 2px solid #2563EB;
  color: #2563EB;
}

/* Ghost Mode Button */
.btn-ghost {
  background: linear-gradient(135deg, #2563EB, #8B5CF6);
  color: white;
}
```

### Cards

```css
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 24px;
}
```

### Code Blocks

```css
.code-block {
  background: #1E293B;
  color: #F8FAFC;
  border-radius: 8px;
  padding: 16px;
  font-family: 'JetBrains Mono', monospace;
}
```

---

## 📱 Social Media Guidelines

### Profile Images
- Use QAntum icon (Q symbol)
- Blue background (#2563EB)
- Consistent across all platforms

### Cover Images
- Feature tagline: "Test. Secure. Dominate."
- Include website URL
- Use QAntum gradient background

### Post Templates

**Product Update:**
> 🚀 New in QAntum v2.0:
> 
> ✅ Feature 1
> ✅ Feature 2  
> ✅ Feature 3
> 
> Try it now → [link]

**Tip/Tutorial:**
> 💡 QAntum Pro Tip:
> 
> [Code snippet or tip]
> 
> #QAntum #TestAutomation #DevTools

**Engagement:**
> 🤔 What's your biggest testing pain point?
> 
> A) Flaky tests
> B) Slow CI/CD
> C) Security testing
> D) Test maintenance

### Hashtags
- Primary: #QAntum
- Secondary: #TestAutomation #QA #DevTools #Security
- Contextual: #TypeScript #Playwright #AI #Automation

---

## 📧 Email Templates

### Subject Line Formula
- [Benefit] + [Curiosity] + [Urgency optional]

**Examples:**
> - "Your tests are about to get 10x faster"
> - "QAntum v2.0 is here (with Ghost Mode 👻)"
> - "Stop fighting flaky tests"

### Email Signature
```
---
[Name]
[Title] @ QAntum

🌐 qantum.dev
📧 hello@qantum.dev
🐦 @qantum_dev

Test. Secure. Dominate.
```

---

## 🎯 Brand Applications

### Website
- Clean, modern design
- Dark mode by default (developers love it)
- Interactive code examples
- Fast loading (<2s)

### Documentation
- Dark theme option
- Copy-paste code blocks
- Search functionality
- Version switcher

### Presentations
- QAntum template with gradient headers
- Minimal text, maximum visuals
- Live demos when possible
- Dark background slides

### Merchandise
- T-shirts: Black with QAntum logo
- Stickers: Die-cut Q icon
- Hoodies: "Test. Secure. Dominate." on back

---

## ✅ Brand Checklist

Before publishing any content:

- [ ] Uses correct brand name spelling (QAntum)
- [ ] Colors match brand palette
- [ ] Typography follows guidelines
- [ ] Voice is confident but not arrogant
- [ ] Includes clear CTA
- [ ] Mobile-responsive
- [ ] Proofread for errors

---

## 📦 Brand Assets

Download brand assets:
- `/assets/logos/` - All logo variations
- `/assets/colors/` - Color swatches
- `/assets/fonts/` - Font files
- `/assets/templates/` - Presentation templates
- `/assets/social/` - Social media templates

---

*Brand guidelines maintained by QAntum Marketing*  
*Last updated: December 31, 2025*  
*Contact: brand@qantum.dev*
