import { NextResponse } from "next/server";

export const maxDuration = 120;

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  let plants: any[], style: string, space: string, sun: string, length: string, width: string, title: string;
  let photoBuffer: Buffer | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    plants = JSON.parse(formData.get("plants") as string || "[]");
    style = formData.get("style") as string || "";
    space = formData.get("space") as string || "";
    sun = formData.get("sun") as string || "";
    length = formData.get("length") as string || "";
    width = formData.get("width") as string || "";
    title = formData.get("title") as string || "";

    const photoFile = formData.get("photo") as File | null;
    if (photoFile) {
      const buffer = await photoFile.arrayBuffer();
      photoBuffer = Buffer.from(buffer);
    }
  } else {
    const body = await request.json();
    plants = body.plants || [];
    style = body.style || "";
    space = body.space || "";
    sun = body.sun || "";
    length = body.length || "";
    width = body.width || "";
    title = body.title || "";
  }

  const plantList = plants.map((p: any) =>
    p.name + " (" + p.latin + ", " + p.color + ", " + p.height_cm + "cm)"
  ).join(", ");

  const styleDescriptions: Record<string, string> = {
    romantic: "soft pastel colors, roses, lavender, dreamy and lush, cottage garden feel",
    modern: "clean lines, ornamental grasses, white flowers, minimalist Scandinavian design",
    natural: "wildflower meadow, prairie grasses, natural and organic, Swedish countryside",
    cottage: "mixed perennials, hollyhocks, lupins, colorful English cottage garden",
  };

  const spaceDescriptions: Record<string, string> = {
    rabatt: "garden bed",
    balkong: "balcony with pots and planters",
    pallkrage: "raised wooden pallet collar bed",
  };

  try {
    let imageUrl: string | undefined;
    let editDebug: any = null;
    let bedShape = "rectangle";
    let bedOutline: number[][] | null = null;

    if (photoBuffer) {
      // Step 1: GPT-4o analyzes photo for bed shape
      const photoBase64 = photoBuffer.toString("base64");
      try {
        const visionRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + (process.env.OPENAI_API_KEY || ""),
          },
          body: JSON.stringify({
            model: "gpt-4o",
            max_tokens: 300,
            messages: [{
              role: "user",
              content: [
                { type: "image_url", image_url: { url: "data:image/jpeg;base64," + photoBase64, detail: "low" } },
                { type: "text", text: "Look at this garden photo. Identify the planting bed or planting area.\n\n1. Pick the closest shape: rectangle, kidney, L-shaped, curved, triangular, circular, oval, irregular, narrow-strip\n2. Trace the outline of the bed as 8-12 points on a normalized 0-100 coordinate grid (top-left = 0,0, bottom-right = 100,100)\n\nRespond ONLY with JSON:\n{\"shape\": \"irregular\", \"description\": \"Brief description\", \"outline\": [[10,15],[40,5],[80,10],[95,30],[90,70],[70,95],[30,90],[5,60]]}" }
              ]
            }]
          }),
        });
        const visionData = await visionRes.json();
        const visionText = visionData.choices?.[0]?.message?.content || "";
        try {
          const clean = visionText.replace(/```json|```/g, "").trim();
          const parsed = JSON.parse(clean);
          bedShape = parsed.shape || "rectangle";
          if (parsed.outline && Array.isArray(parsed.outline)) {
            bedOutline = parsed.outline;
          }
        } catch { bedShape = "irregular"; }
      } catch (e) { console.log("Vision shape detection failed:", e); }

      // Step 2: gpt-image-1 edits the photo with labeled plants
      const tallPlants = plants.filter((p: any) => p.height_cm > 60).map((p: any) => p.name).join(", ");
      const midPlants = plants.filter((p: any) => p.height_cm >= 30 && p.height_cm <= 60).map((p: any) => p.name).join(", ");
      const lowPlants = plants.filter((p: any) => p.height_cm < 30).map((p: any) => p.name).join(", ");

      const editPrompt =
        "Edit this garden photo to show the planting area filled with beautiful, healthy plants in " +
        (styleDescriptions[style] || "romantic") + " style. " +
        "Add these specific plants to the existing garden bed or planting area: " +
        (tallPlants ? "Tall plants in the back: " + tallPlants + ". " : "") +
        (midPlants ? "Medium plants in the middle: " + midPlants + ". " : "") +
        (lowPlants ? "Low plants at the front edge: " + lowPlants + ". " : "") +
        "Keep the surrounding environment exactly as it is. " +
        "Only add plants to the garden bed area. " +
        "Add small, elegant white text labels with each plant name next to each plant, similar to a professional landscape design plan. " +
        "The labels should have a subtle semi-transparent dark background for readability. " +
        "The plants should look natural and in full summer bloom. " +
        "Swedish summer daylight. Photorealistic result.";

      const editFormData = new FormData();
      const photoBlob = new Blob([new Uint8Array(photoBuffer)], { type: "image/jpeg" });
      editFormData.append("image", photoBlob, "garden.jpg");
      editFormData.append("model", "gpt-image-1");
      editFormData.append("prompt", editPrompt);

      const editResponse = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + (process.env.OPENAI_API_KEY || ""),
        },
        body: editFormData,
      });

      const editData = await editResponse.json();

      if (editData.error) {
        editDebug = editData.error;
        imageUrl = await generateWithDalle3(plantList, style, space, length, width, styleDescriptions, spaceDescriptions);
      } else {
        const b64 = editData.data?.[0]?.b64_json;
        if (b64) {
          imageUrl = "data:image/png;base64," + b64;
        }
      }
    } else {
      imageUrl = await generateWithDalle3(plantList, style, space, length, width, styleDescriptions, spaceDescriptions);
    }

    // Generate SVG planting diagram with detected shape
    const diagram = generatePlantingDiagram(plants, parseFloat(length) || 3, parseFloat(width) || 1.5, style, bedShape, bedOutline);

    return NextResponse.json({ imageUrl, diagram, editDebug, bedShape, bedOutline });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function generateWithDalle3(
  plantList: string, style: string, space: string,
  length: string, width: string,
  styleDescriptions: Record<string, string>,
  spaceDescriptions: Record<string, string>
): Promise<string | undefined> {
  const prompt =
    "A beautiful watercolor botanical illustration of a Swedish " + (spaceDescriptions[space] || "garden bed") + " viewed from a slight angle, " +
    (styleDescriptions[style] || "romantic garden") + ". " +
    "The bed is " + length + "m x " + width + "m. " +
    "Plants included: " + plantList + ". " +
    "Tall plants in the back, medium in the middle, low plants in front. " +
    "Soft watercolor style. No people, no buildings.";

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + (process.env.OPENAI_API_KEY || ""),
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1792x1024",
      quality: "standard",
    }),
  });

  const data = await response.json();
  return data.data?.[0]?.url;
}

