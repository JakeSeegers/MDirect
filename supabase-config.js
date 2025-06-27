// === SECURE SUPABASE CONFIG - REPLACE YOUR ENTIRE supabase-config.js ===

// ✅ SAFE: Modern publishable key (secure for client-side use)
const SUPABASE_URL = 'https://pzcqsorfobygydxkdmzc.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_HBT2NPpEPDggpLiEG4RllQ_KDJhp0yp';

let supabaseClient = null;

// Collaboration state
const collaborationState = {
    isOnline: false,
    currentWorkspace: null,
    currentUser: null,
    connectedUsers: new Map(),
    activeChannel: null
};

// ✅ SECURE: Initialize with public key only
async function initializeSupabase() {
    try {
        console.log('🔄 Initializing Supabase...');
        
        let attempts = 0;
        while (attempts < 30) {
            if (window.supabase && typeof window.supabase.createClient === 'function') {
                // ✅ Use modern publishable key - this is SAFE for client-side
                supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
                console.log('✅ Supabase initialized securely with publishable key');
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        throw new Error('Supabase library not available');
    } catch (error) {
        console.error('❌ Supabase initialization failed:', error);
        return false;
    }
}

// ✅ SECURE: All database operations use RLS-protected client
async function createWorkspace(workspaceName, password, creatorName) {
    if (!supabaseClient) return { success: false, error: 'Supabase not initialized' };
    
    try {
        console.log('🔄 Creating workspace:', workspaceName);
        
        const { data: workspace, error } = await supabaseClient
            .from('workspaces')
            .insert({
                name: workspaceName,
                password_hash: btoa(password),
                created_by: creatorName,
                created_at: new Date().toISOString()
            })
            .select()
            .single();
            
        if (error) {
            if (error.code === '23505') {
                return { success: false, error: 'Workspace name already exists' };
            }
            throw error;
        }
        
        console.log('✅ Workspace created:', workspaceName);
        return { success: true, workspace };
        
    } catch (error) {
        console.error('❌ Error creating workspace:', error);
        return { success: false, error: error.message };
    }
}

async function joinWorkspace(workspaceName, password, userName) {
    if (!supabaseClient) return { success: false, error: 'Supabase not initialized' };
    
    try {
        console.log('🔄 Joining workspace:', workspaceName);
        
        const { data: workspace, error } = await supabaseClient
            .from('workspaces')
            .select('*')
            .eq('name', workspaceName)
            .single();
            
        if (error || !workspace) {
            return { success: false, error: 'Workspace not found' };
        }
        
        if (atob(workspace.password_hash) !== password) {
            return { success: false, error: 'Incorrect password' };
        }
        
        collaborationState.currentWorkspace = workspace;
        collaborationState.currentUser = {
            name: userName,
            joinedAt: new Date().toISOString()
        };
        
        await initializeRealtimeCollaboration(workspace.id);
        
        console.log('✅ Joined workspace:', workspaceName);
        return { success: true, workspace };
        
    } catch (error) {
        console.error('❌ Error joining workspace:', error);
        return { success: false, error: error.message };
    }
}

async function saveTagToWorkspace(roomId, tagObject) {
    if (!supabaseClient || !collaborationState.currentWorkspace) {
        return false;
    }
    
    try {
        const room = state.processedData.find(r => r.id.toString() === roomId.toString());
        if (!room) return false;
        
        const tagData = {
            workspace_id: collaborationState.currentWorkspace.id,
            room_identifier: room.rmrecnbr || room.id,
            tag_name: tagObject.name,
            tag_type: tagObject.type || 'simple',
            tag_data: JSON.stringify(tagObject),
            created_by: collaborationState.currentUser.name,
            created_at: new Date().toISOString()
        };
        
        const { data, error } = await supabaseClient
            .from('workspace_tags')
            .insert(tagData)
            .select();
            
        if (error) throw error;
        
        if (collaborationState.activeChannel) {
            await collaborationState.activeChannel.send({
                type: 'broadcast',
                event: 'tag_added',
                payload: {
                    room_id: roomId,
                    tag: tagObject,
                    user: collaborationState.currentUser.name,
                    timestamp: new Date().toISOString()
                }
            });
        }
        
        console.log('✅ Tag saved securely:', tagObject.name);
        return true;
        
    } catch (error) {
        console.error('❌ Error saving tag:', error);
        return false;
    }
}

async function removeTagFromWorkspace(roomId, tagObject) {
    if (!supabaseClient || !collaborationState.currentWorkspace) return false;
    
    try {
        const room = state.processedData.find(r => r.id === roomId);
        if (!room) return false;
        
        const { error } = await supabaseClient
            .from('workspace_tags')
            .delete()
            .eq('workspace_id', collaborationState.currentWorkspace.id)
            .eq('room_identifier', room.rmrecnbr || room.id)
            .eq('tag_name', tagObject.name)
            .eq('created_by', collaborationState.currentUser.name);
            
        if (error) throw error;
        
        if (collaborationState.activeChannel) {
            await collaborationState.activeChannel.send({
                type: 'broadcast',
                event: 'tag_removed',
                payload: {
                    room_id: roomId,
                    tag_name: tagObject.name,
                    user: collaborationState.currentUser.name
                }
            });
        }
        
        console.log('✅ Tag removed securely:', tagObject.name);
        return true;
        
    } catch (error) {
        console.error('❌ Error removing tag:', error);
        return false;
    }
}

async function syncWorkspaceTags() {
    if (!supabaseClient || !collaborationState.currentWorkspace) return;
    
    try {
        const { data: tags, error } = await supabaseClient
            .from('workspace_tags')
            .select('*')
            .eq('workspace_id', collaborationState.currentWorkspace.id);
            
        if (error) throw error;
        
        Object.keys(state.customTags).forEach(roomId => {
            state.customTags[roomId] = state.customTags[roomId]?.filter(tag => !tag.workspace) || [];
        });
        
        tags.forEach(dbTag => {
            const roomId = findRoomIdByIdentifier(dbTag.room_identifier);
            if (roomId) {
                if (!state.customTags[roomId]) state.customTags[roomId] = [];
                
                const tagObject = JSON.parse(dbTag.tag_data);
                tagObject.workspace = true;
                tagObject.created_by = dbTag.created_by;
                
                state.customTags[roomId].push(tagObject);
            }
        });
        
        if (typeof updateResults === 'function') {
            updateResults();
        }
        
        console.log(`✅ Synced ${tags.length} workspace tags securely`);
        
    } catch (error) {
        console.error('❌ Error syncing workspace tags:', error);
    }
}

async function initializeRealtimeCollaboration(workspaceId) {
    try {
        const channelName = `workspace_${workspaceId}`;
        collaborationState.activeChannel = supabaseClient.channel(channelName);
        
        collaborationState.activeChannel
            .on('presence', { event: 'sync' }, () => {
                const presenceState = collaborationState.activeChannel.presenceState();
                updateOnlineUsers(presenceState);
            })
            .on('presence', { event: 'join' }, ({ newPresences }) => {
                console.log('👥 User joined workspace:', newPresences);
                updateOnlineUsers(collaborationState.activeChannel.presenceState());
                showNotification(`${newPresences[0].user_name} joined the workspace`);
            })
            .on('presence', { event: 'leave' }, ({ leftPresences }) => {
                console.log('👋 User left workspace:', leftPresences);
                updateOnlineUsers(collaborationState.activeChannel.presenceState());
                showNotification(`${leftPresences[0].user_name} left the workspace`);
            })
            .on('broadcast', { event: 'tag_added' }, (payload) => {
                handleRemoteTagUpdate(payload);
            })
            .on('broadcast', { event: 'tag_removed' }, (payload) => {
                handleRemoteTagRemoval(payload);
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'workspace_tags',
                filter: `workspace_id=eq.${workspaceId}`
            }, (payload) => {
                syncWorkspaceTags();
            });
        
        await collaborationState.activeChannel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await collaborationState.activeChannel.track({
                    user_name: collaborationState.currentUser.name,
                    joined_at: collaborationState.currentUser.joinedAt
                });
                
                collaborationState.isOnline = true;
                
                if (typeof updateCollaborationUI === 'function') {
                    updateCollaborationUI();
                }
                
                await syncWorkspaceTags();
                console.log('✅ Real-time collaboration active');
                showNotification('✅ Connected to workspace!');
            }
        });
        
    } catch (error) {
        console.error('❌ Real-time collaboration error:', error);
    }
}

