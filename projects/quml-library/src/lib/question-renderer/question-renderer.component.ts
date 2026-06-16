import {
  Component, ComponentRef, Inject, Input, OnChanges, OnDestroy, OnInit,
  Optional, Output, EventEmitter, SimpleChanges, ViewChild, ViewContainerRef,
} from '@angular/core';
import { Subscription } from 'rxjs';
import {
  IQuestionPlayer, QUESTION_TYPE_REGISTRY, QuestionTypeDefinition,
} from '../registry/question-type.interface';

@Component({
  standalone: false,
  selector: 'quml-question-renderer',
  template: '<ng-container #outlet></ng-container>',
})
export class QuestionRendererComponent implements OnInit, OnChanges, OnDestroy {
  @Input() question: any;
  @Input() replayed: boolean;
  @Input() tryAgain: boolean;
  @Input() baseUrl: string;
  @Input() shuffleOptions: boolean;
  @Input() language: string = 'en';

  @Output() optionSelected    = new EventEmitter<any>();
  @Output() showAnswerClicked = new EventEmitter<any>();
  @Output() componentLoaded   = new EventEmitter<any>();
  @Output() goToNext          = new EventEmitter<void>();

  @ViewChild('outlet', { read: ViewContainerRef, static: true })
  private outlet: ViewContainerRef;

  private componentRef: ComponentRef<IQuestionPlayer> | null = null;
  private subs: Subscription[] = [];

  constructor(
    @Optional() @Inject(QUESTION_TYPE_REGISTRY)
    private registry: QuestionTypeDefinition[],
  ) {}

  ngOnInit(): void {
    this.mountComponent();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.componentRef) return;
    const inst = this.componentRef.instance as any;

    const childChanges: SimpleChanges = {};

    if (changes['replayed']) {
      inst.replayed = this.replayed;
      childChanges['replayed'] = changes['replayed'];
    }
    if (changes['tryAgain']) {
      inst.tryAgain = this.tryAgain;
      childChanges['tryAgain'] = changes['tryAgain'];
    }
    if (changes['language']) {
      inst.language = this.language;
      childChanges['language'] = changes['language'];
    }
    if (changes['shuffleOptions'] && inst.shuffleOptions !== undefined) {
      inst.shuffleOptions = this.shuffleOptions;
      childChanges['shuffleOptions'] = changes['shuffleOptions'];
    }

    // Propagate changes to the dynamically-created component.
    // createComponent() doesn't wire up @Input bindings so Angular never
    // calls ngOnChanges on the child automatically — we do it ourselves.
    if (Object.keys(childChanges).length > 0 && typeof inst.ngOnChanges === 'function') {
      inst.ngOnChanges(childChanges);
    }

    this.componentRef.changeDetectorRef.detectChanges();
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  private mountComponent(): void {
    this.outlet.clear();
    this.subs.forEach(s => s.unsubscribe());
    this.subs = [];

    const registry: QuestionTypeDefinition[] = Array.isArray(this.registry)
      ? this.registry : [];

    const def = registry.find(
      d => d.primaryCategory === this.question?.primaryCategory?.toLowerCase(),
    );
    if (!def) {
      console.error(`[QuestionRenderer] No component registered for primaryCategory: "${this.question?.primaryCategory}"`);
      return;
    }

    this.componentRef = this.outlet.createComponent(def.component);
    const inst = this.componentRef.instance;

    inst.question       = this.question;
    inst.replayed       = this.replayed;
    inst.tryAgain       = this.tryAgain;
    inst.baseUrl        = this.baseUrl;
    inst.language       = this.language;
    inst.shuffleOptions = this.shuffleOptions;

    this.subs.push(
      inst.optionSelected.subscribe((e: any) => this.optionSelected.emit(e)),
    );
    this.subs.push(
      inst.componentLoaded.subscribe((e: any) => this.componentLoaded.emit(e)),
    );

    if (inst.showAnswerClicked) {
      this.subs.push(
        inst.showAnswerClicked.subscribe((e: any) => this.showAnswerClicked.emit(e)),
      );
    }

    if (inst.goToNext) {
      this.subs.push(
        inst.goToNext.subscribe(() => this.goToNext.emit()),
      );
    }
  }
}
