import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useQuml } from '../../context/useQuml';
import { SectionPlayer } from '../SectionPlayer/SectionPlayer';
import { StartPage } from '../StartPage/StartPage';
import { SectionIntro } from '../SectionIntro/SectionIntro';
import { Sidebar } from '../Sidebar/Sidebar';
import { MobileSectionsDrawer } from '../MobileSectionsDrawer/MobileSectionsDrawer';
import { PlayerHeader } from '../PlayerHeader/PlayerHeader';
import { SubmitModal } from '../SubmitModal/SubmitModal';
import { ResultsScreen } from '../ResultsScreen/ResultsScreen';
import { ReviewScreen } from '../ReviewScreen/ReviewScreen';
import { t, readI18n } from '../../i18n/translations';
import { transformSection, transformQuestion } from '../../services/transformation-service';
import { loadQuestionSet } from '../../services/data-service';
import { QumlApiError } from '../../types/api';
import { calculateScore } from '../../registry/scoring-registry';
import { isAnswered } from '../../utils/answered';
import type { Question, Section, PlayerConfig, I18nValue } from '../../types';
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
 *
 * Phase 7 extends the flow with `results`/`review` stages and a transient
 * `submitDialog`; Results/Review READ Context + the scoring-registry and never
 * own runtime answers.
 */
interface MainPlayerProps {
  playerConfig: PlayerConfig;
  onPlayerEvent?: (event: unknown) => void;
  /** Reserved — telemetry flows through useTelemetry; wired to the SDK in a later phase. */
  onTelemetryEvent?: (event: unknown) => void;
}

type Stage = 'overview' | 'sectionIntro' | 'assessment' | 'results' | 'review';

