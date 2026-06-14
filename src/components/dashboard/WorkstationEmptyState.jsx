import React, { useState } from 'react';
import { Sparkles, FileText, Bot, Database, FormInput, LayoutTemplate, MoreHorizontal, List } from 'lucide-react';
import { callGroqAPI, GROQ_PROMPTS } from '../../groqClient';

export default function WorkstationEmptyState({ editor, material, isGenerating, setIsGenerating }) {
  const [error, setError] = useState(null);

  const getAiContext = () => {
    return material?.text || material?.content || '';
  };

  const handleAiAction = async (actionType) => {
    if (!editor || !material) return;
    setIsGenerating(true);
    setError(null);
    try {
      const context = getAiContext();
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

      const response = await callGroqAPI([{ role: 'system', content: GROQ_PROMPTS.DEFAULT }, { role: 'user', content: prompt }]);
      
      const markdownToHtml = (text) => {
        let parsed = text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')

        parsed = parsed.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
        parsed = parsed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        parsed = parsed.replace(/\*([^*]+)\*/g, '<em>$1</em>')
        parsed = parsed.replace(/`([^`]+)`/g, '<code>$1</code>')
        
        parsed = parsed.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
           return `<img src="https://latex.codecogs.com/svg.latex?\\color{black}${encodeURIComponent(formula.trim())}" alt="math" />`
        })
        parsed = parsed.replace(/\$([^$\n]+)\$/g, (match, formula) => {
           return `<img src="https://latex.codecogs.com/svg.latex?\\color{black}${encodeURIComponent(formula.trim())}" alt="math" />`
        })

        const blocks = parsed.split(/\n+/)
        let listItems = []
        let finalBlocks = []

        const flushList = () => {
          if (!listItems.length) return
          finalBlocks.push(`<ul>${listItems.map(item => `<li><p>${item}</p></li>`).join('')}</ul>`)
          listItems = []
        }

        blocks.forEach((line) => {
          const trimmed = line.trim()
          if (!trimmed) {
            flushList()
            return
          }

          const bullet = trimmed.match(/^[-*]\s+(.+)/)
          const numbered = trimmed.match(/^\d+\.\s+(.+)/)
          if (bullet || numbered) {
            listItems.push((bullet || numbered)[1])
            return
          }

          flushList()
          if (trimmed.startsWith('### ')) finalBlocks.push(`<h3>${trimmed.slice(4)}</h3>`)
          else if (trimmed.startsWith('## ')) finalBlocks.push(`<h2>${trimmed.slice(3)}</h2>`)
          else if (trimmed.startsWith('# ')) finalBlocks.push(`<h1>${trimmed.slice(2)}</h1>`)
          else finalBlocks.push(`<p>${trimmed}</p>`)
        })

        flushList()
        return finalBlocks.join('') || '<p></p>'
      }

      const html = markdownToHtml(response);
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
