import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useBroadcastEvent, useEventListener } from '../liveblocks.config';

/**
 * Hook to manage a personal colour palette.
 * Stores colours in Supabase table `palettes` (columns: id (uuid), user_id, color).
 * Real‑time sync is achieved via Liveblocks broadcast events.
 */
export function usePalette({ userId }) {
  const [palette, setPalette] = useState([]);
  const broadcast = useBroadcastEvent();

  // Load palette from Supabase (offline fallback via cache could be added later)
  const loadPalette = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('palettes')
      .select('color')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Palette load error:', error);
      return;
    }
    setPalette(data.map((row) => row.color));
  }, [userId]);

  // Add a colour to the palette
  const addColor = useCallback(async (color) => {
    if (!userId) return;
    const { error } = await supabase
      .from('palettes')
      .insert({ user_id: userId, color });
    if (error) {
      console.error('Palette add error:', error);
      return;
    }
    // Optimistically update UI
    setPalette((prev) => [...prev, color]);
    broadcast({ type: 'PALETTE_UPDATED', userId, palette: [...palette, color] });
  }, [userId, palette, broadcast]);

  // Remove a colour from the palette
  const removeColor = useCallback(async (color) => {
    if (!userId) return;
    const { error } = await supabase
      .from('palettes')
      .delete()
      .eq('user_id', userId)
      .eq('color', color);
    if (error) {
      console.error('Palette remove error:', error);
      return;
    }
    const newPalette = palette.filter((c) => c !== color);
    setPalette(newPalette);
    broadcast({ type: 'PALETTE_UPDATED', userId, palette: newPalette });
  }, [userId, palette, broadcast]);

  // Listen for remote palette updates via Liveblocks
  useEventListener(({ event }) => {
    if (event.type === 'PALETTE_UPDATED' && event.userId === userId) {
      setPalette(event.palette);
    }
  });

  // Load once on mount / user change
  useEffect(() => {
    loadPalette();
  }, [loadPalette]);

  return { palette, addColor, removeColor, loadPalette };
}
