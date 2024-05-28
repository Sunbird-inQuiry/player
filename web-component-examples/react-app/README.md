
## STEPS TO USE SUNBIRD-QUML-PLAYER AS WEB-COMPONENT IN REACT APP

This guide assumes you already have a React project. If you want to create a new one, you can use the [create-react-app](https://create-react-app.dev/) CLI. It allows you to create and customize your project with templates.

## Installation

### Step 1: Installing packages
You can use the npm command-line tool to install packages.
```
npm install --save @project-sunbird/sunbird-quml-player-web-component
```

### Step 2: Installing dependencies
Some components rely on `jQuery`, `katex` and `@project-sunbird/telemetry-sdk` to work correctly. If you don't already have as a dependency, you should also install it to your application via npm.
```
npm i jquery @project-sunbird/telemetry-sdk katex --save
```

### Step 3: Copying assets
Including CSS and Image files, are required for your application to work correctly.

So copy the [assets](https://github.com/Sunbird-inQuiry/player/tree/main/web-component/assets) folder to under the `public` folder to access the assets from `sunbird-quml-player` 

### Step 4: Adding styles
Add a few global CSS styles requires to work correctly
```css
/* The following block can be included in a src/App.css */

html, body {
  background-color: #fff;
}

.App {
  width: 100%; /* Give full proper height and width to the container */
  height: 100vh;
  margin: 0 auto;
  display: grid;
}

```
You're done! Sunbird QuML Player is now configured to be used in your application.
## Usage

Let's display a QuML player component in your app and verify that everything works.

Once installed you need to import our main `sunbird-quml-player` JS and CSS files into your application module whose components will be using the <sunbird-quml-player> component in their templates.

```diff
/* -- src/App.js -- */

import { useEffect, useRef } from "react";
import "./App.css";

+ import $ from "jquery";
+ import "@project-sunbird/sunbird-quml-player-web-component/styles.css";
+ import "@project-sunbird/sunbird-quml-player-web-component/sunbird-quml-player.js";


function App() {

+  window.jQuery = $; // Assign jQuery to window object

  return (
    <div className="App">HELLO WORLD!</div>
  );
}

export default App; 

```

Now, Add the `<sunbird-quml-player>` tag in the template to run the QuML player:
```diff
/* -- src/App.js -- */

import { useEffect, useRef } from "react";
import "./App.css";

import $ from "jquery";
import "@project-sunbird/sunbird-quml-player-web-component/styles.css";
import "@project-sunbird/sunbird-quml-player-web-component/sunbird-quml-player.js";


function App() {

  window.jQuery = $;
  return (
    <div className="App">
+      <sunbird-quml-player></sunbird-quml-player>
    </div>
  );

}

export default App; 
```

After adding tag, Now we have to pass input to render the QuML player.
Create a data.ts file which contains the playerConfig. Click to see the mock - [samplePlayerConfig](https://github.com/Sunbird-inQuiry/player/blob/main/web-component-examples/react-app/src/data.js)
```diff
/* -- src/App.js -- */

import { useEffect, useRef } from "react";
import "./App.css";

import $ from "jquery";
import "@project-sunbird/sunbird-quml-player-web-component/styles.css";
import "@project-sunbird/sunbird-quml-player-web-component/sunbird-quml-player.js";

+ import { playerConfig } from "./data";


function App() {
  
  // Assign jQuery and questionListUrl to window object
   window.jQuery = $;
+  window.questionListUrl = "https://dev.sunbirded.org/api/question/v2/list";
  
  return (
    <div className="App">
      <sunbird-quml-player
+        player-config={JSON.stringify(playerConfig)}        
      ></sunbird-quml-player>
    </div>
  );
}

export default App; 
```
(Note: data.ts contains the mock config used in component to send it as input to QuML player)

Listen for the output events: playerEvent and telemetryEvent.

Import `useRef` hook and create player reference for output events from QuML player. You should end up with code similar to below:
```diff
/* -- src/App.js -- */

+ import { useEffect, useRef } from "react";
import "./App.css";

import $ from "jquery";
import "@project-sunbird/sunbird-quml-player-web-component/styles.css";
import "@project-sunbird/sunbird-quml-player-web-component/sunbird-quml-player.js";

import { playerConfig } from "./data";

function App() {
  
+  const sunbirdQumlPlayerRef = useRef(null);

  // Assign jQuery and questionListUrl to window object
  window.jQuery = $;
  window.questionListUrl = "https://dev.sunbirded.org/api/question/v2/list";

+  useEffect(() => {
+    const playerElement = sunbirdQumlPlayerRef.current;
+    const handlePlayerEvent = (event) => {
+      console.log("Player Event", event.detail);
+    };
+    const handleTelemetryEvent = (event) => {
+      console.log("Telemetry Event", event.detail);
+    };
+
+    playerElement.addEventListener("playerEvent", handlePlayerEvent);
+    playerElement.addEventListener("telemetryEvent", handleTelemetryEvent);
+
+    return () => {
+      playerElement.removeEventListener("playerEvent", handlePlayerEvent);
+      playerElement.removeEventListener("telemetryEvent", handleTelemetryEvent);
+    };
+  }, []);

  return (
    <div className="App">
      <sunbird-quml-player
        player-config={JSON.stringify(playerConfig)}
+        ref={sunbirdQumlPlayerRef}
      ></sunbird-quml-player>
    </div>
  );
}

export default App;
```

**Component properties**

The <sunbird-quml-player> component supports the following properties:

- playerConfig – The player configuration. See the [Configuration](https://inquiry.sunbird.org/learn/product-and-developer-guide/question-set-player/player-configuration) guide.
- playerEvent – A function called when the player has performed any action.
- telemetryEvent – A function called when it emits event for each action performed in the player.

The player event callbacks (playerEvent, telemetryEvent) receive one argument:

1. An EventInfo object.



**You're done! Sunbird QuML Player is now ready to play in your application.**

Run your local dev server:
```
react-scripts start
```
Then point your browser to [http://localhost:3000](http://localhost:3000/).

You should see the sunbird QuML player component on the page.


Click to see the sample code - [sampleCode](https://github.com/Sunbird-inQuiry/player/tree/main/web-component-examples/react-app)

