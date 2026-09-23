/** Paint local control vectors and labels without network images or foreignObject. */
export function controlSnapshot(target:Element){
 const rect=target.getBoundingClientRect();
 if(rect.width<=0||rect.height<=0||rect.width>360||rect.height>110)return null;
 const bitmap=document.createElement("canvas");
 bitmap.width=Math.ceil(rect.width);bitmap.height=Math.ceil(rect.height);
 const ctx=bitmap.getContext("2d",{willReadFrequently:true});
 if(!ctx)return null;
 const style=getComputedStyle(target);
 ctx.fillStyle=style.backgroundColor;
 if(style.backgroundImage!=="none"){
  const gradient=ctx.createLinearGradient(0,0,0,bitmap.height);
  gradient.addColorStop(0,"#29353d");gradient.addColorStop(1,"#131a20");ctx.fillStyle=gradient;
 }
 ctx.beginPath();ctx.roundRect(0,0,rect.width,rect.height,Math.min(parseFloat(style.borderRadius)||0,rect.height/2));ctx.fill();
 if(parseFloat(style.borderTopWidth)>0){ctx.strokeStyle=style.borderTopColor;ctx.lineWidth=parseFloat(style.borderTopWidth);ctx.stroke();}
 for(const shape of target.querySelectorAll("path,line,polyline,polygon,circle,rect,ellipse")){
  if(!(shape instanceof SVGGeometryElement)||shape.closest("defs"))continue;
  const matrix=shape.getScreenCTM(),css=getComputedStyle(shape);
  if(!matrix||css.display==="none"||css.visibility==="hidden")continue;
  ctx.save();ctx.setTransform(matrix.a,matrix.b,matrix.c,matrix.d,matrix.e-rect.left,matrix.f-rect.top);
  let path:Path2D;
  if(shape.tagName.toLowerCase()==="path")path=new Path2D(shape.getAttribute("d")||"");
  else{
   path=new Path2D();const length=shape.getTotalLength(),steps=Math.min(240,Math.ceil(length));
   for(let i=0;i<=steps;i++){const p=shape.getPointAtLength(steps?length*i/steps:0);if(i===0)path.moveTo(p.x,p.y);else path.lineTo(p.x,p.y);}
   if(["circle","ellipse","polygon","rect"].includes(shape.tagName.toLowerCase()))path.closePath();
  }
  const paint=(value:string)=>value.includes("url(")?"#b5e0eb":value;
  ctx.globalAlpha=Number(css.opacity)||0;
  if(css.fill!=="none"){ctx.fillStyle=paint(css.fill);ctx.fill(path,css.fillRule==="evenodd"?"evenodd":"nonzero");}
  if(css.stroke!=="none"){ctx.strokeStyle=paint(css.stroke);ctx.lineWidth=parseFloat(css.strokeWidth)||2;ctx.lineCap=css.strokeLinecap as CanvasLineCap;ctx.lineJoin=css.strokeLinejoin as CanvasLineJoin;ctx.stroke(path);}
  ctx.restore();
 }
 const walker=document.createTreeWalker(target,NodeFilter.SHOW_TEXT);
 let node:Node|null;let limit=0;
 while((node=walker.nextNode())&&limit++<32){
  const parent=node.parentElement,text=node.textContent?.trim();
  if(!parent||!text||parent.closest("svg"))continue;
  const range=document.createRange();range.selectNodeContents(node);
  const box=range.getBoundingClientRect(),css=getComputedStyle(parent);
  if(!box.width||!box.height||css.visibility==="hidden"||css.display==="none")continue;
  ctx.font=`${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
  ctx.fillStyle=css.color;ctx.textBaseline="middle";
  ctx.fillText(css.textTransform==="uppercase"?text.toUpperCase():text,box.left-rect.left,box.top-rect.top+box.height/2);
 }
 const pixels=ctx.getImageData(0,0,bitmap.width,bitmap.height).data;
 const size=Math.max(2,Math.ceil(Math.sqrt(bitmap.width*bitmap.height/1000)));
 const tiles:{x:number;y:number;w:number;h:number;vx:number;vy:number}[]=[];
 for(let y=0;y<bitmap.height;y+=size)for(let x=0;x<bitmap.width;x+=size){
  const w=Math.min(size,bitmap.width-x),h=Math.min(size,bitmap.height-y);
  let visible=false;
  for(let dy=0;dy<h&&!visible;dy++)for(let dx=0;dx<w;dx++)if(pixels[((y+dy)*bitmap.width+x+dx)*4+3]>20){visible=true;break;}
  if(!visible)continue;
  const angle=tiles.length*2.39996,radius=24+(tiles.length%17)*2;
  tiles.push({x,y,w,h,vx:Math.cos(angle)*radius,vy:Math.sin(angle)*radius*.7});
 }
 return tiles.length?{bitmap,tiles,rect}:null;
}
