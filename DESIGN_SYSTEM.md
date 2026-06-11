# Luter Design System Guide

> **For all developers and AI agents:** This is the single source of truth for Luter's design language. Follow these rules strictly. Do not deviate from the color palette or component patterns without explicit approval.

---

## 1. Brand Identity

| Field | Value |
|---|---|
| **Product Name** | Luter |
| **Tagline** | Study smarter, together |
| **Logo** | `/public/Header logo.png` — use `height: 34px` in sidebar, `height: 28px` collapsed |
| **Target Users** | University students, solo learners — all ages |

---

## 2. Color Palette (STRICT — Do Not Deviate)

### Primary Brand Colors

| Token | Hex | Use Case |
|---|---|---|
| `--luter-purple` | `#C4B5FD` | Active nav pills, focus rings, soft highlights |
| `--luter-mint` | `#98FF98` | Success states, Upgrade button, positive feedback |
| `--luter-bg` | `#F9FAFB` | Primary app background |
| `--luter-peach` | `#FFD2A6` | Avatar fallback, streak/warmth accents, credits badge |

### Functional Colors

| Token | Hex | Use Case |
|---|---|---|
| `--purple-deep` | `#7a12cc` | Primary CTA buttons, icon fills, gradients |
| `--purple-mid` | `#9718fb` | Gradient stops |
| `--text-primary` | `#111827` | Headings, body text |
| `--text-secondary` | `#6B7280` | Subtext, labels |
| `--text-muted` | `#9CA3AF` | Timestamps, hints |
| `--border` | `#E5E7EB` | Card borders, dividers |
| `--border-subtle` | `#F3F4F6` | Hairline dividers |
| `--success` | `#16a34a` | Quiz scores, "mastered" text |
| `--danger` | `#EF4444` | Sign Out, notification dot, errors |

### Dark Mode Colors

| Token | Hex |
|---|---|
| `--sb-bg` | `#111827` |
| `--sb-surface` | `#1F2937` |
| `--sb-border` | `#374151` |
| `--sb-text` | `#F9FAFB` |
| `--sb-text-secondary` | `#9CA3AF` |

---

## 3. CSS Variable Setup

All variables live on `:root`. Dark mode overrides go on `body.dark-mode`:

```css
:root {
  --sb-bg: #F9FAFB;
  --sb-surface: #ffffff;
  --sb-text: #111827;
  --sb-text-secondary: #6B7280;
  --sb-text-muted: #9CA3AF;
  --sb-border: #E5E7EB;
  --sb-purple: #C4B5FD;
  --sb-mint: #98FF98;
  --sb-peach: #FFD2A6;
  --sb-purple-deep: #7a12cc;
}

body.dark-mode {
  --sb-bg: #111827;
  --sb-surface: #1F2937;
  --sb-text: #F9FAFB;
  --sb-text-secondary: #9CA3AF;
  --sb-border: #374151;
}
```

---

## 4. Typography

- **Primary Font:** `Outfit` (Google Fonts) — import at `?family=Outfit:wght@400;500;600;700;800;900`
- **Fallback:** `Inter`, `sans-serif`

### Scale

| Use | Size | Weight | Letter Spacing |
|---|---|---|---|
| Hero title | `42px` | `900` | `-0.03em` |
| Page title | `32–40px` | `800–900` | `-0.02em` |
| Section heading | `22–24px` | `700–800` | `-0.01em` |
| Card title | `17–18px` | `800` | `0` |
| Body / nav label | `14–15px` | `600` | `0` |
| Label / badge | `11–12px` | `700–800` | `+0.03em` |
| Timestamp / hint | `11px` | `500` | `0` |

---

## 5. Spacing System

Base unit = `4px`. Never use arbitrary values outside this scale.

| Token | px |
|---|---|
| `xs` | 4 |
| `sm` | 8 |
| `md` | 12 |
| `lg` | 16 |
| `xl` | 24 |
| `2xl` | 32 |
| `3xl` | 48 |
| `4xl` | 64 |

---

## 6. Component Patterns

### Navigation Pills (Sidebar)

```css
.nav-pill {
  padding: 11px 14px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Active */
.nav-pill.active {
  background: #C4B5FD;  /* --luter-purple */
  color: #111827;
  font-weight: 700;
}

/* Arcade — special warm active pill */
.nav-pill.active.arcade {
  background: linear-gradient(135deg, #FFD2A6, #FFB976);
  color: #7C2D12;
}

/* Hover */
.nav-pill:hover {
  background: rgba(0,0,0, 0.04);
}
body.dark-mode .nav-pill:hover {
  background: rgba(255,255,255, 0.06);
}
```

### Cards

```css
.card {
  background: #fff;
  border-radius: 20px;
  border: 1px solid #E5E7EB;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(122,18,204,0.12), 0 4px 12px rgba(0,0,0,0.06);
}

body.dark-mode .card {
  background: #1F2937;
  border-color: rgba(255,255,255,0.07);
}
```

### Primary CTA Button

```css
.btn-primary {
  background: #7a12cc;
  color: white;
  padding: 14px 20px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 14px;
  border: none;
  transition: opacity 0.18s, transform 0.1s;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(122,18,204,0.4);
}
```

### Upgrade Button

```css
.btn-upgrade {
  background: #98FF98;  /* --luter-mint */
  color: #166534;
  font-weight: 700;
  border-radius: 12px;
}
```

### Credits Badge

```css
.credits-badge {
  background: #FFD2A6;  /* --luter-peach */
  color: #92400E;
  border-radius: 20px;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 800;
}
```

### Toggle Switch (Dark Mode)

