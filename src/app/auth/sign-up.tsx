import React, { useState, useEffect } from 'react';
import { View, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Apple, Mail, Lock, User, ArrowLeft } from 'lucide-react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { PillButton } from '@/components/PillButton';
import { useAppStore } from '@/lib/store';
import { signupApi, hasCompletedOnboarding } from '@/lib/api-hooks';
import { isAppleAvailable, getToken as getNovaToken } from '@/nova8/backend/auth';
import { auth } from '@/nova8/backend';
import { colors } from '@/lib/theme';
import { hapticMedium, hapticSuccess } from '@/lib/haptics';
export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [appleAvailable, setAppleAvailable] = useState<boolean>(false);
  const setAuth = useAppStore(s => s.setAuth);
  const setOnboarded = useAppStore(s => s.setOnboarded);

  useEffect(() => {
    isAppleAvailable().then(setAppleAvailable);
  }, []);

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError(null);
    hapticMedium();

    try {
      const authUser = await signupApi(email.trim(), password, name.trim());
      const token = await getNovaToken();
      setAuth(authUser as any, token || '');
      hapticSuccess();
      router.replace('/onboarding/step-1');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message.includes('already') ? 'Email already in use' : message);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignUp = async () => {
    setError(null);
    hapticMedium();

    try {
      const user = await auth.signInWithApple();
      const token = await getNovaToken();
      setAuth(user as any, token || '');
      // Wave 3o — Apple can return either a new or existing identity.
      // If the user already completed onboarding on a prior install,
      // send them straight to home instead of re-onboarding them.
      const onboarded = await hasCompletedOnboarding();
      setOnboarded(onboarded);
      hapticSuccess();
      if (onboarded) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/onboarding/step-1');
      }
    } catch (err: unknown) {
      if ((err as any)?.code === 'ERR_CANCELED') {
        setError('Sign up cancelled');
        return;
      }
      const message = err instanceof Error ? err.message : 'Apple sign-up failed';
      setError(message.includes('Network') || message.includes('fetch') ? 'Apple Sign In failed — please try email instead' : message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingTop: insets.top + 20, marginBottom: 20 }}>
          <Pressable onPress={() => router.back()} accessibilityLabel="Go back" testID="back-btn" style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ArrowLeft size={20} color={colors.textPrimary} />
          </Pressable>
        </View>

        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5, marginBottom: 8 }}>Create Account</Text>
        <Text style={{ fontSize: 15, color: colors.textSecondary, marginBottom: 32 }}>Start tracking your nutrition today</Text>

        <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: colors.border }}>
          {error ? (
            <View style={{ backgroundColor: '#FEE2E2', borderRadius: 12, padding: 12, marginBottom: 16 }}>
              <Text style={{ color: '#DC2626', fontSize: 13, fontWeight: '500' }}>{error}</Text>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceElevated, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
            <User size={18} color={colors.textSecondary} />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Full name"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="words"
              style={{ flex: 1, marginLeft: 12, fontSize: 15, color: colors.textPrimary }}
              accessibilityLabel="Name input"
              testID="name-input"
            />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceElevated, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
            <Mail size={18} color={colors.textSecondary} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email address"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={{ flex: 1, marginLeft: 12, fontSize: 15, color: colors.textPrimary }}
              accessibilityLabel="Email input"
              testID="signup-email-input"
            />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceElevated, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20, borderWidth: 1, borderColor: colors.border }}>
            <Lock size={18} color={colors.textSecondary} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password (min 6 chars)"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              style={{ flex: 1, marginLeft: 12, fontSize: 15, color: colors.textPrimary }}
              accessibilityLabel="Password input"
              testID="signup-password-input"
            />
          </View>

          <PillButton title="Create Account" onPress={handleSignUp} loading={loading} fullWidth />

          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginHorizontal: 16 }}>or</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          </View>

          {appleAvailable ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={999}
              style={{ width: '100%', height: 50 }}
              onPress={handleAppleSignUp}
            />
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 4 }}>
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>Already have an account?</Text>
          <Pressable onPress={() => router.back()} accessibilityLabel="Go to sign in" testID="go-to-signin">
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary }}>Sign In</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
