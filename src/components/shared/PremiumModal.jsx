import { motion, AnimatePresence } from 'framer-motion'
import { X, Crown, Lock, Zap, Star, Check, ArrowRight } from 'lucide-react'

export default function PremiumModal({ 
  isOpen, 
  onClose, 
  course = null, 
  lockedCourses = [], 
  onUpgrade,
  onStartTrial 
}) {
  if (!isOpen) return null

  const benefits = [
    { icon: Lock, text: 'Unlock all your courses', highlighted: true },
    { icon: Zap, text: 'Unlimited AI Summaries' },
    { icon: Star, text: 'Full Quiz Battles' },
    { icon: Crown, text: '30-Min Assignment Solutions' },
  ]

  const isMultipleCourses = lockedCourses.length > 1

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full max-w-md bg-white rounded-3xl border-2 border-gray-900 shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Gold gradient header */}
          <div className="relative bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 p-8 text-center">
            {/* Decorative crown */}
            <div className="absolute top-4 right-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Crown size={24} className="text-yellow-300" fill="currentColor" />
              </motion.div>
            </div>

            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-3 border-white/50">
                <Lock size={36} className="text-white" />
              </div>
            </div>

            <h2 className="text-2xl font-black text-white mb-2">
              {isMultipleCourses ? 'Unlock Your Full Semester!' : 'Unlock This Course!'}
            </h2>
            
            <p className="text-yellow-100 text-sm font-semibold">
              You're on the Free Tier. Upgrade to Luter Premium to access all features.
            </p>
          </div>

          {/* Course info */}
          {(course || lockedCourses.length > 0) && (
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="text-sm font-semibold text-gray-600 mb-2">
                {isMultipleCourses ? 'Locked Courses:' : 'This course is locked:'}
              </div>
              <div className="space-y-1">
                {isMultipleCourses ? (
                  lockedCourses.slice(0, 3).map((lockedCourse, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full" />
                      <span className="font-bold text-gray-900">{lockedCourse.code}</span>
                      <span className="text-gray-600 text-sm">{lockedCourse.name}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full" />
                    <span className="font-bold text-gray-900">{course?.code}</span>
                    <span className="text-gray-600 text-sm">{course?.name}</span>
                  </div>
                )}
                {lockedCourses.length > 3 && (
                  <div className="text-amber-600 font-semibold text-sm">
                    +{lockedCourses.length - 3} more courses
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="px-6 py-6">
            <h3 className="font-black text-gray-900 mb-4 text-center">Premium Benefits</h3>
            <div className="space-y-3">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    benefit.highlighted 
                      ? 'bg-gradient-to-br from-yellow-400 to-amber-500' 
                      : 'bg-gray-100'
                  }`}>
                    <benefit.icon 
                      size={16} 
                      className={benefit.highlighted ? 'text-white' : 'text-gray-700'} 
                    />
                  </div>
                  <span className={`font-semibold ${
                    benefit.highlighted ? 'text-gray-900' : 'text-gray-700'
                  }`}>
                    {benefit.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="px-6 pb-6 space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onUpgrade()
                onClose()
              }}
              className="w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 text-white font-black py-4 px-6 rounded-2xl border-2 border-yellow-600 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Crown size={20} />
              Upgrade to Premium
              <ArrowRight size={16} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onStartTrial()
                onClose()
              }}
              className="w-full bg-gray-900 text-white font-bold py-3 px-6 rounded-xl border border-gray-800 hover:bg-gray-800 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Star size={16} />
              Start 7-Day Free Trial
            </motion.button>

            <button
              onClick={onClose}
              className="w-full text-gray-500 font-semibold py-2 px-4 hover:text-gray-700 transition-colors duration-200"
            >
              Maybe Later
            </button>
          </div>

          {/* Trust indicators */}
          <div className="px-6 pb-4">
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Check size={12} />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-1">
                <Check size={12} />
                <span>Secure payment</span>
              </div>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors duration-200"
          >
            <X size={16} className="text-white" />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
