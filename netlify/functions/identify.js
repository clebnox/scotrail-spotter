const IDS=["380","385","170","158","334","320","318","314","43","156","153"];
const PROMPT="Look at this train photo. 1) If a vehicle or unit number is readable on the front or side (for example 153377 or 385012), copy the digits exactly. The first three digits are the British Rail class (HST power cars start with 43). 2) Otherwise judge the class from its shape and livery. Only answer if it is a ScotRail-liveried train. The possible classes are: "+IDS.join(", ")+". Reply with JSON only, like {\"number\":\"153377\",\"id\":\"153\"}. Use null for number if none is readable, and null for id if it is not a ScotRail train or you are unsure.";
const ask=async(image)=>{
  const r=await fetch("https://openrouter.ai/api/v1/chat/completions",{method:"POST",
   headers:{"content-type":"application/json","authorization":"Bearer "+process.env.OPENROUTER_API_KEY},
   body:JSON.stringify({model:process.env.MODEL||"openrouter/free",max_tokens:600,messages:[{role:"user",content:[
    {type:"text",text:PROMPT},
    {type:"image_url",image_url:{url:"data:image/jpeg;base64,"+image}}]}]})});
  const d=await r.json();
  const txt=d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content||"";
  const m=txt.match(/\{[^}]*"id"[^}]*\}/);
  let o=null;
  if(m){try{o=JSON.parse(m[0])}catch(e){}}
  return{o,raw:(d.error&&d.error.message||txt||JSON.stringify(d)).slice(0,160)};
};
const pick=(o)=>{
  const n=String(o.number==null?"":o.number).replace(/\D/g,"");
  if(n.length>=3&&IDS.includes(n.slice(0,3)))return n.slice(0,3);
  if(n.length==5&&n.startsWith("43"))return "43";
  const id=o.id==null?null:String(o.id);
  return IDS.includes(id)?id:null;
};
exports.handler=async(ev)=>{
 try{
  const {image}=JSON.parse(ev.body||"{}");
  let last={o:null,raw:"no reply"};
  for(let i=0;i<3;i++){last=await ask(image);if(last.o)break}
  return{statusCode:200,body:JSON.stringify({id:last.o?pick(last.o):null,raw:last.o?"":last.raw})};
 }catch(e){return{statusCode:500,body:"{}"}}
};
