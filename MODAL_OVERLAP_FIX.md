# Modal Overlap Fix - Saved Addresses & Sticky Search

## Problem
The profile → saved addresses section was being overlapped by the home screen's sticky search button and category filters. The sticky search bar had `z-50` and was appearing on top of modals that also used `z-50`.

## Root Cause
Z-index conflict between:
- **Sticky Search Container**: `z-50` (ResponsiveLaundryHome.tsx)
- **Modal Overlays**: `z-50` (SavedAddressesModal, ZomatoAddressSelector, etc.)

When both elements had the same z-index level, the sticky search would sometimes appear above modal content.

## Solution

### 1. Increased Modal Z-Index
Updated all affected modals to use `z-[60]` instead of `z-50`:

**Files Updated:**
- `src/components/SavedAddressesModal.tsx` 
- `src/components/ZomatoAddressSelector.tsx`
- `src/components/ZomatoAddAddressPage.tsx`
- `src/components/AuthModal.tsx`

### 2. Added Modal Utility Classes
Enhanced `src/styles/mobile-sticky-search.css` with:

```css
/* Modal z-index layers */
.modal-overlay {
  z-index: 60 !important; /* Above sticky search (z-50) */
}

.modal-content {
  z-index: 61 !important; /* Above modal overlay */
}

/* Hide sticky search when modal is open */
body:has(.modal-overlay) .mobile-sticky-container {
  opacity: 0.3;
  pointer-events: none;
  transition: opacity 0.2s ease;
}
```

### 3. Applied Utility Classes
Added `modal-overlay` and `modal-content` classes to modal components for consistent layering and visual feedback.

### 4. Added Container Class
Added `mobile-sticky-container` class to the sticky search container in `ResponsiveLaundryHome.tsx` for CSS targeting.

## Result
✅ **Fixed Overlap**: Modals now properly appear above sticky search bar
✅ **Visual Feedback**: Sticky search dims when modals are open
✅ **Consistent Layering**: All modals use the same z-index system
✅ **Better UX**: Clear visual hierarchy between elements

## Z-Index Hierarchy
```
61 - Modal Content
60 - Modal Overlays  
50 - Sticky Search Bar
0  - Regular Content
```

## Testing
To verify the fix:
1. Open the app on mobile
2. Click profile → "Saved Addresses"
3. Modal should appear clearly above the sticky search bar
4. Sticky search should be dimmed while modal is open
