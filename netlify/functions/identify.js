const IDS=["380","385","170","158","334","320","318","314","43","156","153"];
const MODEL=process.env.CF_MODEL||"@cf/meta/llama-3.2-11b-vision-instruct";
const URL="https://api.cloudflare.com/client/v4/accounts/"+process.env.CLOUDFLARE_ACCOUNT_ID+"/ai/run/"+MODEL;
const PROMPT="Look at this train photo. 1) If a vehicle or unit number is readable on the front or side (for example 153377 or 385012), copy the digits exactly. The first three digits are the British Rail class (HST power cars start with 43). 2) Otherwise judge the class from its shape and livery. Only answer if it is a ScotRail-liveried train. The possible classes are: "+IDS.join(", ")+". Reply with JSON only, like {\"number\":\"153377\",\"id\":\"153\"}. Use null for number if none is readable, and null for id if it is not a ScotRail train or you are unsure.";
const call=async(content)=>{
  const r=await fetch(URL,{method:"POST",headers:{"content-type":"application/json","authorization":"Bearer "+process.env.CLOUDFLARE_API_TOKEN},
   body:JSON.stringify({max_tokens:300,messages:[{role:"user",content}]})});
  return r.json();
};
const text=(d)=>{const c=d.choices||(d.result&&d.result.choices);return c&&c[0]&&c[0].message&&c[0].message.content||(d.result&&d.result.response)||d.response||""};
const err=(d)=>JSON.stringify(d.errors||d.error||d).slice(0,160);
const ask=async(image)=>{
  const img=[{type:"text",text:PROMPT},{type:"image_url",image_url:{url:"data:image/jpeg;base64,"+image}}];
  let d=await call(img);
  if(/agree|licen[cs]e/i.test(err(d))&&!text(d)){
    await fetch("https://api.cloudflare.com/client/v4/accounts/"+process.env.CLOUDFLARE_ACCOUNT_ID+"/ai/run/"+MODEL,{method:"POST",headers:{"content-type":"application/json","authorization":"Bearer "+process.env.CLOUDFLARE_API_TOKEN},body:JSON.stringify({prompt:"agree"})});
    d=await call(img)}
  const txt=text(d),m=txt.match(/\{[^}]*"id"[^}]*\}/);
  let o=null;if(m){try{o=JSON.parse(m[0])}catch(e){}}
  return{o,raw:(txt||err(d)).slice(0,160)};
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
  for(let i=0;i<2;i++){last=await ask(image);if(last.o)break}
  return{statusCode:200,body:JSON.stringify({id:last.o?pick(last.o):null,raw:last.o?"":last.raw})};
 }catch(e){return{statusCode:200,body:JSON.stringify({id:null,raw:String(e).slice(0,120)})}}
};
