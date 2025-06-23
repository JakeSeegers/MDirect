// --- ENHANCED APP LOGIC WITH AUTHENTICATION ---

let currentRoomIdForModal = null;

// --- AUTHENTICATION FUNCTIONS ---
function updateAuthenticationUI() {
    const signedOut = document.getElementById('auth-signed-out');
    const signedIn = document.getElementById('auth-signed-in');
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    const authRequiredModal = document.getElementById('auth-required-modal');
    
    const isAuthenticated = window.workspaceCollaboration?.collaborationState?.isAuthenticated || false;
    const user = window.workspaceCollaboration?.collaborationState?.currentUser;
    const userProfile = window.workspaceCollaboration?.collaborationState?.userProfile;
    
    if (isAuthenticated && user) {
        // Show authenticated UI
        if (signedOut) signedOut.classList.add('hidden');
        if (signedIn) signedIn.classList.remove('hidden');
        
        // Update user info
        if (userAvatar) {
            userAvatar.src = user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=00274C&color=fff`;
        }
        if (userName) {
            userName.textContent = userProfile?.full_name || user.user_metadata?.full_name || user.email.split('@')[0];
        }
        if (userEmail) {
            userEmail.textContent = user.email;
        }
        
        // Hide auth required modal if showing
        if (authRequiredModal) authRequiredModal.classList.add('hidden');
        
        // Enable application features
        enableApplicationFeatures();
        
    } else {
        // Show sign-in UI
        if (signedOut) signedOut.classList.remove('hidden');
        if (signedIn) signedIn.classList.add('hidden');
        
        // Disable application features for non-authenticated users
        disableApplicationFeatures();
    }
}

function enableApplicationFeatures() {
    // Enable upload and search functionality
    const uploadArea = elements.universalUploadArea;
    const searchInputs = [elements.searchInput, elements.searchInputMobile];
    const filters = [
        elements.buildingFilter, elements.floorFilter, elements.tagFilter, elements.resultsPerPage,
        elements.buildingFilterMobile, elements.floorFilterMobile, elements.tagFilterMobile, elements.resultsPerPageMobile
    ];
    
    if (uploadArea) {
        uploadArea.style.pointerEvents = 'auto';
        uploadArea.style.opacity = '1';
    }
    
    searchInputs.forEach(input => {
        if (input) {
            input.disabled = false;
            input.placeholder = input.id.includes('mobile') ? 
                "Search rooms, types, staff..." : 
                "Search rooms, types, staff... Try 'Building: [name]'";
        }
    });
    
    filters.forEach(filter => {
        if (filter) filter.disabled = false;
    });
}

function disableApplicationFeatures() {
    // Show auth required modal when user tries to interact
    const searchInputs = [elements.searchInput, elements.searchInputMobile];
    
    searchInputs.forEach(input => {
        if (input) {
            input.disabled = true;
            input.placeholder = "Sign in to search rooms...";
        }
    });
}

function showAuthRequiredModal() {
    const modal = document.getElementById('auth-required-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

// --- USER PROFILE FUNCTIONS ---
function showUserProfileModal() {
    const modal = document.getElementById('user-profile-modal');
    if (!modal) return;
    
    const user = window.workspaceCollaboration?.collaborationState?.currentUser;
    const userProfile = window.workspaceCollaboration?.collaborationState?.userProfile;
    
    if (!user) return;
    
    // Populate profile data
    const profileAvatar = document.getElementById('profile-avatar');
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profileDepartment = document.getElementById('profile-department');
    const departmentInput = document.getElementById('department-input');
    
    if (profileAvatar) {
        profileAvatar.src = user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=00274C&color=fff`;
    }
    if (profileName) {
        profileName.textContent = userProfile?.full_name || user.user_metadata?.full_name || user.email.split('@')[0];
    }
    if (profileEmail) {
        profileEmail.textContent = user.email;
    }
    if (profileDepartment) {
        profileDepartment.textContent = userProfile?.department || 'No department set';
    }
    if (departmentInput) {
        departmentInput.value = userProfile?.department || '';
    }
    
    // Load user workspaces
    loadUserWorkspaces();
    
    modal.classList.remove('hidden');
}

function hideUserProfileModal() {
    const modal = document.getElementById('user-profile-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

async function saveUserProfile() {
    const departmentInput = document.getElementById('department-input');
    const department = departmentInput?.value?.trim() || '';
    
    const user = window.workspaceCollaboration?.collaborationState?.currentUser;
    if (!user) return;
    
    try {
        // Update user profile in database
        const { error } = await window.workspaceCollaboration.supabaseClient
            .from('user_profiles')
            .update({ department })
            .eq('id', user.id);
            
        if (error) throw error;
        
        // Update local state
        if (window.workspaceCollaboration.collaborationState.userProfile) {
            window.workspaceCollaboration.collaborationState.userProfile.department = department;
        }
        
        showNotification('✅ Profile updated successfully');
        hideUserProfileModal();
        updateAuthenticationUI();
        
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('❌ Failed to update profile', 'error');
    }
}

async function loadUserWorkspaces() {
    const workspacesList = document.getElementById('user-workspaces-list');
    if (!workspacesList) return;
    
    const user = window.workspaceCollaboration?.collaborationState?.currentUser;
    if (!user) return;
    
    try {
        // Get user's workspaces using the database function
        const { data: workspaces, error } = await window.workspaceCollaboration.supabaseClient
            .rpc('get_user_workspaces', { user_id: user.id });
            
        if (error) throw error;
        
        workspacesList.innerHTML = '';
        
        if (workspaces && workspaces.length > 0) {
            workspaces.forEach(workspace => {
                const workspaceItem = document.createElement('div');
                workspaceItem.className = 'workspace-item';
                if (window.workspaceCollaboration.collaborationState.currentWorkspace?.id === workspace.workspace_id) {
                    workspaceItem.classList.add('active');
                }
                
                workspaceItem.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div>
                            <h5 class="font-medium text-um-blue">${sanitizeHTML(workspace.workspace_name)}</h5>
                            <p class="text-xs text-gray-600">${workspace.user_role} • ${workspace.member_count} members</p>
                        </div>
                        <span class="text-xs text-gray-500">${workspace.tag_count} tags</span>
                    </div>
                `;
                
                workspaceItem.addEventListener('click', () => {
                    if (window.workspaceCollaboration.collaborationState.currentWorkspace?.id !== workspace.workspace_id) {
                        joinWorkspaceById(workspace.workspace_id, workspace.workspace_name);
                    }
                });
                
                workspacesList.appendChild(workspaceItem);
            });
        } else {
            workspacesList.innerHTML = '<p class="text-sm text-gray-500 text-center py-4">No workspaces yet. Create or join one to get started!</p>';
        }
        
    } catch (error) {
        console.error('Error loading workspaces:', error);
        workspacesList.innerHTML = '<p class="text-sm text-red-600 text-center py-4">Failed to load workspaces</p>';
    }
}

async function joinWorkspaceById(workspaceId, workspaceName) {
    try {
        const result = await window.workspaceCollaboration.joinWorkspace(workspaceName);
        if (result.success) {
            hideUserProfileModal();
            updateCollaborationUI();
            showNotification(`✅ Switched to workspace "${workspaceName}"`);
        }
    } catch (error) {
        console.error('Error joining workspace:', error);
        showNotification('❌ Failed to join workspace', 'error');
    }
}

// --- ENHANCED MODAL FUNCTIONS ---
function showWelcomeModal() {
    if (!elements.welcomeModal || (elements.dontShowAgain && localStorage.getItem('hideWelcomeModal') === 'true')) {
        return;
    }
    elements.welcomeModal.classList.remove('hidden');
}

function hideWelcomeModal() {
    if (!elements.welcomeModal) return;
    elements.welcomeModal.classList.add('hidden');
    if (elements.dontShowAgain && elements.dontShowAgain.checked) {
        localStorage.setItem('hideWelcomeModal', 'true');
    }
}

function showSecurityReminder() {
    if (state.hideSecurityReminder || !elements.securityReminderModal) return;
    elements.securityReminderModal.classList.remove('hidden');
}
window.showSecurityReminder = showSecurityReminder;

function hideSecurityReminder() {
    if (!elements.securityReminderModal) return;
    elements.securityReminderModal.classList.add('hidden');
    if (elements.dontShowSecurityAgain && elements.dontShowSecurityAgain.checked) {
        state.hideSecurityReminder = true;
    }
}

function showMgisComplianceModal() {
    if (!elements.mgisComplianceModal) return;
    elements.mgisComplianceModal.classList.remove('hidden');
    elements.mgisComplianceCheckbox.checked = false;
    elements.mgisExportConfirmBtn.disabled = true;
}

function hideMgisComplianceModal() {
    if (elements.mgisComplianceModal) {
        elements.mgisComplianceModal.classList.add('hidden');
    }
}

// --- ENHANCED WORKSPACE COLLABORATION FUNCTIONS ---
function handleCollaborationButtonClick() {
    // Check authentication first
    if (!window.workspaceCollaboration?.collaborationState?.isAuthenticated) {
        showAuthRequiredModal();
        return;
    }
    
    if (window.workspaceCollaboration.collaborationState.isOnline) {
        // Already connected, offer to leave workspace
        const workspaceName = window.workspaceCollaboration.collaborationState.currentWorkspace?.name;
        if (confirm(`Leave workspace "${workspaceName}"?`)) {
            window.workspaceCollaboration.leaveWorkspace();
        }
    } else {
        // Not connected, show workspace selection
        showWorkspaceSelectionModal();
    }
}

function showWorkspaceSelectionModal() {
    const modal = document.getElementById('workspace-selection-modal');
    if (modal) modal.classList.remove('hidden');
}

function hideWorkspaceSelectionModal() {
    const modal = document.getElementById('workspace-selection-modal');
    if (modal) modal.classList.add('hidden');
}

function showCreateWorkspaceModal() {
    hideWorkspaceSelectionModal();
    const modal = document.getElementById('create-workspace-modal');
    if (modal) {
        modal.classList.remove('hidden');
        const nameInput = document.getElementById('new-workspace-name');
        if (nameInput) nameInput.focus();
    }
}

function hideCreateWorkspaceModal() {
    const modal = document.getElementById('create-workspace-modal');
    if (modal) modal.classList.add('hidden');
    clearCreateWorkspaceForm();
}

function showJoinWorkspaceModal() {
    hideWorkspaceSelectionModal();
    const modal = document.getElementById('join-workspace-modal');
    if (modal) {
        modal.classList.remove('hidden');
        const nameInput = document.getElementById('join-workspace-name');
        if (nameInput) nameInput.focus();
    }
}

function hideJoinWorkspaceModal() {
    const modal = document.getElementById('join-workspace-modal');
    if (modal) modal.classList.add('hidden');
    clearJoinWorkspaceForm();
}

function clearCreateWorkspaceForm() {
    const fields = ['new-workspace-name', 'new-workspace-description'];
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) field.value = '';
    });
}

function clearJoinWorkspaceForm() {
    const field = document.getElementById('join-workspace-name');
    if (field) field.value = '';
}

async function createWorkspace() {
    const nameField = document.getElementById('new-workspace-name');
    const descriptionField = document.getElementById('new-workspace-description');
    
    const workspaceName = nameField?.value?.trim();
    const description = descriptionField?.value?.trim() || '';
    
    if (!workspaceName) {
        alert('Please enter a workspace name');
        return;
    }
    
    if (workspaceName.length < 3) {
        alert('Workspace name must be at least 3 characters');
        return;
    }
    
    try {
        showLoading(true);
        
        const result = await window.workspaceCollaboration.createWorkspace(workspaceName, description);
        
        if (result.success) {
            hideCreateWorkspaceModal();
            showNotification(`✅ Workspace "${workspaceName}" created! You're now connected.`);
            
            // Automatically join the created workspace
            const joinResult = await window.workspaceCollaboration.joinWorkspace(workspaceName);
            if (joinResult.success) {
                updateCollaborationUI();
            }
        } else {
            alert('Failed to create workspace: ' + result.error);
        }
    } catch (error) {
        console.error('Create workspace error:', error);
        alert('Error creating workspace: ' + error.message);
    } finally {
        showLoading(false);
    }
}

async function joinWorkspace() {
    const nameField = document.getElementById('join-workspace-name');
    const workspaceName = nameField?.value?.trim();
    
    if (!workspaceName) {
        alert('Please enter a workspace name');
        return;
    }
    
    try {
        showLoading(true);
        
        const result = await window.workspaceCollaboration.joinWorkspace(workspaceName);
        
        if (result.success) {
            hideJoinWorkspaceModal();
            showNotification(`✅ Joined workspace "${workspaceName}"!`);
            updateCollaborationUI();
        } else {
            alert('Failed to join workspace: ' + result.error);
        }
    } catch (error) {
        console.error('Join workspace error:', error);
        alert('Error joining workspace: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function updateCollaborationUI() {
    const collabButton = elements.collaborationBtn;
    const collabStatus = elements.collaborationStatus;
    const collabButtonText = document.getElementById('collaboration-btn-text');
    const workspaceNameElement = document.getElementById('workspace-name');
    
    if (window.workspaceCollaboration?.collaborationState?.isOnline) {
        const workspaceName = window.workspaceCollaboration.collaborationState.currentWorkspace?.name;
        
        if (collabButton) {
            collabButton.classList.remove('um-button-blue');
            collabButton.classList.add('um-button-maize');
        }
        
        if (collabButtonText) {
            collabButtonText.textContent = `Connected: ${workspaceName}`;
        }
        
        if (workspaceNameElement) {
            workspaceNameElement.textContent = `Team Collaboration: ${workspaceName}`;
        }
        
        if (collabStatus) {
            collabStatus.classList.remove('hidden');
            updateOnlineUsersDisplay();
        }
    } else {
        if (collabButton) {
            collabButton.classList.remove('um-button-maize');
            collabButton.classList.add('um-button-blue');
        }
        
        if (collabButtonText) {
            collabButtonText.textContent = 'Join Workspace';
        }
        
        if (collabStatus) {
            collabStatus.classList.add('hidden');
        }
    }
    
    updateWorkspaceTaggingOption();
}

function updateOnlineUsersDisplay() {
    const onlineUsersContainer = document.getElementById('online-users');
    if (!onlineUsersContainer) return;
    
    const connectedUsers = window.workspaceCollaboration?.collaborationState?.connectedUsers;
    if (!connectedUsers || connectedUsers.size === 0) {
        onlineUsersContainer.innerHTML = '<p class="text-sm text-green-600">You are the only one online</p>';
        return;
    }
    
    onlineUsersContainer.innerHTML = '';
    
    connectedUsers.forEach((presence, userName) => {
        const userBadge = document.createElement('div');
        userBadge.className = 'online-user-badge';
        userBadge.innerHTML = `
            <div class="online-indicator"></div>
            <span>${sanitizeHTML(userName)}</span>
        `;
        onlineUsersContainer.appendChild(userBadge);
    });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification-toast ${type}`;
    
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    
    notification.innerHTML = `
        <div class="flex items-center gap-3">
            <span class="text-lg">${icon}</span>
            <span class="text-sm font-medium">${sanitizeHTML(message)}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Hide and remove notification
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// --- TAG MANAGEMENT FUNCTIONS ---
function displayTagInfo(tag) {
    if (!elements.tagInfoModal || !elements.tagInfoTitle || !elements.tagInfoContent) return;
    if (!tag || !(tag.isRich || tag.description || tag.link || tag.imageUrl || tag.contact)) return;

    elements.tagInfoTitle.textContent = sanitizeHTML(tag.name);
    let content = '';
    if (tag.imageUrl) content += `<div class="mb-4"><img src="${sanitizeHTML(tag.imageUrl)}" class="tag-image max-w-full rounded-lg border" alt="Tag image for ${sanitizeHTML(tag.name)}" /></div>`;
    if (tag.description) content += `<div class="mb-4"><h4 class="font-medium text-um-blue mb-1">Description</h4><p class="text-gray-600">${sanitizeHTML(tag.description)}</p></div>`;
    if (tag.contact) content += `<div class="mb-4"><h4 class="font-medium text-um-blue mb-1">Contact</h4><p class="text-gray-600">${sanitizeHTML(tag.contact)}</p></div>`;
    if (tag.link) content += `<div class="mb-4"><h4 class="font-medium text-um-blue mb-1">Related Link</h4><a href="${sanitizeHTML(tag.link)}" target="_blank" rel="noopener noreferrer" class="text-um-blue hover:underline">${sanitizeHTML(tag.link)}</a></div>`;
    
    // Add workspace info if available
    if (tag.workspace && tag.created_by) {
        content += `<div class="mb-4 p-3 bg-blue-50 rounded-lg"><h4 class="font-medium text-blue-700 mb-1">Workspace Info</h4><p class="text-blue-600 text-sm">Created by: ${sanitizeHTML(tag.created_by)}</p></div>`;
    }
    
    content += `<div class="text-xs text-gray-500 mt-4 border-t pt-2"><p>Type: ${sanitizeHTML(tag.type)}</p><p class="flex items-center">Color: <span class="inline-block w-4 h-4 rounded-full ml-2 tag-${sanitizeHTML(tag.color)} border"></span> <span class="ml-1">${sanitizeHTML(tag.color)}</span></p><p>Created: ${new Date(tag.created).toLocaleString()}</p></div>`;
    elements.tagInfoContent.innerHTML = content;
    elements.tagInfoModal.classList.remove('hidden');
}
window.displayTagInfo = displayTagInfo;

function updateWorkspaceTaggingOption() {
    const workspaceOption = document.getElementById('workspace-sharing-option');
    const workspaceNameDisplay = document.getElementById('workspace-name-display');
    
    if (window.workspaceCollaboration?.collaborationState?.isOnline) {
        const workspaceName = window.workspaceCollaboration.collaborationState.currentWorkspace?.name;
        if (workspaceOption && workspaceNameDisplay) {
            workspaceNameDisplay.textContent = workspaceName || 'Unknown';
            workspaceOption.style.display = 'block';
        }
    } else {
        if (workspaceOption) {
            workspaceOption.style.display = 'none';
        }
    }
}

function handleAddTagClick(roomId) {
    // Check authentication first
    if (!window.workspaceCollaboration?.collaborationState?.isAuthenticated) {
        showAuthRequiredModal();
        return;
    }
    
    const room = state.processedData.find(r => r.id.toString() === roomId.toString()) || state.currentFilteredData.find(r => r.id.toString() === roomId.toString());
    if (!room || !elements.customTagModal || !elements.modalRoomInfo) return;
    
    currentRoomIdForModal = roomId;
    state.previouslyFocusedElement = document.activeElement;
    elements.modalRoomInfo.textContent = `Room: ${room.rmnbr} - ${room.typeFull} (${room.building || room.bld_descrshort || 'Unknown Building'})`;
    
    updateCustomTagsModalDisplay();
    clearTagForm();
    updateWorkspaceTaggingOption();
    elements.customTagModal.classList.remove('hidden');
    if(elements.tagNameInput) elements.tagNameInput.focus();
}

function closeTagModal() {
    if (elements.customTagModal) elements.customTagModal.classList.add('hidden');
    if (state.previouslyFocusedElement) state.previouslyFocusedElement.focus();
    currentRoomIdForModal = null;
}

function updateCustomTagsModalDisplay() {
    if (!elements.customTagsListModal || !currentRoomIdForModal) return;
    elements.customTagsListModal.innerHTML = '';
    const customTagsForRoom = state.customTags[currentRoomIdForModal] || [];
    const staffTagsForRoom = state.staffTags[currentRoomIdForModal] || [];

    if (staffTagsForRoom.length > 0) {
        elements.customTagsListModal.insertAdjacentHTML('beforeend', '<h4 class="text-sm font-medium text-gray-600 mb-1">Staff:</h4>');
        staffTagsForRoom.forEach(staffTagString => elements.customTagsListModal.appendChild(createTagElementInModal(staffTagString, 'staff', false)));
    }
    if (customTagsForRoom.length > 0) {
        elements.customTagsListModal.insertAdjacentHTML('beforeend', `<h4 class="text-sm font-medium text-gray-600 ${staffTagsForRoom.length > 0 ? 'mt-3' : ''} mb-1">Custom Tags:</h4>`);
        customTagsForRoom.forEach(richTagObj => elements.customTagsListModal.appendChild(createTagElementInModal(richTagObj, 'custom', true)));
    }
    if (staffTagsForRoom.length === 0 && customTagsForRoom.length === 0) elements.customTagsListModal.innerHTML = '<p class="text-sm text-gray-500">No custom tags or staff assigned.</p>';
}

function createTagElementInModal(tagData, type, removable) {
    const template = elements.customTagItemTemplate.content.cloneNode(true);
    const span = template.querySelector('span');
    const tagNameEl = span.querySelector('[data-content="tag-name"]');
    const removeBtn = span.querySelector('[data-action="remove-custom-tag"]');
    let name, color, isRichTagObject = false;

    if (type === 'staff') { 
        name = tagData.startsWith('Staff: ') ? tagData.substring(7) : tagData; 
        color = 'gray'; 
    } else { 
        name = tagData.name; 
        color = tagData.color || 'blue'; 
        isRichTagObject = true; 
    }

    tagNameEl.textContent = name;
    span.classList.add(`tag-${color}`);
    
    // Add workspace indicator for workspace tags
    if (tagData.workspace) {
        span.classList.add('workspace-tag');
        span.title = `Workspace tag by ${tagData.created_by || 'team member'}`;
    }
    
    // Only show rich tag indicator if there's actual rich content
    if (isRichTagObject && (tagData.description || tagData.link || tagData.imageUrl || tagData.contact)) {
        span.classList.add('rich-tag'); 
        span.style.cursor = 'pointer';
        span.onclick = () => displayTagInfo(tagData);
    }
    
    if (!removable || !removeBtn) {
        removeBtn?.remove();
    } else {
        removeBtn.dataset.tagId = tagData.id;
        if (['maize', 'yellow', 'orange', 'lightblue'].includes(color)) {
            removeBtn.classList.add('text-um-text-on-maize', 'hover:text-red-700');
        } else {
            removeBtn.classList.add('text-gray-300', 'hover:text-white');
        }
    }
    
    return span;
}

async function addRichTagFromModal() {
    if (!currentRoomIdForModal) return;
    
    // Check authentication
    if (!window.workspaceCollaboration?.collaborationState?.isAuthenticated) {
        showAuthRequiredModal();
        return;
    }
    
    const name = elements.tagNameInput?.value?.trim() || '';
    if (!name) { 
        alert('Please enter a tag name.'); 
        return; 
    }

    const type = elements.tagTypeSelect?.value || 'simple';
    const description = elements.tagDescriptionInput?.value?.trim() || '';
    const link = elements.tagLinkInput?.value?.trim() || '';
    const contact = elements.tagContactInput?.value?.trim() || '';
    const imageUrl = elements.tagImageInput?.value?.trim() || '';
    const selectedColorEl = document.querySelector('#custom-tag-modal .color-option.selected');
    const color = selectedColorEl ? selectedColorEl.dataset.color : 'blue';
    
    const shareToWorkspace = document.getElementById('share-to-workspace-checkbox')?.checked || false;
    
    const newRichTag = createRichTag(name, type, description, link, contact, imageUrl, color);

    if (!state.customTags[currentRoomIdForModal]) state.customTags[currentRoomIdForModal] = [];
    if (state.customTags[currentRoomIdForModal].some(tag => tag.name.toLowerCase() === newRichTag.name.toLowerCase())) {
        alert(`A tag with the name "${newRichTag.name}" already exists for this room.`); 
        return;
    }
    
    // Add to local state first
    state.customTags[currentRoomIdForModal].push(newRichTag);
    
    // Save to workspace if user chose to share AND connected
    if (shareToWorkspace && window.workspaceCollaboration?.collaborationState?.isOnline) {
        console.log('🔄 Sharing tag to workspace...', newRichTag);
        
        try {
            const success = await window.workspaceCollaboration.saveTagToWorkspace(currentRoomIdForModal, newRichTag);
            
            if (success === true) {
                // Mark as workspace tag
                newRichTag.workspace = true;
                newRichTag.created_by = window.workspaceCollaboration.collaborationState.userProfile?.full_name || 
                                       window.workspaceCollaboration.collaborationState.currentUser?.email;
                console.log('✅ Tag shared to workspace successfully');
                
                const workspaceName = window.workspaceCollaboration.collaborationState.currentWorkspace?.name;
                showNotification(`✅ Tag "${newRichTag.name}" shared with "${workspaceName}"`);
            } else {
                console.error('❌ Failed to share tag to workspace');
                showNotification('Failed to share tag to workspace. Tag saved locally only.', 'warning');
            }
        } catch (error) {
            console.error('❌ Error sharing tag to workspace:', error);
            showNotification('Error sharing tag to workspace: ' + error.message, 'error');
        }
    } else if (shareToWorkspace && !window.workspaceCollaboration?.collaborationState?.isOnline) {
        showNotification('Not connected to workspace. Tag saved locally only.', 'warning');
    }
    
    clearTagForm();
    updateCustomTagsModalDisplay();
}

function clearTagForm() {
    if (elements.tagNameInput) elements.tagNameInput.value = '';
    if (elements.tagDescriptionInput) elements.tagDescriptionInput.value = '';
    if (elements.tagLinkInput) elements.tagLinkInput.value = '';
    if (elements.tagContactInput) elements.tagContactInput.value = '';
    if (elements.tagImageInput) elements.tagImageInput.value = '';
    if (elements.tagTypeSelect) elements.tagTypeSelect.value = 'simple';
    document.querySelectorAll('#custom-tag-modal .color-option').forEach(opt => opt.classList.remove('selected'));
    const defaultColorOption = document.querySelector('#custom-tag-modal .color-option[data-color="blue"]');
    if (defaultColorOption) defaultColorOption.classList.add('selected');
    if (elements.imagePreviewContainer) elements.imagePreviewContainer.classList.add('hidden');
    if (elements.imagePreview) elements.imagePreview.src = '';
}

async function saveCustomTagsFromModal() {
    closeTagModal();
    state.currentPage = 1;
    await createSearchIndex();
    await updateResults();
}

async function removeCustomTag(tagId, roomId) {
    if (!roomId || !tagId) return;
    
    const roomTags = state.customTags[roomId];
    if (!roomTags) return;
    
    const tagIndex = roomTags.findIndex(tag => tag.id.toString() === tagId.toString());
    if (tagIndex === -1) return;
    
    const tagToRemove = roomTags[tagIndex];
    
    // Remove from workspace if it's a workspace tag
    if (tagToRemove.workspace && window.workspaceCollaboration?.collaborationState?.isOnline) {
        try {
            const success = await window.workspaceCollaboration.removeTagFromWorkspace(roomId, tagToRemove);
            if (success) {
                showNotification(`🗑️ Tag "${tagToRemove.name}" removed from workspace`);
            }
        } catch (error) {
            console.error('Failed to delete tag from workspace:', error);
        }
    }
    
    // Remove from local state
    roomTags.splice(tagIndex, 1);
    updateCustomTagsModalDisplay();
}

// --- PAGINATION FUNCTIONS ---
function goToPage(pageNumber) {
    const totalItems = state.currentFilteredData.length;
    if (state.resultsPerPage === 0 && pageNumber !== 1) return;
    const totalPages = (state.resultsPerPage === 0) ? 1 : Math.ceil(totalItems / state.resultsPerPage);
    if (pageNumber >= 1 && pageNumber <= totalPages) {
        state.currentPage = pageNumber;
        updateResults();
    }
}

// --- EVENT LISTENERS SETUP ---
function setupEventListeners() {
    // View switching
    if (elements.selectDesktopViewBtn) elements.selectDesktopViewBtn.addEventListener('click', () => setViewMode('desktop', true));
    if (elements.selectMobileViewBtn) elements.selectMobileViewBtn.addEventListener('click', () => setViewMode('mobile', true));
    if (elements.viewSwitchBtn) elements.viewSwitchBtn.addEventListener('click', () => setViewMode(state.currentViewMode === 'desktop' ? 'mobile' : 'desktop'));

    // Upload section
    if (elements.uploadHeader) elements.uploadHeader.addEventListener('click', toggleUploadSection);

    // Authentication event listeners
    if (document.getElementById('google-sign-in-btn')) {
        document.getElementById('google-sign-in-btn').addEventListener('click', async () => {
            await window.workspaceCollaboration.signInWithGoogle();
        });
    }

    if (document.getElementById('auth-modal-sign-in-btn')) {
        document.getElementById('auth-modal-sign-in-btn').addEventListener('click', async () => {
            await window.workspaceCollaboration.signInWithGoogle();
        });
    }

    if (document.getElementById('sign-out-btn')) {
        document.getElementById('sign-out-btn').addEventListener('click', async () => {
            await window.workspaceCollaboration.signOut();
        });
    }

    // User profile management
    if (document.getElementById('user-profile-btn')) {
        document.getElementById('user-profile-btn').addEventListener('click', showUserProfileModal);
    }

    if (document.getElementById('close-profile-modal')) {
        document.getElementById('close-profile-modal').addEventListener('click', hideUserProfileModal);
    }

    if (document.getElementById('close-profile-btn')) {
        document.getElementById('close-profile-btn').addEventListener('click', hideUserProfileModal);
    }

    if (document.getElementById('save-profile-btn')) {
        document.getElementById('save-profile-btn').addEventListener('click', saveUserProfile);
    }

    // Workspace collaboration event listeners
    if (elements.collaborationBtn) {
        elements.collaborationBtn.addEventListener('click', handleCollaborationButtonClick);
    }
    
    // Workspace selection modal
    if (document.getElementById('close-workspace-selection-btn')) {
        document.getElementById('close-workspace-selection-btn').addEventListener('click', hideWorkspaceSelectionModal);
    }
    if (document.getElementById('create-workspace-btn')) {
        document.getElementById('create-workspace-btn').addEventListener('click', showCreateWorkspaceModal);
    }
    if (document.getElementById('join-workspace-btn')) {
        document.getElementById('join-workspace-btn').addEventListener('click', showJoinWorkspaceModal);
    }
    
    // Create workspace modal
    if (document.getElementById('close-create-workspace-btn')) {
        document.getElementById('close-create-workspace-btn').addEventListener('click', hideCreateWorkspaceModal);
    }
    if (document.getElementById('create-workspace-cancel-btn')) {
        document.getElementById('create-workspace-cancel-btn').addEventListener('click', hideCreateWorkspaceModal);
    }
    if (document.getElementById('create-workspace-confirm-btn')) {
        document.getElementById('create-workspace-confirm-btn').addEventListener('click', createWorkspace);
    }
    
    // Join workspace modal
    if (document.getElementById('close-join-workspace-btn')) {
        document.getElementById('close-join-workspace-btn').addEventListener('click', hideJoinWorkspaceModal);
    }
    if (document.getElementById('join-workspace-cancel-btn')) {
        document.getElementById('join-workspace-cancel-btn').addEventListener('click', hideJoinWorkspaceModal);
    }
    if (document.getElementById('join-workspace-confirm-btn')) {
        document.getElementById('join-workspace-confirm-btn').addEventListener('click', joinWorkspace);
    }
    
    // Modal click-outside handlers
    const workspaceSelectionModal = document.getElementById('workspace-selection-modal');
    if (workspaceSelectionModal) {
        workspaceSelectionModal.addEventListener('click', (e) => {
            if (e.target === workspaceSelectionModal) hideWorkspaceSelectionModal();
        });
    }
    
    const createWorkspaceModal = document.getElementById('create-workspace-modal');
    if (createWorkspaceModal) {
        createWorkspaceModal.addEventListener('click', (e) => {
            if (e.target === createWorkspaceModal) hideCreateWorkspaceModal();
        });
    }
    
    const joinWorkspaceModal = document.getElementById('join-workspace-modal');
    if (joinWorkspaceModal) {
        joinWorkspaceModal.addEventListener('click', (e) => {
            if (e.target === joinWorkspaceModal) hideJoinWorkspaceModal();
        });
    }

    const userProfileModal = document.getElementById('user-profile-modal');
    if (userProfileModal) {
        userProfileModal.addEventListener('click', (e) => {
            if (e.target === userProfileModal) hideUserProfileModal();
        });
    }

    // Auth required modal click outside to close
    const authRequiredModal = document.getElementById('auth-required-modal');
    if (authRequiredModal) {
        authRequiredModal.addEventListener('click', (e) => {
            if (e.target === authRequiredModal) {
                authRequiredModal.classList.add('hidden');
            }
        });
    }

    // Upload functionality - check authentication
    const uploadArea = elements.universalUploadArea;
    const uploadInput = elements.universalUploadInput;
    if (uploadArea && uploadInput) {
        uploadArea.addEventListener('click', (e) => {
            if (!window.workspaceCollaboration?.collaborationState?.isAuthenticated) {
                showAuthRequiredModal();
                return;
            }
            if (e.target === uploadArea || e.target.closest('#upload-content-normal') || e.target.closest('#upload-content-empty')) {
                uploadInput.click();
            }
        });
        
        uploadArea.addEventListener('dragover', (e) => {
            if (!window.workspaceCollaboration?.collaborationState?.isAuthenticated) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            e.preventDefault(); 
            e.stopPropagation(); 
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', (e) => { 
            e.preventDefault(); 
            e.stopPropagation(); 
            uploadArea.classList.remove('dragover'); 
        });
        
        uploadArea.addEventListener('drop', (e) => { 
            e.preventDefault(); 
            e.stopPropagation(); 
            uploadArea.classList.remove('dragover');
            
            if (!window.workspaceCollaboration?.collaborationState?.isAuthenticated) {
                showAuthRequiredModal();
                return;
            }
            
            handleFiles(e.dataTransfer.files);
        });
        
        uploadInput.addEventListener('change', (e) => {
            if (!window.workspaceCollaboration?.collaborationState?.isAuthenticated) {
                showAuthRequiredModal();
                return;
            }
            handleFiles(e.target.files);
        });
    }

    // Export functionality - check authentication
    if (elements.exportTagsBtn) {
        elements.exportTagsBtn.addEventListener('click', (e) => { 
            e.stopPropagation();
            if (!window.workspaceCollaboration?.collaborationState?.isAuthenticated) {
                showAuthRequiredModal();
                return;
            }
            exportCustomTags();
        });
    }
    
    if (elements.exportSessionBtn) {
        elements.exportSessionBtn.addEventListener('click', (e) => { 
            e.stopPropagation();
            if (!window.workspaceCollaboration?.collaborationState?.isAuthenticated) {
                showAuthRequiredModal();
                return;
            }
            showMgisComplianceModal();
        });
    }

    // MGIS compliance modal
    if (elements.closeMgisModal) elements.closeMgisModal.addEventListener('click', hideMgisComplianceModal);
    if (elements.mgisComplianceModal) elements.mgisComplianceModal.addEventListener('click', (e) => { if (e.target === elements.mgisComplianceModal) hideMgisComplianceModal(); });
    if (elements.mgisComplianceCheckbox) elements.mgisComplianceCheckbox.addEventListener('change', (e) => { elements.mgisExportConfirmBtn.disabled = !e.target.checked; });
    if (elements.mgisCancelBtn) elements.mgisCancelBtn.addEventListener('click', hideMgisComplianceModal);
    if (elements.mgisExportConfirmBtn) elements.mgisExportConfirmBtn.addEventListener('click', () => { hideMgisComplianceModal(); exportSession(); });

    // Search functionality - add authentication check
    const debouncedSearch = debounce(() => { 
        if (!window.workspaceCollaboration?.collaborationState?.isAuthenticated) {
            showAuthRequiredModal();
            return;
        }
        state.currentPage = 1; 
        updateResults(); 
    }, 350);

    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', (e) => {
            if (!window.workspaceCollaboration?.collaborationState?.isAuthenticated) {
                showAuthRequiredModal();
                e.target.blur();
                return;
            }
            state.searchQuery = e.target.value;
            if (elements.searchInputMobile) elements.searchInputMobile.value = state.searchQuery;
            updateAutocomplete(state.searchQuery);
            debouncedSearch();
        });
        elements.searchInput.addEventListener('keydown', handleAutocompleteKeydown);
        elements.searchInput.addEventListener('blur', () => setTimeout(hideAutocomplete, 150));
    }
    
    if (elements.searchForm) elements.searchForm.addEventListener('submit', (e) => e.preventDefault());
    
    if (elements.searchInputMobile) {
        elements.searchInputMobile.addEventListener('input', (e) => {
            if (!window.workspaceCollaboration?.collaborationState?.isAuthenticated) {
                showAuthRequiredModal();
                e.target.blur();
                return;
            }
            state.searchQuery = e.target.value;
            if (elements.searchInput) elements.searchInput.value = state.searchQuery;
            debouncedSearch();
        });
    }
    
    if (elements.autocompleteContainer) {
        elements.autocompleteContainer.addEventListener('mousedown', (e) => {
            const item = e.target.closest('[role="option"]');
            if (item) {
                e.preventDefault();
                const selectedValue = item.dataset.item;
                elements.searchInput.value = selectedValue;
                if (elements.searchInputMobile) elements.searchInputMobile.value = selectedValue;
                state.searchQuery = selectedValue;
                hideAutocomplete();
                state.currentPage = 1;
                updateResults();
            }
        });
    }

    // Filter functionality
    ['building', 'floor'].forEach(filterType => {
        const desktopEl = elements[`${filterType}Filter`];
        const mobileEl = elements[`${filterType}FilterMobile`];
        if (desktopEl) desktopEl.addEventListener('change', (e) => { state.activeFilters[filterType] = e.target.value; if (mobileEl) mobileEl.value = e.target.value; state.currentPage = 1; updateResults(); });
        if (mobileEl) mobileEl.addEventListener('change', (e) => { state.activeFilters[filterType] = e.target.value; if (desktopEl) desktopEl.value = e.target.value; state.currentPage = 1; updateResults(); });
    });

    [elements.tagFilter, elements.tagFilterMobile].forEach(el => {
        if (el) el.addEventListener('change', (e) => {
            const selectedTag = e.target.value;
            if (selectedTag && !state.activeFilters.tags.includes(selectedTag)) { state.activeFilters.tags.push(selectedTag); state.currentPage = 1; updateResults(); }
            e.target.value = '';
            if (elements.tagFilter) elements.tagFilter.value = '';
            if (elements.tagFilterMobile) elements.tagFilterMobile.value = '';
        });
    });

    if (elements.activeTagsContainer) elements.activeTagsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action="remove-tag"]');
        if (btn) { state.activeFilters.tags = state.activeFilters.tags.filter(t => t !== btn.dataset.tag); state.currentPage = 1; updateResults(); }
    });
    
    if (elements.clearTagsBtn) elements.clearTagsBtn.addEventListener('click', () => { state.activeFilters.tags = []; state.currentPage = 1; updateResults(); });

    [elements.resultsPerPage, elements.resultsPerPageMobile].forEach(el => {
        if (el) el.addEventListener('change', (e) => {
            state.resultsPerPage = parseInt(e.target.value, 10);
            if (elements.resultsPerPage) elements.resultsPerPage.value = e.target.value;
            if (elements.resultsPerPageMobile) elements.resultsPerPageMobile.value = e.target.value;
            state.currentPage = 1; updateResults();
        });
    });

    // Pagination
    if (elements.prevPageBtn) elements.prevPageBtn.addEventListener('click', () => goToPage(state.currentPage - 1));
    if (elements.nextPageBtn) elements.nextPageBtn.addEventListener('click', () => goToPage(state.currentPage + 1));

    // Other modals
    if (elements.closeSecurityModal) elements.closeSecurityModal.addEventListener('click', hideSecurityReminder);
    if (elements.securityOkBtn) elements.securityOkBtn.addEventListener('click', hideSecurityReminder);
    if (elements.closeWelcomeBtn) elements.closeWelcomeBtn.addEventListener('click', hideWelcomeModal);
    if (elements.welcomeOkBtn) elements.welcomeOkBtn.addEventListener('click', hideWelcomeModal);
    if (elements.closeTagInfoBtn) elements.closeTagInfoBtn.addEventListener('click', () => { if (elements.tagInfoModal) elements.tagInfoModal.classList.add('hidden'); });
    if (elements.tagInfoModal) elements.tagInfoModal.addEventListener('click', (e) => { if (e.target === elements.tagInfoModal) elements.tagInfoModal.classList.add('hidden'); });
    if (elements.closeModalBtn) elements.closeModalBtn.addEventListener('click', closeTagModal);
    if (elements.addRichTagBtn) elements.addRichTagBtn.addEventListener('click', addRichTagFromModal);
    if (elements.saveTagsBtn) elements.saveTagsBtn.addEventListener('click', saveCustomTagsFromModal);
    if (elements.customTagModal) elements.customTagModal.addEventListener('click', (e) => { if (e.target === elements.customTagModal) closeTagModal(); });
    if (elements.customTagsListModal) elements.customTagsListModal.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-action="remove-custom-tag"]');
        if (btn && currentRoomIdForModal) { 
            await removeCustomTag(btn.dataset.tagId, currentRoomIdForModal);
        }
    });
    if (elements.tagNameInput) elements.tagNameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addRichTagFromModal(); }});

    // Tag buttons delegation
    function delegateAddTag(event) {
        const button = event.target.closest('[data-action="add-tag"]');
        if (button) { 
            const roomId = button.dataset.id; 
            if (roomId) handleAddTagClick(roomId); 
        }
    }
    if (elements.resultsBody) elements.resultsBody.addEventListener('click', delegateAddTag);
    if (elements.mobileResults) elements.mobileResults.addEventListener('click', delegateAddTag);

    // Color picker
    const colorPicker = document.querySelector('#custom-tag-modal .color-picker');
    if (colorPicker) colorPicker.addEventListener('click', (e) => {
        if (e.target.classList.contains('color-option')) { 
            colorPicker.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected')); 
            e.target.classList.add('selected'); 
        }
    });
    
    // Image preview
    if (elements.tagImageInput && elements.imagePreview && elements.imagePreviewContainer) {
        elements.tagImageInput.addEventListener('input', (e) => {
            const url = e.target.value.trim();
            if (url) { 
                elements.imagePreview.src = url; 
                elements.imagePreview.onload = () => elements.imagePreviewContainer.classList.remove('hidden'); 
                elements.imagePreview.onerror = () => elements.imagePreviewContainer.classList.add('hidden'); 
            } else {
                elements.imagePreviewContainer.classList.add('hidden');
            }
        });
    }
}

