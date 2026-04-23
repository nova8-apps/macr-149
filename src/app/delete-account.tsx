import React, { useState } from 'react';
import { View, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { AlertTriangle } from 'lucide-react-native';
import { colors } from '@/lib/theme';
import { hapticWarning } from '@/lib/haptics';
import { deleteAccount } from '@/lib/apiClient';
import { useAppStore } from '@/lib/store';

/**
 * Delete Account screen — Apple App Store Guideline 5.1.1(v).
 *
 * Any app that allows the user to create an account must also let
 * them delete that account from within the app. This screen calls
 * DELETE /api/app/{projectId}/auth/me on Nova8's backend which
 * permanently deletes the user account and all data.
 *
 * Reviewers WILL test this path during App Review. Do not remove
 * this screen without replacing it with an equivalent flow.
 */
export default function DeleteAccountScreen() {
  const [busy, setBusy] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const signOut = useAppStore(s => s.signOut);

  const handleDelete = async () => {
    setBusy(true);
    hapticWarning();
    try {
      await deleteAccount();
      signOut();
      router.replace('/auth/sign-in');
    } catch (err: any) {
      setBusy(false);
      console.error('Delete account error:', err);
      // Show error in UI
      alert(err?.message || 'Failed to delete account. Please try again.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Go back"
            testID="delete-account-back"
            style={{ alignSelf: 'flex-start', marginBottom: 16 }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.primary }}>← Back</Text>
          </Pressable>
          <Text style={{ fontSize: 28, fontWeight: '800', color: colors.textPrimary, marginBottom: 8 }}>Delete Account</Text>
          <Text style={{ fontSize: 15, color: colors.textSecondary }}>This action cannot be undone</Text>
        </View>

        {/* Warning Card */}
        <View style={{ backgroundColor: '#FEE2E2', borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#FCA5A5' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <AlertTriangle size={20} color="#DC2626" />
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#DC2626', marginLeft: 8 }}>Permanent Deletion</Text>
          </View>
          <Text style={{ fontSize: 14, color: '#991B1B', lineHeight: 20 }}>
            Deleting your account will permanently remove all your data from our servers. This includes:
          </Text>
        </View>

        {/* What Gets Deleted */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: 32, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 }}>What will be deleted:</Text>
          {[
            'Your profile and sign-in credentials',
            'All meals and nutrition logs',
            'Exercise history and progress data',
            'Goals, streaks, and achievements',
            'Any active subscriptions',
          ].map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', marginBottom: 8 }}>
              <Text style={{ fontSize: 14, color: '#DC2626', marginRight: 8 }}>•</Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, flex: 1 }}>{item}</Text>
            </View>
          ))}
        </View>

        {!showConfirm ? (
          <Pressable
            onPress={() => setShowConfirm(true)}
            accessibilityLabel="Continue to delete account"
            testID="delete-account-continue"
            style={{ backgroundColor: '#DC2626', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 12 }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Delete My Account</Text>
          </Pressable>
        ) : (
          <>
            <View style={{ backgroundColor: '#FEF3C7', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#FCD34D' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#92400E', marginBottom: 4 }}>Are you absolutely sure?</Text>
              <Text style={{ fontSize: 13, color: '#78350F' }}>This action is permanent and cannot be undone.</Text>
            </View>
            <Pressable
              onPress={handleDelete}
              disabled={busy}
              accessibilityLabel="Confirm delete account"
              testID="delete-account-confirm"
              style={{ backgroundColor: busy ? '#6B7280' : '#991B1B', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 12 }}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Yes, Delete Forever</Text>
              )}
            </Pressable>
          </>
        )}

        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Cancel and go back"
          testID="delete-account-cancel"
          style={{ backgroundColor: colors.surface, borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary }}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
