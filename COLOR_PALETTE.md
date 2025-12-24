# Lanka News Room - Color Palette

## Official Color Palette

### Primary Colors
- **Primary Blue**: `#2563EB`
  - Usage: Logo, primary buttons, links, active states, focus rings
  - RGB: rgb(37, 99, 235)
  
- **Accent Blue**: `#3B82F6`
  - Usage: Hover states, secondary accents, folder tab
  - RGB: rgb(59, 130, 246)

### Text Colors
- **Dark Text**: `#0F172A`
  - Usage: Headlines, primary text, body content
  - RGB: rgb(15, 23, 42)
  
- **Text Gray**: `#64748B`
  - Usage: Secondary text, meta information, placeholders
  - RGB: rgb(100, 116, 139)

### Background Colors
- **Background**: `#FFFFFF`
  - Usage: Main page background, card backgrounds (when needed)
  - RGB: rgb(255, 255, 255)
  
- **Card Ash**: `#F1F5F9`
  - Usage: Card backgrounds, sidebar backgrounds, language switcher background
  - RGB: rgb(241, 245, 249)

### Border Colors
- **Border Gray**: `#E5E7EB`
  - Usage: Card borders, input borders, divider lines
  - RGB: rgb(229, 231, 235)

## Color Usage Guidelines

### Headlines & Titles
- Use **Dark Text** (`#0F172A`) for all headlines and titles
- Font weight: Bold (700)

### Body Text
- Use **Dark Text** (`#0F172A`) for primary body content
- Use **Text Gray** (`#64748B`) for secondary/meta information

### Interactive Elements
- **Links**: Primary Blue (`#2563EB`)
- **Hover States**: Accent Blue (`#3B82F6`)
- **Active States**: Primary Blue (`#2563EB`)

### Cards & Containers
- **Background**: Card Ash (`#F1F5F9`)
- **Border**: Border Gray (`#E5E7EB`)
- **Hover Background**: Slightly darker ash (`#E2E8F0`)

### Focus States
- **Focus Ring**: Primary Blue (`#2563EB`) with 2px width
- **Focus Offset**: 2px

## Tailwind CSS Configuration

These colors are configured in `tailwind.config.js`:

```javascript
colors: {
  primary: {
    blue: '#2563EB',
    'accent-blue': '#3B82F6',
  },
  text: {
    dark: '#0F172A',
    gray: '#64748B',
  },
  card: {
    ash: '#F1F5F9',
  },
  border: {
    gray: '#E5E7EB',
  },
}
```

## Usage in Components

### Direct Hex Values (Recommended)
Use direct hex values in Tailwind classes for consistency:
- `text-[#0F172A]` - Dark text
- `text-[#64748B]` - Gray text
- `bg-[#F1F5F9]` - Card ash background
- `border-[#E5E7EB]` - Border gray
- `text-[#2563EB]` - Primary blue
- `text-[#3B82F6]` - Accent blue

### Examples

#### Headline
```tsx
<h1 className="text-[#0F172A] font-bold">Headline</h1>
```

#### Body Text
```tsx
<p className="text-[#0F172A]">Primary content</p>
<p className="text-[#64748B]">Secondary content</p>
```

#### Card
```tsx
<div className="bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl p-6">
  {/* Card content */}
</div>
```

#### Link
```tsx
<a className="text-[#2563EB] hover:text-[#3B82F6]">Link</a>
```

#### Button
```tsx
<button className="bg-[#2563EB] text-white hover:bg-[#3B82F6]">
  Button
</button>
```

## Accessibility

All color combinations meet WCAG AA contrast requirements:
- Dark Text on White: 16.8:1 ✅
- Text Gray on White: 4.8:1 ✅
- Primary Blue on White: 4.5:1 ✅
- White on Primary Blue: 4.5:1 ✅

## Design Principles

1. **Calm & Trustworthy**: No aggressive colors (no red, yellow)
2. **High Contrast**: Dark text on light backgrounds
3. **Consistent**: Use palette colors only, no variations
4. **Accessible**: All combinations meet contrast requirements

