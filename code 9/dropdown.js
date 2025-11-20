/* ===========================================================
   dropdown.js — UNIVERSAL LIMIT SYSTEM
   User-friendly limits for ALL dropdowns:
   - Notifications: 50 max
   - Event Codes: 40 max
   - Pickup Types: 35 max
=========================================================== */

/* -------- POLYFILL -------- */
if (typeof CSS === "undefined" || typeof CSS.escape !== "function") {
  window.CSS = window.CSS || {};
  CSS.escape = function(v) {
    return String(v).replace(/[^a-zA-Z0-9_\-]/g, "\\$&");
  };
}

/* -------- Utils -------- */
function byId(id){ return document.getElementById(id); }
function qSel(s){ return document.querySelector(s); }
function qAll(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); }

/* -------- HTML ESCAPING (XSS Protection) -------- */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  var div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

/* -------- INPUT VALIDATION -------- */
function validateLabel(label) {
  if (!label || typeof label !== 'string') return null;
  label = label.trim();
  if (!label) return null;
  if (label.length > 500) return label.substring(0, 500);
  return label;
}

/* Cache core DOM nodes */
var _chipsContainer = null, _notifPopup = null, _chipInput = null;
function chipContainer(){ return _chipsContainer || (_chipsContainer = byId("chipsContainer")); }
function notifPopup(){ return _notifPopup || (_notifPopup = byId("notifPopup")); }
function chipInput(){ return _chipInput || (_chipInput = byId("formId:chipInput")); }
function getChipEditor(){ return chipInput(); }

/* -------- Checkbox Label -------- */
function getCheckboxLabel(checkbox) {
  if (!checkbox) return '';
  if (checkbox.dataset && checkbox.dataset.label) return checkbox.dataset.label;
  if (checkbox.nextElementSibling && checkbox.nextElementSibling.textContent) {
    var t = checkbox.nextElementSibling.textContent.trim();
    if (t) return t;
  }
  var p = checkbox.closest("label");
  if (p) {
    var sp = p.querySelector("span");
    if (sp) return sp.textContent.trim();
    var clone = p.cloneNode(true);
    var input = clone.querySelector("input[type='checkbox']");
    if (input) input.remove();
    var t2 = clone.textContent.trim();
    if (t2) return t2;
  }
  if (checkbox.nextSibling && checkbox.nextSibling.nodeType === 3) {
    var t3 = checkbox.nextSibling.textContent.trim();
    if (t3) return t3;
  }
  return "";
}

/* ===========================================================
    UNIVERSAL LIMIT CONFIGURATION
=========================================================== */

var DROPDOWN_LIMITS = {
  'notifications': 50,
  'eventCodes': 40,
  'stores': 40,
  'pickupType': 35
};

var DROPDOWN_NAMES = {
  'notifications': 'Notifications',
  'eventCodes': 'Event Codes',
  'stores': 'Stores',
  'pickupType': 'Pickup Types'
};

/* Get limit for a dropdown */
function getDropdownLimit(dropdownId) {
  return DROPDOWN_LIMITS[dropdownId] || 50;
}

/* Get friendly name for a dropdown */
function getDropdownName(dropdownId) {
  return DROPDOWN_NAMES[dropdownId] || 'items';
}

/* ===========================================================
    USER NOTIFICATION SYSTEM (Toast Messages)
=========================================================== */

function showUserMessage(message, type) {
  var toast = byId('userMessageToast');
  
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'userMessageToast';
    toast.style.cssText = 
      'position: fixed; top: 20px; right: 20px; z-index: 99999; ' +
      'padding: 15px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); ' +
      'font-family: Arial, sans-serif; font-size: 14px; font-weight: 500; ' +
      'min-width: 300px; max-width: 500px; display: none; ' +
      'animation: slideIn 0.3s ease-out;';
    document.body.appendChild(toast);
    
    if (!byId('toastAnimationStyles')) {
      var style = document.createElement('style');
      style.id = 'toastAnimationStyles';
      style.textContent = 
        '@keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }' +
        '@keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(400px); opacity: 0; } }';
      document.head.appendChild(style);
    }
  }
  
  var colors = {
    'warning': { bg: '#fff3cd', border: '#ffc107', text: '#856404', icon: '⚠️' },
    'error': { bg: '#f8d7da', border: '#dc3545', text: '#721c24', icon: '❌' },
    'info': { bg: '#d1ecf1', border: '#17a2b8', text: '#0c5460', icon: 'ℹ️' },
    'success': { bg: '#d4edda', border: '#28a745', text: '#155724', icon: '✅' }
  };
  
  var color = colors[type] || colors['info'];
  
  toast.style.backgroundColor = color.bg;
  toast.style.border = '2px solid ' + color.border;
  toast.style.color = color.text;
  toast.innerHTML = '<strong>' + color.icon + ' </strong>' + escapeHtml(message);
  toast.style.display = 'block';
  
  console.log('[Dropdown] User message shown: ' + message);
  
  setTimeout(function() {
    toast.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(function() {
      toast.style.display = 'none';
      toast.style.animation = '';
    }, 300);
  }, 5000);
}

