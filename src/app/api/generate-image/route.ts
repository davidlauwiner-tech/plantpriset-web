import { NextResponse } from "next/server";

export const maxDuration = 120;

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  let plants: any[], style: string, space: string, sun: string, length: string, width: string, title: string;
  let parsedLayout: any[] = [];
  let photoBuffer: Buffer | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    plants = JSON.parse(formData.get("plants") as string || "[]");
    parsedLayout = JSON.parse(formData.get("layout") as string || "[]");
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
    parsedLayout = body.layout || [];
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

      // Step 2: gpt-image-1 edits the photo with positioned plants
      const sorted = [...plants].sort((a: any, b: any) => b.height_cm - a.height_cm);
      const backP = sorted.filter((p: any) => p.height_cm > 60);
      const midP = sorted.filter((p: any) => p.height_cm >= 25 && p.height_cm <= 60);
      const frontP = sorted.filter((p: any) => p.height_cm < 25);
      if (frontP.length === 0 && midP.length > 1) frontP.push(midP.pop()!);
      if (midP.length === 0 && backP.length > 2) midP.push(backP.pop()!);

      // Build position descriptions matching the diagram layout
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
        (frontP.length ? "FRONT ROW (shortest, at the edge): " + describeRow(frontP, frontPositions) + ". " : "");

      const editPrompt =
        "Edit this garden photo to show a beautiful " + (styleDescriptions[style] || "romantic") + " style planting in the garden bed area. " +
        "Place these plants in specific positions: " + plantLayout +
        "IMPORTANT: Keep all surroundings, structures, trees, rocks, and background EXACTLY as they are. " +
        "Only add plants to the planting bed area. Fill the entire bed with plants, no bare soil visible. " +
        "Add small, elegant text labels with each plant name. " +
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

    // Step 3: Use algorithmic layout — consistent with image prompt ordering
    // Both image and diagram use same back-to-front height sorting
    // Skipping GPT-4o vision analysis as it produces inconsistent results
    let aiLayout: any[] = [];

    const diagram = generatePlantingDiagram(plants, parseFloat(length) || 3, parseFloat(width) || 1.5, style, bedShape, bedOutline, parsedLayout);

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

