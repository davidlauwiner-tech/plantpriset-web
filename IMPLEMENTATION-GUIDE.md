# Plantpriset — Fixes & Next Steps

## Status: Push ✅ deployed, 7 fixes ready

Git push `244f2fd` went through successfully. These files are ready to
drop into your local repo at `~/Downloads/plantpriset-web/`.

---

## Fix #1: Seed vs Plant Pricing (CRITICAL)

**Problem:** 656 kr seeds > 487 kr plants — nonsensical.
Root cause: only expensive specialty matches returned from Supabase.

**Solution:** `src/lib/plant-pricing.ts`

What it does:
- Multi-strategy search: exact → prefix → base name → products table
- Separates results into plants vs seeds, prefers the right category
- Trigram similarity scoring so "Lavendel" matches "Lavendel Hidcote" but
  prefers the closer match
- Fallback estimated prices for 40+ common Swedish garden plants when no
  DB match exists
- **Hard sanity check:** seeds can never cost more than plants for the same
  species — capped at 55% of plant price if inverted

**Apply:**
```bash
cp src/lib/plant-pricing.ts ~/Downloads/plantpriset-web/src/lib/
```

Then update your `generate-plan/route.ts` to import from it (see the
updated route file included).

---

## Fix #2: Shape Detection + Manual Override

**Problem:** AI detects "kidney" but bed is irregular with rocks.

**Solution:** `src/components/ShapeSelector.tsx`

- Shows AI-detected shape with confidence percentage
- 9 shape SVG thumbnails user can click to override
- Detected shape shown first with "AI" badge
- Low confidence (<70%) prompts user to adjust

**Apply:**
```bash
cp src/components/ShapeSelector.tsx ~/Downloads/plantpriset-web/src/components/
```

Add to your wizard step after photo upload:
```tsx
<ShapeSelector
  detectedShape={shapeResult?.shape}
  confidence={shapeResult?.confidence}
  suggestedVariants={shapeResult?.suggestedVariants}
  onShapeSelect={(shape) => setSelectedShape(shape)}
/>
```

---

## Fix #3: Plant Label Readability (CRITICAL)

**Problem:** AI-rendered text labels on gpt-image-1 output are tiny and
illegible.

**Solution:** Two components + updated API route

1. `src/components/PlantLabelOverlay.tsx` — HTML overlay with:
   - Frosted glass pill labels positioned at plant locations
   - Color-coded by row (bak/mitt/fram)
   - Hover to see row name
   - Toggle button to show/hide

2. `src/components/BeforeAfterView.tsx` — Slider comparison with:
   - Drag handle for before/after
   - Labels integrated on the "after" side
   - "Före"/"Efter" corner badges

3. `src/app/api/generate-image/route.ts` — Updated to:
   - Tell gpt-image-1 "DO NOT add text/labels"
   - Return `plantPositions` array for overlay placement
   - Cleaner prompts for more natural results

**Apply:**
```bash
cp src/components/PlantLabelOverlay.tsx ~/Downloads/plantpriset-web/src/components/
cp src/components/BeforeAfterView.tsx ~/Downloads/plantpriset-web/src/components/
cp src/app/api/generate-image/route.ts ~/Downloads/plantpriset-web/src/app/api/generate-image/
```

Use in your results page:
```tsx
import BeforeAfterView from '@/components/BeforeAfterView';

<BeforeAfterView
  beforeImage={userPhoto}
  afterImage={generatedImage}
  plantPositions={result.plantPositions}
/>
```

---

## Fix #4: Vercel Environment Variables

Run in terminal:
```bash
cd ~/Downloads/plantpriset-web
npx vercel env add OPENAI_API_KEY production
# Paste your key when prompted

# Redeploy
npx vercel --prod
```

Or via Vercel dashboard:
Settings → Environment Variables → Add:
- `OPENAI_API_KEY` = your key
- Scope: Production + Preview

---

## Fix #5: Domain (plantpriset.se)

Recommended registrar: Loopia or Binero (Swedish, cheap .se)

After purchase:
```bash
npx vercel domains add plantpriset.se
```

Then set DNS at registrar:
- A record → `76.76.21.21`
- CNAME `www` → `cname.vercel-dns.com`

---

## Fix #6: SEO — Meta Tags + Sitemap

**Files:**
- `src/app/sitemap.ts` — Dynamic sitemap from all 8000+ Supabase products
- `src/app/robots.ts` — robots.txt allowing crawling
- `src/app/metadata-example.ts` — Metadata export to merge into layout.tsx

**Apply:**
```bash
cp src/app/sitemap.ts ~/Downloads/plantpriset-web/src/app/
cp src/app/robots.ts ~/Downloads/plantpriset-web/src/app/
```

For metadata, merge the export from `metadata-example.ts` into your
existing `src/app/layout.tsx`.

After deploy, submit sitemap at:
https://search.google.com/search-console → Add property → plantpriset.se

---

## Fix #7: Already Done ✅

Git push completed successfully:
```
244f2fd  main → main
4 files changed, 546 insertions(+), 8 deletions(-)
```

---

## Deployment Checklist

```bash
cd ~/Downloads/plantpriset-web

# 1. Copy all fix files
cp -r [path-to-fixes]/src/lib/plant-pricing.ts src/lib/
cp -r [path-to-fixes]/src/components/*.tsx src/components/
cp -r [path-to-fixes]/src/app/api/generate-image/route.ts src/app/api/generate-image/
cp -r [path-to-fixes]/src/app/api/generate-plan/route.ts src/app/api/generate-plan/
cp -r [path-to-fixes]/src/app/sitemap.ts src/app/
cp -r [path-to-fixes]/src/app/robots.ts src/app/

# 2. Install OpenAI SDK if not already
npm install openai

# 3. Test locally
npm run dev

# 4. Add env var to Vercel
npx vercel env add OPENAI_API_KEY production

# 5. Commit and deploy
git add -A
git commit -m "Fix pricing, label overlay, shape selector, SEO"
git push

# 6. Force production deploy
npx vercel --prod
```

---

## Current Stats (live site)

| Metric | Count |
|--------|-------|
| Products | ~9,257 |
| Retailers | 7 |
| Price comparisons | 549+ |
| Categories | 4 main + 64 subcategories |
| AI descriptions | ~2,000+ |
