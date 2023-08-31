import { Component, OnInit } from '@angular/core';
import { samplePlayerConfig } from './quml-library-data';
import { DataService } from './services/data.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  contentId = 'do_113843088807510016137';
  // do_113843088807510016137, do_11385047372081561612, do_1138183630883307521277 - client,
  // do_113850934370246656120, do_113835948892069888159, do_113846646050775040179, do_113853213080854528174 - server
  playerConfig: any;
  telemetryEvents: any = [];

  constructor(private dataService: DataService) { }

  ngOnInit() {
    this.dataService.getQuestionSet(this.contentId).subscribe(res => {
      this.initializePlayer(res);
    });
  }

  initializePlayer(metadata) {
    let qumlConfigMetadata: any = localStorage.getItem(`config_${this.contentId}`) || '{}';
    let config;
    if (qumlConfigMetadata) {
      qumlConfigMetadata = JSON.parse(qumlConfigMetadata);
      config = { ...samplePlayerConfig.config, ...qumlConfigMetadata };
    }
    this.playerConfig = {
      context: samplePlayerConfig.context,
      config: config ? config : samplePlayerConfig.config,
      metadata,
      data: {}
    };
  }

  getPlayerEvents(event) {
    console.log('get player events', JSON.stringify(event));

    // Store the metaData locally
    if (event.eid === 'END') {
      let qumlMetaDataConfig = event.metaData;
      localStorage.setItem(`config_${this.contentId}`, JSON.stringify(qumlMetaDataConfig));
      this.playerConfig.config = { ...samplePlayerConfig.config, ...qumlMetaDataConfig };;
    }
  }

  getTelemetryEvents(event) {
    this.telemetryEvents.push(JSON.parse(JSON.stringify(event)));
    console.log('event is for telemetry', this.telemetryEvents);
  }
}
