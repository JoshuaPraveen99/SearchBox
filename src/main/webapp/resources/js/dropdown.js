/* ===========================================================
   dropdown.js — RF friendly custom dropdown + chips
   Works: JSF 1.2 + RichFaces 3.3.3 + Chrome + Firefox + Edge
   ES5 Compatible - No Arrow Functions
=========================================================== */

/* -------- POLYFILL -------- */
if (typeof CSS === "undefined" || typeof CSS.escape !== "function") {
  window.CSS = window.CSS || {};
  CSS.escape = function(value) {
    return String(value).replace(/[^a-zA-Z0-9_\-]/g, "\\$&");
  };
}

/* -------- Utils -------- */
function byId(id) { return document.getElementById(id); }
function qSel(s) { return document.querySelector(s); }
function qAll(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }

/* -------- Retrieve Checkbox Label -------- */
function getCheckboxLabel(checkbox) {
  if (checkbox && checkbox.dataset && checkbox.dataset.label) return checkbox.dataset.label;

  if (checkbox && checkbox.nextElementSibling && checkbox.nextElementSibling.textContent) {
    var t = checkbox.nextElementSibling.textContent.trim();
    if (t) return t;
  }

  var parentLbl = checkbox ? checkbox.closest("label") : null;
  if (parentLbl) {
    var sp = parentLbl.querySelector("span");
    if (sp) return sp.textContent.trim();

    var clone = parentLbl.cloneNode(true);
    var input = clone.querySelector("input[type='checkbox']");
    if (input) input.remove();
    var txt = clone.textContent.trim();
    if (txt) return txt;
  }

  if (checkbox && checkbox.nextSibling && checkbox.nextSibling.nodeType === 3) {
    var txt2 = checkbox.nextSibling.textContent.trim();
    if (txt2) return txt2;
  }
  return "";
}

/* ============== NOTIFICATIONS ============== */

function getChipEditor(){ return byId("formId:chipInput"); }
function getChipsContainer(){ return byId("chipsContainer"); }
function getNotifPopup(){ return byId("notifPopup"); }

/* Source-of-truth (rebuilt from DOM when needed) */
var notifLabels = [];
var notifNodesByLabel = {};
var notifVisibleCount = 0;

/* ----- Counters: Option D (hide all) ----- */
function hideAllCounters() {
  var ids = ["eventCodesCounter","pickupTypeCounter","chipCounter"];
  for (var i=0;i<ids.length;i++){
    var el = byId(ids[i]);
    if (el) el.style.display = "none";
  }
}

/* ----- Robust helpers for notification model ----- */
function hydrateNotifModelFromDOM() {
  var container = getChipsContainer();
  if (!container) return;
  var domChips = container.querySelectorAll(".chip[data-label]");
  notifLabels = [];
  notifNodesByLabel = {};
  for (var i=0;i<domChips.length;i++){
    var node = domChips[i];
    var label = node.dataset ? node.dataset.label : node.getAttribute("data-label");
    if (!label) continue;
    notifLabels.push(label);
    notifNodesByLabel[label] = node;
  }
}

function ensureNotifModelFresh() {
  var container = getChipsContainer();
  if (!container) return;
  var domCount = container.querySelectorAll(".chip[data-label]").length;
  if (domCount !== notifLabels.length) hydrateNotifModelFromDOM();
}

/* Position popup under input */
function positionNotifPopup(){
  var popup = getNotifPopup();
  var wrapper = byId("formId:chipInputWrapper");
  if (!popup || !wrapper) return;
  var r = wrapper.getBoundingClientRect();
  popup.style.top = (r.bottom + 4) + "px";
  popup.style.left = r.left + "px";
  popup.style.width = r.width + "px";
}

function openCustomNotifPopup(){
  var p = getNotifPopup();
  if (!p) return;
  positionNotifPopup();
  p.style.display = "block";
}

document.addEventListener("mousedown", function(e){
  var p = getNotifPopup();
  var input = getChipEditor();
  if (!p || !input) return;
  if (!p.contains(e.target) && !input.contains(e.target)) p.style.display = "none";
});

