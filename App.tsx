import {StatusBar} from 'expo-status-bar';
import {StyleSheet, Text, View, Button, ActivityIndicator} from 'react-native';
import * as React from 'react';

import {FFmpegKit, FFmpegKitConfig, ReturnCode} from 'ffmpeg-kit-react-native';
import {makeDirectoryAsync, getInfoAsync, cacheDirectory} from 'expo-file-system';
import {launchImageLibraryAsync, MediaTypeOptions} from 'expo-image-picker';
import {Video, AVPlaybackStatus} from 'expo-av';

const getResultPath = async () => {
  const videoDir = `${cacheDirectory}video/`;

  // Checks if gif directory exists. If not, creates it
  async function ensureDirExists() {
    const dirInfo = await getInfoAsync(videoDir);
    if (!dirInfo.exists) {
      console.log("tmp directory doesn't exist, creating...");
      await makeDirectoryAsync(videoDir, { intermediates: true });
    }
  }

  await ensureDirExists();

  return `${videoDir}file2.mp4`;
}

const getSourceVideo = async () => {
  console.log('select video')
  const result = await launchImageLibraryAsync({
    mediaTypes: MediaTypeOptions.Videos
  })

  return (result.canceled) ? null : result.assets[0].uri
}

export default function App() {
  const [result, setResult] = React.useState('');
  const [source, setSource] = React.useState('');
  const [isLoading, setLoading] = React.useState(false);

  React.useEffect(() => {
    FFmpegKitConfig.init();
  }, []);

  const onPress = async () => {
    setLoading(() => true);
    setResult(() => '');

    const resultVideo = await getResultPath();
    const sourceVideo = await getSourceVideo();

    if (!sourceVideo) {
      setLoading(() => false);
      return;
    }
    setSource(() => sourceVideo)

    const ffmpegSession = await FFmpegKit
      .execute(`-i ${sourceVideo} -c:v mpeg4 -y ${resultVideo}`);

    const result = await ffmpegSession.getReturnCode();

    if (ReturnCode.isSuccess(result)) {
      setLoading(() => false);
      setResult(() => resultVideo);
    } else {
      setLoading(() => false);
      console.error(result);
    }

    console.log(sourceVideo)
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Button
        onPress={onPress}
        title="Select video"
        color="#841584"
       />

      {isLoading && <ActivityIndicator size="large" color="#ff0033" />}
      <Plyr uri={source} title={'Source'} />
      {result &&
        <Plyr uri={result} title={'Result'} />
      }
    </View>
  );
}


const Plyr = (props: {
  title: string,
  uri: string,
}) => {
  const video = React.useRef(null);
  const [status, setStatus] = React.useState<AVPlaybackStatus | {}>({});

  return (
    <View style={styles.videoContainer}>
      <Text>{props.title}</Text>
      <Video
        ref={video}
        style={styles.video}
        source={{
          uri: props.uri,
        }}
        useNativeControls
        resizeMode="contain"
        isLooping
        onPlaybackStatusUpdate={(status: AVPlaybackStatus) => setStatus(() => status)}
      />
      <View style={styles.buttons}>
        <Button
          title={status?.isPlaying ? 'Pause' : 'Play'}
          disabled={(props.uri == '')}
          onPress={() =>
            status.isPlaying ? video?.current.pauseAsync() : video?.current.playAsync()
          }
        />
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoContainer: {
    backgroundColor: '#ecf0f1',
    marginTop: 20,
    textAlign: 'center',
    padding: 10,

  },
  video: {
    alignSelf: 'center',
    width: 320,
    height: 200,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
