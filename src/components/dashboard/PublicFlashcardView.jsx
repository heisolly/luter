import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import WorkstationFlashcards from './WorkstationFlashcards';
import { CaretLeft, CircleNotch } from '@phosphor-icons/react';
import { MaterialAnalysisService } from '../../services/materialAnalysisService';
import { CollaborationProvider } from './CollaborationProvider';

export default function PublicFlashcardView() {
  const { materialId } = useParams();
  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadMaterial() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('materials')
          .select('id, title')
          .eq('id', materialId)
          .single();

        if (error) throw error;
        if (!data) throw new Error("Material not found");

        const analysisData = await MaterialAnalysisService.getAnalysisFromSupabase(materialId);
        
        setMaterial({ ...data, analysis: analysisData });
      } catch (err) {
        console.error("Error loading public flashcards:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (materialId) loadMaterial();
  }, [materialId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAFA' }}>
        <CircleNotch size={32} weight="bold" color="#6366F1" className="animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', height: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAFA', gap: '16px' }}>
        <h2 style={{ fontFamily: 'Outfit, sans-serif', color: '#111827' }}>Oops, we couldn't load this pack.</h2>
        <p style={{ color: '#6B7280' }}>The link might be invalid or the creator removed it.</p>
        <Link to="/" style={{ color: '#6366F1', fontWeight: 600, textDecoration: 'none' }}>Go back to home</Link>
      </div>
    );
  }

  const flashcards = material?.analysis?.flashcards || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#FAFAFA' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '16px 24px', backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB',
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 800, fontFamily: 'Outfit' }}>
            L
          </div>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '18px', color: '#111827' }}>
            {material?.title || 'Shared Flashcards'}
          </span>
        </div>
        
        <Link to="/signup" style={{ 
          background: '#111827', color: '#FFFFFF', padding: '8px 16px', borderRadius: '8px', 
          fontWeight: 600, textDecoration: 'none', fontSize: '14px', transition: 'all 0.2s'
        }}>
          Create your own
        </Link>
      </div>

      {/* Main Flashcard Viewer */}
      <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
        <CollaborationProvider roomId={`public-view-${materialId}`}>
          <WorkstationFlashcards 
            material={material} 
            items={flashcards} 
            isDark={false}
            readOnly={true}
          />
        </CollaborationProvider>
      </div>
    </div>
  );
}
