/* ===========================================================
   dropdown.js — RF friendly custom dropdown + chips
   JSF 1.2 + RichFaces 3.3.3 safe | ES5 Compatible
   Security-Hardened | Performance-Optimized | Production-Ready
   
   SECURITY FIXES:
   ✅ XSS Protection via HTML escaping
   ✅ No inline event handlers (CSP compliant)
   ✅ Input validation and sanitization
   ✅ Edge case handling
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
  if (label.length > 500) return label.substring(0, 500); // Truncate long labels
  return label;
}

/* Cache core DOM nodes */
var _chipsContainer = null, _notifPopup = null, _chipInput = null;
function chipContainer(){ return _chipsContainer || (_chipsContainer = byId("chipsContainer")); }
function notifPopup(){ return _notifPopup || (_notifPopup = byId("notifPopup")); }
function chipInput(){ return _chipInput || (_chipInput = byId("formId:chipInput")); }

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
     NOTIFICATION CHIPS
=========================================================== */

var notifLabels = [], notifNodesByLabel = {}, notifVisibleCount = 0;
var ABSOLUTE_MAX_CHIPS = 50;

/* Hide all counters (Option-D) */
function hideAllCounters(){
  var ids = ["eventCodesCounter","pickupTypeCounter","chipCounter"];
  for (var i=0;i<ids.length;i++){
    var el = byId(ids[i]);
    if (el && el.className.indexOf("hidden") === -1) {
      el.className += " hidden";
    }
  }
}

/* Sync JS model from DOM */
function hydrateNotifModelFromDOM(){
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
}

function ensureNotifModelFresh(){
  var c = chipContainer(); 
  if (!c) return;
  var dom = c.querySelectorAll(".chip[data-label]").length;
  if (dom !== notifLabels.length) hydrateNotifModelFromDOM();
}

/* Popup positioning */
function positionNotifPopup(){
  var p = notifPopup(), w = byId("formId:chipInputWrapper");
  if (!p || !w) return;
  var r = w.getBoundingClientRect();
  p.style.top = (r.bottom + 4) + "px";
  p.style.left = r.left + "px";
  p.style.width = r.width + "px";
}

/* Show popup */
function openCustomNotifPopup(){
  var p = notifPopup(); 
  if (!p) return;
  positionNotifPopup();
  p.style.display = "block";
}

/* Popup close click - Enhanced with null checks */
document.addEventListener("mousedown", function(e){
  var p = notifPopup(), i = chipInput();
  if (!p || !i) return;
  if (!p.contains(e.target) && !i.contains(e.target)) {
    p.style.display="none";
  }
});

/* Backspace delete chip - Enhanced with validation */
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

