import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QumlLibraryComponent } from './quml-library.component';
import { McqComponent } from './mcq/mcq.component';
import { SaComponent } from './sa/sa.component';
import { CarouselModule } from 'ngx-bootstrap/carousel';
import { HeaderComponent } from './header/header.component';
import { McqQuestionComponent } from './mcq-question/mcq-question.component';
import { McqOptionComponent } from './mcq-option/mcq-option.component';
import { QumlPopupComponent } from './quml-popup/quml-popup.component';
import { McqImageOptionComponent } from './mcq-image-option/mcq-image-option.component';
import { ZoomInComponent } from './icon/zoom-in/zoom-in.component';
import { StarComponent } from './icon/star/star.component';
import { PreviousComponent } from './icon/previous/previous.component';
import { NextComponent } from './icon/next/next.component';
import { BookmarkComponent } from './icon/bookmark/bookmark.component';
import { HintComponent } from './icon/hint/hint.component';
import { AnsComponent } from './icon/ans/ans.component';
import { ShareComponent } from './icon/share/share.component';
import { CorrectComponent } from './icon/correct/correct.component';
import { ScoreboardComponent } from './scoreboard/scoreboard.component';
import { StartpageComponent } from './startpage/startpage.component';
import { TimerComponent } from './icon/timer/timer.component';
import { ContentComponent } from './icon/content/content.component';
import { StartpagestariconComponent } from './icon/startpagestaricon/startpagestaricon.component';
import { PreviousActiveComponent } from './icon/previous-active/previous-active.component';
import { NextActiveComponent } from './icon/next-active/next-active.component';
import { AlertComponent } from './alert/alert.component';
import { CloseComponent } from './icon/close/close.component';
import { McqSolutionsComponent } from './mcq-solutions/mcq-solutions.component';
import { DurationtimerComponent } from './icon/durationtimer/durationtimer.component';
import { AudioComponent } from './icon/audio/audio.component';
import { WrongComponent } from './icon/wrong/wrong.component';
import { MenuComponent } from './icon/menu/menu.component';
import { SunbirdPlayerSdkModule } from '@project-sunbird/sunbird-player-sdk-v9';
import { QumlLibraryService } from './quml-library.service';
import { SafeHtmlPipe } from './pipes/safe-html/safe-html.pipe';
import { MainPlayerComponent } from './main-player/main-player.component';
import { SectionPlayerComponent } from './section-player/section-player.component';
import { ProgressIndicatorsComponent } from './progress-indicators/progress-indicators.component'

@NgModule({
  declarations: [
    QumlLibraryComponent,
    McqComponent,
    HeaderComponent,
    SaComponent,
    McqQuestionComponent,
    McqOptionComponent,
    QumlPopupComponent,
    McqImageOptionComponent,
    ZoomInComponent,
    StarComponent,
    PreviousComponent,
    NextComponent,
    PreviousActiveComponent,
    BookmarkComponent,
    HintComponent,
    AnsComponent,
    ShareComponent,
    CorrectComponent,
    ScoreboardComponent,
    StartpageComponent,
    TimerComponent,
    ContentComponent,
    StartpagestariconComponent,
    NextActiveComponent,
    AlertComponent,
    CloseComponent,
    McqSolutionsComponent,
    DurationtimerComponent,
    AudioComponent,
    WrongComponent,
    MenuComponent,
    SafeHtmlPipe,
    MainPlayerComponent,
    SectionPlayerComponent,
    ProgressIndicatorsComponent,
  ],
  imports: [
    CommonModule,
    CarouselModule,
    SunbirdPlayerSdkModule
  ],
  providers: [
    QumlLibraryService
  ],
  exports: [MainPlayerComponent]
})
export class QumlLibraryModule { }