```css
.toggle-track {
  background: #E5E7EB;
  border-radius: 99px;
  width: 38px; height: 22px;
  transition: background 0.2s;
}

input:checked + .toggle-track {
  background: #7a12cc;
}
```

---

## 7. App Architecture — 5-Pillar Navigation

The sidebar MUST always contain exactly these 5 items in this order:

| # | Label | Icon | Path | Notes |
|---|---|---|---|---|
| 1 | **Home** | `House` | `/dashboard` | Exact match only |
| 2 | **Sessions** | `UsersThree` | `/sessions` | Collaboration rooms |
| 3 | **My Decks** | `Cards` | `/dashboard/decks` | All quizzes + flashcards |
| 4 | **Backpack** | `Backpack` | `/dashboard/courses` | File/material storage |
| 5 | **Arcade** | `GameController` | `/playground` | Games, battles, leaderboards |

**Do NOT add more nav items** without explicit approval. The 5-pillar structure is intentional.

---

## 8. Sidebar Layout Rules

```
┌─────────────────────┐
│  [Logo]    [Collapse]│  ← dsb-logo-area (padding: 20px 16px)
├─────────────────────┤
│  🏠 Home            │
│  🧠 Sessions        │  ← dsb-nav-list (flex-col, gap: 2px)
│  🃏 My Decks        │
│  🎒 Backpack        │
│  🎮 Arcade          │
├─────────────────────┤
│  💬  📢  ❓          │  ← dsb-helper-row (Feedback, Updates, Help)
├─────────────────────┤
│  Credits: 20,000 💰 │
│  [⚡ Upgrade]       │
│  [Avatar] Name ▲   │  ← dsb-profile-card (triggers dropdown)
└─────────────────────┘
```

**Personal Dropdown** (opens upward, above profile card):
- Profile → `/profile`
- My Progress → `/progress`
- Settings → `/settings`
- Dark Mode toggle
- (divider)
- Sign Out (red)

**Notifications**: NOT in the sidebar. Lives as Bell icon in `DashboardHome.jsx` top-right header.

---

## 9. Dark Mode Implementation

```js
// Toggle function
function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('luter-theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDark)
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    localStorage.setItem('luter-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  return [isDark, setIsDark]
}
```

- **Storage key:** `luter-theme` in `localStorage`
- **Body class:** `dark-mode` on `document.body`
- **HTML attribute:** `data-theme="dark"` on `document.documentElement`

---

## 10. Icons

- **Library:** `@phosphor-icons/react`
- **Default weight:** `regular`
- **Active / filled state:** `fill`
- **Sizes:**
  - Nav sidebar: `21px`
  - Card feature icons: `24–32px`
  - Inline body: `16–18px`
  - Helper row: `18px`

---

## 11. Animation Principles

- **Library:** `framer-motion` (`AnimatePresence`, `motion.*`)
- **Duration:** `200ms` micro, `400ms` page, `800ms` hero
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` standard; `spring` for bouncy
- **Card hover:** `y: -4` (via `whileHover`)
- **Page entry:** `initial={{ opacity: 0, y: 30 }}` → `animate={{ opacity: 1, y: 0 }}`
- **Modals:** `initial={{ opacity: 0, scale: 0.9 }}`

---

## 12. CSS Scoping Convention

Each new page component should scope its CSS to avoid conflicts:

| Component | Prefix |
|---|---|
| Sidebar | `dsb-` |
| Dashboard Home | `dhd-` |
| My Decks | `dkp-` |
| Sessions | `sess-` |
| Backpack / Courses | `bkp-` |
| Arcade | `arc-` |

Inject scoped `<style>` tags using `document.head.appendChild(tag)` with a unique `id` so they are only injected once:

```js
function injectStyles() {
  if (document.getElementById('component-styles')) return
  const tag = document.createElement('style')
  tag.id = 'component-styles'
  tag.textContent = CSS_STRING
  document.head.appendChild(tag)
}
```

---

## 13. File Locations

| File | Path |
|---|---|
| Sidebar component | `src/components/dashboard/DashboardSidebar.jsx` |
| Sidebar CSS | `src/components/dashboard/SidebarRedesign.css` |
| My Decks page | `src/components/dashboard/DecksPage.jsx` |
| Dashboard Home | `src/components/dashboard/DashboardHome.jsx` |
| App routes | `src/App.jsx` |
| Supabase client | `src/supabaseClient.js` |
| Header Logo | `public/Header logo.png` |

---

## 14. Key Rules for Future AI Agents

> [!IMPORTANT]
> Always follow these rules without exception.

1. **Never hardcode colors** outside the palette defined in Section 2. If you need a new color, derive it from the brand palette (e.g., `rgba(196,181,253,0.2)` from `#C4B5FD`).

2. **Always use `font-family: 'Outfit', 'Inter', sans-serif`** on every new component.

3. **Never add new sidebar nav items** without explicit user approval. Keep the 5-pillar structure.

4. **Always support dark mode** via `body.dark-mode` class. Test every new component in both modes.

5. **Use `@phosphor-icons/react`** for all icons. Never mix icon libraries.

6. **Credits display is 20,000** (or dynamic from `profile.credits ?? 20000`).

7. **Navigation paths:**
   - My Decks → `/dashboard/decks`
   - Backpack → `/dashboard/courses`
   - Arcade → `/playground`

8. **When adding a route**, also update `src/App.jsx` with both `import` and `<Route>`.

9. **Scoped CSS prefix** — pick a unique 3-4 char prefix per new page (see Section 12).

10. **Don't break existing context** — the `Dashboard.jsx` outlet provides `{ user, setNotificationsOpen }` via `useOutletContext`.
