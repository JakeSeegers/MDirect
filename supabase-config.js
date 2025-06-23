// === UPDATED SUPABASE CONFIG WITH AUTHENTICATION ===

// 🔧 REPLACE THESE WITH YOUR ACTUAL VALUES
const SUPABASE_URL = 'https://pzcqsorfobygydxkdmzc.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'YOUR_ACTUAL_ANON_KEY_HERE'; // Replace with your anon key

let supabaseClient = null;

// Enhanced collaboration state with authentication
const collaborationState = {
    isOnline: false,
    currentWorkspace: null,
    currentUser: null,
    userProfile: null,
    connectedUsers: new Map(),
    activeChannel: null,
    isAuthenticated: false
};

// ✅ Initialize Supabase with authentication
async function initializeSupabase() {
    try {
        console.log('🔄 Initializing Supabase with authentication...');
        
        let attempts = 0;
        while (attempts < 30) {
            if (window.supabase && typeof window.supabase.createClient === 'function') {
                supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
                
                // Set up auth state listener
                supabaseClient.auth.onAuthStateChange(async (event, session) => {
                    console.log('🔐 Auth state changed:', event, session?.user?.email);
                    
                    if (event === 'SIGNED_IN' && session) {
                        await handleUserSignIn(session.user);
                    } else if (event === 'SIGNED_OUT') {
                        handleUserSignOut();
                    }
                });
                
                // Check if user is already signed in
                const { data: { session } } = await supabaseClient.auth.getSession();
                if (session) {
                    await handleUserSignIn(session.user);
                }
                
                console.log('✅ Supabase initialized with authentication');
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

// Handle user sign in
async function handleUserSignIn(user) {
    console.log('👤 User signed in:', user.email);
    
    // Check if email is from umich.edu
    if (!isUMichEmail(user.email)) {
        console.warn('⚠️ Non-UMich email detected:', user.email);
        await supabaseClient.auth.signOut();
        alert('Please use your University of Michigan email address (@umich.edu or @med.umich.edu)');
        return;
    }
    
    collaborationState.currentUser = user;
    collaborationState.isAuthenticated = true;
    
    // Get or create user profile
    await getOrCreateUserProfile(user);
    
    // Update UI
    if (typeof updateAuthenticationUI === 'function') {
        updateAuthenticationUI();
    }
}

// Handle user sign out
function handleUserSignOut() {
    console.log('👋 User signed out');
    
    // Leave any active workspace
    if (collaborationState.isOnline) {
        leaveWorkspace();
    }
    
    // Clear state
    collaborationState.currentUser = null;
    collaborationState.userProfile = null;
    collaborationState.isAuthenticated = false;
    
    // Update UI
    if (typeof updateAuthenticationUI === 'function') {
        updateAuthenticationUI();
    }
}

// Get or create user profile
async function getOrCreateUserProfile(user) {
    try {
        const { data: profile, error } = await supabaseClient
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
        if (error && error.code !== 'PGRST116') { // Not found error
            throw error;
        }
        
        if (profile) {
            collaborationState.userProfile = profile;
            console.log('✅ User profile loaded:', profile.full_name);
        } else {
            // Profile doesn't exist, it should be created by the database trigger
            console.log('⏳ Waiting for user profile creation...');
            
            // Wait a moment for the trigger to create the profile
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Try again
            const { data: newProfile } = await supabaseClient
                .from('user_profiles')
                .select('*')
                .eq('id', user.id)
                .single();
                
            collaborationState.userProfile = newProfile;
            console.log('✅ User profile created:', newProfile?.full_name);
        }
    } catch (error) {
        console.error('❌ Error handling user profile:', error);
    }
}

// Check if email is from UMich
function isUMichEmail(email) {
    return email.endsWith('@umich.edu') || email.endsWith('@med.umich.edu');
}

// Sign in with Google
async function signInWithGoogle() {
    if (!supabaseClient) {
        console.error('❌ Supabase not initialized');
        return { success: false, error: 'Supabase not initialized' };
    }
    
    try {
        console.log('🔐 Initiating Google sign-in...');
        
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
        
        if (error) throw error;
        
        console.log('🔄 Redirecting to Google...');
        return { success: true };
        
    } catch (error) {
        console.error('❌ Google sign-in error:', error);
        return { success: false, error: error.message };
    }
}

// Sign out
async function signOut() {
    if (!supabaseClient) return;
    
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        
        console.log('✅ Signed out successfully');
        
    } catch (error) {
        console.error('❌ Sign out error:', error);
    }
}

// Enhanced workspace functions with authentication

async function createWorkspace(workspaceName, description = '') {
    if (!supabaseClient || !collaborationState.isAuthenticated) {
        return { success: false, error: 'Not authenticated' };
    }
    
    try {
        console.log('🔄 Creating workspace:', workspaceName);
        
        const { data: workspace, error } = await supabaseClient
            .from('workspaces')
            .insert({
                name: workspaceName,
                description: description,
                created_by: collaborationState.currentUser.id,
                settings: {}
            })
            .select()
            .single();
            
        if (error) {
            if (error.code === '23505') {
                return { success: false, error: 'Workspace name already exists' };
            }
            throw error;
        }
        
        // Add creator as owner
        await supabaseClient
            .from('workspace_members')
            .insert({
                workspace_id: workspace.id,
                user_id: collaborationState.currentUser.id,
                role: 'owner'
            });
        
        console.log('✅ Workspace created:', workspaceName);
        return { success: true, workspace };
        
    } catch (error) {
        console.error('❌ Error creating workspace:', error);
        return { success: false, error: error.message };
    }
}

async function joinWorkspace(workspaceName) {
    if (!supabaseClient || !collaborationState.isAuthenticated) {
        return { success: false, error: 'Not authenticated' };
    }
    
    try {
        console.log('🔄 Joining workspace:', workspaceName);
        
        // Find workspace
        const { data: workspace, error: workspaceError } = await supabaseClient
            .from('workspaces')
            .select('*')
            .eq('name', workspaceName)
            .single();
            
        if (workspaceError || !workspace) {
            return { success: false, error: 'Workspace not found' };
        }
        
        // Check if already a member
        const { data: existingMember } = await supabaseClient
            .from('workspace_members')
            .select('*')
            .eq('workspace_id', workspace.id)
            .eq('user_id', collaborationState.currentUser.id)
            .single();
            
        if (!existingMember) {
            // Add as member
            await supabaseClient
                .from('workspace_members')
                .insert({
                    workspace_id: workspace.id,
                    user_id: collaborationState.currentUser.id,
                    role: 'member'
                });
        }
        
        collaborationState.currentWorkspace = workspace;
        
        await initializeRealtimeCollaboration(workspace.id);
        
        console.log('✅ Joined workspace:', workspaceName);
        return { success: true, workspace };
        
    } catch (error) {
        console.error('❌ Error joining workspace:', error);
        return { success: false, error: error.message };
    }
}

async function saveTagToWorkspace(roomId, tagObject) {
    if (!supabaseClient || !collaborationState.currentWorkspace || !collaborationState.isAuthenticated) {
        return false;
    }
    
    try {
        const room = state.processedData.find(r => r.id.toString() === roomId.toString());
        if (!room) return false;
        
        const tagData = {
            workspace_id: collaborationState.currentWorkspace.id,
            created_by: collaborationState.currentUser.id,
            room_identifier: room.rmrecnbr || room.id,
            tag_name: tagObject.name,
            tag_type: tagObject.type || 'simple',
            tag_data: JSON.stringify(tagObject)
        };
        
        const { data, error } = await supabaseClient
            .from('workspace_tags')
            .insert(tagData)
            .select();
            
        if (error) throw error;
        
        // Log activity
        await supabaseClient.rpc('log_user_activity', {
            p_workspace_id: collaborationState.currentWorkspace.id,
            p_action: 'tag_created',
            p_details: { tag_name: tagObject.name, room_id: roomId }
        });
        
        if (collaborationState.activeChannel) {
            await collaborationState.activeChannel.send({
                type: 'broadcast',
                event: 'tag_added',
                payload: {
                    room_id: roomId,
                    tag: tagObject,
                    user: collaborationState.userProfile?.full_name || collaborationState.currentUser.email,
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
    if (!supabaseClient || !collaborationState.currentWorkspace || !collaborationState.isAuthenticated) {
        return false;
    }
    
    try {
        const room = state.processedData.find(r => r.id === roomId);
        if (!room) return false;
        
        const { error } = await supabaseClient
            .from('workspace_tags')
            .delete()
            .eq('workspace_id', collaborationState.currentWorkspace.id)
            .eq('room_identifier', room.rmrecnbr || room.id)
            .eq('tag_name', tagObject.name)
            .eq('created_by', collaborationState.currentUser.id);
            
        if (error) throw error;
        
        // Log activity
        await supabaseClient.rpc('log_user_activity', {
            p_workspace_id: collaborationState.currentWorkspace.id,
            p_action: 'tag_deleted',
            p_details: { tag_name: tagObject.name, room_id: roomId }
        });
        
        if (collaborationState.activeChannel) {
            await collaborationState.activeChannel.send({
                type: 'broadcast',
                event: 'tag_removed',
                payload: {
                    room_id: roomId,
                    tag_name: tagObject.name,
                    user: collaborationState.userProfile?.full_name || collaborationState.currentUser.email
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
            .select(`
                *,
                created_by_profile:user_profiles!workspace_tags_created_by_fkey(full_name)
            `)
            .eq('workspace_id', collaborationState.currentWorkspace.id);
            
        if (error) throw error;
        
        // Clear existing workspace tags
        Object.keys(state.customTags).forEach(roomId => {
            state.customTags[roomId] = state.customTags[roomId]?.filter(tag => !tag.workspace) || [];
        });
        
        // Add workspace tags
        tags.forEach(dbTag => {
            const roomId = findRoomIdByIdentifier(dbTag.room_identifier);
            if (roomId) {
                if (!state.customTags[roomId]) state.customTags[roomId] = [];
                
                const tagObject = JSON.parse(dbTag.tag_data);
                tagObject.workspace = true;
                tagObject.created_by = dbTag.created_by_profile?.full_name || 'Team member';
                tagObject.workspace_tag_id = dbTag.id;
                
                state.customTags[roomId].push(tagObject);
            }
        });
        
        if (typeof updateResults === 'function') {
            updateResults();
        }
        
        console.log(`✅ Synced ${tags.length} workspace tags`);
        
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
                showNotification(`${newPresences[0]?.user_name || 'Someone'} joined the workspace`);
            })
            .on('presence', { event: 'leave' }, ({ leftPresences }) => {
                console.log('👋 User left workspace:', leftPresences);
                updateOnlineUsers(collaborationState.activeChannel.presenceState());
                showNotification(`${leftPresences[0]?.user_name || 'Someone'} left the workspace`);
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
                    user_name: collaborationState.userProfile?.full_name || collaborationState.currentUser.email,
                    joined_at: new Date().toISOString()
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
    const currentUserName = collaborationState.userProfile?.full_name || collaborationState.currentUser?.email;
    if (payload.payload?.user === currentUserName) return;
    
    showNotification(`${payload.payload?.user} added tag "${payload.payload?.tag?.name}"`);
    syncWorkspaceTags();
}

function handleRemoteTagRemoval(payload) {
    const currentUserName = collaborationState.userProfile?.full_name || collaborationState.currentUser?.email;
    if (payload.payload?.user === currentUserName) return;
    
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
    
    // Clear workspace tags from local state
    Object.keys(state.customTags).forEach(roomId => {
        state.customTags[roomId] = state.customTags[roomId]?.filter(tag => !tag.workspace) || [];
    });
    
    collaborationState.isOnline = false;
    collaborationState.currentWorkspace = null;
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

// Export functions - Make sure they're available globally
window.workspaceCollaboration = {
    initializeSupabase,
    signInWithGoogle,
    signOut,
    createWorkspace,
    joinWorkspace,
    saveTagToWorkspace,
    removeTagFromWorkspace,
    syncWorkspaceTags,
    leaveWorkspace,
    collaborationState,
    supabaseClient // Export this too for profile functions
};

// Also make individual functions available for debugging
window.signInWithGoogle = signInWithGoogle;
window.signOut = signOut;
