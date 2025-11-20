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
     NOTIFICATION CHIPS - CLIENT-SIDE ONLY
=========================================================== */

var notifLabels = [], notifNodesByLabel = {}, notifVisibleCount = 0;

function hideAllCounters(){
  var ids = ["storesCounter","eventCodesCounter","pickupTypeCounter","chipCounter"];
  for (var i=0;i<ids.length;i++){
    var el = byId(ids[i]);
    if (el && el.className.indexOf("hidden") === -1) {
      el.className += " hidden";
    }
  }
}

/* ===========================================================
    HIDDEN BUTTON TRIGGER FUNCTIONS
=========================================================== */

// Debounce timer for notification search
var notifSearchTimer = null;

// Trigger notification search via hidden button
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

// Trigger event type change via hidden button
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
  
  positionNotifPopup();
  p.style.display="block";
}

// ✅ CLIENT-SIDE ONLY: Select All - No backend calls
function selectAllNotifications(e){
  console.log('[Dropdown] ========== SELECT ALL NOTIFICATIONS STARTED ==========');
  
  if (e){ 
    e.preventDefault(); 
    e.stopPropagation(); 
  }
  
  var p = notifPopup(); 
  if (!p) return;
  
  var boxes = p.querySelectorAll(".notif-row input[type='checkbox']");
  var maxLimit = getDropdownLimit('notifications');
  
  ensureNotifModelFresh();
  
  var labelsToAdd = [];
  for (var i=0; i<boxes.length; i++){
    if (!boxes[i].checked && boxes[i].dataset && boxes[i].dataset.label) {
      var lbl = boxes[i].dataset.label;
      var alreadyExists = false;
      for (var x=0; x<notifLabels.length; x++){
        if (notifLabels[x] === lbl) {
          alreadyExists = true;
          break;
        }
      }
      if (!alreadyExists) {
        labelsToAdd.push(lbl);
      }
    }
  }
  
  var canAdd = maxLimit - notifLabels.length;
  var wasLimited = false;
  
  if (labelsToAdd.length > canAdd) {
    wasLimited = true;
    labelsToAdd = labelsToAdd.slice(0, canAdd);
  }
  
  if (!labelsToAdd.length) {
    if (notifLabels.length >= maxLimit) {
      showUserMessage(
        'Already at maximum limit! You have ' + maxLimit + ' notifications selected.',
        'info'
      );
    }
    return;
  }
  
  // ✅ Just add chips client-side, no backend calls
  var successCount = 0;
  for (var j=0; j<labelsToAdd.length; j++){
    var before = notifLabels.length;
    addChip(labelsToAdd[j]);
    var after = notifLabels.length;
    if (after > before) {
      successCount++;
    }
  }
  
  // ✅ Update checkboxes to reflect selection
  for (var m=0; m<boxes.length; m++){
    if (boxes[m].dataset && boxes[m].dataset.label) {
      var shouldBeChecked = false;
      for (var y=0; y<notifLabels.length; y++){
        if (notifLabels[y] === boxes[m].dataset.label) {
          shouldBeChecked = true;
          break;
        }
      }
      boxes[m].checked = shouldBeChecked;
    }
  }
  
  if (wasLimited) {
    var totalAvailable = boxes.length;
    var notSelected = totalAvailable - notifLabels.length;
    showUserMessage(
      'Selected ' + successCount + ' notifications. Maximum limit is ' + maxLimit + '. ' +
      notSelected + ' items could not be selected.',
      'warning'
    );
  } else {
    showUserMessage(
      'Successfully selected ' + successCount + ' notifications.',
      'success'
    );
  }
  
  positionNotifPopup();
  console.log('[Dropdown] ========== SELECT ALL NOTIFICATIONS COMPLETED ==========');
}

