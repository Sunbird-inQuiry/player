## PREREQUISITE AND STEPS TO USE SUNBIRD-QUML-PLAYER For A REACT NATIVE APP

## Prerequisites

- [Node.js](https://nodejs.org/en/) (>=14.0.0)
- [jdk](https://www.oracle.com/java/technologies/javase-downloads.html) (>=11.0.0)
- [Android Studio](https://developer.android.com/studio)

## Step 1: Setting the enviroment

To setup the environment for React native follow the steps from [React Native CLI Quickstart](https://reactnative.dev/docs/environment-setup)

### Step 2: Initializing a new project React native Project

You can start a new React Native project by using the `react-native init` command. This will create a new React Native project with all the necessary dependencies to get started right away.

```
npx react-native@0.71.0 init reactNative --version 0.71.0
```

We will be using 0.71.0 version of react-native as it supports node version 14.0.0 and above.

### Step 3: Installing dependencies

Our application depends on the package react-native-webview to render the webComponent, axios for API calls, and @react-native-async-storage/async-storage for local storage. You can install them by running the following command in your project root folder:

```
npm i react-native-webview axios @react-native-async-storage/async-storage
```

### Step 4: Adding the webComponent and necceasry assets

We will be using the HTML and Javascript to render the webComponent inside our react-native application. So, first, make the following folder structure inside your project root folder of react-native application:

```
Root
├── html
│   └── Web.bundle
│         ├── index.html
│         ├── sunbird-quml-player.js
│         ├── assets
│         │     └── (all the assets)
│         │
│         └── style
│               └── style.css
```

- Now copy all the files from [assets](https://github.com/Sunbird-inQuiry/player/tree/main/web-component/assets) folder to under the newly created `assets` folder to access the assets from `sunbird-quml-player`

- Copy the `sunbird-quml-player.js` and `styles.css` file from [web-component](https://github.com/Sunbird-inQuiry/player/tree/main/web-component) to under the newly created `Web.bundle` folder and style folder respectively.

<details style="padding: 5px;  border: 1px solid #ccc; border-radius: 4px;">
<summary style = "font-size:17px; color:white">
Setting up appllication for Webcomponent
</summary>

### Step 4: Making use of the WebComponnent in HTML

In the `index.html` add some styles basic styles and import `jquery`, `styles.css` and `sunbird-quml-player.js` as follows.

```diff
/* -- html/Web.bundle/index.html -- */

<head>
+ <link rel="stylesheet" href="./style/styles.css">

+ <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js" integrity="sha512-bLT0Qm9VnAYZDflyKcBaQ2gg0hSYNQrJ8RilYldYQ1FxQYoCLtUjuuRuZo+fjqhx/qtq/1itJ0C2ejDxltZVFg==" crossorigin="anonymous"></script>

+ <style>
+    .player-grid {
+     width: 100%;
+    height: 100vh;
+      margin: 0 auto;
+      display: grid;
+      @media screen and (max-width:768px) {
+        grid-template-columns: 100%;
+        gap: 0px;
+      }
+   }
+  </style>
</head>

<body>
+<div class="player-grid" id="my-player"></div>

+<script src="./sunbird-quml-player.js"></script>

</body>
```

Assign the window object to questionListUrl to get the question list to be used by our webComponent.
Also, attach necessary event listeners to the webComponent.

```diff
/* -- html/Web.bundle/index.html -- */

<body>
  <div class="player-grid" id="my-player"></div>

+   <script type="text/javascript">

+    window.questionListUrl = 'https://corsproxy.io/?https://dev.inquiry.sunbird.org/api/question/v2/list'

+    const qumlPlayerElement = document.createElement('sunbird-quml-player');
+    qumlPlayerElement.setAttribute('player-config', JSON.stringify(apiConfig));



+    qumlPlayerElement.addEventListener('playerEvent', (event) => {
+     console.log("On playerEvent", event);
+      window.ReactNativeWebView.postMessage(JSON.stringify(event.detail));
+    });



+    qumlPlayerElement.addEventListener('telemetryEvent', (event) => {
+      console.log("On telemetryEvent", event);
+    });

+  const myPlayer = document.getElementById("my-player");
+  myPlayer.appendChild(qumlPlayerElement);
+  </script>

</body>
```

Now, our WebComponent is ready to be used in our react-native application.

## Step 5: Making our html file accessible to react-native

Open the `build.gradle` file under `android/app` folder and add the following code to make our html file accessible to react-native.

```diff
/* -- android/app/build.gradle -- */

android {
    ...
+    sourceSets {
+        main {
+            assets.srcDirs = ['src/main/assets', '../../html']
+        }
+    }
    ...
}
```

Now, our html file will be recognized by react-native as an asset.

## Step 6: Rendering the WebComponent inside react-native

- Change the file extension of app.tsx to app.jsx as we wouldn't be using typescript in our application.
- Remove all the code from app.jsx and add the following code to render the webComponent inside react-native.

```diff
/* -- App.jsx -- */
+ import React, { useEffect } from 'react';
+ import { StyleSheet, View, Text} from 'react-native';
+ import axios from 'axios';
+ import AsyncStorage from '@react-native-async-storage/async-storage';
+ import { WebView } from 'react-native-webview';

+ const App = () => {
+  return (
+    <View style={styles.container}>
+ <Text>
+  Web Component here
+ </Text>
+ </View>
+  )
+ }

+ export default App;

+  const styles = StyleSheet.create({
+    container: {
+      flex: 1,
+      backgroundColor: '#fff',
+    }
+ });
```

Let's display a QuML player component in your app and verify that everything works.

```diff
/* -- App.jsx -- */

...

+  const sourceUri =
+    (Platform.OS === 'android' ? 'file:///android_asset/' : '') +
+    'Web.bundle/index.html';

const App = ()=> {
  return(
     <View style={styles.container}>
+        <WebView
+          source={{uri: sourceUri}}
+          javaScriptEnabled={true}
+         originWhitelist={['*']}
+          allowFileAccess={true}
+        />
    </View>
  )
}

export default App;
...
```

Create a quml-library-data.js file which contains the playerConfig. Click to see the mock - [samplePlayerConfig](https://github.com/Sunbird-inQuiry/player/blob/main/web-component-examples/react-app/src/data.js)

</details>

<details style="padding: 5px;  border: 1px solid #ccc; border-radius: 4px;margin-top:20px">
<summary style = "font-size:17px; color:white">
 To run the application without `CONTENT_ID`

</summary>

```diff
/* -- src/App.jsx -- */
...
import { WebView } from 'react-native-webview';
+ import { playerConfig } from './quml-library-data';

...

```

After importing the `samplePlayerConfig`, we have to inject that data into the webView using `injectedJavaScriptBeforeContentLoaded` prop of WebView.
</br>
For this we will be using the `injectedJS` variable which contains the playerConfig in stringified format and assign to injectJavaScript prop of WebView. This prop will be executed before the webview is loaded making sure that the playerConfig is available to the webComponent before the script is loaded.

```diff
/* -- src/App.jsx -- */

...
import { playerConfig } from "./data";


const App=()=> {

+  const injectedJS = `
+    window.apiConfig = ${JSON.stringify(playerConfig)};
+    `;

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: sourceUri }}
+       injectedJavaScriptBeforeContentLoaded={injectedJS}
        javaScriptEnabled={true}
        originWhitelist={["*"]}
        allowFileAccess={true}
  );
}

export default App;
...
```

(Note: quml-library-data.js contains the mock config used in component to send it as input to QuML player)

Listen for the output playerEvent we are sending to native thread from the web thread using `window.ReactNativeWebView.postMessage(JSON.stringify(event.detail))` we used in the event listener in `index.html` this will send the event as a message to the react native thread.

We can access the message in the react native thread using `onMessage` prop of WebView.

```diff
/* -- src/App.js -- */
...
+  handlePlayerEvent = (event) => {
+    console.log("On playerEvent", event);
+  };

const App = ()=>{
  return(

     <View style = {styles.container}>
     <WebView
          injectedJavaScriptBeforeContentLoaded={injectedJS}
          source={{uri: sourceUri}}
          javaScriptEnabled={true}
          originWhitelist={['*']}
          allowFileAccess={true}
+         onMessage={handlePlayerEvent}
        />
     </View>
  )
}
export default App;
```

**You're done! Sunbird QuML Player is now ready to be used in your application.**

</details>

<details style="padding: 5px;  border: 1px solid #ccc; border-radius: 4px; margin-top:20px">
<summary style = "font-size:17px; color:white">
To run the application with `CONTENT_ID` while storing and retrieving MetaData using local storage</summary>

In the previous method we have seen how to run the application without `CONTENT_ID`. Now we will see how to run the application with `CONTENT_ID`.
<br/>
For this we will need to define some states in our App component.

```diff
/* -- src/App.jsx -- */
...
const App = () => {
+  const [config, setConfig] = useState();
+  const [qumlConfigMetadata, setQumlConfigMetadata] = useState();
+  const [playerConfig, setPlayerConfig] = useState('');
...
}
```

Define a Constant `CONTENT_ID` which will be used to get the data from the api.

```diff
/* -- src/App.jsx -- */
const App =()=>{
  const [playerConfig, setPlayerConfig] = useState('');
+ const CONTENT_ID = 'do_21385321103310848013398';
}
```

Define some functions for setting and getting the data from the local storage.

```diff

/* -- src/App.jsx -- */

const App =()=>{
  const [config, setConfig] = useState();
  const [qumlConfigMetadata, setQumlConfigMetadata] = useState();
  const [playerConfig, setPlayerConfig] = useState('');
  const CONTENT_ID = 'do_21385321103310848013398';
+  const getDataLocalStorage = async setData => {
+      try {
+        const value = await AsyncLocalStorage.getItem(`config_${CONTENT_ID}`);
+        if (value !== null) {
+          setData(value);
+        } else {
+          console.log('no data');
+          setData();
+        }
+      } catch (e) {
+        console.log('erorr in getting data', e);
+      }
+    };
+
+    const setDataLocalStorage = async (key, data) => {
+      console.log(key, data);
+      try {
+        await AsyncLocalStorage.setItem(key, JSON.stringify(data));
+      } catch (e) {
+        console.log('error in setting data', e);
+      }
+    };
...

}
```

Now make initilizer function which will run as soon as the component is mounted.

```diff
/* -- src/App.jsx -- */

...

const App =()=>{
  const CONTENT_ID = 'do_21385321103310848013398';
+  const initializePlayer = async metadata => {
+      await getDataLocalStorage(setQumlConfigMetadata);
+
+      if (qumlConfigMetadata) {
+        setQumlConfigMetadata(prevState => JSON.parse(prevState));
+        setConfig({...samplePlayerConfig.config, ...qumlConfigMetadata.config});
+      }
+      setPlayerConfig({
+        context: samplePlayerConfig.context,
+        config: config ? config : samplePlayerConfig.config,
+        metadata,
+        data: {},
+      });
+    };
}
...
```

Make function to get the data from the api.

```diff
const App =()=>{
  const CONTENT_ID = 'do_21385321103310848013398';
  ...

+  const getQuestionSet = async identifier => {
+      let hierarchy = {};
+      try {
+        const response = await axios.get(
+          `https://dev.inquiry.sunbird.org/action/questionset/v2/hierarchy/${identifier}`,
+        );
+        hierarchy = response.data;
+      } catch (error) {
+        console.error(error);
+      }
+
+      let questionSetResponse = {};
+      try {
+        const response = await axios.get(
+          `https://dev.inquiry.sunbird.org/action/questionset/v2/read/${identifier}?fields=instructions,outcomeDeclaration`,
+        );
+        questionSetResponse = response.data;
+      } catch (error) {
+        console.error(error);
+      }
+
+      const questionSet = hierarchy?.result?.questionset;
+      const instructions = questionSetResponse?.result?.questionset?.instructions;
+      if (instructions && questionSet) {
+        questionSet.instructions = instructions;
+      }
+      const outcomeDeclaration =
+        questionSetResponse?.result?.questionset?.outcomeDeclaration;
+      if (outcomeDeclaration && questionSet) {
+        questionSet.outcomeDeclaration = outcomeDeclaration;
+      }
+
+      return questionSet;
+    };

 const sourceUri =
    (Platform.OS === 'android' ? 'file:///android_asset/' : '') +
    'Web.bundle/index.html';

...

  }
```

Now call the `initializePlayer` function in the `useEffect` hook.

```diff

/* -- src/App.jsx -- */

...

const App = ()=>{
  ...

const getQuestionSet(identifier){
    ...
  };

+    useEffect(() => {
+      const iffi = async () => {
+        const metadata = await getQuestionSet(CONTENT_ID);
+        initializePlayer(metadata);
+      };
+      iffi();
+    }, []);

 const sourceUri =
    (Platform.OS === 'android' ? 'file:///android_asset/' : '') +
    'Web.bundle/index.html';

...
}
```

we have to inject that data into the webView using `injectedJavaScriptBeforeContentLoaded` prop of WebView.
</br>
For this we will be using the `injectedJS` variable which contains the playerConfig in stringified format and assign to injectJavaScript prop of WebView. This prop will be executed before the webview is loaded making sure that the playerConfig is available to the webComponent before the script is loaded.

```diff
/* -- src/App.jsx -- */

const App =()=>{
  ...

+    const injectedJS = `
+    window.apiConfig = ${JSON.stringify(playerConfig)};
+    `;

 const sourceUri =
    (Platform.OS === 'android' ? 'file:///android_asset/' : '') +
    'Web.bundle/index.html';

  return (
      <View style={styles.container}>

          <WebView
+            injectedJavaScriptBeforeContentLoaded={injectedJS}
            source={{uri: sourceUri}}
            javaScriptEnabled={true}
            originWhitelist={['*']}
            allowFileAccess={true}
          />
      </View>
    );
}
```

Now we will doing the conditional rendering of WebView based on the playerConfig.

```diff
/* -- src/App.jsx -- */
...
 return (
    <View style={styles.container}>
+      {playerConfig && (
        <WebView
          injectedJavaScriptBeforeContentLoaded={injectedJS}
          source={{uri: sourceUri}}
          javaScriptEnabled={true}
          originWhitelist={['*']}
          allowFileAccess={true}
        />
+      )}
    </View>
  );
```

Now we will be recieving the playerEvent in the native thread from the web thread we send using `window.ReactNativeWebView.postMessage(JSON.stringify(event.detail))` we used in the event listener in `index.html` this will send the event as a message to the React Native thread.

for this we will make a function `handlePlayerEvent` which will be called when the playerEvent is recieved.

```diff
/* -- src/App.jsx -- */

...

const App =()=>{
  ...

+    const handlePlayerEvent = async event => {
+      let jsonData = JSON.stringify(event);
+
+      try {
+        jsonData = await JSON.parse(jsonData);
+        jsonData = await JSON.parse(jsonData.nativeEvent.data);
+      } catch (error) {
+        console.error('Error parsing JSON data:', error);
+      }
+      //Store the metaData locally
+      if (jsonData.eid === 'END') {
+        console.log('event end is here');
+        let qumlMetaDataConfig = jsonData.metaData;
+        await setDataLocalStorage(`config_${CONTENT_ID}`, qumlMetaDataConfig);
+        setPlayerConfig(prevState => ({
+          ...prevState,
+          config: {
+            ...samplePlayerConfig.config,
+            ...qumlMetaDataConfig,
+          },
+        }));
+      }
+    };

 return (
    <View style={styles.container}>
      {playerConfig && (
        <WebView
          injectedJavaScriptBeforeContentLoaded={injectedJS}
          source={{uri: sourceUri}}
          javaScriptEnabled={true}
          originWhitelist={['*']}
          allowFileAccess={true}
+         onMessage={handlePlayerEvent}
        />
      )}
    </View>
  );
  }
```

**You're done! Sunbird QuML Player is now ready to play in your application.**

</details>

<details style="padding: 5px;  border: 1px solid #ccc; border-radius: 4px; margin-top:20px">
<summary style = "font-size:17px; color:white">
To Run the application in debug mode
</summary>

- on Virtual Device

  - First open the Virtual Device in the sdk manager of android studio.
  - Then run the following command in your project root folder to start the metro server.

  ```
  npm run start
  ```

  - Then run the following command in your project root folder to start the application.

  ```
  npx react-native run-android
  ```

  This will start the application in debug mode in which all the changes you do in your application is reflected in the application without restarting the application.

- on Physical Device
  - First make sure your device has developer mode enabled.
  - Connect you device to your system using a USB cable.
  - Make sure system has adb installed to it by running the following command in your terminal.
  ```
  adb --version
  ```
  - Run the following command to make sure your device is connected to your system.
  ```
  adb devices
  ```
  - Then run the following command in your project root folder to start the metro server.
  ```
  npm run start
  ```
  - Then run the following command in your project root folder to start the application.
  ```
  npx react-native run-android
  ```
  Then you can see the application running in your device.

</details>

<details style="padding: 5px;  border: 1px solid #ccc; border-radius: 4px; margin-top:20px">
<summary style = "font-size:17px; color:white" >To build the Release APK</summary>

Go to the android folder inside the react native project and run the following command to build the release apk.

```
./gradlew assembleRelease
```

And then you will find the apk in the following path.

```
android/app/build/outputs/apk/release/app-release.apk
```

</details>
