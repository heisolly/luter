/**
 * Tavily AI Search Service
 * Provides real-time web research capabilities for Luter Admin
 */

const TAVILY_API_KEY = import.meta.env.VITE_TAVILY_API_KEY;
const TAVILY_BASE_URL = 'https://api.tavily.com/search';

export const tavilyService = {
  /**
   * Search the web for specific information
   * @param {string} query - The search query
   * @param {object} options - Search options (search_depth, include_answer, include_raw_content, max_results)
   */
  async search(query, options = {}) {
    if (!TAVILY_API_KEY) {
      console.warn('TAVILY_API_KEY is missing');
      throw new Error('Tavily API key is not configured');
    }

    const payload = {
      api_key: TAVILY_API_KEY,
      query: query,
      search_depth: options.search_depth || 'advanced',
      include_answer: options.include_answer || true,
      include_raw_content: options.include_raw_content || false,
      max_results: options.max_results || 5,
      include_images: false,
    };

    try {
      const response = await fetch(TAVILY_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Tavily API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Tavily search failed:', error);
      throw error;
    }
  },

  /**
   * Specifically research a university syllabus
   */
  async researchSyllabus(university, department, level, semester) {
    const query = `${university} ${department} ${level} level ${semester} semester syllabus course list nigeria`;
    return this.search(query, {
      search_depth: 'advanced',
      include_answer: true,
      max_results: 8
    });
  }
};

export default tavilyService;
