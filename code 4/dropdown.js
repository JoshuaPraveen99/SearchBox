/* ===========================================================
   dropdown.js — RF friendly custom dropdown + chips
   Works: JSF 1.2 + RichFaces 3.3.3 + Chrome + Firefox + Edge
   ES5 Compatible - No Arrow Functions
=========================================================== */

/* -------- DEBUG TOGGLE -------- */
var NOTIF_DEBUG = true; // set false to silence logs
function dlog() {
  if (!NOTIF_DEBUG) return;
  var args = Array.prototype.slice.call(arguments);
  try { console.log.apply(console, ["[Notif]", new Date().toISOString()].concat(args)); }
  catch(e){ /* old consoles */ }
}

/* -------- POLYFILL FOR OLD FIREFOX -------- */
if (typeof CSS === "undefined" || typeof CSS.escape !== "function") {
  window.CSS = window.CSS || {};
  CSS.escape = function (value) {
    return value.replace(/[^a-zA-Z0-9_\-]/g, "\\$&");
  };
}

/* -------- Utils -------- */
function byId(id){ return document.getElementById(id); }
function qSel(s){ return document.querySelector(s); }
function qAll(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); }

/* -------- Checkbox Label Helper -------- */
function getCheckboxLabel(checkbox){
  if (checkbox.dataset && checkbox.dataset.label) return checkbox.dataset.label;

  if (checkbox.nextElementSibling && checkbox.nextElementSibling.textContent) {
    var t = checkbox.nextElementSibling.textContent.trim();
    if (t) return t;
  }

  var parentLbl = checkbox.closest("label");
  if (parentLbl) {
    var sp = parentLbl.querySelector("span");
    if (sp) return sp.textContent.trim();

    var clone = parentLbl.cloneNode(true);
    var input = clone.querySelector("input[type='checkbox']");
    if (input) input.remove();
    var text = clone.textContent.trim();
    if (text) return text;
  }

  if (checkbox.nextSibling && checkbox.nextSibling.nodeType === 3) {
    var txt2 = checkbox.nextSibling.textContent.trim();
    if (txt2) return txt2;
  }

  return "";
}

/* ================= Notification Area ================= */

function getChipEditor(){ return byId("formId:chipInput"); }
function getChipsContainer(){ return byId("chipsContainer"); }
function getNotifPopup(){ return byId("notifPopup"); }

/* Stable model (source of truth) for notifications */
var notifLabels = [];                 // array of labels in order selected
var notifNodesByLabel = Object.create(null); // label -> DOM node
var notifVisibleCount = 0;            // current visible chips count (chunked)

/* Position popup under input */
function positionNotifPopup(){
  var popup = getNotifPopup();
  var wrapper = byId("formId:chipInputWrapper");
  if (!popup || !wrapper) return;

  var r = wrapper.getBoundingClientRect();
  popup.style.top = (r.bottom + 4) + "px";
  popup.style.left = r.left + "px";
  popup.style.width = r.width + "px";
  dlog("positionNotifPopup", { top: popup.style.top, left: popup.style.left, width: popup.style.width });
}

/* Show popup */
function openCustomNotifPopup(){
  var p = getNotifPopup();
  if (!p) return;
  positionNotifPopup();
  p.style.display = "block";
}

/* Close popup when clicking outside */
document.addEventListener("mousedown", function(e){
  var p = getNotifPopup();
  var input = getChipEditor();
  if (!p || !input) return;
  if (!p.contains(e.target) && !input.contains(e.target)) p.style.display = "none";
});

/* Backspace removes last chip if editor empty */
function handleChipBackspace(e){
  var input = e.target;
  if (e.key === "Backspace" && !input.value) {
    if (notifLabels.length) {
      var last = notifLabels[notifLabels.length - 1];
      removeChip(last);
      e.preventDefault();
    }
  }
}

/* Render suggestion list from server JSON */
function onFetchNotifSuggestionsComplete(event, jsonData){
  var results = [];
  try { results = typeof jsonData === "string" ? JSON.parse(jsonData) : jsonData; }
  catch(e){ results = []; }
  renderNotifSuggestions(results);
}

