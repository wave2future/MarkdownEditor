function pairChanges(operations) {
  const rows = [];
  for (let i = 0; i < operations.length;) {
    if (operations[i].type === 'same') {
      rows.push(operations[i++]);
      continue;
    }
    const removed = [];
    const added = [];
    while (i < operations.length && operations[i].type !== 'same') {
      (operations[i].type === 'remove' ? removed : added).push(operations[i]);
      i++;
    }
    const length = Math.max(removed.length, added.length);
    for (let j = 0; j < length; j++) {
      const left = removed[j];
      const right = added[j];
      rows.push({
        type: left && right ? 'change' : left ? 'remove' : 'add',
        leftLine: left?.leftLine ?? null,
        leftText: left?.leftText ?? '',
        rightLine: right?.rightLine ?? null,
        rightText: right?.rightText ?? ''
      });
    }
  }
  return rows;
}

function coarseDiff(left, right) {
  let prefix = 0;
  while (prefix < left.length && prefix < right.length && left[prefix] === right[prefix]) prefix++;
  let leftEnd = left.length - 1;
  let rightEnd = right.length - 1;
  while (leftEnd >= prefix && rightEnd >= prefix && left[leftEnd] === right[rightEnd]) {
    leftEnd--;
    rightEnd--;
  }
  const operations = [];
  for (let i = 0; i < prefix; i++) {
    operations.push({ type: 'same', leftLine: i + 1, leftText: left[i], rightLine: i + 1, rightText: right[i] });
  }
  for (let i = prefix; i <= leftEnd; i++) operations.push({ type: 'remove', leftLine: i + 1, leftText: left[i] });
  for (let i = prefix; i <= rightEnd; i++) operations.push({ type: 'add', rightLine: i + 1, rightText: right[i] });
  const suffixLength = left.length - leftEnd - 1;
  for (let i = 0; i < suffixLength; i++) {
    const li = leftEnd + 1 + i;
    const ri = rightEnd + 1 + i;
    operations.push({ type: 'same', leftLine: li + 1, leftText: left[li], rightLine: ri + 1, rightText: right[ri] });
  }
  return pairChanges(operations);
}

function diffLines(leftText, rightText) {
  const left = String(leftText).split('\n');
  const right = String(rightText).split('\n');
  if (left.length * right.length > 250000) return coarseDiff(left, right);

  const width = right.length + 1;
  const table = Array.from({ length: left.length + 1 }, () => new Uint32Array(width));
  for (let i = left.length - 1; i >= 0; i--) {
    for (let j = right.length - 1; j >= 0; j--) {
      table[i][j] = left[i] === right[j]
        ? table[i + 1][j + 1] + 1
        : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const operations = [];
  let i = 0;
  let j = 0;
  while (i < left.length || j < right.length) {
    if (i < left.length && j < right.length && left[i] === right[j]) {
      operations.push({ type: 'same', leftLine: i + 1, leftText: left[i], rightLine: j + 1, rightText: right[j] });
      i++;
      j++;
    } else if (j < right.length && (i === left.length || table[i][j + 1] >= table[i + 1][j])) {
      operations.push({ type: 'add', rightLine: j + 1, rightText: right[j++] });
    } else {
      operations.push({ type: 'remove', leftLine: i + 1, leftText: left[i++] });
    }
  }
  return pairChanges(operations);
}

module.exports = { diffLines };