function handleChipBackspace(e){
  var input = e.target;
  if (e.key === "Backspace" && !input.value) {
    ensureNotifModelFresh();
    if (notifLabels.length) {
      var last = notifLabels[notifLabels.length - 1];
      removeChip(last);
      e.preventDefault();
    }
  }
}

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
    ensureNotifModelFresh();
    for (var i=0;i<results.length;i++){
      var txt = results[i];

      var row=document.createElement("div");
      row.className="notif-row";

      var cb=document.createElement("input");
      cb.type="checkbox";
      cb.checked = !!notifNodesByLabel[txt];
      cb.dataset.label = txt;
      cb.addEventListener("change", (function(value){
        return function(){
          if (this.checked) addChip(value); else removeChip(value);
        };
      })(txt));

      var lbl=document.createElement("span");
      lbl.textContent=txt;
      lbl.style.marginLeft="8px";

      row.appendChild(cb); row.appendChild(lbl);
      list.appendChild(row);
    }
  }
  positionNotifPopup();
  popup.style.display="block";
}

function selectAllNotifications(e){
  if (e){ e.stopPropagation(); e.preventDefault(); }
  var p=getNotifPopup(); if (!p) return;
  var boxes = p.querySelectorAll(".notif-row input[type='checkbox']");
  for (var i=0;i<boxes.length;i++){
    var cb = boxes[i];
    if (!cb.checked){ cb.checked = true; cb.dispatchEvent(new Event("change")); }
  }
}

function clearAllNotifications(e){
  if (e){ e.stopPropagation(); e.preventDefault(); }
  var p=getNotifPopup(); if (!p) return;
  var boxes = p.querySelectorAll(".notif-row input[type='checkbox']");
  for (var i=0;i<boxes.length;i++){
    var cb = boxes[i];
    if (cb.checked){ cb.checked = false; cb.dispatchEvent(new Event("change")); }
  }
}

/* ---- Chips ---- */

var ABSOLUTE_MAX_CHIPS = 50;

function createNotifChipNode(label){
  var chip=document.createElement("span");
  chip.className="chip"; chip.dataset.label=label;

  var t=document.createElement("span");
  t.className="chip-text"; t.title=label; t.textContent=label;

  var x=document.createElement("button");
  x.type="button"; x.className="chip-remove"; x.textContent="×";
  x.onclick=function(e){ e.stopPropagation(); e.preventDefault(); removeChip(label); };

  chip.appendChild(t); chip.appendChild(x);
  return chip;
}

function addChip(label){
  if (!label) return;
  ensureNotifModelFresh();
  if (notifNodesByLabel[label]) return;
  if (notifLabels.length>=ABSOLUTE_MAX_CHIPS) return;

  var node = createNotifChipNode(label);
  notifLabels.push(label);
  notifNodesByLabel[label] = node;

  var container = getChipsContainer();
  if (container) container.appendChild(node);

  if (typeof toggleNotif==="function") toggleNotif(label,true);

  renderNotifChips(true);
  positionNotifPopup();
}

function removeChip(label){
  if (!label) return;
  ensureNotifModelFresh();

  var node = notifNodesByLabel[label];
  if (!node) {
    var container = getChipsContainer();
    if (container) {
      var sel = '.chip[data-label="' + CSS.escape(label) + '"]';
      node = container.querySelector(sel);
    }
  }

  if (node && node.parentNode) node.parentNode.removeChild(node);

  if (notifNodesByLabel[label]) delete notifNodesByLabel[label];
  var idx = notifLabels.indexOf(label);
  if (idx > -1) notifLabels.splice(idx,1);

  var p=getNotifPopup();
  if (p){
    var boxes = p.querySelectorAll('.notif-row input[type="checkbox"]');
    for (var i=0;i<boxes.length;i++){
      var cb = boxes[i];
      if (cb.dataset.label===label && cb.checked) cb.checked=false;
    }
  }

  if (typeof toggleNotif==="function") toggleNotif(label,false);

  renderNotifChips(true);
  positionNotifPopup();
}

