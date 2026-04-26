import React, { useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { deleteAccount } from "../lib/apiClient";
import { clearSession } from "../lib/session";

/**
 * Delete Account screen — Apple App Store Guideline 5.1.1(v).
 *
 * Any app that allows the user to create an account must also let
 * them delete that account from within the app. This screen calls
 * DELETE /api/app/:projectId/auth/me on Nova8's backend which
 * cascades the account, all content, and the active session.
 *
 * Reviewers WILL test this path during App Review. Do not remove
 * this screen without replacing it with an equivalent flow.
 */
export default function DeleteAccountScreen({ navigation }: any) {
  const [busy, setBusy] = useState(false);

  const confirmAndDelete = () => {
    Alert.alert(
      "Delete your account?",
      "This permanently deletes your account and all associated data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: handleDelete,
        },
      ]
    );
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deleteAccount();
      await clearSession();
      Alert.alert(
        "Account deleted",
        "Your account and data have been removed. We are sorry to see you go.",
        [
          {
            text: "OK",
            onPress: () => {
              try {
                navigation?.reset?.({ index: 0, routes: [{ name: "SignIn" }] });
              } catch {
                /* navigation prop not available — user is already signed out */
              }
            },
          },
        ]
      );
    } catch (err: any) {
      setBusy(false);
      Alert.alert(
        "Couldn't delete account",
        err?.message ||
          "Something went wrong. Please try again, or email us if the problem persists."
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Delete account</Text>
        <Text style={styles.body}>
          Deleting your account will permanently remove:
        </Text>
        <View style={styles.bullets}>
          <Text style={styles.bullet}>• Your profile and sign-in credentials</Text>
          <Text style={styles.bullet}>• All content and data you have saved</Text>
          <Text style={styles.bullet}>• Any active subscriptions handled through our servers</Text>
          <Text style={styles.bullet}>• Your push-notification registration</Text>
        </View>
        <Text style={styles.warning}>
          This action cannot be undone.
        </Text>

        <TouchableOpacity
          style={[styles.destructive, busy && styles.disabled]}
          onPress={confirmAndDelete}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Delete my account permanently"
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.destructiveText}>Delete my account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancel}
          onPress={() => navigation?.goBack?.()}
          accessibilityRole="button"
          accessibilityLabel="Cancel and go back"
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 12, color: "#111" },
  body: { fontSize: 15, color: "#333", marginBottom: 8 },
  bullets: { marginTop: 4, marginBottom: 16 },
  bullet: { fontSize: 14, color: "#444", lineHeight: 22 },
  warning: {
    fontSize: 14,
    color: "#b00020",
    fontWeight: "600",
    marginBottom: 24,
  },
  destructive: {
    backgroundColor: "#b00020",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  destructiveText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  disabled: { opacity: 0.6 },
  cancel: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#f1f1f1",
  },
  cancelText: { color: "#111", fontSize: 16, fontWeight: "500" },
});
