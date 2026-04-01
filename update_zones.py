#!/usr/bin/env python3
"""Update planera prompt and image generation to use zone-based layout."""

# PART 1: Update the Claude prompt in planera/page.tsx
with open("src/app/planera/page.tsx", "r") as f:
    content = f.read()

# Find and replace the prompt
old_prompt_start = 'const prompt = "Du är en expert trädgårdsdesigner i Sverige.'
old_prompt_end = '"Ska passa svenska förhållanden, ge blomning maj-sept, ha varierande höjder och färgharmoni.";'

start_idx = content.find(old_prompt_start)
end_idx = content.find(old_prompt_end)
if start_idx < 0 or end_idx < 0:
    print("ERROR: Could not find prompt in planera/page.tsx")
    exit(1)

end_idx += len(old_prompt_end)

new_prompt = '''const prompt = "Du är en expert trädgårdsdesigner i Sverige. Designa en planteringsplan för:\\n" +
      "- Typ: " + spaceName + "\\n- Mått: " + length + "m x " + width + "m\\n- Sol: " + sunName +
      "\\n- Stil: " + styleName + " - " + styleDesc + "\\n- Zon: 3-4 (Mellansverige)\\n\\n" +
      "Svara ENDAST med JSON (ingen markdown, inga backticks). Formatet:\\n" +
      '{"title":"Namn","description":"2-3 meningar","plants":[{"name":"Svenskt namn","latin":"Latinskt namn","quantity":3,"zone":"back-left","height_cm":80,"spread_cm":50,"color":"Lila","bloom_period":"Juni-Aug","care":"Lätt"}],"tips":"2-3 odlingstips"}\\n\\n' +
      "Välj 6-9 sorter. Max 25 plantor totalt. Varje växt får en ZONE som anger exakt var i rabatten den ska stå.\\n\\n" +
      "ZONER (tänk dig rabatten uppifrån, 3x3 rutnät):\\n" +
      "Bakre raden: back-left, back-center, back-right\\n" +
      "Mellanraden: mid-left, mid-center, mid-right\\n" +
      "Främre raden: front-left, front-center, front-right\\n\\n" +
      "REGLER:\\n" +
      "- Höga växter (>70cm) MÅSTE ha zone som börjar med 'back-'\\n" +
      "- Medelväxter (35-70cm) MÅSTE ha zone som börjar med 'mid-'\\n" +
      "- Låga växter (<35cm) MÅSTE ha zone som börjar med 'front-'\\n" +
      "- Varje zone får max 1-2 sorter\\n" +
      "- Sprid sorterna jämnt: använd left, center OCH right\\n" +
      "- SAMMA sort ska bara ha EN zone (alla exemplar av sorten står tillsammans)\\n" +
      "- Ange spread_cm (bredd vid mognad) för varje växt\\n" +
      "- quantity: stora växter 1-2st, medelstora 2-4st, små 3-6st\\n\\n" +
      "Ska passa svenska förhållanden, ge blomning maj-sept, ha varierande höjder och färgharmoni.";'''

content = content[:start_idx] + new_prompt + content[end_idx:]

with open("src/app/planera/page.tsx", "w") as f:
    f.write(content)
print("SUCCESS: Updated Claude prompt with zone-based layout")


# PART 2: Update image generation to use zones from the plant list
with open("src/app/api/generate-image/route.ts", "r") as f:
    img_content = f.read()

# Find the section that builds the image prompt for gpt-image-1
# Replace the plant layout description for the edit prompt
old_layout_block = '''      // Build position descriptions matching the diagram layout
      function describeRow(row: any[], positions: string[]): string {
        return row.map((p: any, i: number) => {
          const pos = positions[Math.min(i, positions.length - 1)];
          return p.name + " (" + p.quantity + " st, " + p.height_cm + "cm) " + pos;
        }).join(". ");
      }

      const backPositions = ["on the far left", "in the center-left", "in the center", "in the center-right", "on the far right"];
      const midPositions = ["on the left side", "in the center-left", "in the center", "in the center-right", "on the right side"];
      const frontPositions = ["on the left edge", "in the center-left", "in the center", "in the center-right", "on the right edge"];

      const plantLayout =
        (backP.length ? "BACK ROW (tallest, against fence/wall): " + describeRow(backP, backPositions) + ". " : "") +
        (midP.length ? "MIDDLE ROW: " + describeRow(midP, midPositions) + ". " : "") +
        (frontP.length ? "FRONT ROW (shortest, at the edge): " + describeRow(frontP, frontPositions) + ". " : "");'''

new_layout_block = '''      // Build zone-based position descriptions matching the diagram
      const zoneToPosition: Record<string, string> = {
        "back-left": "in the BACK-LEFT area",
        "back-center": "in the BACK-CENTER area",
        "back-right": "in the BACK-RIGHT area",
        "mid-left": "in the MIDDLE-LEFT area",
        "mid-center": "in the MIDDLE-CENTER area",
        "mid-right": "in the MIDDLE-RIGHT area",
        "front-left": "in the FRONT-LEFT area (closest to viewer)",
        "front-center": "in the FRONT-CENTER area (closest to viewer)",
        "front-right": "in the FRONT-RIGHT area (closest to viewer)",
      };

      const plantLayout = plants.map((p: any) => {
        const pos = zoneToPosition[p.zone] || "in the bed";
        return p.name + " (" + p.quantity + " plants, " + p.height_cm + "cm tall, " + p.color + ") placed " + pos;
      }).join(". ") + ".";'''

