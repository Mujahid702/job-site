# Reusable UI Component Reference Guide

This document describes the reusable components, styling classes patterns, expected props, variants, states, and accessibility standards.

---

## 1. Button

### Purpose
Core interaction triggers for forms, dialogs, and actions.

### Props & Variants
-   `children` (ReactNode): Content to render inside button.
-   `variant` (enum):
    -   `primary`: Deep slate background (`bg-slate-900 text-white`). Used for primary actions.
    -   `secondary`: Bordered white background (`bg-white border-slate-200 text-slate-700`). Used for cancels or secondary choices.
    -   `danger`: Crimson red styling for destructive events.
-   `loading` (boolean): Displays a spinning indicator when active.
-   `disabled` (boolean): Blocks triggers and lowers opacity.

### Accessibility Notes
-   Includes `aria-busy="true"` during loading states.
-   Ensures focus ring highlights (`focus:ring-2 focus:ring-slate-550`) are visible for keyboard navigation.

### Example Usage
```tsx
import Button from "@/components/ui/Button";

<Button variant="primary" loading={isSubmitting} onClick={handleSubmit}>
  Save Blueprint
</Button>
```

---

## 2. Modal / Dialog

### Purpose
Overlay windows focusing the developer's attention on a standalone task (e.g. creating template, editing bookings).

### Props & Variants
-   `isOpen` (boolean): Toggles visibility.
-   `onClose` (void): Close handler trigger when backdrop or escape key is clicked.
-   `title` (string): Title text rendered inside header.
-   `children` (ReactNode): Dialog body.

### Accessibility Notes
-   Implements focus trapping: focus is set inside the modal on open and returns to the triggering button on close.
-   Backdrop overlay includes role `presentation` and list-closes on click.

### Example Usage
```tsx
import Dialog from "@/components/ui/Dialog";

<Dialog isOpen={isEditing} onClose={() => setIsEditing(false)} title="Edit Slot Details">
  <form>...</form>
</Dialog>
```

---

## 3. Progress Bar & circular Gauges

### Purpose
Visual progress metrics tracking (e.g., ATS scores, stage completion percentage, overall PRI indices).

### Props & Variants
-   `value` (number): Target percentage (0-100).
-   `color` (string): Tailored text color class (e.g., `text-emerald-600` for high readiness, `text-rose-600` for low ratings).
-   `size` (enum): `sm` / `md` / `lg`.

### Example Usage
```tsx
import ProgressBar from "@/components/ui/ProgressBar";

<ProgressBar value={progressPercent} size="md" />
```

---

## 4. Skeleton Loader

### Purpose
Subtle animation layouts rendered during asynchronous API resolutions (e.g. while AI parses resume texts).

### Props & Variants
-   `variant` (enum):
    -   `card`: Mock cards shape.
    -   `text`: Text blocks.
    -   `circle`: Avatar round shapes.

### Example Usage
```tsx
import Skeleton from "@/components/ui/Skeleton";

{isLoading ? (
  <Skeleton variant="card" className="h-48 w-full" />
) : (
  <ProjectCard data={project} />
)}
```

---

## 5. Tabs Layouts

### Purpose
Separates content segments within the same interface panel (e.g. switching between mock round levels inside Project Advisor).

### Props & Variants
-   `activeTab` (string): Matching tab key.
-   `tabs` (array): List of tab items mapping keys, labels, and icons.
-   `onChange` (void): Tab select callback.

### Example Usage
```tsx
import Tabs from "@/components/ui/Tabs";

<Tabs 
  activeTab={activeTab} 
  tabs={[{ id: "diagnostic", label: "Diagnostic" }, { id: "roadmap", label: "Roadmap" }]} 
  onChange={setActiveTab} 
/>
```
