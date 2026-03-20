
import { useState, useCallback } from 'react';
import { WicketType } from '@shared/types';

export function useWicketFlow() {
  const [isOpen, setIsOpen] = useState(false);

  const [wicketType, setWicketType] = useState<WicketType | null>(null);
  const [outPlayerId, setOutPlayerId] = useState<string | null>(null);
  const [fielderId, setFielderId] = useState<string | null>(null);

  const start = useCallback((defaultBatterId?: string) => {
    setOutPlayerId(defaultBatterId || null);
    setIsOpen(true);
  }, []);

  const reset = useCallback(() => {
    setIsOpen(false);
    setWicketType(null);
    setOutPlayerId(null);
    setFielderId(null);
  }, []);

  return {
    isOpen,
    wicketType,
    outPlayerId,
    fielderId,

    start,
    reset,

    setWicketType,
    setOutPlayerId,
    setFielderId
  };
}