function hideUserMessage() {
  var toast = byId('userMessageToast');
  if (toast) {
    toast.style.display = 'none';
  }
}

/* ===========================================================
    HIDDEN BUTTON TRIGGER FUNCTIONS
=========================================================== */

// ✅ NEW: Debounce timer for notification search
var notifSearchTimer = null;

// ✅ NEW: Trigger notification search via hidden button
window.handleNotificationKeyup = function(event) {
  // Update hidden field
  var input = event.target;
  var hid = document.querySelector('[id$=chipHidden]');
  if (hid) {
    hid.value = input.value;
  }
  
  // Clear existing timer
  if (notifSearchTimer) {
    clearTimeout(notifSearchTimer);
  }
  
  // Set new timer to trigger search after 120ms delay
  notifSearchTimer = setTimeout(function() {
    console.log('[Dropdown] Triggering notification search via hidden button');
    
    // Find and click the hidden button
    var btn = document.querySelector('[id$="notifSearchBtn"]');
    if (btn) {
      btn.click();
    } else {
      console.error('[Dropdown] Hidden notification search button not found');
    }
  }, 120);
};

// ✅ NEW: Trigger event type change via hidden button
window.triggerEventTypeChange = function() {
  console.log('[Dropdown] Triggering event type change via hidden button');
  
  // Find and click the hidden button
  var btn = document.querySelector('[id$="eventTypeChangeBtn"]');
  if (btn) {
    btn.click();
  } else {
    console.error('[Dropdown] Hidden event type change button not found');
  }
};

/* ===========================================================
    NOTIFICATION CHIPS - CLIENT-SIDE ONLY
=========================================================== */

var notifLabels = [], notifNodesByLabel = {}, notifVisibleCount = 0;

function hydrateNotifModelFromDOM(){
  console.log('[Dropdown] Hydrating model from DOM...');
  var c = chipContainer(); 
  if (!c) return;
  var nodes = c.querySelectorAll(".chip[data-label]");
  notifLabels = []; 
  notifNodesByLabel = {};
  for (var i=0;i<nodes.length;i++){
    var n = nodes[i], lbl = n.dataset ? n.dataset.label : n.getAttribute("data-label");
    if (!lbl) continue;
    notifLabels.push(lbl);
    notifNodesByLabel[lbl] = n;
  }
  console.log('[Dropdown] Hydrated ' + notifLabels.length + ' chips from DOM');
}

function ensureNotifModelFresh(){
  var c = chipContainer(); 
  if (!c) return;
  var dom = c.querySelectorAll(".chip[data-label]").length;
  if (dom !== notifLabels.length) {
    console.warn('[Dropdown] Model out of sync! DOM=' + dom + ', Array=' + notifLabels.length);
    hydrateNotifModelFromDOM();
  }
}

function positionNotifPopup(){
  var p = notifPopup(), w = byId("formId:chipInputWrapper");
  if (!p || !w) return;
  
  // Get positions
  var inputRect = w.getBoundingClientRect();
  var container = w.closest('.field-col');
  if (!container) {
    console.error('[Dropdown] Could not find field-col container');
    return;
  }
  var containerRect = container.getBoundingClientRect();
  
  // Position popup relative to container
  var top = inputRect.bottom - containerRect.top + 4;
  var left = inputRect.left - containerRect.left;
  
  p.style.top = top + "px";
  p.style.left = left + "px";
  p.style.width = inputRect.width + "px";
  
  console.log('[Dropdown] Positioned popup at top=' + top + ', left=' + left + ', width=' + inputRect.width);
}

function openCustomNotifPopup(){
  var p = notifPopup(); 
  if (!p) return;
  positionNotifPopup();
  p.style.display = "block";
}

document.addEventListener("mousedown", function(e){
  var p = notifPopup(), i = chipInput();
  if (!p || !i) return;
  if (!p.contains(e.target) && !i.contains(e.target)) {
    p.style.display="none";
  }
});

