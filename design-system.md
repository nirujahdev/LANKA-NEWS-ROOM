# Lanka News Room - Design System

## Brand Identity

### Logo
- **Icon**: 📁 Folder emoji-style icon
- **Color**: Blue (#2563EB / blue-600)
- **Effect**: Soft glow (box-shadow with blue tint)
- **Meaning**: Organized information, verified briefs, newsroom clarity

### Color Palette

#### Primary Colors
- **Primary Blue**: `#2563EB`
  - Used for: Logo, primary buttons, links, active states
- **Accent Blue**: `#3B82F6`
  - Used for: Hover states, secondary accents
- **Blue Glow**: `rgba(37, 99, 235, 0.3)` (Primary Blue with 30% opacity)
  - Used for: Logo glow effect, subtle highlights

#### Neutral Colors
- **Background White**: `#FFFFFF`
- **Dark Text**: `#0F172A` (slate-900)
- **Text Gray**: `#64748B` (slate-500)
- **Card Ash**: `#F1F5F9` (slate-100)
- **Border Gray**: `#E5E7EB` (gray-200)
- **Hover Background**: `#E2E8F0` (slate-200)

#### Semantic Colors
- **No red, yellow, or aggressive colors**
- **Calm, trustworthy palette only**

## Typography

### Font Family
- **Primary**: Montserrat
- **Fallback**: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif

### Font Weights
- **Normal Text**: Montserrat Medium (500)
- **Headlines/Titles**: Montserrat Bold (700)

### Font Sizes
- **Logo Text**: 1.5rem (24px)
- **H1 (Page Title)**: 2rem (32px) / 1.75rem (28px) mobile
- **H2 (Card Headline)**: 1.25rem (20px) / 1.125rem (18px) mobile
- **Body**: 1rem (16px) / 0.9375rem (15px) mobile
- **Small Text**: 0.875rem (14px)
- **Meta Text**: 0.75rem (12px)

### Line Heights
- **Headlines**: 1.3
- **Body**: 1.6
- **Dense Text**: 1.4

### Multilingual Support
- Optimized for Sinhala, Tamil, and English
- Proper Unicode rendering
- Adequate character spacing

## Spacing System

### Base Unit: 4px

- **xs**: 0.25rem (4px)
- **sm**: 0.5rem (8px)
- **md**: 1rem (16px)
- **lg**: 1.5rem (24px)
- **xl**: 2rem (32px)
- **2xl**: 3rem (48px)
- **3xl**: 4rem (64px)

### Component Spacing
- **Card Padding**: 1.5rem (24px)
- **Card Gap**: 1rem (16px)
- **Section Margin**: 2rem (32px)
- **Container Padding**: 1rem (16px) mobile, 2rem (32px) desktop

## Layout

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Container Max Width
- **Desktop**: 1280px
- **Tablet**: 768px
- **Mobile**: 100% (with padding)

### Grid System
- **Desktop**: 12-column grid
- **Tablet**: 8-column grid
- **Mobile**: Single column

## Components

### Buttons
- **Style**: Glassmorphism
- **Properties**:
  - Backdrop blur: 10px
  - Background: rgba(255, 255, 255, 0.7)
  - Border: 1px solid rgba(255, 255, 255, 0.3)
  - Border radius: 0.5rem (8px)
  - Padding: 0.75rem 1.5rem
- **Hover**: Slight opacity increase, smooth transition
- **No harsh shadows**

### Cards
- **Background**: Light ash (#F9FAFB)
- **Border**: Subtle (#E5E7EB)
- **Border Radius**: 0.75rem (12px)
- **Padding**: 1.5rem
- **Shadow**: None (flat design)
- **Hover**: Slight background darkening

### Navigation
- **Height**: 64px desktop, 56px mobile
- **Background**: White
- **Border Bottom**: 1px solid #E5E7EB
- **Sticky**: Yes

## Visual Hierarchy

### Reading Patterns
- **F-pattern**: Left-aligned content
- **Z-pattern**: Logo → Search → Content

### Priority Order
1. Headline (largest, boldest)
2. Summary (medium weight, readable)
3. Sources (smaller, secondary color)
4. Time (smallest, muted)

## Design Principles

1. **Calm & Trustworthy**: No aggressive colors or animations
2. **Information-First**: Content over decoration
3. **Minimalist**: Clean, uncluttered
4. **Professional**: Serious newsroom tone
5. **Accessible**: High contrast, readable fonts
6. **Mobile-First**: Optimized for small screens

## Animations

- **Duration**: 200-300ms
- **Easing**: ease-in-out
- **Properties**: opacity, transform, background-color
- **No flashy effects**: Subtle transitions only

## Accessibility

- **Contrast Ratio**: Minimum 4.5:1 for text
- **Focus States**: Clear, visible outlines
- **Touch Targets**: Minimum 44x44px
- **Keyboard Navigation**: Full support

