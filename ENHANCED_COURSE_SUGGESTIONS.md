# Enhanced Course Suggestion System

## Overview

This implementation adds an intelligent course suggestion system to Luter AI that combines:

- **AI-powered recommendations** using Groq language models
- **Peer-based suggestions** from students with similar academic profiles
- **Real-time search** with enhanced matching
- **Smart caching** for performance optimization
- **Beautiful UI** with categorized suggestions and confidence scores

## Features

### 🤖 AI-Powered Suggestions
- Uses multiple Groq prompts to generate contextually relevant courses
- Analyzes university, department, level, and semester to provide accurate suggestions
- Includes trending courses and industry-relevant recommendations
- Confidence scoring based on AI model certainty

### 👥 Peer Recommendations
- Tracks actual course selections from students
- Suggests courses based on what similar students have chosen
- Increases confidence scores for courses with more peer validation
- Anonymous aggregation of peer data

### 🔍 Enhanced Search
- Real-time course search with AI enhancement
- Combines traditional search with intelligent matching
- Fuzzy matching for course codes and names
- Instant results with confidence indicators

### 🎯 Smart Categorization
- **Highly Recommended**: Top AI and peer-validated courses
- **Popular**: Courses chosen by multiple peers
- **Trending**: Industry-relevant and popular courses
- **Core**: Essential departmental courses
- **Electives**: Optional and specialized courses

### ⚡ Performance Features
- Multi-level caching (memory + database)
- Batch API calls to reduce latency
- Background refresh of suggestions
- Optimized database queries with proper indexing

## Database Schema

### Tables Created

1. **`course_suggestions`** - Stores AI and peer-recommended courses
2. **`peer_course_selections`** - Tracks user course selections
3. **`ai_suggestion_cache`** - Caches AI-generated suggestions

### Key Functions

- `get_course_suggestions()` - Retrieves suggestions for academic context
- `update_peer_suggestion_count()` - Updates peer popularity scores
- `cleanup_ai_suggestion_cache()` - Removes expired cache entries

## Installation

### 1. Run the SQL Schema

Execute the provided SQL schema in your Supabase database:

```sql
-- Copy and paste the entire SQL schema from the implementation
-- This will create all necessary tables, indexes, and functions
```

### 2. Deploy the Service Files

The following files have been created/updated:

- `src/services/courseSuggestionService.js` - Core suggestion service
- `src/components/EnhancedCourseSuggestions.jsx` - UI component
- `src/components/Onboarding.jsx` - Updated onboarding flow

### 3. Environment Variables

Ensure your `.env` file has the required Groq API key:

```env
VITE_GROQ_API_KEY=your_groq_api_key_here
```

## How It Works

### 1. Data Collection

When a user completes onboarding:
- Their course selections are saved to `peer_course_selections`
- This triggers automatic updates to `course_suggestions`
- Peer confidence scores are calculated based on selection frequency

### 2. AI Suggestion Generation

For each academic context (university + department + level + semester):
- Multiple Groq prompts generate different types of suggestions
- Results are cached for 7 days to reduce API calls
- Confidence scores are assigned based on AI model certainty

### 3. Hybrid Scoring

The system combines AI and peer data:
- **AI Confidence (60%)**: Based on model certainty and source reliability
- **Peer Popularity (40%)**: Based on how many students selected the course
- **Combined Score**: Used for final ranking and display

### 4. Real-Time Updates

- New peer selections immediately update suggestion scores
- AI cache refreshes in the background
- Search results are enhanced with both AI and peer data

## Usage Examples

### Basic Usage

```javascript
import { getOnboardingCourseSuggestions } from './services/courseSuggestionService'

const suggestions = await getOnboardingCourseSuggestions(
  'Landmark University',
  'Computer Science', 
  '100',
  '1st',
  'Nigeria'
)

console.log(suggestions.all) // All suggestions
console.log(suggestions.categories.highlyRecommended) // Top picks
```

### Enhanced Search

```javascript
import { getEnhancedCourseSearch } from './services/courseSuggestionService'

const results = await getEnhancedCourseSearch(
  'CSC301',
  'Landmark University',
  'Computer Science',
  '300',
  '1st'
)
```

### Saving User Selections

```javascript
import { saveUserCourseSelections } from './services/courseSuggestionService'

await saveUserCourseSelections(
  userId,
  university,
  department,
  level,
  semester,
  selectedCourses
)
```

## UI Components

### EnhancedCourseSuggestions Component

Props:
- `university` - University name
- `department` - Department/programme name
- `level` - Academic level (100, 200, etc.)
- `semester` - Semester (1st, 2nd)
- `country` - Country (default: Nigeria)
- `selectedCourses` - Array of already selected courses
- `onCourseSelect` - Callback when course is selected
- `onCourseRemove` - Callback when course is removed

Features:
- Smart search with real-time results
- Category filters (Highly Recommended, Popular, Trending, etc.)
- Visual confidence indicators
- Peer count displays
- Trending course highlights
- Responsive grid layout

## Performance Optimization

### Caching Strategy

1. **Memory Cache**: Fast access for repeated requests
2. **Database Cache**: Persistent cache across server restarts
3. **API Response Caching**: Reduces Groq API calls

### Database Optimization

- Composite indexes on academic context fields
- Materialized view for peer aggregations
- Efficient JSONB operations for metadata

### API Optimization

- Batch processing of multiple AI prompts
- Debounced search requests
- Background refresh of stale data

## Testing

Run the test suite to verify functionality:

```javascript
import { runAllTests } from './test/courseSuggestionTest'

// Run all tests
const success = await runAllTests()
console.log('Tests passed:', success)
```

### Test Coverage

- ✅ AI suggestion generation
- ✅ Peer recommendation logic
- ✅ Enhanced search functionality
- ✅ Caching performance
- ✅ Database operations
- ✅ UI component rendering

## Monitoring

### Key Metrics

- **Suggestion Accuracy**: Track how often students select suggested courses
- **Peer Data Growth**: Monitor accumulation of peer recommendations
- **Cache Hit Rate**: Measure caching effectiveness
- **API Usage**: Track Groq API consumption

### Debugging

Enable debug logging:

```javascript
// In courseSuggestionService.js
const DEBUG = true // Set to true for detailed logging
```

## Future Enhancements

### Planned Features

1. **Machine Learning**: Implement ML models for better personalization
2. **Cross-University Data**: Share anonymized data across institutions
3. **Prerequisite Mapping**: Suggest courses based on completed prerequisites
4. **Career Path Alignment**: Align suggestions with career goals
5. **Difficulty Matching**: Match course difficulty to student performance

### Scalability

- Horizontal scaling with Redis cache
- CDN for static suggestion data
- Background job processing for AI generation
- Database sharding for large datasets

## Troubleshooting

### Common Issues

1. **No Suggestions Appearing**
   - Check Groq API key configuration
   - Verify database schema is installed
   - Check network connectivity

2. **Slow Performance**
   - Verify cache is working
   - Check database indexes
   - Monitor API response times

3. **Incorrect Suggestions**
   - Review AI prompts for context accuracy
   - Check peer data quality
   - Verify academic context matching

### Error Handling

The system includes comprehensive error handling:
- Graceful fallbacks for API failures
- Cache misses handled with live generation
- Database errors logged but don't break functionality

## Contributing

When adding new features:

1. Update the database schema if needed
2. Add corresponding tests
3. Update the UI components
4. Document the changes
5. Test with various academic contexts

## License

This enhancement is part of the Luter AI project and follows the same licensing terms.
