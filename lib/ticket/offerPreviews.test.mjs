import test from 'node:test';
import assert from 'node:assert/strict';
import {offerPreviews} from './publicSettings.mjs';

test('legacy empty offers and optional details remain compatible',()=>{
  assert.deepEqual(offerPreviews(null),[]);
  assert.deepEqual(offerPreviews([{title:'  Offre du jour  '}]),[{title:'Offre du jour',detail:'',image_url:null,url:null}]);
});
test('malformed offers and unsafe destinations cannot be saved',()=>{
  for(const value of [{},'offers',[null],[{}],[{title:'x',url:'javascript:alert(1)'}],[{title:'x',image_url:'data:image/svg+xml,x'}],Array(7).fill({title:'x'}),[{title:'x'.repeat(101)}]]) assert.throws(()=>offerPreviews(value));
});
test('each merchant offer keeps its own destination and display text',()=>{
  const input=[{title:'Menu midi',detail:'14,90 €',url:'https://example.com/menu#offres',image_url:'https://example.com/photo.jpg'}];
  assert.deepEqual(offerPreviews(input),input);
});
