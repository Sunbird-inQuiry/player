import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useQuml } from '../../context/useQuml';
import { SectionPlayer } from '../SectionPlayer/SectionPlayer';
import { Scoreboard } from '../Scoreboard/Scoreboard';
import { StartPage } from '../StartPage/StartPage';
import { SectionIntro } from '../SectionIntro/SectionIntro';
import { Sidebar } from '../Sidebar/Sidebar';
import { MobileSectionsDrawer } from '../MobileSectionsDrawer/MobileSectionsDrawer';
import { PlayerHeader } from '../PlayerHeader/PlayerHeader';
import { t } from '../../i18n/translations';
import { transformSection, transformQuestion } from '../../services/transformation-service';
import { calculateScore } from '../../registry/scoring-registry';
import type { Question, Section, PlayerConfig } from '../../types';
import styles from './MainPlayer.module.scss';

/**
 * MainPlayer — top-level orchestrator + assessment shell (Phase 5 engine +
 * Phase 6 experience).
 *
 * Owns the player FLOW state machine (local React state — NOT Context, per spec
 * §6.0): overview → sectionIntro → assessment → submit. Context stays the single
 * source of truth for runtime data (sections, indices, answers). Shell components
 * are children here; they receive Context-derived data as props and emit jump
 * intent that maps to setCurrentSection / setCurrentQuestion. Hosts the single
 * application-level DndProvider.
 */
interface MainPlayerProps {
  playerConfig: PlayerConfig;
  onPlayerEvent?: (event: unknown) => void;
  /** Reserved — telemetry flows through useTelemetry; wired to the SDK in a later phase. */
  onTelemetryEvent?: (event: unknown) => void;
}

type Stage = 'overview' | 'sectionIntro' | 'assessment' | 'submit';

