/* ===========================================================
   ✅ dropdown.js – FINAL FIXED VERSION (RichFaces Safe)
=========================================================== */

/* ======= CONFIG ======= */
const MAX_CHIPS = 20;
const ABSOLUTE_MAX_CHIPS = 50;
const COLLAPSE_THRESHOLD = 10;

/* ======= HELPERS ======= */
function byId(id) { return document.getElementById(id); }
function qSel(sel) { return document.querySelector(sel); }
function qAll(sel) { return Array.from(document.querySelectorAll(sel)); }

/* ======= EVENT & PICKUP DROPDOWNS ======= */
function initializeCustomDropdowns() {
  const dropdowns = document.querySelectorAll('.rich-dropdown:not([data-skip-init="true"])');
  dropdowns.forEach(dropdown => {
    const label = dropdown.querySelector('.rich-dropdown-label');
    const labelText = dropdown.querySelector('.label-text');
    const checkboxes = dropdown.querySelectorAll('.dropdown-list input[type="checkbox"]:not(.notification-checkbox)');
    if (!label) return;

    label.addEventListener('click', e => {
      e.stopPropagation();
      dropdowns.forEach(d => { if (d !== dropdown) d.classList.remove('open'); });
      dropdown.classList.toggle('open');
    });

    checkboxes.forEach(cb => {
      cb.addEventListener('change', () => updateDropdownChips(dropdown, checkboxes, labelText));
    });

    updateDropdownChips(dropdown, checkboxes, labelText);
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.rich-dropdown')) {
      dropdowns.forEach(d => d.classList.remove('open'));
    }
  });
}

function updateDropdownChips(dropdown, checkboxes, labelText) {
  const selected = Array.from(checkboxes)
    .filter(c => c.checked)
    .map(c => {
      const text = c.nextElementSibling?.textContent.trim() || "";
      return { label: c.dataset.label || text, checkbox: c };
    });

  if (selected.length === 0) {
    labelText.innerHTML = labelText.dataset.default;
    return;
  }

  const total = selected.length;
  let chipsHTML = '';
  const visibleCount = Math.min(total, COLLAPSE_THRESHOLD);

  for (let i = 0; i < visibleCount; i++) {
    const item = selected[i];
    chipsHTML += `
      <span class="dropdown-chip" data-label="${escapeHtml(item.label)}">
        ${escapeHtml(item.label)}
        <button type="button" class="dropdown-chip-remove" onclick="removeDropdownChip(this, event)" title="Remove">×</button>
      </span>
    `;
  }

  if (total > COLLAPSE_THRESHOLD) {
    const remaining = total - COLLAPSE_THRESHOLD;
    chipsHTML += `
      <span class="dropdown-chip dropdown-chip-more" onclick="expandDropdownChips(this, event)">
        +${remaining} more
      </span>
    `;
  }

  labelText.innerHTML = chipsHTML;
}