function handleChipBackspace(e){
  if (!e || !e.target) return;
  var i = e.target;
  if (e.key === "Backspace" && !i.value){
    ensureNotifModelFresh();
    if (notifLabels.length){
      var lastLabel = notifLabels[notifLabels.length-1];
      if (lastLabel) {
        removeChip(lastLabel);
        e.preventDefault();
      }
    }
  }
}

function onFetchNotifSuggestionsComplete(event, data){
  console.log('[Dropdown] onFetchNotifSuggestionsComplete called');
  console.log('[Dropdown] Data type:', typeof data);
  
  if (data === undefined || data === null) {
    console.error('[Dropdown] No data received - possible session timeout');
    var list = byId("notifList");
    if (list) {
      while (list.firstChild) list.removeChild(list.firstChild);
      var d = document.createElement("div");
      d.textContent = "Session expired. Please refresh the page.";
      d.style.padding="8px"; 
      d.style.color="#dc3545";
      d.style.fontWeight="bold";
      list.appendChild(d);
    }
    return;
  }
  
  var r = [];
  try { 
    r = typeof data === "string" ? JSON.parse(data) : data; 
    if (!Array.isArray(r)) r = [];
  } catch(e){
    console.error('[Dropdown] JSON parse error:', e);
    r = [];
  }
  renderNotifSuggestions(r);
}

function renderNotifSuggestions(results){
  console.log('[Dropdown] Rendering ' + (results ? results.length : 0) + ' suggestions');
  var p = notifPopup(), list = byId("notifList");
  if (!p || !list) return;

  while (list.firstChild) list.removeChild(list.firstChild);

  if (!results || !results.length){
    var d = document.createElement("div");
    d.textContent = "No results found";
    d.style.padding="8px"; 
    d.style.color="#6b7280";
    list.appendChild(d);
  } else {
    ensureNotifModelFresh();
    var fragment = document.createDocumentFragment();
    var maxLimit = getDropdownLimit('notifications');
    
    for (var i=0;i<results.length;i++){
      var txt = validateLabel(results[i]);
      if (!txt) continue;
      
      var row = document.createElement("div");
      row.className="notif-row";

      var cb = document.createElement("input");
      cb.type="checkbox";
      cb.checked = notifLabels.indexOf(txt) !== -1;
      cb.dataset.label = txt;
      
      // ✅ CLIENT-SIDE ONLY: Just add/remove chip, no backend call
      (function(label, checkbox){
        checkbox.addEventListener("change", function(e){ 
          console.log('[Dropdown] Checkbox change for: ' + label + ', checked=' + this.checked);
          
          if (this.checked) {
            if (notifLabels.length >= maxLimit) {
              e.preventDefault();
              this.checked = false;
              showUserMessage(
                'Maximum limit reached! You can select up to ' + maxLimit + ' notifications only.',
                'warning'
              );
              console.warn('[Dropdown] Checkbox blocked: max limit reached');
              return;
            }
            addChip(label);
          } else {
            removeChip(label);
          }
        });
      })(txt, cb);

      var lbl = document.createElement("span");
      lbl.textContent = txt;
      lbl.style.marginLeft="8px";

      row.appendChild(cb); 
      row.appendChild(lbl);
      fragment.appendChild(row);
    }
    
    list.appendChild(fragment);
  }
  
  console.log('[Dropdown] Suggestions rendered successfully');
}

function addChip(label){
  console.log('[Dropdown] Adding chip: ' + label);
  ensureNotifModelFresh();
  
  var validLabel = validateLabel(label);
  if (!validLabel) {
    console.warn('[Dropdown] Invalid label, cannot add chip');
    return;
  }
  
  var maxLimit = getDropdownLimit('notifications');
  if (notifLabels.indexOf(validLabel) !== -1) {
    console.log('[Dropdown] Chip already exists: ' + validLabel);
    return;
  }
  
  if (notifLabels.length >= maxLimit) {
    showUserMessage(
      'Maximum limit reached! You can select up to ' + maxLimit + ' notifications only.',
      'warning'
    );
    console.warn('[Dropdown] Cannot add chip - limit reached');
    return;
  }

  notifLabels.push(validLabel);

  var c = chipContainer();
  if (!c) return;

  var chip = document.createElement("span");
  chip.className = "chip";
  chip.dataset.label = validLabel;

  var txt = document.createElement("span");
  txt.className = "chip-text";
  txt.textContent = validLabel;
  txt.title = validLabel;

  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "chip-remove";
  btn.textContent = "×";
  btn.onclick = function(e){ 
    e.stopPropagation(); 
    e.preventDefault(); 
    removeChip(validLabel); 
  };

  chip.appendChild(txt); 
  chip.appendChild(btn);
  c.appendChild(chip);

  notifNodesByLabel[validLabel] = chip;

  renderNotifChips();
  console.log('[Dropdown] Chip added successfully: ' + validLabel);
}

