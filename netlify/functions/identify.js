const IDS=["380","385","170","158","334","320","318","314","43","156","153"];
exports.handler=async(ev)=>{
 try{
  const {image}=JSON.parse(ev.body||"{}");
  const model=process.env.MODEL||"gemini-2.5-flash";
  const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+model+":generateContent",{method:"POST",
   headers:{"content-type":"application/json","x-goog-api-key":process.env.GEMINI_API_KEY},
   body:JSON.stringify({contents:[{parts:[
    {inline_data:{mime_type:"image/jpeg",data:image}},
    {text:"Is this a ScotRail (Scotland's Railway) train? If so which British Rail class: "+IDS.join(", ")+". Reply with JSON only: {\"id\":\"<class number or null>\"}. Use null if it is not a ScotRail-liveried train or you are unsure."}]}],
    generationConfig:{responseMimeType:"application/json",maxOutputTokens:60}})});
  const d=await r.json();
  const txt=d.candidates&&d.candidates[0]&&d.candidates[0].content.parts[0].text||"";
  let id=null;try{id=JSON.parse(txt).id}catch(e){}
  return{statusCode:200,body:JSON.stringify({id:IDS.includes(String(id))?String(id):null})};
 }catch(e){return{statusCode:500,body:"{}"}}
};
 