function generatePlantingDiagram(plants: any[], lengthM: number, widthM: number, style: string, bedShape: string, bedOutline: number[][] | null = null, layout: any[] = []): string {
  const W = 780, H = 520, legendW = 190;
  const bedX = 20, bedY = 60, bedW = W - legendW - 40, bedH = H - bedY - 45;

  const cM: Record<string, string> = {
    "Lila": "#9b7bb8", "Violett": "#8868a8", "Rosa": "#d4899e", "Pink": "#d4899e",
    "Vit": "#b8b8ac", "Vitt": "#b8b8ac", "Bl\u00e5": "#7098c8", "Gul": "#c8b040",
    "R\u00f6d": "#c85050", "Orange": "#c89040", "Gr\u00f6n": "#6aa858",
  };

  let seed = 42;
  function rand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

  function getBedPath(): string {
    const x = bedX, y = bedY, w = bedW, h = bedH, r = 18;
    if (bedOutline && bedOutline.length >= 4) {
      const pts = bedOutline.map(([px, py]: number[]) => [x + (px / 100) * w, y + (py / 100) * h]);
      let d = "M" + pts[0][0].toFixed(1) + "," + pts[0][1].toFixed(1);
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i - 1], c = pts[i], n = pts[(i + 1) % pts.length];
        d += " Q" + (c[0] + (n[0] - p[0]) * 0.15).toFixed(1) + "," + (c[1] + (n[1] - p[1]) * 0.15).toFixed(1) + " " + c[0].toFixed(1) + "," + c[1].toFixed(1);
      }
      return d + " Z";
    }
    return "M"+(x+r)+","+y+" L"+(x+w-r)+","+y+" Q"+(x+w)+","+y+" "+(x+w)+","+(y+r)+" L"+(x+w)+","+(y+h-r)+" Q"+(x+w)+","+(y+h)+" "+(x+w-r)+","+(y+h)+" L"+(x+r)+","+(y+h)+" Q"+x+","+(y+h)+" "+x+","+(y+h-r)+" L"+x+","+(y+r)+" Q"+x+","+y+" "+(x+r)+","+y+" Z";
  }

  // Sort plants tallest first
  const sorted = [...plants].sort((a: any, b: any) => b.height_cm - a.height_cm);
  interface Species { num: number; name: string; color: string; qty: number; hcm: number; scm: number; row: string; }
  const species: Species[] = [];
  sorted.forEach((p: any, i: number) => {
    const h = p.height_cm;
    const row = h > 70 ? "back" : h > 35 ? "mid" : "front";
    species.push({ num: i + 1, name: p.name, color: cM[p.color] || "#6aa858", qty: p.quantity || 3, hcm: h, scm: p.spread_cm || Math.round(h * 0.6), row });
  });

  // Build a mapping from original plant index to species number
  // The AI returns plant_index based on original order, we need to map to sorted order
  const originalOrder = [...plants];
  const indexMap: Record<number, number> = {};
  originalOrder.forEach((op: any, oi: number) => {
    const si = sorted.findIndex((sp: any) => sp.name === op.name && sp.latin === op.latin);
    if (si >= 0) indexMap[oi] = si + 1; // species num is 1-based
  });

  interface Circle { x: number; y: number; r: number; num: number; }
  const circles: Circle[] = [];

  {
    // FALLBACK: algorithmic zone-based layout
    const pxPerM = bedW / lengthM;
    const rows: Record<string, { yMin: number; yMax: number }> = {
      back:  { yMin: bedY + 15, yMax: bedY + bedH * 0.35 },
      mid:   { yMin: bedY + bedH * 0.30, yMax: bedY + bedH * 0.68 },
      front: { yMin: bedY + bedH * 0.62, yMax: bedY + bedH - 15 },
    };
    const byRow: Record<string, Species[]> = { back: [], mid: [], front: [] };
    for (const sp of species) byRow[sp.row].push(sp);

    function pointInBed(px: number, py: number, margin: number = 10): boolean {
      if (bedOutline && bedOutline.length >= 4) {
        const pts = bedOutline.map(([bx, by]: number[]) => [bedX + (bx / 100) * bedW, bedY + (by / 100) * bedH]);
        let ins = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const [xi, yi] = pts[i], [xj, yj] = pts[j];
          if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) ins = !ins;
        }
        return ins;
      }
      return px > bedX + margin && px < bedX + bedW - margin && py > bedY + margin && py < bedY + bedH - margin;
    }

    for (const rowName of ["back", "mid", "front"] as const) {
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
        const zoneCY = (band.yMin + band.yMax) / 2;
        const spreadPx = (sp.scm / 100) * (bedW / lengthM);
        const r = Math.max(10, Math.min(spreadPx / 2, (band.yMax - band.yMin) / 2.5, zoneW / 3));
        const placed: Circle[] = [];

        for (let q = 0; q < sp.qty; q++) {
          if (q === 0) {
            if (pointInBed(zoneCX, zoneCY, 5)) {
              const c = { x: zoneCX, y: zoneCY, r, num: sp.num };
              placed.push(c); circles.push(c);
            }
            continue;
          }
          let bestX = 0, bestY = 0, bestScore = -Infinity;
          for (let a = 0; a < 80; a++) {
            const anchor = placed[Math.floor(rand() * placed.length)];
            const angle = rand() * Math.PI * 2;
            const dist = (anchor.r + r) * (0.82 + rand() * 0.25);
            const cx = anchor.x + Math.cos(angle) * dist;
            const cy = anchor.y + Math.sin(angle) * dist;
            if (!pointInBed(cx, cy, 5)) continue;
            if (cx < xCursor - r * 0.3 || cx > xCursor + zoneW + r * 0.3) continue;
            if (cy < band.yMin - r * 0.2 || cy > band.yMax + r * 0.2) continue;
            let score = -Math.abs(cx - zoneCX) * 0.2 - Math.abs(cy - zoneCY) * 0.2;
            let blocked = false;
            for (const oc of circles) {
              if (oc.num === sp.num) continue;
              if (Math.sqrt((cx - oc.x) ** 2 + (cy - oc.y) ** 2) < (r + oc.r) * 0.65) { blocked = true; break; }
            }
            if (blocked) continue;
            for (const sc of placed) {
              if (Math.sqrt((cx - sc.x) ** 2 + (cy - sc.y) ** 2) < (r + sc.r) * 1.4) score += 20;
            }
            if (score > bestScore) { bestScore = score; bestX = cx; bestY = cy; }
          }
          if (bestScore > -Infinity) {
            const c = { x: bestX, y: bestY, r, num: sp.num };
            placed.push(c); circles.push(c);
          }
        }
        xCursor += zoneW;
      }
    }

  // SVG
  const shapeLabels: Record<string, string> = {
    rectangle: "Rektangul\u00e4r rabatt", kidney: "Njurformad rabatt", oval: "Oval rabatt",
    circular: "Rund rabatt", curved: "Sv\u00e4ngd rabatt", "L-shaped": "L-formad rabatt",
    triangular: "Triangul\u00e4r rabatt", "narrow-strip": "Smal remsa", irregular: "Friform rabatt"
  };

  let s = '<svg viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg" style="font-family:system-ui,sans-serif">';
  s += '<rect width="100%" height="100%" fill="#fafaf5"/>';
  s += '<text x="'+(bedX+bedW/2)+'" y="24" text-anchor="middle" font-size="15" font-weight="700" fill="#333">Planteringsplan '+lengthM+'m \u00d7 '+widthM+'m</text>';
  s += '<text x="'+(bedX+bedW/2)+'" y="42" text-anchor="middle" font-size="10" fill="#999">'+(shapeLabels[bedShape]||"Rabatt")+' \u00b7 H\u00f6ga bak \u2192 L\u00e5ga fram</text>';
  s += '<path d="'+getBedPath()+'" fill="#f0ede6" stroke="#a8a090" stroke-width="2"/>';

  // Row dividers
  const backMidY = bedY + bedH * 0.33;
  const midFrontY = bedY + bedH * 0.65;
  s += '<line x1="'+(bedX+12)+'" y1="'+backMidY.toFixed(0)+'" x2="'+(bedX+bedW-12)+'" y2="'+backMidY.toFixed(0)+'" stroke="#d0ccc0" stroke-width="0.5" stroke-dasharray="4,4"/>';
  s += '<line x1="'+(bedX+12)+'" y1="'+midFrontY.toFixed(0)+'" x2="'+(bedX+bedW-12)+'" y2="'+midFrontY.toFixed(0)+'" stroke="#d0ccc0" stroke-width="0.5" stroke-dasharray="4,4"/>';

  // Circles
  const sortedC = [...circles].sort((a, b) => a.y - b.y);
  for (const c of sortedC) {
    const sp = species.find(s => s.num === c.num);
    if (!sp) continue;
    s += '<circle cx="'+c.x.toFixed(1)+'" cy="'+c.y.toFixed(1)+'" r="'+c.r.toFixed(1)+'" fill="'+sp.color+'" fill-opacity="0.22" stroke="'+sp.color+'" stroke-width="2" stroke-opacity="0.6"/>';
    const fs = c.r > 28 ? 16 : c.r > 20 ? 14 : c.r > 14 ? 12 : 10;
    s += '<text x="'+c.x.toFixed(1)+'" y="'+(c.y+fs*0.35).toFixed(1)+'" text-anchor="middle" font-size="'+fs+'" font-weight="700" fill="#444">'+sp.num+'</text>';
  }

  // Scale
  s += '<line x1="'+bedX+'" y1="'+(H-18)+'" x2="'+(bedX+bedW)+'" y2="'+(H-18)+'" stroke="#bbb" stroke-width="0.8"/>';
  s += '<line x1="'+bedX+'" y1="'+(H-22)+'" x2="'+bedX+'" y2="'+(H-14)+'" stroke="#bbb" stroke-width="0.8"/>';
  s += '<line x1="'+(bedX+bedW)+'" y1="'+(H-22)+'" x2="'+(bedX+bedW)+'" y2="'+(H-14)+'" stroke="#bbb" stroke-width="0.8"/>';
  s += '<text x="'+(bedX+bedW/2)+'" y="'+(H-5)+'" text-anchor="middle" font-size="10" fill="#aaa">\u2190 '+lengthM+' m \u2192</text>';
  const totalP = species.reduce((s,sp) => s + sp.qty, 0);
  s += '<text x="'+(bedX+bedW)+'" y="'+(H-5)+'" text-anchor="end" font-size="9" fill="#bbb">'+totalP+' plantor</text>';

  // Legend
  const legX = bedX + bedW + 30, legY = bedY - 5;
  s += '<text x="'+legX+'" y="'+(legY+5)+'" font-size="13" font-weight="700" fill="#333">V\u00e4xtlista</text>';
  s += '<line x1="'+legX+'" y1="'+(legY+14)+'" x2="'+(legX+legendW-20)+'" y2="'+(legY+14)+'" stroke="#e0ddd5" stroke-width="0.8"/>';
  species.forEach((sp, i) => {
    const y = legY + 32 + i * 34;
    s += '<circle cx="'+(legX+14)+'" cy="'+(y+2)+'" r="12" fill="'+sp.color+'" fill-opacity="0.22" stroke="'+sp.color+'" stroke-width="1.5"/>';
    s += '<text x="'+(legX+14)+'" y="'+(y+6)+'" text-anchor="middle" font-size="11" font-weight="800" fill="#444">'+sp.num+'</text>';
    s += '<text x="'+(legX+32)+'" y="'+y+'" font-size="10" font-weight="600" fill="#333">'+sp.name+'</text>';
    const rowLabel = sp.row === "back" ? "bak" : sp.row === "mid" ? "mitt" : "fram";
    s += '<text x="'+(legX+32)+'" y="'+(y+13)+'" font-size="8.5" fill="#888">'+sp.qty+'st \u00b7 '+sp.hcm+'cm \u00b7 '+rowLabel+'</text>';
  });

  s += '</svg>';
  return s;
}