function removeDropdownChip(button, event) {
  event.stopPropagation();
  event.preventDefault();
  const chip = button.closest('.dropdown-chip');
  const dropdown = button.closest('.rich-dropdown');
  const label = chip.dataset.label;
  const checkboxes = dropdown.querySelectorAll('.dropdown-list input[type="checkbox"]');
  checkboxes.forEach(cb => {
    const cbLabel = cb.dataset.label || cb.nextElementSibling?.textContent.trim();
    if (cbLabel === label) {
      cb.checked = false;
      cb.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
}

function expandDropdownChips(chip, event) {
  event.stopPropagation();
  event.preventDefault();
  const dropdown = chip.closest('.rich-dropdown');
  const labelText = dropdown.querySelector('.label-text');
  const checkboxes = dropdown.querySelectorAll('.dropdown-list input[type="checkbox"]');
  const selected = Array.from(checkboxes)
    .filter(c => c.checked)
    .map(c => c.dataset.label || c.nextElementSibling?.textContent.trim());
  let chipsHTML = '';
  selected.forEach(item => {
    chipsHTML += `
      <span class="dropdown-chip" data-label="${escapeHtml(item)}">
        ${escapeHtml(item)}
        <button type="button" class="dropdown-chip-remove" onclick="removeDropdownChip(this, event)" title="Remove">×</button>
      </span>
    `;
  });
  labelText.innerHTML = chipsHTML;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/* ✅ Safe selectAll for Event Codes & Pickup Types */
function selectAll(button, flag) {
  let dropdown = button.closest('.rich-dropdown');
  if (!dropdown) {
    const maybeList = button.closest('.dropdown-list');
    if (maybeList && maybeList.parentElement.classList.contains('rich-dropdown')) {
      dropdown = maybeList.parentElement;
    }
  }
  if (!dropdown) {
    console.warn("⚠️ selectAll(): Could not find .rich-dropdown for", button);
    return;
  }

  const checkboxes = dropdown.querySelectorAll('.dropdown-list input[type="checkbox"]:not(.notification-checkbox)');
  const labelText = dropdown.querySelector('.label-text');
  if (!checkboxes.length) return;

  checkboxes.forEach(cb => {
    cb.checked = flag;
    cb.dispatchEvent(new Event('change', { bubbles: true }));
  });

  updateDropdownChips(dropdown, checkboxes, labelText);
}

/* ======= FORM SUBMISSION ======= */
function prepareFormSubmit() {
  const eventDropdown = document.querySelector('.rich-dropdown:nth-of-type(1)');
  const eventCheckboxes = eventDropdown ? eventDropdown.querySelectorAll('.dropdown-list input[type="checkbox"]:checked') : [];
  const selectedEventCodes = Array.from(eventCheckboxes)
    .map(cb => cb.dataset.label || cb.nextElementSibling?.textContent.trim())
    .filter(Boolean);

  const pickupDropdown = document.querySelector('.rich-dropdown:nth-of-type(2)');
  const pickupCheckboxes = pickupDropdown ? pickupDropdown.querySelectorAll('.dropdown-list input[type="checkbox"]:checked') : [];
  const selectedPickupTypes = Array.from(pickupCheckboxes)
    .map(cb => cb.dataset.label || cb.nextElementSibling?.textContent.trim())
    .filter(Boolean);

  const eventCodesInput = document.getElementById('formId:selectedEventCodes');
  const pickupTypesInput = document.getElementById('formId:selectedPickupTypes');
  if (eventCodesInput) eventCodesInput.value = selectedEventCodes.join(',');
  if (pickupTypesInput) pickupTypesInput.value = selectedPickupTypes.join(',');
  return true;
}

/* ======= NOTIFICATION CHIPS + SUGGESTIONS ======= */
function getChipWrapper() { return byId('formId:chipInputWrapper'); }
function getChipsContainer() { return byId('chipsContainer'); }
function getChipEditor() { return byId('formId:chipInput'); }

/* ✅ Robust: find popup even if RichFaces re-renders it */
function getNotifPopup(event) {
  let popup = qSel('[id$="notificationSuggestion:list"]');
  if (!popup && event && event.target) {
    const possiblePopup = event.target.closest('[id*="notificationSuggestion"]');
    if (possiblePopup && possiblePopup.querySelectorAll('input[type="checkbox"]').length) {
      popup = possiblePopup;
    }
  }
  if (!popup) {
    const allPopups = qAll('div[id*="notificationSuggestion"]');
    popup = allPopups.find(p => p.querySelector('input[type="checkbox"]'));
  }
  return popup || null;
}

/* ======= CHIPS ======= */
function focusChipEditor() { const ed = getChipEditor(); if (ed) { ed.focus(); openNotifPopup(); } }
function openNotifPopup() { const popup = getNotifPopup(); if (popup) popup.style.display = 'block'; }
function keepNotifPopupOpen() { setTimeout(() => { const ed = getChipEditor(); if (ed) { ed.focus(); openNotifPopup(); } }, 50); }
function closeNotifPopupIfOutside(e) {
  const wrap = getChipWrapper(), popup = getNotifPopup();
  if (!wrap || !popup) return;
  if (!wrap.contains(e.target) && !popup.contains(e.target)) popup.style.display = 'none';
}

function extractLabelFromCheckbox(checkbox) {
  let label = '';
  if (!checkbox) return '';
  if (checkbox.nextSibling) {
    if (checkbox.nextSibling.nodeType === Node.TEXT_NODE)
      label = checkbox.nextSibling.textContent.trim();
    else if (checkbox.nextSibling.textContent)
      label = checkbox.nextSibling.textContent.trim();
  }
  if (!label && checkbox.parentElement) {
    const walker = document.createTreeWalker(checkbox.parentElement, NodeFilter.SHOW_TEXT, null, false);
    let node; const parts = [];
    while (node = walker.nextNode()) {
      const t = node.textContent.trim();
      if (t) parts.push(t);
    }
    label = parts.join(' ').trim();
  }
  if (!label) {
    const lab = checkbox.closest('label');
    if (lab) label = lab.textContent.trim();
  }
  return label || '';
}

/* ======= CHIP MANAGEMENT ======= */
function chipExists(label) { return !!qSel(`.chip[data-label="${cssEscape(label)}"]`); }
function cssEscape(s) { return (s || "").replace(/"/g, '\\"'); }
function getChipCount() { return qAll('.chip[data-label]').length; }

function addChip(label, { silent = false } = {}) {
  if (!label) return;
  const count = getChipCount();
  if (count >= ABSOLUTE_MAX_CHIPS) {
    toast(`Maximum ${ABSOLUTE_MAX_CHIPS} selections allowed`);
    const cb = getListCheckboxNodeByLabel(label);
    if (cb) cb.checked = false;
    return;
  }
  if (chipExists(label)) return;
  const chips = getChipsContainer();
  const chip = document.createElement('span');
  chip.className = 'chip';
  chip.setAttribute('data-label', label);
  chip.innerHTML = `
    <span class="chip-text" title="${escapeHtml(label)}">${escapeHtml(label)}</span>
    <button type="button" class="chip-remove" title="Remove">×</button>
  `;
  chip.querySelector('.chip-remove').addEventListener('click', () => onChipRemove(label));
  chips.appendChild(chip);
  updateChipCounterAndCollapse();
  if (!silent) window.rfToggleNotif && rfToggleNotif(label, true);
}

function removeChip(label, { silent = false } = {}) {
  const el = qSel(`.chip[data-label="${cssEscape(label)}"]`);
  if (el) el.remove();
  updateChipCounterAndCollapse();
  if (!silent) window.rfToggleNotif && rfToggleNotif(label, false);
}

function onChipRemove(label) {
  removeChip(label);
  const cb = getListCheckboxNodeByLabel(label);
  if (cb) {
    cb.checked = false;
    window.rfToggleNotif && rfToggleNotif(label, false);
  }
  keepNotifPopupOpen();
}

function updateChipCounterAndCollapse() {
  const cntEl = byId('chipCounter');
  const chips = qAll('.chip[data-label]');
  const total = chips.length;
  if (cntEl) cntEl.textContent = `${total}/${ABSOLUTE_MAX_CHIPS}`;
  const container = getChipsContainer();
  qAll('.chip-more').forEach(e => e.remove());
  if (total > MAX_CHIPS) {
    chips.forEach((c, idx) => c.style.display = (idx < MAX_CHIPS ? 'inline-flex' : 'none'));
    const more = document.createElement('span');
    more.className = 'chip chip-more';
    more.textContent = `+${total - MAX_CHIPS} more`;
    more.onclick = () => {
      chips.forEach(c => c.style.display = 'inline-flex');
      more.remove();
    };
    container.appendChild(more);
  } else {
    chips.forEach(c => c.style.display = 'inline-flex');
  }
}

/* ======= NOTIFICATION CHECKBOX HELPERS ======= */
function getListCheckboxNodeByLabel(label) {
  const rows = qAll('[id$="notificationSuggestion:list"] input[type="checkbox"]');
  for (const cb of rows) {
    const extracted = extractLabelFromCheckbox(cb);
    if (extracted === label) return cb;
  }
  return null;
}

function onSuggestionToggle(cb, label) {
  if (cb.checked) addChip(label);
  else removeChip(label);
  keepNotifPopupOpen();
}

/* ======= ✅ FIXED: SELECT ALL / CLEAR ALL ======= */
function selectAllNotifications(event) {
  if (event) { event.stopPropagation(); event.preventDefault(); }

  const popup = getNotifPopup(event);
  if (!popup) {
    console.warn("⚠️ selectAllNotifications(): popup not found");
    return false;
  }

  const checkboxes = Array.from(popup.querySelectorAll('input[type="checkbox"]'));
  if (!checkboxes.length) return false;

  const currentCount = getChipCount();
  const toSelect = checkboxes.filter(cb => !cb.checked).length;
  if (currentCount + toSelect > ABSOLUTE_MAX_CHIPS) {
    toast(`Maximum ${ABSOLUTE_MAX_CHIPS} selections allowed`);
    keepNotifPopupOpen();
    return false;
  }

  let success = 0;
  checkboxes.forEach(cb => {
    if (!cb.checked) {
      cb.checked = true;
      const label = extractLabelFromCheckbox(cb);
      cb.dispatchEvent(new Event('change', { bubbles: true }));
      if (label) addChip(label, { silent: false });
      success++;
    }
  });

  console.log(`Select All toggled ${success} items`);
  setTimeout(keepNotifPopupOpen, 120);
  return false;
}

function clearAllNotifications(event) {
  if (event) { event.stopPropagation(); event.preventDefault(); }

  const popup = getNotifPopup(event);
  if (!popup) {
    console.warn("⚠️ clearAllNotifications(): popup not found");
    return false;
  }

  const checkboxes = Array.from(popup.querySelectorAll('input[type="checkbox"]'));
  let success = 0;
  checkboxes.forEach(cb => {
    if (cb.checked) {
      cb.checked = false;
      const label = extractLabelFromCheckbox(cb);
      cb.dispatchEvent(new Event('change', { bubbles: true }));
      if (label) removeChip(label, { silent: false });
      success++;
    }
  });

  qAll('.chip[data-label]').forEach(chip => {
    const lbl = chip.getAttribute('data-label');
    if (lbl) removeChip(lbl, { silent: false });
  });

  console.log(`Clear All toggled off ${success} items`);
  setTimeout(keepNotifPopupOpen, 120);
  return false;
}

/* ======= TOAST ======= */
function toast(msg) {
  const el = document.createElement('div');
  el.textContent = msg;
  Object.assign(el.style, {
    position: 'fixed', bottom: '16px', right: '16px',
    padding: '10px 14px', background: '#111827', color: '#fff',
    borderRadius: '8px', fontSize: '12px',
    boxShadow: '0 6px 20px rgba(0,0,0,.25)', zIndex: 999999
  });
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

/* ======= INIT ======= */
window.addEventListener('load', () => {
  initializeCustomDropdowns();
  const preChecked = qAll('[id$="notificationSuggestion:list"] input[type="checkbox"]:checked');
  preChecked.forEach(cb => {
    const label = extractLabelFromCheckbox(cb);
    if (label) addChip(label, { silent: true });
  });
  updateChipCounterAndCollapse();
  document.addEventListener('mousedown', closeNotifPopupIfOutside, { capture: true });
});

if (window.A4J && A4J.AJAX) {
  A4J.AJAX.AddListener({
    onbeforedomupdate: () => { window._sb_keep_open = true; },
    oncomplete: () => {
      initializeCustomDropdowns();
      const allChips = qAll('.chip[data-label]');
      allChips.forEach(chip => {
        const label = chip.getAttribute('data-label');
        const cb = getListCheckboxNodeByLabel(label);
        if (cb && !cb.checked) cb.checked = true;
      });
      keepNotifPopupOpen();
      window._sb_keep_open = false;
    }
  });
}