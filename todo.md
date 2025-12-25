# Collection Manager - Development Plan

## Design Guidelines

### Style & Aesthetic
- **Theme**: Modern, Minimalist, and Clean.
- **Visuals**: Use Glassmorphism effects for cards, subtle gradients, and high-quality iconography.
- **Color Palette**:
  - Primary: #3B82F6 (Royal Blue) - Primary actions and accents
  - Secondary: #6366F1 (Indigo) - Secondary accents
  - Background: #F8FAFC (Slate 50) for Light Mode / #0F172A (Slate 900) for Dark Mode
  - Success: #10B981 (Emerald) - Progress bars and positive values
- **Typography**:
  - Sans-Serif: 'Inter' or 'Plus Jakarta Sans' for a modern, tech-focused look.
  - Headings: Semi-bold for clear hierarchy.

### Key Component Styles
- **Dashboard Cards**: Rounded (16px), subtle border, soft shadow, hover effect (scale 1.02).
- **Data Tables**: Clean layouts with striped rows, sticky headers, and clear filtering icons.
- **Buttons**: Rounded-lg, smooth transitions, high contrast text.

### Images to Generate
1. **hero-collection.jpg**: A high-quality, professional composition of a vinyl record player, some books, and CDs on a modern shelf. (Style: photorealistic, shallow depth of field)
2. **vinyl-bg.jpg**: Abstract artistic shot of vinyl grooves. (Style: minimalist, dark)
3. **books-bg.jpg**: A cozy library corner with neat shelves. (Style: watercolor/soft focus)

---

## Development Tasks

1. **Environment Setup**
   - [ ] Install dependencies: `recharts`, `lucide-react`, `clsx`, `tailwind-merge`
   - [ ] Update `index.html` title and favicon

2. **Asset Generation**
   - [ ] Generate images using `ImageCreator.generate_image`

3. **Core Layout & Components**
   - [ ] Create `MainLayout` with sidebar/navigation
   - [ ] Create `StatCard` component for dashboard metrics
   - [ ] Create reusable `DataTable` component with filtering/sorting

4. **Data Management & State**
   - [ ] Define initial mock data for Vinyls, CDs, Read Books, and Owned Books
   - [ ] Implement state management for collections and reading goals

5. **Page Implementation**
   - [ ] **Dashboard**: Value summaries, Reading Goal Progress (Sparkline/Progress bar), Top 5 Books Chart (Recharts)
   - [ ] **Vinyls/CDs**: Detailed tables with cost and rating filters
   - [ ] **Read Books**: Table with page counts and reading year
   - [ ] **Owned Books**: Table with physical location and total value calculation

6. **Final Polishing**
   - [ ] Responsive design adjustments
   - [ ] Add animations (framer-motion if possible, or tailwind animate)
   - [ ] Run `pnpm run lint` and `pnpm run build`
   - [ ] Final UI Check with `CheckUI.run`