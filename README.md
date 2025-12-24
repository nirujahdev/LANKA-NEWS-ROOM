# Lanka News Room - UI Design Implementation

A modern, editorial-style news platform UI inspired by Google News, designed specifically for Sri Lankan users.

## Features

- 🎨 **Modern Design**: Clean, minimalist, editorial-style interface
- 🌐 **Multilingual**: Support for English, Sinhala (සිං), and Tamil (தமிழ்)
- 📱 **Responsive**: Mobile-first design optimized for all screen sizes
- 🎯 **Trust-Focused**: Calm, professional design that prioritizes information
- ♿ **Accessible**: High contrast, keyboard navigation, screen reader support

## Design System

### Brand Identity
- **Logo**: Blue folder icon (📁) with soft glow effect
- **Colors**: Calm blue palette, no aggressive colors
- **Typography**: Montserrat font family (Medium for body, Bold for headlines)

### Key Components

1. **Navigation Bar**
   - Sticky top navigation
   - Logo + brand name
   - Search bar (center on desktop)
   - Language switcher (EN | සිං | தமிழ்)

2. **Tab Navigation**
   - Horizontal scrolling tabs
   - Categories: Home, Recent, Sri Lanka, Politics, Economy, Sports, Technology, Health

3. **Incident Cards**
   - Clean card design with rounded corners
   - Headline, summary, source count, update time
   - Hover effects for interactivity

4. **Incident Detail Page**
   - Full summary display
   - Language switching
   - Source attribution
   - Update timeline

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
├── app/
│   ├── layout.tsx              # Root layout with font configuration
│   ├── page.tsx                 # Homepage with news feed
│   ├── globals.css              # Global styles and utilities
│   └── incident/
│       └── [id]/
│           └── page.tsx        # Incident detail page
├── components/
│   ├── Logo.tsx                 # Logo component with glow effect
│   ├── Navigation.tsx           # Main navigation bar
│   ├── TabNavigation.tsx         # Category tabs
│   ├── IncidentCard.tsx         # News card component
│   └── IncidentDetail.tsx       # Detail page component
├── design-system.md              # Design system documentation
├── UI_DESIGN_SPECIFICATION.md   # Complete UI specification
└── tailwind.config.js           # Tailwind CSS configuration
```

## Design Principles

1. **Calm & Trustworthy**: No aggressive colors or flashy effects
2. **Information-First**: Content takes priority over decoration
3. **Minimalist**: Clean, uncluttered interface
4. **Professional**: Serious newsroom aesthetic
5. **Accessible**: High contrast, readable fonts, keyboard navigation
6. **Mobile-First**: Optimized for small screens and touch interaction

## Color Palette

- **Primary Blue**: `#2563EB`
- **Background**: `#FFFFFF`
- **Text Primary**: `#111827`
- **Text Secondary**: `#6B7280`
- **Card Background**: `#F9FAFB`
- **Border**: `#E5E7EB`

## Typography

- **Font**: Montserrat (Google Fonts)
- **Weights**: 400 (Regular), 500 (Medium), 700 (Bold)
- **Optimized**: For Sinhala, Tamil, and English readability

## Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## Technology Stack

- **Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Font**: Montserrat (Google Fonts)
- **Language**: TypeScript

## Documentation

- **Design System**: See `design-system.md`
- **UI Specification**: See `UI_DESIGN_SPECIFICATION.md`
- **MVP Documentation**: See `MVP Documentation.md`

## Development Notes

### Component Props
All components are typed with TypeScript interfaces for type safety.

### Styling
Uses Tailwind CSS utility classes with custom utilities defined in `globals.css`.

### Accessibility
- Semantic HTML
- ARIA labels for icons
- Keyboard navigation support
- Focus visible styles
- High contrast ratios

## Next Steps

1. Connect to backend API for real data
2. Implement search functionality
3. Add filtering by category
4. Implement pagination/infinite scroll
5. Add loading states and error handling
6. Optimize images and assets
7. Add analytics tracking

## License

Private project - All rights reserved