// ✅ CLIENT-SIDE ONLY: Clear All - No backend calls
function clearAllNotifications(e){
  console.log('[Dropdown] ========== CLEAR ALL NOTIFICATIONS STARTED ==========');
  
  if (e){ 
    e.preventDefault(); 
    e.stopPropagation(); 
  }
  
  var p = notifPopup(); 
  if (!p) return;
  
  var boxes = p.querySelectorAll(".notif-row input[type='checkbox']");
  
  var labelsToRemove = [];
  for (var i=0; i<boxes.length; i++){
    if (boxes[i].checked && boxes[i].dataset && boxes[i].dataset.label) {
      labelsToRemove.push(boxes[i].dataset.label);
    }
  }
  
  if (!labelsToRemove.length) {
    showUserMessage('No notifications to clear.', 'info');
    return;
  }
  
  // ✅ Just remove chips client-side, no backend calls
  for (var j=0; j<labelsToRemove.length; j++){
    removeChip(labelsToRemove[j]);
  }
  
  // ✅ Update checkboxes
  for (var m=0; m<boxes.length; m++){
    boxes[m].checked = false;
  }
  
  var ed = chipInput(); 
  if (ed) ed.value = "";
  
  showUserMessage('Cleared ' + labelsToRemove.length + ' notifications.', 'success');
  
  positionNotifPopup();
}

function createNotifChipNode(lbl){
  var validLabel = validateLabel(lbl);
  if (!validLabel) return null;
  
  var c = document.createElement("span"); 
  c.className="chip"; 
  c.dataset.label=validLabel;
  
  var t = document.createElement("span"); 
  t.className="chip-text"; 
  t.title=validLabel; 
  t.textContent=validLabel;
  
  var x = document.createElement("button"); 
  x.type="button"; 
  x.className="chip-remove"; 
  x.textContent="×";
  
  (function(label){
    x.addEventListener("click", function(e){ 
      if (e) {
        e.stopPropagation(); 
        e.preventDefault(); 
      }
      removeChip(label); 
    });
  })(validLabel);
  
  c.appendChild(t); 
  c.appendChild(x);
  return c;
}

// ✅ CLIENT-SIDE ONLY: addChip - No backend call
function addChip(lbl){
  var validLabel = validateLabel(lbl);
  if (!validLabel) return;
  
  var maxLimit = getDropdownLimit('notifications');
  
  ensureNotifModelFresh();
  
  if (notifNodesByLabel[validLabel]) return;
  
  for (var i=0; i<notifLabels.length; i++){
    if (notifLabels[i] === validLabel) return;
  }
  
  if (notifLabels.length >= maxLimit) {
    console.warn('[Dropdown] Cannot add chip: max limit reached (' + maxLimit + ')');
    showUserMessage(
      'Maximum limit reached! You can select up to ' + maxLimit + ' notifications only.',
      'warning'
    );
    return;
  }

  var c = createNotifChipNode(validLabel);
  if (!c) return;
  
  notifLabels.push(validLabel);
  notifNodesByLabel[validLabel] = c;
  
  var container = chipContainer();
  if (container) {
    container.appendChild(c);
  }

  // ✅ NO BACKEND CALL - just update UI
  renderNotifChips(true);
  positionNotifPopup();
}

// ✅ CLIENT-SIDE ONLY: removeChip - No backend call
function removeChip(lbl){
  var validLabel = validateLabel(lbl);
  if (!validLabel) return;
  
  ensureNotifModelFresh();

  var n = notifNodesByLabel[validLabel];
  if (!n){
    var container = chipContainer();
    if (container) {
      n = container.querySelector('.chip[data-label="'+CSS.escape(validLabel)+'"]');
    }
  }
  
  if (n && n.parentNode) {
    n.parentNode.removeChild(n);
  }

  delete notifNodesByLabel[validLabel];
  
  for (var i=0; i<notifLabels.length; i++){
    if (notifLabels[i] === validLabel) {
      notifLabels.splice(i, 1);
      break;
    }
  }

  // ✅ NO BACKEND CALL - just update UI
  var p = notifPopup();
  if (p){
    var boxes = p.querySelectorAll('.notif-row input[type="checkbox"]');
    for (var j=0;j<boxes.length;j++){
      if (boxes[j].dataset.label===validLabel) {
        boxes[j].checked=false;
      }
    }
  }
  
  renderNotifChips(true);
  positionNotifPopup();
}

