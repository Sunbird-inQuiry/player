import { QumlProvider } from './context/QumlContext';
import { MainPlayer } from './components/MainPlayer/MainPlayer';
import { sampleConfig } from './dev/sample-data';
import type { PlayerConfig } from './types';

/**
 * DEV harness — mounts the real player so `npm run dev` shows a runnable UI.
 *
 * Two modes, chosen by the URL:
 *   - API mode:     ?identifier=<questionSetId>[&lang=en]
 *       Builds a config with NO embedded data → MainPlayer fetches the hierarchy
 *       + questions via the data service. `host` is left empty so requests are
 *       same-origin relative and go through the Vite proxy → localhost:9000.
 *   - Embedded mode (default): the bundled sample data (no network).
 */
function resolveConfig(): PlayerConfig {
  const params = new URLSearchParams(window.location.search);
  const identifier = params.get('identifier');

  if (identifier) {
    return {
      // host is empty → API requests are same-origin relative and go through the
      // Vite proxy → localhost:9000.
      context: { uid: 'dev-user', sid: 'dev-session', channel: 'dev', host: '' },
      // Only set language when ?lang is present; otherwise let the language
      // precedence (localStorage['app-language'] → 'en') apply.
      config: { language: params.get('lang') ?? undefined, maxAttempts: 3 },
      // API mode: only an identifier, no embedded sections. Online asset hosts
      // come from each media[].baseUrl in the backend response (Angular parity).
      data: { identifier },
    };
  }

  return sampleConfig;
}

function App() {
  const playerConfig = resolveConfig();

  return (
    <QumlProvider playerConfig={playerConfig}>
      <MainPlayer playerConfig={playerConfig} />
    </QumlProvider>
  );
}

export default App;