function removeChip(label){
  console.log('[Dropdown] Removing chip: ' + label);
  ensureNotifModelFresh();
  
  var validLabel = validateLabel(label);
  if (!validLabel) {
    console.warn('[Dropdown] Invalid label, cannot remove chip');
    return;
  }

  var idx = notifLabels.indexOf(validLabel);
  if (idx === -1) {
    console.warn('[Dropdown] Chip not found in array: ' + validLabel);
    return;
  }

  notifLabels.splice(idx, 1);

  var node = notifNodesByLabel[validLabel];
  if (node && node.parentNode) {
    node.parentNode.removeChild(node);
  }
  delete notifNodesByLabel[validLabel];

  // Update checkboxes in popup
  var p = notifPopup();
  if (p) {
    var cbs = p.querySelectorAll("input[type='checkbox']");
    for (var i=0;i<cbs.length;i++){
      var cb = cbs[i];
      if (cb.dataset && cb.dataset.label === validLabel) {
        cb.checked = false;
      }
    }
  }

  renderNotifChips();
  console.log('[Dropdown] Chip removed successfully: ' + validLabel);
}

function renderNotifChips(skipPositionUpdate){
  console.log('[Dropdown] Rendering notification chips UI...');
  var c = chipContainer(); 
  if (!c) return;

  var visibleLimit = parseInt(c.dataset.visibleChips) || 4;
  var chips = c.querySelectorAll(".chip[data-label]");
  var counter = byId("chipCounter");

  notifVisibleCount = chips.length;

  // Show or hide chips based on limit
  for (var i=0;i<chips.length;i++){
    chips[i].style.display = (i < visibleLimit) ? "inline-flex" : "none";
  }

  // Update "+N more" chip
  var moreChip = c.querySelector(".dropdown-chip-more");
  if (chips.length > visibleLimit){
    var hiddenCount = chips.length - visibleLimit;
    if (!moreChip){
      moreChip = document.createElement("span");
      moreChip.className = "dropdown-chip dropdown-chip-more";
      moreChip.style.cssText = "background:#f3f4f6; cursor:pointer;";
      moreChip.textContent = "+" + hiddenCount + " more";
      moreChip.onclick = function(e){ 
        e.stopPropagation(); 
        showAllChipsModal(); 
      };
      c.appendChild(moreChip);
    } else {
      moreChip.textContent = "+" + hiddenCount + " more";
    }
  } else if (moreChip) {
    moreChip.remove();
  }

  // Reposition popup if it's open
  if (!skipPositionUpdate) {
    var p = notifPopup();
    if (p && p.style.display === "block") {
      positionNotifPopup();
    }
  }
  
  console.log('[Dropdown] Notification chips rendered: ' + chips.length + ' total');
}

function showAllChipsModal(){
  ensureNotifModelFresh();
  
  var existing = byId("allChipsModal");
  if (existing) existing.remove();

  var overlay = document.createElement("div");
  overlay.id = "allChipsModal";
  overlay.style.cssText = 
    "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5);" +
    "z-index:999999; display:flex; justify-content:center; align-items:center;";

  var modal = document.createElement("div");
  modal.style.cssText = 
    "background:#fff; border-radius:12px; padding:24px; max-width:600px; width:90%;" +
    "max-height:80vh; overflow-y:auto; box-shadow:0 8px 24px rgba(0,0,0,0.3);";

  var title = document.createElement("h3");
  title.textContent = "All Selected Notifications (" + notifLabels.length + ")";
  title.style.cssText = "margin:0 0 16px 0; font-size:18px; color:#111827;";

  var chipsList = document.createElement("div");
  chipsList.style.cssText = "display:flex; flex-wrap:wrap; gap:8px; margin-bottom:16px;";

  for (var i=0;i<notifLabels.length;i++){
    var lbl = notifLabels[i];
    var chip = document.createElement("span");
    chip.className = "chip";
    chip.style.display = "inline-flex";

    var txt = document.createElement("span");
    txt.className = "chip-text";
    txt.textContent = lbl;
    txt.title = lbl;

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip-remove";
    btn.textContent = "×";
    (function(label){
      btn.onclick = function(e){ 
        e.stopPropagation(); 
        removeChip(label); 
        overlay.remove(); 
        showAllChipsModal(); 
      };
    })(lbl);

    chip.appendChild(txt); 
    chip.appendChild(btn);
    chipsList.appendChild(chip);
  }

  var closeBtn = document.createElement("button");
  closeBtn.textContent = "Close";
  closeBtn.style.cssText = 
    "width:100%; padding:8px; background:#3b82f6; color:#fff; border:none;" +
    "border-radius:6px; cursor:pointer; font-size:14px;";
  closeBtn.onclick = function(){ overlay.remove(); };

  modal.appendChild(title);
  modal.appendChild(chipsList);
  modal.appendChild(closeBtn);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  overlay.onclick = function(e){ 
    if (e.target === overlay) overlay.remove(); 
  };
}

