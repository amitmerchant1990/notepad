const storageKey = 'notepad_text_tools_text_v1';

const inputText = document.getElementById('inputText');
const copyButton = document.getElementById('copyButton');
const statusText = document.getElementById('statusText');
const statsText = document.getElementById('statsText');
const toast = document.getElementById('toast');
const toastBody = toast.querySelector('.toast-body');
const toolTabs = Array.from(document.querySelectorAll('.tool-tab'));
const toolPanels = Array.from(document.querySelectorAll('.tool-panel'));
const actionButtons = Array.from(document.querySelectorAll('.tool-action'));
const findInput = document.getElementById('findInput');
const replaceInput = document.getElementById('replaceInput');
const useRegex = document.getElementById('useRegex');
const replaceBtn = document.getElementById('replaceBtn');
const replaceAllBtn = document.getElementById('replaceAllBtn');
const resultPanel = document.getElementById('resultPanel');
const resultText = document.getElementById('resultText');
const resultCount = document.getElementById('resultCount');
const copyResultsButton = document.getElementById('copyResultsButton');
const themeToggle = document.getElementById('themeToggle');
const themeMeta = document.querySelector('meta[name="theme-color"]');

const themeStorageKey = 'notepad_text_tools_theme_v1';
const lightThemeColor = '#343a40';
const darkThemeColor = '#0e141a';

let toastTimer = null;
let lastFindIndex = -1;

const sampleText = [
  'Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do.',
  '',
  'Contact: alice@example.com, team@acme.org',
  '',
  'Links: https://notepad.js.org, www.acme.org',
  '',
  'IDs: 887878, 99899, +919876543210'
].join('\n');

function showToast(message) {
  toastBody.textContent = message;
  toast.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.style.display = 'none';
  }, 2200);
}

function setStatus(message) {
  statusText.textContent = message;
}

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.body.classList.toggle('dark', isDark);
  themeToggle.setAttribute('aria-pressed', String(isDark));
  themeToggle.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');

  if (themeMeta) {
    themeMeta.setAttribute('content', isDark ? darkThemeColor : lightThemeColor);
  }
}

function toggleTheme() {
  const nextTheme = document.body.classList.contains('dark') ? 'light' : 'dark';
  localStorage.setItem(themeStorageKey, nextTheme);
  applyTheme(nextTheme);
}

function persistText() {
  localStorage.setItem(storageKey, inputText.value);
}

function updateStats() {
  const value = inputText.value;
  const trimmed = value.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const chars = value.length;
  const lines = value ? value.split(/\r?\n/).length : 0;
  statsText.textContent = `${words} words • ${chars} chars • ${lines} lines`;
}

function copyValue(value, button, defaultLabel) {
  if (!value) {
    return;
  }

  navigator.clipboard.writeText(value).then(() => {
    button.textContent = 'Copied!';
    button.classList.remove('btn-outline-secondary');
    button.classList.add('btn-success');

    setTimeout(() => {
      button.textContent = defaultLabel;
      button.classList.remove('btn-success');
      button.classList.add('btn-outline-secondary');
    }, 1800);
  });
}

function splitLines(value) {
  if (value === '') {
    return [];
  }

  return value.split(/\r?\n/);
}

function setEditorValue(nextValue, message) {
  inputText.value = nextValue;
  persistText();
  updateStats();
  setStatus(message);
}

function withLines(transformer, successMessage) {
  const lines = splitLines(inputText.value);

  if (lines.length === 0) {
    showToast('Please enter text first.');
    return;
  }

  setEditorValue(transformer(lines).join('\n'), successMessage);
}

