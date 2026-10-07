# Design System – FI360 (Fleetio-inspired)

## Overall Feel
Clean, modern, professional SaaS — similar to Fleetio:
- Spacious but information-dense where needed
- High-quality typography and spacing
- Clear hierarchy
- Excellent empty states and loading states
- Consistent status badges and action patterns

## Theme Tokens (Tailwind)

| Element              | Light Mode                  | Dark Mode                          |
|----------------------|-----------------------------|------------------------------------|
| Page Background      | `bg-slate-50`               | `dark:bg-slate-950`                |
| Card / Panel         | `bg-white border-slate-200` | `dark:bg-slate-900 dark:border-slate-800` |
| Primary Text         | `text-slate-900`            | `dark:text-slate-50`               |
| Secondary Text       | `text-slate-500`            | `dark:text-slate-400`              |
| Primary Button       | `bg-blue-600 hover:bg-blue-700` | Same (or slightly brighter)     |
| Success              | Emerald                     | Emerald (darker bg)                |
| Warning              | Amber                       | Amber                              |
| Danger / Critical    | Rose / Red                  | Rose                               |

## Required UI Patterns
- Global Topbar + collapsible Sidebar (Fleetio-style)
- Theme toggle (Light / Dark / System) always visible
- Data tables with search, filters, column visibility, pagination
- Slide-over or modal forms for Create / Edit
- Toast feedback on every important action (`sonner`)
- Loading spinners on buttons during mutations
- Beautiful empty states with clear CTA
- Status badges with consistent colors

## Landing Page Style
- Large, bold hero
- Clear value proposition
- Stats / social proof row
- Feature / module cards
- Pricing section with the three tiers
- Strong final CTA
- Fully responsive + theme support