function renderNotifChips(reset){
  var c = chipContainer();
  if (!c) return;
  
  var total = notifLabels.length, chunk = 5;
  
  ensureNotifModelFresh();

  if (reset) notifVisibleCount = chunk;
  if (!notifVisibleCount) notifVisibleCount = chunk;
  var visible = Math.min(notifVisibleCount, total);

  var old = c.querySelectorAll(".chip-more");
  for (var i=0;i<old.length;i++){
    if (old[i].parentNode) old[i].parentNode.removeChild(old[i]);
  }

  for (var j=0;j<total;j++){
    var lbl = notifLabels[j];
    var n = notifNodesByLabel[lbl];
    
    if (!n) {
      n = createNotifChipNode(lbl);
      if (n) {
        notifNodesByLabel[lbl] = n;
      }
    }
    
    if (n) {
      c.appendChild(n);
      if (j < visible) {
        n.classList.remove("hidden");
      } else {
        n.classList.add("hidden");
      }
    }
  }

  var hidden = total - visible;

  if (hidden > 0){
    var more = document.createElement("span");
    more.className="chip chip-more"; 
    more.textContent="+"+hidden+" more"; 
    more.style.cursor="pointer";
    
    more.addEventListener("click", function(){
      notifVisibleCount = Math.min(notifVisibleCount+chunk, total);
      renderNotifChips(); 
      positionNotifPopup();
    });
    
    c.appendChild(more);

    if (notifVisibleCount > chunk){
      var col = document.createElement("span");
      col.className="chip chip-more"; 
      col.textContent="Collapse"; 
      col.style.cursor="pointer";
      
      col.addEventListener("click", function(){
        notifVisibleCount = chunk;
        renderNotifChips(true); 
        positionNotifPopup();
      });
      
      c.appendChild(col);
    }

  } else if (total > chunk){
    var col2 = document.createElement("span");
    col2.className="chip chip-more"; 
    col2.textContent="Collapse"; 
    col2.style.cursor="pointer";
    
    col2.addEventListener("click", function(){
      notifVisibleCount = chunk;
      renderNotifChips(true); 
      positionNotifPopup();
    });
    
    c.appendChild(col2);
  }
}

function attachDelegatedChipRemove(){
  var c = chipContainer(); 
  if (!c || c._delegated) return;
  c._delegated = true;
  
  c.addEventListener("click", function(e){
    var t = e.target;
    while (t && t !== c){
      if (t.classList && t.classList.contains("chip-remove")){
        var chip = t;
        while (chip && (!chip.classList || !chip.classList.contains("chip"))){
          chip = chip.parentNode;
        }
        if (chip){
          var lbl = chip.dataset ? chip.dataset.label : chip.getAttribute("data-label");
          if (lbl) removeChip(lbl);
        }
        return;
      }
      t = t.parentNode;
    }
  });
}

setTimeout(function(){
  var i = chipInput();
  if (i && i.parentNode && typeof ResizeObserver==="function"){
    try { 
      new ResizeObserver(function(){ 
        var p = notifPopup();
        if (p && p.style.display === "block") {
          positionNotifPopup(); 
        }
      }).observe(i.parentNode); 
    } catch(e){
      console.error('[Dropdown] ResizeObserver error:', e);
    }
  }
},300);

/* ===========================================================
    MULTI-SELECT DROPDOWNS WITH LIMITS
=========================================================== */

function removeDropdownChip(btn,ev){
  if (!btn || !ev) return;
  ev.stopPropagation();
  
  var chip = btn.closest(".dropdown-chip");
  if (!chip) return;
  
  var lbl = chip.dataset ? chip.dataset.value : chip.getAttribute("data-value");
  if (!lbl) return;
  
  var dd = chip.closest(".rich-dropdown");
  if (!dd) return;
  
  var boxes = dd.querySelectorAll(".dropdown-list input[type='checkbox']");
  var labelText = dd.querySelector(".label-text");
  
  for (var i=0;i<boxes.length;i++){
    if (getCheckboxLabel(boxes[i]) === lbl){
      boxes[i].checked=false;
      boxes[i].dispatchEvent(new Event("change",{bubbles:true}));
    }
  }
  
  updateDropdownChips(dd,boxes,labelText);
}

