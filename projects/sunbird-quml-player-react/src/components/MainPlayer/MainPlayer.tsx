import { useEffect, useMemo, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useQuml } from '../../context/useQuml';
import { SectionPlayer } from '../SectionPlayer/SectionPlayer';
import { Scoreboard } from '../Scoreboard/Scoreboard';
import { t } from '../../i18n/translations';
import { transformSection, transformQuestion } from '../../services/transformation-service';
import { calculateScore } from '../../registry/scoring-registry';
import type { Question, Section, PlayerConfig } from '../../types';
import styles from './MainPlayer.module.scss';

/**
 * MainPlayer — top-level orchestrator. Initializes Context from the embedded
 * playerConfig (normalizing via the transformation service), drives section
 * navigation, aggregates the end-of-quiz summary, and hosts the single
 * application-level DndProvider.
 */
interface MainPlayerProps {
  playerConfig: PlayerConfig;
  onPlayerEvent?: (event: unknown) => void;
  /** Reserved — telemetry flows through useTelemetry; wired to the SDK in a later phase. */
  onTelemetryEvent?: (event: unknown) => void;
}

export function MainPlayer({ playerConfig, onPlayerEvent }: MainPlayerProps) {
  const { state, setPlayerConfig, setSections, setCurrentSection } = useQuml();
  const language = state.language;
  const [showScoreboard, setShowScoreboard] = useState(false);

  // Initialize config + normalized sections from embedded data (no network in Phase 5).
  useEffect(() => {
    if (!playerConfig) return;
    setPlayerConfig(playerConfig);

    const rawSections = (playerConfig.data as { sections?: unknown[] } | undefined)?.sections ?? [];
    const sections = rawSections
      .map((raw) => {
        const normalized = transformSection(raw);
        if (!normalized) return null;
        const children = (((raw as { children?: unknown[] }).children ?? []) as unknown[])
          .map((q) => transformQuestion(q))
          .filter((q): q is Question => Boolean(q));
        return { ...normalized, children };
      })
      .filter((s): s is Section => Boolean(s));

    setSections(sections);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerConfig]);

  const summary = useMemo(() => {
    let correct = 0;
    let incorrect = 0;
    let partial = 0;
    let skipped = 0;
    let totalScore = 0;
    let maxScore = 0;
    for (const section of state.sections) {
      for (const q of section.children) {
        const max = q.maxScore ?? 1;
        maxScore += max;
        const answer = state.answers[q.identifier];
        if (!answer) {
          skipped += 1;
          continue;
        }
        const score = calculateScore(q, answer);
        totalScore += score * max;
        if (score >= 1) correct += 1;
        else if (score > 0) partial += 1;
        else incorrect += 1;
      }
    }
    return { correct, incorrect, partial, skipped, totalScore: Math.round(totalScore), maxScore };
  }, [state.sections, state.answers]);

  const handleSectionEnd = () => {
    const nextIndex = state.currentSectionIndex + 1;
    if (nextIndex < state.sections.length) {
      setCurrentSection(nextIndex);
      onPlayerEvent?.({ type: 'sectionEnd', sectionIndex: state.currentSectionIndex });
    } else {
      setShowScoreboard(true);
      onPlayerEvent?.({ type: 'quizEnd', summary });
    }
  };

  if (!state.playerConfig) {
    return <div className={styles.status}>{t(language, 'LOADING')}</div>;
  }
  if (state.error) {
    return <div className={styles.error}>{state.error}</div>;
  }

  const currentSection = state.sections[state.currentSectionIndex];

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={styles.mainPlayer}>
        {showScoreboard ? (
          <div className={styles.endPage}>
            <h1 className={styles.title}>{t(language, 'QUIZ_COMPLETE')}</h1>
            <p className={styles.subtitle}>{t(language, 'THANK_YOU')}</p>
            <Scoreboard
              correct={summary.correct}
              incorrect={summary.incorrect}
              partial={summary.partial}
              skipped={summary.skipped}
              totalScore={summary.totalScore}
              maxScore={summary.maxScore}
            />
          </div>
        ) : (
          <SectionPlayer
            key={state.currentSectionIndex}
            section={currentSection}
            onSectionEnd={handleSectionEnd}
          />
        )}
      </div>
    </DndProvider>
  );
}
