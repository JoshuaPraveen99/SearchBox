/* ===========================================================
   dropdown.js — RF friendly custom dropdown + chips
   Works: JSF 1.2 + RichFaces 3.3.3 + Chrome + Firefox + Edge
=========================================================== */

/* -------- POLYFILL FOR OLD FIREFOX -------- */
if (typeof CSS === "undefined" || typeof CSS.escape !== "function") {
  window.CSS = window.CSS || {};
  CSS.escape = function (value) {
    return value.replace(/[^a-zA-Z0-9_\-]/g, "\\$&");
  };
}

/* -------- Utils -------- */
function byId(id) { return document.getElementById(id); }
function qSel(s) { return document.querySelector(s); }
function qAll(s) { return Array.from(document.querySelectorAll(s)); }

/* ======================== Notification Core ======================== */

function getChipEditor(){ return byId("formId:chipInput"); }
function getChipsContainer(){ return byId("chipsContainer"); }
function getNotifPopup(){ return byId("notifPopup"); }

function positionNotifPopup() {
  const popup = getNotifPopup();
  const wrapper = byId('formId:chipInputWrapper');
  if (!popup || !wrapper) return;
  
  const rect = wrapper.getBoundingClientRect();
  
  // Position relative to viewport
  popup.style.top = (rect.bottom + 4) + 'px';
  popup.style.left = rect.left + 'px';
  popup.style.width = rect.width + 'px';
}

function openCustomNotifPopup() {
  const popup = getNotifPopup();
  if (!popup) return;
  positionNotifPopup();
  popup.style.display = 'block';
}

/* Close popup if clicked outside */
document.addEventListener("mousedown", (e) => {
  const popup = getNotifPopup();
  const input = getChipEditor();
  if (!popup || !input) return;
  if (!popup.contains(e.target) && !input.contains(e.target)) popup.style.display = "none";
});

/* Backspace remove last chip */
function handleChipBackspace(e){
  const input = e.target;
  if (e.key === 'Backspace' && !input.value) {
    const chips = qAll('.chip[data-label]');
    if (chips.length) {
      const last = chips[chips.length - 1];
      removeChip(last.dataset.label);
      e.preventDefault();
    }
  }
}

function onFetchNotifSuggestionsComplete(event, jsonData) {
  let results = [];
  try { results = typeof jsonData === "string" ? JSON.parse(jsonData) : jsonData; }
  catch (e) { results = []; }
  renderNotifSuggestions(results);
}

/* Render suggestions */
function renderNotifSuggestions(results){
  const popup = getNotifPopup();
  const list = byId("notifList");
  if (!popup || !list) return;

  while (list.firstChild) list.removeChild(list.firstChild);

  if (!results.length) {
    const empty = document.createElement("div");
    empty.style.padding = "8px";
    empty.style.color = "#6b7280";
    empty.textContent = "No results found";
    list.appendChild(empty);
  } else {
    results.forEach(msg => {
      const row = document.createElement("div");
      row.className = "notif-row";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = chipExists(msg);
      cb.dataset.label = msg;
      cb.addEventListener("change", () => cb.checked ? addChip(msg) : removeChip(msg));

      const label = document.createElement("span");
      label.style.marginLeft = "8px";
      label.textContent = msg;

      row.appendChild(cb);
      row.appendChild(label);
      list.appendChild(row);
    });
  }
  positionNotifPopup();
  popup.style.display = "block";
}

/* Select/Clear All Notifications */
function selectAllNotifications(event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const popup = getNotifPopup();
  if (!popup) return;
  const checkboxes = popup.querySelectorAll('.notif-row input[type="checkbox"]');
  checkboxes.forEach(cb => {
    if (!cb.checked) {
      cb.checked = true;
      cb.dispatchEvent(new Event("change"));
    }
  });
}

function clearAllNotifications(event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const popup = getNotifPopup();
  if (!popup) return;
  const checkboxes = popup.querySelectorAll('.notif-row input[type="checkbox"]');
  checkboxes.forEach(cb => {
    if (cb.checked) {
      cb.checked = false;
      cb.dispatchEvent(new Event("change"));
    }
  });
}

