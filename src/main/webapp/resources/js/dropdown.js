/* ===========================================================
   ✅ dropdowns.js – FIXED VERSION with Single Form Submit
=========================================================== */

/* ======= CONFIG ======= */
const MAX_CHIPS = 20;          // Soft limit - show "+N more" after this
const ABSOLUTE_MAX_CHIPS = 50; // Hard limit - no selections allowed beyond this
const COLLAPSE_THRESHOLD = 10; // Show "+N more" after this many visible chips

/* ======= HELPERS ======= */
function byId(id){ return document.getElementById(id); }
function qSel(sel){ return document.querySelector(sel); }
function qAll(sel){ return Array.from(document.querySelectorAll(sel)); }

/* ======= EVENT & PICKUP DROPDOWNS WITH CHIP DISPLAY ======= */
function initializeCustomDropdowns() {
  const dropdowns = document.querySelectorAll('.rich-dropdown:not([data-skip-init="true"])');

  dropdowns.forEach(dropdown => {
    const label = dropdown.querySelector('.rich-dropdown-label');
    const labelText = dropdown.querySelector('.label-text');
    const checkboxes = dropdown.querySelectorAll('.dropdown-list input[type="checkbox"]:not(.notification-checkbox)');
    if (!label) return;

    // Click to toggle dropdown
    label.addEventListener('click', e => {
      e.stopPropagation();
      dropdowns.forEach(d => { if (d !== dropdown) d.classList.remove('open'); });
      dropdown.classList.toggle('open');
    });

    // Update chips display when checkboxes change
    // NOTE: No Ajax call here anymore - just UI update
    checkboxes.forEach(cb => {
      cb.addEventListener('change', () => {
        updateDropdownChips(dropdown, checkboxes, labelText);
      });
    });

    // Initial render
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
      return {
        label: c.dataset.label || text,
        checkbox: c
      };
    });

  if (selected.length === 0) {
    labelText.innerHTML = labelText.dataset.default;
    return;
  }

  // Check limits
  const total = selected.length;
  
  // Create chips HTML with remove buttons
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
  
  // Add "+N more" if needed
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
  
  // Find and uncheck the corresponding checkbox
  const checkboxes = dropdown.querySelectorAll('.dropdown-list input[type="checkbox"]');
  checkboxes.forEach(cb => {
    const cbLabel = cb.dataset.label || cb.nextElementSibling?.textContent.trim();
    if (cbLabel === label) {
      cb.checked = false;
      // NOTE: No Ajax call - just trigger change event for UI update
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
  
  // Get all selected items
  const selected = Array.from(checkboxes)
    .filter(c => c.checked)
    .map(c => {
      const text = c.nextElementSibling?.textContent.trim() || "";
      return c.dataset.label || text;
    });
  
  // Show all chips without "+N more"
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

function selectAll(button, flag) {
  const dropdown = button.closest('.rich-dropdown');
  const checkboxes = dropdown.querySelectorAll('.dropdown-list input[type="checkbox"]:not(.notification-checkbox)');
  const labelText = dropdown.querySelector('.label-text');
  
  // Count current selections
  const currentCount = Array.from(checkboxes).filter(cb => cb.checked).length;
  
  if (flag) {
    // Check if selecting all would exceed absolute max
    if (checkboxes.length > ABSOLUTE_MAX_CHIPS) {
      toast(`Maximum ${ABSOLUTE_MAX_CHIPS} selections allowed`);
      return;
    }
  }
  
  checkboxes.forEach(cb => {
    if (cb.checked !== flag) {
      cb.checked = flag;
      // NOTE: No Ajax call - just trigger change event for UI update
      cb.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  updateDropdownChips(dropdown, checkboxes, labelText);
}

/* ======= NEW: Form submission handler ======= */
function prepareFormSubmit() {
  // Get Event Codes dropdown (first rich-dropdown)
  const eventDropdown = document.querySelector('.rich-dropdown:nth-of-type(1)');
  const eventCheckboxes = eventDropdown ? 
    eventDropdown.querySelectorAll('.dropdown-list input[type="checkbox"]:checked') : [];
  
  const selectedEventCodes = Array.from(eventCheckboxes)
    .map(cb => cb.dataset.label || cb.nextElementSibling?.textContent.trim())
    .filter(Boolean);
  
  // Get Pickup Types dropdown (second rich-dropdown)
  const pickupDropdown = document.querySelector('.rich-dropdown:nth-of-type(2)');
  const pickupCheckboxes = pickupDropdown ? 
    pickupDropdown.querySelectorAll('.dropdown-list input[type="checkbox"]:checked') : [];
  
  const selectedPickupTypes = Array.from(pickupCheckboxes)
    .map(cb => cb.dataset.label || cb.nextElementSibling?.textContent.trim())
    .filter(Boolean);
  
  // Set hidden fields
  const eventCodesInput = document.getElementById('formId:selectedEventCodes');
  const pickupTypesInput = document.getElementById('formId:selectedPickupTypes');
  
  if (eventCodesInput) {
    eventCodesInput.value = selectedEventCodes.join(',');
    console.log('Event Codes to submit:', selectedEventCodes.join(','));
  }
  
  if (pickupTypesInput) {
    pickupTypesInput.value = selectedPickupTypes.join(',');
    console.log('Pickup Types to submit:', selectedPickupTypes.join(','));
  }
  
  // Return true to allow form submission to proceed
  return true;
}

/* ======= NOTIFICATION CHIPS + SUGGESTIONS ======= */
function getChipWrapper(){ return byId('formId:chipInputWrapper'); }
function getChipsContainer(){ return byId('chipsContainer'); }
function getChipEditor(){ return byId('formId:chipInput'); }
function getNotifPopup(){ return qSel('[id$="notificationSuggestion:list"]'); }

function getListCheckboxNodeByLabel(label){
  // Find the checkbox in the suggestion list row whose sibling text equals label
  const rows = qAll('[id$="notificationSuggestion:list"] input[type="checkbox"]');
  for (const cb of rows) {
    const rowText = (cb.parentNode?.textContent || '').trim();
    // Extract just the message text (after the checkbox)
    const textNode = cb.nextSibling;
    const msgText = textNode ? textNode.textContent.trim() : '';
    if (msgText === label || rowText.endsWith(label)) return cb;
  }
  return null;
}

function focusChipEditor(){
  const ed = getChipEditor();
  if (ed){ ed.focus(); openNotifPopup(); }
}

function openNotifPopup(){
  const popup = getNotifPopup();
  if (popup){ popup.style.display = 'block'; }
}

function keepNotifPopupOpen(){
  setTimeout(() => {
    const ed = getChipEditor();
    if (ed){
      // Clear the input field to show all suggestions, not filtered ones
      ed.value = '';
      ed.focus();
      openNotifPopup();
      // Trigger input event to force RichFaces to refresh suggestions
      ed.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, 200); // Increased delay for better reliability with RichFaces AJAX updates
}

function closeNotifPopupIfOutside(e){
  const wrap = getChipWrapper();
  const popup = getNotifPopup();
  if (!wrap || !popup) return;
  const inside = wrap.contains(e.target) || popup.contains(e.target);
  if (!inside) popup.style.display = 'none';
}

function lastToken(str){
  const parts = (str || "").split(",");
  return (parts[parts.length-1] || "").trim();
}

function handleChipTyping(ev){
  const token = lastToken(ev.target.value);
  if (token.length > 0) openNotifPopup();
}

/* ======= CHIP UI: instant client-side updates ======= */
function chipExists(label){
  return !!qSel(`.chip[data-label="${cssEscape(label)}"]`);
}
function cssEscape(s){ return (s || "").replace(/"/g,'\\"'); }

function addChip(label, {silent=false} = {}){
  if (!label) return;

  // Check absolute max limit
  const count = getChipCount();
  if (count >= ABSOLUTE_MAX_CHIPS){
    toast(`Maximum ${ABSOLUTE_MAX_CHIPS} selections allowed`);
    // revert checkbox UI if this came from a toggle
    const cb = getListCheckboxNodeByLabel(label);
    if (cb) cb.checked = false;
    return;
  }

  if (chipExists(label)) return; // no duplicates

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

  if (!silent) {
    // Sync server in background (notifications still use Ajax per-item)
    window.rfToggleNotif && rfToggleNotif(label, true);
  }
}

function removeChip(label, {silent=false} = {}){
  const el = qSel(`.chip[data-label="${cssEscape(label)}"]`);
  if (el) el.remove();

  updateChipCounterAndCollapse();

  if (!silent) {
    window.rfToggleNotif && rfToggleNotif(label, false);
  }
}

function onChipRemove(label){
  // Update UI now
  removeChip(label);

  // Also uncheck the checkbox in the suggestion list UI, if visible
  const cb = getListCheckboxNodeByLabel(label);
  if (cb) {
    cb.checked = false;
    // Sync to server
    window.rfToggleNotif && rfToggleNotif(label, false);
  }

  // ISSUE C FIX: Clear input field when removing a chip too
  const ed = getChipEditor();
  if (ed) {
    ed.value = '';
  }

  keepNotifPopupOpen();
}

function getChipCount(){
  return qAll('.chip[data-label]').length;
}

function updateChipCounterAndCollapse(){
  const cntEl = byId('chipCounter');
  const chips = qAll('.chip[data-label]');
  const total = chips.length;

  if (cntEl){
    cntEl.textContent = MAX_CHIPS ? `${total}/${ABSOLUTE_MAX_CHIPS}` : `${total}`;
  }

  // Collapse logic: show first N, collapse rest into +N more
  const container = getChipsContainer();
  // clear previous "+N more"
  qAll('.chip-more').forEach(e => e.remove());

  if (total > MAX_CHIPS){
    chips.forEach((c, idx) => c.style.display = (idx < MAX_CHIPS ? 'inline-flex' : 'none'));
    const more = document.createElement('span');
    more.className = 'chip chip-more';
    more.textContent = `+${total - MAX_CHIPS} more`;
    more.title = 'Click to show all';
    more.onclick = () => {
      chips.forEach(c => c.style.display = 'inline-flex');
      more.remove();
    };
    container.appendChild(more);
  } else {
    chips.forEach(c => c.style.display = 'inline-flex');
  }
}

/* === Hook checkbox changes from suggestion rows === */
function onSuggestionToggle(cb, label){
  if (cb.checked) {
    addChip(label);
  } else {
    removeChip(label);
  }

  // ISSUE C FIX: Clear the input field immediately after selection
  // This ensures no letter remains next to the chips and allows re-typing the same letter
  const ed = getChipEditor();
  if (ed) {
    ed.value = '';
  }

  keepNotifPopupOpen();
}

/* ======= SELECT ALL / CLEAR ALL FOR NOTIFICATIONS ======= */
function selectAllNotifications(event) {
  // Prevent event propagation and default behavior
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  console.log('Select All clicked');

  // Get the suggestion popup
  const popup = getNotifPopup();
  if (!popup) {
    console.log('Popup not found');
    return false;
  }

  // ISSUE B FIX: Find all checkboxes without requiring .notification-checkbox class
  // Use the same selector pattern as getListCheckboxNodeByLabel()
  const checkboxes = Array.from(popup.querySelectorAll('input[type="checkbox"]'));
  console.log('Found checkboxes:', checkboxes.length);

  const currentCount = getChipCount();

  // Calculate how many unchecked items we'd be adding
  const uncheckedCount = checkboxes.filter(cb => !cb.checked).length;

  // Check if selecting all would exceed absolute max
  if (currentCount + uncheckedCount > ABSOLUTE_MAX_CHIPS) {
    toast(`Maximum ${ABSOLUTE_MAX_CHIPS} selections allowed`);
    keepNotifPopupOpen();
    return false;
  }

  // Process each checkbox
  checkboxes.forEach((cb, index) => {
    if (!cb.checked) {
      // ISSUE B FIX: Get the label text using nextSibling like getListCheckboxNodeByLabel()
      const textNode = cb.nextSibling;
      const label = textNode ? textNode.textContent.trim() : '';

      console.log(`Checking item ${index}: ${label}`);

      if (label) {
        // Check the checkbox
        cb.checked = true;

        // Add chip to UI
        addChip(label, {silent: false});
      }
    }
  });

  // ISSUE A FIX: Clear input and keep popup open with all suggestions visible
  const ed = getChipEditor();
  if (ed) {
    ed.value = '';
  }

  keepNotifPopupOpen();

  return false;
}

function clearAllNotifications(event) {
  // Prevent event propagation and default behavior
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  console.log('Clear All clicked');

  // Get the suggestion popup
  const popup = getNotifPopup();
  if (!popup) {
    console.log('Popup not found');
    return false;
  }

  // ISSUE B FIX: Find all checkboxes without requiring .notification-checkbox class
  const checkboxes = Array.from(popup.querySelectorAll('input[type="checkbox"]'));
  console.log('Found checkboxes:', checkboxes.length);

  // Process each checkbox
  checkboxes.forEach((cb, index) => {
    if (cb.checked) {
      // ISSUE B FIX: Get the label text using nextSibling like getListCheckboxNodeByLabel()
      const textNode = cb.nextSibling;
      const label = textNode ? textNode.textContent.trim() : '';

      console.log(`Unchecking item ${index}: ${label}`);

      // Uncheck the checkbox
      cb.checked = false;

      if (label) {
        // Remove chip from UI
        removeChip(label, {silent: false});
      }
    }
  });

  // Also clear any remaining chips in the UI (safety net)
  const allChips = qAll('.chip[data-label]');
  allChips.forEach(chip => {
    const label = chip.getAttribute('data-label');
    if (label) {
      removeChip(label, {silent: false});
    }
  });

  // ISSUE A FIX: Clear input and keep popup open with all suggestions visible
  const ed = getChipEditor();
  if (ed) {
    ed.value = '';
  }

  keepNotifPopupOpen();

  return false;
}

/* ======= Toast (lightweight) ======= */
function toast(msg){
  const el = document.createElement('div');
  el.textContent = msg;
  Object.assign(el.style, {
    position:'fixed', bottom:'16px', right:'16px', padding:'10px 14px',
    background:'#111827', color:'#fff', borderRadius:'8px',
    fontSize:'12px', boxShadow:'0 6px 20px rgba(0,0,0,.25)', zIndex: 999999
  });
  document.body.appendChild(el);
  setTimeout(()=> el.remove(), 2500);
}

/* ======= INIT / REBIND ======= */
window.addEventListener('load', () => {
  initializeCustomDropdowns();

  // Build initial chips from any preselected items on first load
  const preChecked = qAll('[id$="notificationSuggestion:list"] input[type="checkbox"]:checked');
  preChecked.forEach(cb => {
    const labelNode = cb.nextSibling;
    const label = labelNode ? labelNode.textContent.trim() : '';
    if (label) addChip(label, {silent:true});
  });
  updateChipCounterAndCollapse();

  document.addEventListener('mousedown', closeNotifPopupIfOutside, { capture: true });
});

if (window.A4J && A4J.AJAX) {
  A4J.AJAX.AddListener({
    onbeforedomupdate: function(){ window._sb_keep_open = true; },
    oncomplete: function() {
      // After any RF update, reinitialize dropdowns and keep notification popup open
      initializeCustomDropdowns();
      
      // Resync notification checkboxes with chips
      const allChips = qAll('.chip[data-label]');
      allChips.forEach(chip => {
        const label = chip.getAttribute('data-label');
        const cb = getListCheckboxNodeByLabel(label);
        if (cb && !cb.checked) {
          cb.checked = true;
        }
      });
      
      keepNotifPopupOpen();
      window._sb_keep_open = false;
    }
  });
}