/* Server JSON callback - Enhanced error handling */
function onFetchNotifSuggestionsComplete(event, data){
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

/* Render suggestions - SECURE VERSION (No XSS) */
function renderNotifSuggestions(results){
  var p = notifPopup(), list = byId("notifList");
  if (!p || !list) return;

  // Clear existing content
  while (list.firstChild) list.removeChild(list.firstChild);

  if (!results || !results.length){
    var d = document.createElement("div");
    d.textContent = "No results found";
    d.style.padding="8px"; 
    d.style.color="#6b7280";
    list.appendChild(d);
  } else {
    ensureNotifModelFresh();
    
    // Use DocumentFragment for better performance
    var fragment = document.createDocumentFragment();
    
    for (var i=0;i<results.length;i++){
      var txt = validateLabel(results[i]);
      if (!txt) continue; // Skip invalid labels
      
      var row = document.createElement("div");
      row.className="notif-row";

      var cb = document.createElement("input");
      cb.type="checkbox";
      cb.checked = notifLabels.indexOf(txt) !== -1;
      cb.dataset.label = txt;
      
      // Programmatic event listener (no inline handler)
      (function(label){
        cb.addEventListener("change", function(){ 
          if (this.checked) {
            addChip(label); 
          } else {
            removeChip(label);
          }
        });
      })(txt);

      var lbl = document.createElement("span");
      lbl.textContent = txt; // Safe - uses textContent
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

/* Select/Clear all - Enhanced with edge case handling */
function selectAllNotifications(e){
  if (e){ 
    e.preventDefault(); 
    e.stopPropagation(); 
  }
  var p = notifPopup(); 
  if (!p) return;
  
  var boxes = p.querySelectorAll(".notif-row input[type='checkbox']");
  var addedCount = 0;
  
  for (var i=0;i<boxes.length;i++){
    // Respect max chip limit
    if (notifLabels.length + addedCount >= ABSOLUTE_MAX_CHIPS) {
      console.warn('[Dropdown] Max chips reached (' + ABSOLUTE_MAX_CHIPS + ')');
      break;
    }
    
    if (!boxes[i].checked){ 
      boxes[i].checked=true; 
      boxes[i].dispatchEvent(new Event("change"));
      addedCount++;
    }
  }
}

function clearAllNotifications(e){
  if (e){ 
    e.preventDefault(); 
    e.stopPropagation(); 
  }
  var p = notifPopup(); 
  if (!p) return;
  
  var boxes = p.querySelectorAll(".notif-row input[type='checkbox']");
  for (var i=0;i<boxes.length;i++){
    if (boxes[i].checked){ 
      boxes[i].checked=false; 
      boxes[i].dispatchEvent(new Event("change")); 
    }
  }
  
  var ed = chipInput(); 
  if (ed) ed.value = ""; // ensure suggestions reset
}

/* Create chip node - SECURE VERSION (No inline handlers) */
function createNotifChipNode(lbl){
  var validLabel = validateLabel(lbl);
  if (!validLabel) return null;
  
  var c = document.createElement("span"); 
  c.className="chip"; 
  c.dataset.label=validLabel;
  
  var t = document.createElement("span"); 
  t.className="chip-text"; 
  t.title=validLabel; 
  t.textContent=validLabel; // Safe - uses textContent
  
  var x = document.createElement("button"); 
  x.type="button"; 
  x.className="chip-remove"; 
  x.textContent="×";
  
  // Programmatic event listener with proper closure
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

/* Add chip - Enhanced with validation and edge cases */
function addChip(lbl){
  var validLabel = validateLabel(lbl);
  if (!validLabel) return;
  
  ensureNotifModelFresh();
  
  // Check if already exists
  if (notifNodesByLabel[validLabel]) return;
  
  // Check max limit
  if (notifLabels.length >= ABSOLUTE_MAX_CHIPS) {
    console.warn('[Dropdown] Cannot add chip: max limit reached (' + ABSOLUTE_MAX_CHIPS + ')');
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

  // Call external toggle if available
  if (typeof toggleNotif==="function") {
    try {
      toggleNotif(validLabel, true);
    } catch(err) {
      console.error('[Dropdown] toggleNotif error:', err);
    }
  }

  renderNotifChips(true);
  positionNotifPopup();
}

/* Remove chip - Enhanced with edge case handling */
function removeChip(lbl){
  var validLabel = validateLabel(lbl);
  if (!validLabel) return;
  
  ensureNotifModelFresh();

  var n = notifNodesByLabel[validLabel];
  if (!n){
    // Fallback: try to find in DOM
    var container = chipContainer();
    if (container) {
      n = container.querySelector('.chip[data-label="'+CSS.escape(validLabel)+'"]');
    }
  }
  
  if (n && n.parentNode) {
    n.parentNode.removeChild(n);
  }

  delete notifNodesByLabel[validLabel];
  var idx = notifLabels.indexOf(validLabel);
  if (idx > -1) notifLabels.splice(idx,1);

  // Uncheck in popup if present
  var p = notifPopup();
  if (p){
    var boxes = p.querySelectorAll('.notif-row input[type="checkbox"]');
    for (var i=0;i<boxes.length;i++){
      if (boxes[i].dataset.label===validLabel) {
        boxes[i].checked=false;
      }
    }
  }
  
  // Call external toggle if available
  if (typeof toggleNotif==="function") {
    try {
      toggleNotif(validLabel, false);
    } catch(err) {
      console.error('[Dropdown] toggleNotif error:', err);
    }
  }

  renderNotifChips(true);
  positionNotifPopup();
}

/* Render visible chips - SECURE VERSION (No inline handlers) */
function renderNotifChips(reset){
  var c = chipContainer();
  if (!c) return;
  
  var total = notifLabels.length, chunk = 5;
  ensureNotifModelFresh();

  if (reset) notifVisibleCount = chunk;
  if (!notifVisibleCount) notifVisibleCount = chunk;
  var visible = Math.min(notifVisibleCount, total);

  /* Remove old controls */
  var old = c.querySelectorAll(".chip-more");
  for (var i=0;i<old.length;i++){
    if (old[i].parentNode) old[i].parentNode.removeChild(old[i]);
  }

  /* Apply display via CSS class toggle */
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
      c.appendChild(n); // appendChild moves existing nodes
      if (j < visible) {
        n.classList.remove("hidden");
      } else {
        n.classList.add("hidden");
      }
    }
  }

  var hidden = total - visible;

  /* +more button - SECURE (programmatic listener) */
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

    /* Collapse button if expanded */
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
    /* Show collapse if all visible but more than chunk */
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

/* Delegated chip remove - Already secure */
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

/* Resize Observer to reposition popup - Enhanced error handling */
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
    MULTI-SELECT DROPDOWNS
=========================================================== */

/* Remove dropdown chip - SECURE VERSION */
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

/* Expand dropdown chips - SECURE VERSION */
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

/* Collapse dropdown chips - SECURE VERSION */
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

/* Render dropdown chips - SECURE VERSION (No XSS, No inline handlers) */
function renderDropdownChips(lt, selected, visible, chunk){
  if (!lt || !selected) return;
  
  // Clear existing content safely
  while (lt.firstChild) {
    lt.removeChild(lt.firstChild);
  }
  
  var max=Math.min(visible,selected.length);
  var fragment = document.createDocumentFragment();
  
  // Create chip elements programmatically (safe from XSS)
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
    textSpan.textContent = validLabel; // Safe - uses textContent
    
    var removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "dropdown-chip-remove";
    removeBtn.textContent = "×";
    
    // Programmatic event listener (no inline onclick)
    removeBtn.addEventListener("click", function(e){
      removeDropdownChip(this, e);
    });
    
    chipSpan.appendChild(textSpan);
    chipSpan.appendChild(removeBtn);
    fragment.appendChild(chipSpan);
  }
  
  var rem = selected.length - visible;
  
  // "+N more" button
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
  
  // "Collapse" button
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

/* Update dropdown chips - Enhanced with validation */
function updateDropdownChips(dd,boxes,lt){
  if (!dd || !boxes || !lt) return;
  
  var selected=[], i;
  for (i=0;i<boxes.length;i++){
    if (boxes[i].checked){
      var t = getCheckboxLabel(boxes[i]); 
      if (t) selected.push(t);
    }
  }

  // Update counter if present
  var ddId = dd.getAttribute("data-dropdown-id");
  if (ddId) {
    var counter = byId(ddId + "Counter");
    if (counter) {
      counter.textContent = selected.length + "/" + boxes.length;
    }
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

/* Select/Clear all - Enhanced with edge cases */
function selectAll(btn,flag){
  if (!btn) return;
  
  var dd = btn.closest(".rich-dropdown");
  if (!dd) return;
  
  var boxes = dd.querySelectorAll(".dropdown-list input[type='checkbox']");
  var lt = dd.querySelector(".label-text");
  
  for (var i=0;i<boxes.length;i++){
    boxes[i].checked = flag;
    boxes[i].dispatchEvent(new Event("change",{bubbles:true}));
  }
  
  if (lt) {
    updateDropdownChips(dd,boxes,lt);
  }
}

/* Init dropdowns with safe closure capturing - Already good */
function initializeCustomDropdowns(){
  var dds = qAll(".rich-dropdown");
  
  for (var i=0;i<dds.length;i++){
    (function(drop){
      var label = drop.querySelector(".rich-dropdown-label");
      if (!label || label._bound) return;
      label._bound = true;

      label.addEventListener("click", function(e){
        // Don't toggle if clicking chip controls
        if (e.target.classList.contains("dropdown-chip-remove") ||
            e.target.classList.contains("dropdown-chip-more")){
          e.stopPropagation(); 
          return;
        }
        e.stopPropagation();
        
        // Close other dropdowns
        var all = qAll(".rich-dropdown");
        for (var j=0;j<all.length;j++){ 
          if (all[j]!==drop) all[j].classList.remove("open"); 
        }
        drop.classList.toggle("open");
      });

      var boxes = drop.querySelectorAll(".dropdown-list input[type='checkbox']");
      var lt = drop.querySelector(".label-text");
      
      for (var k=0;k<boxes.length;k++){
        var cb = boxes[k], t = getCheckboxLabel(cb);
        if (t) cb.dataset.label = t;
        
        // Proper closure for change listener
        cb.addEventListener("change", (function(d,b,l){
          return function(){ updateDropdownChips(d,b,l); };
        })(drop,boxes,lt));
      }
      
      updateDropdownChips(drop,boxes,lt);
    })(dds[i]);
  }

  // Close dropdowns on outside click
  document.addEventListener("click", function(e){
    if (!e.target.closest || !e.target.closest(".rich-dropdown")){
      var all = qAll(".rich-dropdown");
      for (var i=0;i<all.length;i++){ 
        all[i].classList.remove("open"); 
      }
    }
  });
}

/* Submit prep - Enhanced with validation */
function prepareFormSubmit(){
  var map = {
    "eventCodes":"formId:selectedEventCodes",
    "pickupType":"formId:selectedPickupTypes"
  };
  var ids=["eventCodes","pickupType"];
  
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
    }
  }
  return true;
}

/* ===========================================================
   INIT - Enhanced with error handling
=========================================================== */
window.addEventListener("load", function(){
  try {
    hideAllCounters();
    initializeCustomDropdowns();
    hydrateNotifModelFromDOM();
    attachDelegatedChipRemove();
    renderNotifChips(true);
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