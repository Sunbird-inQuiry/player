import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { UtilService } from '../util-service';
@Component({
  selector: 'quml-mcq-solutions',
  templateUrl: './mcq-solutions.component.html',
  styleUrls: ['./mcq-solutions.component.scss']
})
export class McqSolutionsComponent implements AfterViewInit  {
  @Input() question: any;
  @Input() options: any;
  @Input() solutions: any;
  @Input() baseUrl: string;
  @Input() media: any;
  @Input() identifier: string;
  @Output() close = new EventEmitter();
  @ViewChild('solutionVideoPlayer' , {static: true}) solutionVideoPlayer: ElementRef;
  
  showVideoSolution: boolean;
  previousActiveElement: HTMLElement;
  
  constructor(private utilService: UtilService){}

  closeSolution() {
    if (this.solutionVideoPlayer) {
      this.solutionVideoPlayer.nativeElement.pause();
    }
    this.close.emit({
      close: true
    });
  }

  ngAfterViewInit() {
    this.utilService.updateSourceOfVideoElement(this.baseUrl, this.media, this.identifier);
  }

}
