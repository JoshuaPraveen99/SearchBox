/* ===========================================================
   dropdown.js — RF friendly custom dropdown + chips
   Works: JSF 1.2 + RichFaces 3.3.3 + Chrome + Firefox + Edge
   ES5 Compatible - No Arrow Functions
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

/* Helper function to get checkbox label */
function getCheckboxLabel(checkbox) {
  if (checkbox.dataset && checkbox.dataset.label) {
    return checkbox.dataset.label;
  }
  
  if (checkbox.nextElementSibling && checkbox.nextElementSibling.textContent) {
    var text = checkbox.nextElementSibling.textContent.trim();
    if (text) return text;
  }
  
  var label = checkbox.closest('label');
  if (label) {
    var span = label.querySelector('span');
    if (span) return span.textContent.trim();

    var clone = label.cloneNode(true);
    var cb = clone.querySelector('input[type="checkbox"]');
    if (cb) cb.remove();
    var text = clone.textContent.trim();
    if (text) return text;
  }
  
  if (checkbox.nextSibling && checkbox.nextSibling.nodeType === Node.TEXT_NODE) {
    var text = checkbox.nextSibling.textContent.trim();
    if (text) return text;
  }
  
  return '';
}

/* ======================== Notification Core ======================== */

function getChipEditor(){ return byId("formId:chipInput"); }
function getChipsContainer(){ return byId("chipsContainer"); }
function getNotifPopup(){ return byId("notifPopup"); }

function positionNotifPopup() {
  var popup = getNotifPopup();
  var wrapper = byId('formId:chipInputWrapper');
  if (!popup || !wrapper) return;
  
  var rect = wrapper.getBoundingClientRect();
  popup.style.top = (rect.bottom + 4) + 'px';
  popup.style.left = rect.left + 'px';
  popup.style.width = rect.width + 'px';
}

function openCustomNotifPopup() {
  var popup = getNotifPopup();
  if (!popup) return;
  positionNotifPopup();
  popup.style.display = 'block';
}

document.addEventListener("mousedown", function(e) {
  var popup = getNotifPopup();
  var input = getChipEditor();
  if (!popup || !input) return;
  if (!popup.contains(e.target) && !input.contains(e.target)) popup.style.display = "none";
});

function handleChipBackspace(e){
  var input = e.target;
  if (e.key === 'Backspace' && !input.value) {
    var chips = qAll('.chip[data-label]');
    if (chips.length) {
      var last = chips[chips.length - 1];
      removeChip(last.dataset.label);
      e.preventDefault();
    }
  }
}

function onFetchNotifSuggestionsComplete(event, jsonData) {
  var results = [];
  try { 
    results = typeof jsonData === "string" ? JSON.parse(jsonData) : jsonData; 
  } catch (e) { 
    results = []; 
  }
  renderNotifSuggestions(results);
}

