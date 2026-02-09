const leftInput = document.getElementById('leftInput');
const rightInput = document.getElementById('rightInput');
const diffView = document.getElementById('diffView');

const autoCompare = document.getElementById('autoCompare');
const ignoreCase = document.getElementById('ignoreCase');
const ignoreWhitespace = document.getElementById('ignoreWhitespace');

const compareBtn = document.getElementById('compareBtn');
const swapBtn = document.getElementById('swapBtn');
const clearBtn = document.getElementById('clearBtn');

const statAdded = document.getElementById('statAdded');
const statRemoved = document.getElementById('statRemoved');
const statChanged = document.getElementById('statChanged');
const statEqual = document.getElementById('statEqual');

let diffTimer = null;

function scheduleDiff() {
  if (!autoCompare.checked) {
    return;
  }
  clearTimeout(diffTimer);
  diffTimer = setTimeout(renderDiff, 220);
}

leftInput.addEventListener('input', scheduleDiff);
rightInput.addEventListener('input', scheduleDiff);
ignoreCase.addEventListener('change', () => autoCompare.checked && renderDiff());
ignoreWhitespace.addEventListener('change', () => autoCompare.checked && renderDiff());

compareBtn.addEventListener('click', renderDiff);

swapBtn.addEventListener('click', () => {
  const leftValue = leftInput.value;
  leftInput.value = rightInput.value;
  rightInput.value = leftValue;
  renderDiff();
});

clearBtn.addEventListener('click', () => {
  leftInput.value = '';
  rightInput.value = '';
  renderDiff();
});

function splitLines(text) {
  if (text === '') {
    return [];
  }
  return text.split(/\r?\n/);
}

function normalizeLine(line) {
  let value = line;
  if (ignoreCase.checked) {
    value = value.toLowerCase();
  }
  if (ignoreWhitespace.checked) {
    value = value.trim().replace(/\s+/g, ' ');
  }
  return value;
}

function normalizeToken(token) {
  let value = token;
  if (ignoreCase.checked) {
    value = value.toLowerCase();
  }
  if (ignoreWhitespace.checked && /^\s+$/.test(value)) {
    value = ' ';
  }
  return value;
}

function tokenize(text) {
  if (text === '') {
    return [''];
  }
  return text.match(/\s+|[^\s]+/g) || [''];
}

function diffMyers(a, b) {
  const n = a.length;
  const m = b.length;

  if (n === 0) {
    return b.map((_, index) => ({ type: 'insert', bIndex: index }));
  }
  if (m === 0) {
    return a.map((_, index) => ({ type: 'delete', aIndex: index }));
  }

  const max = n + m;
  const offset = max;
  let v = new Array(2 * max + 1).fill(0);
  const trace = [];
  let found = false;

  for (let d = 0; d <= max; d += 1) {
    for (let k = -d; k <= d; k += 2) {
      const kIndex = offset + k;
      let x;

      if (k === -d || (k !== d && v[kIndex - 1] < v[kIndex + 1])) {
        x = v[kIndex + 1];
      } else {
        x = v[kIndex - 1] + 1;
      }

      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) {
        x += 1;
        y += 1;
      }
      v[kIndex] = x;

      if (x >= n && y >= m) {
        found = true;
      }
    }

    trace.push(v.slice());

    if (found) {
      break;
    }
  }

  return buildEdits(trace, n, m, offset);
}

function buildEdits(trace, n, m, offset) {
  const edits = [];
  let x = n;
  let y = m;

  for (let d = trace.length - 1; d >= 0; d -= 1) {
    const v = trace[d];
    const k = x - y;
    let prevK;

    if (k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1])) {
      prevK = k + 1;
    } else {
      prevK = k - 1;
    }

    const prevX = v[offset + prevK];
    const prevY = prevX - prevK;

    while (x > prevX && y > prevY) {
      edits.push({ type: 'equal', aIndex: x - 1, bIndex: y - 1 });
      x -= 1;
      y -= 1;
    }

    if (d === 0) {
      break;
    }

    if (x === prevX) {
      edits.push({ type: 'insert', bIndex: prevY });
    } else {
      edits.push({ type: 'delete', aIndex: prevX });
    }

    x = prevX;
    y = prevY;
  }

  return edits.reverse();
}

