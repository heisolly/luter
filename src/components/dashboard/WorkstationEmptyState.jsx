import React, { useState } from 'react';
import { Sparkles, FileText, Bot, Database, FormInput, LayoutTemplate, MoreHorizontal, List } from 'lucide-react';
import { callGroqAPI, GROQ_PROMPTS } from '../../groqClient';
import { extractTextChunks } from '../../services/langchainPipeline';
import { marked } from 'marked';

export default function WorkstationEmptyState({ editor, material, isGenerating, setIsGenerating }) {
  const [error, setError] = useState(null);

  const getAiContext = () => {
    return material?.extracted_text || material?.text || material?.content || '';
  };

  const handleAiAction = async (actionType) => {
    if (!editor || !material) return;
    setIsGenerating(true);
    setError(null);
    try {
      let context = getAiContext();

      // Fallback: If no text is available in the database, extract it on the fly
      if (!context && material.source_url) {
        editor.commands.insertContent('<p><em>Extracting document context on the fly...</em></p>');
        const res = await fetch(material.source_url);
        if (!res.ok) throw new Error('Failed to download document for extraction');
        const blob = await res.blob();
        const file = new File([blob], material.title || 'document.pdf', { type: blob.type });
        const chunks = await extractTextChunks(file, material.type || 'pdf', null);
        context = chunks.map(c => c.text).join('\n\n');
        
        // Clear the extracting message
        editor.commands.setContent('');
      }

      if (!context) throw new Error('No document text available to process.');

      let prompt = '';
      if (actionType === 'notes') {
        prompt = `Generate comprehensive study notes for this document. Use Markdown. For any mathematical equations, use standard LaTeX enclosed in $ or $$ tags. Document context: ${context.substring(0, 4000)}`;
      } else if (actionType === 'summary') {
        prompt = `Create a concise summary of this document. Use Markdown. Document context: ${context.substring(0, 4000)}`;
      } else if (actionType === 'concepts') {
        prompt = `List the core concepts from this document with brief explanations. Use Markdown. Document context: ${context.substring(0, 4000)}`;
      } else {
        prompt = `Analyze this document. Document context: ${context.substring(0, 4000)}`;
      }

      // Add a loader placeholder
      editor.commands.insertContent('<p><em>Luter AI is generating...</em></p>');

      const data = await callGroqAPI([{ role: 'user', content: prompt }]);
      const responseText = data?.choices?.[0]?.message?.content || '';
      
      const markdownToHtml = (text) => {
        let preprocessed = text.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
           return `<img src="https://latex.codecogs.com/svg.latex?\\color{black}${encodeURIComponent(formula.trim())}" alt="math" />`
        })
        preprocessed = preprocessed.replace(/\$([^$\n]+)\$/g, (match, formula) => {
           return `<img src="https://latex.codecogs.com/svg.latex?\\color{black}${encodeURIComponent(formula.trim())}" alt="math" />`
        })
        return marked.parse(preprocessed);
      }

      const html = markdownToHtml(responseText);
      editor.commands.setContent(html); 
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to generate content.');
      editor.commands.setContent('<p></p>');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
      <div style={{
        position: 'absolute',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: 500 }}>
          Generate from your document:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
          <button 
            onClick={() => handleAiAction('notes')}
            disabled={isGenerating}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 18px', borderRadius: '14px', border: '1px solid #E5E7EB',
              background: '#FFFFFF', color: '#111827', fontSize: '14px', fontWeight: 600,
              cursor: isGenerating ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)', opacity: isGenerating ? 0.7 : 1
            }}
            onMouseOver={(e) => { if(!isGenerating) { e.currentTarget.style.borderColor = '#C4B5FD'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
            onMouseOut={(e) => { if(!isGenerating) { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.transform = 'translateY(0)'; } }}
          >
            <Sparkles size={16} color="#6D28D9" /> Generate Notes
          </button>
          
          <button 
            onClick={() => handleAiAction('summary')}
            disabled={isGenerating}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 18px', borderRadius: '14px', border: '1px solid #E5E7EB',
              background: '#FFFFFF', color: '#111827', fontSize: '14px', fontWeight: 600,
              cursor: isGenerating ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)', opacity: isGenerating ? 0.7 : 1
            }}
            onMouseOver={(e) => { if(!isGenerating) { e.currentTarget.style.borderColor = '#FDBA74'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
            onMouseOut={(e) => { if(!isGenerating) { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.transform = 'translateY(0)'; } }}
          >
            <LayoutTemplate size={16} color="#EA580C" /> Create Summary
          </button>

          <button 
            onClick={() => handleAiAction('concepts')}
            disabled={isGenerating}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 18px', borderRadius: '14px', border: '1px solid #E5E7EB',
              background: '#FFFFFF', color: '#111827', fontSize: '14px', fontWeight: 600,
              cursor: isGenerating ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)', opacity: isGenerating ? 0.7 : 1
            }}
            onMouseOver={(e) => { if(!isGenerating) { e.currentTarget.style.borderColor = '#6EE7B7'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
            onMouseOut={(e) => { if(!isGenerating) { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.transform = 'translateY(0)'; } }}
          >
            <List size={16} color="#059669" /> List of Concepts
          </button>
        </div>
        {error && (
          <div style={{ color: '#EF4444', fontSize: '13px', marginTop: '8px', background: '#FEE2E2', padding: '6px 12px', borderRadius: '6px' }}>
            {error}
          </div>
        )}
      </div>
  );
}
