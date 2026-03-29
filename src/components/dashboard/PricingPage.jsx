import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Crown, Lock, Zap, Star, Check, ArrowRight, ArrowLeft, 
  Shield, Sparkles, BookOpen, Trophy, Flame, Users
} from 'lucide-react'
import PremiumModal from '../shared/PremiumModal'
import { supabase } from '../../supabaseClient'

export default function PricingPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
      }
      setLoading(false)
    }
    getUser()
  }, [])

  const handleUpgrade = (plan) => {
    setSelectedPlan(plan)
    setShowPremiumModal(true)
  }

  const handleStartTrial = async () => {
    if (!user) {
      navigate('/signin')
      return
    }

    try {
      const { data, error } = await supabase.rpc('start_free_trial', {
        p_user_id: user.id
      })

      if (error) throw error

      if (data) {
        // Trial started successfully
        navigate('/dashboard')
      } else {
        // Trial already used
        alert('You have already used your free trial. Please upgrade to Premium.')
      }
    } catch (error) {
      console.error('Error starting trial:', error)
      alert('Failed to start trial. Please try again.')
    }
  }

  const handlePurchase = async () => {
    // This would integrate with your payment processor
    // For now, we'll just show a message
    alert('Payment integration coming soon! For now, enjoy the free trial.')
  }

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '₦0',
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        'Access to 20% of your courses',
        '2 AI summaries per day',
        '1 quiz battle per day',
        'Basic progress tracking',
        'Study streak counter'
      ],
      limitations: [
        'Limited course access',
        'Daily feature limits',
        'No assignment solutions'
      ],
      color: 'gray',
      popular: false
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '₦2,000',
      period: 'per semester',
      description: 'Most popular for serious students',
      features: [
        'Unlimited course access',
        'Unlimited AI summaries',
        'Unlimited quiz battles',
        '30-min assignment solutions',
        'Advanced analytics',
        'Priority AI processing',
        'Study with friends',
        'Custom study plans'
      ],
      limitations: [],
      color: 'amber',
      popular: true
    }
  ]

  const testimonials = [
    {
      name: 'Sarah A.',
      course: 'Computer Science',
      text: 'Premium helped me unlock all my courses and the AI summaries saved me hours of study time!',
      rating: 5
    },
    {
      name: 'Michael T.',
      course: 'Engineering',
      text: 'The 30-minute assignment solutions are a game-changer. Worth every naira!',
      rating: 5
    },
    {
      name: 'Chioma E.',
      course: 'Medicine',
      text: 'I went from struggling to top of my class. Luter Premium is my secret weapon.',
      rating: 5
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-amber-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-semibold">Back to Dashboard</span>
            </button>
            
            <div className="flex items-center gap-4">
              {user ? (
                <span className="text-sm text-gray-600">
                  Signed in as {user.user_metadata?.full_name || 'Student'}
                </span>
              ) : (
                <button
                  onClick={() => navigate('/signin')}
                  className="bg-amber-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold mb-6"
          >
            <Crown size={16} />
            Limited Time: 7-Day Free Trial Available
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-gray-900 mb-6"
          >
            Unlock Your Full
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">
              {" "}Academic Potential
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto mb-8"
          >
            Join thousands of Nigerian students who are acing their exams with AI-powered study tools, 
            instant assignment solutions, and smart flashcards.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={() => handleStartTrial()}
              className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-8 py-4 rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
            >
              <Star size={20} />
              Start Free Trial
              <ArrowRight size={18} />
            </button>
            
            <div className="flex items-center gap-2 text-gray-600">
              <Check size={16} className="text-green-500" />
              <span className="text-sm">No credit card required</span>
            </div>
          </motion.div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className={`relative ${
                plan.popular 
                  ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-500 shadow-2xl scale-105' 
                  : 'bg-white border border-gray-200 shadow-lg'
              } rounded-3xl p-8`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-1 rounded-full text-sm font-black">
                    MOST POPULAR
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                  plan.color === 'amber' 
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500' 
                    : 'bg-gray-100'
                }`}>
                  {plan.id === 'premium' ? (
                    <Crown size={28} className="text-white" />
                  ) : (
                    <BookOpen size={28} className={plan.color === 'amber' ? 'text-white' : 'text-gray-600'} />
                  )}
                </div>
                
                <h3 className="text-2xl font-black text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="text-4xl font-black text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
                <p className="text-gray-600">{plan.description}</p>
              </div>

              <div className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start gap-3">
                    <Check size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
                
                {plan.limitations.map((limitation, limitIndex) => (
                  <div key={limitIndex} className="flex items-start gap-3">
                    <Lock size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-500">{limitation}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => plan.id === 'premium' ? handleUpgrade(plan) : navigate('/dashboard')}
                className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-200 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {plan.id === 'premium' ? 'Upgrade Now' : 'Current Plan'}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="mb-20">
          <h2 className="text-3xl font-black text-center text-gray-900 mb-12">
            Everything You Need to Excel
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Sparkles,
                title: 'AI-Powered Learning',
                description: 'Get instant summaries, flashcards, and study notes from your course materials',
                color: 'blue'
              },
              {
                icon: Trophy,
                title: 'Study Battles',
                description: 'Challenge friends and compete in quiz battles to make learning fun',
                color: 'purple'
              },
              {
                icon: Shield,
                title: '30-Min Solutions',
                description: 'Upload any assignment and get step-by-step solutions in 30 minutes',
                color: 'green'
              },
              {
                icon: Users,
                title: 'Study Groups',
                description: 'Connect with classmates and share notes, resources, and study tips',
                color: 'pink'
              },
              {
                icon: Flame,
                title: 'Streak Tracking',
                description: 'Build consistent study habits with our gamified streak system',
                color: 'orange'
              },
              {
                icon: Zap,
                title: 'Lightning Fast',
                description: 'Get instant answers to your questions with our advanced AI',
                color: 'yellow'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200"
              >
                <div className={`w-12 h-12 bg-gradient-to-br from-${feature.color}-400 to-${feature.color}-600 rounded-xl flex items-center justify-center mb-4`}>
                  <feature.icon size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-20">
          <h2 className="text-3xl font-black text-center text-gray-900 mb-12">
            Loved by Nigerian Students
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={16} className="text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.course}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl p-12 text-center text-white"
        >
          <h2 className="text-3xl font-black mb-4">
            Ready to Transform Your Grades?
          </h2>
          <p className="text-xl mb-8 text-amber-100">
            Join thousands of students already acing their exams with Luter Premium
          </p>
          <button
            onClick={() => handleStartTrial()}
            className="bg-white text-amber-600 px-8 py-4 rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl transition-all duration-200 flex items-center gap-2 mx-auto"
          >
            <Star size={20} />
            Start Your 7-Day Free Trial
            <ArrowRight size={18} />
          </button>
        </motion.div>
      </div>

      {/* Premium Modal */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onUpgrade={handlePurchase}
        onStartTrial={handleStartTrial}
      />
    </div>
  )
}
