const IDS=["380","385","170","158","334","320","318","314","43","156","153"];
exports.handler=async(ev)=>{
 try{
  const {image}=JSON.parse(ev.body||"{}");
  const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",
   headers:{"content-type":"application/json","x-api-key":process.env.ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01"},
   body:JSON.stringify({model:process.env.MODEL||"claude-sonnet-5-5",max_tokens:60,messages:[{role:"user",content:[
    {type:"image",source:{type:"base64",media_type:"image/jpeg",data:image}},
    {type:"text",text:"Is this a ScotRail (Scotland's Railway) train? If so which British Rail class: "+IDS.join(", ")+". Reply with JSON only: {\"id\":\"<class number or null>\"}. Use null if it is not a ScotRail-liveried train or you are unsure."}]}]})});
  const d=await r.json();
  const m=(d.content&&d.content[0]&&d.content[0].text||"").match(/\{[^}]*\}/);
  let id=null;try{id=JSON.parse(m[0]).id}catch(e){}
  return{statusCode:200,body:JSON.stringify({id:IDS.includes(String(id))?String(id):null})};
 }catch(e){return{statusCode:500,body:"{}"}}
};
