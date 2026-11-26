"use client";
import {useEffect,useState} from "react";
import {useParams,useRouter} from "next/navigation";
import BackArrow from "@/components/BackArrow";
import {supabaseBrowser} from "@/lib/supabase-browser";
import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";

type Session={title:string;duration:string;steps:string[]};
// Optional video URLs keyed by program:week:day:step (all numbers are 1-based).
const stepVideos:Record<string,string>=Object.fromEntries(Array.from({length:8},(_,w)=>Array.from({length:3},(_,d)=>["5k:"+(w+1)+":"+(d+1)+":1","https://www.youtube.com/watch?v=y-CTIys2HPc"])).flat());
function displaySteps(p:Plan,s:Session){return p.id==='mobility'?s.steps:[...s.steps,p.id==='5k'||p.id==='10k'?'Post-workout stretching (optional, 3–5 min): gently stretch calves, quadriceps and hip flexors for 15–20 seconds per side, without bouncing or pain.':'Post-workout stretching (optional, 3–5 min): gently stretch the muscles used today for 15–20 seconds, without bouncing or pain.'];}
type Plan={id:string;name:string;title:string;weeks:number;days:number;description:string;sessions:Session[]};
const plans:Plan[]=[
{id:"5k",name:"5K Running",title:"Your First 5K",weeks:8,days:3,description:"Build confidence with easy run and walk sessions.",sessions:[
{title:"Run & Walk",duration:"20 min",steps:["Warm up with 5 minutes of walking.","Alternate 1 minute of easy jogging and 2 minutes of walking for 10 minutes.","Cool down with 5 minutes of walking."]},
{title:"Easy Run & Walk",duration:"20 min",steps:["Walk for 5 minutes.","Alternate comfortable jogging and walking for 10 minutes.","Walk for 5 minutes."]},
{title:"Endurance Session",duration:"25 min",steps:["Walk for 5 minutes.","Alternate easy jogging and walking for 15 minutes.","Walk for 5 minutes."]}]},
{id:"10k",name:"10K Running",title:"Build Your 10K",weeks:10,days:4,description:"For runners already comfortable with easy 5K distances.",sessions:[
{title:"Easy Run",duration:"25 min",steps:["Walk for 5 minutes.","Run at conversational effort for 15 minutes.","Walk for 5 minutes."]},
{title:"Recovery Run",duration:"20 min",steps:["Walk for 5 minutes.","Jog gently for 10 minutes.","Walk for 5 minutes."]},
{title:"Steady Run",duration:"30 min",steps:["Warm up for 5 minutes.","Run comfortably for 20 minutes.","Cool down for 5 minutes."]},
{title:"Endurance Run",duration:"35 min",steps:["Walk for 5 minutes.","Run or walk at easy effort for 25 minutes.","Walk for 5 minutes."]}]},
{id:"strength",name:"Strength Training",title:"Runner Strength",weeks:4,days:3,description:"Build foundational strength with controlled movements.",sessions:[
{title:"Lower Body",duration:"20 min",steps:["Warm up with gentle walking.","Chair squats: 2 sets of 8.","Glute bridges: 2 sets of 8.","Supported calf raises: 2 sets of 10."]},
{title:"Upper Body & Core",duration:"20 min",steps:["Warm up gently.","Wall push-ups: 2 sets of 8.","Bird dogs: 2 sets of 6 per side.","Rest between sets."]},
{title:"Full Body",duration:"20 min",steps:["Warm up gently.","Chair squats and wall push-ups: 2 sets of 8 each.","Glute bridges: 2 sets of 8."]}]},
{id:"mobility",name:"Stretching & Mobility",title:"Daily Mobility",weeks:4,days:3,description:"Gentle mobility routines for comfortable movement.",sessions:[
{title:"Lower Body Mobility",duration:"15 min",steps:["Walk gently to warm up.","Calf and hip flexor stretches: 20 seconds per side.","Gentle ankle circles: 10 per side."]},
{title:"Upper Body Mobility",duration:"15 min",steps:["Shoulder circles: 10 each direction.","Gentle thoracic rotations: 6 per side.","Relaxed breathing and comfortable stretches."]},
{title:"Full Body Mobility",duration:"15 min",steps:["Warm up with walking.","Gentle hip, ankle and shoulder mobility.","Finish with relaxed breathing."]}]},
{id:"posture",name:"Postural Strengthening",title:"Core & Stability",weeks:4,days:3,description:"Practice controlled core and stability exercises.",sessions:[
{title:"Core Control",duration:"15 min",steps:["Warm up gently.","Bird dogs: 2 sets of 6 per side.","Dead bugs: 2 sets of 6 per side."]},
{title:"Upper Back Stability",duration:"15 min",steps:["Gentle shoulder circles.","Wall slides: 2 sets of 8.","Shoulder blade squeezes: 2 sets of 8."]},
{title:"Balance & Stability",duration:"15 min",steps:["Supported single-leg balance: 15 seconds per side.","Glute bridges: 2 sets of 8.","Bird dogs: 2 sets of 6 per side."]}]}];

