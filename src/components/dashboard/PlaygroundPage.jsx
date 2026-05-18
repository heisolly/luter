import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOutletContext } from 'react-router-dom'
import { motion } from 'framer-motion'
import { RiSwordFill as Sword, RiGroupFill as Users, RiMagicFill as Sparkles, RiRocketFill as Rocket, RiTrophyFill as Trophy } from 'react-icons/ri'

export default function PlaygroundPage() {
  const { user, isMobile } = useOutletContext()
  const navigate = useNavigate()
  const [selectedGame, setSelectedGame] = useState(null)

  const games = [
    {
      id: 'brain-blitz',
      name: 'Brain Blitz',
      description: 'Rapid-fire quiz battles with friends',
      icon: <Sparkles />,
      color: '#7a12cc',
      route: '/compete'
    },
    {
      id: 'term-builder',
      name: 'Term Builder',
      description: 'Construct knowledge word by word',
      icon: <Rocket />,
      color: '#3b82f6',
      route: '/compete'
    },
    {
      id: 'matching',
      name: 'Memory Match',
      description: 'Find pairs and test your recall',
      icon: <Trophy />,
      color: '#10b981',
      route: '/compete'
    },
    {
      id: 'stacker',
      name: 'Knowledge Stacker',
      description: 'Build towers of learning',
      icon: <Sword />,
      color: '#f59e0b',
      route: '/compete'
    }
  ]

  return (
    <div style={{ 
      minHeight: '100vh',
      background: '#fff',
      padding: isMobile ? '24px 20px 80px' : '48px 40px',
      fontFamily: "'Outfit', 'Varela Round', sans-serif"
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ maxWidth: 1200, margin: '0 auto' }}
      >
        <div style={{ marginBottom: 48 }}>
          <h1 style={{ 
            fontSize: isMobile ? 36 : 48, 
            fontWeight: 800, 
            color: '#111', 
            margin: 0,
            letterSpacing: '-0.04em'
          }}>
            Luter Playground
          </h1>
          <p style={{ 
            fontSize: isMobile ? 16 : 18, 
            color: '#64748b', 
            margin: '8px 0 0',
            fontWeight: 500
          }}>
            Challenge friends and test your knowledge with AI-powered games
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 24
        }}>
          {games.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate(game.route)}
              style={{
                background: 'white',
                borderRadius: 24,
                padding: 32,
                border: '2px solid #f1f5f9',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
              }}
              whileHover={{ 
                transform: 'translateY(-4px)',
                borderColor: game.color,
                boxShadow: `0 12px 24px ${game.color}20`
              }}
            >
              <div style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: `${game.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
                color: game.color
              }}>
                <div style={{ fontSize: 32 }}>
                  {game.icon}
                </div>
              </div>

              <h3 style={{ 
                fontSize: 20, 
                fontWeight: 700, 
                color: '#111', 
                margin: '0 0 8px'
              }}>
                {game.name}
              </h3>
              
              <p style={{ 
                fontSize: 14, 
                color: '#64748b', 
                margin: 0,
                lineHeight: 1.5
              }}>
                {game.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            marginTop: 48,
            padding: 32,
            background: 'linear-gradient(135deg, #7a12cc10 0%, #3b82f610 100%)',
            borderRadius: 24,
            border: '2px solid #7a12cc20',
            textAlign: 'center'
          }}
        >
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
            color: '#7a12cc',
            fontSize: 14,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>
            <Users size={20} />
            Multiplayer Ready
          </div>
          <h3 style={{ 
            fontSize: 24, 
            fontWeight: 800, 
            color: '#111', 
            margin: '0 0 12px'
          }}>
            Challenge Your Friends
          </h3>
          <p style={{ 
            fontSize: 16, 
            color: '#64748b', 
            margin: '0 0 24px',
            maxWidth: 500,
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Create a room and invite your classmates to compete in real-time battles
          </p>
          <button
            onClick={() => navigate('/compete')}
            style={{
              padding: '16px 32px',
              background: '#7a12cc',
              color: 'white',
              border: 'none',
              borderRadius: 16,
              fontSize: 16,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(122, 18, 204, 0.3)',
              transition: 'all 0.2s'
            }}
          >
            Start Battle
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}
