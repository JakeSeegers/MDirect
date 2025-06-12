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
  state.errors.push(errorMessage);
  if(elements.errorsContainer) elements.errorsContainer.classList.remove('hidden');
  const li = document.createElement('li');
  li.textContent = errorMessage;
  if(elements.errorsList) elements.errorsList.appendChild(li);
  console.error(errorMessage);
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

// === BROWSER CACHE SYSTEM ===

const CACHE_KEYS = {
    WORKSPACE_INFO: 'umhospital_workspace_info',
    TAG_DATA: 'umhospital_tag_data',
    LAST_SESSION: 'umhospital_last_session'
};

// Cache Management System
const CacheManager = {
    
    // Save workspace info (but not password for security)
    saveWorkspaceInfo(workspaceName, userName, workspaceId) {
        try {
            const workspaceInfo = {
                workspaceName,
                userName,
                workspaceId,
                savedAt: new Date().toISOString(),
                version: '1.0'
            };
            
            localStorage.setItem(CACHE_KEYS.WORKSPACE_INFO, JSON.stringify(workspaceInfo));
            console.log('💾 Workspace info cached:', workspaceName);
            return true;
        } catch (error) {
            console.error('❌ Failed to cache workspace info:', error);
            return false;
        }
    },
    
    // Load workspace info
    loadWorkspaceInfo() {
        try {
            const cached = localStorage.getItem(CACHE_KEYS.WORKSPACE_INFO);
            if (!cached) return null;
            
            const workspaceInfo = JSON.parse(cached);
            
            // Check if cache is not too old (optional - 30 days)
            const savedAt = new Date(workspaceInfo.savedAt);
            const now = new Date();
            const daysSinceCache = (now - savedAt) / (1000 * 60 * 60 * 24);
            
            if (daysSinceCache > 30) {
                console.log('⚠️ Workspace cache expired, clearing...');
                this.clearWorkspaceInfo();
                return null;
            }
            
            console.log('📂 Loaded cached workspace info:', workspaceInfo.workspaceName);
            return workspaceInfo;
        } catch (error) {
            console.error('❌ Failed to load workspace info:', error);
            return null;
        }
    },
    
    // Save tag data
    saveTagData(customTags, staffTags) {
        try {
            const tagData = {
                customTags: customTags || {},
                staffTags: staffTags || {},
                savedAt: new Date().toISOString(),
                version: '1.0',
                totalTags: Object.keys(customTags || {}).reduce((total, roomId) => {
                    return total + (customTags[roomId]?.length || 0);
                }, 0)
            };
            
            const jsonString = JSON.stringify(tagData);
            
            // Check localStorage size (rough check)
            if (jsonString.length > 5000000) { // ~5MB limit
                console.warn('⚠️ Tag data is very large, might hit localStorage limits');
            }
            
            localStorage.setItem(CACHE_KEYS.TAG_DATA, jsonString);
            console.log(`💾 Tag data cached: ${tagData.totalTags} tags`);
            return true;
        } catch (error) {
            console.error('❌ Failed to cache tag data:', error);
            if (error.name === 'QuotaExceededError') {
                console.error('💾 localStorage quota exceeded! Consider clearing old data.');
                this.showCacheFullWarning();
            }
            return false;
        }
    },
    
    // Load tag data
    loadTagData() {
        try {
            const cached = localStorage.getItem(CACHE_KEYS.TAG_DATA);
            if (!cached) return null;
            
            const tagData = JSON.parse(cached);
            console.log(`📂 Loaded cached tag data: ${tagData.totalTags || 0} tags`);
            return tagData;
        } catch (error) {
            console.error('❌ Failed to load tag data:', error);
            return null;
        }
    },
    
    // Save last session timestamp
    saveLastSession() {
        try {
            localStorage.setItem(CACHE_KEYS.LAST_SESSION, new Date().toISOString());
        } catch (error) {
            console.error('❌ Failed to save last session:', error);
        }
    },
    
    // Check if this is a returning user
    isReturningUser() {
        return !!localStorage.getItem(CACHE_KEYS.LAST_SESSION);
    },
    
    // Clear specific cache
    clearWorkspaceInfo() {
        localStorage.removeItem(CACHE_KEYS.WORKSPACE_INFO);
        console.log('🗑️ Workspace cache cleared');
    },
    
    clearTagData() {
        localStorage.removeItem(CACHE_KEYS.TAG_DATA);
        console.log('🗑️ Tag data cache cleared');
    },
    
    // Clear all cache
    clearAllCache() {
        Object.values(CACHE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        console.log('🗑️ All cache cleared');
    },
    
    // Get cache status/info
    getCacheStatus() {
        const workspaceInfo = this.loadWorkspaceInfo();
        const tagData = this.loadTagData();
        
        return {
            hasWorkspace: !!workspaceInfo,
            hasTags: !!tagData,
            workspaceName: workspaceInfo?.workspaceName,
            tagCount: tagData?.totalTags || 0,
            lastSession: localStorage.getItem(CACHE_KEYS.LAST_SESSION)
        };
    },
    
    // Show cache full warning
    showCacheFullWarning() {
        if (typeof addError === 'function') {
            addError('Browser storage is full! Consider clearing cache or using fewer tags.');
        } else {
            alert('Browser storage is full! Consider clearing cache or using fewer tags.');
        }
    },
    
    // Auto-save tags periodically
    enableAutoSave(intervalMinutes = 5) {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        this.autoSaveInterval = setInterval(() => {
            if (state?.customTags || state?.staffTags) {
                this.saveTagData(state.customTags, state.staffTags);
                console.log('💾 Auto-saved tag data');
            }
        }, intervalMinutes * 60 * 1000);
        
        console.log(`💾 Auto-save enabled every ${intervalMinutes} minutes`);
    },
    
    disableAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
            console.log('💾 Auto-save disabled');
        }
    }
};

