import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEvent, validConsent, validRange, contactKind } from './model.mjs';
const id='11111111-1111-4111-8111-111111111111';
const event={catalogId:id,visitorId:id,eventId:id,sessionId:id,kind:'visit',consent:1};
test('collect only consented, bounded, catalogue-scoped event types',()=>{
  assert.ok(validateEvent(event));
  for(const field of ['catalogId','visitorId','eventId','sessionId']) assert.equal(validateEvent({...event,[field]:'invalid'}),false);
  assert.equal(validateEvent({...event,consent:0}),false);
  assert.equal(validateEvent({...event,kind:'arbitrary-url'}),false);
  assert.equal(validateEvent({...event,productId:id}),false);
  assert.equal(validateEvent({...event,kind:'product_click'}),false);
  assert.ok(validateEvent({...event,kind:'product_click',productId:id}));
});
test('consent expires; future or unsupported choices are rejected',()=>{
  const now=180*86400000;
  assert.ok(validConsent({version:1,accepted:true,at:now},now));
  assert.ok(validConsent({version:1,accepted:false,at:now},now));
  for(const choice of [null,{version:1,accepted:true,at:0},{version:1,accepted:true,at:now+1},{version:2,accepted:true,at:now}]) assert.equal(validConsent(choice,now),false);
});
test('contact classification does not collect URLs or match malicious lookalikes',()=>{
  assert.equal(contactKind('https://wa.me/33123456?text=hello'),'whatsapp');
  assert.equal(contactKind('tel:+33123456'),'phone');
  assert.equal(contactKind('https://m.facebook.com/example'),'facebook');
  assert.equal(contactKind('https://instagram.com.attacker.test'),null);
  assert.equal(contactKind('javascript:alert(1)'),null);
  assert.equal(contactKind('#contact'),null);
});
test('ranges reject invalid dates, excessive spans and future periods',()=>{
  const now=new Date('2026-10-16T12:00:00Z');
  assert.ok(validRange('2026-10-01','2026-10-16','day',now));
  assert.ok(validRange('2026-01-01','2026-10-16','year',now));
  for(const args of [['2026-02-30','2026-10-16','day'],['2026-10-17','2026-10-18','day'],['2026-10-16','2026-10-01','day'],['2024-01-01','2026-10-16','day'],['2026-01-01','2026-10-16','bad']])assert.equal(validRange(...args,now),false);
});
