const leftInput = document.getElementById('leftInput');
const rightInput = document.getElementById('rightInput');
const diffView = document.getElementById('diffView');

const autoCompare = document.getElementById('autoCompare');
const ignoreCase = document.getElementById('ignoreCase');
const ignoreWhitespace = document.getElementById('ignoreWhitespace');

const compareBtn = document.getElementById('compareBtn');
const swapBtn = document.getElementById('swapBtn');
const clearBtn = document.getElementById('clearBtn');
const copyModifiedBtn = document.getElementById('copyModified');
const leftPanel = document.querySelector('.text-panel-left .tool-panel');
const rightPanel = document.querySelector('.text-panel-right .tool-panel');

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
  triggerSwapCue();
  renderDiff();
});

clearBtn.addEventListener('click', () => {
  leftInput.value = '';
  rightInput.value = '';
  renderDiff();
});

let copyTimer = null;

if (copyModifiedBtn) {
  copyModifiedBtn.addEventListener('click', () => {
    const text = rightInput.value;
    if (!text) {
      return;
    }

    const onSuccess = () => {
      copyModifiedBtn.classList.add('copied');
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => {
        copyModifiedBtn.classList.remove('copied');
      }, 1500);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(onSuccess).catch(() => {
        fallbackCopy(text, onSuccess);
      });
    } else {
      fallbackCopy(text, onSuccess);
    }
  });
}