/* ======================== Notification Chips ======================== */

const ABSOLUTE_MAX_CHIPS = 50;
function chipCount(){ return qAll(".chip[data-label]").length; }
function chipExists(label){ return qAll('.chip[data-label]').some(c => c.dataset.label === label); }

function addChip(label){
  if (!label || chipExists(label) || chipCount() >= ABSOLUTE_MAX_CHIPS) return;

  const container = getChipsContainer();
  const chip = document.createElement("span");
  chip.className = "chip";
  chip.dataset.label = label;

  const text = document.createElement("span");
  text.className = "chip-text";
  text.title = label;
  text.textContent = label;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "chip-remove";
  btn.textContent = "×";
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();
    removeChip(label);
  });

  chip.appendChild(text);
  chip.appendChild(btn);
  container.appendChild(chip);

  if (typeof toggleNotif === "function") toggleNotif(label, true);
  updateChipCounter();
}

function removeChip(label){
  qAll('.chip[data-label]').forEach(ch => { if (ch.dataset.label === label) ch.remove(); });

  // ✅ Also uncheck the checkbox in the notification popup
  const popup = getNotifPopup();
  if (popup) {
    const checkboxes = popup.querySelectorAll('.notif-row input[type="checkbox"]');
    checkboxes.forEach(cb => {
      if (cb.dataset.label === label && cb.checked) {
        cb.checked = false;
      }
    });
  }

  if (typeof toggleNotif === "function") toggleNotif(label, false);
  updateChipCounter();
}

function updateChipCounter() {
  const counter = byId("chipCounter");
  if (counter) counter.textContent = `${chipCount()}/${ABSOLUTE_MAX_CHIPS}`;
}

/* ======================== Event & Pickup Chip Remove ======================== */

function removeDropdownChip(label) {
  console.log("🔴 removeDropdownChip called with label:", label);
  
  // Find checkbox by matching the text content next to it
  let cb = null;
  const allLabels = qAll(".dropdown-list label");
  console.log("📦 Total labels found:", allLabels.length);
  
  for (let labelEl of allLabels) {
    // Get the text content of the label (excluding the checkbox)
    const textEl = labelEl.querySelector('span');
    const labelText = textEl ? textEl.textContent.trim() : labelEl.textContent.trim();
    console.log("  🔍 Checking label text:", labelText);
    
    if (labelText === label) {
      // Found matching label, get its checkbox
      cb = labelEl.querySelector('input[type="checkbox"]');
      console.log("  ✅ MATCH FOUND! Checkbox:", cb);
      break;
    }
  }
  
  console.log("🔍 Found checkbox:", cb);
  if (cb) {
    cb.checked = false;
    cb.dispatchEvent(new Event("change", { bubbles: true }));
    console.log("✅ Checkbox unchecked and change event dispatched");
  } else {
    console.log("❌ Checkbox not found!");
  }
}

/* Listen for X button click on event/pickup chips */
document.addEventListener("mousedown", function(e) {
  console.log("🖱️ MOUSEDOWN on document (capture):", e.target.tagName, e.target.className);
  if (e.target.classList.contains("dropdown-chip-remove")) {
    console.log("✨ Clicked on dropdown-chip-remove button!");
    e.stopImmediatePropagation();
    e.preventDefault();
    const lbl = e.target.getAttribute("data-value");
    console.log("📌 Label to remove:", lbl);
    removeDropdownChip(lbl);
  }
}, true);

/* ======================== Dropdown Rendering ======================== */