function renderNotifSuggestions(results){
  var popup = getNotifPopup();
  var list = byId("notifList");
  if (!popup || !list) return;

  while (list.firstChild) list.removeChild(list.firstChild);

  if (!results.length) {
    var empty = document.createElement("div");
    empty.style.padding = "8px";
    empty.style.color = "#6b7280";
    empty.textContent = "No results found";
    list.appendChild(empty);
  } else {
    results.forEach(function(msg) {
      var row = document.createElement("div");
      row.className = "notif-row";

      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = chipExists(msg);
      cb.dataset.label = msg;
      cb.addEventListener("change", function() { 
        if (cb.checked) addChip(msg);
        else removeChip(msg);
      });

      var label = document.createElement("span");
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

function selectAllNotifications(event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  var popup = getNotifPopup();
  if (!popup) return;
  var checkboxes = popup.querySelectorAll('.notif-row input[type="checkbox"]');
  checkboxes.forEach(function(cb) {
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
  var popup = getNotifPopup();
  if (!popup) return;
  var checkboxes = popup.querySelectorAll('.notif-row input[type="checkbox"]');
  checkboxes.forEach(function(cb) {
    if (cb.checked) {
      cb.checked = false;
      cb.dispatchEvent(new Event("change"));
    }
  });
}

/* ======================== Chips ======================== */

var ABSOLUTE_MAX_CHIPS = 50;

function chipCount(){ return qAll(".chip[data-label]").length; }
function chipExists(label){ 
  return qAll('.chip[data-label]').some(function(c) { return c.dataset.label === label; });
}

function addChip(label){
  if (!label || chipExists(label) || chipCount() >= ABSOLUTE_MAX_CHIPS) return;

  var container = getChipsContainer();
  var chip = document.createElement("span");
  chip.className = "chip";
  chip.dataset.label = label;

  var text = document.createElement("span");
  text.className = "chip-text";
  text.title = label;
  text.textContent = label;

  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "chip-remove";
  btn.textContent = "×";
  btn.addEventListener("click", function(e) {
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
  qAll('.chip[data-label]').forEach(function(ch) { 
    if (ch.dataset.label === label) ch.remove(); 
  });

  var popup = getNotifPopup();
  if (popup) {
    var checkboxes = popup.querySelectorAll('.notif-row input[type="checkbox"]');
    checkboxes.forEach(function(cb) {
      if (cb.dataset.label === label && cb.checked) cb.checked = false;
    });
  }

  if (typeof toggleNotif === "function") toggleNotif(label, false);
  updateChipCounter();
}

function updateChipCounter() {
  var counter = byId("chipCounter");
  if (counter) counter.textContent = chipCount() + '/' + ABSOLUTE_MAX_CHIPS;
}

/* ======================== Dropdown Logic ======================== */

function removeDropdownChip(button, event) {
  event.stopPropagation();
  var chip = button.closest(".dropdown-chip");
  var label = chip.dataset.value;
  var dropdown = chip.closest(".rich-dropdown");
  var checkboxes = dropdown.querySelectorAll(".dropdown-list input[type='checkbox']");
  var labelText = dropdown.querySelector(".label-text");
  
  checkboxes.forEach(function(cb) {
    var lbl = getCheckboxLabel(cb);
    if (lbl === label) {
      cb.checked = false;
      cb.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
  
  updateDropdownChips(dropdown, checkboxes, labelText);
}

function expandDropdownChips(button, event) {
  event.stopPropagation();
  var dropdown = button.closest(".rich-dropdown");
  var labelText = dropdown.querySelector(".label-text");
  var checkboxes = dropdown.querySelectorAll(".dropdown-list input[type='checkbox']");
  
  var selected = Array.from(checkboxes)
    .filter(function(c) { return c.checked; })
    .map(function(c) { return getCheckboxLabel(c); })
    .filter(function(t) { return t; });
  
  var currentVisible = parseInt(labelText.dataset.visibleCount || 5);
  currentVisible = Math.min(currentVisible + 5, selected.length);
  labelText.dataset.visibleCount = currentVisible;
  
  labelText.innerHTML = selected.slice(0, currentVisible)
    .map(function(label) {
      return '<span class="dropdown-chip" data-value="' + label + '" title="' + label + '">' +
        '<span class="dropdown-chip-text">' + label + '</span>' +
        '<button type="button" class="dropdown-chip-remove" onclick="removeDropdownChip(this, event)">×</button>' +
      '</span>';
    })
    .join("");
  
  if (currentVisible < selected.length) {
    var remaining = selected.length - currentVisible;
    labelText.innerHTML += '<span class="dropdown-chip dropdown-chip-more" ' +
      'onclick="expandDropdownChips(this, event);" style="cursor:pointer;" ' +
      'title="Click to see ' + remaining + ' more items">+' + remaining + ' more</span>';
  }
}

function updateDropdownChips(dropdown, checkboxes, labelText) {
  var selected = Array.from(checkboxes)
    .filter(function(c) { return c.checked; })
    .map(function(c) { return getCheckboxLabel(c); })
    .filter(function(t) { return t; });

  var id = dropdown.getAttribute("data-dropdown-id");
  var counter = byId(id + "Counter");
  if (counter) counter.textContent = selected.length + "/" + checkboxes.length;

  if (!selected.length) {
    labelText.textContent = labelText.getAttribute("data-default") || "Select";
    labelText.dataset.visibleCount = 5;
    return;
  }

  var max = 5;
  labelText.dataset.visibleCount = max;
  
  labelText.innerHTML = selected.slice(0, max).map(function(lbl) {
    return '<span class="dropdown-chip" data-value="' + lbl + '" title="' + lbl + '">' +
      '<span class="dropdown-chip-text">' + lbl + '</span>' +
      '<button type="button" class="dropdown-chip-remove" onclick="removeDropdownChip(this, event)">×</button>' +
    '</span>';
  }).join("");

  if (selected.length > max) {
    var remaining = selected.length - max;
    labelText.innerHTML += '<span class="dropdown-chip dropdown-chip-more" ' +
      'onclick="expandDropdownChips(this, event);" style="cursor:pointer;" ' +
      'title="Click to see ' + remaining + ' more items">+' + remaining + ' more</span>';
  }
}

function selectAll(btn, flag) {
  var dd = btn.closest(".rich-dropdown");
  var boxes = dd.querySelectorAll(".dropdown-list input[type='checkbox']");
  var label = dd.querySelector(".label-text");
  boxes.forEach(function(cb) { 
    cb.checked = flag; 
    cb.dispatchEvent(new Event("change", {bubbles: true})); 
  });
  updateDropdownChips(dd, boxes, label);
}

function initializeCustomDropdowns() {
  var dds = qAll(".rich-dropdown");

  dds.forEach(function(dd) {
    var label = dd.querySelector(".rich-dropdown-label");
    if (!label || label._bound) return;
    label._bound = true;

    label.addEventListener("click", function(e) {
      if (e.target.classList.contains("dropdown-chip-remove") || 
          e.target.classList.contains("dropdown-chip-more")) {
        e.stopPropagation();
        return;
      }
      e.stopPropagation();
      dds.forEach(function(o) { if (o !== dd) o.classList.remove("open"); });
      dd.classList.toggle("open");
    });

    var boxes = dd.querySelectorAll(".dropdown-list input[type='checkbox']");
    var labelText = dd.querySelector(".label-text");

    boxes.forEach(function(cb) {
      var labelValue = getCheckboxLabel(cb);
      if (labelValue) cb.dataset.label = labelValue;
      cb.addEventListener("change", function() {
        updateDropdownChips(dd, boxes, labelText);
      });
    });

    updateDropdownChips(dd, boxes, labelText);
  });

  document.addEventListener("click", function(e) {
    if (!e.target.closest(".rich-dropdown")) {
      dds.forEach(function(dd) { dd.classList.remove("open"); });
    }
  });
}

/* Save selected before form submit */
function prepareFormSubmit() {
  var fieldIdMap = {
    'eventCodes': 'formId:selectedEventCodes',
    'pickupType': 'formId:selectedPickupTypes'
  };
  
  var ids = ["eventCodes", "pickupType"];
  
  ids.forEach(function(id) {
    var dd = qSel("[data-dropdown-id='" + id + "']");
    if (!dd) return;
    var checkedBoxes = dd.querySelectorAll(".dropdown-list input[type='checkbox']:checked");
    
    var vals = Array.from(checkedBoxes)
      .map(function(cb) { return getCheckboxLabel(cb); })
      .filter(function(t) { return t; });
    
    var hiddenField = byId(fieldIdMap[id]);
    if (hiddenField) hiddenField.value = vals.join(",");
  });

  return true;
}

/* Init */
window.addEventListener("load", function() {
  initializeCustomDropdowns();
  updateChipCounter();
});

window.addEventListener("resize", function() {
  var popup = getNotifPopup();
  if (popup && popup.style.display === "block") positionNotifPopup();
});
