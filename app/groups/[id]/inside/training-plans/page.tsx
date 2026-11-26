"use client";
import {useParams} from "next/navigation";
import BackArrow from "@/components/BackArrow";
import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";
const categories=["5K Running","10K Running","Strength Training","Stretching & Mobility","Postural Strengthening"];
export default function TrainingPlans(){const {id}=useParams<{id:string}>();return <main style={{maxWidth:760,margin:"0 auto",padding:"20px 16px 90px",fontFamily:"Montserrat, sans-serif",background:"#f8fafc",minHeight:"100vh",color:"#0f172a"}}><BackArrow href={"/groups/"+id+"/inside"}/><h1 style={{fontSize:24}}>Training Plans</h1><p style={{fontSize:13,color:"#64748b"}}>Explore upcoming training programs.</p><div style={{display:"grid",gap:10}}>{categories.map(name=><article key={name} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:16}}><strong>{name}</strong><p style={{fontSize:12,color:"#64748b",marginBottom:0}}>Coming soon</p></article>)}</div></main>}
