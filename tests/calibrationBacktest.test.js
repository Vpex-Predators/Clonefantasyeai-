import test from 'node:test';
import assert from 'node:assert/strict';
import {compareCalibration,brierScore,logLoss,calibrateProbability} from '../backtests/probabilityCalibration.mjs';

function archive(weeks=20,gamesPerWeek=12,quality="overconfident"){
  const rows=[];
  for(let week=1;week<=weeks;week++){
    for(let k=0;k<gamesPerWeek;k++){
      // Fixed 2/3 home-favorite performance: a 93% forecast is overconfident.
      const favorite=k<gamesPerWeek/2;
      const p=quality==="neutral"?.5:(favorite?.93:.07);
      const win=favorite?(k%6<4?1:0):(k%6<2?1:0);
      const at=new Date(Date.UTC(2025,8,1+7*week));
      rows.push({season:2025,week,matchupId:"match-"+week+"-"+k,
        probability:p,outcome:win,predictedAt:new Date(at.getTime()-86400000).toISOString(),
        resolvedAt:at.toISOString()});
    }
  }
  return rows;
}

test('historical archive too small to fit, test, or promote a calibration',()=>{
  const result=compareCalibration(archive(4,4));
  assert.equal(result.status,'not_eligible');
  assert.equal(result.adopted,false);
  assert.equal(result.deploymentAuthorized,false);
});
test('repeat matchup is rejected rather than double-counted',()=>{
  const rows=archive(1,2);
  assert.throws(()=>compareCalibration([...rows,rows[0]]),/Duplicate matchup/);
});
test('post-outcome forecasts cannot enter backtest',()=>{
  const rows=archive(1,2);
  rows[0].predictedAt=rows[0].resolvedAt;
  assert.throws(()=>compareCalibration(rows),/Invalid archive row/);
});
test('calibration cannot convert valid probabilities to invalid values',()=>{
  for(const p of [0,.000001,.01,.1,.5,.9,.999999,1]){
    for(const slope of [.3,.5,.8,1]){
      const v=calibrateProbability(p,slope);
      assert.ok(v>0&&v<1);
    }
  }
});
test('out-of-sample gain is sufficient to select the calibration challenger on known overconfidence',()=>{
  const result=compareCalibration(archive());
  assert.equal(result.status,'pass_for_review',JSON.stringify(result));
  assert.equal(result.adopted,true);
  assert.equal(result.deploymentAuthorized,false);
  assert.ok(result.slope<1);
  assert.ok(result.original.brier>result.candidate.brier);
  assert.ok(result.original.logLoss>result.candidate.logLoss);
  assert.ok(result.bootstrapImprovementCI95[0]>0);
});
test('neutral forecasts do not trigger needless calibration changes',()=>{
  const result=compareCalibration(archive(20,12,'neutral'));
  assert.equal(result.status,'reject_candidate',JSON.stringify(result));
  assert.equal(result.adopted,false);
});
test('Brier and log loss are zero-ish for accurate decisive forecasts',()=>{
  const records=[{probability:.99,outcome:1},{probability:.01,outcome:0}];
  assert.ok(brierScore(records)<.001);
  assert.ok(logLoss(records)<.02);
});
