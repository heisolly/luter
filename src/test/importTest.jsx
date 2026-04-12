// Quick import test to verify all modules load correctly
import { getOnboardingCourseSuggestions, saveUserCourseSelections } from '../services/courseSuggestionService'

console.log('✅ courseSuggestionService imports working')

// Test if functions are callable
console.log('getOnboardingCourseSuggestions:', typeof getOnboardingCourseSuggestions)
console.log('saveUserCourseSelections:', typeof saveUserCourseSelections)

export default function ImportTest() {
  return <div>Import test successful!</div>
}