function wrapText(text, width) {
  return text
    .split(/\r?\n/)
    .map((line) => {
      if (!line.trim()) {
        return '';
      }

      const words = line.trim().split(/\s+/);
      const wrapped = [];
      let current = '';

      words.forEach((word) => {
        if (!current) {
          current = word;
          return;
        }

        if ((current + ' ' + word).length <= width) {
          current += ` ${word}`;
        } else {
          wrapped.push(current);
          current = word;
        }
      });

      if (current) {
        wrapped.push(current);
      }

      return wrapped.join('\n');
    })
    .join('\n');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildFindRegex(globalMode) {
  const query = findInput.value;

  if (!query) {
    showToast('Please enter text to find.');
    return null;
  }

  try {
    const pattern = useRegex.checked ? query : escapeRegExp(query);
    return new RegExp(pattern, globalMode ? 'g' : '');
  } catch (error) {
    showToast('Invalid regular expression.');
    return null;
  }
}

function showResults(items, typeLabel) {
  resultPanel.hidden = false;
  resultText.value = items.join('\n');
  resultCount.textContent = `Found ${items.length} ${typeLabel}`;
}

function hideResults() {
  resultPanel.hidden = true;
  resultText.value = '';
  resultCount.textContent = 'Found 0 items';
}

function uniqueOrdered(values) {
  const seen = new Set();
  return values.filter((value) => {
    const key = value.toLowerCase();
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function normalizeUrl(value) {
  return value
    .trim()
    .replace(/^[("'[{]+/, '')
    .replace(/[)\]}"',.;:!?]+$/g, '');
}

function extractItems(type) {
  const value = inputText.value;

  if (!value.trim()) {
    showToast('Please enter text first.');
    return;
  }

  let items = [];
  let label = 'items';

  if (type === 'extractEmails') {
    items = uniqueOrdered(value.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi) || []);
    label = 'emails';
  }

  if (type === 'extractUrls') {
    items = uniqueOrdered((value.match(/\b(?:https?:\/\/|www\.)[^\s<>"']+/gi) || []).map(normalizeUrl).filter(Boolean));
    label = 'URLs';
  }

  if (type === 'extractNumbers') {
    items = uniqueOrdered(value.match(/[-+]?(?:\d[\d,]*\.?\d*|\.\d+)/g) || []);
    label = 'numbers';
  }

  showResults(items, label);
  setStatus(items.length ? `Extracted ${items.length} ${label}.` : `No ${label} found.`);
}

function activatePanel(panelId) {
  toolTabs.forEach((tab) => {
    const isActive = tab.dataset.panel === panelId;
    tab.classList.toggle('active', isActive);
  });

  toolPanels.forEach((panel) => {
    panel.classList.toggle('active', panel.id === panelId);
  });

  if (panelId !== 'extractPanel') {
    hideResults();
  }
}

function handleAction(action) {
  switch (action) {
    case 'sortAsc':
      withLines((lines) => [...lines].sort((a, b) => a.localeCompare(b)), 'Sorted lines A-Z.');
      break;
    case 'sortDesc':
      withLines((lines) => [...lines].sort((a, b) => b.localeCompare(a)), 'Sorted lines Z-A.');
      break;
    case 'sortLength':
      withLines((lines) => [...lines].sort((a, b) => a.length - b.length), 'Sorted lines by length.');
      break;
    case 'reverseOrder':
      withLines((lines) => [...lines].reverse(), 'Reversed line order.');
      break;
    case 'shuffleLines':
      withLines((lines) => {
        const clone = [...lines];
        for (let index = clone.length - 1; index > 0; index -= 1) {
          const swapIndex = Math.floor(Math.random() * (index + 1));
          [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
        }
        return clone;
      }, 'Shuffled lines.');
      break;
    case 'removeDuplicates':
      withLines((lines) => {
        const seen = new Set();
        return lines.filter((line) => {
          if (seen.has(line)) {
            return false;
          }

          seen.add(line);
          return true;
        });
      }, 'Removed duplicate lines.');
      break;
    case 'addLineNumbers':
      withLines((lines) => lines.map((line, index) => `${index + 1}. ${line}`), 'Added line numbers.');
      break;
    case 'removeLineNumbers':
      withLines((lines) => lines.map((line) => line.replace(/^\s*\d+[.)-]?\s*/, '')), 'Removed line numbers.');
      break;
    case 'trimLines':
      withLines((lines) => lines.map((line) => line.trim()), 'Trimmed each line.');
      break;
    case 'removeEmptyLines':
      withLines((lines) => lines.filter((line) => line.trim() !== ''), 'Removed empty lines.');
      break;
    case 'removeExtraSpaces':
      setEditorValue(inputText.value.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n'), 'Removed extra spaces.');
      break;
    case 'joinLines':
      setEditorValue(splitLines(inputText.value).map((line) => line.trim()).filter(Boolean).join(' '), 'Joined lines.');
      break;
    case 'wrap80':
      setEditorValue(wrapText(inputText.value, 80), 'Wrapped text at 80 characters.');
      break;
    case 'wrap120':
      setEditorValue(wrapText(inputText.value, 120), 'Wrapped text at 120 characters.');
      break;
    case 'encodeUrl':
      setEditorValue(encodeURIComponent(inputText.value), 'URL encoded text.');
      break;
    case 'decodeUrl':
      try {
        setEditorValue(decodeURIComponent(inputText.value), 'URL decoded text.');
      } catch (error) {
        showToast('Could not decode URL text.');
      }
      break;
    case 'extractEmails':
    case 'extractUrls':
    case 'extractNumbers':
      extractItems(action);
      break;
    default:
      break;
  }
}

function replaceNext() {
  const regex = buildFindRegex(false);

  if (!regex) {
    return;
  }

  const value = inputText.value;
  const source = value.slice(lastFindIndex + 1);
  const match = source.match(regex);

  if (!match || typeof match.index !== 'number') {
    lastFindIndex = -1;
    showToast('No more matches found.');
    setStatus('No more matches found.');
    return;
  }

  const matchStart = lastFindIndex + 1 + match.index;
  const matchEnd = matchStart + match[0].length;
  const replacement = replaceInput.value;

  inputText.focus();
  inputText.setSelectionRange(matchStart, matchEnd);
  inputText.setRangeText(replacement, matchStart, matchEnd, 'end');

  lastFindIndex = matchStart + replacement.length - 1;
  persistText();
  updateStats();
  setStatus('Replaced one match.');
}

function replaceAll() {
  const regex = buildFindRegex(true);

  if (!regex) {
    return;
  }

  const value = inputText.value;
  const matches = value.match(regex);

  if (!matches || matches.length === 0) {
    showToast('No matches found.');
    setStatus('No matches found.');
    return;
  }

  setEditorValue(value.replace(regex, replaceInput.value), `Replaced ${matches.length} matches.`);
  lastFindIndex = -1;
}

copyButton.addEventListener('click', () => {
  copyValue(inputText.value, copyButton, 'Copy');
});

copyResultsButton.addEventListener('click', () => {
  copyValue(resultText.value, copyResultsButton, 'Copy All');
});

themeToggle.addEventListener('click', toggleTheme);

toolTabs.forEach((tab) => {
  tab.addEventListener('click', () => activatePanel(tab.dataset.panel));
});

actionButtons.forEach((button) => {
  button.addEventListener('click', () => handleAction(button.dataset.action));
});

replaceBtn.addEventListener('click', replaceNext);
replaceAllBtn.addEventListener('click', replaceAll);

inputText.addEventListener('input', () => {
  persistText();
  updateStats();
  lastFindIndex = -1;
});

const savedText = localStorage.getItem(storageKey);
const savedTheme = localStorage.getItem(themeStorageKey) || 'light';
if (savedText) {
  inputText.value = savedText;
} else {
  inputText.value = sampleText;
  persistText();
}

applyTheme(savedTheme);
updateStats();
setStatus('Ready.');