/* ---- Chunk show + collapse ---- */
function renderNotifChips(reset){
  var container = getChipsContainer();
  if (!container) return;

  ensureNotifModelFresh();

  var total = notifLabels.length;
  var chunk = 5;
  if (reset) notifVisibleCount = chunk;
  if (!notifVisibleCount) notifVisibleCount = chunk;

  var visible = Math.min(notifVisibleCount, total);

  var oldControls = container.querySelectorAll(".chip-more");
  for (var k=0;k<oldControls.length;k++){
    var ctrl = oldControls[k];
    if (ctrl.parentNode) ctrl.parentNode.removeChild(ctrl);
  }

  for (var i=0;i<total;i++){
    var lbl = notifLabels[i];
    var node = notifNodesByLabel[lbl] || createNotifChipNode(lbl);
    notifNodesByLabel[lbl] = node;
    container.appendChild(node); // move to correct order
    node.style.display = (i < visible) ? "" : "none";
  }

  var hidden = total - visible;

  if (hidden > 0){
    var more=document.createElement("span");
    more.className="chip chip-more";
    more.textContent="+"+hidden+" more";
    more.style.cursor = "pointer";
    more.onclick=function(){
      notifVisibleCount = Math.min(notifVisibleCount+chunk, total);
      renderNotifChips(); // no reset
      positionNotifPopup();
    };
    container.appendChild(more);

    if (notifVisibleCount > chunk){
      var collapse=document.createElement("span");
      collapse.className="chip chip-more";
      collapse.textContent="Collapse";
      collapse.style.cursor = "pointer";
      collapse.onclick=function(){
        notifVisibleCount = chunk;
        renderNotifChips(true);
        positionNotifPopup();
      };
      container.appendChild(collapse);
    }

  } else if (total > chunk){
    var collapse2=document.createElement("span");
    collapse2.className="chip chip-more";
    collapse2.textContent="Collapse";
    collapse2.style.cursor = "pointer";
    collapse2.onclick=function(){
      notifVisibleCount = chunk;
      renderNotifChips(true);
      positionNotifPopup();
    };
    container.appendChild(collapse2);
  }
}

