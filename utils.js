// --- UTILITIES ---
function sanitizeHTML(text) {
  const temp = document.createElement('div');
  temp.textContent = text || '';
  return temp.innerHTML;
}

function debounce(func, delay) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

function showLoading(show) {
  if (elements.loadingOverlay) {
    elements.loadingOverlay.classList.toggle('visible', show);
  }
}

function updateLoadingStatus(message) {
    const statusElement = document.getElementById('loading-status'); // Direct access as elements might not be populated yet
    if (statusElement) {
        statusElement.textContent = message;
    }
}

function setProcessingState(isProcessing, indicatorElement) {
  state.isProcessing = isProcessing;
  if(indicatorElement) {
    indicatorElement.classList.toggle('hidden', !isProcessing);
  }
}

function clearErrors() {
  state.errors = [];
  if(elements.errorsContainer) elements.errorsContainer.classList.add('hidden');
  if(elements.errorsList) elements.errorsList.innerHTML = '';
}

function addError(errorMessage) {
  // Use sanitized message for display
  const sanitizedMessage = typeof window.sanitizeErrorMessage === 'function' 
    ? window.sanitizeErrorMessage(errorMessage) 
    : errorMessage;
  
  state.errors.push(sanitizedMessage);
  if(elements.errorsContainer) elements.errorsContainer.classList.remove('hidden');
  const li = document.createElement('li');
  li.textContent = sanitizedMessage;
  if(elements.errorsList) elements.errorsList.appendChild(li);
  console.error(sanitizedMessage);
}

function downloadFile(content, fileName, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function generateMgisLink(row) {
    // Ensure row and rmrecnbr exist
    if (row && row.rmrecnbr) {
        return `https://mgis.med.umich.edu/#feature=search&rmrecnbr=${row.rmrecnbr}`;
    }
    return ''; // Return empty string or a placeholder if no rmrecnbr
}

// --- RICH TAG UTILITY --- (Moved here as it's a utility for creating tag data structure)
function createRichTag(name, type, description, link, contact, imageUrl, color) {
  return {
    id: Date.now() + Math.random().toString(36).substring(2,9), // Unique ID for the tag instance
    name: name.trim(),
    type: type || 'simple', // Default to simple if not provided
    description: description?.trim() || '',
    link: link?.trim() || '',
    contact: contact?.trim() || '',
    imageUrl: imageUrl?.trim() || '',
    color: color || 'blue', // Default color
    created: new Date().toISOString(),
    isRich: type !== 'simple' || !!description || !!link || !!contact || !!imageUrl || color !== 'blue' // Flag if it has more than just a name/default color
  };
}

// === SIMPLE ERROR MESSAGE SANITIZATION ===

function sanitizeErrorMessage(message) {
    if (!message || typeof message !== 'string') return message;
    
    let sanitized = message;
    
    // Remove "jakeseegers.github.io says" completely
    sanitized = sanitized.replace(/jakeseegers\.github\.io\s+says/gi, '');
    
    // Change "Workspace [name] not found" to "Workspace not available."
    sanitized = sanitized.replace(/Workspace\s+.+?\s+not found/gi, 'Workspace not available');
    
    // Clean up extra whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
    
    return sanitized;
}

// Store original alert function
const originalAlert = window.alert;

// Override global alert to sanitize messages
window.alert = function(message) {
    const sanitizedMessage = sanitizeErrorMessage(message);
    return originalAlert.call(window, sanitizedMessage);
};

// Expose sanitization function globally
window.sanitizeErrorMessage = sanitizeErrorMessage;
