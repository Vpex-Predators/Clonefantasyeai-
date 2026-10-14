import fs from 'node:fs';
const review = JSON.parse(fs.readFileSync(new URL('../docs/release/review.json', import.meta.url)));
const failures = [];
for (const key of ['privacyPolicyUrl', 'accountDeletionUrl']) {
  try { if (new URL(review[key]).protocol !== 'https:') throw new Error(); }
  catch { failures.push(`${key}: supply the published, verified HTTPS page.`); }
}
for (const name of ['backendIsolationAndCors', 'nativeAuthenticationAndRecovery', 'completeAccountDeletion', 'androidDeviceAndPrelaunchTests', 'dataSafetyAndContentRating']) {
  const check = review.checks?.[name];
  if (check?.passed !== true || !check.evidence?.trim()) failures.push(`${name}: testing/review evidence is missing.`);
}
if (failures.length) {
  console.error('Release is blocked:\n' + failures.join('\n'));
  process.exit(1);
}
console.log('Recorded release checks are complete. This does not replace Play Console review.');