function updateDropdownChips(dropdown, checkboxes, labelText) {
  const selected = Array.from(checkboxes)
    .filter(c => c.checked)
    .map(c => {
      // Get label text from the span next to checkbox
      const label = c.closest('label');
      const span = label ? label.querySelector('span') : null;
      return span ? span.textContent.trim() : '';
    })
    .filter(t => t); // Remove empty strings

  const id = dropdown.getAttribute("data-dropdown-id");
  const counter = byId(id + "Counter");
  if (counter) counter.textContent = selected.length + "/" + checkboxes.length;

  if (!selected.length) {
    labelText.textContent = labelText.getAttribute("data-default") || "Select";
    return;
  }

  const max = 5;
  labelText.innerHTML = selected.slice(0, max).map(lbl =>
    '<span class="dropdown-chip" title="' + lbl + '" data-value="' + lbl + '">' +
      '<span class="dropdown-chip-text">' + lbl + '</span>' +
      '<button type="button" class="dropdown-chip-remove" data-value="' + lbl + '">×</button>' +
    '</span>'
  ).join("");

  if (selected.length > max) {
    labelText.innerHTML += '<span class="dropdown-chip">+' + (selected.length - max) + ' more</span>';
  }
}

/* Select/Clear All */
function selectAll(btn, flag) {
  const dd = btn.closest(".rich-dropdown");
  const boxes = dd.querySelectorAll(".dropdown-list input[type='checkbox']");
  const label = dd.querySelector(".label-text");
  boxes.forEach(cb => { cb.checked = flag; cb.dispatchEvent(new Event("change",{bubbles:true})); });
  updateDropdownChips(dd, boxes, label);
}

/* Init dropdowns */
function initializeCustomDropdowns() {
  const dds = qAll(".rich-dropdown");

  dds.forEach(dd => {
    const label = dd.querySelector(".rich-dropdown-label");
    if (!label || label._bound) return;
    label._bound = true;

    label.addEventListener("mousedown", e => {
      console.log("🔵 MOUSEDOWN on label:", e.target.tagName, e.target.className);
      // Don't toggle dropdown if clicking on chip remove button
      if (e.target.classList.contains("dropdown-chip-remove")) {
        console.log("⛔ Stopping propagation - clicked on remove button");
        e.stopImmediatePropagation();
        e.preventDefault();
        return false;
      }
    }, true);

    label.addEventListener("click", e => {
      console.log("🔵 CLICK on label:", e.target.tagName, e.target.className);
      // Don't toggle dropdown if clicking on chip remove button
      if (e.target.classList.contains("dropdown-chip-remove")) {
        console.log("⛔ Stopping propagation - clicked on remove button");
        e.stopImmediatePropagation();
        e.preventDefault();
        return false;
      }
      e.stopPropagation();
      dds.forEach(o => { if (o !== dd) o.classList.remove("open"); });
      dd.classList.toggle("open");
      console.log("🔄 Dropdown toggled, open:", dd.classList.contains("open"));
    });

    const boxes = dd.querySelectorAll(".dropdown-list input[type='checkbox']");
    const labelText = dd.querySelector(".label-text");

    boxes.forEach(cb => cb.addEventListener("change",
        () => updateDropdownChips(dd, boxes, labelText)
    ));

    updateDropdownChips(dd, boxes, labelText);
  });

  document.addEventListener("click", e => {
    if (!e.target.closest(".rich-dropdown")) dds.forEach(dd => dd.classList.remove("open"));
  });
}

/* Save selected before submit */
function prepareFormSubmit() {
  const ids = ["eventCodes","pickupType"];
  ids.forEach(id => {
    const dd = qSel("[data-dropdown-id='" + id + "']");
    const vals = Array.from(dd.querySelectorAll(".dropdown-list input[type='checkbox']:checked")).map(cb => {
      const label = cb.closest('label');
      const span = label ? label.querySelector('span') : null;
      return span ? span.textContent.trim() : '';
    }).filter(t => t);
    byId("formId:selected" + id.charAt(0).toUpperCase() + id.slice(1)).value = vals.join(",");
  });
  return true;
}

/* Init */
window.addEventListener("load", () => {
  initializeCustomDropdowns();
  updateChipCounter();
});

window.addEventListener("resize", () => {
  const popup = getNotifPopup();
  if (popup && popup.style.display === "block") positionNotifPopup();
});