// Auto-restore functions
const AutoRestore = {
    
    // Try to auto-join workspace on page load
    async tryAutoJoinWorkspace() {
        const workspaceInfo = CacheManager.loadWorkspaceInfo();
        if (!workspaceInfo) return false;
        
        console.log('🔄 Attempting to auto-join cached workspace...');
        
        // Show a notification that we're trying to reconnect
        if (typeof showCollaborationNotification === 'function') {
            showCollaborationNotification(`🔄 Reconnecting to "${workspaceInfo.workspaceName}"...`);
        }
        
        // We need the user to enter password again for security
        const password = prompt(`Enter password for workspace "${workspaceInfo.workspaceName}":`);
        if (!password) {
            console.log('⚠️ Auto-join cancelled - no password provided');
            return false;
        }
        
        try {
            const result = await window.workspaceCollaboration.joinWorkspace(
                workspaceInfo.workspaceName, 
                password, 
                workspaceInfo.userName
            );
            
            if (result.success) {
                console.log('✅ Auto-joined workspace successfully');
                if (typeof showCollaborationNotification === 'function') {
                    showCollaborationNotification(`✅ Reconnected to "${workspaceInfo.workspaceName}"`);
                }
                
                // Cache the successful rejoin
                CacheManager.saveWorkspaceInfo(workspaceInfo.workspaceName, workspaceInfo.userName, result.workspace?.id);
                CacheManager.enableAutoSave(5);
                
                return true;
            } else {
                console.log('❌ Auto-join failed:', result.error);
                if (result.error.includes('password')) {
                    CacheManager.clearWorkspaceInfo(); // Clear bad cache
                }
                return false;
            }
        } catch (error) {
            console.error('❌ Auto-join error:', error);
            return false;
        }
    },
    
    // Auto-restore tag data
    tryAutoRestoreTags() {
        const tagData = CacheManager.loadTagData();
        if (!tagData) return false;
        
        console.log('🔄 Restoring cached tag data...');
        
        // Merge with existing data (don't overwrite)
        if (tagData.customTags) {
            Object.keys(tagData.customTags).forEach(roomId => {
                if (!state.customTags[roomId]) {
                    state.customTags[roomId] = [];
                }
                
                // Add cached tags that don't already exist
                tagData.customTags[roomId].forEach(cachedTag => {
                    const exists = state.customTags[roomId].some(
                        existingTag => existingTag.name === cachedTag.name
                    );
                    if (!exists) {
                        state.customTags[roomId].push(cachedTag);
                    }
                });
            });
        }
        
        if (tagData.staffTags) {
            Object.keys(tagData.staffTags).forEach(roomId => {
                if (!state.staffTags[roomId]) {
                    state.staffTags[roomId] = [];
                }
                
                // Add cached staff tags that don't already exist
                tagData.staffTags[roomId].forEach(cachedStaffTag => {
                    if (!state.staffTags[roomId].includes(cachedStaffTag)) {
                        state.staffTags[roomId].push(cachedStaffTag);
                    }
                });
            });
        }
        
        console.log(`✅ Restored ${tagData.totalTags || 0} cached tags`);
        
        // Update UI if function exists
        if (typeof updateResults === 'function') {
            updateResults();
        }
        
        return true;
    }
};

