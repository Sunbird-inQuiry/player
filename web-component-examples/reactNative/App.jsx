import React, {useEffect, useState} from 'react';
import {StyleSheet, Platform, View} from 'react-native';
import {WebView} from 'react-native-webview';
import {samplePlayerConfig} from './quml-library-data';
import {AsyncLocalStorage} from '@react-native-async-storage/async-storage';
import axios from 'axios';

function App() {
  const [config, setConfig] = useState();
  const [qumlConfigMetadata, setQumlConfigMetadata] = useState();
  const [playerConfig, setPlayerConfig] = useState('');

  //id of the content to be played
  const CONTENT_ID = 'do_21368754222912307211';
  const newData = {
    hello: 'hi',
    hello1: 'hi1',
  };

  //Function to be executed on the api call at the react native layer
  const initializePlayer = async metadata => {
    // let qumlConfigMetadata =
    //   localStorage.getItem(`config_${CONTENT_ID}`) || '{}';
    await getData(setQumlConfigMetadata);

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
    console.log(
      {
        context: samplePlayerConfig.context,
        config: config ? config : samplePlayerConfig.config,
        metadata,
        data: {},
      },
      'playerConfig',
    );
  };

  const getData = async setData => {
    try {
      const value = await AsyncLocalStorage.getItem(`config_${CONTENT_ID}`);
      if (value !== null) {
        setData(value);
      } else {
        console.log('no data');
        setData();
      }
    } catch (e) {
      console.log('erorr in getting data');
    }
  };

  getQuestionSet = async identifier => {
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

  useEffect(() => {
    const iffi = async () => {
      const metadata = await getQuestionSet(CONTENT_ID);
      initializePlayer(metadata);
    };
    iffi();
  }, []);

  const injectedJS = `
  window.apiConfig = ${JSON.stringify(playerConfig)};
  window.questionListUrl = 'http://192.168.1.3:8080/https://dev.inquiry.sunbird.org/api/question/v2/list'


    
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
          onMessage={e => {
            console.log(e, 'here is the sended player config');
          }}
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
