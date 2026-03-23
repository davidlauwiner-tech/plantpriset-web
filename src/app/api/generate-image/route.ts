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
  const sorted = [...plants].sort((a, b) => b.height_cm - a.height_cm);
  const backRow = sorted.filter(p => p.height_cm > 60);
  const midRow = sorted.filter(p => p.height_cm >= 25 && p.height_cm <= 60);
  const frontRow = sorted.filter(p => p.height_cm < 25);
  if (frontRow.length === 0 && midRow.length > 2) frontRow.push(...midRow.splice(Math.floor(midRow.length/2)));
  if (midRow.length === 0 && backRow.length > 2) midRow.push(...backRow.splice(Math.floor(backRow.length/2)));

  const W = 700, H = 440, pX = 60, pT = 55, bW = W - pX * 2, bH = H - pT - 65;

  const cM: Record<string,string> = {
    "Lila":"#9b6bae","Violett":"#8b5fa3","Rosa":"#d4829a","Pink":"#e07090",
    "Vit":"#d8d8c8","Vitt":"#d8d8c8","Blå":"#6b8fc0","Gul":"#d4b840",
    "Röd":"#c85050","Orange":"#d49040","Grön":"#6aaa5a"
  };

  // Generate bed outline path based on shape
  function bedPath(): string {
    const x = pX, y = pT, w = bW, h = bH;
    const r = 16;
    // Use custom outline from GPT-4o vision if available
    if (bedOutline && bedOutline.length >= 4) {
      const pts = bedOutline.map(([px, py]) => [x + (px / 100) * w, y + (py / 100) * h]);
      let d = "M" + pts[0][0] + "," + pts[0][1];
      for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1];
        const curr = pts[i];
        const next = pts[(i + 1) % pts.length];
        const cpx = curr[0] + (next[0] - prev[0]) * 0.15;
        const cpy = curr[1] + (next[1] - prev[1]) * 0.15;
        d += " Q" + cpx + "," + cpy + " " + curr[0] + "," + curr[1];
      }
      d += " Z";
      return d;
    }
    switch (bedShape) {
      case "kidney":
        return "M" + (x+r) + "," + y +
          " Q" + (x+w*0.3) + "," + (y-15) + " " + (x+w*0.5) + "," + y +
          " Q" + (x+w*0.7) + "," + (y+15) + " " + (x+w-r) + "," + y +
          " Q" + (x+w) + "," + y + " " + (x+w) + "," + (y+r) +
          " L" + (x+w) + "," + (y+h-r) +
          " Q" + (x+w) + "," + (y+h) + " " + (x+w-r) + "," + (y+h) +
          " Q" + (x+w*0.6) + "," + (y+h+10) + " " + (x+w*0.4) + "," + (y+h) +
          " Q" + (x+w*0.2) + "," + (y+h-10) + " " + (x+r) + "," + (y+h) +
          " Q" + x + "," + (y+h) + " " + x + "," + (y+h-r) +
          " L" + x + "," + (y+r) +
          " Q" + x + "," + y + " " + (x+r) + "," + y + " Z";
      case "oval":
      case "circular":
        return "M" + (x+w/2) + "," + y +
          " C" + (x+w) + "," + y + " " + (x+w) + "," + (y+h) + " " + (x+w/2) + "," + (y+h) +
          " C" + x + "," + (y+h) + " " + x + "," + y + " " + (x+w/2) + "," + y + " Z";
      case "curved":
        return "M" + (x+r) + "," + y +
          " L" + (x+w-r) + "," + y +
          " Q" + (x+w) + "," + y + " " + (x+w) + "," + (y+r) +
          " Q" + (x+w+15) + "," + (y+h*0.5) + " " + (x+w) + "," + (y+h-r) +
          " Q" + (x+w) + "," + (y+h) + " " + (x+w-r) + "," + (y+h) +
          " L" + (x+r) + "," + (y+h) +
          " Q" + x + "," + (y+h) + " " + x + "," + (y+h-r) +
          " Q" + (x-15) + "," + (y+h*0.5) + " " + x + "," + (y+r) +
          " Q" + x + "," + y + " " + (x+r) + "," + y + " Z";
      case "L-shaped":
        return "M" + x + "," + y +
          " L" + (x+w*0.6) + "," + y +
          " L" + (x+w*0.6) + "," + (y+h*0.45) +
          " L" + (x+w) + "," + (y+h*0.45) +
          " L" + (x+w) + "," + (y+h) +
          " L" + x + "," + (y+h) + " Z";
      case "triangular":
        return "M" + (x+w/2) + "," + y +
          " L" + (x+w) + "," + (y+h) +
          " L" + x + "," + (y+h) + " Z";
      case "narrow-strip":
        return "M" + (x+r) + "," + (y+h*0.25) +
          " L" + (x+w-r) + "," + y +
          " Q" + (x+w) + "," + y + " " + (x+w) + "," + (y+r) +
          " L" + (x+w-r) + "," + (y+h) +
          " L" + (x+r) + "," + (y+h*0.75) +
          " Q" + x + "," + (y+h*0.7) + " " + x + "," + (y+h*0.6) + " Z";
      case "irregular":
        return "M" + (x+w*0.1) + "," + (y+h*0.1) +
          " Q" + (x+w*0.3) + "," + (y-10) + " " + (x+w*0.6) + "," + (y+h*0.05) +
          " Q" + (x+w*0.85) + "," + (y+h*0.1) + " " + (x+w*0.95) + "," + (y+h*0.3) +
          " Q" + (x+w+5) + "," + (y+h*0.6) + " " + (x+w*0.9) + "," + (y+h*0.85) +
          " Q" + (x+w*0.7) + "," + (y+h+10) + " " + (x+w*0.4) + "," + (y+h*0.95) +
          " Q" + (x+w*0.15) + "," + (y+h*0.9) + " " + (x+w*0.05) + "," + (y+h*0.65) +
          " Q" + (x-5) + "," + (y+h*0.4) + " " + (x+w*0.1) + "," + (y+h*0.1) + " Z";
      default: // rectangle
        return "M" + (x+r) + "," + y +
          " L" + (x+w-r) + "," + y +
          " Q" + (x+w) + "," + y + " " + (x+w) + "," + (y+r) +
          " L" + (x+w) + "," + (y+h-r) +
          " Q" + (x+w) + "," + (y+h) + " " + (x+w-r) + "," + (y+h) +
          " L" + (x+r) + "," + (y+h) +
          " Q" + x + "," + (y+h) + " " + x + "," + (y+h-r) +
          " L" + x + "," + (y+r) +
          " Q" + x + "," + y + " " + (x+r) + "," + y + " Z";
    }
  }

  function pc(row: any[], yC: number, rowH: number): string {
    if (!row.length) return "";
    let o = "";
    // Calculate circle size to fill the row densely
    const totalPlants = row.reduce((s: number, p: any) => s + Math.min(p.quantity, 15), 0);
    const baseR = Math.min(26, Math.max(10, bW / (totalPlants + 1) / 1.4));
    
    const spacing = bW / (row.length + 1);
    row.forEach((p: any, idx: number) => {
      const qty = Math.min(p.quantity, 15);
      const r = Math.min(baseR + 2, Math.max(8, p.height_cm / 6));
      const f = cM[p.color] || "#6aaa5a";
      const clusterW = r * 2 * Math.ceil(Math.sqrt(qty));
      const groupCx = pX + spacing * (idx + 1);
      
      // Pack circles in a dense organic cluster that fills the space
      for (let q = 0; q < qty; q++) {
        const angle = (q / qty) * Math.PI * 2 + (q * 0.8);
        const ring = q < 1 ? 0 : Math.ceil(q / 4);
        const dist = ring * r * 0.95;
        const cx = groupCx + Math.cos(angle) * dist + (Math.random() - 0.5) * r * 0.5;
        const cy = yC + Math.sin(angle) * dist * 1.3 + (Math.random() - 0.5) * r * 0.6;
        const cr = r * (0.85 + Math.random() * 0.3);
        o += "<circle cx=\""+cx.toFixed(1)+"\" cy=\""+cy.toFixed(1)+"\" r=\""+cr.toFixed(1)+"\" fill=\""+f+"\" fill-opacity=\""+(0.5 + Math.random()*0.3).toFixed(2)+"\" stroke=\""+f+"\" stroke-width=\"0.8\"/>";
      }
      // Label
      o += "<text x=\""+groupCx.toFixed(1)+"\" y=\""+(yC + r * 2 + 12).toFixed(1)+"\" text-anchor=\"middle\" font-size=\"8\" font-weight=\"500\" fill=\"#444\">"+p.name+"</text>";
      o += "<text x=\""+groupCx.toFixed(1)+"\" y=\""+(yC + r * 2 + 21).toFixed(1)+"\" text-anchor=\"middle\" font-size=\"7\" fill=\"#888\">"+p.quantity+"st</text>";
      
      // evenly spaced
    });
    return o;
  }

  const bY = pT + bH * 0.2, mY = pT + bH * 0.5, fY = pT + bH * 0.8;

  const shapeLabels: Record<string,string> = {
    rectangle: "Rektangulär rabatt", kidney: "Njurformad rabatt", oval: "Oval rabatt",
    circular: "Rund rabatt", curved: "Svängd rabatt", "L-shaped": "L-formad rabatt",
    triangular: "Triangulär rabatt", "narrow-strip": "Smal remsa", irregular: "Friform rabatt"
  };

  let s = '<svg viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg">';
  s += '<rect width="100%" height="100%" fill="#fafaf5"/>';

  // Bed shape
  s += '<path d="'+bedPath()+'" fill="#f0ede4" stroke="#c5c0b0" stroke-width="1.5" stroke-dasharray="6,3"/>';

  // Row labels
  s += '<text x="'+(pX-8)+'" y="'+bY+'" text-anchor="end" font-size="10" fill="#888" dominant-baseline="middle">Bak</text>';
  if (midRow.length > 0) s += '<text x="'+(pX-8)+'" y="'+mY+'" text-anchor="end" font-size="10" fill="#888" dominant-baseline="middle">Mitt</text>';
  s += '<text x="'+(pX-8)+'" y="'+fY+'" text-anchor="end" font-size="10" fill="#888" dominant-baseline="middle">Fram</text>';

  // Row dividers
  s += '<line x1="'+pX+'" y1="'+(pT+bH*0.35)+'" x2="'+(pX+bW)+'" y2="'+(pT+bH*0.35)+'" stroke="#d5d0c5" stroke-dasharray="4,4"/>';
  s += '<line x1="'+pX+'" y1="'+(pT+bH*0.65)+'" x2="'+(pX+bW)+'" y2="'+(pT+bH*0.65)+'" stroke="#d5d0c5" stroke-dasharray="4,4"/>';

  // Plants
  s += pc(backRow, bY, bH*0.3); s += pc(midRow, mY, bH*0.3); s += pc(frontRow, fY, bH*0.3);

  // Title with shape info
  s += '<text x="'+(W/2)+'" y="20" text-anchor="middle" font-size="14" font-weight="600" fill="#333">Planteringsplan '+lengthM+'m x '+widthM+'m</text>';
  s += '<text x="'+(W/2)+'" y="36" text-anchor="middle" font-size="10" fill="#888">'+(shapeLabels[bedShape] || "Rabatt")+' · Höga bak → Låga fram</text>';

  // Dimension
  s += '<text x="'+(W/2)+'" y="'+(H-8)+'" text-anchor="middle" font-size="10" fill="#aaa">'+lengthM+' m</text>';
  s += '<line x1="'+pX+'" y1="'+(H-16)+'" x2="'+(pX+bW)+'" y2="'+(H-16)+'" stroke="#ccc" stroke-width="0.5"/>';

  s += '</svg>';
  return s;
}
