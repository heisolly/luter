import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { motion } from 'framer-motion'
import { RiShoppingCartLine, RiCoinLine, RiGiftLine, RiFlashlightLine, RiPaletteLine, RiVipCrownLine, RiCheckLine, RiShoppingBag3Line } from 'react-icons/ri'
import { supabase } from '../../supabaseClient'
import Header from '../shared/Header'

export default function StorePage() {
  const { user, isMobile } = useOutletContext() || {}
  
  const [userCoins, setUserCoins] = useState(0)
  const [storeItems, setStoreItems] = useState([])
  const [userPurchases, setUserPurchases] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [purchaseLoading, setPurchaseLoading] = useState(null)

  const categories = [
    { id: 'all', name: 'All Items', icon: <RiShoppingBag3Line /> },
    { id: 'avatar', name: 'Avatars', icon: <RiGiftLine /> },
    { id: 'boost', name: 'Boosts', icon: <RiFlashlightLine /> },
    { id: 'badge', name: 'Badges', icon: <RiVipCrownLine /> },
    { id: 'theme', name: 'Themes', icon: <RiPaletteLine /> }
  ]

  useEffect(() => {
    if (!user) return
    loadUserData()
    loadStoreItems()
    loadUserPurchases()
  }, [user])

  const loadUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('user_gamification')
        .select('coins')
        .eq('user_id', user.id)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading user coins:', error)
        return
      }
      
      if (data) {
        setUserCoins(data.coins || 0)
      } else {
        // Create initial gamification record if it doesn't exist
        await supabase
          .from('user_gamification')
          .insert({
            user_id: user.id,
            level: 1,
            xp: 0,
            coins: 0,
            total_study_time_minutes: 0,
            sessions_completed: 0,
            questions_answered: 0,
            materials_studied: 0
          })
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const loadStoreItems = async () => {
    try {
      const { data, error } = await supabase
        .from('store_items')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true })
      
      if (!error) setStoreItems(data || [])
    } catch (error) {
      console.error('Error loading store items:', error)
    }
  }

  const loadUserPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('user_purchases')
        .select(`
          *,
          item:store_items(*)
        `)
        .eq('user_id', user.id)
        .order('purchase_date', { ascending: false })
      
      if (!error) setUserPurchases(data || [])
    } catch (error) {
      console.error('Error loading user purchases:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (item) => {
    if (userCoins < item.price) {
      alert('Not enough coins!')
      return
    }

    setPurchaseLoading(item.id)
    
    try {
      // Start transaction
      const { data: gamificationData, error: gamifError } = await supabase
        .from('user_gamification')
        .select('coins')
        .eq('user_id', user.id)
        .single()

      if (gamifError) throw gamifError

      if (gamificationData.coins < item.price) {
        alert('Not enough coins!')
        return
      }

      // Deduct coins
      const { error: updateError } = await supabase
        .from('user_gamification')
        .update({
          coins: gamificationData.coins - item.price,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (updateError) throw updateError

      // Record purchase
      const { error: purchaseError } = await supabase
        .from('user_purchases')
        .insert({
          user_id: user.id,
          item_id: item.id,
          coins_spent: item.price,
          purchase_data: item.item_data
        })

      if (purchaseError) throw purchaseError

      // Record coin transaction
      await supabase
        .from('coin_transactions')
        .insert({
          user_id: user.id,
          amount: -item.price,
          balance_after: gamificationData.coins - item.price,
          source: 'purchase',
          source_id: item.id,
          description: `Purchased ${item.name}`
        })

      // Update local state
      setUserCoins(gamificationData.coins - item.price)
      await loadUserPurchases()
      
      alert(`Successfully purchased ${item.name}!`)
      
    } catch (error) {
      console.error('Error making purchase:', error)
      alert('Purchase failed. Please try again.')
    } finally {
      setPurchaseLoading(null)
    }
  }

  const filteredItems = selectedCategory === 'all' 
    ? storeItems 
    : storeItems.filter(item => item.category === selectedCategory)

  const isItemPurchased = (itemId) => {
    return userPurchases.some(purchase => purchase.item_id === itemId && !purchase.is_used)
  }

  const getCategoryIcon = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId)
    return category ? category.icon : <RiShoppingBag3Line />
  }

  const getItemDisplayInfo = (item) => {
    switch (item.category) {
      case 'avatar':
        return {
          icon: '👤',
          color: '#8b5cf6',
          description: 'Customize your profile appearance'
        }
      case 'boost':
        return {
          icon: '⚡',
          color: '#f59e0b',
          description: 'Temporary power-ups for studying'
        }
      case 'badge':
        return {
          icon: '🏆',
          color: '#10b981',
          description: 'Show off your achievements'
        }
      case 'theme':
        return {
          icon: '🎨',
          color: '#3b82f6',
          description: 'Customize your app appearance'
        }
      default:
        return {
          icon: '🎁',
          color: '#64748b',
          description: 'Special items and features'
        }
    }
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        fontFamily: "'Varela Round', sans-serif"
      }}>
        <div>Loading store...</div>
      </div>
    )
  }

  return (
    <div style={{ 
      padding: isMobile ? '24px 16px 80px' : '48px 40px', 
      maxWidth: 1200, 
      margin: '0 auto', 
      fontFamily: "'Varela Round', 'Inter', sans-serif",
      boxSizing: 'border-box',
      color: '#333'
    }}>
      
      {/* Store Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: 40,
          padding: '0 8px'
        }}
      >
        <div>
          <h1 style={{ 
            fontSize: isMobile ? 36 : 48, 
            fontWeight: 800, 
            color: '#111', 
            margin: 0,
            lineHeight: 1.1
          }}>
            Store
          </h1>
          <p style={{ 
            fontSize: isMobile ? 16 : 18, 
            color: '#64748b', 
            margin: '8px 0 0',
            fontWeight: 500
          }}>
            Spend your coins on exclusive items and power-ups
          </p>
        </div>

        {/* Coin Balance */}
        <div style={{
          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
          borderRadius: 16,
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)'
        }}>
          <RiCoinLine size={24} color="white" />
          <div>
            <div style={{ 
              fontSize: isMobile ? 24 : 32, 
              fontWeight: 800, 
              color: 'white',
              lineHeight: 1 
            }}>
              {userCoins}
            </div>
            <div style={{ 
              fontSize: 12, 
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 600
            }}>
              COINS
            </div>
          </div>
        </div>
      </motion.div>

      {/* Category Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ 
          display: 'flex', 
          gap: 8, 
          marginBottom: 32,
          padding: '0 8px',
          overflowX: 'auto',
          scrollbarWidth: 'none'
        }}
      >
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            style={{
              padding: '12px 20px',
              borderRadius: 12,
              border: 'none',
              background: selectedCategory === category.id ? '#111' : '#f1f5f9',
              color: selectedCategory === category.id ? 'white' : '#64748b',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            {category.icon}
            {category.name}
          </button>
        ))}
      </motion.div>

      {/* Store Items Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 24,
          marginBottom: 48
        }}
      >
        {filteredItems.map((item, index) => {
          const displayInfo = getItemDisplayInfo(item)
          const isPurchased = isItemPurchased(item.id)
          const canAfford = userCoins >= item.price
          
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              style={{
                background: 'white',
                borderRadius: 20,
                padding: 24,
                border: '2px solid #f1f5f9',
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                position: 'relative',
                opacity: isPurchased && item.item_type === 'purchase' ? 0.7 : 1
              }}
            >
              {/* Item Badge */}
              {item.is_limited && (
                <div style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  background: '#ef4444',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}>
                  Limited
                </div>
              )}

              {/* Item Icon */}
              <div style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: `${displayInfo.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                marginBottom: 16
              }}>
                {displayInfo.icon}
              </div>

              {/* Item Info */}
              <h3 style={{ 
                fontSize: 18, 
                fontWeight: 700, 
                color: '#111', 
                margin: '0 0 8px',
                lineHeight: 1.3
              }}>
                {item.name}
              </h3>
              
              <p style={{ 
                fontSize: 14, 
                color: '#64748b', 
                margin: '0 0 16px',
                lineHeight: 1.4
              }}>
                {item.description}
              </p>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
                fontSize: 13,
                color: '#94a3b8'
              }}>
                {getCategoryIcon(item.category)}
                <span>{categories.find(cat => cat.id === item.category)?.name}</span>
              </div>

              {/* Price and Purchase */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <RiCoinLine size={16} color="#f59e0b" />
                  <span style={{ 
                    fontSize: 20, 
                    fontWeight: 800, 
                    color: '#111'
                  }}>
                    {item.price}
                  </span>
                </div>

                {isPurchased && item.item_type === 'purchase' ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    background: '#10b981',
                    color: 'white',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600
                  }}>
                    <RiCheckLine />
                    Owned
                  </div>
                ) : (
                  <button
                    onClick={() => handlePurchase(item)}
                    disabled={!canAfford || purchaseLoading === item.id}
                    style={{
                      padding: '8px 16px',
                      background: canAfford ? '#111' : '#e2e8f0',
                      color: canAfford ? 'white' : '#94a3b8',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: canAfford ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.2s'
                    }}
                  >
                    {purchaseLoading === item.id ? (
                      <>Loading...</>
                    ) : (
                      <>
                        <RiShoppingCartLine />
                        {canAfford ? 'Buy' : 'Insufficient'}
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Stock Info */}
              {item.is_limited && item.stock_quantity !== null && (
                <div style={{
                  marginTop: 12,
                  padding: 8,
                  background: '#fef3c7',
                  borderRadius: 6,
                  fontSize: 12,
                  color: '#92400e',
                  textAlign: 'center'
                }}>
                  {item.stock_quantity} left in stock
                </div>
              )}
            </motion.div>
          )
        })}
      </motion.div>

      {/* Purchase History */}
      {userPurchases.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ 
            background: 'white', 
            borderRadius: 20, 
            padding: isMobile ? '24px' : '32px', 
            border: '2px solid #f1f5f9', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
          }}
        >
          <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 24px 0', color: '#111' }}>
            Purchase History
          </h3>
          
          <div style={{
            display: 'grid',
            gap: 12
          }}>
            {userPurchases.slice(0, 10).map((purchase) => (
              <div key={purchase.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 16,
                background: '#f8fafc',
                borderRadius: 12,
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20
                  }}>
                    {getItemDisplayInfo(purchase.item).icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>
                      {purchase.item.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      {new Date(purchase.purchase_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <RiCoinLine size={16} color="#f59e0b" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#f59e0b' }}>
                    -{purchase.coins_spent}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

    </div>
  )
}
