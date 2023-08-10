import 'react-native';
import React from 'react';
import App from '../App';
import * as axios from 'axios';
import {render} from '@testing-library/react-native';
import AsyncLocalStorage from '@react-native-async-storage/async-storage';

// Mocking the AsyncStorage module
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
// Mocking the react-native-webview module

jest.mock('react-native-webview', () => {
  const {View} = require('react-native');
  return {
    WebView: View,
  };
});
jest.mock('axios');

jest.mock('react-native-orientation-locker', () => {
  return {
    lockToPortrait: jest.fn(),
    lockToLandscape: jest.fn(),
  };
});

describe('App component', () => {
  it('renders the WebView when playerConfig is available', () => {
    // Mocking the response from axios.get for getQuestionSet
    const mockedResponse = {
      data: {
        result: {
          questionset: {
            id: 123456789,
            questionset: ['where is taj mahal located?'],
          },
        },
      },
    };
    axios.get.mockResolvedValue(mockedResponse);
  });

  it('initializes playerConfig correctly after fetching metadata', async () => {
    const CONTENT_ID = 'do_123456789';
    const mockedResponse = {
      data: {
        result: {
          questionset: ['where is the biggest library in the world located?'],
        },
      },
    };
    axios.get.mockResolvedValue(mockedResponse);
    await AsyncLocalStorage.getItem.mockResolvedValue(`config_${CONTENT_ID}`);
  });

  it('stores qumlMetaDataConfig in local storage on player event END', async () => {
    const CONTENT_ID = 'do_123456789';
    const mockedResponse = {
      data: {
        result: {
          questionset: ['where is longest river located?'],
        },
      },
    };
    axios.get.mockResolvedValue(mockedResponse);

    const {findByType} = render(<App />);

    // Simulate player event END
    const jsonData = {
      eid: 'END',
      metaData: {
        data: {
          questionset: ['where is tallest statue in the world located?'],
        },
      },
    };

    // Make assertions about local storage
    const storedData = await AsyncLocalStorage.setItem.mockResolvedValue(
      `config_${CONTENT_ID}`,
      mockedResponse,
    );
  });
});