/* --- Container-level event delegation for chip remove (bulletproof) --- */
function attachDelegatedChipRemove(){
  var container = getChipsContainer();
  if (!container) return;
  container.addEventListener("click", function(e){
    var t = e.target || e.srcElement;
    while (t && t !== container){
      if (t.classList && t.classList.contains("chip-remove")){
        var chip = t;
        while (chip && (!chip.classList || !chip.classList.contains("chip"))){
          chip = chip.parentNode;
        }
        if (chip){
          var label = chip.dataset ? chip.dataset.label : chip.getAttribute("data-label");
          if (label) removeChip(label);
        }
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      t = t.parentNode;
    }
  });
}

/* Reposition popup on wrapper resize */
setTimeout(function(){
  var ed = getChipEditor();
  if (ed && typeof ResizeObserver==="function") {
    new ResizeObserver(function(){ positionNotifPopup(); })
      .observe(ed.parentNode);
  }
},300);

/* ============== MULTI-SELECT DROPDOWNS (EventCodes + PickupTypes) ============== */

function removeDropdownChip(btn,event){
  event.stopPropagation();
  var chip=btn.closest(".dropdown-chip");
  var label=chip.dataset.value;
  var dd=chip.closest(".rich-dropdown");
  var boxes=dd.querySelectorAll(".dropdown-list input[type='checkbox']");
  var labelText=dd.querySelector(".label-text");

  for (var i=0;i<boxes.length;i++){
    var cb = boxes[i];
    if (getCheckboxLabel(cb)===label){
      cb.checked=false;
      cb.dispatchEvent(new Event("change",{bubbles:true}));
    }
  }
  updateDropdownChips(dd,boxes,labelText);
}

/* ---- Expand 5 at a time ---- */
function expandDropdownChips(btn,event){
  event.stopPropagation();
  var dd=btn.closest(".rich-dropdown");
  var labelText=dd.querySelector(".label-text");
  var boxes=dd.querySelectorAll(".dropdown-list input[type='checkbox']");

  var selected = [];
  for (var i=0;i<boxes.length;i++){
    var c = boxes[i];
    if (c.checked){
      var t = getCheckboxLabel(c);
      if (t) selected.push(t);
    }
  }

  var chunk = 5;
  var current=parseInt(labelText.dataset.visibleCount||chunk,10);
  current=Math.min(current+chunk, selected.length);
  labelText.dataset.visibleCount=current;

  renderDropdownChips(labelText, selected, current, chunk);
}

/* ---- Collapse dropdown chips ---- */
function collapseDropdownChips(btn,event){
  event.stopPropagation();
  var dd=btn.closest(".rich-dropdown");
  var labelText=dd.querySelector(".label-text");
  labelText.dataset.visibleCount = 5;

  var boxes=dd.querySelectorAll(".dropdown-list input[type='checkbox']");
  updateDropdownChips(dd, boxes, labelText);
}

function renderDropdownChips(labelText, selected, visibleCount, chunk){
  var html = [];
  for (var i=0;i<Math.min(visibleCount, selected.length);i++){
    var lbl = selected[i];
    html.push(
      '<span class="dropdown-chip" data-value="'+lbl+'" title="'+lbl+'">'+
      '<span class="dropdown-chip-text">'+lbl+'</span>'+
      '<button type="button" class="dropdown-chip-remove" onclick="removeDropdownChip(this,event)">×</button>'+
      '</span>'
    );
  }
  var remaining = selected.length - visibleCount;

  if (remaining > 0){
    html.push('<span class="dropdown-chip dropdown-chip-more" onclick="expandDropdownChips(this,event)" style="cursor:pointer;">+'+remaining+' more</span>');
  }

  if (visibleCount > chunk){
    html.push('<span class="dropdown-chip dropdown-chip-more" onclick="collapseDropdownChips(this,event)" style="cursor:pointer;">Collapse</span>');
  }

  labelText.innerHTML = html.join("");
}

/* ---- Update dropdown chips ---- */
function updateDropdownChips(dd,boxes,labelText){
  var selected = [];
  for (var i=0;i<boxes.length;i++){
    var c = boxes[i];
    if (c.checked){
      var t = getCheckboxLabel(c);
      if (t) selected.push(t);
    }
  }

  if (!selected.length){
    labelText.textContent = labelText.getAttribute("data-default") || "Select";
    labelText.dataset.visibleCount = 5;
    return;
  }

  var chunk = 5;
  var visibleCount = parseInt(labelText.dataset.visibleCount||chunk,10);
  visibleCount = Math.min(visibleCount, selected.length);

  renderDropdownChips(labelText, selected, visibleCount, chunk);
}

function selectAll(btn,flag){
  var dd=btn.closest(".rich-dropdown");
  var boxes=dd.querySelectorAll(".dropdown-list input[type='checkbox']");
  var labelText=dd.querySelector(".label-text");

  for (var i=0;i<boxes.length;i++){
    var cb = boxes[i];
    cb.checked = flag;
    cb.dispatchEvent(new Event("change",{bubbles:true}));
  }
  updateDropdownChips(dd,boxes,labelText);
}

/* ---- Init dropdowns ---- */
function initializeCustomDropdowns(){
  var dds=qAll(".rich-dropdown");
  for (var di=0;di<dds.length;di++){
    var dd = dds[di];
    var label=dd.querySelector(".rich-dropdown-label");
    if (!label || label._bound) continue;
    label._bound=true;

    label.addEventListener("click",function(e){
      if (e.target.classList.contains("dropdown-chip-remove") ||
          e.target.classList.contains("dropdown-chip-more")){
        e.stopPropagation(); return;
      }
      e.stopPropagation();
      var all=qAll(".rich-dropdown");
      for (var j=0;j<all.length;j++){ if (all[j] !== dd) all[j].classList.remove("open"); }
      dd.classList.toggle("open");
    });

    var boxes=dd.querySelectorAll(".dropdown-list input[type='checkbox']");
    var labelText=dd.querySelector(".label-text");

    for (var bi=0;bi<boxes.length;bi++){
      var cb = boxes[bi];
      var t = getCheckboxLabel(cb);
      if (t) cb.dataset.label=t;
      cb.addEventListener("change", (function(_dd,_boxes,_labelText){
        return function(){ updateDropdownChips(_dd,_boxes,_labelText); };
      })(dd,boxes,labelText));
    }

    updateDropdownChips(dd,boxes,labelText);
  }

  document.addEventListener("click",function(e){
    if (!e.target.closest || !e.target.closest(".rich-dropdown")){
      var all=qAll(".rich-dropdown");
      for (var j=0;j<all.length;j++){ all[j].classList.remove("open"); }
    }
  });
}

/* ---- Prepare form submit ---- */
function prepareFormSubmit(){
  var map={
    "eventCodes":"formId:selectedEventCodes",
    "pickupType":"formId:selectedPickupTypes"
  };

  var ids=["eventCodes","pickupType"];
  for (var ii=0;ii<ids.length;ii++){
    var id = ids[ii];
    var dd=qSel("[data-dropdown-id='"+id+"']");
    if (!dd) continue;
    var checked = dd.querySelectorAll(".dropdown-list input[type='checkbox']:checked");
    var vals = [];
    for (var ci=0;ci<checked.length;ci++){
      var t = getCheckboxLabel(checked[ci]);
      if (t) vals.push(t);
    }
    var hf=byId(map[id]);
    if (hf) hf.value = vals.join(",");
  }
  return true;
}

/* ---- INIT ---- */
window.addEventListener("load",function(){
  hideAllCounters();                 // Option D
  initializeCustomDropdowns();
  hydrateNotifModelFromDOM();        // rebuild from any pre-rendered chips
  attachDelegatedChipRemove();       // robust remove even after partial updates
  renderNotifChips(true);
});

window.addEventListener("resize",function(){
  var p=getNotifPopup();
  if (p && p.style.display==="block") positionNotifPopup();
});
