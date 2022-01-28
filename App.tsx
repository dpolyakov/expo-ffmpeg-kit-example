import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, ActivityIndicator } from 'react-native';
import * as React from 'react';

import {FFmpegKit} from 'ffmpeg-kit-react-native';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';

export default function App() {
  const [result, setResult] = React.useState(null);
  const [source, setSource] = React.useState(null);
  const [isLoading, setLoading] = React.useState(false);

  const getResultPath = async () => {
    const videoDir = `${FileSystem.cacheDirectory}video/`;

    // Checks if gif directory exists. If not, creates it
    async function ensureDirExists() {
      const dirInfo = await FileSystem.getInfoAsync(videoDir);
      if (!dirInfo.exists) {
        console.log("tmp directory doesn't exist, creating...");
        await FileSystem.makeDirectoryAsync(videoDir, { intermediates: true });
      }
    }

    await ensureDirExists();
    
    return `${videoDir}file2.mp4`;
  }

  const getSourceVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos
    })

    return (result.cancelled) ? null : result.uri
  }

  const onPress = async () => {
    const resultVideo = await getResultPath();
    const sourceVideo = await getSourceVideo();

    if (!sourceVideo) {
      return;
    }
    setSource(() => sourceVideo)
    setResult(() => null);
    setLoading(() => true);

    FFmpegKit
      .execute(`-i ${sourceVideo} -c:v mpeg4 -y ${resultVideo}`)
      .then((session) => {
        setLoading(() => false);
        setResult(() => resultVideo);

      }
    );

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


const Plyr = props => {
  const video = React.useRef(null);
  const [status, setStatus] = React.useState({});

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
        onPlaybackStatusUpdate={status => setStatus(() => status)}
      />
      <View style={styles.buttons}>
        <Button
          title={status.isPlaying ? 'Pause' : 'Play'}
          onPress={() =>
            status.isPlaying ? video.current.pauseAsync() : video.current.playAsync()
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