export function MainPlayer({ playerConfig, onPlayerEvent }: MainPlayerProps) {
  const {
    state,
    setPlayerConfig,
    setSections,
    setCurrentSection,
    setCurrentQuestion,
    setLoading,
    setError,
    clearError,
    resetState,
    setAttempt,
  } = useQuml();
  const language = state.language;

  // Assessment-level metadata source for the overview. Embedded: playerConfig.data.
  // Fetched: the raw questionset root returned by the data service.
  const [metadata, setMetadata] = useState<Record<string, unknown>>({});

  const [stage, setStage] = useState<Stage>('overview');
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Transient submit-confirmation dialog (spec §7.0); overlays the assessment shell.
  const [submitDialog, setSubmitDialog] = useState(false);
  // Where Review opens to (set when entering review from results).
  const [reviewStartIndex, setReviewStartIndex] = useState(0);
  // Assessment-level countdown (owned by the shell, not Context). Null = no limit.
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Section intros can be disabled via config (spec §6.0).
  const sectionIntrosEnabled =
    (playerConfig?.config as { showSectionIntro?: boolean } | undefined)?.showSectionIntro !== false;

  // Initialize config + normalized sections.
  //
  // Two data sources, decided by shape (never both):
  //   - EMBEDDED: playerConfig.data.sections is present → normalize inline (sync).
  //   - FETCHED:  no embedded sections but an identifier → the data service
  //     fetches the hierarchy + questions and returns normalized sections.
  //
  // Extracted so Retake (spec §7.5) can re-initialize after resetState() — which
  // returns initialState and therefore clears playerConfig/sections.
  const initializeFromConfig = useCallback(async () => {
    if (!playerConfig) return;
    setPlayerConfig(playerConfig);

    const data = (playerConfig.data as Record<string, unknown> | undefined) ?? {};
    const rawSections = (data.sections as unknown[] | undefined) ?? [];

    // EMBEDDED path (unchanged behavior).
    if (rawSections.length > 0) {
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
      setMetadata(data);
      setSections(sections);
      return;
    }

    // FETCHED path — delegate ALL network + normalization to the data service.
    const identifier = data.identifier as string | undefined;
    if (!identifier) return;
    // API base URL only — the content/asset base (config.baseUrl) is separate and
    // used for image resolution, so it must NOT leak into API requests.
    const baseUrl = (playerConfig.context?.host as string | undefined) ?? '';

    setLoading(true);
    try {
      const { metadata: qsMetadata, sections } = await loadQuestionSet(identifier, {
        baseUrl,
        language: playerConfig.config?.language,
      });
      setMetadata(qsMetadata as Record<string, unknown>);
      setSections(sections);
      setLoading(false);
    } catch (err) {
      const message =
        err instanceof QumlApiError ? err.message : 'Failed to load the assessment.';
      setError(message);
    }
  }, [playerConfig, setPlayerConfig, setSections, setLoading, setError]);

  useEffect(() => {
    initializeFromConfig();
  }, [initializeFromConfig]);

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
        if (!isAnswered(answer)) {
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
    const data = metadata;
    const totalQuestions = state.sections.reduce((n, s) => n + s.children.length, 0);
    const maxScore = state.sections.reduce(
      (n, s) => n + s.children.reduce((m, q) => m + (q.maxScore ?? 1), 0),
      0,
    );
    const timeLimits = (data.timeLimits as { questionSet?: { max?: number } } | undefined)
      ?.questionSet;
    const cfg = (playerConfig?.config as { maxAttempts?: number } | undefined) ?? {};
    return {
      title: readI18n(data.name as I18nValue | undefined, language) || t(language, 'ASSESSMENT_OVERVIEW'),
      description: readI18n(data.description as I18nValue | undefined, language) || undefined,
      instructions: data.instructions as string | undefined,
      totalQuestions,
      totalSections: state.sections.length,
      timeLimit: Number(timeLimits?.max) || 0,
      maxScore,
      attemptsLeft: Math.max(0, (cfg.maxAttempts ?? 3) - (state.attemptNumber - 1)),
    };
  }, [metadata, playerConfig, state.sections, state.attemptNumber, language]);

  // Stages where the exam clock runs: once started, it keeps ticking through
  // section intros (switching sections doesn't stop the clock). It PAUSES on
  // Start/Overview, Results and Review.
  const isClockRunning = stage === 'assessment' || stage === 'sectionIntro';

  // Shell countdown. Remaining time is derived from a fixed deadline timestamp
  // rather than by decrementing per tick, so re-creating the interval at a
  // stage boundary can't accumulate drift.
  const deadlineRef = useRef<number | null>(null);
  useEffect(() => {
    if (!isClockRunning || timeRemaining == null) {
      deadlineRef.current = null;
      return;
    }
    // Anchor the deadline from whatever time was left when the assessment
    // (re)started; a paused-then-resumed clock continues from the frozen value.
    deadlineRef.current = Date.now() + timeRemaining * 1000;
    const id = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadlineRef.current! - Date.now()) / 1000));
      setTimeRemaining(remaining);
      if (remaining <= 0) clearInterval(id);
    }, 250);
    return () => clearInterval(id);
    // Re-anchor only when the clock starts/stops, NOT every tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClockRunning]);

  // Count-up elapsed timer (Angular header showCountUp parity): when the
  // assessment has NO time limit, the header shows time spent instead of a
  // countdown. Same run/pause semantics as the countdown, anchored to a
  // timestamp so it never drifts.
  const [timeElapsed, setTimeElapsed] = useState(0);
  const elapsedAnchorRef = useRef<number | null>(null);
  useEffect(() => {
    if (!isClockRunning || overview.timeLimit > 0) return;
    elapsedAnchorRef.current = Date.now() - timeElapsed * 1000;
    const id = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - elapsedAnchorRef.current!) / 1000));
    }, 250);
    return () => clearInterval(id);
    // Re-anchor only when the clock starts/stops; timeElapsed is read once as
    // the resume point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClockRunning, overview.timeLimit]);

  // Time up → auto-submit straight to results (no confirmation dialog).
  useEffect(() => {
    if (timeRemaining === 0) {
      setSubmitDialog(false);
      setStage('results');
    }
  }, [timeRemaining]);

  // Flattened question list across all sections, for review + counts.
  const allQuestions = useMemo(
    () => state.sections.flatMap((s) => s.children),
    [state.sections],
  );

  // Per-section completion (every child answered) — drives the section step dots.
  const completed = useMemo(
    () =>
      state.sections.map((s) =>
        s.children.length > 0 && s.children.every((q) => isAnswered(state.answers[q.identifier])),
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

  // Submit (header) → open the confirmation dialog (spec §7.1).
  const handleSubmitAssessment = () => setSubmitDialog(true);

  const handleConfirmSubmit = () => {
    setSubmitDialog(false);
    setStage('results');
    onPlayerEvent?.({ type: 'quizEnd', summary });
  };

  const handleCancelSubmit = () => setSubmitDialog(false);

  const handleReviewAll = () => {
    setReviewStartIndex(0);
    setStage('review');
  };

  // Retake (spec §7.5): clear answers via resetState(), re-initialize from the
  // config prop (resetState wipes config/sections), bump the attempt, return to
  // Overview, and reset the shell timer.
  const handleRetake = () => {
    const nextAttempt = state.attemptNumber + 1;
    resetState();
    initializeFromConfig();
    setAttempt(nextAttempt);
    setTimeRemaining(null);
    setTimeElapsed(0);
    setSubmitDialog(false);
    setStage('overview');
  };

  const handleSectionEnd = () => {
    const nextIndex = state.currentSectionIndex + 1;
    if (nextIndex < state.sections.length) {
      setCurrentSection(nextIndex);
      setCurrentQuestion(0);
      setStage(sectionIntrosEnabled ? 'sectionIntro' : 'assessment');
      onPlayerEvent?.({ type: 'sectionEnd', sectionIndex: state.currentSectionIndex });
    } else {
      // End of the last section → confirm before submitting.
      setSubmitDialog(true);
    }
  };

  const handleSectionJump = (index: number) => {
    setCurrentSection(index);
    setCurrentQuestion(0);
    setStage('assessment');
  };

  if (!state.playerConfig || state.loading) {
    return <div className={styles.status}>{t(language, 'LOADING')}</div>;
  }
  if (state.error) {
    // Retry: clear the error and re-run the fetch/normalize pipeline.
    const handleRetry = () => {
      clearError();
      initializeFromConfig();
    };
    return (
      <div className={styles.error}>
        <p>{state.error}</p>
        <button type="button" onClick={handleRetry}>
          {t(language, 'RETRY')}
        </button>
      </div>
    );
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
  } else if (stage === 'results') {
    // Total time spent: countdown mode → limit minus what was left; count-up
    // mode → the elapsed counter (both tick only during the assessment stage).
    const timeTaken =
      overview.timeLimit > 0
        ? overview.timeLimit - (timeRemaining ?? overview.timeLimit)
        : timeElapsed;
    content = (
      <ResultsScreen
        summary={summary}
        timeTaken={timeTaken}
        onReviewAll={handleReviewAll}
        onRetake={handleRetake}
        language={language}
      />
    );
  } else if (stage === 'review') {
    content = (
      <ReviewScreen
        questions={allQuestions}
        sections={state.sections}
        answers={state.answers}
        startIndex={reviewStartIndex}
        onExit={() => setStage('results')}
        language={language}
      />
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
          isLastSection={state.currentSectionIndex === state.sections.length - 1}
        />
      );

    // The header timer ALWAYS shows (intentional deviation from Angular's
    // content-driven showTimer flag): countdown when a time limit exists,
    // count-up elapsed otherwise.
    content = (
      <>
        <PlayerHeader
          brand={overview.title}
          sections={state.sections}
          currentSectionIndex={state.currentSectionIndex}
          completed={completed}
          timeRemaining={timeRemaining}
          timeElapsed={overview.timeLimit === 0 ? timeElapsed : null}
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

        {submitDialog && (
          <SubmitModal
            answeredCount={overview.totalQuestions - summary.skipped}
            unansweredCount={summary.skipped}
            onConfirm={handleConfirmSubmit}
            onCancel={handleCancelSubmit}
            language={language}
          />
        )}
      </>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={styles.appShell}>{content}</div>
    </DndProvider>
  );
}