function attachDelegatedChipRemove(){
  var c = chipContainer(); 
  if (!c || c._delegated) return;
  c._delegated = true;
  c.addEventListener("click", function(e){
    if (e.target.classList.contains("chip-remove")){
      var ch = e.target.closest(".chip");
      if (ch && ch.dataset && ch.dataset.label){
        var lbl = ch.dataset.label;
        removeChip(lbl);
      }
    }
  });
}

function selectAllNotifications(e){
  if (e) e.preventDefault();
  console.log('[Dropdown] Select All Notifications');
  
  ensureNotifModelFresh();
  var p = notifPopup(), list = byId("notifList");
  if (!p || !list) return;
  
  var cbs = list.querySelectorAll("input[type='checkbox']");
  var maxLimit = getDropdownLimit('notifications');
  var added = 0;
  var wasLimited = false;
  
  for (var i=0;i<cbs.length;i++){
    if (!cbs[i].checked && notifLabels.length < maxLimit) {
      var lbl = cbs[i].dataset ? cbs[i].dataset.label : null;
      if (lbl) {
        cbs[i].checked = true;
        addChip(lbl);
        added++;
      }
    } else if (!cbs[i].checked) {
      wasLimited = true;
    }
  }
  
  if (wasLimited) {
    var totalAvailable = cbs.length;
    var notSelected = totalAvailable - notifLabels.length;
    showUserMessage(
      'Selected ' + added + ' notifications. Maximum limit is ' + maxLimit + '. ' +
      notSelected + ' items could not be selected.',
      'warning'
    );
  } else if (added > 0) {
    showUserMessage('Successfully selected ' + added + ' notifications.', 'success');
  } else {
    showUserMessage('Already at maximum limit or all items selected!', 'info');
  }
}

function clearAllNotifications(e){
  if (e) e.preventDefault();
  console.log('[Dropdown] Clear All Notifications');
  
  ensureNotifModelFresh();
  var cleared = notifLabels.length;
  
  // Clear all chips
  while (notifLabels.length > 0) {
    removeChip(notifLabels[0]);
  }
  
  if (cleared > 0) {
    showUserMessage('Cleared ' + cleared + ' notifications.', 'success');
  } else {
    showUserMessage('No notifications to clear.', 'info');
  }
}

/* ===========================================================
   CUSTOM DROPDOWN CHIPS FUNCTIONS
=========================================================== */

