# Lanka News Room - UI Design Specification

## Overview
This document provides a complete specification for the Lanka News Room UI design, inspired by Google News but with a unique editorial style tailored for Sri Lankan users.

## Design Philosophy

### Core Principles
1. **Calm & Trustworthy**: No aggressive colors, animations, or flashy effects
2. **Information-First**: Content takes priority over decoration
3. **Minimalist**: Clean, uncluttered interface
4. **Professional**: Serious newsroom aesthetic
5. **Accessible**: High contrast, readable fonts, keyboard navigation
6. **Mobile-First**: Optimized for small screens and touch interaction

## Brand Identity

### Logo
- **Icon**: Blue folder emoji-style icon (📁)
- **Color**: `#2563EB` (blue-600)
- **Glow Effect**: Soft blue glow using `box-shadow: 0 0 8px rgba(37, 99, 235, 0.4)`
- **Meaning**: Organized information, verified briefs, newsroom clarity
- **Implementation**: SVG with filter effects for glow

### Color Palette

#### Primary Colors
- **Primary Blue**: `#2563EB`
  - Usage: Logo, primary buttons, active states, links
- **Blue Glow**: `rgba(37, 99, 235, 0.3)`
  - Usage: Logo glow, subtle highlights

#### Neutral Colors
- **Background White**: `#FFFFFF`
- **Text Primary**: `#111827` (gray-900)
- **Text Secondary**: `#6B7280` (gray-500)
- **Card Background**: `#F9FAFB` (gray-50)
- **Border**: `#E5E7EB` (gray-200)
- **Hover Background**: `#F3F4F6` (gray-100)

#### Color Restrictions
- **No red, yellow, or aggressive colors**
- **Calm, trustworthy palette only**

## Typography

### Font Family
- **Primary**: Montserrat
- **Weights**: 400 (Regular), 500 (Medium), 700 (Bold)
- **Fallback**: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif

### Font Sizes & Hierarchy

#### Desktop
- **Logo Text**: 1.5rem (24px)
- **H1 (Page Title)**: 2rem (32px)
- **H2 (Card Headline)**: 1.25rem (20px)
- **Body**: 1rem (16px)
- **Small Text**: 0.875rem (14px)
- **Meta Text**: 0.75rem (12px)

#### Mobile
- **H1**: 1.75rem (28px)
- **H2**: 1.125rem (18px)
- **Body**: 0.9375rem (15px)

### Line Heights
- **Headlines**: 1.3
- **Body**: 1.6
- **Dense Text**: 1.4

### Multilingual Support
- Optimized for Sinhala (සිං), Tamil (தமிழ்), and English
- Proper Unicode rendering
- Adequate character spacing
- Font feature settings for better rendering

## Layout Structure

### Desktop Layout (>1024px)

```
┌─────────────────────────────────────────────────────────┐
│ Navigation Bar (sticky, 64px height)                    │
│ [Logo] [Search Bar (center)] [Language Switcher]      │
├─────────────────────────────────────────────────────────┤
│ Tab Navigation (sticky, below nav)                     │
│ [Home] [Recent] [Sri Lanka] [Politics] ...               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Main Content Area (max-width: 1280px, centered)        │
│ ┌───────────────────────────────────────────────┐     │
│ │ Page Header                                    │     │
│ ├───────────────────────────────────────────────┤     │
│ │ Incident Card 1                                │     │
│ ├───────────────────────────────────────────────┤     │
│ │ Incident Card 2                                │     │
│ ├───────────────────────────────────────────────┤     │
│ │ Incident Card 3                                │     │
│ └───────────────────────────────────────────────┘     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Mobile Layout (<640px)

```
┌─────────────────────┐
│ Navigation (56px)   │
│ [Logo] [Menu]       │
├─────────────────────┤
│ Tab Nav (scroll)    │
│ [Home][Recent]...   │
├─────────────────────┤
│                     │
│ Incident Card 1    │
│                     │
│ Incident Card 2    │
│                     │
│ Incident Card 3    │
│                     │
└─────────────────────┘
```

## Component Specifications

### Navigation Bar

#### Desktop
- **Height**: 64px
- **Background**: White (`#FFFFFF`)
- **Border**: Bottom border (`#E5E7EB`)
- **Layout**: 
  - Left: Logo + "Lanka News Room" text
  - Center: Search bar (max-width: 640px)
  - Right: Language switcher (EN | සිං | தமிழ்)
