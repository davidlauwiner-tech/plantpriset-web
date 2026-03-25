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

    // Generate SVG planting diagram with detected shape
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
  const W=780,H=480,legendW=185;
  const bedX=15,bedY=55,bedW=W-legendW-35,bedH=H-bedY-35;
  const cM:Record<string,string>={"Lila":"#b088c0","Violett":"#9070a8","Rosa":"#e0a0b0","Pink":"#e08098","Vit":"#c8c8bc","Vitt":"#c8c8bc","Bl\u00e5":"#88aad0","Gul":"#d8c050","R\u00f6d":"#d06060","Orange":"#d8a050","Gr\u00f6n":"#80b870"};

  function getBedPath():string{const x=bedX,y=bedY,w=bedW,h=bedH,r=20;if(bedOutline&&bedOutline.length>=4){const pts=bedOutline.map(([px,py]:number[])=>[x+(px/100)*w,y+(py/100)*h]);let d="M"+pts[0][0].toFixed(1)+","+pts[0][1].toFixed(1);for(let i=1;i<pts.length;i++){const p=pts[i-1],c=pts[i],n=pts[(i+1)%pts.length];d+=" Q"+(c[0]+(n[0]-p[0])*0.15).toFixed(1)+","+(c[1]+(n[1]-p[1])*0.15).toFixed(1)+" "+c[0].toFixed(1)+","+c[1].toFixed(1);}return d+" Z";}return "M"+(x+r)+","+y+" L"+(x+w-r)+","+y+" Q"+(x+w)+","+y+" "+(x+w)+","+(y+r)+" L"+(x+w)+","+(y+h-r)+" Q"+(x+w)+","+(y+h)+" "+(x+w-r)+","+(y+h)+" L"+(x+r)+","+(y+h)+" Q"+x+","+(y+h)+" "+x+","+(y+h-r)+" L"+x+","+(y+r)+" Q"+x+","+y+" "+(x+r)+","+y+" Z";}

  const sorted=[...plants].sort((a:any,b:any)=>b.height_cm-a.height_cm);
  interface Sp{num:number;name:string;color:string;qty:number;hcm:number;}
  const species:Sp[]=[];
  sorted.forEach((p:any,i:number)=>{species.push({num:i+1,name:p.name,color:cM[p.color]||"#80b870",qty:p.quantity||3,hcm:p.height_cm});});

  // Use Claude's layout if available, otherwise fall back to algorithm
  interface Circle{x:number;y:number;r:number;num:number;}
  let circles:Circle[]=[];

  if(layout&&layout.length>0){
    // Claude provided the layout — use it directly
    circles=layout.map((l:any)=>({
      x: bedX + (l.x/100)*bedW,
      y: bedY + (l.y/100)*bedH,
      r: Math.max(8, Math.min(45, l.r/100*bedW*0.5 || l.r*2)),
      num: l.num
    }));
  } else {
    // Fallback: simple algorithmic placement (same as before)
    let seed=42;function rand(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646;}
    const maxH=Math.max(...sorted.map((p:any)=>p.height_cm),150);
    function pointInBed(px:number,py:number):boolean{if(bedOutline&&bedOutline.length>=4){const pts=bedOutline.map(([bx,by]:number[])=>[bedX+(bx/100)*bedW,bedY+(by/100)*bedH]);let ins=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const[xi,yi]=pts[i],[xj,yj]=pts[j];if((yi>py)!==(yj>py)&&px<((xj-xi)*(py-yi))/(yj-yi)+xi)ins=!ins;}return ins;}return px>bedX+8&&px<bedX+bedW-8&&py>bedY+8&&py<bedY+bedH-8;}
    const totalClusters=species.reduce((s,sp)=>s+sp.qty,0);
    const bedArea=bedW*bedH*1.3;
    const baseR=Math.min(Math.sqrt(bedArea/Math.PI/Math.max(totalClusters,1)),bedH/5,55);
    const backP=species.filter(s=>s.hcm>60),midP=species.filter(s=>s.hcm>=25&&s.hcm<=60),frontP=species.filter(s=>s.hcm<25);
    const rowBands=[{plants:backP,yMin:bedY+20,yMax:bedY+bedH*0.35},{plants:midP,yMin:bedY+bedH*0.32,yMax:bedY+bedH*0.68},{plants:frontP,yMin:bedY+bedH*0.65,yMax:bedY+bedH-20}];
    for(const band of rowBands){for(const sp of band.plants){for(let q=0;q<sp.qty;q++){const r=baseR*(0.6+sp.hcm/maxH*0.5);let bx=0,by=0,bs=-Infinity;for(let a=0;a<80;a++){const cx=bedX+r+10+rand()*(bedW-r*2-20),cy=band.yMin+rand()*(band.yMax-band.yMin);if(!pointInBed(cx,cy))continue;let sc=0;for(const c of circles){const d=Math.sqrt((cx-c.x)**2+(cy-c.y)**2);const ov=(r+c.r)-d;if(ov>r*0.85)sc-=ov*6;else if(ov>-8)sc+=20;else if(d>(r+c.r)*1.8)sc-=2;}if(sc>bs){bs=sc;bx=cx;by=cy;}}if(bs>-Infinity)circles.push({x:bx,y:by,r,num:sp.num});}}}
  }

  // SVG
  const shapeLabels:Record<string,string>={rectangle:"Rektangul\u00e4r rabatt",kidney:"Njurformad rabatt",oval:"Oval rabatt",circular:"Rund rabatt",curved:"Sv\u00e4ngd rabatt","L-shaped":"L-formad rabatt",triangular:"Triangul\u00e4r rabatt","narrow-strip":"Smal remsa",irregular:"Friform rabatt"};
  let s='<svg viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg" style="font-family:system-ui,sans-serif">';
  s+='<rect width="100%" height="100%" fill="#fafaf5"/>';
  s+='<text x="'+(bedX+bedW/2)+'" y="22" text-anchor="middle" font-size="15" font-weight="700" fill="#333">Planteringsplan '+lengthM+'m \u00d7 '+widthM+'m</text>';
  s+='<text x="'+(bedX+bedW/2)+'" y="40" text-anchor="middle" font-size="10" fill="#999">'+(shapeLabels[bedShape]||"Rabatt")+' \u00b7 H\u00f6ga bak \u2192 L\u00e5ga fram</text>';
  s+='<path d="'+getBedPath()+'" fill="#f0ede8" stroke="#b5b0a0" stroke-width="2"/>';

  const sortedC=[...circles].sort((a,b)=>a.y-b.y);
  for(const c of sortedC){
    const sp=species.find(s=>s.num===c.num);
    if(!sp)continue;
    s+='<circle cx="'+c.x.toFixed(1)+'" cy="'+c.y.toFixed(1)+'" r="'+c.r.toFixed(1)+'" fill="'+sp.color+'" fill-opacity="0.25" stroke="'+sp.color+'" stroke-width="2" stroke-opacity="0.55"/>';
    s+='<text x="'+c.x.toFixed(1)+'" y="'+(c.y+5).toFixed(1)+'" text-anchor="middle" font-size="'+(c.r>25?15:c.r>18?13:10)+'" font-weight="700" fill="#555">'+sp.num+'</text>';
  }

  s+='<line x1="'+bedX+'" y1="'+(H-10)+'" x2="'+(bedX+bedW)+'" y2="'+(H-10)+'" stroke="#bbb" stroke-width="0.8"/>';
  s+='<text x="'+(bedX+bedW/2)+'" y="'+(H-1)+'" text-anchor="middle" font-size="10" fill="#aaa">\u2190 '+lengthM+' m \u2192</text>';
  const totalP=species.reduce((s,sp)=>s+sp.qty,0);
  s+='<text x="'+(bedX+bedW)+'" y="'+(H-1)+'" text-anchor="end" font-size="9" fill="#bbb">'+totalP+' plantor</text>';

  const legX=bedX+bedW+25,legY=bedY-5;
  s+='<text x="'+legX+'" y="'+(legY+5)+'" font-size="12" font-weight="700" fill="#333">V\u00e4xtlista</text>';
  s+='<line x1="'+legX+'" y1="'+(legY+12)+'" x2="'+(legX+legendW-15)+'" y2="'+(legY+12)+'" stroke="#e0ddd5" stroke-width="0.8"/>';
  species.forEach((sp,i)=>{const y=legY+28+i*30;s+='<circle cx="'+(legX+12)+'" cy="'+(y+2)+'" r="10" fill="'+sp.color+'" fill-opacity="0.25" stroke="'+sp.color+'" stroke-width="1.5"/>';s+='<text x="'+(legX+12)+'" y="'+(y+6)+'" text-anchor="middle" font-size="10" font-weight="800" fill="#555">'+sp.num+'</text>';s+='<text x="'+(legX+28)+'" y="'+(y)+'" font-size="9.5" font-weight="600" fill="#333">'+sp.name+'</text>';s+='<text x="'+(legX+28)+'" y="'+(y+12)+'" font-size="8" fill="#888">'+sp.qty+'st \u00b7 '+sp.hcm+'cm</text>';});

  s+='</svg>';
  return s;
}