// Enhanced workspace join function with caching
async function joinWorkspaceWithCache(workspaceName, password, userName) {
    const result = await window.workspaceCollaboration.joinWorkspace(workspaceName, password, userName);
    
    if (result.success) {
        // Save to cache (without password)
        CacheManager.saveWorkspaceInfo(workspaceName, userName, result.workspace?.id);
        CacheManager.saveLastSession();
        
        // Enable auto-save for tags
        CacheManager.enableAutoSave(5); // Auto-save every 5 minutes
    }
    
    return result;
}

// Enhanced tag saving with caching
function saveTagsToCache() {
    CacheManager.saveTagData(state.customTags, state.staffTags);
}

// Add cache status to UI
function createCacheStatusUI() {
    const status = CacheManager.getCacheStatus();
    
    const cacheStatusHTML = `
        <div class="cache-status bg-gray-50 border border-gray-200 rounded-lg p-3 mt-4">
            <h4 class="font-medium text-gray-700 mb-2 flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7c0-2.21-1.79-4-4-4H8c-2.21 0-4 1.79-4 4z"/>
                </svg>
                Browser Cache Status
            </h4>
            <div class="text-sm text-gray-600 space-y-1">
                <div>Workspace: ${status.hasWorkspace ? `✅ ${status.workspaceName}` : '❌ None cached'}</div>
                <div>Tags: ${status.hasTags ? `✅ ${status.tagCount} tags cached` : '❌ None cached'}</div>
                <div>Last Session: ${status.lastSession ? new Date(status.lastSession).toLocaleString() : 'Never'}</div>
            </div>
            <div class="mt-2 space-x-2">
                <button onclick="saveTagsToCache()" 
                        class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                    💾 Save Tags Now
                </button>
                <button onclick="CacheManager.clearAllCache(); if(confirm('Clear all cached data? This cannot be undone.')) location.reload()" 
                        class="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">
                    🗑️ Clear All Cache
                </button>
            </div>
        </div>
    `;
    
    return cacheStatusHTML;
}

// Initialize cache system on page load
function initializeCacheSystem() {
    console.log('💾 Initializing cache system...');
    
    // Check if returning user
    if (CacheManager.isReturningUser()) {
        console.log('👋 Welcome back! Loading cached data...');
        
        // Try to restore tags immediately
        AutoRestore.tryAutoRestoreTags();
        
        // Ask if user wants to reconnect to workspace (after a short delay)
        setTimeout(() => {
            const workspaceInfo = CacheManager.loadWorkspaceInfo();
            if (workspaceInfo && confirm(`Welcome back! Would you like to reconnect to workspace "${workspaceInfo.workspaceName}"?`)) {
                AutoRestore.tryAutoJoinWorkspace();
            }
        }, 2000);
    }
    
    // Save session on page unload
    window.addEventListener('beforeunload', () => {
        CacheManager.saveLastSession();
        if (state?.customTags || state?.staffTags) {
            CacheManager.saveTagData(state.customTags, state.staffTags);
        }
    });
    
    // Auto-save every 5 minutes if workspace is connected
    setInterval(() => {
        if (window.workspaceCollaboration?.collaborationState?.isOnline && (state?.customTags || state?.staffTags)) {
            CacheManager.saveTagData(state.customTags, state.staffTags);
        }
    }, 5 * 60 * 1000);
    
    console.log('💾 Cache system initialized');
}

// Export to global scope
window.CacheManager = CacheManager;
window.AutoRestore = AutoRestore;
window.joinWorkspaceWithCache = joinWorkspaceWithCache;
window.saveTagsToCache = saveTagsToCache;
window.createCacheStatusUI = createCacheStatusUI;
window.initializeCacheSystem = initializeCacheSystem;