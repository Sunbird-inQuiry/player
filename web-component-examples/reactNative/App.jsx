import React, {useEffect, useState} from 'react';
import {StyleSheet, Platform, View, BackHandler} from 'react-native';

import {WebView} from 'react-native-webview';
import AsyncLocalStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Orientation from 'react-native-orientation-locker';

//importing the sample player config
import {samplePlayerConfig} from './quml-library-data';

function App() {
  const [config, setConfig] = useState();
  const [qumlConfigMetadata, setQumlConfigMetadata] = useState();
  const [playerConfig, setPlayerConfig] = useState('');
  const [deviceOrientation, setDeviceOrientation] = useState('potrait'); //for screen orientation

  //ID of the content to be played
  const CONTENT_ID = 'do_21385321103310848013398';

  //Types of events strings to handled
  const EVENT_TYPES = {
    Rotation: 'DEVICE_ROTATION_CLICKED',
    exitApplication: 'EXIT_APP_CLICKED',
  };

  //Function to be executed on the api call at the react native layer
  const initializePlayer = async metadata => {
    //get the metaData from the local storage if available
    await getDataLocalStorage(setQumlConfigMetadata);

    if (qumlConfigMetadata) {
      setQumlConfigMetadata(prevState => JSON.parse(prevState));
      setConfig({...samplePlayerConfig.config, ...qumlConfigMetadata.config});
    }
    setPlayerConfig({
      context: samplePlayerConfig.context,
      config: config ? config : samplePlayerConfig.config,
      metadata: metadata,
      data: {},
    });
  };

  const getDataLocalStorage = async setData => {
    try {
      const value = await AsyncLocalStorage.getItem(`config_${CONTENT_ID}`);
      if (value !== null) {
        setData(value);
        console.log('\n\n\n\n data fetched from local storage \n\n\n\n');
      } else {
        console.log('no data');
        setData();
      }
    } catch (e) {
      console.log('erorr in getting data', e);
    }
  };

  const setDataLocalStorage = async (key, data) => {
    console.log(key, data);
    try {
      await AsyncLocalStorage.setItem(key, JSON.stringify(data));
      console.log(
        `\n\n\n\n\n data set sucessfully in local storage succesfully with key==========> ${key}\n\n\n\n`,
      );
    } catch (e) {
      console.log('error in setting data', e);
    }
  };

  //Get the questionSet from the api
  const getQuestionSet = async identifier => {
    let hierarchy = {};
    try {
      const response = await axios.get(
        `https://dev.inquiry.sunbird.org/action/questionset/v2/hierarchy/${identifier}`,
      );
      hierarchy = response.data;
    } catch (error) {
      console.error(error);
    }

    let questionSetResponse = {};
    try {
      const response = await axios.get(
        `https://dev.inquiry.sunbird.org/action/questionset/v2/read/${identifier}?fields=instructions,outcomeDeclaration`,
      );
      questionSetResponse = response.data;
    } catch (error) {
      console.error(error);
    }

    const questionSet = hierarchy?.result?.questionset;
    const instructions = questionSetResponse?.result?.questionset?.instructions;
    if (instructions && questionSet) {
      questionSet.instructions = instructions;
    }
    const outcomeDeclaration =
      questionSetResponse?.result?.questionset?.outcomeDeclaration;
    if (outcomeDeclaration && questionSet) {
      questionSet.outcomeDeclaration = outcomeDeclaration;
    }

    return questionSet;
  };

  //Handles the player event on native thread
  const handlePlayerEvent = async event => {
    let eventData = JSON.stringify(event);

    //parsing the stringified json data
    try {
      eventData = await JSON.parse(eventData);
      eventData = await JSON.parse(eventData.nativeEvent.data);
    } catch (error) {
      console.error('Error parsing JSON data:', error);
    }

    //Store the metaData locally when the question set in ends
    if (eventData.eid === 'END') {
      console.log('event end is here');
      let qumlMetaDataConfig = eventData.metaData;
      await setDataLocalStorage(`config_${CONTENT_ID}`, qumlMetaDataConfig);
      setPlayerConfig(prevState => ({
        ...prevState,
        config: {
          ...samplePlayerConfig.config,
          ...qumlMetaDataConfig,
        },
      }));
    }

    //changes the device orientation according to the event
    console.log('eventData', eventData.edata);
    if (eventData.edata?.type === EVENT_TYPES.Rotation) {
      console.log('event rotation is here');
      setDeviceOrientation(prevState =>
        prevState === 'potrait' ? 'landscape' : 'potrait',
      );
      if (deviceOrientation === 'landscape') {
        Orientation.lockToPortrait();
      } else {
        Orientation.lockToLandscapeLeft();
      }
    }
  };

  //To executed when the component is mounted
  useEffect(() => {
    const iffi = async () => {
      const metadata = await getQuestionSet(CONTENT_ID);
      // console.log('metadata', metadata);
      initializePlayer(metadata);
    };
    iffi();
  }, []);

  //Javascript to be injected into the HTML
  const injectedJS = `
  window.apiConfig = ${JSON.stringify(playerConfig)};
  `;

  //Path to find the index.html file for android and ios file system
  const sourceUri =
    (Platform.OS === 'android' ? 'file:///android_asset/' : '') +
    'Web.bundle/index.html';

  return (
    <View style={styles.container}>
      {playerConfig && (
        <WebView
          injectedJavaScriptBeforeContentLoaded={injectedJS}
          source={{uri: sourceUri}}
          javaScriptEnabled={true}
          originWhitelist={['*']}
          allowFileAccess={true}
          onMessage={handlePlayerEvent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
