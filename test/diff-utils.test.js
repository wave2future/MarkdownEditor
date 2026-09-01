const test = require('node:test');
const assert = require('node:assert/strict');
const { diffLines } = require('../lib/diff-utils');

test('pairs changed lines for side-by-side display', () => {
  assert.deepEqual(diffLines('one\ntwo\nthree', 'one\nTWO\nthree'), [
    { type: 'same', leftLine: 1, leftText: 'one', rightLine: 1, rightText: 'one' },
    { type: 'change', leftLine: 2, leftText: 'two', rightLine: 2, rightText: 'TWO' },
    { type: 'same', leftLine: 3, leftText: 'three', rightLine: 3, rightText: 'three' }
  ]);
});

test('represents inserted and removed lines', () => {
  const inserted = diffLines('one\nthree', 'one\ntwo\nthree');
  assert.equal(inserted[1].type, 'add');
  assert.equal(inserted[1].rightText, 'two');
  const removed = diffLines('one\ntwo\nthree', 'one\nthree');
  assert.equal(removed[1].type, 'remove');
  assert.equal(removed[1].leftText, 'two');
});

test('uses a bounded coarse diff for very large documents', () => {
  const left = Array.from({ length: 600 }, (_, index) => `left-${index}`).join('\n');
  const right = Array.from({ length: 600 }, (_, index) => `right-${index}`).join('\n');
  const result = diffLines(left, right);
  assert.equal(result.length, 600);
  assert.equal(result[0].type, 'change');
});
