/**
 * Web Component — Custom HTML Element Registration (Phase 8).
 *
 * Enables: <sunbird-quml-player player-config='{...}'></sunbird-quml-player>
 *
 * ARCHITECTURE (thin mount point, not a thick orchestrator):
 * 1. Parse config from the `player-config` HTML attribute.
 * 2. (Optionally) initialize telemetry BEFORE React renders. There is NO
 *    separate `initializePlayer` step — MainPlayer initializes itself from the
 *    `playerConfig` prop (it normalizes sections via the transformation-service
 *    on mount).
 * 3. Mount React (QumlProvider + MainPlayer) inside an open shadow root.
 * 4. Inject the bundled player CSS into the shadow root (external stylesheets do
 *    not pierce shadow DOM).
 * 5. Bridge the telemetry queue → `telemetryEvent`, and `onPlayerEvent` →
 *    `playerEvent`, as composed CustomEvents.
 * 6. Clean up (unmount React, unsubscribe telemetry) on disconnect.
 */

import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { MainPlayer } from '../components/MainPlayer/MainPlayer';
import { QumlProvider } from '../context/QumlContext';
import { initializeTelemetry, subscribeTelemetry } from '../services/telemetry-service';
import type { PlayerConfig } from '../types';
import '../styles/global.scss';

// Embedded by the post-build step (scripts/build-wc.js) as a top-level constant;
// `undefined` during dev/test where styles are loaded normally.
declare const BUNDLED_CSS: string | undefined;

class SunbirdQumlPlayer extends HTMLElement {
  private shadow: ShadowRoot;
  private root: Root | null = null;
  private unsubscribeTelemetry: (() => void) | null = null;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    try {
      // 1. Parse config from the HTML attribute.
      const playerConfigAttr = this.getAttribute('player-config');
      const playerConfig: PlayerConfig = playerConfigAttr
        ? (JSON.parse(playerConfigAttr) as PlayerConfig)
        : ({ context: {}, config: {} } as PlayerConfig);

      // 2. Initialize telemetry BEFORE rendering React (optional; MainPlayer
      //    needs no service-level init).
      try {
        if (playerConfig.context) {
          initializeTelemetry(playerConfig.context);
        }
      } catch (initError) {
        console.error('[SunbirdQumlPlayer] Telemetry initialization error:', initError);
        this._showError('Failed to initialize player services');
        return;
      }

      // 3. Create the React container inside the shadow root.
      const container = document.createElement('div');
      container.className = 'quml-player-root';
      this.shadow.appendChild(container);

      const hostStyle = document.createElement('style');
      hostStyle.textContent = `
        :host {
          display: block;
          all: initial;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
            'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        .quml-player-root { all: initial; display: block; height: 100%; }
      `;
      this.shadow.insertBefore(hostStyle, container);

      // 4. Inject the bundled player CSS (no external fetch).
      this._injectStyles();

      // 5. Bridge telemetry → composed CustomEvent.
      const dispatchTelemetry = (event: unknown): void => this._dispatchEvent('telemetryEvent', event);
      this.unsubscribeTelemetry = subscribeTelemetry((event) => dispatchTelemetry(event));

      // 6. Mount React with the initialized config.
      this.root = createRoot(container);
      this.root.render(
        <QumlProvider playerConfig={playerConfig}>
          <MainPlayer
            playerConfig={playerConfig}
            onPlayerEvent={(event) => this._dispatchEvent('playerEvent', event)}
            onTelemetryEvent={dispatchTelemetry}
          />
        </QumlProvider>,
      );
    } catch (error) {
      console.error('[SunbirdQumlPlayer] Initialization error:', error);
      this._showError('Failed to load player');
    }
  }

  disconnectedCallback(): void {
    if (this.unsubscribeTelemetry) {
      this.unsubscribeTelemetry();
      this.unsubscribeTelemetry = null;
    }
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }

  /** Show an error message in place of the player. */
  private _showError(message: string): void {
    this.shadow.innerHTML = `
      <style>
        :host { display: block; }
        .error { color: #d32f2f; padding: 20px; font-family: sans-serif; }
      </style>
      <div class="error">${message}</div>
    `;
  }

  /** Dispatch a composed CustomEvent (playerEvent / telemetryEvent). */
  private _dispatchEvent(eventName: string, detail: unknown): void {
    this.dispatchEvent(
      new CustomEvent(eventName, {
        detail,
        bubbles: true,
        composed: true,
      }),
    );
  }

  /** Inject the bundled player CSS into the shadow root. */
  private _injectStyles(): void {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      ${typeof BUNDLED_CSS !== 'undefined' ? BUNDLED_CSS : ''}
      :host { display: block; }
      .quml-player-root { all: initial; display: block; height: 100%; }
    `;
    if (this.shadow.firstChild) {
      this.shadow.insertBefore(styleEl, this.shadow.firstChild);
    } else {
      this.shadow.appendChild(styleEl);
    }
  }

  /** Public API — get answers (optional; runtime answers live in Context). */
  getAnswers(): Record<string, unknown> {
    return {};
  }

  /** Public API — reset (optional; reset flows live in Context/MainPlayer). */
  reset(): void {
    /* no-op placeholder, per spec §6.1 */
  }
}

// Register the custom element (guard against double-registration).
if (typeof customElements !== 'undefined' && !customElements.get('sunbird-quml-player')) {
  customElements.define('sunbird-quml-player', SunbirdQumlPlayer);
}

export default SunbirdQumlPlayer;