function expandDropdownChips(btn,ev){
  if (!btn || !ev) return;
  ev.stopPropagation();
  
  var dd=btn.closest(".rich-dropdown");
  if (!dd) return;
  
  var lt=dd.querySelector(".label-text");
  if (!lt) return;
  
  var boxes=dd.querySelectorAll(".dropdown-list input[type='checkbox']");
  var selected=[];
  
  for (var i=0;i<boxes.length;i++){
    if (boxes[i].checked){
      var t=getCheckboxLabel(boxes[i]); 
      if (t) selected.push(t);
    }
  }
  
  var chunk=5, curr=parseInt(lt.dataset.visibleCount||chunk,10);
  curr=Math.min(curr+chunk, selected.length); 
  lt.dataset.visibleCount=curr;
  renderDropdownChips(lt, selected, curr, chunk);
}

function collapseDropdownChips(btn,ev){
  if (!btn || !ev) return;
  ev.stopPropagation();
  
  var dd=btn.closest(".rich-dropdown");
  if (!dd) return;
  
  var lt=dd.querySelector(".label-text");
  if (!lt) return;
  
  lt.dataset.visibleCount=5;
  var boxes=dd.querySelectorAll(".dropdown-list input[type='checkbox']");
  updateDropdownChips(dd,boxes,lt);
}

function renderDropdownChips(lt, selected, visible, chunk){
  if (!lt || !selected) return;
  
  while (lt.firstChild) {
    lt.removeChild(lt.firstChild);
  }
  
  var max=Math.min(visible,selected.length);
  var fragment = document.createDocumentFragment();
  
  for (var i=0;i<max;i++){
    var lbl=selected[i];
    var validLabel = validateLabel(lbl);
    if (!validLabel) continue;
    
    var chipSpan = document.createElement("span");
    chipSpan.className = "dropdown-chip";
    chipSpan.dataset.value = validLabel;
    chipSpan.title = validLabel;
    
    var textSpan = document.createElement("span");
    textSpan.className = "dropdown-chip-text";
    textSpan.textContent = validLabel;
    
    var removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "dropdown-chip-remove";
    removeBtn.textContent = "×";
    
    removeBtn.addEventListener("click", function(e){
      removeDropdownChip(this, e);
    });
    
    chipSpan.appendChild(textSpan);
    chipSpan.appendChild(removeBtn);
    fragment.appendChild(chipSpan);
  }
  
  var rem = selected.length - visible;
  
  if (rem>0) {
    var moreSpan = document.createElement("span");
    moreSpan.className = "dropdown-chip dropdown-chip-more";
    moreSpan.textContent = "+"+rem+" more";
    moreSpan.style.cursor = "pointer";
    
    moreSpan.addEventListener("click", function(e){
      expandDropdownChips(this, e);
    });
    
    fragment.appendChild(moreSpan);
  }
  
  if (visible>chunk) {
    var collapseSpan = document.createElement("span");
    collapseSpan.className = "dropdown-chip dropdown-chip-more";
    collapseSpan.textContent = "Collapse";
    collapseSpan.style.cursor = "pointer";
    
    collapseSpan.addEventListener("click", function(e){
      collapseDropdownChips(this, e);
    });
    
    fragment.appendChild(collapseSpan);
  }
  
  lt.appendChild(fragment);
}

function updateDropdownChips(dd,boxes,lt){
  if (!dd || !boxes || !lt) return;
  
  var selected=[], i;
  for (i=0;i<boxes.length;i++){
    if (boxes[i].checked){
      var t = getCheckboxLabel(boxes[i]); 
      if (t) selected.push(t);
    }
  }

  var ddId = dd.getAttribute("data-dropdown-id");
  if (ddId) {
    var counter = byId(ddId + "Counter");
    if (counter) {
      counter.textContent = selected.length + "/" + boxes.length;
    }
  }
    
    // Update stores display in table if this is the stores dropdown
    if (ddId === "stores") {
      updateStoresDisplay(selected);
    }

  if (!selected.length){
    lt.textContent = lt.getAttribute("data-default") || "Select";
    lt.dataset.visibleCount = 5; 
    return;
  }

  var chunk=5, vis=parseInt(lt.dataset.visibleCount||chunk,10);
  vis=Math.min(vis, selected.length);
  renderDropdownChips(lt, selected, vis, chunk);
}

function selectAll(btn,flag){
  if (!btn) return;
  
  var dd = btn.closest(".rich-dropdown");
  if (!dd) return;
  
  var ddId = dd.getAttribute("data-dropdown-id");
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
    hideAllCounters();
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
