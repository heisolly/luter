import { supabase } from '../src/supabaseClient'

// Create or update a share for a material
export const createMaterialShare = async (materialId, userId, isPublic = true, expiresAt = null) => {
  try {
    const { data, error } = await supabase.rpc('create_material_share', {
      p_material_id: materialId,
      p_user_id: userId,
      p_is_public: isPublic,
      p_expires_at: expiresAt
    })

    if (error) throw error

    // Get the share token
    const { data: shareData, error: shareError } = await supabase
      .from('material_shares')
      .select('share_token')
      .eq('id', data)
      .single()

    if (shareError) throw shareError

    return {
      shareId: data,
      shareToken: shareData.share_token,
      shareUrl: `${window.location.origin}/shared/${shareData.share_token}`
    }
  } catch (error) {
    console.error('Error creating material share:', error)
    throw error
  }
}

// Get material by share token (for public preview)
export const getMaterialByShareToken = async (shareToken) => {
  try {
    const { data, error } = await supabase.rpc('get_material_by_share_token', {
      p_share_token: shareToken
    })

    if (error) throw error

    return data[0] // Returns array, get first item
  } catch (error) {
    console.error('Error getting material by share token:', error)
    throw error
  }
}

// Get user's material shares
export const getUserMaterialShares = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('material_shares')
      .select(`
        *,
        materials (
          id,
          title,
          file_name,
          type,
          file_size,
          processing_status,
          created_at
        )
      `)
      .eq('shared_by_user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data.map(share => ({
      ...share,
      shareUrl: `${window.location.origin}/shared/${share.share_token}`,
      materials: share.materials
    }))
  } catch (error) {
    console.error('Error getting user material shares:', error)
    throw error
  }
}

// Update share settings
export const updateMaterialShare = async (shareId, updates) => {
  try {
    const { data, error } = await supabase
      .from('material_shares')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', shareId)
      .select()
      .single()

    if (error) throw error

    return {
      ...data,
      shareUrl: `${window.location.origin}/shared/${data.share_token}`
    }
  } catch (error) {
    console.error('Error updating material share:', error)
    throw error
  }
}

// Delete a share
export const deleteMaterialShare = async (shareId) => {
  try {
    const { error } = await supabase
      .from('material_shares')
      .delete()
      .eq('id', shareId)

    if (error) throw error

    return true
  } catch (error) {
    console.error('Error deleting material share:', error)
    throw error
  }
}

// Record share access
export const recordShareAccess = async (shareId, accessType, userId = null, ipAddress = null, userAgent = null) => {
  try {
    await supabase.rpc('record_share_access', {
      p_share_id: shareId,
      p_access_type: accessType,
      p_user_id: userId,
      p_ip_address: ipAddress,
      p_user_agent: userAgent
    })
  } catch (error) {
    console.error('Error recording share access:', error)
    // Don't throw error for access tracking
  }
}

// Add material from share to user's collection
export const addMaterialFromShare = async (shareId, userId) => {
  try {
    const { data, error } = await supabase.rpc('add_material_from_share', {
      p_share_id: shareId,
      p_user_id: userId
    })

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error adding material from share:', error)
    throw error
  }
}

// Get share analytics
export const getShareAnalytics = async (shareId) => {
  try {
    const { data: share, error: shareError } = await supabase
      .from('material_shares')
      .select('*')
      .eq('id', shareId)
      .single()

    if (shareError) throw shareError

    const { data: access, error: accessError } = await supabase
      .from('material_share_access')
      .select('*')
      .eq('share_id', shareId)
      .order('created_at', { ascending: false })

    if (accessError) throw accessError

    return {
      ...share,
      shareUrl: `${window.location.origin}/shared/${share.share_token}`,
      access: access,
      analytics: {
        totalViews: share.view_count,
        totalDownloads: share.download_count,
        totalSignups: share.signup_count,
        recentAccess: access.slice(0, 10)
      }
    }
  } catch (error) {
    console.error('Error getting share analytics:', error)
    throw error
  }
}

// Check if user can access share
export const canAccessShare = async (shareToken, userId = null) => {
  try {
    const { data, error } = await supabase
      .from('material_shares')
      .select('*')
      .eq('share_token', shareToken)
      .single()

    if (error) return { canAccess: false, reason: 'Share not found' }

    // Check if share is public
    if (!data.is_public) {
      return { canAccess: false, reason: 'Share is not public' }
    }

    // Check if share has expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { canAccess: false, reason: 'Share has expired' }
    }

    return { canAccess: true, share: data }
  } catch (error) {
    return { canAccess: false, reason: 'Error checking access' }
  }
}
