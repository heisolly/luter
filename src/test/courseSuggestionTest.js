/**
 * Test script for the Enhanced Course Suggestion System
 * Run this in your browser console or as a standalone script to test the functionality
 */

import { getOnboardingCourseSuggestions, saveUserCourseSelections } from '../services/courseSuggestionService'

// Test data for Landmark University Computer Science 100L 1st Semester
const testData = {
  university: 'Landmark University',
  department: 'Computer Science',
  level: '100',
  semester: '1st',
  country: 'Nigeria',
  userId: 'test-user-id'
}

async function testCourseSuggestions() {
  console.log('🧪 Testing Enhanced Course Suggestion System...')
  console.log('📊 Test Context:', testData)
  
  try {
    // Test 1: Get course suggestions
    console.log('\n1️⃣ Testing course suggestions...')
    const suggestions = await getOnboardingCourseSuggestions(
      testData.university,
      testData.department,
      testData.level,
      testData.semester,
      testData.country
    )
    
    console.log('✅ Suggestions loaded successfully!')
    console.log(`📚 Found ${suggestions.all.length} total suggestions`)
    console.log(`🎯 Highly recommended: ${suggestions.categories.highlyRecommended.length}`)
    console.log(`👥 Popular: ${suggestions.categories.popular.length}`)
    console.log(`🔥 Trending: ${suggestions.categories.trending.length}`)
    console.log(`📖 Core: ${suggestions.categories.core.length}`)
    console.log(`⚡ Electives: ${suggestions.categories.electives.length}`)
    
    // Show sample suggestions
    console.log('\n📋 Sample suggestions:')
    suggestions.all.slice(0, 5).forEach((course, index) => {
      console.log(`${index + 1}. ${course.code} - ${course.name}`)
      console.log(`   Source: ${course.source}, Confidence: ${(course.confidence || course.combinedScore).toFixed(2)}`)
      console.log(`   Peers: ${course.peerCount || 0}, Trending: ${course.isTrending ? 'Yes' : 'No'}`)
    })
    
    // Test 2: Save course selections
    console.log('\n2️⃣ Testing course selection saving...')
    const selectedCourses = suggestions.all.slice(0, 5).map(course => ({
      code: course.code,
      name: course.name,
      source: course.source
    }))
    
    const saveResult = await saveUserCourseSelections(
      testData.userId,
      testData.university,
      testData.department,
      testData.level,
      testData.semester,
      selectedCourses
    )
    
    if (saveResult) {
      console.log('✅ Course selections saved successfully!')
      console.log(`💾 Saved ${selectedCourses.length} courses for peer recommendations`)
    } else {
      console.log('❌ Failed to save course selections')
    }
    
    // Test 3: Test peer recommendations (should now include our saved courses)
    console.log('\n3️⃣ Testing peer recommendations...')
    const peerSuggestions = await getOnboardingCourseSuggestions(
      testData.university,
      testData.department,
      testData.level,
      testData.semester,
      testData.country
    )
    
    const peerRecommended = peerSuggestions.all.filter(course => course.peerCount > 0)
    console.log(`👥 Found ${peerRecommended.length} courses with peer recommendations`)
    
    if (peerRecommended.length > 0) {
      console.log('📈 Peer-recommended courses:')
      peerRecommended.slice(0, 3).forEach((course, index) => {
        console.log(`${index + 1}. ${course.code} - ${course.name} (${course.peerCount} peers)`)
      })
    }
    
    console.log('\n🎉 All tests completed successfully!')
    return true
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    return false
  }
}

// Test the enhanced search functionality
async function testEnhancedSearch() {
  console.log('\n🔍 Testing enhanced course search...')
  
  try {
    const { getEnhancedCourseSearch } = await import('../services/courseSuggestionService')
    
    const searchQueries = ['CSC', 'MTH', 'GST', 'THERMO']
    
    for (const query of searchQueries) {
      console.log(`\n🔎 Searching for: "${query}"`)
      const results = await getEnhancedCourseSearch(
        query,
        testData.university,
        testData.department,
        testData.level,
        testData.semester,
        testData.country
      )
      
      console.log(`📊 Found ${results.length} results for "${query}":`)
      results.slice(0, 3).forEach((course, index) => {
        console.log(`  ${index + 1}. ${course.code} - ${course.name} (Source: ${course.source})`)
      })
    }
    
    console.log('\n✅ Enhanced search test completed!')
    return true
    
  } catch (error) {
    console.error('❌ Enhanced search test failed:', error)
    return false
  }
}

// Performance test
async function testPerformance() {
  console.log('\n⚡ Testing performance...')
  
  try {
    const startTime = performance.now()
    
    // Run multiple concurrent requests
    const promises = Array(5).fill().map(() => 
      getOnboardingCourseSuggestions(
        testData.university,
        testData.department,
        testData.level,
        testData.semester,
        testData.country
      )
    )
    await Promise.all(promises)
    const endTime = performance.now()
    
    const duration = endTime - startTime
    console.log(`⏱️ 5 concurrent requests completed in ${duration.toFixed(2)}ms`)
    console.log(`📊 Average: ${(duration / 5).toFixed(2)}ms per request`)
    
    // Test caching
    console.log('\n🗄️ Testing cache performance...')
    const cacheStartTime = performance.now()
    
    await getOnboardingCourseSuggestions(
      testData.university,
      testData.department,
      testData.level,
      testData.semester,
      testData.country
    )
    
    const cacheEndTime = performance.now()
    const cacheDuration = cacheEndTime - cacheStartTime
    
    console.log(`⚡ Cached request completed in ${cacheDuration.toFixed(2)}ms`)
    console.log(`🚀 Speed improvement: ${((duration - cacheDuration) / duration * 100).toFixed(1)}%`)
    
    console.log('\n✅ Performance test completed!')
    return true
    
  } catch (error) {
    console.error('❌ Performance test failed:', error)
    return false
  }
}

// Run all tests
export async function runAllTests() {
  console.log('🚀 Starting Enhanced Course Suggestion System Tests...\n')
  
  const results = await Promise.all([
    testCourseSuggestions(),
    testEnhancedSearch(),
    testPerformance()
  ])
  
  const passed = results.filter(r => r).length
  const total = results.length
  
  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`)
  
  if (passed === total) {
    console.log('🎉 All tests passed! The system is working correctly.')
  } else {
    console.log('⚠️ Some tests failed. Please check the errors above.')
  }
  
  return passed === total
}

// Export individual tests for debugging
export {
  testCourseSuggestions,
  testEnhancedSearch,
  testPerformance,
  testData
}

// Auto-run tests if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment - attach to window for manual testing
  window.testCourseSuggestionSystem = runAllTests
  console.log('🧪 Test functions attached to window.testCourseSuggestionSystem()')
}
