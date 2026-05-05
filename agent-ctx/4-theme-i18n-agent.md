# Task 4 - Theme & i18n Agent: Header, Footer, AuthPage

## Summary
Updated Header, Footer, and AuthPage components with gold/purple color scheme and French language support.

## Changes Made

### Header (`src/components/deal/Header.tsx`)
- Added language toggle button (AR/FR) with Globe icon
- All text labels now use t() for bilingual support
- Header background: white with subtle purple border
- Logo uses gold-shimmer CSS class
- Dynamic stats bar showing 58 Wilayas, 250+ Merchants, 120+ Services, 10K+ Users
- RTL/LTR document direction switching via useEffect
- DropdownMenu and Sheet direction now language-aware

### Footer (`src/components/deal/Footer.tsx`)
- Background changed to bg-deal-dark (dark purple-red gradient)
- All headings use text-amber-400
- Links use text-white/70 hover:text-amber-400
- Social icons: amber-400 default, amber-500 hover
- Added 58 Wilayas badge
- All content bilingual (Arabic/French)

### AuthPage (`src/components/deal/AuthPage.tsx`)
- Background gradient: from-[#4A0E2E] to-[#6B1D45]
- Active tab: bg-amber-500
- Language toggle in top-right corner
- Logo with gold-shimmer
- All labels use t() for bilingual support
- Input focus: amber-400 rings
- Demo buttons: alternating amber/purple styling
- Wilaya list: language-aware (WILAYAS vs WILAYAS_FR)

## Lint: Zero errors
## Dev Server: Running, 200 status
