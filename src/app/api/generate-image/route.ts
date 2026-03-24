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
  const W=780,H=500,legendW=185;
  const bedX=12,bedY=55,bedW=W-legendW-30,bedH=H-bedY-40;
  const cM:Record<string,string>={"Lila":"#b088c0","Violett":"#9070a8","Rosa":"#e0a0b0","Pink":"#e08098","Vit":"#d5d5c5","Vitt":"#d5d5c5","Bl\u00e5":"#88aad0","Gul":"#d8c050","R\u00f6d":"#d06060","Orange":"#d8a050","Gr\u00f6n":"#80b870"};
  let seed=42;function rand(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646;}

  function getBedPath():string{const x=bedX,y=bedY,w=bedW,h=bedH,r=20;if(bedOutline&&bedOutline.length>=4){const pts=bedOutline.map(([px,py]:number[])=>[x+(px/100)*w,y+(py/100)*h]);let d="M"+pts[0][0].toFixed(1)+","+pts[0][1].toFixed(1);for(let i=1;i<pts.length;i++){const p=pts[i-1],c=pts[i],n=pts[(i+1)%pts.length];d+=" Q"+(c[0]+(n[0]-p[0])*0.15).toFixed(1)+","+(c[1]+(n[1]-p[1])*0.15).toFixed(1)+" "+c[0].toFixed(1)+","+c[1].toFixed(1);}return d+" Z";}return "M"+(x+r)+","+y+" L"+(x+w-r)+","+y+" Q"+(x+w)+","+y+" "+(x+w)+","+(y+r)+" L"+(x+w)+","+(y+h-r)+" Q"+(x+w)+","+(y+h)+" "+(x+w-r)+","+(y+h)+" L"+(x+r)+","+(y+h)+" Q"+x+","+(y+h)+" "+x+","+(y+h-r)+" L"+x+","+(y+r)+" Q"+x+","+y+" "+(x+r)+","+y+" Z";}

  // Sort tall first, assign to rows
  const sorted=[...plants].sort((a:any,b:any)=>b.height_cm-a.height_cm);
  const maxH=Math.max(...sorted.map((p:any)=>p.height_cm),150);
  interface Sp{num:number;name:string;color:string;qty:number;hcm:number;scm:number;}
  const species:Sp[]=[];
  const backP:Sp[]=[],midP:Sp[]=[],frontP:Sp[]=[];
  sorted.forEach((p:any,i:number)=>{
    const sp:Sp={num:i+1,name:p.name,color:cM[p.color]||"#80b870",qty:p.quantity||3,hcm:p.height_cm,scm:p.spread_cm||Math.round(p.height_cm*0.6)};
    species.push(sp);
    if(p.height_cm>60)backP.push(sp);else if(p.height_cm>=25)midP.push(sp);else frontP.push(sp);
  });
  if(frontP.length===0&&midP.length>1)frontP.push(midP.pop()!);
  if(midP.length===0&&backP.length>2)midP.push(backP.pop()!);
  if(midP.length<2&&backP.length>2)midP.push(backP.pop()!);
  if(midP.length<2&&frontP.length>2)midP.unshift(frontP.shift()!);

  // Place exact quantities in rows
  // Each row gets a horizontal band; within each band, species are placed as groups
  interface Placed{x:number;y:number;r:number;species:number;}
  const placed:Placed[]=[];
  const rowBands=[
    {plants:backP, yStart:bedY+25, yEnd:bedY+bedH*0.35},
    {plants:midP, yStart:bedY+bedH*0.35, yEnd:bedY+bedH*0.65},
    {plants:frontP, yStart:bedY+bedH*0.65, yEnd:bedY+bedH-25}
  ];

  for(const band of rowBands){
    if(!band.plants.length)continue;
    const bandH=band.yEnd-band.yStart;
    const bandCy=band.yStart+bandH/2;
    // Total circles in this row
    const totalInRow=band.plants.reduce((s,sp)=>s+sp.qty,0);
    // Calculate circle radius based on available space
    const maxR=Math.min(bedW/(totalInRow+1)/2, bandH/2.5, 22);

    const numSpecies=band.plants.length;
    const slotW=(bedW-30)/numSpecies;
    band.plants.forEach((sp,spIdx)=>{
      const cols=Math.ceil(Math.sqrt(sp.qty));
      const rows=Math.ceil(sp.qty/cols);
      const r=Math.min(maxR, maxR*(0.7+sp.hcm/maxH*0.4));
      const spacing=r*2.1;
      const groupStartX=bedX+15+slotW*spIdx+slotW/2-(cols*spacing)/2;

      let placed_count=0;
      for(let row=0;row<rows&&placed_count<sp.qty;row++){
        for(let col=0;col<cols&&placed_count<sp.qty;col++){
          const cx=groupStartX+col*spacing+(row%2)*spacing*0.3;
          const cy=bandCy-((rows-1)*spacing/2)+row*spacing;
          const jx=cx+(rand()-0.5)*r*0.3;
          const jy=cy+(rand()-0.5)*r*0.3;
          placed.push({x:jx,y:jy,r:r*(0.9+rand()*0.2),species:sp.num});
          placed_count++;
        }
      }
    });
  }

  // SVG
  const shapeLabels:Record<string,string>={rectangle:"Rektangul\u00e4r rabatt",kidney:"Njurformad rabatt",oval:"Oval rabatt",circular:"Rund rabatt",curved:"Sv\u00e4ngd rabatt","L-shaped":"L-formad rabatt",triangular:"Triangul\u00e4r rabatt","narrow-strip":"Smal remsa",irregular:"Friform rabatt"};
  let s='<svg viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg" style="font-family:system-ui,sans-serif">';
  s+='<rect width="100%" height="100%" fill="#fafaf5"/>';
  s+='<text x="'+(bedX+bedW/2)+'" y="22" text-anchor="middle" font-size="15" font-weight="700" fill="#333">Planteringsplan '+lengthM+'m \u00d7 '+widthM+'m</text>';
  s+='<text x="'+(bedX+bedW/2)+'" y="40" text-anchor="middle" font-size="10" fill="#999">'+(shapeLabels[bedShape]||"Rabatt")+' \u00b7 H\u00f6ga bak \u2192 L\u00e5ga fram</text>';
  s+='<path d="'+getBedPath()+'" fill="#f0ede8" stroke="#b5b0a0" stroke-width="2"/>';

  // Row labels
  s+='<text x="'+(bedX+bedW+5)+'" y="'+(bedY+bedH*0.17)+'" font-size="9" fill="#bbb">Bak</text>';
  s+='<text x="'+(bedX+bedW+5)+'" y="'+(bedY+bedH*0.5)+'" font-size="9" fill="#bbb">Mitt</text>';
  s+='<text x="'+(bedX+bedW+5)+'" y="'+(bedY+bedH*0.83)+'" font-size="9" fill="#bbb">Fram</text>';

  // Draw circles
  for(const p of placed){
    const sp=species.find(s=>s.num===p.species)!;
    s+='<circle cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="'+p.r.toFixed(1)+'" fill="'+sp.color+'" fill-opacity="0.3" stroke="'+sp.color+'" stroke-width="1.5" stroke-opacity="0.6"/>';
    s+='<text x="'+p.x.toFixed(1)+'" y="'+(p.y+4).toFixed(1)+'" text-anchor="middle" font-size="'+(p.r>14?12:9)+'" font-weight="700" fill="#555">'+sp.num+'</text>';
  }

  // Total count
  s+='<text x="'+(bedX+bedW/2)+'" y="'+(H-18)+'" text-anchor="middle" font-size="9" fill="#aaa">Totalt '+placed.length+' plantor</text>';
  s+='<line x1="'+bedX+'" y1="'+(H-8)+'" x2="'+(bedX+bedW)+'" y2="'+(H-8)+'" stroke="#bbb" stroke-width="0.8"/>';
  s+='<text x="'+(bedX+bedW/2)+'" y="'+(H-0)+'" text-anchor="middle" font-size="10" fill="#aaa">\u2190 '+lengthM+' m \u2192</text>';

  // Legend
  const legX=bedX+bedW+20,legY=bedY+bedH*0.25;
  s+='<text x="'+legX+'" y="'+(legY-12)+'" font-size="11" font-weight="700" fill="#333">V\u00e4xtlista</text>';
  s+='<line x1="'+legX+'" y1="'+(legY-5)+'" x2="'+(legX+legendW-10)+'" y2="'+(legY-5)+'" stroke="#ddd" stroke-width="0.5"/>';
  species.forEach((sp,i)=>{const y=legY+5+i*28;s+='<circle cx="'+(legX+10)+'" cy="'+(y+1)+'" r="9" fill="'+sp.color+'" fill-opacity="0.35" stroke="'+sp.color+'" stroke-width="1.2"/>';s+='<text x="'+(legX+10)+'" y="'+(y+5)+'" text-anchor="middle" font-size="9" font-weight="700" fill="#555">'+sp.num+'</text>';s+='<text x="'+(legX+25)+'" y="'+(y+1)+'" font-size="9" font-weight="600" fill="#333">'+sp.name+'</text>';s+='<text x="'+(legX+25)+'" y="'+(y+12)+'" font-size="7.5" fill="#888">'+sp.qty+'st \u00b7 '+sp.hcm+'cm</text>';});

  s+='</svg>';
  return s;
}