function renderNotifSuggestions(results){
  var popup = getNotifPopup();
  var list = byId("notifList");
  if (!popup || !list) return;

  while (list.firstChild) list.removeChild(list.firstChild);

  if (!results.length) {
    var d = document.createElement("div");
    d.textContent = "No results found";
    d.style.padding="8px"; d.style.color="#6b7280";
    list.appendChild(d);
  } else {
    results.forEach(function(txt){
      var row=document.createElement("div");
      row.className="notif-row";

      var cb=document.createElement("input");
      cb.type="checkbox";
      cb.checked = chipExists(txt); // derived from model
      cb.dataset.label = txt;
      cb.addEventListener("change",function(){
        if (cb.checked) addChip(txt); else removeChip(txt);
      });

      var lbl=document.createElement("span");
      lbl.textContent=txt;
      lbl.style.marginLeft="8px";

      row.appendChild(cb);
      row.appendChild(lbl);
      list.appendChild(row);
    });
  }

  positionNotifPopup();
  popup.style.display="block";
}

/* Select/Clear all notifications */
function selectAllNotifications(e){
  if (e){ e.stopPropagation(); e.preventDefault(); }
  var p = getNotifPopup(); if (!p) return;
  qAll(".notif-row input[type='checkbox']").forEach(function(cb){
    if (!cb.checked){ cb.checked = true; cb.dispatchEvent(new Event("change")); }
  });
}

function clearAllNotifications(e){
  if (e){ e.stopPropagation(); e.preventDefault(); }
  var p = getNotifPopup(); if (!p) return;
  qAll(".notif-row input[type='checkbox']").forEach(function(cb){
    if (cb.checked){ cb.checked = false; cb.dispatchEvent(new Event("change")); }
  });
}

/* ================= Chip Core (Notifications) ================= */

var ABSOLUTE_MAX_CHIPS = 50;
function chipCount(){ return notifLabels.length; } // from model
function chipExists(l){ return Object.prototype.hasOwnProperty.call(notifNodesByLabel, l); }

function getVisibleNotifChipLimit(){
  var c = getChipsContainer();
  if (!c) return 5;
  var v = c.getAttribute("data-visible-chips");
  v = v ? parseInt(v,10) : 5;
  return isNaN(v) ? 5 : v;
}

/* Create a chip DOM node for a label */
function createNotifChipNode(label){
  var chip=document.createElement("span");
  chip.className="chip"; chip.dataset.label=label;

  var t=document.createElement("span");
  t.className="chip-text"; t.title=label; t.textContent=label;

  var x=document.createElement("button");
  x.type="button"; x.className="chip-remove"; x.textContent="×";
  x.onclick=function(e){ e.stopPropagation(); e.preventDefault(); removeChip(label); };

  chip.appendChild(t);
  chip.appendChild(x);
  return chip;
}

/* Add chip (model-first, DOM-second) */
function addChip(label){
  if (!label) return;
  if (chipExists(label)) { dlog("addChip: already exists", label); return; }
  if (chipCount()>=ABSOLUTE_MAX_CHIPS) { dlog("addChip: max reached"); return; }

  notifLabels.push(label);
  notifNodesByLabel[label] = createNotifChipNode(label);

  var c = getChipsContainer();
  c.appendChild(notifNodesByLabel[label]);

  if (typeof toggleNotif==="function") toggleNotif(label,true);

  dlog("addChip", { total: chipCount(), last: label, labels: notifLabels.slice(0) });
  updateChipCounter();
  renderNotifChips(true);  // reset to first chunk after change
  positionNotifPopup();
}

/* Remove chip (model-first, DOM-second) */
function removeChip(label){
  if (!chipExists(label)) { dlog("removeChip: not present", label); return; }

  // remove from model
  var i = notifLabels.indexOf(label);
  if (i > -1) notifLabels.splice(i,1);

  // remove DOM node
  var node = notifNodesByLabel[label];
  if (node && node.parentNode) node.parentNode.removeChild(node);
  delete notifNodesByLabel[label];

  // uncheck popup checkbox if open
  var p=getNotifPopup();
  if (p){
    qAll(".notif-row input[type='checkbox']").forEach(function(cb){
      if (cb.dataset.label===label && cb.checked) cb.checked=false;
    });
  }

  if (typeof toggleNotif==="function") toggleNotif(label,false);

  dlog("removeChip", { total: chipCount(), removed: label, labels: notifLabels.slice(0) });
  updateChipCounter();
  renderNotifChips(true); // reset chunk after change
  positionNotifPopup();
}

function updateChipCounter(){
  var c=byId("chipCounter");
  if (c) c.textContent = chipCount()+"/"+ABSOLUTE_MAX_CHIPS;
}

