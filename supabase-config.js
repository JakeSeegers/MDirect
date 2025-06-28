// === COMPLETE SUPABASE CONFIG - FIXED VERSION ===

// Your actual Supabase values
const SUPABASE_URL = 'https://pzcqsorfobygydxkdmzc.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_HBT2NPpEPDggpLiEG4RllQ_KDJhp0yp';

let supabaseClient = null;

// Collaboration state
const collaborationState = {
    isAuthenticated: false,
    isOnline: false,
    currentWorkspace: null,
    currentUser: null,
    connectedUsers: new Map(),
    activeChannel: null
};

// Initialize Supabase
async function initializeSupabase() {
    try {
        console.log('🔄 Initializing Supabase...');
        
        let attempts = 0;
        while (attempts < 30) {
            if (window.supabase && typeof window.supabase.createClient === 'function') {
                supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
                
                // Check for existing session
                const session = await supabaseClient.auth.getSession();
                if (session.data && session.data.session) {
                    await handleAuthSuccess(session.data.session.user);
                }
                
                // Listen for auth changes
                supabaseClient.auth.onAuthStateChange(async (event, session) => {
                    if (event === 'SIGNED_IN' && session) {
                        await handleAuthSuccess(session.user);
                    } else if (event === 'SIGNED_OUT') {
                        handleAuthSignOut();
                    }
                });
                
                console.log('✅ Supabase initialized securely');
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

// Handle successful authentication
async function handleAuthSuccess(user) {
    console.log('✅ User authenticated:', user.email);
    
    // Check if email is from umich.edu (OPTIONAL - comment out if causing issues)
    if (!user.email.endsWith('@umich.edu') && !user.email.endsWith('@med.umich.edu')) {
        console.warn('⚠️ Non-UMich email detected:', user.email);
        // alert('Please use your University of Michigan email address (@umich.edu)');
        // await signOut();
        // return;
    }
    
    collaborationState.isAuthenticated = true;
    collaborationState.currentUser = user;
    
    // Create/update user profile
    await createOrUpdateUserProfile(user);
    
    // Update UI
    if (typeof window.updateAuthenticationUI === 'function') {
        window.updateAuthenticationUI();
    }
    
    // Hide auth modal
    const authModal = document.getElementById('auth-required-modal');
    if (authModal) {
        authModal.classList.add('hidden');
    }
    
    console.log('🎉 Authentication complete for:', user.email);
}

// Handle sign out
function handleAuthSignOut() {
    console.log('👋 User signed out');
    
    collaborationState.isAuthenticated = false;
    collaborationState.currentUser = null;
    collaborationState.isOnline = false;
    collaborationState.currentWorkspace = null;
    
    // Clean up realtime connections
    if (collaborationState.activeChannel) {
        collaborationState.activeChannel.unsubscribe();
        collaborationState.activeChannel = null;
    }
    
    // Update UI
    if (typeof window.updateAuthenticationUI === 'function') {
        window.updateAuthenticationUI();
    }
    
    // Show auth modal
    const authModal = document.getElementById('auth-required-modal');
    if (authModal) {
        authModal.classList.remove('hidden');
    }
}

// Create or update user profile
async function createOrUpdateUserProfile(user) {
    try {
        const profileData = {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata && user.user_metadata.full_name ? user.user_metadata.full_name : user.email,
            avatar_url: user.user_metadata && user.user_metadata.avatar_url ? user.user_metadata.avatar_url : null,
            updated_at: new Date().toISOString()
        };
        
        const { data, error } = await supabaseClient
            .from('user_profiles')
            .upsert(profileData)
            .select();
            
        if (error) {
            console.error('❌ Error creating user profile:', error);
        } else {
            console.log('✅ User profile updated');
        }
    } catch (error) {
        console.error('❌ Profile update error:', error);
    }
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
                redirectTo: window.location.origin + window.location.pathname
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
        
        console.log('✅ Sign out successful');
        return { success: true };
        
    } catch (error) {
        console.error('❌ Sign out error:', error);
        return { success: false, error: error.message };
    }
}

// Create workspace
async function createWorkspace(workspaceName, description, creatorName) {
    if (!supabaseClient || !collaborationState.isAuthenticated) {
        return { success: false, error: 'Not authenticated' };
    }
    
    try {
        console.log('🔄 Creating workspace:', workspaceName);
        
        const { data: workspace, error } = await supabaseClient
            .from('workspaces')
            .insert({
                name: workspaceName,
                description: description || '',
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
        const { error: memberError } = await supabaseClient
            .from('workspace_members')
            .insert({
                workspace_id: workspace.id,
                user_id: collaborationState.currentUser.id,
                role: 'owner'
            });
            
        if (memberError) throw memberError;
        
        console.log('✅ Workspace created:', workspaceName);
        return { success: true, workspace };
        
    } catch (error) {
        console.error('❌ Error creating workspace:', error);
        return { success: false, error: error.message };
    }
}

// Join workspace (FIXED - handles both old and new function signatures)
async function joinWorkspace(workspaceName, password, userName) {
    if (!supabaseClient || !collaborationState.isAuthenticated) {
        return { success: false, error: 'Not authenticated' };
    }
    
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
        
        // Check if already a member
        const { data: existingMember } = await supabaseClient
            .from('workspace_members')
            .select('*')
            .eq('workspace_id', workspace.id)
            .eq('user_id', collaborationState.currentUser.id)
            .single();
            
        if (!existingMember) {
            // Add as member
            const { error: memberError } = await supabaseClient
                .from('workspace_members')
                .insert({
                    workspace_id: workspace.id,
                    user_id: collaborationState.currentUser.id,
                    role: 'member'
                });
                
            if (memberError) throw memberError;
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

// Save tag to workspace
async function saveTagToWorkspace(roomId, tagObject) {
    if (!supabaseClient || !collaborationState.currentWorkspace || !collaborationState.isAuthenticated) {
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
            created_by: collaborationState.currentUser.id
        };
        
        const { data, error } = await supabaseClient
            .from('workspace_tags')
            .insert(tagData)
            .select();
            
        if (error) throw error;
        
        console.log('✅ Tag saved to workspace:', tagObject.name);
        return true;
        
    } catch (error) {
        console.error('❌ Error saving tag:', error);
        return false;
    }
}

// Remove tag from workspace (WITH CREATOR CHECK POPUP)
async function removeTagFromWorkspace(roomId, tagObject) {
    if (!supabaseClient || !collaborationState.currentWorkspace || !collaborationState.isAuthenticated) {
        return false;
    }
    
    try {
        const room = state.processedData.find(r => r.id.toString() === roomId.toString());
        if (!room) return false;
        
        // 🔍 First, check who created this tag
        const { data: existingTags, error: checkError } = await supabaseClient
            .from('workspace_tags')
            .select('created_by')
            .eq('workspace_id', collaborationState.currentWorkspace.id)
            .eq('room_identifier', room.rmrecnbr || room.id)
            .eq('tag_name', tagObject.name);
            
        if (checkError) throw checkError;
        
        if (existingTags && existingTags.length > 0) {
            const tagCreatorId = existingTags[0].created_by;
            const currentUserId = collaborationState.currentUser.id;
            
            // 🚨 Show popup if trying to delete someone else's tag
            if (tagCreatorId !== currentUserId) {
                // Get creator's profile for friendly name
                const { data: creatorProfile } = await supabaseClient
                    .from('user_profiles')
                    .select('full_name, email')
                    .eq('id', tagCreatorId)
                    .single();
                
                const creatorName = creatorProfile ? 
                    (creatorProfile.full_name || creatorProfile.email) : 
                    'another user';
                
                const confirmMessage = `⚠️ This tag was created by "${creatorName}"\n\nAre you sure you want to delete their tag "${tagObject.name}"?`;
                
                if (!(await customConfirm(confirmMessage))) {
                    console.log('❌ Tag deletion cancelled by user');
                    return false;
                }
                
                console.log(`🔄 User confirmed deletion of ${creatorName}'s tag`);
            }
        }
        
        // 🗑️ Proceed with deletion
        const { error } = await supabaseClient
            .from('workspace_tags')
            .delete()
            .eq('workspace_id', collaborationState.currentWorkspace.id)
            .eq('room_identifier', room.rmrecnbr || room.id)
            .eq('tag_name', tagObject.name);
            
        if (error) throw error;
        
        console.log('✅ Tag removed from workspace:', tagObject.name);
        return true;
        
    } catch (error) {
        console.error('❌ Error removing tag:', error);
        return false;
    }
}

// Initialize realtime collaboration
async function initializeRealtimeCollaboration(workspaceId) {
    try {
        const channelName = 'workspace_' + workspaceId;
        collaborationState.activeChannel = supabaseClient.channel(channelName);
        
        collaborationState.activeChannel
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'workspace_tags',
                filter: 'workspace_id=eq.' + workspaceId
            }, (payload) => {
                console.log('📡 Workspace tag changed:', payload);
                syncWorkspaceTags();
            });
        
        await collaborationState.activeChannel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                collaborationState.isOnline = true;
                console.log('✅ Real-time collaboration active');
                syncWorkspaceTags();
            }
        });
        
    } catch (error) {
        console.error('❌ Real-time collaboration error:', error);
    }
}

// Sync workspace tags
async function syncWorkspaceTags() {
    if (!supabaseClient || !collaborationState.currentWorkspace) return;
    
    try {
        const { data: tags, error } = await supabaseClient
            .from('workspace_tags')
            .select('*')
            .eq('workspace_id', collaborationState.currentWorkspace.id);
            
        if (error) throw error;
        
        // Clear existing workspace tags
        Object.keys(state.customTags).forEach(roomId => {
            state.customTags[roomId] = state.customTags[roomId] ? state.customTags[roomId].filter(tag => !tag.workspace) : [];
        });
        
        // Add workspace tags
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
        
        // Update UI
        if (typeof updateResults === 'function') {
            updateResults();
        }
        
        console.log('✅ Synced workspace tags:', tags.length);
        
    } catch (error) {
        console.error('❌ Error syncing workspace tags:', error);
    }
}

// Helper function to find room by identifier
function findRoomIdByIdentifier(identifier) {
    let room = state.processedData.find(r => String(r.rmrecnbr) === String(identifier));
    if (!room) room = state.processedData.find(r => r.id.toString() === identifier.toString());
    if (!room) room = state.processedData.find(r => String(r.rmnbr) === String(identifier));
    return room ? room.id : null;
}

// Leave workspace
function leaveWorkspace() {
    if (collaborationState.activeChannel) {
        collaborationState.activeChannel.unsubscribe();
    }
    
    // Clear workspace tags
    Object.keys(state.customTags).forEach(roomId => {
        state.customTags[roomId] = state.customTags[roomId] ? state.customTags[roomId].filter(tag => !tag.workspace) : [];
    });
    
    collaborationState.isOnline = false;
    collaborationState.currentWorkspace = null;
    collaborationState.connectedUsers.clear();
    
    // Update UI
    if (typeof updateCollaborationUI === 'function') {
        updateCollaborationUI();
    }
    
    if (typeof updateResults === 'function') {
        updateResults();
    }
    
    console.log('📡 Left workspace');
}

// Simple function to get supabase client
function getSupabaseClient() {
    return supabaseClient;
}

// FIXED EXPORTS - Use getter for supabaseClient to avoid stale references
window.workspaceCollaboration = {
    collaborationState: collaborationState,
    initializeSupabase: initializeSupabase,
    signInWithGoogle: signInWithGoogle,
    signOut: signOut,
    createWorkspace: createWorkspace,
    joinWorkspace: joinWorkspace,
    leaveWorkspace: leaveWorkspace,
    saveTagToWorkspace: saveTagToWorkspace,
    removeTagFromWorkspace: removeTagFromWorkspace,
    syncWorkspaceTags: syncWorkspaceTags,
    initializeRealtimeCollaboration: initializeRealtimeCollaboration,
    get supabaseClient() { return supabaseClient; }, // ✅ FIXED: Use getter
    getSupabaseClient: getSupabaseClient
};
