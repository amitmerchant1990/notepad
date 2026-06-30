const UNICODE_RECENT_KEY = 'recentUnicodeSymbols';
const UNICODE_ALL_LABEL = 'All Characters';
const UNICODE_RECENT_LABEL = 'Recently Used';

function initUnicodePicker(notepad) {
  if (!window.UNICODE_SYMBOLS || !Array.isArray(window.UNICODE_SYMBOLS)) {
    return;
  }

  const ui = selector().notepad;
  const symbolsByChar = new Map(window.UNICODE_SYMBOLS.map((symbol) => [symbol.char, symbol]));
  const categories = [UNICODE_ALL_LABEL, ...new Set(window.UNICODE_SYMBOLS.map((symbol) => symbol.category))];
  const state = {
    query: '',
    category: UNICODE_ALL_LABEL,
    activeIndex: 0,
    visibleSymbols: [],
    recentSymbols: loadRecentSymbols()
  };

  function loadRecentSymbols() {
    try {
      const raw = localStorage.getItem(UNICODE_RECENT_KEY);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((char) => symbolsByChar.has(char)) : [];
    } catch (error) {
      return [];
    }
  }

  function saveRecentSymbols(chars) {
    localStorage.setItem(UNICODE_RECENT_KEY, JSON.stringify(chars));
  }

  function resolveSymbols(chars) {
    return chars
      .map((char) => symbolsByChar.get(char))
      .filter(Boolean);
  }

  function normalizeText(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  function isMatch(symbol, query) {
    if (!query) {
      return true;
    }

    const haystack = [
      symbol.char,
      symbol.name,
      symbol.category,
      ...(symbol.keywords || [])
    ].join(' ');

    return normalizeText(haystack).includes(query);
  }

  function getFilteredSymbols() {
    const query = normalizeText(state.query);

    return window.UNICODE_SYMBOLS.filter((symbol) => {
      const categoryMatches = state.category === UNICODE_ALL_LABEL || symbol.category === state.category;
      return categoryMatches && isMatch(symbol, query);
    });
  }

  function getVisibleSections() {
    const filtered = getFilteredSymbols();

    if (!state.query && state.category === UNICODE_ALL_LABEL && state.recentSymbols.length > 0) {
      const recent = resolveSymbols(state.recentSymbols).filter(Boolean);
      const recentChars = new Set(recent.map((symbol) => symbol.char));
      const remaining = filtered.filter((symbol) => !recentChars.has(symbol.char));

      return [
        {
          title: UNICODE_RECENT_LABEL,
          items: recent
        },
        {
          title: UNICODE_ALL_LABEL,
          items: remaining
        }
      ].filter((section) => section.items.length > 0);
    }

    return [
      {
        title: state.category === UNICODE_ALL_LABEL ? UNICODE_ALL_LABEL : state.category,
        items: filtered
      }
    ].filter((section) => section.items.length > 0);
  }

  function getVisibleCount() {
    return state.visibleSymbols.length;
  }

  function getActiveSymbol() {
    return state.visibleSymbols[state.activeIndex] || state.visibleSymbols[0] || null;
  }

  function setActiveIndex(nextIndex) {
    const count = getVisibleCount();

    if (!count) {
      state.activeIndex = 0;
      renderActiveState();
      return;
    }

    const wrappedIndex = ((nextIndex % count) + count) % count;
    state.activeIndex = wrappedIndex;
    renderActiveState();
  }

  function getColumns() {
    const grid = ui.unicodePickerGrid && ui.unicodePickerGrid[0];

    if (!grid) {
      return 1;
    }

    const card = grid.querySelector('.unicode-picker-card');

    if (card) {
      const cardWidth = card.getBoundingClientRect().width || 96;
      return Math.max(1, Math.floor(grid.clientWidth / cardWidth));
    }

    return Math.max(1, Math.floor(grid.clientWidth / 96));
  }

  function moveActive(delta) {
    if (!getVisibleCount()) {
      return;
    }

    setActiveIndex(state.activeIndex + delta);
    scrollActiveIntoView();
  }

  function scrollActiveIntoView() {
    const activeCard = ui.unicodePickerGrid && ui.unicodePickerGrid.find('.unicode-picker-card.is-active')[0];
    if (activeCard && typeof activeCard.scrollIntoView === 'function') {
      activeCard.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }

  function renderActiveState() {
    if (!ui.unicodePickerGrid || !ui.unicodePickerGrid.length) {
      return;
    }

    ui.unicodePickerGrid.find('.unicode-picker-card').each(function () {
      const index = Number(this.getAttribute('data-unicode-index'));
      const isActive = index === state.activeIndex;
      this.classList.toggle('is-active', isActive);
      this.setAttribute('aria-selected', String(isActive));
    });

    scrollActiveIntoView();
  }

  function renderPicker() {
    const sections = getVisibleSections();
    const flatSymbols = [];
    const markup = sections.map((section) => {
      const sectionItems = section.items.map((symbol) => {
        const index = flatSymbols.length;
        flatSymbols.push(symbol);

        return `
          <button
            type="button"
            class="unicode-picker-card"
            data-unicode-index="${index}"
            data-symbol="${symbol.char}"
            aria-label="${symbol.name}"
            title="${symbol.name} (${symbol.char})"
          >
            <span class="unicode-picker-glyph">${symbol.char}</span>
            <span class="unicode-picker-name">${symbol.name}</span>
          </button>
        `;
      }).join('');

      return `
        <section class="unicode-picker-section">
          <div class="unicode-picker-section-title">${section.title}</div>
          <div class="unicode-picker-grid">${sectionItems}</div>
        </section>
      `;
    }).join('');

    state.visibleSymbols = flatSymbols;

    if (state.visibleSymbols.length === 0) {
      state.activeIndex = 0;
    } else if (state.activeIndex >= state.visibleSymbols.length) {
      state.activeIndex = 0;
    }

    ui.unicodePickerGrid.html(markup || '<div class="unicode-picker-empty">No symbols match your search.</div>');
    renderActiveState();
  }

  function updateRecentSymbols(char) {
    const next = [char, ...state.recentSymbols.filter((entry) => entry !== char)].slice(0, 12);
    state.recentSymbols = next;
    saveRecentSymbols(next);
  }

  function insertUnicodeSymbol(symbol) {
    if (!symbol || !notepad || !notepad.note || !notepad.note.length) {
      return;
    }

    const textarea = notepad.note[0];
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    textarea.focus();
    textarea.setSelectionRange(start, end);

    const inserted = document.execCommand && document.execCommand('insertText', false, symbol.char);

    if (!inserted) {
      textarea.setRangeText(symbol.char, start, end, 'end');
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    updateRecentSymbols(symbol.char);
  }

  function commitActiveSymbol() {
    const symbol = getActiveSymbol();
    if (!symbol) {
      return;
    }

    insertUnicodeSymbol(symbol);
    ui.unicodePickerModal.modal('hide');
  }

  function syncFilters() {
    state.query = ui.unicodePickerSearch.val() || '';
    state.category = ui.unicodePickerCategory.val() || UNICODE_ALL_LABEL;
    state.activeIndex = 0;
    renderPicker();
  }

  ui.unicodePickerCategory.empty();
  categories.forEach((category) => {
    ui.unicodePickerCategory.append(`<option value="${category}">${category}</option>`);
  });

  ui.unicodePickerSearch.on('input', syncFilters);

  ui.unicodePickerSearch.on('keydown', function (event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActive(getColumns());
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActive(-getColumns());
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveActive(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveActive(-1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      commitActiveSymbol();
    }
  });

  ui.unicodePickerGrid.on('click', '.unicode-picker-card', function () {
    const symbol = symbolsByChar.get(this.getAttribute('data-symbol'));
    if (!symbol) {
      return;
    }

    insertUnicodeSymbol(symbol);
    ui.unicodePickerModal.modal('hide');
  });

  ui.unicodePickerGrid.on('keydown', '.unicode-picker-card', function (event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const symbol = symbolsByChar.get(this.getAttribute('data-symbol'));
      if (symbol) {
        insertUnicodeSymbol(symbol);
        ui.unicodePickerModal.modal('hide');
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActive(getColumns());
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActive(-getColumns());
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveActive(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveActive(-1);
    }
  });

  ui.unicodePickerModal.on('shown.bs.modal', function () {
    ui.unicodePickerSearch.trigger('focus');
    syncFilters();
  });

  ui.unicodePickerModal.on('hidden.bs.modal', function () {
    ui.unicodePickerSearch.val('');
    ui.unicodePickerCategory.val(UNICODE_ALL_LABEL);
    state.query = '';
    state.category = UNICODE_ALL_LABEL;
    state.activeIndex = 0;
    state.visibleSymbols = [];
  });

  ui.unicodePickerTrigger.on('click', function (event) {
    event.preventDefault();
    ui.unicodePickerModal.modal('show');
  });

  renderPicker();

  return {
    open: function () {
      ui.unicodePickerModal.modal('show');
    },
    insert: insertUnicodeSymbol
  };
}