function updateDropdownChips(dd, boxes, labelText){
  if (!dd || !boxes || !labelText) return;

  var ddId = dd.getAttribute("data-dropdown-id");
  if (!ddId) return;

  var maxLimit = getDropdownLimit(ddId);
  var dropdownName = getDropdownName(ddId);
  var checked = [];
  
  for (var i=0;i<boxes.length;i++){
    if (boxes[i].checked) {
      var t = getCheckboxLabel(boxes[i]);
      if (t) checked.push(t);
    }
  }

  // Clear existing chips and ALL text nodes
  var existingChips = labelText.querySelectorAll(".dropdown-chip, .dropdown-chip-more, .placeholder-text");
  for (var j=0;j<existingChips.length;j++){
    existingChips[j].remove();
  }
  
  // Also clear any direct text nodes (from XHTML)
  var childNodes = labelText.childNodes;
  for (var n=childNodes.length-1; n>=0; n--){
    if (childNodes[n].nodeType === 3) { // Text node
      labelText.removeChild(childNodes[n]);
    }
  }

  // Add new chips
  var visibleLimit = 3;
  for (var k=0;k<Math.min(checked.length, visibleLimit);k++){
    var chip = document.createElement("span");
    chip.className = "dropdown-chip";
    
    var chipText = document.createElement("span");
    chipText.className = "dropdown-chip-text";
    chipText.textContent = checked[k];
    chipText.title = checked[k];
    
    var removeBtn = document.createElement("button");
    removeBtn.className = "dropdown-chip-remove";
    removeBtn.textContent = "×";
    removeBtn.type = "button";
    
    (function(label, dropdown, checkboxes){
      removeBtn.onclick = function(e){
        e.stopPropagation();
        e.preventDefault();
        
        for (var x=0;x<checkboxes.length;x++){
          var cbLabel = getCheckboxLabel(checkboxes[x]);
          if (cbLabel === label && checkboxes[x].checked) {
            checkboxes[x].checked = false;
            checkboxes[x].dispatchEvent(new Event("change",{bubbles:true}));
            break;
          }
        }
      };
    })(checked[k], dd, boxes);
    
    chip.appendChild(chipText);
    chip.appendChild(removeBtn);
    labelText.insertBefore(chip, labelText.firstChild);
  }

  // Add "+N more" chip if needed
  if (checked.length > visibleLimit){
    var moreChip = document.createElement("span");
    moreChip.className = "dropdown-chip dropdown-chip-more";
    moreChip.textContent = "+" + (checked.length - visibleLimit) + " more";
    moreChip.style.background = "#f3f4f6";
    moreChip.style.cursor = "pointer";
    
    (function(dropdown, allChecked){
      moreChip.onclick = function(e){
        e.stopPropagation();
        showDropdownModal(dropdown, allChecked);
      };
    })(dd, checked);
    
    labelText.insertBefore(moreChip, labelText.firstChild);
  }

  // Update placeholder text
  var defaultText = labelText.dataset.default || "Select items";
  if (checked.length === 0) {
    var placeholder = labelText.querySelector(".placeholder-text");
    if (!placeholder) {
      placeholder = document.createElement("span");
      placeholder.className = "placeholder-text";
      placeholder.style.color = "#9ca3af";
      labelText.appendChild(placeholder);
    }
    placeholder.textContent = defaultText;
  } else {
    var placeholder = labelText.querySelector(".placeholder-text");
    if (placeholder) placeholder.remove();
  }
}

function showDropdownModal(dd, selectedItems){
  var ddId = dd.getAttribute("data-dropdown-id");
  var dropdownName = getDropdownName(ddId);
  
  var existing = byId("dropdownModal");
  if (existing) existing.remove();

  var overlay = document.createElement("div");
  overlay.id = "dropdownModal";
  overlay.style.cssText = 
    "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5);" +
    "z-index:999999; display:flex; justify-content:center; align-items:center;";

  var modal = document.createElement("div");
  modal.style.cssText = 
    "background:#fff; border-radius:12px; padding:24px; max-width:600px; width:90%;" +
    "max-height:80vh; overflow-y:auto; box-shadow:0 8px 24px rgba(0,0,0,0.3);";

  var title = document.createElement("h3");
  title.textContent = "All Selected " + dropdownName + " (" + selectedItems.length + ")";
  title.style.cssText = "margin:0 0 16px 0; font-size:18px; color:#111827;";

  var chipsList = document.createElement("div");
  chipsList.style.cssText = "display:flex; flex-wrap:wrap; gap:8px; margin-bottom:16px;";

  var boxes = dd.querySelectorAll(".dropdown-list input[type='checkbox']");
  var lt = dd.querySelector(".label-text");

  for (var i=0;i<selectedItems.length;i++){
    var item = selectedItems[i];
    var chip = document.createElement("span");
    chip.className = "dropdown-chip";
    chip.style.display = "inline-flex";

    var chipText = document.createElement("span");
    chipText.className = "dropdown-chip-text";
    chipText.textContent = item;
    chipText.title = item;

    var removeBtn = document.createElement("button");
    removeBtn.className = "dropdown-chip-remove";
    removeBtn.textContent = "×";
    removeBtn.type = "button";
    
    (function(label, dropdown, checkboxes, labelText){
      removeBtn.onclick = function(e){
        e.stopPropagation();
        
        for (var x=0;x<checkboxes.length;x++){
          var cbLabel = getCheckboxLabel(checkboxes[x]);
          if (cbLabel === label && checkboxes[x].checked) {
            checkboxes[x].checked = false;
            checkboxes[x].dispatchEvent(new Event("change",{bubbles:true}));
            updateDropdownChips(dropdown, checkboxes, labelText);
            overlay.remove();
            
            // Reopen modal with updated list
            var newChecked = [];
            for (var y=0;y<checkboxes.length;y++){
              if (checkboxes[y].checked) {
                var t = getCheckboxLabel(checkboxes[y]);
                if (t) newChecked.push(t);
              }
            }
            if (newChecked.length > 0) {
              showDropdownModal(dropdown, newChecked);
            }
            break;
          }
        }
      };
    })(item, dd, boxes, lt);

    chip.appendChild(chipText);
    chip.appendChild(removeBtn);
    chipsList.appendChild(chip);
  }

  var closeBtn = document.createElement("button");
  closeBtn.textContent = "Close";
  closeBtn.style.cssText = 
    "width:100%; padding:8px; background:#3b82f6; color:#fff; border:none;" +
    "border-radius:6px; cursor:pointer; font-size:14px;";
  closeBtn.onclick = function(){ overlay.remove(); };

  modal.appendChild(title);
  modal.appendChild(chipsList);
  modal.appendChild(closeBtn);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  overlay.onclick = function(e){ 
    if (e.target === overlay) overlay.remove(); 
  };
}

