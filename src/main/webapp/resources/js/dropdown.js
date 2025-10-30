/* ===========================================================
   dropdown.js — FIXED VERSION with proper Ajax data handling
=========================================================== */

const MAX_CHIPS = 20;
const ABSOLUTE_MAX_CHIPS = 50;
const COLLAPSE_THRESHOLD = 10;

/* ---------- Helpers ---------- */
function byId(id) { return document.getElementById(id); }
function qSel(sel) { return document.querySelector(sel); }
function qAll(sel) { return Array.from(document.querySelectorAll(sel)); }

/* ===========================================================
   EVENT & PICKUP DROPDOWNS
=========================================================== */
function initializeCustomDropdowns() {
  const dropdowns = qAll(".rich-dropdown");
  dropdowns.forEach((dropdown) => {
    const label = dropdown.querySelector(".rich-dropdown-label");
    const labelText = dropdown.querySelector(".label-text");
    const checkboxes = dropdown.querySelectorAll(".dropdown-list input[type='checkbox']");

    if (!label || label._bound) return;
    label._bound = true;

    // Toggle dropdown open/close
    label.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdowns.forEach((d) => {
        if (d !== dropdown) d.classList.remove("open");
      });
      dropdown.classList.toggle("open");
    });

    // Update label chips when selection changes
    checkboxes.forEach((cb) => {
      cb.addEventListener("change", () =>
        updateDropdownChips(dropdown, checkboxes, labelText)
      );
    });

    updateDropdownChips(dropdown, checkboxes, labelText);
  });

  // Close dropdowns when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".rich-dropdown")) {
      dropdowns.forEach((d) => d.classList.remove("open"));
    }
  });
}

/* Render selected chips inside dropdown label */
function updateDropdownChips(dropdown, checkboxes, labelText) {
  const selected = Array.from(checkboxes)
    .filter((c) => c.checked)
    .map((c) => c.dataset.label || c.nextElementSibling?.textContent.trim());

  // Update counter in "selected/total" format
  const dropdownId = dropdown.getAttribute('data-dropdown-id');
  if (dropdownId) {
    const counter = byId(dropdownId + 'Counter');
    if (counter) {
      const totalCount = checkboxes.length;
      const selectedCount = selected.length;
      counter.textContent = `${selectedCount}/${totalCount}`;
    }
  }

  if (!selected.length) {
    labelText.innerHTML = labelText.dataset.default;
    return;
  }

  const visibleCount = Math.min(selected.length, COLLAPSE_THRESHOLD);
  let html = "";

  selected.slice(0, visibleCount).forEach((label) => {
    html += `<span class="dropdown-chip" data-label="${label}">
      ${label}
      <button type="button" class="dropdown-chip-remove" onclick="removeDropdownChip(this, event)">×</button>
    </span>`;
  });

  if (selected.length > COLLAPSE_THRESHOLD) {
    const remaining = selected.length - COLLAPSE_THRESHOLD;
    html += `<span class="dropdown-chip dropdown-chip-more" onclick="expandDropdownChips(this, event)">+${remaining} more</span>`;
  }

  labelText.innerHTML = html;
}

