/* ============ dropdowns.js ============ */

// Dropdown initialization
function initializeCustomDropdowns() {
    const dropdowns = document.querySelectorAll('.rich-dropdown:not([data-skip-init="true"])');

    dropdowns.forEach(dropdown => {
        const label = dropdown.querySelector('.rich-dropdown-label');
        const labelText = dropdown.querySelector('.label-text');
        const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]');
        if (!label) return;

        label.addEventListener('click', e => {
            e.stopPropagation();
            dropdowns.forEach(d => { if (d !== dropdown) d.classList.remove('open'); });
            dropdown.classList.toggle('open');
        });

        checkboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                const selected = Array.from(checkboxes)
                    .filter(c => c.checked)
                    .map(c => (c.dataset.label || (c.nextElementSibling ? c.nextElementSibling.textContent.trim() : '')));
                labelText.textContent = selected.length ? selected.join(', ') : labelText.dataset.default;
            });
        });
    });

    document.addEventListener('click', e => {
        if (!e.target.closest('.rich-dropdown')) {
            dropdowns.forEach(d => d.classList.remove('open'));
        }
    });
}

// Select-all helpers
function selectAll(button, selectAll) {
    const dropdown = button.closest('.rich-dropdown');
    const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]');
    const labelText = dropdown.querySelector('.label-text');
    checkboxes.forEach(cb => {
        cb.checked = selectAll;
        cb.dispatchEvent(new Event("change"));
    });
    const selected = selectAll ? Array.from(checkboxes).map(c =>
        c.dataset.label || (c.nextElementSibling ? c.nextElementSibling.textContent.trim() : '')
    ) : [];
    labelText.textContent = selected.length ? selected.join(', ') : labelText.dataset.default;
}

/* -------- Notification helpers -------- */

function autoGrow(ta) {
  if (!ta) return;
  ta.style.height = "auto";
  ta.style.height = ta.scrollHeight + "px";
}

function getNotifInput() {
  return document.querySelector('[id$="notificationInput"]');
}
function getNotifPopup() {
  return document.querySelector('[id$="notificationSuggestion:list"]');
}

/* Show popup while typing */
function openSuggestionBoxForInput(inputEl) {
  const popup = getNotifPopup();
  if (popup) popup.style.display = "block";
  autoGrow(inputEl);
}

/* Close on outside click (and don’t close when clicking inside) */
function bindOutsideCloser() {
  document.addEventListener('mousedown', outsideCloser, { capture: true });
}
function outsideCloser(e) {
  const input = getNotifInput();
  const popup = getNotifPopup();
  if (!input || !popup) return;

  const inside = input.contains(e.target) || popup.contains(e.target);
  if (!inside) popup.style.display = "none";
}

/* Keep clicks inside popup from bubbling to the document */
function stopPopupPropagation() {
  const popup = getNotifPopup();
  if (popup) popup.addEventListener('mousedown', function(ev){ ev.stopPropagation(); });
}

/* Rebind after RichFaces partial updates */
function rebindAfterAjax() {
  const input = getNotifInput();
  if (input) autoGrow(input);
  stopPopupPropagation();
}

window.addEventListener('load', () => {
  const input = getNotifInput();
  if (input) autoGrow(input);
  bindOutsideCloser();
  stopPopupPropagation();
});

function positionNotifPopup() {
    const input = document.getElementById('formId:notificationInput');
    const popup = document.getElementById('formId:notificationSuggestion');

    if (!input || !popup) return;

    // Anchor position directly under textarea
    const rect = input.getBoundingClientRect();
    popup.style.position = "absolute";
    popup.style.top = (window.scrollY + rect.bottom + 2) + "px";
    popup.style.left = (window.scrollX + rect.left) + "px";
    popup.style.width = rect.width + "px";

    popup.style.display = "block";

    bindOutsideClickForNotifPopup();
}

function bindOutsideClickForNotifPopup() {
    document.addEventListener("mousedown", closeNotifPopupOnOutside);
}

function closeNotifPopupOnOutside(e) {
    const popup = document.getElementById('formId:notificationSuggestion');
    const input = document.getElementById('formId:notificationInput');

    if (!popup || !input) return;

    if (!popup.contains(e.target) && !input.contains(e.target)) {
        popup.style.display = "none";
        document.removeEventListener("mousedown", closeNotifPopupOnOutside);
    }
}
if (window.A4J && A4J.AJAX) {
    A4J.AJAX.AddListener({
        oncomplete: function() {
            positionNotifPopup(); // ✅ Keeps popup aligned after checkbox click
        }
    });
}

if (window.A4J && A4J.AJAX) {
  A4J.AJAX.AddListener({ oncomplete: rebindAfterAjax });
}

// Reinitialize after full load or RichFaces partial update
window.addEventListener('load', () => initializeCustomDropdowns());
if (window.A4J && A4J.AJAX) {
    A4J.AJAX.AddListener({
        oncomplete: () => initializeCustomDropdowns()
    });
}