export function MainPlayer({ playerConfig, onPlayerEvent }: MainPlayerProps) {
  const { state, setPlayerConfig, setSections, setCurrentSection, setCurrentQuestion } = useQuml();
  const language = state.language;

  const [stage, setStage] = useState<Stage>('overview');
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Assessment-level countdown (owned by the shell, not Context). Null = no limit.
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Section intros can be disabled via config (spec §6.0).
  const sectionIntrosEnabled =
    (playerConfig?.config as { showSectionIntro?: boolean } | undefined)?.showSectionIntro !== false;

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

  // Overview / details data, derived from Context + raw config (spec §6.1–§6.2).
  const overview = useMemo(() => {
    const data = (playerConfig?.data as Record<string, unknown> | undefined) ?? {};
    const totalQuestions = state.sections.reduce((n, s) => n + s.children.length, 0);
    const maxScore = state.sections.reduce(
      (n, s) => n + s.children.reduce((m, q) => m + (q.maxScore ?? 1), 0),
      0,
    );
    const timeLimits = (data.timeLimits as { questionSet?: { max?: number } } | undefined)
      ?.questionSet;
    const cfg = (playerConfig?.config as { maxAttempts?: number } | undefined) ?? {};
    return {
      title: (data.name as string) || t(language, 'ASSESSMENT_OVERVIEW'),
      description: data.description as string | undefined,
      instructions: data.instructions as string | undefined,
      totalQuestions,
      totalSections: state.sections.length,
      timeLimit: Number(timeLimits?.max) || 0,
      maxScore,
      attemptsLeft: Math.max(0, (cfg.maxAttempts ?? 3) - (state.attemptNumber - 1)),
    };
  }, [playerConfig, state.sections, state.attemptNumber, language]);

  // Shell countdown: tick while inside the section-intro / assessment stages.
  useEffect(() => {
    if (stage !== 'sectionIntro' && stage !== 'assessment') return;
    const id = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev == null) return prev;
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [stage]);

  // Time up → hand off to the submit stage.
  useEffect(() => {
    if (timeRemaining === 0) setStage('submit');
  }, [timeRemaining]);

  // Per-section completion (every child answered) — drives the section step dots.
  const completed = useMemo(
    () =>
      state.sections.map((s) =>
        s.children.length > 0 && s.children.every((q) => Boolean(state.answers[q.identifier])),
      ),
    [state.sections, state.answers],
  );

  // ── Flow transitions ───────────────────────────────────────────────────────
  const beginAssessmentTimer = () => {
    if (timeRemaining == null && overview.timeLimit > 0) setTimeRemaining(overview.timeLimit);
  };

  const handleStart = () => {
    setCurrentSection(0);
    setCurrentQuestion(0);
    beginAssessmentTimer();
    setStage(sectionIntrosEnabled ? 'sectionIntro' : 'assessment');
  };

  const handleBegin = () => {
    setCurrentQuestion(0);
    setStage('assessment');
  };

  // Overview section card → jump straight into that section's intro.
  const handleSectionSelectFromOverview = (index: number) => {
    setCurrentSection(index);
    setCurrentQuestion(0);
    beginAssessmentTimer();
    setStage(sectionIntrosEnabled ? 'sectionIntro' : 'assessment');
  };

  const handleSubmitAssessment = () => setStage('submit');

  const handleSectionEnd = () => {
    const nextIndex = state.currentSectionIndex + 1;
    if (nextIndex < state.sections.length) {
      setCurrentSection(nextIndex);
      setCurrentQuestion(0);
      setStage(sectionIntrosEnabled ? 'sectionIntro' : 'assessment');
      onPlayerEvent?.({ type: 'sectionEnd', sectionIndex: state.currentSectionIndex });
    } else {
      setStage('submit');
      onPlayerEvent?.({ type: 'quizEnd', summary });
    }
  };

  const handleSectionJump = (index: number) => {
    setCurrentSection(index);
    setCurrentQuestion(0);
    setStage('assessment');
  };

  if (!state.playerConfig) {
    return <div className={styles.status}>{t(language, 'LOADING')}</div>;
  }
  if (state.error) {
    return <div className={styles.error}>{state.error}</div>;
  }

  const currentSection = state.sections[state.currentSectionIndex];

  // Global question counter (across all sections) for the shell header.
  const priorQuestions = state.sections
    .slice(0, state.currentSectionIndex)
    .reduce((n, s) => n + s.children.length, 0);
  const globalQuestionNumber = priorQuestions + state.currentQuestionIndex + 1;

  let content: ReactNode;
  if (stage === 'overview') {
    content = (
      <StartPage
        title={overview.title}
        description={overview.description}
        sections={state.sections}
        totalQuestions={overview.totalQuestions}
        totalSections={overview.totalSections}
        timeLimit={overview.timeLimit}
        attemptsLeft={overview.attemptsLeft}
        onStart={handleStart}
        onSectionSelect={handleSectionSelectFromOverview}
        language={language}
      />
    );
  } else if (stage === 'submit') {
    // Phase 7 takes over the submit → results → review experience. Until then the
    // Scoreboard summary stands in as the end-of-assessment view.
    content = (
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
    );
  } else {
    // Persistent shell (spec §6.6/§6.12): header + sidebar wrap BOTH the section
    // intro and the in-section player; only the main area swaps between them.
    const mainArea =
      stage === 'sectionIntro' && currentSection ? (
        <SectionIntro
          key={`intro-${state.currentSectionIndex}`}
          section={currentSection}
          sectionIndex={state.currentSectionIndex}
          totalSections={state.sections.length}
          onBegin={handleBegin}
          language={language}
        />
      ) : (
        <SectionPlayer
          key={state.currentSectionIndex}
          section={currentSection}
          onSectionEnd={handleSectionEnd}
        />
      );

    content = (
      <>
        <PlayerHeader
          brand={overview.title}
          sections={state.sections}
          currentSectionIndex={state.currentSectionIndex}
          completed={completed}
          timeRemaining={timeRemaining}
          questionNumber={globalQuestionNumber}
          totalQuestions={overview.totalQuestions}
          onSubmit={handleSubmitAssessment}
          onMenuClick={() => setDrawerOpen(true)}
          onBrandClick={() => setStage('overview')}
          language={language}
        />

        <div className={styles.appBody}>
          <aside className={styles.sidebarSlot}>
            <Sidebar
              sections={state.sections}
              currentSectionIndex={state.currentSectionIndex}
              answers={state.answers}
              onSectionJump={handleSectionJump}
              language={language}
            />
          </aside>

          <main className={styles.main}>{mainArea}</main>

          <MobileSectionsDrawer
            isOpen={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            sections={state.sections}
            currentSectionIndex={state.currentSectionIndex}
            answers={state.answers}
            onSectionJump={handleSectionJump}
            language={language}
          />
        </div>
      </>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={styles.appShell}>{content}</div>
    </DndProvider>
  );
}
