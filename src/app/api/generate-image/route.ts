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
  const cM: Record<string,string> = {"Lila":"#9b6bae","Violett":"#8b5fa3","Rosa":"#d4829a","Pink":"#e07090","Vit":"#d8d8c8","Vitt":"#d8d8c8","Bl\u00e5":"#6b8fc0","Gul":"#d4b840","R\u00f6d":"#c85050","Orange":"#d49040","Gr\u00f6n":"#6aaa5a"};
  let seed = 42;
  function rand() { seed=(seed*16807)%2147483647; return (seed-1)/2147483646; }

  function getBedPath(): string {
    const x=pX,y=pT,w=bW,h=bH,r=16;
    if (bedOutline && bedOutline.length >= 4) {
      const pts=bedOutline.map(([px,py]:number[])=>[x+(px/100)*w,y+(py/100)*h]);
      let d="M"+pts[0][0].toFixed(1)+","+pts[0][1].toFixed(1);
      for(let i=1;i<pts.length;i++){const p=pts[i-1],c=pts[i],n=pts[(i+1)%pts.length];d+=" Q"+(c[0]+(n[0]-p[0])*0.15).toFixed(1)+","+(c[1]+(n[1]-p[1])*0.15).toFixed(1)+" "+c[0].toFixed(1)+","+c[1].toFixed(1);}
      return d+" Z";
    }
    return "M"+(x+r)+","+y+" L"+(x+w-r)+","+y+" Q"+(x+w)+","+y+" "+(x+w)+","+(y+r)+" L"+(x+w)+","+(y+h-r)+" Q"+(x+w)+","+(y+h)+" "+(x+w-r)+","+(y+h)+" L"+(x+r)+","+(y+h)+" Q"+x+","+(y+h)+" "+x+","+(y+h-r)+" L"+x+","+(y+r)+" Q"+x+","+y+" "+(x+r)+","+y+" Z";
  }

  function pointInBed(px:number,py:number):boolean {
    if(bedOutline&&bedOutline.length>=4){const pts=bedOutline.map(([bx,by]:number[])=>[pX+(bx/100)*bW,pT+(by/100)*bH]);let ins=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const[xi,yi]=pts[i],[xj,yj]=pts[j];if((yi>py)!==(yj>py)&&px<((xj-xi)*(py-yi))/(yj-yi)+xi)ins=!ins;}return ins;}
    return px>pX+12&&px<pX+bW-12&&py>pT+12&&py<pT+bH-12;
  }

  function driftBlob(cx:number,cy:number,w:number,h:number):string {
    const n=8,pts:number[][]=[];
    for(let i=0;i<n;i++){const a=(i/n)*Math.PI*2;pts.push([cx+Math.cos(a)*(w/2)*(0.65+rand()*0.5),cy+Math.sin(a)*(h/2)*(0.65+rand()*0.5)]);}
    let d="M"+pts[0][0].toFixed(1)+","+pts[0][1].toFixed(1);
    for(let i=1;i<=n;i++){const c=pts[i%n],p=pts[(i-1+n)%n],nx=pts[(i+1)%n];d+=" Q"+(c[0]+(nx[0]-p[0])*0.22).toFixed(1)+","+(c[1]+(nx[1]-p[1])*0.22).toFixed(1)+" "+c[0].toFixed(1)+","+c[1].toFixed(1);}
    return d+" Z";
  }

  // Sort: tall first
  const sorted=[...plants].sort((a:any,b:any)=>b.height_cm-a.height_cm);
  const maxH=Math.max(...sorted.map((p:any)=>p.height_cm),150);

  // ZONE GRID: divide bed into a 4-col x 3-row grid
  // Row 0 = back (tall), row 1 = mid, row 2 = front (low)
  const cols=4, rows=3;
  const zoneW=bW/cols, zoneH=bH/rows;

  // Assign plants to zones based on height
  const backPlants=sorted.filter((p:any)=>p.height_cm>60);
  const midPlants=sorted.filter((p:any)=>p.height_cm>=25&&p.height_cm<=60);
  const frontPlants=sorted.filter((p:any)=>p.height_cm<25);
  // Rebalance if needed
  if(frontPlants.length===0&&midPlants.length>1) frontPlants.push(...midPlants.splice(Math.ceil(midPlants.length/2)));
  if(midPlants.length===0&&backPlants.length>2) midPlants.push(...backPlants.splice(Math.ceil(backPlants.length/2)));

  interface Drift{name:string;cx:number;cy:number;w:number;h:number;color:string;qty:number;hcm:number;}
  const drifts:Drift[]=[];

  function placeDrifts(plantList:any[],rowIdx:number) {
    const rowCy=pT+zoneH*rowIdx+zoneH/2;
    const count=plantList.length;
    if(count===0) return;
    // Spread evenly across columns
    plantList.forEach((plant:any,i:number)=>{
      const qty=plant.quantity||5;
      const color=cM[plant.color]||"#6aaa5a";
      // Center X for this plant in its column slot
      const slotW=bW/Math.max(count,1);
      const cx=pX+slotW*i+slotW/2+(rand()-0.5)*slotW*0.15;
      const cy=rowCy+(rand()-0.5)*zoneH*0.3;
      // Drift size based on quantity
      const dw=Math.min(slotW*1.1, 50+qty*7);
      const dh=Math.min(zoneH*0.95, 40+qty*5);
      drifts.push({name:plant.name,cx,cy,w:dw,h:dh,color,qty,hcm:plant.height_cm});
      // Secondary drift for larger groups (Oudolf repeat)
      if(qty>=6&&count<cols) {
        const cx2=cx+(rand()>0.5?slotW*0.5:-slotW*0.5);
        const cy2=cy+(rand()-0.5)*zoneH*0.4;
        if(pointInBed(cx2,cy2)) {
          drifts.push({name:plant.name,cx:cx2,cy:cy2,w:dw*0.65,h:dh*0.65,color,qty:Math.ceil(qty*0.4),hcm:plant.height_cm});
        }
      }
    });
  }

  placeDrifts(backPlants, 0);
  placeDrifts(midPlants, 1);
  placeDrifts(frontPlants, 2);

  // SVG
  const shapeLabels:Record<string,string>={rectangle:"Rektangul\u00e4r rabatt",kidney:"Njurformad rabatt",oval:"Oval rabatt",circular:"Rund rabatt",curved:"Sv\u00e4ngd rabatt","L-shaped":"L-formad rabatt",triangular:"Triangul\u00e4r rabatt","narrow-strip":"Smal remsa",irregular:"Friform rabatt"};

  let s='<svg viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg">';
  s+='<rect width="100%" height="100%" fill="#fafaf5"/>';
  s+='<path d="'+getBedPath()+'" fill="#eae7de" stroke="#c5c0b0" stroke-width="1.5" stroke-dasharray="6,3"/>';

  // Matrix grass fill
  for(let i=0;i<150;i++){const gx=pX+10+rand()*(bW-20),gy=pT+8+rand()*(bH-16);if(pointInBed(gx,gy)){s+='<line x1="'+gx.toFixed(1)+'" y1="'+gy.toFixed(1)+'" x2="'+(gx+(rand()-0.5)*2).toFixed(1)+'" y2="'+(gy-3-rand()*5).toFixed(1)+'" stroke="#c5cdb5" stroke-width="0.6" stroke-opacity="0.3"/>';}}

  // Draw drifts back to front
  const sd=[...drifts].sort((a,b)=>a.cy-b.cy);
  for(const d of sd) {
    const op = d.qty >= 5 ? 0.5 : 0.4;
    s+='<path d="'+driftBlob(d.cx,d.cy,d.w,d.h)+'" fill="'+d.color+'" fill-opacity="'+op+'" stroke="'+d.color+'" stroke-opacity="0.3" stroke-width="0.8"/>';
    // Dots inside drift
    const dots=Math.min(d.qty+4,18);
    for(let i=0;i<dots;i++){
      const a=rand()*Math.PI*2,dist=rand()*0.32;
      const dx=d.cx+Math.cos(a)*d.w*dist,dy=d.cy+Math.sin(a)*d.h*dist,dr=2.5+rand()*3;
      s+='<circle cx="'+dx.toFixed(1)+'" cy="'+dy.toFixed(1)+'" r="'+dr.toFixed(1)+'" fill="'+d.color+'" fill-opacity="'+(0.5+rand()*0.4).toFixed(2)+'" stroke="'+d.color+'" stroke-width="0.4" stroke-opacity="0.4"/>';
    }
  }

  // Labels (one per species)
  const labeled=new Set<string>();
  for(const d of sd){
    if(labeled.has(d.name)) continue; labeled.add(d.name);
    const ly=d.cy+d.h/2+10;
    s+='<text x="'+d.cx.toFixed(1)+'" y="'+ly.toFixed(1)+'" text-anchor="middle" font-size="8" font-weight="600" fill="#444">'+d.name+'</text>';
    const tq=drifts.filter(dd=>dd.name===d.name).reduce((sum,dd)=>sum+dd.qty,0);
    s+='<text x="'+d.cx.toFixed(1)+'" y="'+(ly+10).toFixed(1)+'" text-anchor="middle" font-size="7" fill="#999">'+tq+'st \u00b7 '+d.hcm+'cm</text>';
  }

  // Row hints
  [["Bak",pT+bH*0.17],["Mitt",pT+bH*0.5],["Fram",pT+bH*0.83]].forEach(([n,y])=>{s+='<text x="'+(pX-8)+'" y="'+(y as number).toFixed(1)+'" text-anchor="end" font-size="9" fill="#bbb" dominant-baseline="middle">'+n+'</text>';});

  s+='<text x="'+(W/2)+'" y="20" text-anchor="middle" font-size="14" font-weight="600" fill="#333">Planteringsplan '+lengthM+'m x '+widthM+'m</text>';
  s+='<text x="'+(W/2)+'" y="36" text-anchor="middle" font-size="10" fill="#888">'+(shapeLabels[bedShape]||"Rabatt")+' \u00b7 H\u00f6ga bak \u2192 L\u00e5ga fram</text>';
  s+='<text x="'+(W/2)+'" y="'+(H-8)+'" text-anchor="middle" font-size="10" fill="#aaa">'+lengthM+' m</text>';
  s+='<line x1="'+pX+'" y1="'+(H-16)+'" x2="'+(pX+bW)+'" y2="'+(H-16)+'" stroke="#ccc" stroke-width="0.5"/>';
  s+='</svg>';
  return s;
}
