/* ===========================================================
   🎯 ALTERNATIVE SIMPLE VERSION - Direct DOM manipulation
   Use this if the complex version isn't working
=========================================================== */

// Simple helper to add Select All / Clear All to suggestion dropdown
function addNotificationControls() {
    console.log('🎯 Adding notification controls...');
    
    // Wait for suggestion box to exist
    const checkAndInit = () => {
        const popup = document.querySelector('[id$="notificationSuggestion:list"]');
        
        if (!popup) {
            console.log('⏳ Waiting for suggestion popup...');
            return;
        }
        
        console.log('✅ Popup found:', popup);
        
        // Check if buttons already exist
        if (popup.querySelector('.simple-controls')) {
            console.log('✅ Controls already exist');
            return;
        }
        
        // Create control buttons
        const controls = document.createElement('div');
        controls.className = 'simple-controls';
        controls.style.cssText = `
            display: flex;
            gap: 6px;
            padding: 8px;
            border-bottom: 1px solid #e5e7eb;
            background: #f9fafb;
            position: sticky;
            top: 0;
            z-index: 10;
        `;
        
        // Select All button
        const selectAllBtn = document.createElement('button');
        selectAllBtn.textContent = 'Select All';
        selectAllBtn.type = 'button';
        selectAllBtn.style.cssText = `
            flex: 1;
            font-size: 11px;
            padding: 4px 8px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
        `;
        
        selectAllBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🎯 Select All clicked (simple version)');
            simpleSelectAll();
        });
        
        // Clear All button
        const clearAllBtn = document.createElement('button');
        clearAllBtn.textContent = 'Clear All';
        clearAllBtn.type = 'button';
        clearAllBtn.style.cssText = `
            flex: 1;
            font-size: 11px;
            padding: 4px 8px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
        `;
        
        clearAllBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🎯 Clear All clicked (simple version)');
            simpleClearAll();
        });
        
        controls.appendChild(selectAllBtn);
        controls.appendChild(clearAllBtn);
        
        // Insert at top of popup
        popup.insertBefore(controls, popup.firstChild);
        console.log('✅ Controls added successfully');
    };
    
    // Try immediately
    checkAndInit();
    
    // Try again after delays (for Ajax loading)
    setTimeout(checkAndInit, 500);
    setTimeout(checkAndInit, 1000);
    setTimeout(checkAndInit, 2000);
}

function simpleSelectAll() {
    console.log('🎯 Simple Select All executing...');
    
    const popup = document.querySelector('[id$="notificationSuggestion:list"]');
    if (!popup) {
        console.error('❌ Popup not found');
        return;
    }
    
    // Find ALL rows (not just checkboxes)
    const rows = Array.from(popup.querySelectorAll('div')).filter(div => {
        // Skip the control buttons row
        if (div.classList.contains('simple-controls') || div.classList.contains('suggestion-actions')) {
            return false;
        }
        // Check if div contains a checkbox
        return div.querySelector('input[type="checkbox"]') !== null;
    });
    
    console.log('Found', rows.length, 'rows');
    
    rows.forEach((row, idx) => {
        const checkbox = row.querySelector('input[type="checkbox"]');
        if (!checkbox) return;
        
        // Get the text content (excluding checkbox)
        const label = extractTextFromRow(row, checkbox);
        console.log(`  Row ${idx}: label="${label}", checked=${checkbox.checked}`);
        
        if (label && !checkbox.checked) {
            checkbox.checked = true;
            
            // Add chip
            if (window.addChip) {
                addChip(label, {silent: false});
            }
            
            // Trigger the checkbox's onchange if it exists
            if (checkbox.onchange) {
                checkbox.onchange();
            } else {
                checkbox.dispatchEvent(new Event('change', {bubbles: true}));
            }
        }
    });
    
    // Keep dropdown open
    setTimeout(() => {
        const input = document.getElementById('formId:chipInput');
        if (input) {
            input.focus();
            const popup = document.querySelector('[id$="notificationSuggestion:list"]');
            if (popup) popup.style.display = 'block';
        }
    }, 100);
}

function simpleClearAll() {
    console.log('🎯 Simple Clear All executing...');
    
    const popup = document.querySelector('[id$="notificationSuggestion:list"]');
    if (!popup) {
        console.error('❌ Popup not found');
        return;
    }
    
    // Find ALL rows
    const rows = Array.from(popup.querySelectorAll('div')).filter(div => {
        if (div.classList.contains('simple-controls') || div.classList.contains('suggestion-actions')) {
            return false;
        }
        return div.querySelector('input[type="checkbox"]') !== null;
    });
    
    console.log('Found', rows.length, 'rows');
    
    rows.forEach((row, idx) => {
        const checkbox = row.querySelector('input[type="checkbox"]');
        if (!checkbox) return;
        
        const label = extractTextFromRow(row, checkbox);
        console.log(`  Row ${idx}: label="${label}", checked=${checkbox.checked}`);
        
        if (label && checkbox.checked) {
            checkbox.checked = false;
            
            // Remove chip
            if (window.removeChip) {
                removeChip(label, {silent: false});
            }
            
            // Trigger the checkbox's onchange
            if (checkbox.onchange) {
                checkbox.onchange();
            } else {
                checkbox.dispatchEvent(new Event('change', {bubbles: true}));
            }
        }
    });
    
    // Keep dropdown open
    setTimeout(() => {
        const input = document.getElementById('formId:chipInput');
        if (input) {
            input.focus();
            const popup = document.querySelector('[id$="notificationSuggestion:list"]');
            if (popup) popup.style.display = 'block';
        }
    }, 100);
}

function extractTextFromRow(row, checkbox) {
    // Get all text content from the row
    let text = row.textContent || '';
    
    // Remove the checkbox from consideration
    const checkboxText = checkbox.textContent || '';
    text = text.replace(checkboxText, '').trim();
    
    // Look for output text elements
    const outputText = row.querySelector('span, h\\:outputText, [class*="output"]');
    if (outputText) {
        return outputText.textContent.trim();
    }
    
    // Try to find text nodes
    const walker = document.createTreeWalker(
        row,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function(node) {
                // Skip text nodes that are inside the checkbox
                if (checkbox.contains(node)) {
                    return NodeFilter.FILTER_REJECT;
                }
                // Skip empty text nodes
                if (!node.textContent.trim()) {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        },
        false
    );
    
    let textParts = [];
    let node;
    while (node = walker.nextNode()) {
        textParts.push(node.textContent.trim());
    }
    
    return textParts.join(' ').trim();
}

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addNotificationControls);
} else {
    addNotificationControls();
}

// Also try when typing in the input (this shows the dropdown)
document.addEventListener('focus', (e) => {
    if (e.target.id === 'formId:chipInput') {
        setTimeout(addNotificationControls, 100);
    }
}, true);

console.log('🎯 Simple version loaded - controls will be added when dropdown opens');
