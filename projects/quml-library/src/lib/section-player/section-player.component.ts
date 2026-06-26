import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { errorCode, errorMessage, ErrorService } from '@project-sunbird/sunbird-player-sdk-v9';
import * as _ from 'lodash-es';
import { CarouselComponent } from 'ngx-bootstrap/carousel';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { QumlPlayerConfig, IParentConfig, IAttempts } from '../quml-library-interface';
import { ViewerService } from '../services/viewer-service/viewer-service';
import { eventName, pageId, TelemetryType, Cardinality, QuestionType } from '../telemetry-constants';
import { DEFAULT_SCORE, COMPATABILITY_LEVEL } from '../player-constants';
import { UtilService } from '../util-service';

@Component({
  standalone: false,
  selector: 'quml-section-player',
  templateUrl: './section-player.component.html',
  styleUrls: ['./section-player.component.scss', './../startpage/sb-ckeditor-styles.scss']
})
export class SectionPlayerComponent implements OnChanges, AfterViewInit {

  @Input() sectionConfig: QumlPlayerConfig;
  @Input() attempts: IAttempts;
  @Input() jumpToQuestion;
  @Input() mainProgressBar;
  @Input() sectionIndex = 0;
  @Input() parentConfig: IParentConfig;

  @Output() playerEvent = new EventEmitter<any>();
  @Output() sectionEnd = new EventEmitter<any>();
  @Output() showScoreBoard = new EventEmitter<any>();

  @ViewChild('myCarousel', { static: false }) myCarousel: CarouselComponent;
  @ViewChild('imageModal', { static: true }) imageModal: ElementRef;
  @ViewChild('questionSlide', { static: false }) questionSlide: ElementRef;

  destroy$: Subject<boolean> = new Subject<boolean>();
  loadView = false;
  showContentError = false;
  noOfTimesApiCalled = 0;
  currentSlideIndex = 0;
  showStartPage = true;
  threshold: number;
  questions = [];
  /**
   * Saved answers for the current section's questions, keyed by identifier, so the
   * template binds a plain property read instead of calling viewerService on every
   * change-detection tick. Rebuilt whenever `questions` (re)load — slides only read
   * it at mount, and trackBy reuses views within a section, so a per-save refresh
   * isn't needed (the child owns its live state once mounted).
   */
  savedResponses: Record<string, any> = {};
  questionIds: string[];
  noOfQuestions: number;
  initialTime: number;
  timeLimit: any;
  warningTime: number;
  showWarningTimer: boolean;
  showTimer: any;
  showFeedBack: boolean;
  showUserSolution: boolean;
  startPageInstruction: string;
  maxScore: number;
  points: number;
  initializeTimer: boolean;
  linearNavigation: boolean;
  showHints: any;
  allowSkip: boolean;
  progressBarClass = [];
  currentQuestionsMedia: any;
  disableNext: boolean;
  endPageReached: boolean;
  tryAgainClicked = false;
  currentOptionSelected: any;
  carouselConfig = {
    NEXT: 1,
    PREV: 2
  };
  active = false;
  showAlert: boolean;
  currentOptions: any;
  currentOptionsLayout: 'list' | 'pairs' = 'list';
  currentQuestion: any;
  currentQuestionIndetifier: string;
  media: any;
  currentSolutions: any;
  showSolution: any;
  optionSelectedObj: any;
  intervalRef: any;
  alertType: string;
  infoPopup: boolean;
  stopAutoNavigation: boolean;
  jumpSlideIndex: any;
  showQuestions = false;
  showZoomModal = false;
  zoomImgSrc: string;
  imageZoomCount = 100;
  showRootInstruction = true;
  slideDuration = 0;
  initialSlideDuration: number;
  disabledHandle: any;
  isAssessEventRaised = false;
  isShuffleQuestions = false;
  shuffleOptions: boolean;
  playerContentCompatibiltyLevel = COMPATABILITY_LEVEL;

  constructor(
    public viewerService: ViewerService,
    public utilService: UtilService,
    private cdRef: ChangeDetectorRef,
    public errorService: ErrorService
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    /* istanbul ignore else */
    if (changes && Object.values(changes)[0].firstChange) {
      this.subscribeToEvents();
    }
    this.viewerService.sectionConfig = this.sectionConfig;
    this.setConfig();
  }

  ngAfterViewInit() {
    this.viewerService.raiseStartEvent(0);
    this.viewerService.raiseHeartBeatEvent(eventName.startPageLoaded, 'impression', 0);
  }