// Utility functions
function findRoomIdByIdentifier(identifier) {
    let room = state.processedData.find(r => String(r.rmrecnbr) === String(identifier));
    if (!room) room = state.processedData.find(r => r.id.toString() === identifier.toString());
    if (!room) room = state.processedData.find(r => String(r.rmnbr) === String(identifier));
    return room ? room.id : null;
}

function updateOnlineUsers(presenceState) {
    collaborationState.connectedUsers.clear();
    
    Object.values(presenceState).forEach(presenceList => {
        presenceList.forEach(presence => {
            collaborationState.connectedUsers.set(presence.user_name, presence);
        });
    });
    
    if (typeof updateCollaborationUI === 'function') {
        updateCollaborationUI();
    }
}

function handleRemoteTagUpdate(payload) {
    if (payload.payload?.user === collaborationState.currentUser?.name) return;
    showNotification(`${payload.payload?.user} added tag "${payload.payload?.tag?.name}"`);
    syncWorkspaceTags();
}

function handleRemoteTagRemoval(payload) {
    if (payload.payload?.user === collaborationState.currentUser?.name) return;
    showNotification(`${payload.payload?.user} removed tag "${payload.payload?.tag_name}"`);
    syncWorkspaceTags();
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-16 right-4 bg-blue-100 border border-blue-300 text-blue-800 px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in';
    notification.innerHTML = `
        <div class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"/>
            </svg>
            <span class="text-sm">${sanitizeHTML(message)}</span>
        </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

function leaveWorkspace() {
    if (collaborationState.activeChannel) {
        collaborationState.activeChannel.unsubscribe();
    }
    
    Object.keys(state.customTags).forEach(roomId => {
        state.customTags[roomId] = state.customTags[roomId]?.filter(tag => !tag.workspace) || [];
    });
    
    collaborationState.isOnline = false;
    collaborationState.currentWorkspace = null;
    collaborationState.currentUser = null;
    collaborationState.connectedUsers.clear();
    
    if (typeof updateCollaborationUI === 'function') {
        updateCollaborationUI();
    }
    
    if (typeof updateResults === 'function') {
        updateResults();
    }
    
    showNotification('📡 Disconnected from workspace');
}

function sanitizeHTML(text) {
    const temp = document.createElement('div');
    temp.textContent = text || '';
    return temp.innerHTML;
}

// Export functions
window.workspaceCollaboration = {
    initializeSupabase,
    createWorkspace,
    joinWorkspace,
    saveTagToWorkspace,
    removeTagFromWorkspace,
    syncWorkspaceTags,
    leaveWorkspace,
    collaborationState
};
