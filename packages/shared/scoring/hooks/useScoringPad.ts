
import { useState, useCallback } from 'react';

export type PadView =
  | 'main'
  | 'extras'
  | 'wide_runs'
  | 'nb_type'
  | 'nb_runs'
  | 'bye_runs'
  | 'lb_runs'
  | 'more_runs'
  | 'events'
  | 'wicket_player_select'
  | 'wicket_type_select'
  | 'wicket_fielder_select'
  | 'wicket_assist_select'
  | 'wicket_runout_input'
  | 'bowler_replacement_menu'
  | 'bowler_replacement_select'
  | 'adjustments'
  | 'result'
  | 'batter_actions_menu'
  | 'batter_replacement_select'
  | 'declare_confirm'
  | 'end_match_confirm';

type NoBallType = 'Bat' | 'Bye' | 'LegBye';

type ReplacementMode = 'injury' | 'correction';

export const useScoringPad = () => {
  const [padView, setPadView] = useState<PadView>('main');
  const [isRunGridExpanded, setIsRunGridExpanded] = useState(false);

  // --- No Ball Flow ---
  const [pendingNbType, setPendingNbType] = useState<NoBallType | null>(null);

  // --- Wicket Flow ---
  const [pendingWicketPlayerId, setPendingWicketPlayerId] = useState<string | null>(null);
  const [pendingDismissalType, setPendingDismissalType] = useState<string | null>(null);
  const [pendingFielderId, setPendingFielderId] = useState<string | null>(null);
  const [pendingAssistFielderId, setPendingAssistFielderId] = useState<string | null>(null);

  // --- Bowler Replacement ---
  const [replacementMode, setReplacementMode] = useState<ReplacementMode | null>(null);

  // --- Batter Actions ---
  const [batterActionTarget, setBatterActionTarget] =
    useState<'striker' | 'nonStriker' | null>(null);

  /* =====================
     Generic Helpers
  ===================== */

  const resetPad = useCallback(() => {
    setPadView('main');
    setIsRunGridExpanded(false);
    setPendingNbType(null);
    setPendingWicketPlayerId(null);
    setPendingDismissalType(null);
    setPendingFielderId(null);
    setPendingAssistFielderId(null);
    setReplacementMode(null);
    setBatterActionTarget(null);
  }, []);

  /* =====================
     Run / Extras Flow
  ===================== */

  const openRunGrid = useCallback(() => {
    setIsRunGridExpanded(true);
  }, []);

  const closeRunGrid = useCallback(() => {
    setIsRunGridExpanded(false);
  }, []);

  const startWide = useCallback(() => {
    setPadView('wide_runs');
  }, []);

  const startNoBall = useCallback(() => {
    setPadView('nb_type');
  }, []);

  const selectNoBallType = useCallback((type: NoBallType) => {
    setPendingNbType(type);
    setPadView('nb_runs');
  }, []);

  const startByes = useCallback(() => {
    setPadView('bye_runs');
  }, []);

  const startLegByes = useCallback(() => {
    setPadView('lb_runs');
  }, []);

  /* =====================
     Wicket Flow
  ===================== */

  const startWicket = useCallback((outPlayerId: string) => {
    setPendingWicketPlayerId(outPlayerId);
    setPadView('wicket_type_select');
  }, []);

  const selectDismissalType = useCallback((type: string) => {
    setPendingDismissalType(type);
    setPadView('wicket_fielder_select');
  }, []);

  const selectFielder = useCallback((fielderId: string) => {
    setPendingFielderId(fielderId);
    setPadView('wicket_assist_select');
  }, []);

  const selectAssistFielder = useCallback((fielderId?: string) => {
    if (fielderId) setPendingAssistFielderId(fielderId);
    setPadView('main');
  }, []);

  /* =====================
     Bowler Replacement
  ===================== */

  const startBowlerReplacement = useCallback((mode: ReplacementMode) => {
    setReplacementMode(mode);
    setPadView('bowler_replacement_select');
  }, []);

  /* =====================
     Batter Actions
  ===================== */

  const openBatterActions = useCallback((target: 'striker' | 'nonStriker') => {
    setBatterActionTarget(target);
    setPadView('batter_actions_menu');
  }, []);

  const startBatterReplacement = useCallback(() => {
    setPadView('batter_replacement_select');
  }, []);

  return {
    // Views
    padView,
    setPadView,
    isRunGridExpanded,

    // Extras
    pendingNbType,
    startWide,
    startNoBall,
    selectNoBallType,
    startByes,
    startLegByes,
    openRunGrid,
    closeRunGrid,

    // Wicket
    pendingWicketPlayerId,
    pendingDismissalType,
    pendingFielderId,
    pendingAssistFielderId,
    startWicket,
    selectDismissalType,
    selectFielder,
    selectAssistFielder,

    // Bowler
    replacementMode,
    startBowlerReplacement,

    // Batter
    batterActionTarget,
    openBatterActions,
    startBatterReplacement,

    // Reset
    resetPad
  };
};
