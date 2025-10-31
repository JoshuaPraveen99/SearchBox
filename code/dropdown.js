/* ===========================================================
   dropdown.js — RF-friendly implementation
   Compatible with JSF 1.2 + RichFaces 3.3.3
   Place this file in: resources/js/dropdown.js
=========================================================== */

/* ====================== UTILS ====================== */
function byId(id){ return document.getElementById(id); }
function qSel(s){ return document.querySelector(s); }
function qAll(s){ return Array.from(document.querySelectorAll(s)); }

const ABSOLUTE_MAX_CHIPS = 50;

/* ====================== NOTIF POPUP CORE ====================== */
function getChipEditor(){ return byId("formId:chipInput"); }
function getChipsContainer(){ return byId("chipsContainer"); }
function getNotifPopup(){ return byId("notifPopup"); }

function positionNotifPopup() {
  const popup = getNotifPopup();
  const wrapper = byId('formId:chipInputWrapper');
  if (!popup || !wrapper) return;
  const rect = wrapper.getBoundingClientRect();
  const parentRect = wrapper.parentElement.getBoundingClientRect();
  popup.style.top = (rect.bottom - parentRect.top + 4) + 'px';
  popup.style.left = (rect.left - parentRect.left) + 'px';
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
  if (!popup.contains(e.target) && !input.contains(e.target)) {
    popup.style.display = "none";
  }
});

/* Backspace removes last chip when input empty */
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
    console.log("AJAX callback fired");
    console.log("Raw payload:", jsonData);

    let results = [];

    try {
        if (typeof jsonData === "string") {
            console.log("Parsing JSON string");
            results = JSON.parse(jsonData);
        } else {
            console.log("JSON is already an array");
            results = jsonData;
        }
    } catch (e) {
        console.log("JSON parse error:", e);
        console.log("JSON value:", jsonData);
        results = [];
    }

    console.log("Parsed result list:", results);

    renderNotifSuggestions(results);
}

/* Render list using DOM APIs (no innerHTML for labels) */
function renderNotifSuggestions(results){
  console.log("renderNotifSuggestions called with items:", results);
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
      cb.className = "notification-checkbox";
      cb.dataset.label = msg;
      cb.checked = chipExists(msg);
      cb.addEventListener("change", () => {
        if (cb.checked) addChip(msg);
        else removeChip(msg);
      });

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

/* ====================== CHIPS ====================== */
function chipCount(){ return qAll(".chip[data-label]").length; }
function chipExists(label){
  const chips = qAll('.chip[data-label]');
  return chips.some(c => c.dataset.label === label);
}

function addChip(label){
  if (!label) return;
  if (chipExists(label)) return;
  if (chipCount() >= ABSOLUTE_MAX_CHIPS) return;

  const c = getChipsContainer();
  if (!c) return;

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
  btn.addEventListener("click", () => removeChip(label));

  chip.appendChild(text);
  chip.appendChild(btn);
  c.appendChild(chip);

  // sync server
  if (typeof toggleNotif === "function") {
    try { toggleNotif(label, true); } catch(e){}
  }

  updateChipCounter();
  const popup = getNotifPopup();
  if (popup && popup.style.display === 'block') {
    setTimeout(positionNotifPopup, 10);
  }
}

function removeChip(label){
  const chips = qAll('.chip[data-label]');
  for (const ch of chips) {
    if (ch.dataset.label === label) { ch.remove(); break; }
  }

  if (typeof toggleNotif === "function") {
    try { toggleNotif(label, false); } catch(e){}
  }

  updateChipCounter();
  const popup = getNotifPopup();
  if (popup && popup.style.display === 'block') {
    setTimeout(positionNotifPopup, 10);
  }
}

function updateChipCounter(){
  const counter = byId("chipCounter");
  if (counter) counter.textContent = `${chipCount()}/${ABSOLUTE_MAX_CHIPS}`;
}

/* Select/Clear all in popup */
function selectAllNotifications(event){
  event.stopPropagation();
  const boxes = qAll("#notifList input[type='checkbox']");
  for (const cb of boxes) {
    if (chipCount() >= ABSOLUTE_MAX_CHIPS) break;
    if (!cb.checked) {
      cb.checked = true;
      addChip(cb.dataset.label);
    }
  }
  setTimeout(positionNotifPopup, 50);
}

function clearAllNotifications(event){
  event.stopPropagation();
  const boxes = qAll("#notifList input[type='checkbox']");
  boxes.forEach(cb => {
    if (cb.checked) {
      cb.checked = false;
      removeChip(cb.dataset.label);
    }
  });
  setTimeout(positionNotifPopup, 50);
}

/* ============================================================
   CUSTOM DROPDOWN SECTION (Event & Pickup)
============================================================ */
function initializeCustomDropdowns() {
  const dropdowns = qAll(".rich-dropdown");

  dropdowns.forEach((dropdown) => {
    const label = dropdown.querySelector(".rich-dropdown-label");

    if (!label || label._bound) return;
    label._bound = true;

    label.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdowns.forEach((d) => {
        if (d !== dropdown) d.classList.remove("open");
      });
      dropdown.classList.toggle("open");
    });

    const checkboxes = dropdown.querySelectorAll(".dropdown-list input[type='checkbox']");
    const labelText = dropdown.querySelector(".label-text");

    checkboxes.forEach((cb) => {
      cb.addEventListener("change", () =>
        updateDropdownChips(dropdown, checkboxes, labelText)
      );
    });

    updateDropdownChips(dropdown, checkboxes, labelText);
  });

  // Close when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".rich-dropdown")) {
      dropdowns.forEach((d) => d.classList.remove("open"));
    }
  });
}