/* Remove a chip by clicking × inside label */
function removeDropdownChip(button, event) {
  event.stopPropagation();
  const chip = button.closest(".dropdown-chip");
  const label = chip.dataset.label;
  const dropdown = chip.closest(".rich-dropdown");
  const checkboxes = dropdown.querySelectorAll(".dropdown-list input[type='checkbox']");
  checkboxes.forEach((cb) => {
    const lbl = cb.dataset.label || cb.nextElementSibling?.textContent.trim();
    if (lbl === label) {
      cb.checked = false;
      cb.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
}

/* Expand collapsed chips (+N more) */
function expandDropdownChips(button, event) {
  event.stopPropagation();
  const dropdown = button.closest(".rich-dropdown");
  const labelText = dropdown.querySelector(".label-text");
  const checkboxes = dropdown.querySelectorAll(".dropdown-list input[type='checkbox']");
  const selected = Array.from(checkboxes)
    .filter((c) => c.checked)
    .map((c) => c.dataset.label || c.nextElementSibling?.textContent.trim());
  labelText.innerHTML = selected
    .map(
      (label) => `
      <span class="dropdown-chip" data-label="${label}">
        ${label}
        <button type="button" class="dropdown-chip-remove" onclick="removeDropdownChip(this, event)">×</button>
      </span>`
    )
    .join("");
}

/* Select/Clear all inside a dropdown */
function selectAll(button, flag) {
  const dropdown = button.closest(".rich-dropdown");
  if (!dropdown) return;
  const checkboxes = dropdown.querySelectorAll(".dropdown-list input[type='checkbox']");
  const labelText = dropdown.querySelector(".label-text");
  checkboxes.forEach((cb) => {
    cb.checked = flag;
    cb.dispatchEvent(new Event("change", { bubbles: true }));
  });
  updateDropdownChips(dropdown, checkboxes, labelText);
}

/* ===========================================================
   FORM SUBMISSION
=========================================================== */
function prepareFormSubmit() {
  const eventDropdown = qSel("[data-dropdown-id='eventCodes']");
  const pickupDropdown = qSel("[data-dropdown-id='pickupType']");
  
  if (!eventDropdown || !pickupDropdown) {
    console.error('[ERROR] Could not find dropdowns for form submission');
    return true;
  }
  
  const eventValues = Array.from(
    eventDropdown.querySelectorAll(".dropdown-list input[type='checkbox']:checked")
  ).map((cb) => cb.dataset.label || cb.nextElementSibling?.textContent.trim());
  
  const pickupValues = Array.from(
    pickupDropdown.querySelectorAll(".dropdown-list input[type='checkbox']:checked")
  ).map((cb) => cb.dataset.label || cb.nextElementSibling?.textContent.trim());

  console.log('[DEBUG] Event values:', eventValues);
  console.log('[DEBUG] Pickup values:', pickupValues);

  byId("formId:selectedEventCodes").value = eventValues.join(",");
  byId("formId:selectedPickupTypes").value = pickupValues.join(",");
  
  return true;
}

/* ===========================================================
   NOTIFICATION POPUP + CHIPS
=========================================================== */
function getChipEditor() { return byId("formId:chipInput"); }
function getChipsContainer() { return byId("chipsContainer"); }
function getNotifPopup() { return byId("notifPopup"); }

/* Position notification popup below the chip input field */
function positionNotifPopup() {
  const popup = getNotifPopup();
  const chipInput = document.getElementById('formId:chipInputWrapper');
  
  if (popup && chipInput) {
    const rect = chipInput.getBoundingClientRect();
    const parentRect = chipInput.parentElement.getBoundingClientRect();
    
    popup.style.top = (rect.bottom - parentRect.top + 4) + 'px';
    popup.style.left = (rect.left - parentRect.left) + 'px';
  }
}

function openCustomNotifPopup() {
  const popup = getNotifPopup();
  
  if (popup) {
    positionNotifPopup();
    popup.style.display = 'block';
  }
  
  const ed = getChipEditor();
  const q = ed ? ed.value : '';
  
  // Call the Ajax function if it exists
  if (typeof fetchNotifSuggestions === 'function') {
    try {
      fetchNotifSuggestions(q);
    } catch (err) {
      console.warn('fetchNotifSuggestions() call failed', err);
    }
  } else {
    console.warn('fetchNotifSuggestions() not defined — RichFaces script may not be loaded.');
  }
}


/* Close popup if clicked outside */
document.addEventListener("mousedown", (e) => {
  const popup = getNotifPopup();
  const input = getChipEditor();
  if (!popup || !input) return;
  if (!popup.contains(e.target) && !input.contains(e.target))
    popup.style.display = "none";
});

/* Handle typing (live Ajax search) */
let notifTimer = null;
function handleChipTyping(event) {
  const q = event.target.value || '';
  clearTimeout(notifTimer);
  notifTimer = setTimeout(() => {
    if (typeof fetchNotifSuggestions === 'function') {
      try {
        fetchNotifSuggestions(q);
      } catch (err) {
        console.warn('fetchNotifSuggestions() call failed', err);
      }
    }
  }, 150);
}

/* Handle backspace to remove chips */
function handleChipBackspace(event) {
  const input = event.target;
  
  // Only handle backspace when input is empty
  if (event.key === 'Backspace' && input.value === '') {
    const chips = qAll('.chip[data-label]');
    if (chips.length > 0) {
      // Remove the last chip
      const lastChip = chips[chips.length - 1];
      const label = lastChip.dataset.label;
      removeChip(label);
      event.preventDefault();
    }
  }
}

/* ✅ FIXED: Callback now properly receives data from bean property */
function onFetchNotifSuggestionsComplete(event, jsonData) {
  console.log('[DEBUG] onFetchNotifSuggestionsComplete called');
  console.log('[DEBUG] jsonData received:', jsonData);
  
  let results = [];
  
  try {
    // The jsonData parameter contains the JSON string from the bean
    if (jsonData && typeof jsonData === 'string') {
      results = JSON.parse(jsonData);
      console.log('[DEBUG] Successfully parsed JSON, results count:', results.length);
    } else {
      console.warn('[WARN] jsonData is empty or not a string');
    }
  } catch (e) {
    console.error('[ERROR] Failed to parse JSON:', e);
    console.error('[ERROR] jsonData was:', jsonData);
  }
  
  renderNotifSuggestions(results);
}

/* Display suggestions */
function renderNotifSuggestions(results) {
  console.log('[DEBUG] renderNotifSuggestions called with', results.length, 'results');
  
  const popup = getNotifPopup();
  const list = byId("notifList");
  if (!popup || !list) {
    console.error('[ERROR] Popup or list element not found');
    return;
  }
  
  list.innerHTML = "";

  if (!results.length) {
    list.innerHTML = `<div style="padding:8px;color:#6b7280;">No results found</div>`;
  } else {
    results.forEach((msg) => {
      const row = document.createElement("div");
      row.className = "notif-row";
      
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "notification-checkbox";
      cb.checked = !!qSel(`.chip[data-label="${msg}"]`);
      cb.addEventListener("change", () => {
        if (cb.checked) addChip(msg);
        else removeChip(msg);
      });
      
      const label = document.createElement("span");
      label.textContent = msg;
      label.style.marginLeft = "8px";
      
      row.appendChild(cb);
      row.appendChild(label);
      list.appendChild(row);
    });
  }

  // Position and display popup
  positionNotifPopup();
  popup.style.display = "block";
  
  console.log('[DEBUG] Popup displayed with', results.length, 'suggestions');
}

/* Chips handling */
function addChip(label) {
  if (!label || chipExists(label)) return;
  const chipsContainer = getChipsContainer();
  const chip = document.createElement("span");
  chip.className = "chip";
  chip.dataset.label = label;
  chip.innerHTML = `<span class="chip-text">${label}</span><button type="button" class="chip-remove">×</button>`;
  chip.querySelector(".chip-remove").addEventListener("click", () => removeChip(label));
  chipsContainer.appendChild(chip);
  if (window.rfToggleNotif) rfToggleNotif(label, true);
  updateChipCounter();
  
  // Reposition popup if it's visible (since input height may have changed)
  const popup = getNotifPopup();
  if (popup && popup.style.display === 'block') {
    setTimeout(() => positionNotifPopup(), 10); // Small delay to let DOM update
  }
}

function removeChip(label) {
  const chip = qSel(`.chip[data-label="${label}"]`);
  if (chip) chip.remove();
  if (window.rfToggleNotif) rfToggleNotif(label, false);
  updateChipCounter();
  
  // Reposition popup if it's visible (since input height may have changed)
  const popup = getNotifPopup();
  if (popup && popup.style.display === 'block') {
    setTimeout(() => positionNotifPopup(), 10); // Small delay to let DOM update
  }
}

function chipExists(label) {
  return !!qSel(`.chip[data-label="${label}"]`);
}

function updateChipCounter() {
  const counter = byId("chipCounter");
  if (counter) counter.textContent = `${qAll(".chip[data-label]").length}/${ABSOLUTE_MAX_CHIPS}`;
}

/* Select All / Clear All in popup */
function selectAllNotifications(event) {
  event.stopPropagation();
  const checkboxes = qAll("#notifList input[type='checkbox']");
  checkboxes.forEach((cb) => {
    cb.checked = true;
    const label = cb.nextSibling?.textContent.trim();
    addChip(label);
  });
  
  // Reposition popup after all chips added (input height likely changed)
  setTimeout(() => positionNotifPopup(), 50);
}

function clearAllNotifications(event) {
  event.stopPropagation();
  const checkboxes = qAll("#notifList input[type='checkbox']");
  checkboxes.forEach((cb) => {
    cb.checked = false;
    const label = cb.nextSibling?.textContent.trim();
    removeChip(label);
  });
  
  // Reposition popup after all chips removed (input height likely changed)
  setTimeout(() => positionNotifPopup(), 50);
}

/* Initialize everything */
window.addEventListener("load", () => {
  initializeCustomDropdowns();
  updateChipCounter();
  
  // Initialize dropdown counters
  const dropdowns = qAll('.rich-dropdown[data-dropdown-id]');
  dropdowns.forEach((dropdown) => {
    const checkboxes = dropdown.querySelectorAll('.dropdown-list input[type="checkbox"]');
    const labelText = dropdown.querySelector('.label-text');
    updateDropdownChips(dropdown, checkboxes, labelText);
  });
  
  console.log('[INFO] dropdown.js initialized');
});

/* Reposition notification popup on window resize if it's visible */
window.addEventListener("resize", () => {
  const popup = getNotifPopup();
  if (popup && popup.style.display === 'block') {
    positionNotifPopup();
  }
});
