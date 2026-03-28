# Luter AI - Groq Integration Setup

## Environment Configuration

Add your Groq API key to your `.env` file:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GROQ_API_KEY=your_groq_api_key_here
```

## Features Implemented

### ✅ 1. AI Tutor Chat (CourseWorkstation)
- **Model**: `llama-3.3-70b-versatile` (Professor Model)
- **Location**: CourseWorkstation → AI Notebook tab
- **Purpose**: Complex tutoring with Nigerian academic context

### ✅ 2. AI Mock Exam Generation
- **Model**: `llama-3.1-8b-instant` (Speedster Model)
- **Location**: Dashboard → Mock Exam page
- **Purpose**: Generate MCQs with JAMB/CBT standards

### ✅ 3. Assignment Solution Generator
- **Model**: `llama-3.3-70b-versatile` (Professor Model)
- **Location**: CourseWorkstation → Solution Vault tab
- **Purpose**: Step-by-step solutions with "Logic First" approach

### ✅ 4. AI Notes Generator
- **Model**: `llama-3.3-70b-versatile` (Professor Model)
- **Location**: New AINotesPage component
- **Purpose**: Transform lectures into structured notes

### ✅ 5. Flashcard Generator
- **Model**: `llama-3.1-8b-instant` (Speedster Model)
- **Location**: New FlashcardPage component
- **Purpose**: Active recall flashcards with flip animations

### ✅ 6. Request Queue System
- **Purpose**: Handle Groq rate limits automatically
- **Features**: 10-second retry on 429 errors
- **Implementation**: Built into groqClient.js

## Model Selection Logic

### Professor Model (`llama-3.3-70b-versatile`)
- **Uses**: AI Notes, Complex Tutoring, Assignment Solutions
- **Strength**: Highest reasoning capability
- **Temperature**: 0.3-0.7 (balanced creativity)

### Speedster Model (`llama-3.1-8b-instant`)
- **Uses**: Flashcards, Mock Exams, Quick Summaries
- **Strength**: Extreme speed, lower cost
- **Temperature**: 0.7 (more creative)

## System Prompts

### Master Luter AI Prompt
```
You are Luter AI, a premium, high-energy Academic Tutor for Nigerian University students. 
Your goal is to simplify complex departmental materials into 'First Class' quality insights.

Tone: Encouraging, sharp, and professional. Use Nigerian academic context where appropriate.

Constraint 1 (Groundedness): Only answer based on provided study materials.
Constraint 2 (Formatting): Clean Markdown with bolding and bullet points.
Constraint 3 (30-Min Promise): Logic First breakdown for assignments.
```

### Feature-Specific Prompts
- **AI Notes**: Extract core definitions, 3 important concepts, 2-paragraph summary
- **Flashcards**: JSON format with front/back for active recall
- **Mock Exams**: 5 MCQs with 1 "Boss Level" question, JSON output
- **Assignments**: Step-by-step with formula → substitution → result

## Usage Instructions

1. **Set up environment** with your Groq API key
2. **Restart development server** to load environment variables
3. **Test features** in the dashboard:
   - Go to Course → AI Notebook for tutoring
   - Go to Mock Exam for AI-generated questions
   - Go to Solution Vault for assignment help
4. **New pages** (AINotesPage, FlashcardPage) can be integrated into routing

## Error Handling

- **Rate Limits**: Automatic retry with 10-second delay
- **Fallback Content**: Sample data if AI fails
- **User Feedback**: Loading states and error messages
- **Logging**: Console errors for debugging

## Performance Optimizations

- **Request Queuing**: Prevents API abuse
- **Model Selection**: Uses fastest model for simple tasks
- **Temperature Tuning**: Optimized for each use case
- **Response Format**: JSON for structured data when needed

## Next Steps

1. Add file upload integration (PDF/image processing)
2. Implement real-time streaming responses
3. Add usage analytics and cost tracking
4. Create user preferences for AI behavior
5. Add more Nigerian-specific content and examples
