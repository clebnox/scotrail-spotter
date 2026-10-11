const IDS=["380","385","170","158","334","320","318","314","43","156","153"];
const ask=async(image)=>{
  const r=await fetch("https://openrouter.ai/api/v1/chat/completions",{method:"POST",
   headers:{"content-type":"application/json","authorization":"Bearer "+process.env.OPENROUTER_API_KEY},
   body:JSON.stringify({model:process.env.MODEL||"openrouter/free",max_tokens:600,messages:[{role:"user",content:[
    {type:"text",text:"Is this a ScotRail (Scotland's Railway) train? If so which British Rail class: "+IDS.join(", ")+". Reply with JSON only: {\"id\":\"<class number or null>\"}. Use null if it is not a ScotRail-liveried train or you are unsure."},
    {type:"image_url",image_url:{url:"data:image/jpeg;base64,"+image}}]}]})});
  const d=await r.json();
  const txt=d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content||"";
  const m=txt.match(/\{[^}]*"id"[^}]*\}/);
  let id,valid=false;
  if(m){try{id=JSON.parse(m[0]).id;valid=true}catch(e){}}
  return{valid,id:id==null?null:String(id),raw:(d.error&&d.error.message||txt||JSON.stringify(d)).slice(0,160)};
};
exports.handler=async(ev)=>{
 try{
  const {image}=JSON.parse(ev.body||"{}");
  let last={raw:"no reply"};
  for(let i=0;i<3;i++){
   last=await ask(image);
   if(last.valid)break;
  }
  const ok=last.valid&&IDS.includes(last.id);
  return{statusCode:200,body:JSON.stringify({id:ok?last.id:null,raw:last.valid?"":last.raw})};
 }catch(e){return{statusCode:500,body:"{}"}}
};
