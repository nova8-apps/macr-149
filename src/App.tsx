import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { View, Text, StyleSheet } from 'react-native';

function AppInner() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello, World!</Text>
      <Text style={styles.subtitle}>
        Your Nova8 app is ready.{'\n'}
        Chat with AI to build it out.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a0f',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
  },
});

// Auto-generated wrapper — Wave 18.12 (do not edit by hand).
export default function App() {
  return (
    <SafeAreaProvider><ErrorBoundary>
      <SafeAreaView style={{ flex: 1 }}><AppInner /></SafeAreaView>
    </ErrorBoundary></SafeAreaProvider>
  );
}