function selectAll(btn, flag){
  var dd = btn.closest(".rich-dropdown");
  if (!dd) return;
  
  var ddId = dd.getAttribute("data-dropdown-id");
  if (!ddId) return;
  
  var maxLimit = getDropdownLimit(ddId);
  var dropdownName = getDropdownName(ddId);
  
  console.log('[Dropdown] Select All for: ' + ddId + ', limit: ' + maxLimit);
  
  var boxes = dd.querySelectorAll(".dropdown-list input[type='checkbox']");
  var lt = dd.querySelector(".label-text");
  
  if (flag) {
    var currentCount = 0;
    for (var i=0;i<boxes.length;i++){
      if (boxes[i].checked) currentCount++;
    }
    
    var canAdd = maxLimit - currentCount;
    var toCheckCount = 0;
    var wasLimited = false;
    
    for (var j=0;j<boxes.length;j++){
      if (!boxes[j].checked) {
        if (toCheckCount < canAdd) {
          boxes[j].checked = true;
          boxes[j].dispatchEvent(new Event("change",{bubbles:true}));
          toCheckCount++;
        } else {
          wasLimited = true;
        }
      }
    }
    
    if (wasLimited) {
      var totalAvailable = boxes.length;
      var notSelected = totalAvailable - (currentCount + toCheckCount);
      showUserMessage(
        'Selected ' + toCheckCount + ' ' + dropdownName.toLowerCase() + '. Maximum limit is ' + maxLimit + '. ' +
        notSelected + ' items could not be selected.',
        'warning'
      );
    } else if (toCheckCount > 0) {
      showUserMessage(
        'Successfully selected ' + toCheckCount + ' ' + dropdownName.toLowerCase() + '.',
        'success'
      );
    } else {
      showUserMessage(
        'Already at maximum limit! You have ' + maxLimit + ' ' + dropdownName.toLowerCase() + ' selected.',
        'info'
      );
    }
  } else {
    var clearCount = 0;
    for (var k=0;k<boxes.length;k++){
      if (boxes[k].checked) {
        boxes[k].checked = false;
        boxes[k].dispatchEvent(new Event("change",{bubbles:true}));
        clearCount++;
      }
    }
    
    if (clearCount > 0) {
      showUserMessage('Cleared ' + clearCount + ' ' + dropdownName.toLowerCase() + '.', 'success');
    } else {
      showUserMessage('No ' + dropdownName.toLowerCase() + ' to clear.', 'info');
    }
  }
  
  if (lt) {
    updateDropdownChips(dd,boxes,lt);
  }
}

