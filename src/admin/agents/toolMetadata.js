export const TOOL_CATEGORIES = {
  'Database': [
    'db.select',
    'db.insert',
    'db.update',
    'db.delete',
    'db.upsert',
    'db.count',
    'db.rpc',
    'db.search_syllabus',
    'db.get_syllabus'
  ],
  'Web': [
    'web.search',
    'web.scrape',
    'web.crawl',
    'web.fetch',
    'web.searchAcademic'
  ],
  'AI': [
    'ai.generate',
    'ai.summarize',
    'ai.extractJson',
    'ai.classify',
    'ai.parsePdf',
    'ai.runCode'
  ],
  'Email': [
    'email.send',
    'email.broadcastAll'
  ],
  'Admin': [
    'admin.sendNotification',
    'admin.broadcastAll',
    'admin.setAppConfig',
    'admin.getAppConfig',
    'admin.setMaintenanceMode',
    'admin.flagUser',
    'admin.createAgent'
  ],
}

export const TOOL_DESCRIPTIONS = {
  'db.select':            'Read rows from any Supabase table',
  'db.insert':            'Create new rows in a table',
  'db.update':            'Edit an existing row by ID',
  'db.delete':            'Delete a row by ID',
  'db.upsert':            'Insert or update rows',
  'db.count':             'Count matching rows',
  'db.rpc':               'Call a Postgres stored function',
  'db.search_syllabus':   'Search existing university curricula in curriculum_offers',
  'db.get_syllabus':      'Fetch a specific syllabus record by ID',
  'web.search':           'Search the web via Tavily (auto-rotates 7 keys)',
  'web.scrape':           'Scrape a URL via Firecrawl (JS-rendered, 7 keys)',
  'web.crawl':            'Crawl multiple pages from a domain',
  'web.fetch':            'Raw HTTP GET any URL',
  'web.searchAcademic':   'Search academic papers via OpenAlex (free)',
  'ai.generate':          'Generate text/JSON via Groq (auto-rotates 7 keys)',
  'ai.summarize':         'Summarize long text with Groq',
  'ai.extractJson':       'Parse unstructured text → structured JSON',
  'ai.classify':          'Classify text into a category',
  'ai.parsePdf':          'Parse PDF from URL via LlamaIndex Cloud (best for academic docs)',
  'ai.runCode':           'Execute Python/JS code in E2B sandbox',
  'email.send':           'Send an email to a specific address via Resend',
  'email.broadcastAll':   'Send email to ALL users via Resend',
  'admin.sendNotification':  'Push in-app notification to a specific user',
  'admin.broadcastAll':      'Broadcast in-app notification to ALL users',
  'admin.setAppConfig':      'Set a global app configuration value',
  'admin.getAppConfig':      'Read a global app configuration value',
  'admin.setMaintenanceMode':'Toggle maintenance mode ON or OFF',
  'admin.flagUser':           'Flag a user for review',
  'admin.createAgent':        'Spawn a new agent programmatically',
}

export const DANGEROUS_TOOLS = [
  'db.delete', 'admin.broadcastAll', 'admin.flagUser',
  'admin.createAgent', 'email.broadcastAll', 'admin.setMaintenanceMode',
]