/* ---- Chunk-Reveal Notification Chips (no deletion) ---- */
function renderNotifChips(reset){
  var container = getChipsContainer();
  if (!container) return;

  var total = notifLabels.length;
  var chunk = getVisibleNotifChipLimit();

  if (reset) notifVisibleCount = chunk;
  if (!notifVisibleCount) notifVisibleCount = chunk;

  var visible = Math.min(notifVisibleCount, total);

  // Remove existing "+more"/"Show less" only (keep chips)
  qAll("#"+container.id+" .chip-more").forEach(function(n){
    if (n.parentNode) n.parentNode.removeChild(n);
  });

  // Ensure chips exist in DOM and in correct order; toggle visibility
  for (var idx = 0; idx < total; idx++) {
    var label = notifLabels[idx];
    var node = notifNodesByLabel[label];
    if (!node) {
      // Re-create if somehow missing
      node = createNotifChipNode(label);
      notifNodesByLabel[label] = node;
    }
    // Move node to match order (appendChild moves existing nodes)
    container.appendChild(node);
    node.style.display = (idx < visible) ? "" : "none";
  }

  var hidden = Math.max(total - visible, 0);

  dlog("renderNotifChips", {
    total: total, visible: visible, hidden: hidden, chunk: chunk,
    labels: notifLabels.slice(0)
  });

  // Add controller chip
  if (hidden > 0){
    var more=document.createElement("span");
    more.className="chip chip-more";
    more.textContent="+"+hidden+" more";
    more.title="Click to show more";
    more.onclick=function(){
      notifVisibleCount = Math.min(notifVisibleCount+chunk, total);
      renderNotifChips(); // no reset
      positionNotifPopup();
    };
    container.appendChild(more);
  } else if (total > chunk){
    var less=document.createElement("span");
    less.className="chip chip-more";
    less.textContent="Show less";
    less.title="Collapse";
    less.onclick=function(){
      notifVisibleCount = chunk;
      renderNotifChips(true);
      positionNotifPopup();
    };
    container.appendChild(less);
  }
}

/* Auto relocate popup when chip area resizes (modern browsers) */
(function(){
  var wrap = null;
  function observe() {
    var editor = getChipEditor();
    wrap = editor ? editor.parentNode : null;
    if (typeof ResizeObserver === "function" && wrap) {
      var ro = new ResizeObserver(function(){
        positionNotifPopup();
      });
      ro.observe(wrap);
      dlog("ResizeObserver attached");
    } else {
      // Fallback: frequent but light reposition checks
      var ticking = false;
      function onTick(){
        ticking = false;
        positionNotifPopup();
      }
      window.addEventListener("resize", function(){
        if (!ticking){ ticking = true; setTimeout(onTick, 50); }
      });
      dlog("ResizeObserver not available; using window.resize fallback");
    }
  }
  // Delay to ensure DOM is ready
  setTimeout(observe, 300);
})();

/* ================= DROPDOWN MULTI-SELECT (unchanged) ================= */

function removeDropdownChip(btn,e){
  e.stopPropagation();
  var chip=btn.closest(".dropdown-chip");
  var label=chip.dataset.value;
  var dd=chip.closest(".rich-dropdown");
  var boxes=dd.querySelectorAll(".dropdown-list input[type='checkbox']");
  var labelText=dd.querySelector(".label-text");

  Array.prototype.slice.call(boxes).forEach(function(cb){
    if (getCheckboxLabel(cb)===label){
      cb.checked=false;
      cb.dispatchEvent(new Event("change",{bubbles:true}));
    }
  });
  updateDropdownChips(dd,boxes,labelText);
}

function expandDropdownChips(btn,e){
  e.stopPropagation();
  var dd=btn.closest(".rich-dropdown");
  var labelText=dd.querySelector(".label-text");
  var boxes=dd.querySelectorAll(".dropdown-list input[type='checkbox']");
  var sel=Array.prototype.slice.call(boxes).filter(function(c){return c.checked;})
        .map(function(c){return getCheckboxLabel(c);}).filter(Boolean);

  var current=parseInt(labelText.dataset.visibleCount||5,10);
  current=Math.min(current+5, sel.length);
  labelText.dataset.visibleCount=current;

  labelText.innerHTML = sel.slice(0,current).map(function(lbl){
    return '<span class="dropdown-chip" data-value="'+lbl+'" title="'+lbl+'">'+
           '<span class="dropdown-chip-text">'+lbl+'</span>'+
           '<button type="button" class="dropdown-chip-remove" onclick="removeDropdownChip(this,event)">×</button>'+
           '</span>';
  }).join("");

  if (current<sel.length){
    var rem=sel.length-current;
    labelText.innerHTML += '<span class="dropdown-chip dropdown-chip-more" onclick="expandDropdownChips(this,event)" title="+'+rem+' more">+'+rem+' more</span>';
  }
}

