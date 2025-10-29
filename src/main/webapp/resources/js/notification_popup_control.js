/* ===========================================================
   NOTIFICATION POPUP CONTROL - Minimal Production Version
=========================================================== */

/* ======= Initialize on page load ======= */
window.addEventListener('DOMContentLoaded', function() {
  console.log('Notification control initialized');
  
  // Capture clicks inside popup to prevent RichFaces from closing it
  document.addEventListener('click', function(e) {
    const popup = document.querySelector('[id$="notificationSuggestion:list"]');
    if (popup && popup.contains(e.target)) {
      // Only stop propagation for non-button clicks
      if (!e.target.closest('button')) {
        e.stopPropagation();
      }
    }
  }, true);
  
  // Rebuild chips from backend state after page load
  rebuildChipsFromBackend();
});

/* ======= Rebuild chips from checked checkboxes ======= */
function rebuildChipsFromBackend() {
  console.log('Rebuilding chips from backend state...');
  
  // Find all checked notification checkboxes
  const checkedBoxes = document.querySelectorAll('.notification-checkbox:checked');
  console.log('Found ' + checkedBoxes.length + ' checked items');
  
  // Clear existing chips first
  const container = document.getElementById('chipsContainer');
  if (container) {
    container.innerHTML = '';
  }
  
  // Rebuild chip for each checked box
  checkedBoxes.forEach(function(cb) {
    const label = getCheckboxLabel(cb);
    if (label) {
      addNotificationChip(label);
    }
  });
  
  updateChipCounter();
  console.log('Chips rebuilt');
}

/* ======= Listen for Ajax updates ======= */
if (typeof A4J !== 'undefined' && A4J.AJAX) {
  A4J.AJAX.AddListener({
    oncomplete: function() {
      console.log('Ajax complete - rebuilding chips');
      // Rebuild chips after any Ajax update
      setTimeout(function() {
        rebuildChipsFromBackend();
      }, 100);
    }
  });
}

/* ======= Checkbox toggle handler ======= */
function onSuggestionToggle(checkbox, label) {
  console.log('Toggle:', label, checkbox.checked);
  
  // Add/remove chip
  if (checkbox.checked) {
    addNotificationChip(label);
  } else {
    removeNotificationChip(label);
  }
  
  // Clear input after selection
  const input = document.getElementById('formId:chipInput');
  if (input) {
    input.value = '';
  }
  
  // Keep popup open
  setTimeout(function() {
    const popup = document.querySelector('[id$="notificationSuggestion:list"]');
    if (popup) {
      popup.style.display = 'block';
      if (input) input.focus();
    }
  }, 50);
}

/* ======= Add chip ======= */
function addNotificationChip(label) {
  if (!label) return;
  
  const container = document.getElementById('chipsContainer');
  if (!container) return;
  
  // Check if already exists
  const exists = container.querySelector('[data-label="' + label.replace(/"/g, '&quot;') + '"]');
  if (exists) return;
  
  // Create chip
  const chip = document.createElement('span');
  chip.className = 'chip';
  chip.setAttribute('data-label', label);
  chip.innerHTML = '<span class="chip-text">' + escapeHtml(label) + '</span>' +
                   '<button type="button" class="chip-remove" onclick="removeNotificationChip(\'' + 
                   label.replace(/'/g, "\\'") + '\'); return false;">×</button>';
  
  container.appendChild(chip);
  
  // Sync to backend
  if (typeof rfToggleNotif !== 'undefined') {
    rfToggleNotif(label, true);
  }
  
  updateChipCounter();
}

/* ======= Remove chip ======= */
function removeNotificationChip(label) {
  if (!label) return;
  
  const container = document.getElementById('chipsContainer');
  if (!container) return;
  
  const chip = container.querySelector('[data-label="' + label.replace(/"/g, '&quot;') + '"]');
  if (chip) {
    chip.remove();
  }
  
  // Uncheck checkbox if in popup
  const checkboxes = document.querySelectorAll('.notification-checkbox');
  checkboxes.forEach(function(cb) {
    const cbLabel = getCheckboxLabel(cb);
    if (cbLabel === label) {
      cb.checked = false;
    }
  });
  
  // Sync to backend
  if (typeof rfToggleNotif !== 'undefined') {
    rfToggleNotif(label, false);
  }
  
  updateChipCounter();
}

/* ======= Get label from checkbox ======= */
function getCheckboxLabel(checkbox) {
  const next = checkbox.nextElementSibling;
  if (!next) return '';
  
  if (next.nodeType === Node.TEXT_NODE) {
    return next.textContent.trim();
  } else if (next.tagName === 'SPAN') {
    return next.textContent.trim();
  }
  return next.textContent ? next.textContent.trim() : '';
}

/* ======= Select All ======= */
function selectAllNotifications(event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  
  console.log('=== SELECT ALL ===');
  
  const checkboxes = document.querySelectorAll('.notification-checkbox');
  if (!checkboxes.length) {
    console.log('No checkboxes found');
    return false;
  }
  
  const currentCount = document.querySelectorAll('#chipsContainer .chip').length;
  if (currentCount >= 50) {
    alert('Maximum 50 selections allowed');
    return false;
  }
  
  let selected = 0;
  checkboxes.forEach(function(cb) {
    if (!cb.checked) {
      const label = getCheckboxLabel(cb);
      if (label) {
        cb.checked = true;
        addNotificationChip(label);
        selected++;
      }
    }
  });
  
  console.log('Selected ' + selected + ' items');
  
  // Clear input and keep popup open
  const input = document.getElementById('formId:chipInput');
  if (input) {
    input.value = '';
    input.focus();
  }
  
  setTimeout(function() {
    const popup = document.querySelector('[id$="notificationSuggestion:list"]');
    if (popup) popup.style.display = 'block';
  }, 50);
  
  return false;
}

/* ======= Clear All ======= */
function clearAllNotifications(event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  
  console.log('=== CLEAR ALL ===');
  
  const checkboxes = document.querySelectorAll('.notification-checkbox');
  let cleared = 0;
  
  checkboxes.forEach(function(cb) {
    if (cb.checked) {
      const label = getCheckboxLabel(cb);
      if (label) {
        cb.checked = false;
        removeNotificationChip(label);
        cleared++;
      }
    }
  });
  
  // Also remove any orphaned chips
  const allChips = document.querySelectorAll('#chipsContainer .chip');
  allChips.forEach(function(chip) {
    chip.remove();
  });
  
  console.log('Cleared ' + cleared + ' items');
  
  updateChipCounter();
  
  // Clear input and keep popup open
  const input = document.getElementById('formId:chipInput');
  if (input) {
    input.value = '';
    input.focus();
  }
  
  setTimeout(function() {
    const popup = document.querySelector('[id$="notificationSuggestion:list"]');
    if (popup) popup.style.display = 'block';
  }, 50);
  
  return false;
}

/* ======= Update chip counter ======= */
function updateChipCounter() {
  const counter = document.getElementById('chipCounter');
  const chips = document.querySelectorAll('#chipsContainer .chip');
  if (counter) {
    counter.textContent = chips.length + '/50';
  }
}

/* ======= Escape HTML ======= */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