function initializeCustomDropdowns(){
  var dds = qAll(".rich-dropdown");
  
  for (var i=0;i<dds.length;i++){
    (function(drop){
      var label = drop.querySelector(".rich-dropdown-label");
      if (!label || label._bound) return;
      label._bound = true;

      label.addEventListener("click", function(e){
        if (e.target.classList.contains("dropdown-chip-remove") ||
            e.target.classList.contains("dropdown-chip-more")){
          e.stopPropagation(); 
          return;
        }
        e.stopPropagation();
        
        var all = qAll(".rich-dropdown");
        for (var j=0;j<all.length;j++){ 
          if (all[j]!==drop) all[j].classList.remove("open"); 
        }
        drop.classList.toggle("open");
      });

      var boxes = drop.querySelectorAll(".dropdown-list input[type='checkbox']");
      var lt = drop.querySelector(".label-text");
      var ddId = drop.getAttribute("data-dropdown-id");
      var maxLimit = getDropdownLimit(ddId);
      var dropdownName = getDropdownName(ddId);
      
      for (var k=0;k<boxes.length;k++){
        var cb = boxes[k], t = getCheckboxLabel(cb);
        if (t) cb.dataset.label = t;
        
        (function(checkbox, d, b, l, limit, name){
          checkbox.addEventListener("change", function(e){ 
            if (this.checked) {
              var currentCount = 0;
              for (var x=0; x<b.length; x++){
                if (b[x].checked) currentCount++;
              }
              
              if (currentCount > limit) {
                e.preventDefault();
                this.checked = false;
                showUserMessage(
                  'Maximum limit reached! You can select up to ' + limit + ' ' + name.toLowerCase() + ' only.',
                  'warning'
                );
                console.warn('[Dropdown] Checkbox blocked: max limit reached for ' + name);
                return;
              }
            }
            updateDropdownChips(d,b,l);
          });
        })(cb, drop, boxes, lt, maxLimit, dropdownName);
      }
      
      updateDropdownChips(drop,boxes,lt);
    })(dds[i]);
  }

  document.addEventListener("click", function(e){
    if (!e.target.closest || !e.target.closest(".rich-dropdown")){
      var all = qAll(".rich-dropdown");
      for (var i=0;i<all.length;i++){ 
        all[i].classList.remove("open"); 
      }
    }
  });
}

// ✅ ENHANCED: Now includes notifications in form submit
function prepareFormSubmit(){
  console.log('[Dropdown] ========== PREPARING FORM SUBMIT ==========');
  
  var map = {
    "eventCodes":"formId:selectedEventCodes",
    "stores":"formId:selectedStores",
    "pickupType":"formId:selectedPickupTypes"
  };
  var ids=["stores","eventCodes","pickupType"];
  
  // Prepare Event Codes and Pickup Types
  for (var i=0;i<ids.length;i++){
    var dd = qSel("[data-dropdown-id='"+ids[i]+"']");
    if (!dd) continue;
    
    var checked = dd.querySelectorAll(".dropdown-list input[type='checkbox']:checked");
    var vals=[];
    
    for (var j=0;j<checked.length;j++){
      var t = getCheckboxLabel(checked[j]); 
      if (t) vals.push(t);
    }
    
    var hf = byId(map[ids[i]]); 
    if (hf) {
      hf.value = vals.join(",");
      console.log('[Dropdown] ' + ids[i] + ': ' + vals.length + ' items');
    }
  }
  
  // ✅ NEW: Prepare Notifications
  ensureNotifModelFresh();
  var notifHidden = byId("formId:selectedNotifications");
  if (notifHidden) {
    notifHidden.value = notifLabels.join(",");
    console.log('[Dropdown] Notifications: ' + notifLabels.length + ' items');
    console.log('[Dropdown] Notifications value: ' + notifHidden.value);
  } else {
    console.warn('[Dropdown] selectedNotifications hidden field not found!');
  }
  
  console.log('[Dropdown] ========== FORM SUBMIT PREPARED ==========');
  return true;
}

/* ===========================================================
   SCROLL HANDLER FOR POPUP POSITIONING
=========================================================== */
window.addEventListener("scroll", function(){
  try {
    var p = notifPopup();
    if (p && p.style.display === "block") {
      positionNotifPopup();
    }
  } catch(err) {
    console.error('[Dropdown] Scroll error:', err);
  }
}, true);

/* ===========================================================
   INIT
=========================================================== */
window.addEventListener("load", function(){
  try {
    console.log('[Dropdown] Initializing...');
    console.log('[Dropdown] Limits: Notifications=' + DROPDOWN_LIMITS.notifications + 
                ', EventCodes=' + DROPDOWN_LIMITS.eventCodes + 
                ', PickupType=' + DROPDOWN_LIMITS.pickupType);
    initializeCustomDropdowns();
    hydrateNotifModelFromDOM();
    attachDelegatedChipRemove();
    renderNotifChips(true);
    console.log('[Dropdown] Initialization complete');
  } catch(err) {
    console.error('[Dropdown] Initialization error:', err);
  }
});

window.addEventListener("resize", function(){
  try {
    var p = notifPopup();
    if (p && p.style.display==="block") {
      positionNotifPopup();
    }
  } catch(err) {
    console.error('[Dropdown] Resize error:', err);
  }
});
/* ========== UPDATE STORES DISPLAY IN TABLE ========== */
function updateStoresDisplay(selectedStores){
  var display = document.querySelector("[id$='selectedStoresDisplay']");
  if (display) {
    if (selectedStores && selectedStores.length > 0) {
      display.textContent = selectedStores.join(", ");
    } else {
      display.textContent = "None selected";
    }
  }
}