- **Sticky**: Yes (stays at top on scroll)

#### Mobile
- **Height**: 56px
- **Layout**:
  - Left: Logo
  - Right: Menu button (hamburger)
- **Search**: Hidden in menu drawer
- **Language Switcher**: In menu drawer

### Search Bar

#### Design
- **Width**: Full width on mobile, max 640px on desktop
- **Height**: 40px
- **Border**: `1px solid #E5E7EB`
- **Border Radius**: 8px
- **Padding**: Left 40px (for icon), Right 16px
- **Placeholder**: "Search for topics, locations & sources"
- **Focus State**: 
  - Border: `2px solid #2563EB`
  - Ring: `0 0 0 3px rgba(37, 99, 235, 0.1)`

### Language Switcher

#### Design
- **Style**: Pill-shaped buttons
- **Background**: `#F9FAFB` (gray-50)
- **Active State**: 
  - Background: White
  - Text: `#2563EB`
  - Shadow: Subtle (`0 1px 2px rgba(0,0,0,0.05)`)
- **Inactive State**: 
  - Text: `#6B7280`
  - Hover: `#111827`

### Tab Navigation

#### Design
- **Height**: 48px
- **Background**: White
- **Border**: Bottom border (`#E5E7EB`)
- **Sticky**: Yes (below main nav)
- **Scroll**: Horizontal scroll on mobile
- **Active Tab**:
  - Border bottom: `2px solid #2563EB`
  - Text: `#2563EB`
- **Inactive Tab**:
  - Text: `#6B7280`
  - Hover: `#111827` with gray border

### Incident Card

#### Structure
```
┌─────────────────────────────────────┐
│ Headline (Bold, 20px)               │
│                                     │
│ Summary (3 lines max, 16px)        │
│ ...                                 │
│                                     │
│ [FileIcon] Reported by X sources    │
│ [ClockIcon] Updated X minutes ago  │
│                          Read more →│
└─────────────────────────────────────┘
```

#### Design Specifications
- **Background**: `#F9FAFB` (gray-50)
- **Border**: `1px solid #E5E7EB`
- **Border Radius**: 12px
- **Padding**: 24px
- **Spacing**: 
  - Gap between cards: 24px (desktop), 16px (mobile)
- **Hover State**:
  - Background: `#F3F4F6` (gray-100)
  - Headline: Changes to `#2563EB`
  - "Read more →" appears
- **Shadow**: None (flat design)

#### Content Hierarchy
1. **Headline** (Priority 1)
   - Font: Montserrat Bold, 20px
   - Color: `#111827`
   - Line clamp: 2 lines
   - Margin bottom: 12px

2. **Summary** (Priority 2)
   - Font: Montserrat Medium, 16px
   - Color: `#374151` (gray-700)
   - Line height: 1.6
   - Line clamp: 3 lines
   - Margin bottom: 16px

3. **Meta Information** (Priority 3)
   - Font: Montserrat Medium, 14px
   - Color: `#6B7280` (gray-500)
   - Icons: 16px, same color

### Incident Detail Page

#### Layout
- **Max Width**: 896px (4xl)
- **Padding**: 32px (desktop), 16px (mobile)
- **Structure**:
  1. Back button
  2. Language switcher (if multilingual available)
  3. Headline (H1)
  4. Meta information (time, source count)
  5. Summary (in gray box)
  6. Sources section

#### Summary Box
- **Background**: `#F9FAFB`
- **Border**: `1px solid #E5E7EB`
- **Border Radius**: 12px
- **Padding**: 24px
- **Text**: 18px, line-height 1.6

#### Sources List
- **Title**: "Sources" (H2, 20px, bold)
- **Description**: Small text explaining multi-source basis
- **Source Items**:
  - Background: `#F9FAFB`
  - Border: `1px solid #E5E7EB`
  - Border Radius: 8px
  - Padding: 16px
  - Hover: Background `#F3F4F6`, border `#93C5FD` (blue-300)
  - External link icon on right

## Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Mobile Optimizations
1. **Touch Targets**: Minimum 44x44px
2. **Font Sizes**: Slightly reduced for readability
3. **Spacing**: Reduced padding/margins
4. **Navigation**: Hamburger menu instead of full nav
5. **Cards**: Full width, stacked vertically
6. **Tabs**: Horizontal scroll

### Tablet Optimizations
1. **Grid**: 2-column layout for cards (optional)
2. **Navigation**: Full nav visible
3. **Search**: Full width search bar

## Interactions & Animations

### Principles
- **Duration**: 200-300ms
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` (ease-in-out)
- **Properties**: opacity, transform, background-color
- **No flashy effects**: Subtle transitions only

### Hover States
- **Cards**: Background color change, headline color change
- **Buttons**: Slight opacity/background change
- **Links**: Color change to blue

### Focus States
- **Outline**: `2px solid #2563EB`
- **Offset**: 2px
- **Required for accessibility**

## Glassmorphism Buttons

### Style
- **Backdrop Filter**: `blur(10px)`
- **Background**: `rgba(255, 255, 255, 0.7)`
- **Border**: `1px solid rgba(255, 255, 255, 0.3)`
- **Border Radius**: 8px
- **Padding**: 12px 24px
- **Hover**: Background `rgba(255, 255, 255, 0.85)`

## Accessibility

### Requirements
1. **Contrast Ratio**: Minimum 4.5:1 for text
2. **Focus States**: Clear, visible outlines
3. **Touch Targets**: Minimum 44x44px
4. **Keyboard Navigation**: Full support
5. **Screen Reader**: Proper ARIA labels
6. **Alt Text**: For all images/icons

### Implementation
- Use semantic HTML
- Proper heading hierarchy (h1 → h2 → h3)
- ARIA labels for icons
- Keyboard navigation support
- Focus visible styles

## Reading Patterns

### F-Pattern
- Left-aligned content
- Important information at top-left
- Scanning-friendly layout

### Z-Pattern
- Logo (top-left)
- Search (top-center)
- Content (main area)

### Visual Priority
1. Headline (largest, boldest)
2. Summary (medium weight, readable)
3. Sources (smaller, secondary color)
4. Time (smallest, muted)

## Implementation Notes

### Technology Stack
- **Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Font**: Montserrat (Google Fonts)

### File Structure
```
app/
  layout.tsx          # Root layout with font
  page.tsx            # Homepage
  globals.css         # Global styles
  incident/
    [id]/
      page.tsx        # Incident detail page
components/
  Logo.tsx            # Logo component
  Navigation.tsx      # Main navigation
  TabNavigation.tsx   # Tab navigation
  IncidentCard.tsx    # News card component
  IncidentDetail.tsx  # Detail page component
```

### CSS Classes
- Use Tailwind utility classes
- Custom utilities in `globals.css`:
  - `.line-clamp-2` / `.line-clamp-3`
  - `.scrollbar-hide`
  - `.glass-button`

## Design Rules (Strict)

### Do's
✅ Flat design
✅ Soft, calm colors
✅ Clear typography hierarchy
✅ Generous white space
✅ Subtle hover effects
✅ Mobile-first approach

### Don'ts
❌ Heavy gradients
❌ Neon glow effects
❌ Social media UI patterns
❌ Clickbait styling
❌ Political symbols
❌ Aggressive colors (red, yellow)
❌ Flashy animations
❌ Heavy shadows

## Target Audience Considerations

### Sri Lankan Users
- **Mobile-heavy**: Optimize for small screens
- **Multilingual**: Support Sinhala, Tamil, English
- **Data-conscious**: Minimize assets, optimize loading
- **Trust-focused**: Professional, serious design

### User Types
- **Students**: Need quick, clear summaries
- **Professionals**: Need trustworthy, neutral news
- **Teachers**: Need reliable sources for lessons
- **General Public**: Need accessible, readable content

## Future Considerations

### Potential Enhancements
- Dark mode support
- Customizable feed preferences
- Saved articles/bookmarks
- Share functionality
- Print-friendly styles

### Scalability
- Design system should support:
  - Additional languages
  - New content types
  - Feature additions
  - Theme variations

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Designer**: AI Assistant  
**Status**: Ready for Implementation