function updateDropdownChips(dd,boxes,labelText){
  var sel=Array.prototype.slice.call(boxes).filter(function(c){return c.checked;})
        .map(function(c){return getCheckboxLabel(c);}).filter(Boolean);

  var id=dd.getAttribute("data-dropdown-id");
  var c=byId(id+"Counter");
  if (c) c.textContent = sel.length+"/"+boxes.length;

  if (!sel.length){
    labelText.textContent = labelText.getAttribute("data-default") || "Select";
    labelText.dataset.visibleCount = 5;
    return;
  }

  var max=5;
  labelText.dataset.visibleCount=max;

  labelText.innerHTML = sel.slice(0,max).map(function(lbl){
    return '<span class="dropdown-chip" data-value="'+lbl+'" title="'+lbl+'">'+
           '<span class="dropdown-chip-text">'+lbl+'</span>'+
           '<button type="button" class="dropdown-chip-remove" onclick="removeDropdownChip(this,event)">×</button>'+
           '</span>';
  }).join("");

  if (sel.length>max){
    var rem=sel.length-max;
    labelText.innerHTML += '<span class="dropdown-chip dropdown-chip-more" onclick="expandDropdownChips(this,event)" title="+'+rem+' more">+'+rem+' more</span>';
  }
}

function selectAll(btn,flag){
  var dd=btn.closest(".rich-dropdown");
  var boxes=dd.querySelectorAll(".dropdown-list input[type='checkbox']");
  var label=dd.querySelector(".label-text");

  Array.prototype.slice.call(boxes).forEach(function(cb){
    cb.checked = flag;
    cb.dispatchEvent(new Event("change",{bubbles:true}));
  });
  updateDropdownChips(dd,boxes,label);
}

function initializeCustomDropdowns(){
  var dds=qAll(".rich-dropdown");

  dds.forEach(function(dd){
    var lbl=dd.querySelector(".rich-dropdown-label");
    if (!lbl || lbl._bound) return;
    lbl._bound=true;

    lbl.addEventListener("click",function(e){
      if (e.target.classList.contains("dropdown-chip-remove") ||
          e.target.classList.contains("dropdown-chip-more")){
        e.stopPropagation(); return;
      }
      e.stopPropagation();
      dds.forEach(function(o){ if (o!==dd) o.classList.remove("open"); });
      dd.classList.toggle("open");
    });

    var boxes=dd.querySelectorAll(".dropdown-list input[type='checkbox']");
    var labelText=dd.querySelector(".label-text");

    Array.prototype.slice.call(boxes).forEach(function(cb){
      var t=getCheckboxLabel(cb);
      if (t) cb.dataset.label=t;
      cb.addEventListener("change",function(){
        updateDropdownChips(dd,boxes,labelText);
      });
    });

    updateDropdownChips(dd,boxes,labelText);
  });

  document.addEventListener("click",function(e){
    if (!e.target.closest(".rich-dropdown")){
      qAll(".rich-dropdown").forEach(function(dd){ dd.classList.remove("open"); });
    }
  });
}

/* Persist selected dropdown values before submit */
function prepareFormSubmit(){
  var map={
    "eventCodes":"formId:selectedEventCodes",
    "pickupType":"formId:selectedPickupTypes"
  };

  ["eventCodes","pickupType"].forEach(function(id){
    var dd=qSel("[data-dropdown-id='"+id+"']");
    if (!dd) return;

    var vals=Array.prototype.slice.call(
      dd.querySelectorAll(".dropdown-list input[type='checkbox']:checked")
    ).map(function(cb){ return getCheckboxLabel(cb); }).filter(Boolean);

    var hf=byId(map[id]);
    if (hf) hf.value = vals.join(",");
  });

  return true;
}

/* Init */
window.addEventListener("load",function(){
  initializeCustomDropdowns();
  updateChipCounter();
  renderNotifChips(true);
});

window.addEventListener("resize",function(){
  var p=getNotifPopup();
  if (p && p.style.display==="block") positionNotifPopup();
});
