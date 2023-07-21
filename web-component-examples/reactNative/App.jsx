import React, {useEffect, useState} from 'react';
import {StyleSheet, Platform, View} from 'react-native';
import {WebView} from 'react-native-webview';
import {samplePlayerConfig} from './quml-library-data';
import AsyncLocalStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

function App() {
  const [config, setConfig] = useState();
  const [qumlConfigMetadata, setQumlConfigMetadata] = useState();
  const [playerConfig, setPlayerConfig] = useState('');

  //id of the content to be played
  const CONTENT_ID = 'do_21368754222912307211';

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
      metadata,
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

  //handles the player event on native thread
  const handlePlayerEvent = async event => {
    let jsonData = JSON.stringify(event);

    try {
      jsonData = await JSON.parse(jsonData);
      jsonData = await JSON.parse(jsonData.nativeEvent.data);
    } catch (error) {
      console.error('Error parsing JSON data:', error);
    }
    //Store the metaData locally
    if (jsonData.eid === 'END') {
      console.log('event end is here');
      let qumlMetaDataConfig = jsonData.metaData;
      await setDataLocalStorage(`config_${CONTENT_ID}`, qumlMetaDataConfig);
      setPlayerConfig(prevState => ({
        ...prevState,
        config: {
          ...samplePlayerConfig.config,
          ...qumlMetaDataConfig,
        },
      }));
    }
  };

  useEffect(() => {
    const iffi = async () => {
      const metadata = await getQuestionSet(CONTENT_ID);
      initializePlayer(metadata);
    };
    iffi();
  }, []);

  const injectedJS = `
  window.apiConfig = ${JSON.stringify(playerConfig)};
  `;

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
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
