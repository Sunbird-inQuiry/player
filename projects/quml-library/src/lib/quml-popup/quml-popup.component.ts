import { Component, Input, Output, EventEmitter, AfterViewInit } from '@angular/core';

@Component({
  selector: 'quml-quml-popup',
  templateUrl: './quml-popup.component.html',
  styleUrls: ['./quml-popup.component.scss']
})
export class QumlPopupComponent implements AfterViewInit {
  @Input() image;
  @Input() htmlTag: any;
  @Output() popUpClose = new EventEmitter();

  ngAfterViewInit() {
    const htmlTagElement = document.getElementById('htmlTag');
    if (htmlTagElement) {
      htmlTagElement.getElementsByTagName('img')[0].style.width = '70%';
    }
  }

  closePopup() {
    this.popUpClose.emit();
  }

}
