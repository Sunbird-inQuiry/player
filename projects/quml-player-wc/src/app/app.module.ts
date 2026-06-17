import { DoBootstrap, Injector, NgModule } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { CarouselModule } from 'ngx-bootstrap/carousel';
import {
  QumlLibraryModule,
  QuestionCursor,
  MainPlayerComponent,
} from '@project-sunbird/sunbird-quml-player';
import { QuestionCursorImplementationService } from './question-cursor-implementation.service';

// The web component consumes the built library module (QumlLibraryModule) instead of
// re-declaring every component from source. This guarantees the player components
// (section-player, question-renderer, mcq, sa, ftb, mtf, ordered, …) are all compiled
// in a single, coherent module scope — exactly how the working demo app consumes the
// library. Re-declaring them in this module compiled section-player in a scope where
// <quml-question-renderer> failed to resolve, leaving every question blank.
@NgModule({
  imports: [
    BrowserModule,
    HttpClientModule,
    CarouselModule.forRoot(),
    QumlLibraryModule,
  ],
  providers: [
    { provide: QuestionCursor, useClass: QuestionCursorImplementationService },
  ],
})
export class AppModule implements DoBootstrap {
  constructor(private injector: Injector) { }

  ngDoBootstrap() {
    const customElement = createCustomElement(MainPlayerComponent, { injector: this.injector });
    customElements.define('sunbird-quml-player', customElement);
  }
}
