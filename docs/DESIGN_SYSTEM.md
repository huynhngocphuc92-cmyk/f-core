# F-CORE Design System
> Version: 1.0
> Brand: F-CORE (HubSpot Clone)

---

## I. BRAND COLORS

### Primary Palette (Ocean Blue)

| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| Primary | `#0891b2` | `cyan-600` | Buttons, links, accents |
| Primary Hover | `#0ea5e9` | `sky-500` | Hover states |
| Primary Light | `#ecfeff` | `cyan-50` | Backgrounds |
| Primary Dark | `#155e75` | `cyan-800` | Text on light |

### Secondary Colors

| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| Success | `#00bda5` | `teal-500` | Success states, Sales Hub |
| Warning | `#f5c26b` | `amber-400` | Warnings, CMS Hub |
| Error | `#ef4444` | `red-500` | Errors, destructive |
| Info | `#6a78d1` | `indigo-400` | Info, Service Hub |

### Neutral Colors

| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| Text Primary | `#111827` | `gray-900` | Headings |
| Text Secondary | `#4b5563` | `gray-600` | Body text |
| Text Muted | `#9ca3af` | `gray-400` | Placeholders |
| Border | `#e5e7eb` | `gray-200` | Borders |
| Background | `#f9fafb` | `gray-50` | Page backgrounds |

---

## II. TYPOGRAPHY

### Font Family
```css
font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Font Sizes

| Name | Size | Tailwind | Usage |
|------|------|----------|-------|
| Display | 60px | `text-6xl` | Hero headlines |
| H1 | 48px | `text-5xl` | Page titles |
| H2 | 36px | `text-4xl` | Section titles |
| H3 | 24px | `text-2xl` | Card titles |
| H4 | 20px | `text-xl` | Subsections |
| Body | 16px | `text-base` | Body text |
| Small | 14px | `text-sm` | Captions, labels |
| XSmall | 12px | `text-xs` | Badges, hints |

### Font Weights

| Name | Weight | Tailwind |
|------|--------|----------|
| Regular | 400 | `font-normal` |
| Medium | 500 | `font-medium` |
| Semibold | 600 | `font-semibold` |
| Bold | 700 | `font-bold` |

---

## III. SPACING

### Base Unit: 4px

| Name | Size | Tailwind |
|------|------|----------|
| xs | 4px | `p-1`, `m-1` |
| sm | 8px | `p-2`, `m-2` |
| md | 16px | `p-4`, `m-4` |
| lg | 24px | `p-6`, `m-6` |
| xl | 32px | `p-8`, `m-8` |
| 2xl | 48px | `p-12`, `m-12` |
| 3xl | 64px | `p-16`, `m-16` |

### Section Padding
```tsx
// Standard section
className="py-20 lg:py-32"

// Compact section
className="py-12 lg:py-16"
```

---

## IV. COMPONENTS

### Buttons

```tsx
// Primary Button
className="inline-flex items-center justify-center rounded-md bg-[#0891b2] px-6 py-3 text-base font-semibold text-white hover:bg-[#0ea5e9] transition-colors shadow-lg shadow-cyan-500/25"

// Secondary Button
className="inline-flex items-center justify-center rounded-md bg-white px-6 py-3 text-base font-semibold text-gray-900 hover:bg-gray-50 transition-colors border border-gray-200"

// Ghost Button
className="inline-flex items-center gap-2 text-[#0891b2] font-semibold hover:gap-3 transition-all"
```

### Cards

```tsx
// Standard Card
className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm"

// Hover Card
className="rounded-2xl bg-gray-50 p-6 hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-100"

// Featured Card
className="rounded-2xl bg-[#0891b2] p-6 text-white"
```

### Badges

```tsx
// Primary Badge
className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-4 py-1.5 text-sm font-medium text-cyan-700"

// Status Badge
className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700"
```

### Form Inputs

```tsx
// Text Input
className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors"

// Select
className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none"
```

---

## V. SHADOWS

| Name | Tailwind | Usage |
|------|----------|-------|
| sm | `shadow-sm` | Cards, inputs |
| md | `shadow-md` | Dropdowns |
| lg | `shadow-lg` | Modals, popovers |
| xl | `shadow-xl` | Hover effects |
| 2xl | `shadow-2xl` | Hero elements |
| Brand | `shadow-cyan-500/25` | Primary buttons |

---

## VI. BORDER RADIUS

| Name | Size | Tailwind |
|------|------|----------|
| sm | 4px | `rounded` |
| md | 6px | `rounded-md` |
| lg | 8px | `rounded-lg` |
| xl | 12px | `rounded-xl` |
| 2xl | 16px | `rounded-2xl` |
| full | 9999px | `rounded-full` |

---

## VII. ICONS

### Library: Lucide React

```tsx
import { Users, BarChart3, Mail, Zap, Shield, Globe } from "lucide-react";

// Standard size
className="w-5 h-5"

// Large size
className="w-6 h-6"

// Icon in button
className="w-5 h-5 text-[#0891b2]"
```

---

## VIII. RESPONSIVE BREAKPOINTS

| Name | Width | Tailwind Prefix |
|------|-------|-----------------|
| Mobile | < 640px | (default) |
| Tablet | >= 640px | `sm:` |
| Laptop | >= 768px | `md:` |
| Desktop | >= 1024px | `lg:` |
| Large | >= 1280px | `xl:` |
| XLarge | >= 1536px | `2xl:` |

### Common Patterns

```tsx
// Responsive grid
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"

// Responsive text
className="text-3xl sm:text-4xl lg:text-5xl"

// Responsive padding
className="px-4 sm:px-6 lg:px-8"

// Hide/show
className="hidden lg:block"  // Show on desktop
className="lg:hidden"        // Hide on desktop
```

---

## IX. ANIMATIONS

```tsx
// Transition
className="transition-colors"
className="transition-all duration-300"

// Hover scale
className="hover:scale-105 transition-transform"

// Ping animation (for notifications)
className="animate-ping"

// Pulse animation
className="animate-pulse"
```

---

## X. Z-INDEX

| Name | Value | Usage |
|------|-------|-------|
| Base | 0 | Default |
| Dropdown | 10 | Dropdowns |
| Sticky | 20 | Sticky headers |
| Fixed | 30 | Fixed elements |
| Modal Backdrop | 40 | Modal backgrounds |
| Modal | 50 | Modal content |
| Popover | 60 | Popovers, tooltips |
| Toast | 70 | Toast notifications |

---

*Tham chiếu file này khi code bất kỳ UI component nào.*
