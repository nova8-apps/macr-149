import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "nova8.session";

export async function clearSession() {
  try { await AsyncStorage.removeItem(KEY); } catch { /* ignore */ }
}
