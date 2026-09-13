import test from 'node:test';
import assert from 'node:assert/strict';
import {estimatedWait,hasActiveTicket} from './estimate.mjs';

test('wait uses the existing minutes setting, including zero people ahead',()=>{
  assert.equal(estimatedWait(4,5),20);
  assert.equal(estimatedWait(3,5),15);
  assert.equal(estimatedWait(0,5),0);
  for(const [count,minutes] of [[null,5],[4,null],[4,0],[-1,5],[NaN,5],[4,'oops'],[4,Infinity]]) assert.equal(estimatedWait(count,minutes),null);
});
test('only waiting or called tickets are active',()=>{
  for(const ticket_status of ['waiting','called']) assert.equal(hasActiveTicket({ticket_number:23,ticket_status}),true);
  for(const ticket_status of ['served','cancelled',null,'']) assert.equal(hasActiveTicket({ticket_number:23,ticket_status}),false);
  assert.equal(hasActiveTicket(null),false);
  assert.equal(hasActiveTicket({ticket_number:null,ticket_status:'waiting'}),false);
});
