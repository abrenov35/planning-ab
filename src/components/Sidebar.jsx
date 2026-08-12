import React, { useContext } from "react";
import { VERSION } from "../version.js";
import { AppContext } from "../context/AppContext";

export const Sidebar = ({ currentPage, setCurrentPage, ganttControls }) => {
  const { loadData, loading } = useContext(AppContext);
  const handleReload = async () => { await loadData(true); };
  const navStyle = active => ({padding:"5px 10px",cursor:"pointer",fontSize:11,fontWeight:active?700:500,border:"none",background:active?"rgba(255,255,255,0.18)":"transparent",color:"white",borderRadius:5,borderBottom:active?"2px solid #f59e0b":"2px solid transparent",flexShrink:0,whiteSpace:"nowrap"});
  const separator=<div style={{width:1,height:24,background:"rgba(255,255,255,0.25)",flexShrink:0}}/>;
  return <div style={{background:"#1e3a8a",color:"white",display:"flex",alignItems:"center",justifyContent:"flex-start",padding:"7px 12px",borderBottom:"1px solid rgba(255,255,255,0.12)",gap:8,whiteSpace:"nowrap",position:"sticky",top:0,zIndex:100,overflowX:"auto"}}>
    <div style={{fontSize:13,fontWeight:800,flexShrink:0,marginRight:4}}>AB PLANNING</div>{separator}
    <button onClick={()=>setCurrentPage("gantt")} style={navStyle(currentPage==="gantt")}>📅 Gantt</button>
    {currentPage==="gantt"&&ganttControls&&<div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
      <button onClick={ganttControls.onPast} style={{padding:"5px 9px",background:"rgba(255,255,255,0.12)",color:"white",border:"1px solid rgba(255,255,255,0.30)",borderRadius:5,fontSize:10,cursor:"pointer",fontWeight:700}}>← Passé</button>
      <button onClick={ganttControls.onToday} style={{padding:"5px 9px",background:"#10b981",color:"white",border:"none",borderRadius:5,fontSize:10,cursor:"pointer",fontWeight:700}}>Auj.</button>
    </div>}
    {separator}
    <button onClick={handleReload} disabled={loading} title="Recharger immédiatement les données du planning" style={{padding:"5px 9px",background:loading?"rgba(255,255,255,0.10)":"rgba(255,255,255,0.16)",color:"white",border:"1px solid rgba(255,255,255,0.30)",borderRadius:5,fontSize:10,cursor:loading?"default":"pointer",fontWeight:700,whiteSpace:"nowrap",flexShrink:0}}>{loading?"↻ ...":"↻ Recharger"}</button>
    <button onClick={()=>setCurrentPage("chantiers")} style={navStyle(currentPage==="chantiers")}>🏗️ Chantiers</button>
    <button onClick={()=>setCurrentPage("ouvriers")} style={navStyle(currentPage==="ouvriers")}>👷 Ouvriers</button>
    <div style={{fontSize:9,opacity:0.65,fontWeight:700,flexShrink:0,padding:"0 3px"}}>v{VERSION}</div>
  </div>;
};