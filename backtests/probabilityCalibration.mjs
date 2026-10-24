// Read-only calibration challenger for archived fantasy matchup forecasts.
// No production changes are permitted from this module.
const CLIP=1e-6;
const TEMPERATURES=[0.3,0.4,0.5,0.65,0.8,1.0];
const clamp=p=>Math.min(1-CLIP,Math.max(CLIP,p));
export function calibrateProbability(p,slope){
  if(!(p>=0&&p<=1)||!(slope>0&&slope<=1))throw new Error("Invalid forecast or slope");
  const logit=Math.log(clamp(p)/(1-clamp(p)));
  return 1/(1+Math.exp(-slope*logit));
}
export function brierScore(rows,probability=r=>r.probability){
  if(!rows.length)return null;
  return rows.reduce((sum,r)=>sum+(probability(r)-r.outcome)**2,0)/rows.length;
}
export function logLoss(rows,probability=r=>r.probability){
  if(!rows.length)return null;
  return rows.reduce((sum,r)=>{
    const p=clamp(probability(r));
    return sum-(r.outcome?Math.log(p):Math.log(1-p));
  },0)/rows.length;
}
const matchKey=r=>String(r.season)+":W"+r.week+":"+r.matchupId;
const weekKey=r=>String(r.season)+":W"+String(r.week).padStart(2,"0");
function validatedRows(rows){
  if(!Array.isArray(rows))throw new Error("Expected archived forecasts array");
  const used=new Set(),out=[];
  for(const r of rows){
    if(!r||!Number.isInteger(r.season)||r.season<2000||
      !Number.isInteger(r.week)||r.week<1||r.week>25||
      typeof r.matchupId!=="string"||!r.matchupId.trim()||
      !Number.isFinite(r.probability)||r.probability<0||r.probability>1||
      !(r.outcome===0||r.outcome===1)||
      !["pregame","live"].includes(r.phase)||
      r.scoring!=="PPR"||
      typeof r.leagueId!=="string"||!r.leagueId||
      !Number.isFinite(Date.parse(r.predictedAt))||
      !Number.isFinite(Date.parse(r.kickoffAt))||
      !Number.isFinite(Date.parse(r.resolvedAt))||
      Date.parse(r.kickoffAt)>=Date.parse(r.resolvedAt)||
      Date.parse(r.predictedAt)>=Date.parse(r.resolvedAt)||
      (r.phase==="pregame"&&Date.parse(r.predictedAt)>=Date.parse(r.kickoffAt))||
      (r.phase==="live"&&Date.parse(r.predictedAt)<Date.parse(r.kickoffAt))){
      throw new Error("Invalid archive row: require PPR, leagueId, phase, kickoffAt, predictedAt, resolvedAt and pre-outcome binary outcome");
    }
    const key=matchKey(r);
    if(used.has(key))throw new Error("Duplicate matchup "+key+"; choose one forecast issued before outcome");
    used.add(key);
    out.push({...r});
  }
  return out.sort((a,b)=>a.season-b.season||a.week-b.week||a.matchupId.localeCompare(b.matchupId));
}
function groupedBootstrap(held,calibrate,reps=600){
  const groups=new Map();
  for(const row of held){
    const key=weekKey(row);
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(row);
  }
  const weeks=[...groups.values()];
  let state=987654321;
  const random=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};
  const gains=[];
  for(let i=0;i<reps;i++){
    let total=0,n=0;
    for(let j=0;j<weeks.length;j++){
      const group=weeks[Math.floor(random()*weeks.length)];
      for(const r of group){
        total+=(r.probability-r.outcome)**2-(calibrate(r)-r.outcome)**2;n++;
      }
    }
    gains.push(total/n);
  }
  gains.sort((a,b)=>a-b);
  return [gains[Math.floor(.025*(gains.length-1))],gains[Math.floor(.975*(gains.length-1))]];
}
export function compareCalibration(rows,{
  minTrain=100,minHoldout=60,minTrainWeeks=8,minHoldoutWeeks=5,
  requiredBrierGain=.005
}={}){
  const ordered=validatedRows(rows);
  const leagueIds=new Set(ordered.map(r=>r.leagueId));
  const phases=new Set(ordered.map(r=>r.phase));
  if(leagueIds.size>1||phases.size>1)throw new Error("Mixing leagues or pregame and live forecasts is prohibited");
  const weeks=[...new Set(ordered.map(weekKey))];
  const split=Math.max(minTrainWeeks,Math.floor(weeks.length*.65));
  const trainKeys=new Set(weeks.slice(0,split));
  const train=ordered.filter(r=>trainKeys.has(weekKey(r)));
  const holdout=ordered.filter(r=>!trainKeys.has(weekKey(r)));
  const result={n:ordered.length,uniqueWeeks:weeks.length,trainN:train.length,
    holdoutN:holdout.length,trainWeeks:split,holdoutWeeks:weeks.length-split,
    status:"not_eligible",adopted:false,deploymentAuthorized:false};
  const reasons=[];
  if(train.length<minTrain)reasons.push("At least "+minTrain+" training games required");
  if(holdout.length<minHoldout)reasons.push("At least "+minHoldout+" held-out games required");
  if(split<minTrainWeeks)reasons.push("At least "+minTrainWeeks+" prior weeks required");
  if(weeks.length-split<minHoldoutWeeks)reasons.push("At least "+minHoldoutWeeks+" held-out weeks required");
  if(reasons.length)return {...result,reasons};
  const candidates=TEMPERATURES.map(slope=>({
    slope,score:brierScore(train,r=>calibrateProbability(r.probability,slope))
  })).sort((a,b)=>a.score-b.score||b.slope-a.slope);
  const slope=candidates[0].slope;
  const calibrated=r=>calibrateProbability(r.probability,slope);
  const original={brier:brierScore(holdout),logLoss:logLoss(holdout)};
  const candidate={brier:brierScore(holdout,calibrated),logLoss:logLoss(holdout,calibrated)};
  const climatology={brier:brierScore(holdout,()=>.5),logLoss:logLoss(holdout,()=>.5)};
  const ci95=groupedBootstrap(holdout,calibrated);
  const gain=original.brier-candidate.brier;
  if(slope===1)reasons.push("No calibration selected on training weeks");
  if(gain<requiredBrierGain)reasons.push("Insufficient held-out Brier gain");
  if(!(candidate.logLoss<original.logLoss))reasons.push("Held-out log-loss did not improve");
  if(!(candidate.brier<climatology.brier))reasons.push("Candidate worse than a 50% baseline");
  if(ci95[0]<=0)reasons.push("Bootstrap confidence interval includes zero gain");
  const adopted=reasons.length===0;
  return {...result,status:adopted?"pass_for_review":"reject_candidate",
    adopted,reasons,slope,original,candidate,climatology,brierGain:gain,
    bootstrapImprovementCI95:ci95,
    // This is a candidacy flag, not production deployment authorization.
    deploymentAuthorized:false};
}
