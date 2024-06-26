import React, { useState, useEffect, useRef } from "react";
import {
  Platform,
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import Constants from 'expo-constants';
import * as FileSystem from "expo-file-system";
import { Audio } from "expo-av";
import OpenAI from "openai";
import { Picker } from "@react-native-picker/picker";
import styles from "./styles";

const openAIKey = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey: openAIKey });
const chunkSize = 2000; // Max chunk size for OpenAI API is 4096

if (Platform.OS === "ios") {
  Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
}

export function App() {
  const currentTrackRef = useRef(0);
  const playlistRef = useRef([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [playlist, setPlaylist] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [textInfo, setTextInfo] = useState({ text: "", lastGeneratedText: "" });
  const [audioInfo, setAudioInfo] = useState({
    voice: "alloy",
    lastGeneratedVoice: "alloy",
    sound: null,
    progress: 0,
    duration: 0,
    isPlaybackComplete: false,
    playbackStatus: "Stopped",
  });

  useEffect(() => {
    return () => {
      audioInfo.sound?.unloadAsync();
    };
  }, [audioInfo.sound]);

  // Update refs whenever state changes
  useEffect(() => {
    currentTrackRef.current = currentTrack;
    playlistRef.current = playlist;
  }, [currentTrack, playlist]);

  const fetchAndSaveSpeech = async (inputText, index) => {
    const uniqueFileName = `speech_${index}.mp3`;
    const filePath = FileSystem.cacheDirectory + uniqueFileName;
    try {
      const response = await openai.audio.speech.create({
        model: "tts-1",
        voice: audioInfo.voice,
        input: inputText,
      });
      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      const base64 = await new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result);
      });
      const base64Data = base64.split(",")[1];
      await FileSystem.writeAsStringAsync(filePath, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return filePath;
    } catch (error) {
      console.error("Error fetching and saving speech:", error);
      setErrorMessage(`Error fetching and saving speech: ${error}`);
      return null;
    }
  };

  const updatePlaybackStatus = (status) => {
    setAudioInfo((current) => {
      // Calculate the incremental progress since the last update
      const increment = status.positionMillis - current.progress;
      // Only update cumulative progress if the track is playing and increment is positive
      return {
        ...current,
        progress: status.positionMillis + increment,
        duration: status.durationMillis,
        playbackStatus: status.isPlaying
          ? "Playing"
          : status.isBuffering
          ? "Buffering"
          : "Paused",
      };
    });

    if (status.didJustFinish) {
      const nextTrackIndex = currentTrackRef.current + 1;
      if (nextTrackIndex < playlistRef.current.length) {
        // Add the full duration of the current track to the cumulative progress
        playAudio(playlistRef.current[nextTrackIndex], nextTrackIndex);
      } else {
        setAudioInfo((current) => ({
          ...current,
          progress: 0,
          playbackStatus: "Stopped",
          isPlaybackComplete: true,
        }));
      }
    }
  };

  const playAudio = async (filePath, trackIndex) => {
    try {
      if (audioInfo.sound) {
        await audioInfo.sound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: filePath },
        { shouldPlay: true },
        updatePlaybackStatus
      );
      setAudioInfo((current) => ({
        ...current,
        sound: newSound,
        isPlaybackComplete: false,
        playbackStatus: "Playing",
      }));
      setCurrentTrack(trackIndex);
      currentTrackRef.current = trackIndex;
    } catch (error) {
      console.error("Error playing sound:", error);
      setErrorMessage(`Error playing sound: ${error}`);
      setAudioInfo((current) => ({
        ...current,
        playbackStatus: "Error",
        sound: null,
      }));
    }
  };

  const handleSpeech = async () => {
    setAudioInfo((current) => ({
      ...current,
      convertingText: true,
      lastGeneratedVoice: current.voice,
    }));
    setTextInfo((current) => ({
      ...current,
      lastGeneratedText: current.text,
    }));

    const chunks = splitTextIntoChunks(textInfo.text, chunkSize);

    // Download and play the first chunk immediately
    if (chunks.length > 0) {
      const firstFilePath = await fetchAndSaveSpeech(chunks[0], 0);
      if (firstFilePath) {
        setPlaylist([firstFilePath]); // Initialize the playlist with the first file
        playlistRef.current = [firstFilePath];
        setCurrentTrack(0);
        currentTrackRef.current = 0;
        playAudio(firstFilePath, 0); // Start playing the first file
        setAudioInfo((current) => ({
          ...current,
          progress: 0,
          isSoundReady: true,
          convertingText: false,
        }));

        // Download the remaining chunks in the background
        const restOfTheFiles = await Promise.all(
          chunks
            .slice(1)
            .map((chunk, index) => fetchAndSaveSpeech(chunk, index + 1))
        );

        // Update the playlist with all files once they are ready
        const fullPlaylist = [firstFilePath, ...restOfTheFiles.filter(Boolean)];
        setPlaylist(fullPlaylist);
        playlistRef.current = fullPlaylist;
      }
    }
  };

  const splitTextIntoChunks = (text, maxLength) => {
    let chunks = [];
    while (text.length > 0) {
      let endIndex = Math.min(maxLength, text.length);

      // If endIndex is not the end of the text, try to find the last end of sentence before maxLength
      if (endIndex < text.length) {
        let lastPeriod = text.lastIndexOf(".", endIndex);
        let lastQuestion = text.lastIndexOf("?", endIndex);
        let lastExclamation = text.lastIndexOf("!", endIndex);
        let lastParagraph = text.lastIndexOf("\n", endIndex);

        // Find the maximum index of sentence or paragraph ending, ensuring it's not -1
        endIndex = Math.max(
          lastPeriod,
          lastQuestion,
          lastExclamation,
          lastParagraph,
          0
        );
        if (endIndex === 0 && endIndex < text.length) {
          // If no sentence ending found within the limit, force break at maxLength
          endIndex = maxLength;
        }
      }

      const chunk = text.substring(0, endIndex + 1).trim(); // Include the punctuation in the chunk
      chunks.push(chunk);
      text = text.substring(endIndex + 1).trim(); // Start after the punctuation for next chunk
    }
    return chunks;
  };

  function ThemedText({ style, ...rest }) {
    return <Text style={[styles.themedText, style]} {...rest} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.inputWrapper}>
          <KeyboardAvoidingView behavior="height" style={{ flexGrow: 1 }}>
            <ScrollView
              scrollEnabled={false}
              keyboardShouldPersistTaps="never"
              contentContainerStyle={styles.textInputContainer}
            >
              <TextInput
                style={styles.textInput}
                onChangeText={(text) => {
                  setTextInfo((current) => ({
                    ...current,
                    text: text,
                  }));
                }}
                value={textInfo.text}
                placeholder="Enter text to speak"
                placeholderTextColor={"hsla(0,100%,99%,0.5)"}
                multiline
              />
              <View style={styles.textButtonRow}>
                <Pressable onPress={() => setModalVisible(true)}>
                  <ThemedText>{`Voice: ${
                    audioInfo.voice.charAt(0).toUpperCase() +
                    audioInfo.voice.slice(1)
                  }`}</ThemedText>
                </Pressable>
                <Modal
                  animationType="slide"
                  transparent={true}
                  visible={modalVisible}
                  onRequestClose={() => {
                    setModalVisible(!modalVisible);
                  }}
                >
                  <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                      <ThemedText style={styles.modalText}>Voice</ThemedText>
                      <Picker
                        selectedValue={audioInfo.voice}
                        onValueChange={(newVoice) => {
                          if (newVoice !== audioInfo.voice) {
                            setAudioInfo((current) => ({
                              ...current,
                              voice: newVoice,
                              lastGeneratedVoice: current.voice,
                              isSoundReady: false,
                            }));
                          }
                        }}
                        style={styles.picker}
                      >
                        <Picker.Item label="Alloy" value="alloy" />
                        <Picker.Item label="Echo" value="echo" />
                        <Picker.Item label="Fable" value="fable" />
                        <Picker.Item label="Onyx" value="onyx" />
                        <Picker.Item label="Nova" value="nova" />
                        <Picker.Item label="Shimmer" value="shimmer" />
                      </Picker>
                      <Pressable
                        style={[{ width: "100%" }, styles.primaryBtn]}
                        onPress={() => setModalVisible(!modalVisible)}
                      >
                        <ThemedText>Close</ThemedText>
                      </Pressable>
                    </View>
                  </View>
                </Modal>
                <Pressable
                  onPress={handleSpeech}
                  disabled={
                    !textInfo.text.trim() ||
                    (textInfo.text.trim() === textInfo.lastGeneratedText &&
                      audioInfo.voice === audioInfo.lastGeneratedVoice)
                  }
                  style={[
                    {
                      opacity:
                        !textInfo.text.trim() ||
                        (textInfo.text.trim() === textInfo.lastGeneratedText &&
                          audioInfo.voice === audioInfo.lastGeneratedVoice)
                          ? 0.25
                          : 1,
                    },
                    styles.primaryBtn,
                  ]}
                >
                  <ThemedText style={styles.primaryBtn.text}>
                    ✨ {audioInfo.convertingText ? "Generating…" : "Generate"}
                  </ThemedText>
                </Pressable>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
        {errorMessage && (
        <View style={styles.errorView}>
            <ThemedText style={styles.errorView.text}>{errorMessage}</ThemedText>
          </View>)}
        <View
          style={[
            { opacity: audioInfo.isSoundReady ? 1 : 0.25 },
            styles.playbackContainer,
          ]}
        >
          {/* <View style={styles.progressBarContainer}>
            <ThemedText style={styles.timerText}>
              {formatTime(playlistProgress)}
            </ThemedText>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${
                      (100 * playlistProgress) / Math.max(playlistProgress,totalDuration)
                    }%`,
                  },
                ]}
              />
            </View>
            <ThemedText style={styles.timerText}>
              {formatTime(Math.max(playlistProgress,totalDuration))}
            </ThemedText>
          </View> */}
          
          <View style={styles.playbackControlsRow}>
            {audioInfo.playbackStatus === "Playing" ? (
              <Pressable
                style={styles.playBtn}
                onPress={() => audioInfo.sound?.pauseAsync()}
                disabled={!audioInfo.isSoundReady}
              >
                <ThemedText style={styles.playBtn.text}>⏸️ Pause</ThemedText>
              </Pressable>
            ) : (
              <Pressable
                onPress={() =>
                  !audioInfo.isPlaybackComplete
                    ? audioInfo.sound?.playAsync()
                    : playAudio(playlist[0], 0)
                }
                style={styles.playBtn}
                disabled={!audioInfo.isSoundReady}
              >
                <ThemedText style={styles.playBtn.text}>▶️ Play</ThemedText>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default App;
