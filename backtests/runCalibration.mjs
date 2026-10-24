#!/usr/bin/env node
// Private, read-only calibration evaluation: run with local saved forecast records.
// Never upload private ESPN records to public GitHub or print source rows.
import {readFileSync} from 'node:fs';
import {compareCalibration} from './probabilityCalibration.mjs';

if(process.argv.length!==3){
  console.error("Usage: node backtests/runCalibration.mjs /private/path/to/archived-forecasts.json");
  process.exitCode=2;
}else{
  try{
    const path=process.argv[2];
    const records=JSON.parse(readFileSync(path,'utf8'));
    const result=compareCalibration(records);
    // Only aggregate model metrics; never display league names, user details or raw rows.
    console.log(JSON.stringify(result,null,2));
    if(!result.adopted)process.exitCode=1;
  }catch(e){
    console.error("Calibration blocked: "+e.message);
    process.exitCode=2;
  }
}
