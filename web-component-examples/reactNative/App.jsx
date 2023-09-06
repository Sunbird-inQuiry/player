import React, { useEffect, useState } from 'react';
import { StyleSheet, Platform, View, BackHandler } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
// import Orientation from 'react-native-orientation-locker';

import CategoryList from './screens/CategoryList';
import Questions from './screens/Questions';

function App() {
  const Stack = createStackNavigator();
  return (
    <NavigationContainer>
      <Stack.Navigator headerMode='none'>
        <Stack.Screen name="Home" component={CategoryList} />
        <Stack.Screen name="Questions" component={Questions} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
