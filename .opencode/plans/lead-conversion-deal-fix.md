# Lead → Deal Conversion Fix — Execution Plan

## Problem
- A lead converted with the **old** buggy code has `status: "Converted"` but **no deal** was created
- The `convertToDeal` mutation rejects leads already in `"Converted"` status
- The `PipelineProgress` component doesn't show a closed banner for `"Converted"` leads
- There is no UI button to create a deal for an already-converted lead

## Changes

### 1. Backend — `convex/leads.ts` (line 1607-1608)

**Add `"Converted"` to `convertibleStatuses`**

```typescript
// Before:
const convertibleStatuses = ["Qualified", "Contacted"];

// After:
const convertibleStatuses = ["Qualified", "Contacted", "Converted"];
```

This allows the `convertToDeal` mutation to be called for leads already in `"Converted"` status. The `handleLeadConversion` helper already handles this correctly: if `lead.dealId` exists it patches the existing deal in-place (fixing workspace/stage), otherwise it creates a new deal.

---

### 2. Frontend — `src/components/LeadDetails/PipelineProgress.tsx`

**a) Add `onConvertToDeal` to props (line 4-12)**

```typescript
interface PipelineProgressProps {
  lead: any;
  transitions: any[] | undefined;
  onTransitionClick: (targetStage: string) => void;
  onQuickMarkStatus: (targetStage: string) => void;
  onReopenClick?: () => void;
  onConvertToDeal?: () => void;   // ← NEW
  currentUserRole?: string;
}
```

**b) Destructure new prop (line 13)**

```typescript
export function PipelineProgress({ lead, transitions = [], onTransitionClick, onQuickMarkStatus, onReopenClick, onConvertToDeal, currentUserRole }: PipelineProgressProps) {
```

**c) Include `"Converted"` in `isClosed` check (line 19)**

```typescript
// Before:
const isClosed = ["Lost", "Unqualified", "Spam", "Duplicate"].includes(lead.status) || lead.isClosed;

// After:
const isClosed = ["Lost", "Unqualified", "Spam", "Duplicate", "Converted"].includes(lead.status) || lead.isClosed;
```

**d) Add "Create Deal" button in the closed banner (after the Reopen button, around line 119)**

```tsx
{isAdminOrManager && onReopenClick && (
  <button onClick={onReopenClick} ...>
    🔄 Reopen Lead
  </button>
)}
{/* ↓ ADD THIS AFTER THE REOPEN BUTTON */}
{lead.status === "Converted" && onConvertToDeal && (
  <button
    onClick={onConvertToDeal}
    className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/10 transition-all cursor-pointer whitespace-nowrap"
  >
    ➕ Create Deal
  </button>
)}
```

---

### 3. Frontend — `src/components/LeadDetails/LeadDetailsLayout.tsx`

**Pass `onConvertToDeal` prop to PipelineProgress (around line 264-271)**

```tsx
<PipelineProgress 
  lead={lead}
  transitions={transitions}
  onTransitionClick={handlePipelineStatusRequest}
  onQuickMarkStatus={handlePipelineStatusRequest}
  onReopenClick={() => handlePipelineStatusRequest("Contacted")}
  onConvertToDeal={async () => {                     // ← NEW
    try {
      await convertToDealMutation({ leadId: lead._id });
      toast("success", "Lead converted to deal successfully");
    } catch (err: any) {
      toast("error", err.message || "Failed to convert lead");
    }
  }}
  currentUserRole={currentUser?.role}
/>
```

---

### 4. Deploy

```bash
# In the project root:
npx convex dev
```

(Or `npx convex deploy` for production.)

## Verification

1. Open a lead with `status: "Converted"` that has no associated deal
2. The Pipeline Progress section should show the **closed banner** with a **"Lead Closed: Converted"** message and a **"Create Deal"** button
3. Click "Create Deal" → a new deal should appear in the Deals page under "Prospecting"
