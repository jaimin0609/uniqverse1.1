# UselfUnik Brand Guidelines
## "Be Uniquely You."

### 🎯 Brand Identity

**Brand Name**: UselfUnik  
**Tagline**: "Be Uniquely You."  
**Domain**: uselfunik.com  
**Mission**: Empowering individuals to express their unique style through personalized e-commerce experiences.

### 🎨 Brand Colors

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| **Primary Purple** | `#6C5CE7` | 108,92,231 | Main logo gradient, buttons |
| **Light Purple** | `#A29BFE` | 162,155,254 | Hover states, secondary elements |
| **Sunshine Yellow** | `#FFD43B` | 255,212,59 | Spark accent, sale tags, highlights |
| **Dark Gray** | `#2D3436` | 45,52,54 | Body text, logo text |
| **White** | `#FFFFFF` | 255,255,255 | Backgrounds, reversed logo |

### 🔤 Typography

| Role | Font | Weight | Example |
|------|------|--------|---------|
| **Headings / Logo** | Montserrat | 700 (Bold) | uselfunik |
| **Sub-headings** | Poppins | 600 (SemiBold) | "Top Rated Products" |
| **Body Text** | Inter | 400 (Regular) | Paragraphs, descriptions |

**Google Fonts Import**:
```html
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700&family=Poppins:wght@600&family=Inter&display=swap" rel="stylesheet">
```

### 🖼️ Logo Assets

#### Primary Logo
- **File**: `uselfunik-logo.svg`
- **Usage**: Hero banners, homepage headers
- **Colors**: Full gradient version
- **Minimum size**: 150px width

#### Icon Only
- **File**: `uselfunik-icon.svg`
- **Usage**: Favicon, app icons, social avatars
- **Size**: 64x64px (scalable)

#### Monochrome Versions
- **Black**: `uselfunik-mono-black.svg` (for light backgrounds)
- **White**: `uselfunik-mono-white.svg` (for dark backgrounds)

### 📏 Logo Usage Guidelines

#### ✅ Do:
- Maintain clear space around logo (minimum 1/2 logo height)
- Use on high contrast backgrounds
- Keep proportions intact when scaling
- Use appropriate version for background color

#### ❌ Don't:
- Stretch or distort the logo
- Use on busy or low-contrast backgrounds
- Recreate or modify the logo elements
- Use outdated versions (Uniqverse branding)

### 🎭 Brand Personality

**Brand Attributes**:
- **Personal**: "u" = you, individual focus
- **Unique**: "uni" = one-of-a-kind experiences  
- **Fun**: "k" = kick, energy, youth
- **Premium**: High-quality, curated products
- **Approachable**: Friendly, accessible design

**Voice & Tone**:
- Conversational yet professional
- Encouraging and empowering
- Authentic and genuine
- Inclusive and diverse

### 💻 Implementation

#### CSS Variables
```css
:root {
  --purple: #6C5CE7;
  --light-purple: #A29BFE;
  --yellow: #FFD43B;
  --dark: #2D3436;
  --white: #FFFFFF;
}

.btn-primary { 
  background: var(--purple); 
  color: var(--white);
}

.btn-primary:hover { 
  background: var(--light-purple); 
}

.accent { 
  color: var(--yellow); 
}
```

#### Logo Implementation
```jsx
// Primary logo
<img src="/uselfunik-logo.svg" alt="UselfUnik - Be Uniquely You" className="h-12" />

// Icon only
<img src="/uselfunik-icon.svg" alt="UselfUnik" className="h-8 w-8" />

// Dark background
<img src="/uselfunik-mono-white.svg" alt="UselfUnik" className="h-12" />
```

### 🔄 Migration from Uniqverse

#### Text Replacements:
- `Uniqverse` → `UselfUnik`
- `uniqverse` → `uselfunik`
- "Unique Universe" → "Be Uniquely You"

#### File Replacements:
- Replace all logo references
- Update favicon links
- Update manifest.json
- Update meta tags and titles

### 📱 Social Media Specifications

| Platform | Size | File |
|----------|------|------|
| **Instagram Profile** | 1080x1080px | Square crop of primary logo |
| **Facebook Cover** | 1200x630px | Full logo with tagline |
| **Twitter Header** | 1500x500px | Horizontal layout |
| **LinkedIn** | 1200x627px | Professional layout |

### 🚀 Launch Checklist

- [ ] Update all logo files in `/public/`
- [ ] Replace favicon.svg
- [ ] Update manifest.json
- [ ] Replace brand name in all components
- [ ] Update CSS color variables
- [ ] Update meta tags and page titles
- [ ] Update Google Fonts import
- [ ] Test all logo variants
- [ ] Update social media profiles
- [ ] Update domain (if applicable)

---

**Brand Guidelines Version**: 1.0  
**Last Updated**: November 8, 2025  
**Contact**: Brand Team - UselfUnik