if old_layout_block in img_content:
    img_content = img_content.replace(old_layout_block, new_layout_block)
    print("SUCCESS: Updated image prompt to use zone positions")
else:
    print("WARNING: Could not find old layout block in generate-image - trying partial match")
    # Try finding just the function definition
    if "describeRow" in img_content:
        print("Found describeRow - needs manual replacement")
    else:
        print("describeRow not found - layout may already be different")

# Also update the diagram function to use zones instead of height-based rows
# Find the species building section
old_species = '''    const h = p.height_cm;
    const row = h > 70 ? "back" : h > 35 ? "mid" : "front";
    species.push({ num: i + 1, name: p.name, color: cM[p.color] || "#6aa858", qty: p.quantity || 3, hcm: h, scm: p.spread_cm || Math.round(h * 0.6), row });'''

new_species = '''    const h = p.height_cm;
    const zone = p.zone || (h > 70 ? "back-center" : h > 35 ? "mid-center" : "front-center");
    const row = zone.startsWith("back") ? "back" : zone.startsWith("mid") ? "mid" : "front";
    const col = zone.includes("left") ? "left" : zone.includes("right") ? "right" : "center";
    species.push({ num: i + 1, name: p.name, color: cM[p.color] || "#6aa858", qty: p.quantity || 3, hcm: h, scm: p.spread_cm || Math.round(h * 0.6), row, col, zone });'''

if old_species in img_content:
    img_content = img_content.replace(old_species, new_species)
    print("SUCCESS: Updated species building to use zones")
else:
    print("WARNING: Could not find species building block")

# Update the zone placement algorithm to use column positions
old_zone_algo = '''    for (const rowName of ["back", "mid", "front"] as const) {
      const rowSpecies = byRow[rowName];
      if (rowSpecies.length === 0) continue;
      const band = rows[rowName];
      const totalWeight = rowSpecies.reduce((s, sp) => s + sp.qty * Math.max(sp.scm, 30), 0);
      let xCursor = bedX + 15;
      const availW = bedW - 30;

      for (const sp of rowSpecies) {
        const weight = (sp.qty * Math.max(sp.scm, 30)) / totalWeight;
        const zoneW = Math.max(50, availW * weight);
        const zoneCX = xCursor + zoneW / 2;
        const zoneCY = (band.yMin + band.yMax) / 2;'''

new_zone_algo = '''    for (const rowName of ["back", "mid", "front"] as const) {
      const rowSpecies = byRow[rowName];
      if (rowSpecies.length === 0) continue;
      const band = rows[rowName];
      const availW = bedW - 30;
      const thirdW = availW / 3;

      // Sort species by column: left first, then center, then right
      const colOrder: Record<string, number> = { left: 0, center: 1, right: 2 };
      rowSpecies.sort((a: any, b: any) => (colOrder[a.col] || 1) - (colOrder[b.col] || 1));

      for (const sp of rowSpecies) {
        // Position based on column assignment
        const colX = sp.col === "left" ? 0 : sp.col === "right" ? 2 : 1;
        const zoneXStart = bedX + 15 + colX * thirdW;
        const zoneW = thirdW;
        const zoneCX = zoneXStart + zoneW / 2;
        const zoneCY = (band.yMin + band.yMax) / 2;'''

if old_zone_algo in img_content:
    img_content = img_content.replace(old_zone_algo, new_zone_algo)
    print("SUCCESS: Updated zone placement to use column positions")
else:
    print("WARNING: Could not find zone placement algorithm")

# Update the xCursor line since we no longer use it
old_xcursor = "        xCursor += zoneW;"
new_xcursor = "        // Zone placement complete"
img_content = img_content.replace(old_xcursor, new_xcursor)

# Update the legend to show zone instead of row
old_legend_row = '''    const rowLabel = sp.row === "back" ? "bak" : sp.row === "mid" ? "mitt" : "fram";
    s += '<text x="'+(legX+32)+'" y="'+(y+13)+'" font-size="8.5" fill="#888">'+sp.qty+'st \\u00b7 '+sp.hcm+'cm \\u00b7 '+rowLabel+'</text>';'''

new_legend_row = '''    const zoneLabel = (sp.zone || sp.row || "").replace("back-", "bak ").replace("mid-", "mitt ").replace("front-", "fram ").replace("left", "vä").replace("center", "mitt").replace("right", "hö");
    s += '<text x="'+(legX+32)+'" y="'+(y+13)+'" font-size="8.5" fill="#888">'+sp.qty+'st \\u00b7 '+sp.hcm+'cm \\u00b7 '+zoneLabel+'</text>';'''

if old_legend_row in img_content:
    img_content = img_content.replace(old_legend_row, new_legend_row)
    print("SUCCESS: Updated legend labels")
else:
    print("WARNING: Could not find legend row label")

with open("src/app/api/generate-image/route.ts", "w") as f:
    f.write(img_content)

print("\nDone! Now build and test.")
