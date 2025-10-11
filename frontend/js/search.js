// search.js
// Client-side search logic for /api/search
// Works for multiple search components by passing wrapper ID

function initSearch(wrapperId, inputId, resultsId) {
  const wrapper = document.getElementById(wrapperId);
  const input = document.getElementById(inputId);
  const resultsEl = document.getElementById(resultsId);

  if (!wrapper || !input || !resultsEl) {
    console.warn(`search.js: Elements not found for IDs: ${wrapperId}, ${inputId}, ${resultsId}`);
    return;
  }

  const DEBOUNCE_MS = 300;
  let debounceTimer = null;
  let controller = null;
  let items = [];
  let activeIndex = -1;

  // Escape HTML
  const esc = s => s == null ? '' : String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]);

  function renderLoading() {
    resultsEl.innerHTML = '<li class="result-loading" role="option" aria-disabled="true">Loading…</li>';
    resultsEl.classList.add('visible');
    input.setAttribute('aria-expanded', 'true');
    items = [];
    activeIndex = -1;
  }

  function renderEmpty() {
    resultsEl.innerHTML = '<li class="result-empty" role="option" aria-disabled="true">No results found</li>';
    resultsEl.classList.add('visible');
    input.setAttribute('aria-expanded', 'true');
    items = [];
    activeIndex = -1;
  }

  function renderError(msg) {
    resultsEl.innerHTML = `<li class="result-error" role="option" aria-disabled="true">${esc(msg || 'Error')}</li>`;
    resultsEl.classList.add('visible');
    input.setAttribute('aria-expanded', 'true');
    items = [];
    activeIndex = -1;
  }

  function renderResults(data) {
    if (!Array.isArray(data) || data.length === 0) return renderEmpty();
    items = data;
    resultsEl.innerHTML = '';

    data.forEach((it, i) => {
      const primary = esc(it.name || it.title || `Result ${i+1}`);
      const secondaryParts = [];
      if (it.title) secondaryParts.push(esc(it.title));
      if (it.qualification) secondaryParts.push(esc(it.qualification));
      if (it.place) secondaryParts.push(esc(it.place));
      if (it.subtitle) secondaryParts.push(esc(it.subtitle));
      const secondary = secondaryParts.join(' • ');

      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.id = `${wrapperId}-item-${i}`;
      li.dataset.index = i;
      li.className = 'search-result-item';
      li.innerHTML = `<div class="result-primary">${primary}</div>${secondary ? `<div class="result-secondary">${secondary}</div>` : ''}`;

      li.addEventListener('click', () => selectIndex(i));
      li.addEventListener('mousemove', () => setActiveIndex(i));

      resultsEl.appendChild(li);
    });

    resultsEl.classList.add('visible');
    input.setAttribute('aria-expanded', 'true');
    activeIndex = -1;
    input.removeAttribute('aria-activedescendant');
  }

  function hideResults() {
    resultsEl.classList.remove('visible');
    resultsEl.innerHTML = '';
    items = [];
    activeIndex = -1;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  }

  function setActiveIndex(i) {
    const nodes = resultsEl.querySelectorAll('li[role="option"]');
    if (!nodes || nodes.length === 0) return;
    if (i < 0) i = 0;
    if (i >= nodes.length) i = nodes.length - 1;
    nodes.forEach(n => n.setAttribute('aria-selected', 'false'));
    nodes[i].setAttribute('aria-selected', 'true');
    activeIndex = i;
    input.setAttribute('aria-activedescendant', nodes[i].id);
    nodes[i].scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function selectIndex(i) {
    const item = items[i];
    if (!item) return;
    input.value = item.name || item.title || '';
    hideResults();

    const ev = new CustomEvent('search-select', { detail: item });
    window.dispatchEvent(ev);
    console.log('search selected:', item);
  }

  async function doSearch(q) {
    if (controller) {
      try { controller.abort(); } catch {}
    }
    controller = new AbortController();
    const signal = controller.signal;

    renderLoading();

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=10`, { signal });
      if (!res.ok) return renderError(`Server returned ${res.status}`);
      const data = await res.json();
      renderResults(data);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error(err);
      renderError('Search failed');
    } finally {
      controller = null;
    }
  }

  input.addEventListener('input', () => {
    const q = input.value.trim();
    clearTimeout(debounceTimer);
    if (!q) return hideResults();
    debounceTimer = setTimeout(() => doSearch(q), DEBOUNCE_MS);
  });

  input.addEventListener('keydown', (ev) => {
    const key = ev.key;
    const nodes = resultsEl.querySelectorAll('li[role="option"]');
    if (!nodes.length) return;

    if (key === 'ArrowDown') { ev.preventDefault(); setActiveIndex(activeIndex + 1); }
    else if (key === 'ArrowUp') { ev.preventDefault(); setActiveIndex(activeIndex - 1); }
    else if (key === 'Enter') { if (activeIndex >= 0) { ev.preventDefault(); selectIndex(activeIndex); } else hideResults(); }
    else if (key === 'Escape') hideResults();
  });

  document.addEventListener('click', ev => { if (!wrapper.contains(ev.target)) hideResults(); });
  wrapper.addEventListener('focusout', () => setTimeout(() => { if (!wrapper.contains(document.activeElement)) hideResults(); }, 150));

  hideResults();

  return { input, resultsEl, wrapper };
}

// Initialize the navbar search
initSearch('searchComponent', 'search', 'searchResults');

// Initialize main content box-style search
initSearch('searchComponentMain', 'searchMain', 'searchResultsMain');
