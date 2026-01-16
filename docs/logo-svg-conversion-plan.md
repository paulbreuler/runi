# Logo SVG Conversion Plan

**Status:** Planning  
**Created:** 2026-01-16  
**Current Logo:** `.github/assets/runi-tmp-logo-halp-need-designer.png`

## Current State

- Logo is currently a PNG file (7.5MB)
- README references the PNG temporarily
- Need to convert to SVG for better scalability and smaller file size

## Requirements

### Design Specifications

Based on the current PNG logo:

- **Subject:** Stylized low-poly German Shepherd head
- **Style:** Geometric, angular, minimalist
- **Color Palette:**
  - Tan/beige for main head areas
  - Dark grey/black for muzzle, ears, markings
  - Charcoal grey background (or transparent)
- **Elements:**
  - Shield emblem with "R" above head
  - Four-pointed star in bottom right
  - Low-poly geometric shapes

### Technical Requirements

1. **Format:** SVG (Scalable Vector Graphics)
2. **Size:** Should be <100KB (vs current 7.5MB PNG)
3. **Dimensions:** Optimized for 120px width in README
4. **Background:** Transparent or match README background
5. **Viewbox:** Properly set for scaling

## Options for Creation

### Option 1: Hire a Designer

- **Pros:** Professional quality, proper SVG structure, optimized
- **Cons:** Cost, time to find right designer
- **Platforms:** Fiverr, Upwork, Dribbble, 99designs
- **Budget Estimate:** $50-200 depending on quality

### Option 2: Use AI Image-to-SVG Tools

- **Tools:**
  - [Vectorizer.io](https://vectorizer.io/) - AI-powered PNG to SVG
  - [AutoTracer](https://www.autotracer.org/) - Free online converter
  - [ImageTracer.js](https://github.com/jankovics-andras/imagetracerjs) - Open source
- **Pros:** Fast, free/low-cost
- **Cons:** May not preserve low-poly aesthetic perfectly, might need cleanup

### Option 3: Manual Recreation in Design Software

- **Tools:**
  - Figma (free, web-based)
  - Inkscape (free, open source)
  - Adobe Illustrator (paid)
- **Pros:** Full control, can match exact style
- **Cons:** Requires design skills, time-consuming

### Option 4: Hybrid Approach

1. Use AI tool to get base SVG structure
2. Clean up and optimize manually in Inkscape/Figma
3. Or hire designer to refine AI output

## Recommended Approach

**Option 4 (Hybrid)** seems most practical:

1. **Phase 1:** Try `vectorizer.io` or similar AI tool
   - Upload PNG
   - Download SVG
   - Check quality and file size
   - If acceptable, use it

2. **Phase 2:** If AI output needs refinement
   - Use Inkscape (free) to clean up paths
   - Optimize with SVGO
   - Test in README

3. **Phase 3:** If still not satisfied
   - Hire designer on Fiverr/Upwork
   - Provide PNG as reference
   - Request SVG with specific requirements

## Implementation Steps

1. ✅ Update README to use PNG (done)
2. ⏳ Try AI conversion tool (vectorizer.io recommended)
3. ⏳ Review SVG output quality
4. ⏳ Optimize SVG if needed (SVGO)
5. ⏳ Test in README
6. ⏳ Replace PNG reference with SVG
7. ⏳ Archive or remove PNG (or keep as backup)

## SVG Optimization Checklist

Once SVG is created:

- [ ] Run through SVGO: `npx svgo logo.svg`
- [ ] Verify viewBox is set correctly
- [ ] Check file size (<100KB target)
- [ ] Test at different sizes (120px, 240px, 480px)
- [ ] Verify transparency works
- [ ] Test in dark/light mode if applicable

## File Naming

Once SVG is ready:

- **New file:** `.github/assets/runi-logo.svg`
- **Update README:** Change reference from PNG to SVG
- **Archive PNG:** Move to `.github/assets/archive/` or remove

## Notes

- Current PNG is quite large (7.5MB) - definitely need SVG for web
- Low-poly style should translate well to SVG paths
- Consider creating multiple sizes if needed (favicon, social media, etc.)
