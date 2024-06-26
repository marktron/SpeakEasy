import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#1A1A1A",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 60,
    justifyContent: "space-between",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  inputWrapper:{
    flexGrow:1,
  },
  themedText: {
    color: "#FFFCFC",
    fontSize: 18,
  },
  modalView: {
    margin: 20,
    backgroundColor: "#FFFCFC",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.33,
    shadowRadius: 4,
    elevation: 5,
    width: "80%",
  },
  picker: {
    width: "100%",
  },
  modalText: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 21,
  },
  textInputContainer: {
    flexGrow: 1,
    justifyContent: "flex-start",
    gap: 20
  },
  playbackContainer: {
    flexDirection: "column",
    gap: 20,
  },
  textInput: {
    height: 250,
    width: "100%",
    borderColor: "hsla(0,100%,99%,1)",
    backgroundColor: "hsla(0,100%,99%,0.05)",
    borderWidth: 5,
    padding: 15,
    borderRadius: 30,
    color: "hsla(0,100%,99%,1)",
    fontSize: 18,
  },
  textButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
  },
  primaryBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    // paddingHorizontal: 32,
    flexGrow: 1,
    borderRadius: 50,
    elevation: 3,
    backgroundColor: "#8959A8",
    text: {
      color: "white",
      fontWeight: "bold",
    },
  },
  // progressBarContainer: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   justifyContent: "space-between",
  //   width: "100%",
  // },
  // progressBarBackground: {
  //   flex: 1,
  //   height: 20,
  //   backgroundColor: "#666666",
  //   borderRadius: 4,
  //   marginHorizontal: 10,
  //   opacity: 0.8,
  // },
  // progressBar: {
  //   height: "100%",
  //   backgroundColor: "#8959A8",
  //   borderRadius: 4,
  // },
  // timerText: {
  //   width: "15%",
  //   textAlign: "center",
  //   fontSize: 14,
  // },
  playbackControlsRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
    gap: 20,
  },
  playBtn: {
    backgroundColor: "#8959A8",
    flexGrow: 1,
    padding: 20,
    borderRadius: 100,
    alignItems: "center",
    text: {
      fontWeight: "bold",
    },
  },
  stopBtn: {
    backgroundColor: "#FF0000",
    padding: 10,
    flexGrow: 1,
    borderRadius: 50,
    alignItems: "center",
  },
  errorView: {
    backgroundColor: "hsla(358,62%,57%,0.2)",
    borderColor: "hsla(358,62%,57%,1)",
    borderWidth: 4,
    borderRadius: 10,
    padding: 10,
    alignItems: "left",
    text: {
      fontSize: 14,
    }
  },
});

export default styles;