  private subscribeToEvents(): void {
    this.viewerService.qumlPlayerEvent
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.playerEvent.emit(res);
      });

    this.viewerService.qumlQuestionEvent
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {

        if (res?.error) {
          let traceId;
          if (_.has(this.sectionConfig, 'config')) {
            traceId = this.sectionConfig.config;
          }
          if (navigator.onLine && this.viewerService.isAvailableLocally) {
            this.viewerService.raiseExceptionLog(errorCode.contentLoadFails, errorMessage.contentLoadFails,
              new Error(errorMessage.contentLoadFails), traceId);
          } else {
            this.viewerService.raiseExceptionLog(errorCode.internetConnectivity, errorMessage.internetConnectivity,
              new Error(errorMessage.internetConnectivity), traceId);
          }
          this.showContentError = true;
          return;
        }

        if (!res?.questions) {
          return;
        }
        // Merge API question data into existing questions, keyed by identifier:
        // - existing order is preserved; each stub is replaced by its full API version when available
        // - any questions only present in the API response are appended
        // Using a Map gives O(1) lookups and guarantees uniqueness by identifier.
        const apiById = new Map(res.questions.map((q: any) => [q.identifier, q]));
        const mergedById = new Map<string, any>();
        this.questions.forEach((q: any) => mergedById.set(q.identifier, apiById.get(q.identifier) || q));
        res.questions.forEach((q: any) => { if (!mergedById.has(q.identifier)) { mergedById.set(q.identifier, q); } });
        this.questions = Array.from(mergedById.values());
        this.sortQuestions();
        this.refreshSavedResponses();
        this.viewerService.updateSectionQuestions(this.sectionConfig.metadata.identifier, this.questions);
        this.cdRef.detectChanges();
        this.noOfTimesApiCalled++;
        this.loadView = true;
        if (this.currentSlideIndex > 0 && this.myCarousel) {
          this.myCarousel.selectSlide(this.currentSlideIndex);
          if (this.questions[this.currentSlideIndex - 1]) {
            this.currentQuestionsMedia = this.questions[this.currentSlideIndex - 1]?.media;
            this.setImageZoom();
            this.highlightQuestion();
          }
        }

        if (this.currentSlideIndex === 0) {
          if (this.showStartPage) {
            this.active = this.sectionIndex === 0;
          } else {
            setTimeout(() => { this.nextSlide(); });
          }
        }
        this.removeAttribute();
      });
  }

  private setConfig() {
    this.noOfTimesApiCalled = 0;
    this.currentSlideIndex = 0;
    this.active = this.currentSlideIndex === 0 && this.sectionIndex === 0 && this.showStartPage;

    /* istanbul ignore else */
    if (this.myCarousel) {
      this.myCarousel.selectSlide(this.currentSlideIndex);
    }
    this.threshold = this.sectionConfig?.context?.threshold || 3;
    this.questionIds = _.cloneDeep(this.sectionConfig.metadata.childNodes);

    /* istanbul ignore else */
    if (this.parentConfig.isReplayed) {
      this.initializeTimer = true;
      this.viewerService.raiseStartEvent(0);
      this.viewerService.raiseHeartBeatEvent(eventName.startPageLoaded, 'impression', 0);
      this.disableNext = false;
      this.currentSlideIndex = 0;
      this.myCarousel.selectSlide(0);
      this.showRootInstruction = true;
      this.currentQuestionsMedia = _.get(this.questions[0], 'media');
      this.setImageZoom();
      this.loadView = true;
      this.removeAttribute();

      setTimeout(() => {
        const menuBtn: HTMLElement = document.querySelector('#overlay-button');
        /* istanbul ignore else */
        if (menuBtn) {
          menuBtn.focus({ preventScroll: true });
        }
      }, 200);
    }

    this.shuffleOptions = this.sectionConfig.config?.shuffleOptions;
    this.isShuffleQuestions = this.sectionConfig.metadata.shuffle;
    this.noOfQuestions = this.questionIds.length;
    this.viewerService.initialize(this.sectionConfig, this.threshold, this.questionIds, this.parentConfig);
    this.checkCompatibilityLevel(this.sectionConfig.metadata.compatibilityLevel);
    this.timeLimit = this.sectionConfig.metadata?.timeLimits?.questionSet?.max || 0;
    this.warningTime = this.timeLimit ? (this.timeLimit - (this.timeLimit * this.parentConfig.warningTime / 100)) : 0;
    this.showWarningTimer = this.parentConfig.showWarningTimer;
    this.showTimer = this.sectionConfig.metadata?.showTimer;

    this.showFeedBack = this.sectionConfig.metadata?.showFeedback
      ?? this.parentConfig.showFeedback
      ?? 'Yes';

    this.showUserSolution = this.sectionConfig.metadata?.showSolutions;
    this.startPageInstruction = this.sectionConfig.metadata?.instructions || this.parentConfig.instructions;
    this.linearNavigation = this.sectionConfig.metadata.navigationMode === 'non-linear' ? false : true;
    this.showHints = this.sectionConfig.metadata?.showHints;
    this.points = this.sectionConfig.metadata?.points;

    this.allowSkip = this.sectionConfig.metadata?.allowSkip?.toLowerCase() !== 'no';
    this.showStartPage = this.sectionConfig.metadata?.showStartPage?.toLowerCase() !== 'no';
    this.progressBarClass = this.parentConfig.isSectionsAvailable ? this.mainProgressBar.find(item => item.isActive)?.children :
      this.mainProgressBar;

    if (this.progressBarClass) {
      this.progressBarClass.forEach(item => item.showFeedback = this.showFeedBack);
    }

    this.questions = this.viewerService.getSectionQuestions(this.sectionConfig.metadata.identifier);
    this.sortQuestions();
    this.refreshSavedResponses();
    this.viewerService.updateSectionQuestions(this.sectionConfig.metadata.identifier, this.questions);
    this.resetQuestionState();
    if (this.jumpToQuestion) {
      this.goToQuestion(this.jumpToQuestion);
    } else if (this.threshold === 1) {
      this.viewerService.getQuestion();
    } else if (this.threshold > 1) {
      this.viewerService.getQuestions();
    }

    if (!this.sectionConfig.metadata?.children?.length) {
      this.loadView = true;
      this.disableNext = true;
    }

    if (!this.initializeTimer) {
      this.initializeTimer = true;
    }
    this.initialTime = this.initialSlideDuration = new Date().getTime();
  }

  removeAttribute() {
    setTimeout(() => {
      const firstSlide: HTMLElement = document.querySelector('.carousel.slide');
      /* istanbul ignore else */
      if (firstSlide) {
        firstSlide.removeAttribute("tabindex");
      }
    }, 100);
  }

  /**
   * Tracks carousel slides by question identifier so the slide views are reused
   * across re-renders (e.g. when `questions` is reassigned by the per-section
   * re-fetch/merge on returning to a section). Without this, Angular tracks by
   * object identity, tears down and rebuilds every slide, and the carousel can
   * desync and show two questions on one page.
   */
  trackByQuestionIdentifier(index: number, question: any): string | number {
    return question?.identifier ?? index;
  }

  sortQuestions() {
    /* istanbul ignore else */
    if (this.questions.length && this.questionIds.length) {
      const ques = [];
      this.questionIds.forEach((questionId) => {
        const que = this.questions.find(question => question.identifier === questionId);
        /* istanbul ignore else */
        if (que) {
          ques.push(que);
        }
      });
      this.questions = ques;
    }
  }

  createSummaryObj() {
    const classObj = _.groupBy(this.progressBarClass, 'class');
    return {
      skipped: classObj?.skipped?.length || 0,
      correct: classObj?.correct?.length || 0,
      wrong: classObj?.wrong?.length || 0,
      partial: classObj?.partial?.length || 0
    };
  }

  nextSlide() {
    this.currentQuestionsMedia = _.get(this.questions[this.currentSlideIndex], 'media');
    this.getQuestion();
    this.viewerService.raiseHeartBeatEvent(eventName.nextClicked, TelemetryType.interact, this.myCarousel.getCurrentSlideIndex() + 1);
    this.viewerService.raiseHeartBeatEvent(eventName.nextClicked, TelemetryType.impression, this.myCarousel.getCurrentSlideIndex() + 1);

    /* istanbul ignore else */
    if (this.currentSlideIndex !== this.questions.length) {
      this.currentSlideIndex = this.currentSlideIndex + 1;
    }

    /* istanbul ignore else */
    if (this.myCarousel.isLast(this.myCarousel.getCurrentSlideIndex()) || this.noOfQuestions === this.myCarousel.getCurrentSlideIndex()) {
      this.calculateScore();
    }

    /* istanbul ignore else */
    if (this.myCarousel.getCurrentSlideIndex() > 0 && this.currentOptionSelected) {
      const prevQuestion = this.questions[this.myCarousel.getCurrentSlideIndex() - 1];
      const option = this.currentOptionSelected?.option ? this.currentOptionSelected['option'] : undefined;
      this.viewerService.raiseResponseEvent(prevQuestion.identifier, prevQuestion.qType, option);
    }

    /* istanbul ignore else */
    if (this.questions[this.myCarousel.getCurrentSlideIndex()]) {
      this.setSkippedClass(this.myCarousel.getCurrentSlideIndex());
    }

    /* istanbul ignore else */
    if (this.myCarousel.getCurrentSlideIndex() === this.noOfQuestions) {
      this.clearTimeInterval();
      this.emitSectionEnd();
      return;
    }
    // Reset BEFORE moving: myCarousel.move() fires activeSlideChange →
    // restoreSavedResponseForCurrentSlide(), which is the single point that
    // (re)establishes per-slide state. Resetting after move() would wipe that
    // restore, making it take effect only on backward/jump navigation.
    this.resetQuestionState();
    this.myCarousel.move(this.carouselConfig.NEXT);
    this.setImageZoom();
    this.clearTimeInterval();
  }

  prevSlide() {
    this.disableNext = false;
    this.currentSolutions = undefined;
    this.viewerService.raiseHeartBeatEvent(eventName.prevClicked, TelemetryType.interact, this.myCarousel.getCurrentSlideIndex() - 1);
    this.showAlert = false;

    /* istanbul ignore else */
    if (this.currentSlideIndex !== this.questions.length) {
      this.currentSlideIndex = this.currentSlideIndex + 1;
    }

    if (this.myCarousel.getCurrentSlideIndex() + 1 === this.noOfQuestions && this.endPageReached) {
      this.endPageReached = false;
    } else {
      this.myCarousel.move(this.carouselConfig.PREV);
    }
    this.currentSlideIndex = this.myCarousel.getCurrentSlideIndex();
    this.active = this.currentSlideIndex === 0 && this.sectionIndex === 0 && this.showStartPage;
    this.currentQuestionsMedia = _.get(this.questions[this.myCarousel.getCurrentSlideIndex() - 1], 'media');
    this.setImageZoom();
    this.setSkippedClass(this.myCarousel.getCurrentSlideIndex() - 1);
  }

  getQuestion() {
    if (this.myCarousel.getCurrentSlideIndex() > 0
      && ((this.threshold * this.noOfTimesApiCalled) - 1) === this.myCarousel.getCurrentSlideIndex()
      && this.threshold * this.noOfTimesApiCalled >= this.questions.length && this.threshold > 1) {
      this.viewerService.getQuestions();
    }

    if (this.myCarousel.getCurrentSlideIndex() > 0
      && this.questions[this.myCarousel.getCurrentSlideIndex()] === undefined && this.threshold > 1) {
      this.viewerService.getQuestions();
    }

    if (this.threshold === 1 && this.myCarousel.getCurrentSlideIndex() >= 0) {
      this.viewerService.getQuestion();
    }
  }

  resetQuestionState() {
    this.active = false;
    this.showAlert = false;
    this.optionSelectedObj = undefined;
    this.currentOptionSelected = undefined;
    this.currentQuestion = undefined;
    this.currentOptions = undefined;
    this.currentSolutions = undefined;
  }

  activeSlideChange(event) {
    this.initialSlideDuration = new Date().getTime();
    this.isAssessEventRaised = false;
    const questionElement: HTMLElement = document.querySelector('li.progressBar-border');
    const progressBarContainer: HTMLElement = document.querySelector(".lanscape-mode-right");

    /* istanbul ignore else */
    if (progressBarContainer && questionElement && !this.parentConfig.isReplayed) {
      this.utilService.scrollParentToChild(progressBarContainer, questionElement);
    }

    const contentElement: HTMLElement = document.querySelector(".landscape-content");
    if (contentElement) {
      contentElement.scrollTop = 0;
    }

    this.viewerService.pauseVideo();
    this.restoreSavedResponseForCurrentSlide();
  }

  /**
   * Re-establishes section-player state for a previously-answered question when
   * the learner lands on its slide (e.g. returning to an earlier section). The
   * component itself restores the visible selection from `savedResponse`; here we
   * restore optionSelectedObj so navigation/feedback behave as if it were answered.
   * Scoring/ASSESS are NOT re-run here — the score already lives in mainProgressBar
   * and ASSESS is deduped by identifier in viewerService.
   */
  private restoreSavedResponseForCurrentSlide(): void {
    if (!this.myCarousel) { return; }
    const currentIndex = this.myCarousel.getCurrentSlideIndex() - 1;
    if (currentIndex < 0 || !this.questions[currentIndex]) { return; }
    const saved = this.viewerService.getUserResponse(this.questions[currentIndex].identifier);
    if (saved) {
      this.optionSelectedObj = saved;
      this.currentOptionSelected = saved;
      this.currentSolutions = !_.isEmpty(saved.solutions) ? saved.solutions : undefined;
      this.active = true;
    } else {
      // No saved answer for this question — clear any selection that may have been
      // restored on a previously-visited slide. prevSlide()/goToSlide() don't call
      // resetQuestionState(), so without this an answered slide's optionSelectedObj
      // would leak forward and the next (unanswered) question would be scored with it.
      this.optionSelectedObj = undefined;
      this.currentOptionSelected = undefined;
      this.currentSolutions = undefined;
      this.active = false;
    }
  }

  /**
   * Rebuilds the saved-answer lookup for the current section's questions from the
   * ViewerService store. Called whenever `questions` are (re)loaded.
   */
  private refreshSavedResponses(): void {
    const map: Record<string, any> = {};
    (this.questions || []).forEach((q: any) => {
      const saved = this.viewerService.getUserResponse(q?.identifier);
      if (saved) { map[q.identifier] = saved; }
    });
    this.savedResponses = map;
  }

  nextSlideClicked(event) {
    if (this.showRootInstruction && this.parentConfig.isSectionsAvailable) {
      this.showRootInstruction = false;
      return;
    }
    if (this.myCarousel.getCurrentSlideIndex() === 0) {
      return this.nextSlide();
    }
    /* istanbul ignore else */
    if (event?.type === 'next') {
      this.validateSelectedOption(this.optionSelectedObj, 'next');
    }
  }

  previousSlideClicked(event) {
    /* istanbul ignore else */
    if (event.event === 'previous clicked') {
      if (this.optionSelectedObj && this.showFeedBack) {
        this.stopAutoNavigation = false;
        this.validateSelectedOption(this.optionSelectedObj, 'previous');
      } else {
        this.stopAutoNavigation = true;
        if (this.currentSlideIndex === 0 && this.parentConfig.isSectionsAvailable && this.getCurrentSectionIndex() > 0) {
          const previousSectionId = this.mainProgressBar[this.getCurrentSectionIndex() - 1].identifier;
          this.jumpToSection(previousSectionId);
          return;
        }
        this.prevSlide();
      }
    }
  }

  updateScoreForShuffledQuestion() {
    const currentIndex = this.myCarousel.getCurrentSlideIndex() - 1;

    if (this.isShuffleQuestions) {
      this.updateScoreBoard(currentIndex, 'correct', undefined, DEFAULT_SCORE);
    }
  }

  getCurrentSectionIndex(): number {
    const currentSectionId = this.sectionConfig.metadata.identifier;
    return this.mainProgressBar.findIndex(section => section.identifier === currentSectionId);
  }

  goToSlideClicked(event, index) {
    /* istanbul ignore else */
    if (!this.progressBarClass?.length) {
      /* istanbul ignore else */
      if (index === 0) {
        this.jumpSlideIndex = 0;
        this.goToSlide(this.jumpSlideIndex);
      }
      return;
    }
    event.stopPropagation();
    this.active = false;
    this.jumpSlideIndex = index;
    if (this.optionSelectedObj && this.showFeedBack) {
      this.stopAutoNavigation = false;
      this.validateSelectedOption(this.optionSelectedObj, 'jump');
    } else {
      this.stopAutoNavigation = true;
      this.goToSlide(this.jumpSlideIndex);
    }
  }

  onEnter(event, index) {
    /* istanbul ignore else */
    if (event.keyCode === 13) {
      event.stopPropagation();
      this.goToSlideClicked(event, index);
    }
  }

  jumpToSection(identifier: string) {
    this.showRootInstruction = false;
    this.emitSectionEnd(false, identifier);
  }

  onSectionEnter(event, identifier: string) {
    /* istanbul ignore else */
    if (event.keyCode === 13) {
      event.stopPropagation();
      /* istanbul ignore else */
      if (this.optionSelectedObj) {
        this.validateSelectedOption(this.optionSelectedObj, 'jump');
      }
      this.jumpToSection(identifier);
    }
  }

  onScoreBoardClicked() {
    this.viewerService.updateSectionQuestions(this.sectionConfig.metadata.identifier, this.questions);
    this.showScoreBoard.emit();
  }

  onScoreBoardEnter(event: KeyboardEvent) {
    event.stopPropagation();
    /* istanbul ignore else */
    if (event.key === 'Enter') {
      this.onScoreBoardClicked();
    }
  }

  focusOnNextButton() {
    setTimeout(() => {
      const nextBtn: HTMLElement = document.querySelector('.quml-navigation__next');
      /* istanbul ignore else */
      if (nextBtn) {
        nextBtn.focus({ preventScroll: true });
      }
    }, 100);
  }

  getOptionSelected(optionSelected) {
    /* istanbul ignore else */
    if (optionSelected.cardinality === Cardinality.single && JSON.stringify(this.currentOptionSelected) === JSON.stringify(optionSelected)) {
      return; // Same option selected
    }
    // Don't steal focus for text-input question types (FTB) where the user is mid-typing
    if (optionSelected.cardinality !== Cardinality.ftb) {
      this.focusOnNextButton();
    }
    this.active = true;
    this.currentOptionSelected = optionSelected;
    const currentIndex = this.myCarousel.getCurrentSlideIndex() - 1;
    if (currentIndex < 0 || !this.questions[currentIndex]) return;
    this.viewerService.raiseHeartBeatEvent(eventName.optionClicked, TelemetryType.interact, this.myCarousel.getCurrentSlideIndex());

    // This optionSelected comes empty whenever the try again is clicked on feedback popup
    if (_.isEmpty(optionSelected?.option)) {
      this.optionSelectedObj = undefined;
      this.currentSolutions = undefined;
      this.updateScoreBoard(currentIndex, 'skipped');
    } else {
      this.optionSelectedObj = optionSelected;
      this.isAssessEventRaised = false;
      this.currentSolutions = !_.isEmpty(optionSelected.solutions) ? optionSelected.solutions : undefined;
    }
    this.currentQuestionIndetifier = this.questions[currentIndex].identifier;
    this.media = _.get(this.questions[currentIndex], 'media', []);

    // Persist the learner's answer so it survives section navigation (and is
    // re-shown on revisit). A real (non-empty) user selection also clears the
    // assessed flag so a changed answer is re-assessed. The empty-option path
    // (skip / try-again) only clears the stored answer — it must NOT re-open the
    // ASSESS dedup gate, or a skip-then-reselect-the-same-answer would emit a
    // redundant ASSESS for an answer already assessed this attempt.
    if (!_.isEmpty(optionSelected?.option)) {
      this.viewerService.clearAssessed(this.currentQuestionIndetifier);
    }
    this.viewerService.saveUserResponse(
      this.currentQuestionIndetifier,
      _.isEmpty(optionSelected?.option) ? null : optionSelected,
    );

    /* istanbul ignore else */
    if (!this.showFeedBack) {
      this.validateSelectedOption(this.optionSelectedObj);
    }
  }

  durationEnds() {
    this.showSolution = false;
    this.showAlert = false;
    this.viewerService.pauseVideo();
    this.emitSectionEnd(true);
  }

  private checkCompatibilityLevel(compatibilityLevel) {
    /* istanbul ignore else */
    if (compatibilityLevel) {
      // TODO: It is a temporary fix for IQ-679 or ED-3398
      // Before these changes we were calling errorService.checkContentCompatibility
      const checkContentCompatible = this.checkContentCompatibility(compatibilityLevel);

      /* istanbul ignore else */
      if (!checkContentCompatible.isCompitable) {
        this.viewerService.raiseExceptionLog(errorCode.contentCompatibility, errorMessage.contentCompatibility,
          checkContentCompatible.error, this.sectionConfig?.config?.traceId);
      }
    }
  }

  checkContentCompatibility(currentCompatibilityLevel: number) {
    if (currentCompatibilityLevel > this.playerContentCompatibiltyLevel) {
      const compatibilityError = new Error();
      compatibilityError.message = `Player supports ${this.playerContentCompatibiltyLevel}
      but content compatibility is ${currentCompatibilityLevel}`;
      compatibilityError.name = 'contentCompatibily';
      return { error: compatibilityError, isCompitable: false };
    } else {
      return { error: null, isCompitable: true };
    }
  }

  emitSectionEnd(isDurationEnded: boolean = false, jumpToSection?: string) {
    const eventObj: any = {
      summary: this.createSummaryObj(),
      score: this.calculateScore(),
      durationSpent: this.utilService.getTimeSpentText(this.initialTime),
      slideIndex: this.myCarousel.getCurrentSlideIndex(),
      isDurationEnded,
    };
    if (jumpToSection) {
      eventObj.jumpToSection = jumpToSection;
    }
    this.viewerService.updateSectionQuestions(this.sectionConfig.metadata.identifier, this.questions);
    this.sectionEnd.emit(eventObj);
  }

  closeAlertBox(event) {
    if (event?.type === 'close') {
      this.viewerService.raiseHeartBeatEvent(eventName.closedFeedBack, TelemetryType.interact, this.myCarousel.getCurrentSlideIndex());
    } else if (event?.type === 'tryAgain') {
      this.tryAgainClicked = true;
      setTimeout(() => {
        this.tryAgainClicked = false;
      }, 2000);
      this.viewerService.raiseHeartBeatEvent(eventName.tryAgain, TelemetryType.interact, this.myCarousel.getCurrentSlideIndex());
    }
    this.showAlert = false;
  }

  setSkippedClass(index) {
    if (this.progressBarClass && _.get(this.progressBarClass[index], 'class') === 'unattempted') {
      this.progressBarClass[index].class = 'skipped';
    }
  }

  toggleScreenRotate(event?: KeyboardEvent | MouseEvent) {
    this.viewerService.raiseHeartBeatEvent(eventName.deviceRotationClicked, TelemetryType.interact, this.myCarousel.getCurrentSlideIndex() + 1);
  }

  validateSelectedOption(option, type?: string) {
    const selectedOptionValue = option?.option?.value;
    const currentIndex = this.myCarousel.getCurrentSlideIndex() - 1;
    const questionType = this.utilService.getQuestionType(this.questions, currentIndex)?.toUpperCase();
    const isSubjectiveQuestion = questionType === QuestionType.sa;
    const isQuestionSkipAllowed = !this.optionSelectedObj && this.allowSkip &&
      (questionType === QuestionType.mcq || questionType === QuestionType.mtf ||
       questionType === QuestionType.ftb || questionType === QuestionType.seq ||
       questionType === QuestionType.reo);
    const onStartPage = this.startPageInstruction && this.myCarousel.getCurrentSlideIndex() === 0;
    const isActive = !this.optionSelectedObj && this.active;
    const selectedQuestion = this.questions[currentIndex];
    const key = selectedQuestion.responseDeclaration ? this.utilService.getKeyValue(Object.keys(selectedQuestion.responseDeclaration)) : '';
    this.slideDuration = Math.round((new Date().getTime() - this.initialSlideDuration) / 1000);
    const getParams = () => {
      if (selectedQuestion.qType?.toUpperCase() === QuestionType.mcq && selectedQuestion?.editorState?.options) {
        return selectedQuestion.editorState.options;
      } else if (selectedQuestion.qType?.toUpperCase() === QuestionType.mcq && !_.isEmpty(selectedQuestion?.editorState)) {
        return [selectedQuestion?.editorState];
      } else {
        return [];
      }
    };
    const edataItem: any = {
      'id': selectedQuestion.identifier,
      'title': selectedQuestion.name,
      'desc': selectedQuestion.description,
      'type': selectedQuestion.qType?.toLowerCase() || '',
      'maxscore': key.length === 0 ? 0 : selectedQuestion.outcomeDeclaration?.maxScore?.defaultValue || 0,
      'params': getParams()
    };

    /* istanbul ignore else */
    if (edataItem && this.parentConfig.isSectionsAvailable) {
      edataItem.sectionId = this.sectionConfig.metadata.identifier;
    }

    /* istanbul ignore else */
    if (!this.optionSelectedObj && !this.isAssessEventRaised && selectedQuestion.qType?.toUpperCase() !== QuestionType.sa) {
      this.isAssessEventRaised = true;
      this.viewerService.raiseAssesEvent(edataItem, currentIndex + 1, 'No', 0, [], this.slideDuration);
    }

    if (isSubjectiveQuestion && !this.isAssessEventRaised) {
      this.isAssessEventRaised = true;
      this.updateScoreBoard(currentIndex, 'correct', undefined, 0);
    }

    if (this.optionSelectedObj) {
      this.currentQuestion = selectedQuestion.body;
      this.currentOptions = selectedQuestion.interactions?.[key]?.options;

      // A question with no correct-answer definition (responseDeclaration) — e.g. a stub
      // left in place because the API didn't return its full data — cannot be scored.
      // Mark it wrong and continue instead of crashing validateSelectedOption.
      if (!selectedQuestion.responseDeclaration || !key || !selectedQuestion.responseDeclaration[key]) {
        console.warn('[SectionPlayer] Missing responseDeclaration for question; cannot score:', selectedQuestion?.identifier);
        this.showAlert = true;
        this.alertType = 'wrong';
        this.updateScoreBoard(currentIndex, 'wrong', undefined, 0);
        if (!this.isAssessEventRaised) {
          this.isAssessEventRaised = true;
          this.viewerService.raiseAssesEvent(edataItem, currentIndex + 1, 'No', 0, [option.option], this.slideDuration);
        }
        if (this.showFeedBack) { this.correctFeedBackTimeOut(type); }
        this.optionSelectedObj = undefined;
        return;
      }

      if (option.cardinality === Cardinality.single) {
        const correctOptionValue = Number(selectedQuestion.responseDeclaration[key].correctResponse.value);

        this.showAlert = true;
        if (option.option?.value === correctOptionValue) {
          const currentScore = this.getScore(currentIndex, key, true);
          if (!this.isAssessEventRaised) {
            this.isAssessEventRaised = true;
            this.viewerService.raiseAssesEvent(edataItem, currentIndex + 1, 'Yes', currentScore, [option.option], this.slideDuration);
          }
          this.alertType = 'correct';
          if (this.showFeedBack)
            this.correctFeedBackTimeOut(type);
          this.updateScoreBoard(currentIndex, 'correct', undefined, currentScore);
        } else {
          const currentScore = this.getScore(currentIndex, key, false, option);
          this.alertType = 'wrong';
          const classType = this.progressBarClass[currentIndex].class === 'partial' ? 'partial' : 'wrong';
          this.updateScoreBoard(currentIndex, classType, selectedOptionValue, currentScore);

          /* istanbul ignore else */
          if (!this.isAssessEventRaised) {
            this.isAssessEventRaised = true;
            this.viewerService.raiseAssesEvent(edataItem, currentIndex + 1, 'No', 0, [option.option], this.slideDuration);
          }
        }
      }
      if (option.cardinality === Cardinality.multiple) {
        const responseDeclaration = this.questions[currentIndex].responseDeclaration;
        const outcomeDeclaration = this.questions[currentIndex].outcomeDeclaration;
        const currentScore = this.utilService.getMultiselectScore(option.option, responseDeclaration, this.isShuffleQuestions, outcomeDeclaration);
        this.showAlert = true;
        if (currentScore === 0) {
          if (!this.isAssessEventRaised) {
            this.isAssessEventRaised = true;
            this.viewerService.raiseAssesEvent(edataItem, currentIndex + 1, 'No', 0, [option.option], this.slideDuration);
          }
          this.alertType = 'wrong';
          this.updateScoreBoard(currentIndex, 'wrong');
        } else {
          this.updateScoreBoard(currentIndex, 'correct', undefined, currentScore);
          if (!this.isAssessEventRaised) {
            this.isAssessEventRaised = true;
            this.viewerService.raiseAssesEvent(edataItem, currentIndex + 1, 'Yes', currentScore, [option.option], this.slideDuration);
          }
          if (this.showFeedBack)
            this.correctFeedBackTimeOut(type);
          this.alertType = 'correct';
        }
      }

      // Auto-scored types (MTF map / FTB / SEQ-REO ordered). One shared path:
      //   responseProcessing.template === 'MAP_RESPONSE' → partial credit
      //     (sum the per-item `score` from responseDeclaration.mapping)
      //   otherwise → all-or-nothing / legacy proportional (no mapping).
      if (
        option.cardinality === Cardinality.map ||
        option.cardinality === Cardinality.ftb ||
        option.cardinality === Cardinality.ordered
      ) {
        const { earned, isFull } = this.evaluateAutoScored(selectedQuestion, key, option);
        this.applyAutoScore(currentIndex, edataItem, option, type, earned, isFull);
      }

      this.optionSelectedObj = undefined;
    } else if ((isQuestionSkipAllowed) || isSubjectiveQuestion || onStartPage || isActive) {
      if(!_.isUndefined(type)) {
        this.nextSlide();
      }
    } else if (this.startPageInstruction && !this.optionSelectedObj && !this.active && !this.allowSkip &&
      this.myCarousel.getCurrentSlideIndex() > 0 &&
      (questionType === QuestionType.mcq  || questionType === QuestionType.mtf ||
       questionType === QuestionType.ftb  || questionType === QuestionType.seq ||
       questionType === QuestionType.reo)
      && this.utilService.canGo(this.progressBarClass[this.myCarousel.getCurrentSlideIndex()])) {
      this.infoPopupTimeOut();
    } else if (!this.optionSelectedObj && !this.active && !this.allowSkip && this.myCarousel.getCurrentSlideIndex() >= 0 &&
      (questionType === QuestionType.mcq  || questionType === QuestionType.mtf ||
       questionType === QuestionType.ftb  || questionType === QuestionType.seq ||
       questionType === QuestionType.reo)
      && this.utilService.canGo(this.progressBarClass[this.myCarousel.getCurrentSlideIndex()])) {
      this.infoPopupTimeOut();
    }
  }

  infoPopupTimeOut() {
    this.infoPopup = true;
    setTimeout(() => {
      this.infoPopup = false;
    }, 2000);
  }

  correctFeedBackTimeOut(type?: string) {
    this.intervalRef = setTimeout(() => {
      if (this.showAlert) {
        this.showAlert = false;
        if (!this.myCarousel.isLast(this.myCarousel.getCurrentSlideIndex()) && type === 'next') {
          this.nextSlide();
        } else if (type === 'previous' && !this.stopAutoNavigation) {
          this.prevSlide();
        } else if (type === 'jump' && !this.stopAutoNavigation) {
          this.goToSlide(this.jumpSlideIndex);
        } else if (this.myCarousel.isLast(this.myCarousel.getCurrentSlideIndex())) {
          this.endPageReached = true;
          this.emitSectionEnd();
        }
      }
    }, 4000);
  }

  goToSlide(index) {
    this.viewerService.raiseHeartBeatEvent(eventName.goToQuestion, TelemetryType.interact, this.myCarousel.getCurrentSlideIndex());
    this.clearTimeInterval();
    this.showAlert = false;
    this.disableNext = false;
    this.currentSlideIndex = index;
    this.showRootInstruction = false;
    if (index === 0) {
      this.optionSelectedObj = undefined;
      this.myCarousel.selectSlide(0);
      this.active = this.currentSlideIndex === 0 && this.sectionIndex === 0 && this.showStartPage;
      this.showRootInstruction = true;
      /* istanbul ignore else */
      if (!this.sectionConfig.metadata?.children?.length) {
        this.disableNext = true;
      }
      return;
    }
    this.currentQuestionsMedia = _.get(this.questions[this.currentSlideIndex - 1], 'media');
    this.setSkippedClass(this.currentSlideIndex - 1);
    /* istanbul ignore else */
    if (!this.initializeTimer) {
      this.initializeTimer = true;
    }

    if (this.questions[index - 1] === undefined) {
      this.showQuestions = false;
      this.viewerService.getQuestions(0, index);
      this.currentSlideIndex = index;
    } else if (this.questions[index - 1] !== undefined) {
      this.myCarousel.selectSlide(index);
    }
    this.setImageZoom();
    this.currentSolutions = undefined;
    this.highlightQuestion();
  }

  goToQuestion(event) {
    this.active = false;
    this.showRootInstruction = false;
    this.disableNext = false;
    this.initializeTimer = true;
    const index = event.questionNo;
    this.currentSlideIndex = index;
    // Only fetch when the target question isn't already loaded. Calling
    // getQuestions() unconditionally re-splices identifiers and re-emits the
    // question event, which rebuilds the questions array and desyncs the
    // carousel — the jumped-to question briefly renders twice. Mirrors goToSlide.
    if (this.questions[index - 1] === undefined) {
      this.showQuestions = false;
      this.viewerService.getQuestions(0, index);
    } else {
      this.myCarousel.selectSlide(index);
    }
    // Mirror goToSlide/nextSlide: without setting the slide media and re-running
    // setImageZoom(), the jumped-to (first reviewed) question keeps its relative
    // <img src> and the image 404s until the learner navigates to the next slide.
    this.currentQuestionsMedia = _.get(this.questions[this.currentSlideIndex - 1], 'media');
    setTimeout(() => { this.setImageZoom(); });
    this.highlightQuestion();
  }

  highlightQuestion() {
    const currentQuestion = this.questions[this.currentSlideIndex - 1];
    const questionType = currentQuestion?.qType?.toUpperCase();
    const element: HTMLElement = document.getElementById(currentQuestion?.identifier);
    if (element && questionType) {
      let questionTitleElement: HTMLElement;

      switch (questionType) {
        case QuestionType.mcq:
          questionTitleElement = element.querySelector('.mcq-title');
          break;
        default:
          questionTitleElement = element.querySelector('.question-container');
      }

      if (questionTitleElement) {
        setTimeout(() => {
          questionTitleElement.focus({ preventScroll: true });
        }, 0);
      }
    }
  }

  getSolutions() {
    this.showAlert = false;
    this.viewerService.raiseHeartBeatEvent(eventName.showAnswer, TelemetryType.interact, this.myCarousel.getCurrentSlideIndex());
    this.viewerService.raiseHeartBeatEvent(eventName.showAnswer, TelemetryType.impression, this.myCarousel.getCurrentSlideIndex());
    this.prepareSolutionView();
    setTimeout(() => {
      this.setImageZoom();
    });
    setTimeout(() => {
      this.setImageHeightWidthClass();
    }, 100);
    /* istanbul ignore else */
    if (this.currentSolutions) {
      this.showSolution = true;
    }
    this.clearTimeInterval();
  }

  /**
   * Populates the solution panel's question/options/media for the current slide.
   * Shared by getSolutions() (left "answer" button) and viewSolution() (feedback
   * popup) so both entry points render a fully populated panel — previously
   * viewSolution() only toggled showSolution, leaving question/options stale.
   */
  private prepareSolutionView(): void {
    const currentIndex = this.myCarousel.getCurrentSlideIndex() - 1;
    const question: any = this.questions[currentIndex];
    if (!question) { return; }
    this.currentQuestion = question.body;
    // The solution panel renders options via *ngFor, so it needs an iterable.
    // MCQ-style options are already an array; MTF stores them as {left, right},
    // which we flatten into one list so the pairs still show; anything else (no
    // options) falls back to [] to avoid an NgFor error.
    const options = question.interactions?.response1?.options;
    if (_.isArray(options)) {
      this.currentOptions = options;
      this.currentOptionsLayout = 'list';
    } else if (options && (options.left || options.right)) {
      // MTF: interleave each left with its CORRECT right (per correctResponse) so
      // the panel's two-column 'pairs' layout shows the matched pairs side by side.
      this.currentOptions = this.buildMatchPairs(question, options.left || [], options.right || []);
      this.currentOptionsLayout = 'pairs';
    } else {
      this.currentOptions = [];
      this.currentOptionsLayout = 'list';
    }
    this.currentQuestionsMedia = _.get(question, 'media');
  }

  /**
   * Builds the MTF correct-pair list for the solution panel: each left option
   * followed by the right option it correctly maps to (per correctResponse,
   * leftValue -> rightValue). Falls back to positional pairing when there is no
   * correctResponse. The flat [left, right, left, right, ...] order fills the
   * panel's two-column 'pairs' grid so each pair lands on one row.
   */
  private buildMatchPairs(question: any, left: any[], right: any[]): any[] {
    const correct = question?.responseDeclaration?.response1?.correctResponse?.value || {};
    const rightByValue = new Map(right.map((r: any) => [String(r.value), r]));
    const pairs: any[] = [];
    left.forEach((l: any, i: number) => {
      pairs.push(l);
      const match = rightByValue.get(String(correct[l.value])) ?? right[i];
      if (match) { pairs.push(match); }
    });
    return pairs;
  }

  viewSolution() {
    this.viewerService.raiseHeartBeatEvent(eventName.viewSolutionClicked, TelemetryType.interact, this.myCarousel.getCurrentSlideIndex());
    this.prepareSolutionView();
    this.showSolution = true;
    this.showAlert = false;
    setTimeout(() => {
      this.setImageZoom();
      this.setImageHeightWidthClass();
    });
    clearTimeout(this.intervalRef);
  }

  closeSolution() {
    this.setImageZoom();
    this.viewerService.raiseHeartBeatEvent(eventName.solutionClosed, TelemetryType.interact, this.myCarousel.getCurrentSlideIndex());
    this.showSolution = false;
    this.myCarousel.selectSlide(this.currentSlideIndex);
    this.focusOnNextButton();
  }

  viewHint() {
    this.viewerService.raiseHeartBeatEvent(eventName.viewHint, TelemetryType.interact, this.myCarousel.getCurrentSlideIndex());
  }

  onAnswerKeyDown(event: KeyboardEvent) {
    /* istanbul ignore else */
    if (event.key === 'Enter') {
      event.stopPropagation();
      this.getSolutions();
    }
  }

  showAnswerClicked(event, question?) {
    /* istanbul ignore else */
    if (event?.showAnswer) {
      this.focusOnNextButton();
      this.active = true;
      this.progressBarClass[this.myCarousel.getCurrentSlideIndex() - 1].class = 'correct';
      this.updateScoreForShuffledQuestion();
      /* istanbul ignore else */
      if (question) {
        const index = this.questions.findIndex(que => que.identifier === question.identifier);
        /* istanbul ignore else */
        if (index > -1) {
          this.questions[index].isAnswerShown = true;
          this.viewerService.updateSectionQuestions(this.sectionConfig.metadata.identifier, this.questions);
        }
      }
      this.viewerService.raiseHeartBeatEvent(eventName.showAnswer, TelemetryType.interact, pageId.shortAnswer);
      this.viewerService.raiseHeartBeatEvent(eventName.pageScrolled, TelemetryType.impression, this.myCarousel.getCurrentSlideIndex() - 1);
    }
  }

  /** Cap an earned score at the question's maxScore ceiling (when one is declared). */
  capScore(earned: number, maxScore: number | undefined): number {
    return (maxScore !== undefined && maxScore !== null) ? Math.min(earned, maxScore) : earned;
  }

  /**
   * Auto-scoring for map (MTF), ftb (FTB) and ordered (SEQ / REO) questions.
   *
   * `responseProcessing.template` decides the mode:
   *  - `MAP_RESPONSE`  → partial credit. Each correctly-answered item contributes its
   *    own `score` from the response declaration's `mapping`:
   *      FTB → per-blank `mapping[{ value, score, caseSensitive }]`;
   *      MTF → `mapping[{ key, value, score }]` (key = left id, value = right id);
   *      SEQ/REO → correct position from `correctResponse.value`, score from `mapping[{ value, score }]`.
   *  - anything else (`MATCH_CORRECT` / legacy with no mapping) → existing behaviour:
   *    all-or-nothing for ordered, proportional `maxScore × hits/total` for map/ftb.
   *
   * Returns the earned score and whether every item was answered correctly.
   */
  evaluateAutoScored(question: any, key: string, option: any): { earned: number; isFull: boolean } {
    const rd = question?.responseDeclaration?.[key];
    const isMapResponse =
      String(question?.responseProcessing?.template || '').toUpperCase() === 'MAP_RESPONSE';
    const maxScore: number | undefined = question?.outcomeDeclaration?.maxScore?.defaultValue;

    // ── MTF (map) ─────────────────────────────────────────────
    if (option.cardinality === Cardinality.map) {
      const userResp: Record<string, string> = option.option?.userResponse ?? {};
      const mapping: any[] = Array.isArray(rd?.mapping) ? rd.mapping : [];

      if (isMapResponse && mapping.length) {
        // mapping: [{ key: leftId, value: rightId, score }]
        let earned = 0; let matched = 0;
        for (const m of mapping) {
          if (userResp[m.key] === m.value) { earned += Number(m.score) || 0; matched++; }
        }
        return { earned: this.capScore(earned, maxScore), isFull: matched === mapping.length };
      }

      const correctMap: Record<string, string> = rd?.correctResponse?.value ?? {};
      const total = Object.keys(correctMap).length;
      const matched = Object.keys(correctMap).filter(k => userResp[k] === correctMap[k]).length;
      const max = maxScore ?? total;
      return { earned: total ? Math.round((max * matched) / total) : 0, isFull: total > 0 && matched === total };
    }

    // ── FTB (ftb) ─────────────────────────────────────────────
    if (option.cardinality === Cardinality.ftb) {
      const responseKeys = Object.keys(question?.responseDeclaration ?? {})
        .filter(k => k.includes('response')).sort();
      const userResponses: Record<string, string> = option.option?.responses ?? {};

      // Score earned for a single blank (0 when no match). Honours per-blank `mapping`
      // (each entry has its own `score`); falls back to `correctResponse.value` (score 1).
      const blankScore = (rk: string): number => {
        const r = question.responseDeclaration[rk];
        const user = String(userResponses[rk] ?? '').trim();
        const mappings: any[] = Array.isArray(r?.mapping) ? r.mapping : [];
        if (mappings.length) {
          const hit = mappings.find(m => {
            const mv = String(m.value ?? '').trim();
            return m.caseSensitive ? user === mv : user.toLowerCase() === mv.toLowerCase();
          });
          return hit ? (Number(hit.score) || 0) : 0;
        }
        const correct = String(r?.correctResponse?.value ?? '').trim();
        return user && user.toLowerCase() === correct.toLowerCase() ? 1 : 0;
      };

      const total = responseKeys.length;
      if (isMapResponse) {
        // "Allow answers in any order" — strict set-intersection. The editor puts every
        // correct answer in every blank's mapping; we award each DISTINCT correct answer
        // once, no matter which blank(s) the student used it in (so repeating the same
        // answer in two blanks does not earn double credit).
        const evalUnordered =
          question?.evalUnordered === true ||
          String(question?.evalUnordered).toLowerCase() === 'true';

        if (evalUnordered) {
          // Pool of unique correct answers across all blanks.
          const pool: { value: string; score: number; caseSensitive: boolean }[] = [];
          const seen = new Set<string>();
          for (const rk of responseKeys) {
            const r = question.responseDeclaration[rk];
            for (const m of (Array.isArray(r?.mapping) ? r.mapping : [])) {
              const cs = !!m.caseSensitive;
              const raw = String(m.value ?? '').trim();
              if (!raw) continue;
              const dedupKey = (cs ? raw : raw.toLowerCase()) + '\u0000' + cs;
              if (!seen.has(dedupKey)) { seen.add(dedupKey); pool.push({ value: raw, score: Number(m.score) || 0, caseSensitive: cs }); }
            }
          }
          const studentAnswers = responseKeys
            .map(rk => String(userResponses[rk] ?? '').trim())
            .filter(Boolean);

          let earned = 0; let matched = 0;
          for (const p of pool) {
            const hit = studentAnswers.some(a => p.caseSensitive ? a === p.value : a.toLowerCase() === p.value.toLowerCase());
            if (hit) { earned += p.score; matched++; }
          }
          return { earned: this.capScore(earned, maxScore), isFull: total > 0 && matched === total };
        }

        // Ordered: each blank checked against its own mapping.
        let earned = 0; let matched = 0;
        for (const rk of responseKeys) { const s = blankScore(rk); if (s > 0) { earned += s; matched++; } }
        return { earned: this.capScore(earned, maxScore), isFull: total > 0 && matched === total };
      }

      const matched = responseKeys.filter(rk => blankScore(rk) > 0).length;
      const max = maxScore ?? total;
      return { earned: total ? Math.round((max * matched) / total) : 0, isFull: total > 0 && matched === total };
    }

    // ── SEQ / REO (ordered) ───────────────────────────────────
    if (option.cardinality === Cardinality.ordered) {
      const userOrder: string[] = option.option?.userOrder ?? [];
      const mapping: any[] = Array.isArray(rd?.mapping) ? rd.mapping : [];
      const correctOrder: string[] = rd?.correctResponse?.value ?? [];

      if (isMapResponse && mapping.length && correctOrder.length) {
        // Correct position is authoritative from correctResponse.value; the per-item
        // score is looked up from `mapping` by value (mapping: [{ value, score }]).
        const scoreByValue = new Map<string, number>(
          mapping.map((m: any) => [String(m.value), Number(m.score) || 0]),
        );
        let earned = 0; let matched = 0;
        correctOrder.forEach((correctVal, i) => {
          if (userOrder[i] === correctVal) { earned += scoreByValue.get(String(correctVal)) ?? 0; matched++; }
        });
        return { earned: this.capScore(earned, maxScore), isFull: matched === correctOrder.length };
      }

      const isExact = correctOrder.length === userOrder.length &&
        correctOrder.every((v, i) => v === userOrder[i]);
      const max = maxScore ?? 1;
      return { earned: isExact ? max : 0, isFull: isExact };
    }

    return { earned: 0, isFull: false };
  }

  /**
   * Shared alert + scoreboard + assess handling for auto-scored questions.
   * Full credit → 'correct'; some credit → 'partial' (alert stays 'wrong' — there is
   * no partial alert UI); no credit → 'wrong'.
   */
  applyAutoScore(currentIndex: number, edataItem: any, option: any, type: string | undefined, earned: number, isFull: boolean): void {
    this.showAlert = true;
    if (isFull) {
      this.alertType = 'correct';
      this.updateScoreBoard(currentIndex, 'correct', undefined, earned);
      if (!this.isAssessEventRaised) {
        this.isAssessEventRaised = true;
        this.viewerService.raiseAssesEvent(edataItem, currentIndex + 1, 'Yes', earned, [option.option], this.slideDuration);
      }
    } else if (earned > 0) {
      this.alertType = 'wrong';
      this.updateScoreBoard(currentIndex, 'partial', undefined, earned);
      if (!this.isAssessEventRaised) {
        this.isAssessEventRaised = true;
        this.viewerService.raiseAssesEvent(edataItem, currentIndex + 1, 'No', earned, [option.option], this.slideDuration);
      }
    } else {
      this.alertType = 'wrong';
      this.updateScoreBoard(currentIndex, 'wrong', undefined, 0);
      if (!this.isAssessEventRaised) {
        this.isAssessEventRaised = true;
        this.viewerService.raiseAssesEvent(edataItem, currentIndex + 1, 'No', 0, [option.option], this.slideDuration);
      }
    }
    if (this.showFeedBack) { this.correctFeedBackTimeOut(type); }
    this.optionSelectedObj = undefined;
  }

  getScore(currentIndex, key, isCorrectAnswer, selectedOption?) {
    /* istanbul ignore else */
    if (isCorrectAnswer) {
      if (this.isShuffleQuestions) {
        return DEFAULT_SCORE;
      }
      return this.questions[currentIndex].outcomeDeclaration?.maxScore?.defaultValue ?
        this.questions[currentIndex].outcomeDeclaration.maxScore.defaultValue : DEFAULT_SCORE;
    } else {
      const selectedOptionValue = selectedOption.option.value;
      const mapping = this.questions[currentIndex].responseDeclaration.mapping;
      let score = 0;

      /* istanbul ignore else */
      if (mapping) {
        mapping.forEach((val) => {
          if (selectedOptionValue === val.value) {
            score = val.score || 0;
            if (val.score) {
              this.progressBarClass[currentIndex].class = 'partial';
            }
          }
        });
      }
      return score;
    }
  }

  calculateScore() {
    return this.progressBarClass.reduce((accumulator, element) => accumulator + element.score, 0);
  }

  updateScoreBoard(index, classToBeUpdated, optionValue?, score?) {
    this.progressBarClass.forEach((ele) => {
      if (ele.index - 1 === index) {
        ele.class = classToBeUpdated;
        ele.score = score ? score : 0;

        /* istanbul ignore else */
        if (!this.showFeedBack) {
          ele.value = optionValue;
        }
      }
    });
  }

  /* End of score methods  */

  /* Start of Image zoom related */
  setImageHeightWidthClass() {
    document.querySelectorAll('[data-asset-variable]').forEach(image => {
      image.removeAttribute('class');
      if (image.clientHeight > image.clientWidth) {
        image.setAttribute('class', 'portrait');
      } else if (image.clientHeight < image.clientWidth) {
        image.setAttribute('class', 'landscape');
      }
      // } else {
      //   image.setAttribute('class', 'neutral');
      // }
    });
  }

  setImageZoom() {
    const index = this.myCarousel.getCurrentSlideIndex() - 1;
    const currentQuestionId = this.questions[index]?.identifier;
    document.querySelectorAll('[data-asset-variable]').forEach(image => {
      if(image.nodeName.toLowerCase() !== 'img') { return ;}
      const imageId = image.getAttribute('data-asset-variable');
      image.setAttribute('class', 'option-image');
      image.setAttribute('id', imageId);
      _.forEach(this.currentQuestionsMedia, (val) => {
        if (imageId === val.id) {
          if (this.parentConfig.isAvailableLocally && this.parentConfig.baseUrl) {
            let baseUrl = this.parentConfig.baseUrl;
            baseUrl = `${baseUrl.substring(0, baseUrl.lastIndexOf('/'))}/${this.sectionConfig.metadata.identifier}`;
            if (currentQuestionId) {
              image['src'] = `${baseUrl}/${currentQuestionId}/${val.src}`;
            }
          } else if (/^https?:\/\//i.test(val.src ?? '')) {
            image['src'] = val.src;
          } else if (val.baseUrl) {
            image['src'] = val.baseUrl + val.src;
          }
        }
      });
      const divElement = document.createElement('div');
      divElement.setAttribute('class', 'magnify-icon');
      divElement.onclick = (event) => {
        this.viewerService.raiseHeartBeatEvent(eventName.zoomClicked, TelemetryType.interact, this.myCarousel.getCurrentSlideIndex());
        this.zoomImgSrc = image['src'];
        this.showZoomModal = true;
        const zoomImage = document.getElementById('imageModal');
        if (zoomImage.clientHeight > image.clientWidth) {
          zoomImage.setAttribute('class', 'portrait');
        } else if (image.clientHeight < image.clientWidth) {
          zoomImage.setAttribute('class', 'landscape');
        } else {
          zoomImage.setAttribute('class', 'neutral');
        }
        event.stopPropagation();
      };
      image.parentNode.insertBefore(divElement, image.nextSibling);
    });
  }

  zoomIn() {
    this.viewerService.raiseHeartBeatEvent(eventName.zoomInClicked, TelemetryType.interact, this.myCarousel.getCurrentSlideIndex());
    this.imageZoomCount = this.imageZoomCount + 10;
    this.setImageModalHeightWidth();
  }

  zoomOut() {
    this.viewerService.raiseHeartBeatEvent(eventName.zoomOutClicked, TelemetryType.interact, this.myCarousel.getCurrentSlideIndex());
    /* istanbul ignore else */
    if (this.imageZoomCount > 100) {
      this.imageZoomCount = this.imageZoomCount - 10;
      this.setImageModalHeightWidth();
    }
  }

  setImageModalHeightWidth() {
    this.imageModal.nativeElement.style.width = `${this.imageZoomCount}%`;
    this.imageModal.nativeElement.style.height = `${this.imageZoomCount}%`;
  }

  closeZoom() {
    this.viewerService.raiseHeartBeatEvent(eventName.zoomCloseClicked, TelemetryType.interact, this.myCarousel.getCurrentSlideIndex());
    document.getElementById('imageModal').removeAttribute('style');
    this.showZoomModal = false;
  }
  /* End of Image zoom related */

  clearTimeInterval() {
    if (this.intervalRef) {
      clearTimeout(this.intervalRef);
    }
  }

  @HostListener('window:beforeunload')
  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
    this.errorService.getInternetConnectivityError.unsubscribe();
  }
}