function buildRows(ops, leftLines, rightLines) {
  const rows = [];
  let index = 0;

  while (index < ops.length) {
    const op = ops[index];

    if (op.type === 'equal') {
      rows.push({
        type: 'equal',
        left: leftLines[op.aIndex],
        right: rightLines[op.bIndex]
      });
      index += 1;
      continue;
    }

    const deletes = [];
    const inserts = [];

    while (index < ops.length && ops[index].type !== 'equal') {
      const current = ops[index];
      if (current.type === 'delete') {
        deletes.push(current.aIndex);
      } else if (current.type === 'insert') {
        inserts.push(current.bIndex);
      }
      index += 1;
    }

    const max = Math.max(deletes.length, inserts.length);
    for (let i = 0; i < max; i += 1) {
      const leftIndex = deletes[i];
      const rightIndex = inserts[i];

      if (leftIndex !== undefined && rightIndex !== undefined) {
        rows.push({
          type: 'change',
          left: leftLines[leftIndex],
          right: rightLines[rightIndex]
        });
      } else if (leftIndex !== undefined) {
        rows.push({
          type: 'remove',
          left: leftLines[leftIndex],
          right: null
        });
      } else {
        rows.push({
          type: 'add',
          left: null,
          right: rightLines[rightIndex]
        });
      }
    }
  }

  return rows;
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function inlineDiff(leftText, rightText) {
  const leftTokens = tokenize(leftText);
  const rightTokens = tokenize(rightText);

  const leftKeys = leftTokens.map(normalizeToken);
  const rightKeys = rightTokens.map(normalizeToken);

  const ops = diffMyers(leftKeys, rightKeys);
  let leftHtml = '';
  let rightHtml = '';

  ops.forEach((op) => {
    if (op.type === 'equal') {
      const token = escapeHtml(leftTokens[op.aIndex]);
      leftHtml += token;
      rightHtml += token;
    } else if (op.type === 'delete') {
      const token = escapeHtml(leftTokens[op.aIndex]);
      leftHtml += `<span class="token delete">${token}</span>`;
    } else if (op.type === 'insert') {
      const token = escapeHtml(rightTokens[op.bIndex]);
      rightHtml += `<span class="token add">${token}</span>`;
    }
  });

  return { leftHtml: leftHtml || '&nbsp;', rightHtml: rightHtml || '&nbsp;' };
}

function renderDiff() {
  const leftText = leftInput.value || '';
  const rightText = rightInput.value || '';

  if (!leftText && !rightText) {
    diffView.innerHTML = '<div class="empty-state">Paste text in both boxes to see a diff preview.</div>';
    updateStats(0, 0, 0, 0);
    return;
  }

  const leftLines = splitLines(leftText);
  const rightLines = splitLines(rightText);

  const leftKeys = leftLines.map(normalizeLine);
  const rightKeys = rightLines.map(normalizeLine);

  const ops = diffMyers(leftKeys, rightKeys);
  const rows = buildRows(ops, leftLines, rightLines);

  renderRows(rows);
}

function renderRows(rows) {
  diffView.innerHTML = '';
  const fragment = document.createDocumentFragment();

  let leftLineNo = 0;
  let rightLineNo = 0;

  let added = 0;
  let removed = 0;
  let changed = 0;
  let equal = 0;

  rows.forEach((row) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'diff-row';

    const leftCell = document.createElement('div');
    const rightCell = document.createElement('div');

    const leftNumber = document.createElement('span');
    const rightNumber = document.createElement('span');
    leftNumber.className = 'line-number';
    rightNumber.className = 'line-number';

    const leftTextEl = document.createElement('span');
    const rightTextEl = document.createElement('span');
    leftTextEl.className = 'line-text';
    rightTextEl.className = 'line-text';

    const leftHasContent = row.left !== null;
    const rightHasContent = row.right !== null;

    leftCell.className = `diff-cell ${leftHasContent ? `is-${row.type}` : 'is-empty'}`;
    rightCell.className = `diff-cell ${rightHasContent ? `is-${row.type}` : 'is-empty'}`;
    leftCell.dataset.label = 'Original';
    rightCell.dataset.label = 'Modified';

    if (leftHasContent) {
      leftLineNo += 1;
      leftNumber.textContent = leftLineNo;
    } else {
      leftNumber.textContent = '';
    }

    if (rightHasContent) {
      rightLineNo += 1;
      rightNumber.textContent = rightLineNo;
    } else {
      rightNumber.textContent = '';
    }

    if (row.type === 'change' && row.left !== null && row.right !== null) {
      const inline = inlineDiff(row.left, row.right);
      leftTextEl.innerHTML = inline.leftHtml;
      rightTextEl.innerHTML = inline.rightHtml;
    } else {
      leftTextEl.textContent = row.left === null ? '' : row.left;
      rightTextEl.textContent = row.right === null ? '' : row.right;
    }

    leftCell.appendChild(leftNumber);
    leftCell.appendChild(leftTextEl);
    rightCell.appendChild(rightNumber);
    rightCell.appendChild(rightTextEl);

    rowEl.appendChild(leftCell);
    rowEl.appendChild(rightCell);

    fragment.appendChild(rowEl);

    if (row.type === 'add') {
      added += 1;
    } else if (row.type === 'remove') {
      removed += 1;
    } else if (row.type === 'change') {
      changed += 1;
    } else {
      equal += 1;
    }
  });

  diffView.appendChild(fragment);
  updateStats(added, removed, changed, equal);
}

function updateStats(added, removed, changed, equal) {
  statAdded.textContent = added;
  statRemoved.textContent = removed;
  statChanged.textContent = changed;
  statEqual.textContent = equal;
}

renderDiff();
