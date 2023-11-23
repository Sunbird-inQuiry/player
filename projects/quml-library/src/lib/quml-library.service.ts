import { EventEmitter, Injectable } from '@angular/core';
import { CsTelemetryModule } from '@project-sunbird/client-services/telemetry';
import { Context, IParentConfig, QumlPlayerConfig } from './quml-library-interface';
import { UtilService } from './util-service';
import * as _ from 'lodash-es';

@Injectable({
  providedIn: 'root'
})
export class QumlLibraryService {
  duration: number;
  channel: string;
  config: QumlPlayerConfig;
  isSectionsAvailable = false;
  telemetryEvent = new EventEmitter<any>();
  private context: Context;
  private telemetryObject: any;
  private contentSessionId: string;
  private playSessionId: string;
  private pdata: any;
  private sid: string;
  private uid: string;
  private rollup: any;

  constructor(public utilService: UtilService) { }

  async initializeTelemetry(config: QumlPlayerConfig, parentConfig: IParentConfig) {
    if (!_.has(config, 'context') || _.isEmpty(config, 'context')) {
      return;
    }
    this.duration = new Date().getTime();
    this.context = config?.context;
    this.contentSessionId = this.utilService.uniqueId();
    this.playSessionId = this.utilService.uniqueId();
    this.channel = this.context.channel || '';
    this.pdata = this.context.pdata;
    this.sid = this.context.sid;
    this.uid = this.context.uid;
    this.rollup = this.context.contextRollup;
    this.config = config;
    this.isSectionsAvailable = parentConfig?.isSectionsAvailable;

    /* istanbul ignore else */
    if (!CsTelemetryModule.instance.isInitialised && this.context) {
      const telemetryConfig = {
        pdata: this.context.pdata,
        env: 'contentplayer',
        channel: this.context.channel,
        did: this.context.did,
        authtoken: this.context.authToken || '',
        uid: this.context.uid || '',
        sid: this.context.sid,
        batchsize: 20,
        mode: this.context.mode,
        host: this.context.host || '',
        endpoint: this.context.endpoint || '/data/v3/telemetry',
        tags: this.context.tags,
        cdata: (this.context.cdata || []).concat([
          { id: this.contentSessionId, type: 'ContentSession' },
          { id: this.playSessionId, type: 'PlaySession' },
          { id: '2.0', type: 'PlayerVersion' }
        ])
      };
      await CsTelemetryModule.instance.init({});
      CsTelemetryModule.instance.telemetryService.initTelemetry(
        {
          config: telemetryConfig,
          userOrgDetails: {}
        }
      );
    }

    this.telemetryObject = {
      id: parentConfig.identifier,
      type: 'Content',
      ver: parentConfig?.metadata?.pkgVersion ? parentConfig.metadata.pkgVersion.toString() : '',
      rollup: this.context?.objectRollup || {}
    };
  }

  public startAssesEvent(assesEvent) {
    if (!_.isEmpty(this.context)) {
      CsTelemetryModule.instance.telemetryService.raiseAssesTelemetry(
        assesEvent,
        this.getEventOptions()
      );
    }
  }

  public start(duration) {
    if (!_.isEmpty(this.context)) {
      CsTelemetryModule.instance.telemetryService.raiseStartTelemetry(
        {
          options: this.getEventOptions(),
          edata: { type: 'content', mode: 'play', pageid: '', duration: Number((duration / 1e3).toFixed(2)) }
        }
      );
    }
  }

  public response(identifier, version, type, option) {
    if (!_.isEmpty(this.context)) {
      const responseEvent = {
        target: {
          id: identifier,
          ver: version,
          type: type
        },
        type: 'CHOOSE',
        values: [{
          option
        }]
      };
      CsTelemetryModule.instance.telemetryService.raiseResponseTelemetry(
        responseEvent,
        this.getEventOptions()
      );
    }
  }

  public summary(eData) {
    if (!_.isEmpty(this.context)) {
      CsTelemetryModule.instance.telemetryService.raiseSummaryTelemetry(
        eData,
        this.getEventOptions()
      );
    }
  }

  public end(duration, currentQuestionIndex, totalNoofQuestions, visitedQuestions, endpageseen, score) {
    if (!_.isEmpty(this.context)) {
      const durationSec = Number((duration / 1e3).toFixed(2));
      CsTelemetryModule.instance.telemetryService.raiseEndTelemetry({
        edata: {
          type: 'content',
          mode: 'play',
          pageid: 'sunbird-player-Endpage',
          summary: [
            {
              progress: Number(((currentQuestionIndex / totalNoofQuestions) * 100).toFixed(0))
            },
            {
              totalNoofQuestions: totalNoofQuestions
            },
            {
              visitedQuestions: visitedQuestions,
            },
            {
              endpageseen
            },
            {
              score
            },
          ],
          duration: durationSec
        },
        options: this.getEventOptions()
      });
    }
  }

  public interact(id, currentPage, currentQuestionDetails?) {
    if (!_.isEmpty(this.context)) {
      CsTelemetryModule.instance.telemetryService.raiseInteractTelemetry({
        options: this.getEventOptions(),
        edata: { type: 'TOUCH', subtype: '', id, pageid: currentPage + '' }
      });
    }
  }



  public heartBeat(data) {
    if (!_.isEmpty(this.context)) {
      CsTelemetryModule.instance.playerTelemetryService.onHeartBeatEvent(data, {});
    }
  }

  public impression(currentPage) {
    if (!_.isEmpty(this.context)) {
      CsTelemetryModule.instance.telemetryService.raiseImpressionTelemetry({
        options: this.getEventOptions(),
        edata: { type: 'workflow', subtype: '', pageid: currentPage + '', uri: '' }
      });
    }
  }

  public error(error: Error, edata?: { err: string, errtype: string }) {
    if (!_.isEmpty(this.context)) {
      CsTelemetryModule.instance.telemetryService.raiseErrorTelemetry({
        options: this.getEventOptions(),
        edata: {
          err: 'LOAD',
          errtype: 'content',
          stacktrace: (error?.toString()) || ''
        }
      });
    }
  }

  public getEventOptions() {
    const options = {
      object: this.telemetryObject,
      context: {
        channel: this.channel || '',
        pdata: this.pdata,
        env: 'contentplayer',
        sid: this.sid,
        uid: this.uid,
        cdata: (this.context?.cdata || []).concat([{ id: this.contentSessionId, type: 'ContentSession' },
        { id: this.playSessionId, type: 'PlaySession' },
        { id: '2.0', type: 'PlayerVersion' }]),
        rollup: this.rollup || {}
      }
    };

    /* istanbul ignore else */
    if (this.isSectionsAvailable) {
      options.context.cdata.push({ id: this.config.metadata.identifier, type: 'SectionId' });
    }

    return options;
  }
}
