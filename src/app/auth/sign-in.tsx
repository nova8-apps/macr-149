import React, { useState, useEffect } from 'react';
import { View, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Apple, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { PillButton } from '@/components/PillButton';
import { useAppStore } from '@/lib/store';
import { loginApi } from '@/lib/api-hooks';
import { isAppleAvailable, getToken as getNovaToken } from '@/nova8/backend/auth';
import { auth } from '@/nova8/backend';
import { colors } from '@/lib/theme';
import { hapticMedium, hapticSuccess } from '@/lib/haptics';
export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [appleAvailable, setAppleAvailable] = useState<boolean>(false);
  const setAuth = useAppStore(s => s.setAuth);
  const setOnboarded = useAppStore(s => s.setOnboarded);

  useEffect(() => {
    isAppleAvailable().then(setAppleAvailable);
  }, []);

  const logoScale = useSharedValue(1);
  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }
    setLoading(true);
    setError(null);
    hapticMedium();

    try {
      const authUser = await loginApi(email.trim(), password);
      const token = await getNovaToken();
      setAuth(authUser as any, token || '');

      // Check if the user has completed onboarding by verifying goals have actual calorie values
      const hasCompletedOnboarding = (authUser as any).goals && typeof (authUser as any).goals.daily_calories === 'number' && (authUser as any).goals.daily_calories > 0;

      if (hasCompletedOnboarding) {
        setOnboarded(true);
      }
      hapticSuccess();

      if (hasCompletedOnboarding) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/onboarding/step-1');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message.includes('Invalid') ? 'Invalid credentials' : message);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError(null);
    hapticMedium();

    try {
      const user = await auth.signInWithApple();
      const token = await getNovaToken();
      setAuth(user as any, token || '');

      const hasCompletedOnboarding = (user as any).goals?.daily_calories > 0;

      if (hasCompletedOnboarding) {
        setOnboarded(true);
      }
      hapticSuccess();

      if (hasCompletedOnboarding) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/onboarding/step-1');
      }
    } catch (err: unknown) {
      if ((err as any)?.code === 'ERR_CANCELED') {
        setError('Sign in cancelled');
        return;
      }
      const message = err instanceof Error ? err.message : 'Apple sign-in failed';
      setError(message.includes('Network') || message.includes('fetch') ? 'Apple Sign In failed — please try email instead' : message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[logoStyle, { alignItems: 'center', marginBottom: 40 }]}>
          <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Apple size={32} color="#fff" />
          </View>
          <Text style={{ fontSize: 28, fontWeight: '800', color: colors.primary, letterSpacing: -0.5 }}>Macr</Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>Welcome back</Text>
        </Animated.View>

        <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: colors.border }}>
          {error ? (
            <View style={{ backgroundColor: '#FEE2E2', borderRadius: 12, padding: 12, marginBottom: 16 }}>
              <Text style={{ color: '#DC2626', fontSize: 13, fontWeight: '500' }}>{error}</Text>
            </View>
          ) : null}

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
              testID="email-input"
            />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceElevated, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20, borderWidth: 1, borderColor: colors.border }}>
            <Lock size={18} color={colors.textSecondary} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!showPassword}
              style={{ flex: 1, marginLeft: 12, fontSize: 15, color: colors.textPrimary }}
              accessibilityLabel="Password input"
              testID="password-input"
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} accessibilityLabel="Toggle password visibility" testID="toggle-password">
              {showPassword ? <EyeOff size={18} color={colors.textSecondary} /> : <Eye size={18} color={colors.textSecondary} />}
            </Pressable>
          </View>

          <PillButton title="Sign In" onPress={handleSignIn} loading={loading} fullWidth />

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
              onPress={handleAppleSignIn}
            />
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 4 }}>
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>Don't have an account?</Text>
          <Pressable onPress={() => router.push('/auth/sign-up')} accessibilityLabel="Go to sign up" testID="go-to-signup">
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary }}>Sign Up</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
