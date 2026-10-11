const IDS=["380","385","170","158","334","320","318","314","43","156","153"];
exports.handler=async(ev)=>{
 try{
  const {image}=JSON.parse(ev.body||"{}");
  const r=await fetch("https://openrouter.ai/api/v1/chat/completions",{method:"POST",
   headers:{"content-type":"application/json","authorization":"Bearer "+process.env.OPENROUTER_API_KEY},
   body:JSON.stringify({model:process.env.MODEL||"openrouter/free",max_tokens:60,messages:[{role:"user",content:[
    {type:"text",text:"Is this a ScotRail (Scotland's Railway) train? If so which British Rail class: "+IDS.join(", ")+". Reply with JSON only: {\"id\":\"<class number or null>\"}. Use null if it is not a ScotRail-liveried train or you are unsure."},
    {type:"image_url",image_url:{url:"data:image/jpeg;base64,"+image}}]}]})});
  const d=await r.json();
  const txt=d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content||"";
  let id=null;try{id=JSON.parse(txt.match(/\{[^}]*\}/)[0]).id}catch(e){}
  const ok=IDS.includes(String(id));return{statusCode:200,body:JSON.stringify({id:ok?String(id):null,raw:ok?"":(d.error&&d.error.message||txt||"no reply").slice(0,90)})};
 }catch(e){return{statusCode:500,body:"{}"}}
};
