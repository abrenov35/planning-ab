const API_URL = "https://script.google.com/macros/s/AKfycbxOE2bAsnGKn1TvOlxBK1qJpe2nblhC4l8YWmAxTUe3VM383YaNrPmH3i1U2g-Sp7LJxA/exec";

const LS_DELETE_QUEUE = "abPlanningDeleteQueueV1";
const LS_DELETED_ASSIGNMENTS = "abPlanningDeletedAssignmentsV2";

const jsonp = (params = {}) => new Promise((resolve,reject)=>{
  const callbackName=`abPlanningJsonp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const query=new URLSearchParams({...params,callback:callbackName,_ts:String(Date.now())});
  const script=document.createElement("script"); let termine=false;
  const nettoyer=()=>{if(script.parentNode)script.parentNode.removeChild(script);try{delete window[callbackName];}catch(_){window[callbackName]=undefined;}};
  const timeout=window.setTimeout(()=>{if(termine)return;termine=true;nettoyer();reject(new Error("Délai API dépassé"));},20000);
  window[callbackName]=data=>{if(termine)return;termine=true;window.clearTimeout(timeout);nettoyer();resolve(data);};
  script.onerror=()=>{if(termine)return;termine=true;window.clearTimeout(timeout);nettoyer();reject(new Error("Impossible de joindre Apps Script"));};
  script.src=`${API_URL}?${query.toString()}`;script.async=true;document.head.appendChild(script);
});

const appeler=async(params,fallback={error:"Erreur API"})=>{try{return await jsonp(params);}catch(err){console.error("AB Planning API:",err);return{...fallback,error:err?.message||"Erreur API"};}};

const normaliserDate=value=>{
  const str=String(value||"").trim();
  if(!str)return"";
  const brut=str.split("T")[0];
  if(/^\d{2}\/\d{2}\/\d{4}$/.test(brut)){
    const[d,m,y]=brut.split("/");
    return`${y}-${m}-${d}`;
  }
  if(/^\d{4}-\d{2}-\d{2}$/.test(brut))return brut;
  return brut;
};

const nomAffectation=a=>String(a?.nomExterne||a?.affectationNom||a?.nomAffectation||"").trim();
const signatureAffectation=a=>({
  ouvrierID:String(a?.ouvrierID||""),
  chantierId:String(a?.chantierId||""),
  dateDebut:normaliserDate(a?.dateDebut),
  dateFin:normaliserDate(a?.dateFin),
  tache:String(a?.tache||"").trim(),
  nom:nomAffectation(a)
});

const memeSignature=(a,signature)=>{
  if(!a||!signature)return false;
  const s=signatureAffectation(a);
  if(s.ouvrierID!==String(signature.ouvrierID||""))return false;
  if(s.chantierId!==String(signature.chantierId||""))return false;
  if(s.dateDebut!==normaliserDate(signature.dateDebut))return false;
  if(s.dateFin!==normaliserDate(signature.dateFin))return false;
  if(s.tache!==String(signature.tache||"").trim())return false;
  // Pour une affectation libre, le nom fait partie de l'identité.
  if(!s.chantierId && String(signature.nom||"").trim() && s.nom!==String(signature.nom||"").trim())return false;
  return true;
};

const signatureKey=signature=>[
  String(signature?.ouvrierID||""),
  String(signature?.chantierId||""),
  normaliserDate(signature?.dateDebut),
  normaliserDate(signature?.dateFin),
  String(signature?.tache||"").trim(),
  String(signature?.chantierId||"")?"":String(signature?.nom||"").trim()
].join("¦");

const lireFileSuppressions=()=>{
  try{
    const raw=JSON.parse(localStorage.getItem(LS_DELETE_QUEUE)||"[]");
    return Array.isArray(raw)?raw.filter(x=>x&&x.key):[];
  }catch(_){return[];}
};
let fileSuppressions=lireFileSuppressions();
let nettoyageEnCours=false;
let nettoyageTimer=null;

const sauverFileSuppressions=()=>{
  try{localStorage.setItem(LS_DELETE_QUEUE,JSON.stringify(fileSuppressions));}catch(_){}
};

const signatureDepuisDerniereSuppression=()=>{
  try{
    const raw=JSON.parse(localStorage.getItem(LS_DELETED_ASSIGNMENTS)||"[]");
    if(!Array.isArray(raw))return null;
    const recent=raw
      .filter(x=>x?.key&&Date.now()-Number(x.deletedAt||0)<15000)
      .sort((a,b)=>Number(b.deletedAt||0)-Number(a.deletedAt||0))[0];
    if(!recent)return null;
    const p=String(recent.key).split("¦");
    if(p.length<5)return null;
    return{ouvrierID:p[0]||"",chantierId:p[1]||"",dateDebut:p[2]||"",dateFin:p[3]||"",tache:p[4]||"",nom:p[5]||""};
  }catch(_){return null;}
};

const ajouterSuppressionEnAttente=(id,signature=null)=>{
  const idString=String(id||"");
  const sig=signature||null;
  const key=sig?`sig:${signatureKey(sig)}`:`id:${idString}`;
  const existante=fileSuppressions.find(x=>x.key===key);
  if(existante){
    if(sig)existante.signature=sig;
    if(idString&&!idString.startsWith("tmp-"))existante.id=idString;
    existante.updatedAt=Date.now();
    sauverFileSuppressions();
    return existante;
  }
  const job={
    key,
    id:idString&&!idString.startsWith("tmp-")?idString:"",
    signature:sig,
    createdAt:Date.now(),
    updatedAt:Date.now(),
    absentSince:null,
    attempts:0
  };
  fileSuppressions.push(job);
  sauverFileSuppressions();
  return job;
};

const supprimerUneFois=async id=>{
  if(!id||String(id).startsWith("tmp-"))return{success:false,error:"Identifiant temporaire"};
  return appeler({action:"deleteAffectation",id:String(id)},{success:false,error:"Erreur suppression"});
};

const programmerNettoyage=(delay=0)=>{
  if(typeof window==="undefined")return;
  if(nettoyageTimer)window.clearTimeout(nettoyageTimer);
  nettoyageTimer=window.setTimeout(()=>{
    nettoyageTimer=null;
    void traiterFileSuppressions();
  },Math.max(0,delay));
};

const traiterFileSuppressions=async()=>{
  if(nettoyageEnCours||!fileSuppressions.length)return;
  nettoyageEnCours=true;
  try{
    const serveur=await jsonp({action:"getAffectations"});
    if(!Array.isArray(serveur))throw new Error(serveur?.error||"Réponse affectations invalide");

    const maintenant=Date.now();
    const aSupprimer=[];

    for(const job of fileSuppressions){
      if(!job.signature&&job.id){
        const cibleParId=serveur.find(a=>String(a?.id||"")===String(job.id));
        if(cibleParId){
          job.signature=signatureAffectation(cibleParId);
          job.key=`sig:${signatureKey(job.signature)}`;
        }
      }

      const correspondances=serveur.filter(a=>
        (job.id&&String(a?.id||"")===String(job.id))||
        (job.signature&&memeSignature(a,job.signature))
      );

      if(!correspondances.length){
        if(!job.absentSince)job.absentSince=maintenant;
        // On garde le garde-fou 60 s pour absorber les lectures Sheet en retard.
        if(maintenant-Number(job.absentSince||maintenant)>=60000)aSupprimer.push(job.key);
        continue;
      }

      job.absentSince=null;
      job.attempts=Number(job.attempts||0)+1;
      job.updatedAt=maintenant;

      for(const affectation of correspondances){
        const realId=String(affectation?.id||"");
        if(!realId||realId.startsWith("tmp-"))continue;
        job.id=realId;
        try{await supprimerUneFois(realId);}catch(err){console.error("AB Planning suppression retry:",err);}
      }
    }

    if(aSupprimer.length){
      const suppr=new Set(aSupprimer);
      fileSuppressions=fileSuppressions.filter(job=>!suppr.has(job.key));
    }
    sauverFileSuppressions();
  }catch(err){
    console.error("AB Planning nettoyage suppressions:",err);
  }finally{
    nettoyageEnCours=false;
    if(fileSuppressions.length)programmerNettoyage(5000);
  }
};

export const getAll=async()=>{
  const r=await appeler({action:"getAll"});
  if(fileSuppressions.length)programmerNettoyage(0);
  return r;
};
export const getOuvriers=async()=>{const r=await appeler({action:"getOuvriers"},{error:"Erreur ouvriers"});return Array.isArray(r)?r:[];};
export const getChantiers=async()=>{const r=await appeler({action:"getChantiers"},{error:"Erreur chantiers"});return Array.isArray(r)?r:[];};
export const getAffectations=async()=>{const r=await appeler({action:"getAffectations"},{error:"Erreur affectations"});return Array.isArray(r)?r:[];};
export const getAffectationsStrict=async()=>{const r=await jsonp({action:"getAffectations"});if(!Array.isArray(r))throw new Error(r?.error||"Réponse affectations invalide");return r;};
export const createOuvrier=async(nom,type,metier)=>appeler({action:"createOuvrier",nom,type,metier});
export const createChantier=async(nom,dateDebut,dateFin,description,couleur="",dateSignature="",typeChantier="Rénovation")=>appeler({action:"createChantier",nom,dateDebut,dateFin,description:description||"",couleur:couleur||"",dateSignature:dateSignature||"",typeChantier:typeChantier||"Rénovation"});
export const updateOuvrier=async(id,nom,type,metier,statut,ordre="",separateurApres=false,couleurCellule="")=>appeler({action:"updateOuvrier",id,nom:nom||"",type:type||"",metier:metier||"",statut:statut||"",ordre:ordre===""?"":String(ordre),separateurApres:separateurApres?"TRUE":"FALSE",couleurCellule:couleurCellule||""});
export const updateChantier=async(id,nom,dateDebut,dateFin,description,statut,couleur="",dateSignature="",typeChantier="Rénovation")=>appeler({action:"updateChantier",id,nom:nom||"",dateDebut:dateDebut||"",dateFin:dateFin||"",description:description||"",statut:statut||"",couleur:couleur||"",dateSignature:dateSignature||"",typeChantier:typeChantier||"Rénovation"});
export const deleteChantier=async id=>appeler({action:"deleteChantier",id});
export const createAffectation=async(ouvrierID,chantierId,dateDebut,dateFin,tache,nomAffectation="",typeAffectation="CHANTIER")=>appeler({action:"createAffectation",ouvrierID,chantierId:chantierId||"",dateDebut,dateFin,tache:tache||"",nomAffectation:nomAffectation||"",nomExterne:nomAffectation||"",typeAffectation:typeAffectation||"CHANTIER"});
export const updateAffectation=async(id,dateDebut,dateFin,tache,statut,nomAffectation="",chantierId="")=>appeler({action:"updateAffectation",id,dateDebut:dateDebut||"",dateFin:dateFin||"",tache:tache||"",statut:statut||"",nomAffectation:nomAffectation||"",chantierId:chantierId||""});

export const deleteAffectation=async id=>{
  const idString=String(id||"");
  let signature=null;

  // Les créations optimistes ont un id tmp-. AppContext a déjà enregistré
  // leur signature dans la liste locale des suppressions : on la récupère ici.
  if(idString.startsWith("tmp-"))signature=signatureDepuisDerniereSuppression();

  const job=ajouterSuppressionEnAttente(idString,signature);

  // Réponse immédiate au front : l'affectation reste supprimée visuellement.
  // La suppression réelle est vérifiée et rejouée en arrière-plan jusqu'à disparition.
  programmerNettoyage(0);

  return{success:true,pending:true,queued:true,key:job.key};
};

if(typeof window!=="undefined"&&fileSuppressions.length)programmerNettoyage(800);
