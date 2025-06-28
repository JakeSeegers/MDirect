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
  
  // Keep original error in console for debugging
  console.error('Original error:', errorMessage);
  console.error('Sanitized error shown to user:', sanitizedMessage);
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

// === ERROR MESSAGE SANITIZATION SYSTEM ===

// Sensitive patterns to sanitize
const SENSITIVE_PATTERNS = [
    // Remove usernames/emails
    { pattern: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, replacement: '[email address]' },
    // Remove workspace names from error messages
    { pattern: /workspace[\s"'`]*[:\-=]?[\s"'`]*["'`]?([a-zA-Z0-9\-_\s]+)["'`]?/gi, replacement: 'workspace' },
    // Remove "jakeseegers.github.io says" and similar patterns
    { pattern: /([a-zA-Z0-9\-\.]+\.github\.io|[a-zA-Z0-9\-\.]+\.netlify\.app|[a-zA-Z0-9\-\.]+\.vercel\.app)\s+says/gi, replacement: '' },
    // Remove specific error details that might expose system info
    { pattern: /Failed to join workspace:\s*(.+)/g, replacement: 'Unable to connect to workspace. Please check your credentials.' },
    { pattern: /Workspace not found/g, replacement: 'Unable to connect. Please verify the workspace name.' },
    { pattern: /Error creating workspace:\s*(.+)/g, replacement: 'Unable to create workspace. Please try again.' },
    { pattern: /Failed to load resource:/g, replacement: 'Resource loading failed.' },
    { pattern: /Workspace not found:\s*(.+)/g, replacement: 'Workspace not available.' },
    // Remove file paths
    { pattern: /[C-Z]:\\[^\\s"<>|*?]+/g, replacement: '[file path]' },
    { pattern: /\/[^\s"<>|*?]+\/[^\s"<>|*?]+/g, replacement: '[file path]' },
    // Remove URLs except approved domains
    { pattern: /https?:\/\/(?!mgis\.med\.umich\.edu|supabase\.co)[^\s"<>]+/g, replacement: '[external link]' },
    // Remove database/server errors
    { pattern: /PGRST\d+/g, replacement: 'Database error' },
    { pattern: /Connection refused|ECONNREFUSED/g, replacement: 'Connection failed' },
    // Remove specific domain references that might be sensitive
    { pattern: /pzcqsorfobygydxkdmzc\.supabase\.co[^\s]*/g, replacement: '[server]' },
    { pattern: /\.supabase\.co[^\s]*/g, replacement: '[server]' },
    // Remove GitHub-specific errors
    { pattern: /github\.io[^\s]*/g, replacement: '[website]' },
    // Clean up common error prefixes
    { pattern: /Error:\s*/g, replacement: '' },
    { pattern: /Failed to\s*/g, replacement: 'Unable to ' },
    // Remove stack trace information
    { pattern: /at .+:\d+:\d+/g, replacement: '' },
    { pattern: /\s+at\s+.+/g, replacement: '' },
    // Remove specific browser/system information
    { pattern: /TypeError:|ReferenceError:|SyntaxError:/g, replacement: 'Error:' },
    // Clean up double spaces and extra periods
    { pattern: /\s{2,}/g, replacement: ' ' },
    { pattern: /\.{2,}/g, replacement: '.' }
];

function sanitizeErrorMessage(message) {
    if (!message || typeof message !== 'string') return message;
    
    let sanitized = message;
    
    // Apply all sanitization patterns
    SENSITIVE_PATTERNS.forEach(({ pattern, replacement }) => {
        sanitized = sanitized.replace(pattern, replacement);
    });
    
    // Clean up extra whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
    
    // Remove leading/trailing punctuation cleanup
    sanitized = sanitized.replace(/^[:\-\s]+|[:\-\s]+$/g, '');
    
    // Ensure it ends with proper punctuation if it's a sentence
    if (sanitized && sanitized.length > 0 && !sanitized.endsWith('.') && !sanitized.endsWith('!') && !sanitized.endsWith('?')) {
        sanitized += '.';
    }
    
    return sanitized;
}

// Store original alert function
const originalAlert = window.alert;

// Create a better error display function that replaces alerts
function createSecureErrorModal(message, title = 'Notice') {
    const sanitizedMessage = sanitizeErrorMessage(message);
    
    // Remove any existing error modals
    const existingModal = document.querySelector('.secure-error-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.className = 'secure-error-modal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,39,76,0.4); display: flex; align-items: center;
        justify-content: center; z-index: 10000; 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
        backdrop-filter: blur(3px);
    `;
    
    modal.innerHTML = `
        <div style="
            background: white; padding: 24px; border-radius: 12px; 
            max-width: 400px; margin: 20px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
            border: 1px solid #E5E7EB;
        ">
            <div style="display: flex; align-items: center; margin-bottom: 16px;">
                <svg style="width: 20px; height: 20px; color: #F59E0B; margin-right: 12px; flex-shrink: 0;" 
                     fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                <h3 style="margin: 0; color: #1F2937; font-size: 18px; font-weight: 600;">${sanitizeHTML(title)}</h3>
            </div>
            <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.5; color: #4B5563;">
                ${sanitizeHTML(sanitizedMessage)}
            </p>
            <div style="text-align: right;">
                <button id="secure-error-ok" style="
                    padding: 8px 16px; background: #00274C; color: white; 
                    border: none; border-radius: 6px; cursor: pointer; 
                    font-size: 14px; font-weight: 500;
                    transition: background-color 0.2s ease;
                " onmouseover="this.style.background='#001f3f'" 
                   onmouseout="this.style.background='#00274C'">OK</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const closeModal = () => {
        modal.remove();
    };
    
    modal.querySelector('#secure-error-ok').onclick = closeModal;
    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };
    
    // Handle escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
    
    return modal;
}

// Override global alert to use secure modal
window.alert = function(message) {
    createSecureErrorModal(message, 'Alert');
};

// Global error handler for uncaught errors
window.addEventListener('error', function(event) {
    const sanitizedMessage = sanitizeErrorMessage(event.message);
    console.warn('Sanitized global error:', sanitizedMessage);
    // Optionally show sanitized error to user
    if (sanitizedMessage && !sanitizedMessage.includes('Script error')) {
        createSecureErrorModal('An unexpected error occurred. Please refresh the page.', 'System Error');
    }
    // Don't prevent default to allow normal error handling
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
    const errorMessage = event.reason?.message || event.reason?.toString() || 'Unknown error';
    const sanitizedMessage = sanitizeErrorMessage(errorMessage);
    console.warn('Sanitized promise rejection:', sanitizedMessage);
    // Prevent the default browser error display only for workspace-related errors
    if (errorMessage.toLowerCase().includes('workspace') || errorMessage.toLowerCase().includes('supabase')) {
        event.preventDefault();
        createSecureErrorModal('Connection issue encountered. Please try again.', 'Connection Error');
    }
});

// Also sanitize any existing error elements on page load
document.addEventListener('DOMContentLoaded', function() {
    // Sanitize any existing error text in the DOM
    const errorElements = document.querySelectorAll('#errors-list li, .error-message, .alert-error');
    errorElements.forEach(element => {
        if (element.textContent) {
            element.textContent = sanitizeErrorMessage(element.textContent);
        }
    });
});

// Expose functions globally for use elsewhere if needed
window.sanitizeErrorMessage = sanitizeErrorMessage;
window.showSecureError = function(message, title) {
    createSecureErrorModal(message, title);
};

// Enhanced console override (optional - comment out if too aggressive)
// const originalConsoleError = console.error;
// console.error = function(...args) {
//     const sanitizedArgs = args.map(arg => 
//         typeof arg === 'string' ? sanitizeErrorMessage(arg) : arg
//     );
//     return originalConsoleError.apply(console, sanitizedArgs);
// };