function generatePlantingDiagram(plants: any[], lengthM: number, widthM: number, style: string, bedShape: string, bedOutline: number[][] | null = null): string {
  const W = 700, H = 440, pX = 60, pT = 55, bW = W - pX * 2, bH = H - pT - 65;

  const cM: Record<string,string> = {
    "Lila":"#9b6bae","Violett":"#8b5fa3","Rosa":"#d4829a","Pink":"#e07090",
    "Vit":"#d8d8c8","Vitt":"#d8d8c8","Blå":"#6b8fc0","Gul":"#d4b840",
    "Röd":"#c85050","Orange":"#d49040","Grön":"#6aaa5a"
  };

  // Seeded random for consistent layout
  let seed = 42;
  function rand() { seed = (seed * 16807 + 0) % 2147483647; return (seed - 1) / 2147483646; }

  // Bed boundary path
  function getBedPath(): string {
    const x = pX, y = pT, w = bW, h = bH, r = 16;
    if (bedOutline && bedOutline.length >= 4) {
      const pts = bedOutline.map(([px, py]: number[]) => [x + (px / 100) * w, y + (py / 100) * h]);
      let d = "M" + pts[0][0].toFixed(1) + "," + pts[0][1].toFixed(1);
      for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1];
        const curr = pts[i];
        const next = pts[(i + 1) % pts.length];
        const cpx = curr[0] + (next[0] - prev[0]) * 0.15;
        const cpy = curr[1] + (next[1] - prev[1]) * 0.15;
        d += " Q" + cpx.toFixed(1) + "," + cpy.toFixed(1) + " " + curr[0].toFixed(1) + "," + curr[1].toFixed(1);
      }
      return d + " Z";
    }
    return "M"+(x+r)+","+y+" L"+(x+w-r)+","+y+" Q"+(x+w)+","+y+" "+(x+w)+","+(y+r)+" L"+(x+w)+","+(y+h-r)+" Q"+(x+w)+","+(y+h)+" "+(x+w-r)+","+(y+h)+" L"+(x+r)+","+(y+h)+" Q"+x+","+(y+h)+" "+x+","+(y+h-r)+" L"+x+","+(y+r)+" Q"+x+","+y+" "+(x+r)+","+y+" Z";
  }

  // Point-in-polygon (ray casting)
  function pointInBed(px: number, py: number): boolean {
    if (bedOutline && bedOutline.length >= 4) {
      const pts = bedOutline.map(([bx, by]: number[]) => [pX + (bx / 100) * bW, pT + (by / 100) * bH]);
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
      }
      return inside;
    }
    return px > pX + 8 && px < pX + bW - 8 && py > pT + 8 && py < pT + bH - 8;
  }

  // Sort: tallest first (go in back/top of diagram)
  const sorted = [...plants].sort((a: any, b: any) => b.height_cm - a.height_cm);

  interface PlantCircle { x: number; y: number; r: number; color: string; name: string; species: number; }
  const placed: PlantCircle[] = [];
  const speciesInfo: { name: string; color: string; count: number; cx: number; cy: number }[] = [];
  const maxH = Math.max(...sorted.map((p: any) => p.height_cm), 150);

  sorted.forEach((plant: any, si: number) => {
    const qty = Math.min(plant.quantity || 3, 15);
    const baseR = 8 + (plant.height_cm / maxH) * 16;
    const color = cM[plant.color] || "#6aaa5a";
    const heightRatio = plant.height_cm / maxH;
    const targetY = pT + bH * (0.15 + (1 - heightRatio) * 0.7);

    let groupCx = 0, groupCy = 0, groupN = 0;

    for (let q = 0; q < qty; q++) {
      let bestX = 0, bestY = 0, bestScore = -Infinity;

      for (let attempt = 0; attempt < 80; attempt++) {
        let cx: number, cy: number;
        if (q === 0) {
          cx = pX + 30 + rand() * (bW - 60);
          cy = targetY + (rand() - 0.5) * bH * 0.25;
        } else {
          const prev = placed.filter(p => p.species === si);
          const avgX = prev.reduce((s, p) => s + p.x, 0) / prev.length;
          const avgY = prev.reduce((s, p) => s + p.y, 0) / prev.length;
          cx = avgX + (rand() - 0.5) * baseR * 4;
          cy = avgY + (rand() - 0.5) * baseR * 4;
        }

        if (!pointInBed(cx, cy)) continue;

        let score = 0;
        score -= Math.abs(cy - targetY) * 0.3;

        for (const p of placed) {
          const d = Math.sqrt((cx - p.x) ** 2 + (cy - p.y) ** 2);
          const overlap = (p.r + baseR) - d;
          if (overlap > baseR * 0.5) score -= overlap * 8;
          else if (overlap > -2) score += 8; // Touching = ideal
          else if (d > baseR * 3) score -= 2; // Too far from others
        }

        const sameSpecies = placed.filter(p => p.species === si);
        for (const p of sameSpecies) {
          const d = Math.sqrt((cx - p.x) ** 2 + (cy - p.y) ** 2);
          if (d < baseR * 3.5) score += 12;
        }

        if (score > bestScore) { bestScore = score; bestX = cx; bestY = cy; }
      }

      if (bestScore > -Infinity) {
        placed.push({ x: bestX, y: bestY, r: baseR * (0.85 + rand() * 0.3), color, name: plant.name, species: si });
        groupCx += bestX; groupCy += bestY; groupN++;
      }
    }

    if (groupN > 0) {
      speciesInfo.push({ name: plant.name, color, count: groupN, cx: groupCx / groupN, cy: groupCy / groupN });
    }
  });

  // Build SVG
  const shapeLabels: Record<string,string> = {
    rectangle: "Rektangulär rabatt", kidney: "Njurformad rabatt", oval: "Oval rabatt",
    circular: "Rund rabatt", curved: "Svängd rabatt", "L-shaped": "L-formad rabatt",
    triangular: "Triangulär rabatt", "narrow-strip": "Smal remsa", irregular: "Friform rabatt"
  };

  let s = '<svg viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg">';
  s += '<rect width="100%" height="100%" fill="#fafaf5"/>';
  s += '<path d="'+getBedPath()+'" fill="#f0ede4" stroke="#c5c0b0" stroke-width="1.5" stroke-dasharray="6,3"/>';

  // Draw circles sorted by Y (back to front for natural overlap)
  const sortedPlaced = [...placed].sort((a, b) => a.y - b.y);
  for (const p of sortedPlaced) {
    const op = (0.45 + rand() * 0.25).toFixed(2);
    s += '<circle cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="'+p.r.toFixed(1)+'" fill="'+p.color+'" fill-opacity="'+op+'" stroke="'+p.color+'" stroke-opacity="0.6" stroke-width="0.8"/>';
  }

  // Species labels
  for (const sp of speciesInfo) {
    const ly = sp.cy + 22;
    s += '<text x="'+sp.cx.toFixed(1)+'" y="'+ly.toFixed(1)+'" text-anchor="middle" font-size="8" font-weight="600" fill="#444">'+sp.name+'</text>';
    s += '<text x="'+sp.cx.toFixed(1)+'" y="'+(ly+10).toFixed(1)+'" text-anchor="middle" font-size="7" fill="#888">'+sp.count+'st</text>';
  }

  // Title and dimensions
  s += '<text x="'+(W/2)+'" y="20" text-anchor="middle" font-size="14" font-weight="600" fill="#333">Planteringsplan '+lengthM+'m x '+widthM+'m</text>';
  s += '<text x="'+(W/2)+'" y="36" text-anchor="middle" font-size="10" fill="#888">'+(shapeLabels[bedShape] || "Rabatt")+' · Höga bak \u2192 Låga fram</text>';
  s += '<text x="'+(W/2)+'" y="'+(H-8)+'" text-anchor="middle" font-size="10" fill="#aaa">'+lengthM+' m</text>';
  s += '<line x1="'+pX+'" y1="'+(H-16)+'" x2="'+(pX+bW)+'" y2="'+(H-16)+'" stroke="#ccc" stroke-width="0.5"/>';
  s += '</svg>';
  return s;
}
