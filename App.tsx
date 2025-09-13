import { Audio, AVPlaybackStatus } from 'expo-av';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

const HOURLY_TASK = 'HOURLY_AUDIO_TASK';
const DAILY_TASK = 'DAILY_AUDIO_TASK';

const audioHourly = [
  require('./assets/audio/surah-al-fatihah.mp3'),
  require('./assets/audio/three-qul-ayatul-kursi.mp3'),
];
const audioDaily = [
  require('./assets/audio/surah-al-baqarah-last-three-ayaat.mp3'),
  require('./assets/audio/surah-hashr-last-3-verses.mp3'),
];

async function playAudios(files: any[]) {
  for (const file of files) {
    const { sound } = await Audio.Sound.createAsync(file);
    await sound.playAsync();
    await new Promise(resolve => {
      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish) {
          resolve(true);
        }
      });
    });
    await sound.unloadAsync();
  }
}

TaskManager.defineTask(HOURLY_TASK, async () => {
  try {
    await playAudios(audioHourly);
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (e) {
    console.error('Error in HOURLY_TASK:', e);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

TaskManager.defineTask(DAILY_TASK, async () => {
  try {
    const now = new Date();
    if (now.getHours() === 20) { // 8pm
      await playAudios(audioDaily);
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }
    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (e) {
    console.error('Error in DAILY_TASK:', e);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export default function App() {
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    // Set minimum interval for background fetch (1 hour)
    BackgroundFetch.setMinimumIntervalAsync(3600);
  }, []);

  // Manual trigger for testing
  const testHourly = async () => {
    setStatus('Playing hourly audios...');
    await playAudios(audioHourly);
    setStatus('Done');
  };
  const testDaily = async () => {
    setStatus('Playing daily audios...');
    await playAudios(audioDaily);
    setStatus('Done');
  };

  return (
    <View style={styles.container}>
      <Text>Expo Audio Scheduler</Text>
      <Button title="Test Hourly Audios" onPress={testHourly} />
      <Button title="Test Daily Audios" onPress={testDaily} />
      <Text>{status}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});