function updateDropdownChips(dropdown, checkboxes, labelText) {
  const selected = Array.from(checkboxes)
    .filter((c) => c.checked)
    .map((c) => c.getAttribute('data-label') || (c.nextElementSibling ? c.nextElementSibling.textContent.trim() : ''));

  const id = dropdown.getAttribute('data-dropdown-id');
  const counter = byId(id + "Counter");
  if (counter) {
    counter.textContent = `${selected.length}/${checkboxes.length}`;
  }

  if (!selected.length) {
    labelText.textContent = labelText.getAttribute('data-default') || 'Select';
    return;
  }

  const max = 5;
  labelText.innerHTML = selected.slice(0, max).map(function(lbl){
    return '<span class="dropdown-chip">' + escapeHtml(lbl) + '</span>';
  }).join("");

  if (selected.length > max) {
    labelText.innerHTML += '<span class="dropdown-chip">+' + (selected.length - max) + ' more</span>';
  }
}

function escapeHtml(s){
  if (!s) return "";
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

/* Select/Clear all inside a dropdown (Event/Pickup) */
function selectAll(button, flag) {
  const dropdown = button.closest(".rich-dropdown");
  if (!dropdown) return;
  const checkboxes = dropdown.querySelectorAll(".dropdown-list input[type='checkbox']");
  const labelText = dropdown.querySelector(".label-text");
  checkboxes.forEach((cb) => {
    cb.checked = !!flag;
    cb.dispatchEvent(new Event("change", { bubbles: true }));
  });
  updateDropdownChips(dropdown, checkboxes, labelText);
}

/* ============================================================
   FORM SUBMISSION (compose hidden fields)
============================================================ */
function prepareFormSubmit() {
  const eventDropdown = qSel("[data-dropdown-id='eventCodes']");
  const pickupDropdown = qSel("[data-dropdown-id='pickupType']");
  if (!eventDropdown || !pickupDropdown) return true;

  const getVals = (dd) => Array.from(dd.querySelectorAll(".dropdown-list input[type='checkbox']:checked"))
    .map(cb => cb.getAttribute('data-label') || (cb.nextElementSibling ? cb.nextElementSibling.textContent.trim() : ''))
    .filter(Boolean);

  const eventValues = getVals(eventDropdown);
  const pickupValues = getVals(pickupDropdown);

  byId("formId:selectedEventCodes").value = eventValues.join(",");
  byId("formId:selectedPickupTypes").value = pickupValues.join(",");
  return true;
}

/* ====================== PAGE INIT ====================== */
window.addEventListener("load", () => {
  initializeCustomDropdowns();
  updateChipCounter();
});

window.addEventListener("resize", () => {
  const popup = getNotifPopup();
  if (popup && popup.style.display === 'block') positionNotifPopup();
});