// Initialize workspace collaboration with authentication
async function initializeWorkspaceCollaboration() {
    if (window.workspaceCollaboration) {
        const initialized = await window.workspaceCollaboration.initializeSupabase();
        if (initialized) {
            console.log('✅ Workspace collaboration system ready with authentication');
            
            // Update UI based on initial auth state
            updateAuthenticationUI();
        }
    }
}

// Make these functions global for external access
window.updateAuthenticationUI = updateAuthenticationUI;
window.showAuthRequiredModal = showAuthRequiredModal;
window.updateCollaborationUI = updateCollaborationUI;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    const elementIds = [
      'upload-header', 'upload-content-section', 'chevron-icon', 'universal-upload-area', 'universal-upload-input',
      'upload-content-normal', 'upload-content-empty',
      'processing-indicator', 'uploaded-files-list', 'data-summary', 'summary-content', 'errors-container', 'errors-list',
      'search-form', 'search-input', 'search-input-mobile', 'autocomplete-container',
      'building-filter', 'building-filter-mobile', 'floor-filter', 'floor-filter-mobile',
      'tag-filter', 'tag-filter-mobile', 'results-per-page', 'results-per-page-mobile',
      'active-tags-container', 'clear-tags-btn',
      'results-table', 'results-body',
      'mobile-results', 'empty-state', 'results-footer', 'results-count',
      'export-tags-btn', 'export-session-btn', 'collaboration-btn',
      'collaboration-status', 'online-users',
      'mgis-compliance-modal', 'close-mgis-modal', 'mgis-compliance-checkbox', 'mgis-cancel-btn', 'mgis-export-confirm-btn',
      'security-reminder-modal', 'close-security-modal', 'security-ok-btn', 'dont-show-security-again',
      'welcome-modal', 'close-welcome-btn', 'welcome-ok-btn', 'dont-show-again',
      'tag-info-modal', 'close-tag-info-btn', 'tag-info-title', 'tag-info-content',
      'custom-tag-modal', 'close-modal-btn', 'modal-room-info', 'tag-name-input', 'tag-type-select',
      'tag-description-input', 'tag-link-input', 'tag-contact-input', 'tag-image-input', 'image-preview-container', 'image-preview',
      'add-rich-tag-btn', 'custom-tags-list-modal', 'save-tags-btn',
      'loading-overlay', 'row-template', 'mobile-card-template', 'tag-span-template', 'autocomplete-item-template',
      'active-tag-template', 'custom-tag-item-template',
      'pagination-controls', 'prev-page-btn', 'page-info', 'next-page-btn',
      'view-selection-modal', 'select-desktop-view-btn', 'select-mobile-view-btn',
      'view-switch-btn', 'view-switch-icon-MOBILE-ICON', 'view-switch-icon-DESKTOP-ICON',
      'desktop-search-section', 'mobile-search-section'
    ];
    
    elementIds.forEach(id => {
        const camelCaseId = id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        elements[camelCaseId] = document.getElementById(id);
    });
    
    elements.viewSwitchIconMobilePhone = document.getElementById('view-switch-icon-MOBILE-ICON');
    elements.viewSwitchIconDesktopMonitor = document.getElementById('view-switch-icon-DESKTOP-ICON');

    console.log('🏥 Hospital Room Directory - Enhanced UMich Version with Authentication Initialized');
    
    if (localStorage.getItem('hideWelcomeModal') === 'true') state.hideWelcomeModal = true;
    if (elements.resultsPerPage) elements.resultsPerPage.value = state.resultsPerPage.toString();
    if (elements.resultsPerPageMobile) elements.resultsPerPageMobile.value = state.resultsPerPage.toString();

    setupEventListeners();
    initializeAppView();
    
    // Don't show welcome modal immediately - wait for auth state
    setTimeout(() => {
        if (!state.hideWelcomeModal) {
            showWelcomeModal();
        }
    }, 1000);
    
    updatePaginationControls(0);
    updateDataSummary();
    updateUploadAreaState();
    
    // Initialize workspace collaboration with authentication
    initializeWorkspaceCollaboration();
    
    // Show auth required modal if not authenticated after initialization
    setTimeout(() => {
        if (!window.workspaceCollaboration?.collaborationState?.isAuthenticated) {
            const authRequiredModal = document.getElementById('auth-required-modal');
            if (authRequiredModal) {
                authRequiredModal.classList.remove('hidden');
            }
        }
    }, 2000);
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (window.workspaceCollaboration) {
            window.workspaceCollaboration.leaveWorkspace();
        }
    });
});
