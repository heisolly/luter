import { 
  House, 
  Books, 
  Flask, 
  GameController, 
  Sparkle, 
  Target, 
  Flame, 
  Robot,
  PenNib,
  Lightning,
  Clock,
  Briefcase,
  UsersThree,
  UserCircle,
  MagnifyingGlass,
  Bell,
  GearSix
} from '@phosphor-icons/react'

export const TOURS = {
  'dashboard-home': {
    id: 'dashboard-home',
    title: 'Welcome to Luter',
    steps: [
      {
        target: '#tour-welcome',
        title: 'Your Command Center',
        content: 'Welcome to your personalized dashboard! This is where Luter adapts to your rhythm and tracks your academic growth.',
        image: '/onboard-mascot.png'
      },
      {
        target: '#tour-streak',
        title: 'Maintain Your Momentum',
        content: 'Your study streak tracks your consistency. Study every day to earn bonus XP and climb the leaderboard!',
        icon: Flame
      },
      {
        target: '.dsb-backpack-section',
        title: 'The Backpack',
        content: 'Quickly access all your enrolled courses and personal study materials here.',
        icon: Books
      },
      {
        target: '#tour-upload-btn',
        title: 'Upload Anything',
        content: 'Click here to add PDFs, images, or audio. Luter’s AI will process them into interactive study tools in seconds.',
        icon: Lightning
      }
    ]
  },
  'workstation': {
    id: 'workstation',
    title: 'Master Your Material',
    steps: [
      {
        target: '#tour-material-view',
        title: 'High-Fidelity Reader',
        content: 'Experience your documents like never before. Deep zoom, smart selection, and AI-powered context at your fingertips.',
        image: '/onboard-mascot.png'
      },
      {
        target: '#tour-ai-chat',
        title: 'Your AI Tutor',
        content: 'Have a conversation with your document. Ask complex questions, simplify difficult concepts, or get real-time explanations.',
        icon: Robot
      },
      {
        target: '#tour-ai-tools',
        title: 'AI Synthesis Tools',
        content: 'Instantly generate summaries, structured notes, and practice quizzes from any part of your material.',
        icon: Sparkle
      },
      {
        target: '#tour-voice-mode',
        title: 'Voice Interaction',
        content: 'Studying hands-free? Use Voice Mode to talk to your materials and hear explanations in real-time.',
        icon: PenNib
      }
    ]
  },
  'mock-exam': {
    id: 'mock-exam',
    title: 'Test Your Readiness',
    steps: [
      {
        target: '#tour-exam-setup',
        title: 'Exam Customization',
        content: 'Set your difficulty level, timing, and topic focus to simulate real-world exam conditions.',
        icon: Target
      },
      {
        target: '#tour-exam-engine',
        title: 'Adaptive Testing',
        content: 'Our engine adapts to your performance, focusing on areas where you need the most improvement.',
        icon: Flask
      }
    ]
  },
  'sessions': {
    id: 'sessions',
    title: 'Study Sessions',
    steps: [
      {
        target: '#tour-sessions-header',
        title: 'Your Learning History',
        content: 'Review every hour spent mastering your materials. Luter tracks your focus and consistency over time.',
        image: '/onboard-mascot.png'
      },
      {
        target: '#tour-session-list',
        title: 'Deep Dive',
        content: 'Click on any session to see detailed analytics and mastery progress for that specific study block.',
        icon: Clock
      }
    ]
  },
  'library': {
    id: 'library',
    title: 'The Library',
    steps: [
      {
        target: '#tour-library-header',
        title: 'Your Knowledge Base',
        content: 'Every document you upload is organized here. Filter by course, date, or type to find what you need.',
        image: '/onboard-mascot.png'
      },
      {
        target: '#tour-library-search',
        title: 'Smart Search',
        content: 'Quickly find specific topics or materials across your entire collection using our semantic search.',
        icon: MagnifyingGlass
      }
    ]
  },
  'study-groups': {
    id: 'study-groups',
    title: 'Study Groups',
    steps: [
      {
        target: '#tour-groups-header',
        title: 'Better Together',
        content: 'Collaborate with peers. Share materials, discuss complex topics, and keep each other accountable.',
        image: '/onboard-mascot.png'
      },
      {
        target: '#tour-groups-create',
        title: 'Build Your Squad',
        content: 'Create a private group for your study circle or join public communities focused on your major.',
        icon: UsersThree
      }
    ]
  },
  'streak': {
    id: 'streak',
    title: 'Maintain Your Momentum',
    steps: [
      {
        target: '#tour-streak-calendar',
        title: 'Track Your Habit',
        content: 'Visualise your study days. Keeping the chain alive keeps you ahead.',
        image: '/onboard-mascot.png'
      },
      {
        target: '#tour-streak-reward',
        title: 'Earn Your Perks',
        content: 'Consistent studying unlocks streak bonuses and exclusive leaderboard flair.',
        icon: Flame
      }
    ]
  },
  'backpack': {
    id: 'backpack',
    title: 'The Backpack',
    steps: [
      {
        target: '#tour-backpack-tabs',
        title: 'Dual Perspective',
        content: 'Switch between your official university courses and your private study materials.',
        image: '/onboard-mascot.png'
      },
      {
        target: '#tour-enroll-btn',
        title: 'Expand Your Horizon',
        content: 'Need more courses? Enroll in new modules or import curriculum data directly into your backpack.',
        icon: Briefcase
      }
    ]
  },
  'profile': {
    id: 'profile',
    title: 'Your Profile',
    steps: [
      {
        target: '#tour-profile-card',
        title: 'Academic Identity',
        content: 'This is your home for growth. Track your level, achievements, and academic reputation.',
        image: '/onboard-mascot.png'
      },
      {
        target: '#tour-profile-stats',
        title: 'The Grind',
        content: 'See your total study time, materials mastered, and current rank on the Luter leaderboards.',
        icon: UserCircle
      }
    ]
  },
  'dashboard-nav': {
    id: 'dashboard-nav',
    title: 'Explore Your Navigation',
    steps: [
      {
        target: '#nav-home',
        title: 'Home Base',
        content: 'Your study command center. Return here anytime for your daily roadmap and quick actions.',
        image: '/onboard-mascot.png'
      },
      {
        target: '#nav-sessions',
        title: 'Deep Focus History',
        content: 'Review every hour you spend in deep focus. Luter tracks your mastery over time.',
        icon: Clock
      },
      {
        target: '#nav-library',
        title: 'The Knowledge Vault',
        content: 'Access all your uploaded documents and personal research materials in one organized space.',
        icon: Books
      },
      {
        target: '#nav-study-groups',
        title: 'Collaborative Study',
        content: 'Connect with study squads, share materials, and learn faster together.',
        icon: UsersThree
      },
      {
        target: '#nav-notifications',
        title: 'Stay Notified',
        content: 'Keep track of mentions, group updates, and study reminders right here.',
        icon: Bell
      },
      {
        target: '#nav-backpack',
        title: 'The Backpack',
        content: 'Your core academic modules. All your enrolled courses and their materials live here.',
        icon: Briefcase
      },
      {
        target: '#nav-playground',
        title: 'The Playground',
        content: 'Challenge yourself or compete with peers in our collection of study games.',
        icon: GameController
      },
      {
        target: '#nav-mock-exam',
        title: 'Exam Simulation',
        content: 'Simulate real exam environments with our adaptive testing engine.',
        icon: Flask
      },
      {
        target: '#nav-progress',
        title: 'Progress Tracking',
        content: 'Visualize your growth, XP, and levels as you master your curriculum.',
        icon: Sparkle
      },
      {
        target: '#nav-settings',
        title: 'Customization',
        content: 'Personalize your experience, manage your account, and adjust your study preferences.',
        icon: GearSix
      },
      {
        target: '#nav-profile-card',
        title: 'Your Identity',
        content: 'Customize your profile, track your streak, and see your rank on the leaderboard.',
        image: '/onboard-mascot.png'
      }
    ]
  }
}