function fallbackCopy(text, onSuccess) {
  const selection = document.getSelection();
  const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

  rightInput.focus();
  rightInput.select();

  try {
    const successful = document.execCommand('copy');
    if (successful) {
      onSuccess();
    }
  } catch (error) {
    // Ignore copy failures silently.
  }

  rightInput.setSelectionRange(0, 0);
  rightInput.blur();

  if (selection && range) {
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

function triggerSwapCue() {
  if (!leftPanel || !rightPanel) {
    return;
  }
  leftPanel.classList.remove('swap-flash');
  rightPanel.classList.remove('swap-flash');
  void leftPanel.offsetWidth;
  leftPanel.classList.add('swap-flash');
  rightPanel.classList.add('swap-flash');
  setTimeout(() => {
    leftPanel.classList.remove('swap-flash');
    rightPanel.classList.remove('swap-flash');
  }, 500);
}

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
        right: rightLines[op.bIndex],
        leftIndex: op.aIndex,
        rightIndex: op.bIndex
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
          right: rightLines[rightIndex],
          leftIndex,
          rightIndex
        });
      } else if (leftIndex !== undefined) {
        rows.push({
          type: 'remove',
          left: leftLines[leftIndex],
          right: null,
          leftIndex,
          rightIndex: null
        });
      } else {
        rows.push({
          type: 'add',
          left: null,
          right: rightLines[rightIndex],
          leftIndex: null,
          rightIndex
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

  const prevRightTexts = new Array(rows.length).fill(null);
  const nextRightTexts = new Array(rows.length).fill(null);
  let lastRightText = null;
  for (let i = 0; i < rows.length; i += 1) {
    prevRightTexts[i] = lastRightText;
    if (rows[i].right !== null) {
      lastRightText = rows[i].right;
    }
  }
  let nextRightText = null;
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    nextRightTexts[i] = nextRightText;
    if (rows[i].right !== null) {
      nextRightText = rows[i].right;
    }
  }

  let added = 0;
  let removed = 0;
  let changed = 0;
  let equal = 0;

  rows.forEach((row, rowIndex) => {
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
    const leftIndex = row.leftIndex;
    const rightIndex = row.rightIndex;

    leftCell.className = `diff-cell ${leftHasContent ? `is-${row.type}` : 'is-empty'}`;
    rightCell.className = `diff-cell ${rightHasContent ? `is-${row.type}` : 'is-empty'}`;
    leftCell.dataset.label = 'Original';
    rightCell.dataset.label = 'Modified';

    if (leftHasContent) {
      leftNumber.textContent = leftIndex + 1;
    } else {
      leftNumber.textContent = '';
    }

    if (rightHasContent) {
      rightNumber.textContent = rightIndex + 1;
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

    if (row.type === 'change' && leftHasContent && rightHasContent) {
      rowEl.classList.add('has-action');
      const arrowBtn = document.createElement('button');
      arrowBtn.type = 'button';
      arrowBtn.className = 'diff-arrow';
      arrowBtn.setAttribute('aria-label', 'Apply original to modified');
      arrowBtn.setAttribute('title', 'Apply original to modified');
      arrowBtn.innerHTML = `<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M5 12h14\"></path><path d=\"M13 6l6 6-6 6\"></path></svg>`;
      arrowBtn.dataset.leftIndex = leftIndex;
      arrowBtn.dataset.rightIndex = rightIndex;
      arrowBtn.dataset.leftText = row.left;
      arrowBtn.dataset.rightText = row.right;
      arrowBtn.dataset.action = 'replace';
      arrowBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        applyOriginalToModified(arrowBtn.dataset);
      });
      rowEl.appendChild(arrowBtn);
    }

    if (row.type === 'remove' && leftHasContent) {
      rowEl.classList.add('has-action');
      const arrowBtn = document.createElement('button');
      arrowBtn.type = 'button';
      arrowBtn.className = 'diff-arrow';
      arrowBtn.setAttribute('aria-label', 'Insert original into modified');
      arrowBtn.setAttribute('title', 'Insert original into modified');
      arrowBtn.innerHTML = `<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M5 12h14\"></path><path d=\"M13 6l6 6-6 6\"></path></svg>`;
      arrowBtn.dataset.leftIndex = leftIndex;
      arrowBtn.dataset.leftText = row.left;
      arrowBtn.dataset.prevRightText = prevRightTexts[rowIndex] ?? '';
      arrowBtn.dataset.nextRightText = nextRightTexts[rowIndex] ?? '';
      arrowBtn.dataset.action = 'insert';
      arrowBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        applyOriginalToModified(arrowBtn.dataset);
      });
      rowEl.appendChild(arrowBtn);
    }

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

function applyOriginalToModified(data) {
  const leftIdx = Number.parseInt(data.leftIndex, 10);
  const rightIdx = Number.parseInt(data.rightIndex, 10);

  if (Number.isNaN(leftIdx)) {
    return;
  }

  const leftLines = splitLines(leftInput.value || '');
  const rightLines = splitLines(rightInput.value || '');
  const leftLine = data.leftText ?? leftLines[leftIdx];
  const rightLine = data.rightText;

  if (leftLine === undefined) {
    return;
  }

  if (data.action === 'insert') {
    const nextText = data.nextRightText || null;
    const prevText = data.prevRightText || null;
    let insertIdx = rightLines.length;

    if (nextText) {
      const idx = findNearestLineIndex(rightLines, nextText, Number.isNaN(rightIdx) ? null : rightIdx);
      if (idx !== -1) {
        insertIdx = idx;
      }
    }

    if (insertIdx === rightLines.length && prevText) {
      const idx = findNearestLineIndex(rightLines, prevText, Number.isNaN(rightIdx) ? null : rightIdx);
      if (idx !== -1) {
        insertIdx = idx + 1;
      }
    }

    rightLines.splice(insertIdx, 0, leftLine);
  } else {
    if (Number.isNaN(rightIdx)) {
      return;
    }
    let targetIdx = rightIdx;
    if (rightLine !== undefined && rightLines[targetIdx] !== rightLine) {
      let bestIndex = -1;
      let bestDistance = Infinity;
      for (let i = 0; i < rightLines.length; i += 1) {
        if (rightLines[i] === rightLine) {
          const distance = Math.abs(i - rightIdx);
          if (distance < bestDistance) {
            bestIndex = i;
            bestDistance = distance;
          }
        }
      }
      if (bestIndex === -1) {
        return;
      }
      targetIdx = bestIndex;
    }

    if (targetIdx < 0 || targetIdx >= rightLines.length) {
      return;
    }

    rightLines[targetIdx] = leftLine;
  }

  rightInput.value = rightLines.join('\n');
  renderDiff();
}

function findNearestLineIndex(lines, text, preferredIndex) {
  if (!text) {
    return -1;
  }
  let bestIndex = -1;
  let bestDistance = Infinity;
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i] === text) {
      if (preferredIndex === null || preferredIndex === undefined) {
        return i;
      }
      const distance = Math.abs(i - preferredIndex);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = i;
      }
    }
  }
  return bestIndex;
}

renderDiff();
