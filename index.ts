import "react-native-get-random-values";
import "react-native-reanimated";
import { LogBox } from "react-native";
import "./global.css";
import "expo-router/entry";
// Silence upstream deprecation noise from react-native-web 0.79 / gluestack-ui /
// react-aria that we can't fix in app code. Each filter is narrowly scoped so
// real warnings still surface:
//   - "Expo AV has been deprecated" — RN SDK 53 legacy av notice
//   - "Disconnected from Metro" — dev-server reconnection chatter
//   - "props.pointerEvents is deprecated" — react-native-web 0.79 migrated
//     pointerEvents onto style; third-party libs haven't caught up yet.
//   - 'shadow*' style props are deprecated — react-native-web 0.79 migrated
//     shadowColor/shadowOffset/shadowRadius to the web-native boxShadow prop;
//     gluestack/react-aria still emit the old form.
LogBox.ignoreLogs([
  "Expo AV has been deprecated",
  "Disconnected from Metro",
  "props.pointerEvents is deprecated",
  /"shadow\*?" style props are deprecated/,
]);
