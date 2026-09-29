import {test} from 'node:test';
import assert from 'node:assert/strict';
import {decodeAttribute, numericValue, list} from '../web/s57-attributes.mjs';

test('decodes scalar and list attributes without dropping unknown codes', () => {
  assert.equal(decodeAttribute('WATLEV', 5), 'Awash');
  assert.equal(decodeAttribute('CATWRK', '2'), 'Dangerous wreck');
  for (const value of [[3, 999], '["3","999"]']) {
    assert.equal(decodeAttribute('QUASOU', value), 'Doubtful sounding; Unknown QUASOU code (999)');
  }
  assert.equal(decodeAttribute('WATLEV', '__proto__'), 'Unknown WATLEV code (__proto__)');
  assert.equal(decodeAttribute('QUASOU', '[]'), 'Not recorded');
  assert.equal(decodeAttribute('WATLEV', null), 'Not recorded');
  assert.deepEqual(list([3,4]), ['3','4']);
});
test('depth numbers preserve zero and negatives, rejecting missing and malformed data', () => {
  for (const value of [null, undefined, '', ' ', false, true, [], {}, 'NaN', 'Infinity']) assert.equal(numericValue(value), null);
  assert.equal(numericValue('0'), 0);
  assert.equal(numericValue(-1.2), -1.2);
  assert.equal(numericValue('9.1'), 9.1);
});
