import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { errorCode, errorMessage, ErrorService } from '@project-sunbird/sunbird-player-sdk-v9';
import * as _ from 'lodash-es';
import { CarouselComponent } from 'ngx-bootstrap/carousel';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { QumlPlayerConfig, IParentConfig, IAttempts } from '../quml-library-interface';
import { ViewerService } from '../services/viewer-service/viewer-service';
import { eventName, pageId, TelemetryType, Cardinality, QuestionType } from '../telemetry-constants';
import { DEFAULT_SCORE } from '../player-constants';
import { UtilService } from '../util-service';

@Component({
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
  questionSetEvaluable: any;

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
        const unCommonQuestions = _.xorBy(this.questions, res.questions, 'identifier');
        this.questions = _.uniqBy(this.questions.concat(unCommonQuestions), 'identifier');
        this.sortQuestions();
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
    
    //server-level-validation
    this.questionSetEvaluable = this.viewerService.questionSetEvaluable;

    if (this.sectionConfig.metadata?.showFeedback) {
      this.showFeedBack = this.sectionConfig.metadata?.showFeedback; // prioritize the section level config
    } else {
      this.showFeedBack = this.parentConfig.showFeedback; // Fallback to parent config
    }
    this.showFeedBack = this.showFeedBack && !this.questionSetEvaluable; // showFeedBack should evaluate from questionSetEvaluable field
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
    if (this.myCarousel.isLast(this.myCarousel.getCurrentSlideIndex()) || this.noOfQuestions === this.myCarousel.getCurrentSlideIndex() && !this.questionSetEvaluable) {
      this.calculateScore();
    }

    /* istanbul ignore else */
    if (this.myCarousel.getCurrentSlideIndex() > 0 &&
      this.questions[this.myCarousel.getCurrentSlideIndex() - 1].qType === QuestionType.mcq && this.currentOptionSelected) {
      const option = this.currentOptionSelected?.option ? this.currentOptionSelected['option'] : undefined;
      const identifier = this.questions[this.myCarousel.getCurrentSlideIndex() - 1].identifier;
      const qType = this.questions[this.myCarousel.getCurrentSlideIndex() - 1].qType;
      this.viewerService.raiseResponseEvent(identifier, qType, option);
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
    this.myCarousel.move(this.carouselConfig.NEXT);
    this.setImageZoom();
    this.resetQuestionState();
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

    if (this.isShuffleQuestions && !this.questionSetEvaluable) {
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
    this.focusOnNextButton();
    this.active = true;
    this.currentOptionSelected = optionSelected;
    const currentIndex = this.myCarousel.getCurrentSlideIndex() - 1;
    this.viewerService.raiseHeartBeatEvent(eventName.optionClicked, TelemetryType.interact, this.myCarousel.getCurrentSlideIndex());

    // This optionSelected comes empty whenever the try again is clicked on feedback popup
    if (_.isEmpty(optionSelected?.option)) {
      this.optionSelectedObj = undefined;
      this.currentSolutions = undefined;
      this.updateScoreBoard(currentIndex, 'skipped');
    } else {
      this.optionSelectedObj = optionSelected;
      this.isAssessEventRaised = false;
      if(!this.questionSetEvaluable) {
        this.currentSolutions = !_.isEmpty(optionSelected.solutions) ? optionSelected.solutions : undefined;
      } else {
        this.currentSolutions = undefined;
      }
    }
    this.currentQuestionIndetifier = this.questions[currentIndex].identifier;
    this.media = _.get(this.questions[currentIndex], 'media', []);
   
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
      const checkContentCompatible = this.errorService.checkContentCompatibility(compatibilityLevel);

      /* istanbul ignore else */
      if (!checkContentCompatible.isCompitable) {
        this.viewerService.raiseExceptionLog(errorCode.contentCompatibility, errorMessage.contentCompatibility,
          checkContentCompatible.error, this.sectionConfig?.config?.traceId);
      }
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
    const isQuestionSkipAllowed = !this.optionSelectedObj &&
      this.allowSkip && this.utilService.getQuestionType(this.questions, currentIndex) === QuestionType.mcq;
    const isSubjectiveQuestion = this.utilService.getQuestionType(this.questions, currentIndex) === QuestionType.sa;
    const onStartPage = this.startPageInstruction && this.myCarousel.getCurrentSlideIndex() === 0;
    const isActive = !this.optionSelectedObj && this.active;
    const selectedQuestion = this.questions[currentIndex];
    const key = selectedQuestion.responseDeclaration ? this.utilService.getKeyValue(Object.keys(selectedQuestion.responseDeclaration)) : '';
    this.slideDuration = Math.round((new Date().getTime() - this.initialSlideDuration) / 1000);
    const getParams = () => {
      if (selectedQuestion.qType.toUpperCase() === QuestionType.mcq && selectedQuestion?.editorState?.options) {
        return selectedQuestion.editorState.options;
      } else if (selectedQuestion.qType.toUpperCase() === QuestionType.mcq && !_.isEmpty(selectedQuestion?.editorState)) {
        return [selectedQuestion?.editorState];
      } else {
        return [];
      }
    };
    const edataItem: any = {
      'id': selectedQuestion.identifier,
      'title': selectedQuestion.name,
      'desc': selectedQuestion.description,
      'type': selectedQuestion.qType.toLowerCase(),
      'maxscore': key.length === 0 ? 0 : selectedQuestion.outcomeDeclaration.maxScore.defaultValue || 0,
      'params': getParams()
    };

    /* istanbul ignore else */
    if (edataItem && this.parentConfig.isSectionsAvailable) {
      edataItem.sectionId = this.sectionConfig.metadata.identifier;
    }

    /* istanbul ignore else */
    if (!this.optionSelectedObj && !this.isAssessEventRaised && selectedQuestion.qType.toUpperCase() !== QuestionType.sa) {
      this.isAssessEventRaised = true;
      this.viewerService.raiseAssesEvent(edataItem, currentIndex + 1, 'No', 0, [], this.slideDuration);
    }

    if (this.optionSelectedObj) {
      this.currentQuestion = selectedQuestion.body;
      this.currentOptions = selectedQuestion.interactions[key].options;
      if (!this.questionSetEvaluable) {
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
      } else {
        this.updateScoreBoard(currentIndex, 'correct', undefined, 0);
        if (!this.isAssessEventRaised) {
          this.isAssessEventRaised = true;
          this.viewerService.raiseAssesEvent(edataItem, currentIndex + 1, '', 0, [option.option], this.slideDuration);
        }
      }
      this.optionSelectedObj = undefined;
    } else if ((isQuestionSkipAllowed) || isSubjectiveQuestion || onStartPage || isActive) {
      if(!_.isUndefined(type)) {
        this.nextSlide();
      }
    } else if (this.startPageInstruction && !this.optionSelectedObj && !this.active && !this.allowSkip &&
      this.myCarousel.getCurrentSlideIndex() > 0 && this.utilService.getQuestionType(this.questions, currentIndex) === QuestionType.mcq
      && this.utilService.canGo(this.progressBarClass[this.myCarousel.getCurrentSlideIndex()])) {
      this.infoPopupTimeOut();
    } else if (!this.optionSelectedObj && !this.active && !this.allowSkip && this.myCarousel.getCurrentSlideIndex() >= 0
      && this.utilService.getQuestionType(this.questions, currentIndex) === QuestionType.mcq
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
    this.viewerService.getQuestions(0, index);
    this.currentSlideIndex = index;
    this.myCarousel.selectSlide(index);
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
    const currentIndex = this.myCarousel.getCurrentSlideIndex() - 1;
    this.currentQuestion = this.questions[currentIndex].body;
    this.currentOptions = this.questions[currentIndex].interactions.response1.options;
    this.currentQuestionsMedia = _.get(this.questions[currentIndex], 'media');
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

  viewSolution() {
    this.viewerService.raiseHeartBeatEvent(eventName.viewSolutionClicked, TelemetryType.interact, this.myCarousel.getCurrentSlideIndex());
    this.showSolution = true;
    this.showAlert = false;
    this.currentQuestionsMedia = _.get(this.questions[this.myCarousel.getCurrentSlideIndex() - 1], 'media');
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

  getScore(currentIndex, key, isCorrectAnswer, selectedOption?) {
    /* istanbul ignore else */
    if (isCorrectAnswer) {
      if (this.isShuffleQuestions) {
        return DEFAULT_SCORE;
      }
      return this.questions[currentIndex].outcomeDeclaration.maxScore.defaultValue ?
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
