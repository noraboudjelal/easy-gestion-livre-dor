import test from 'node:test';
import assert from 'node:assert/strict';
import {offersUrl,statisticsDate,parisToday} from './publicSettings.mjs';

test('optional offers accept only complete web links',()=>{
  assert.equal(offersUrl(null),null);assert.equal(offersUrl(''),null);
  assert.equal(offersUrl(' https://lehnova.fr/offres '),'https://lehnova.fr/offres');
  for(const value of ['javascript:alert(1)','data:text/html,test','https://user:secret@site.fr','/offers',{},'x'.repeat(2001)]) assert.throws(()=>offersUrl(value));
});
test('statistics reject impossible or malformed dates',()=>{
  for(const value of ['2026-02-29','2026-02-30','2026-13-01','oops','2026-1-1',null]) assert.equal(statisticsDate(value),false);
  assert.equal(statisticsDate('2024-02-29'),true);
  assert.equal(statisticsDate(parisToday()),true);
});