// Conservative demonstration schedules; repeat or reduce a week if needed.
const runMinutes:Record<string,number[][]>={
"5k":[[10,10,15],[12,12,16],[14,14,18],[12,12,16],[16,16,20],[18,18,22],[20,20,25],[15,15,25]],
"10k":[[15,10,20,25],[18,12,22,28],[20,12,24,30],[16,10,20,25],[22,15,25,35],[24,15,28,38],[25,18,30,42],[20,12,25,32],[28,18,32,45],[20,12,20,40]]
};
function weekSessions(p:Plan,w:number):Session[]{
if(p.id==="5k"||p.id==="10k")return p.sessions.map((s,i)=>{const m=runMinutes[p.id][w-1][i];const ratio=["1 minute jogging / 2 minutes walking","1 minute jogging / 2 minutes walking","2 minutes jogging / 2 minutes walking","1 minute jogging / 2 minutes walking","3 minutes jogging / 2 minutes walking","4 minutes jogging / 2 minutes walking","5 minutes jogging / 2 minutes walking","4 minutes jogging / 2 minutes walking"][w-1];return {...s,duration:(m+10)+" min",steps:["Warm up with 5 minutes of easy walking.",p.id==="5k"?"For "+m+" minutes, alternate "+ratio+". Walk more whenever needed.":"Run or walk at conversational effort for "+m+" minutes. Keep recovery days especially easy.","Cool down with 5 minutes of walking."]}});
return p.sessions.map(s=>({...s,steps:s.steps.map(t=>{if(p.id==="mobility")return t.replace(/20 seconds/g,[20,20,25,25][w-1]+" seconds").replace(/10 per side/g,[10,10,12,12][w-1]+" per side");return t.replace(/2 sets of (\d+)/g,(_,n)=>"2 sets of "+(Number(n)+[0,1,2,0][w-1])).replace(/15 seconds per side/g,[15,20,25,20][w-1]+" seconds per side")})}));
}
const card={background:"#fff",border:"1px solid #dbe2ea",borderRadius:12,padding:16};
const button={border:0,borderRadius:8,background:"#0f172a",color:"#fff",padding:"12px 16px",fontWeight:700,cursor:"pointer"} as const;
export default function TrainingPlans(){
const {id}=useParams<{id:string}>();const router=useRouter();
const [uid,setUid]=useState("");const [ready,setReady]=useState(false);const [selected,setSelected]=useState<Plan|null>(null);const [week,setWeek]=useState(1);const [day,setDay]=useState<number|null>(null);const [done,setDone]=useState<Record<string,boolean>>({});
useEffect(()=>{let live=true;async function load(){const {data:{user}}=await supabaseBrowser.auth.getUser();if(!live)return;if(!user){router.replace("/login");return;}const {data:community}=await supabaseBrowser.from("app_membership_communities").select("created_by").eq("id",id).maybeSingle();const {data:profile}=await supabaseBrowser.from("profiles").select("is_admin").eq("id",user.id).maybeSingle();const {data:membership}=await supabaseBrowser.from("app_membership_requests").select("status,subscription_status").eq("community_id",id).eq("user_id",user.id).maybeSingle();if(!live)return;if(!community||(!profile?.is_admin&&community.created_by!==user.id&&!(membership?.status==="active"&&(id==="a6dcbf1d-b7d3-4f70-a048-6f73bb46d1a1"||["active","trialing"].includes(membership.subscription_status??""))))){router.replace("/groups/"+id);return;}setUid(user.id);try{setDone(JSON.parse(localStorage.getItem("training-demo:"+id+":"+user.id)||"{}"));}catch{}setReady(true);}void load();return()=>{live=false};},[id,router]);
function toggle(key:string){const next={...done,[key]:!done[key]};setDone(next);try{localStorage.setItem("training-demo:"+id+":"+uid,JSON.stringify(next));}catch{}}
if(!ready)return null;
const sessions=selected?weekSessions(selected,week):[];const session=day!==null?sessions[day]:null;const completed=selected?Array.from({length:selected.weeks},(_,w)=>weekSessions(selected,w+1).filter((_,i)=>done[selected.id+":"+(w+1)+":"+i]).length).reduce((a,b)=>a+b,0):0;
return <main style={{maxWidth:760,margin:"0 auto",padding:"20px 16px 90px",fontFamily:"Montserrat, sans-serif",background:"#f8fafc",minHeight:"100vh",color:"#0f172a"}}>
{selected?<button style={button} onClick={()=>day!==null?setDay(null):setSelected(null)}>Back</button>:<BackArrow href={"/groups/"+id+(id==="a6dcbf1d-b7d3-4f70-a048-6f73bb46d1a1"?"":"/inside")}/>}
<h1 style={{fontSize:25}}>{session?.title??selected?.title??"Training Plans"}</h1>
<p style={{fontSize:13,color:"#64748b"}}>Demonstration programs · General fitness guidance</p>
{!selected?<div style={{display:"grid",gap:12}}>{plans.map(p=><button key={p.id} onClick={()=>{setWeek(1);setSelected(p)}} style={{...card,textAlign:"left",cursor:"pointer",color:"#0f172a",fontFamily:"inherit"}}><strong style={{fontSize:17}}>{p.name}</strong><p style={{fontSize:13}}>{p.description}</p><span style={{fontSize:12,color:"#475569"}}>{p.weeks} weeks · {p.days} days/week</span><p style={{color:"#2563eb",fontWeight:700,marginBottom:0}}>View Program →</p></button>)}</div>:session&&day!==null?<div style={{display:"grid",gap:12}}><p>Week {week} · Day {day+1} · {session.duration}</p>{displaySteps(selected,session).map((step,i)=>{const video=step.startsWith("Post-workout stretching")?"https://www.youtube.com/watch?v=FQrIcgY4yG8&t=10s":stepVideos[selected.id+":"+week+":"+(day+1)+":"+(i+1)];return <div key={i} style={card}><strong>{step.startsWith("Post-workout stretching")?"Post-Workout Stretching":"Step "+(i+1)}</strong><p>{step}</p>{video&&<a href={video} target="_blank" rel="noopener noreferrer" style={{color:"#2563eb",fontWeight:700,fontSize:13}}>Watch Video →</a>}</div>})}<button style={button} onClick={()=>toggle(selected.id+":"+week+":"+day)}>{done[selected.id+":"+week+":"+day]?"Undo completion":"Complete Workout"}</button></div>:<><p>{selected.description}</p><div style={card}><strong>Program progress</strong><p>{completed} / {selected.days*selected.weeks} workouts</p><progress style={{width:"100%"}} max={selected.days*selected.weeks} value={completed}/><p style={{fontSize:12}}>Progress is saved on this device only.</p></div><h2 style={{fontSize:18}}>Training Schedule</h2><label>Week <select value={week} onChange={e=>setWeek(Number(e.target.value))} style={{padding:10,borderRadius:8,marginBottom:12}}>{Array.from({length:selected.weeks},(_,i)=><option key={i} value={i+1}>Week {i+1}</option>)}</select></label><div style={{display:"grid",gap:10}}>{sessions.map((s,i)=><button key={i} style={{...card,textAlign:"left",fontFamily:"inherit",color:"#0f172a",cursor:"pointer"}} onClick={()=>setDay(i)}><small>DAY {i+1} {done[selected.id+":"+week+":"+i]?" · Completed":""}</small><h3>{s.title}</h3><span>{s.duration} · View workout →</span></button>)}</div></>}
<p style={{fontSize:12,color:"#64748b",lineHeight:1.6}}>Demonstration content, not an individualized or professionally reviewed training plan. Rest between training days as needed. Stop if you experience pain, dizziness or unusual symptoms and seek medical advice.</p></main>}
