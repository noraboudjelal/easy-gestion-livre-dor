import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('./deviceToken.js',import.meta.url),'utf8');
const {readDeviceToken,savedTicketSlugs}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));

test('catalogue recovery reads existing tokens and never creates one',t=>{
  const values=new Map([['lehnova-ticket:shop:device-token','a'.repeat(64)],['lehnova-ticket:broken:device-token','bad']]);
  let writes=0;
  global.window={localStorage:{getItem:k=>values.get(k),key:i=>[...values.keys()][i],get length(){return values.size;},setItem(){writes++;}},crypto:{getRandomValues(){throw new Error('Must not generate');}}};
  global.document={cookie:''};
  t.after(()=>{delete global.window;delete global.document;});
  assert.equal(readDeviceToken('shop'),'a'.repeat(64));
  assert.equal(readDeviceToken('missing'),null);
  assert.deepEqual(savedTicketSlugs(),['shop']);
  assert.equal(writes,0);
});
test('cookie fallback works when local storage is unavailable; malformed cookies are ignored',t=>{
  global.window={get localStorage(){throw new Error('Blocked');}};
  global.document={cookie:'lehnova-ticket-active-slug=shop; lehnova-ticket-shop='+'b'.repeat(64)};
  t.after(()=>{delete global.window;delete global.document;});
  assert.deepEqual(savedTicketSlugs(),['shop']);
  assert.equal(readDeviceToken('shop'),'b'.repeat(64));
  document.cookie='lehnova-ticket-shop=%broken';
  assert.equal(readDeviceToken('shop'),null);
});
