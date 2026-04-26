// HMR nudge 1777085902617
import React, { useState, useEffect } from 'react';
import { View, Pressable, ScrollView, TextInput, Switch, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { useQueryClient } from '@tanstack/react-query';
import { Text } from '@/components/ui/text';
import { User, Target, Ruler, Bell, LogOut, Trash2, ChevronRight, Crown, Scale, Info, Shield, Mail } from 'lucide-react-native';
import { PillButton } from '@/components/PillButton';
import { useAppStore } from '@/lib/store';
import { useMe, useGoalsMutation, useLogWeight } from '@/lib/api-hooks';
import { logout } from '@/lib/apiClient';
import { colors } from '@/lib/theme';
import { hapticLight, hapticMedium, hapticWarning } from '@/lib/haptics';

function SettingRow({ icon: Icon, label, value, onPress, color, trailing }: {
  icon: any; label: string; value?: string; onPress?: () => void; color?: string; trailing?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={() => { if (onPress) { hapticLight(); onPress(); } }}
      accessibilityLabel={label}
      testID={`setting-${label.toLowerCase().replace(/\s+/g, '-')}`}
      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 4 }}
      disabled={!onPress}
    >
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${color || colors.primary}12`, alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color={color || colors.primary} />
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={{ fontSize: 15, fontWeight: '500', color: colors.textPrimary }}>{label}</Text>
        {value ? <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>{value}</Text> : null}
      </View>
      {trailing || (onPress ? <ChevronRight size={18} color={colors.textSecondary} /> : null)}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const user = useAppStore(s => s.user);
  const useMetric = useAppStore(s => s.useMetric);
  const toggleUnits = useAppStore(s => s.toggleUnits);
  const signOut = useAppStore(s => s.signOut);
  const queryClient = useQueryClient();

  const { data: meData } = useMe();
  const goalsMutation = useGoalsMutation();
  const logWeightMutation = useLogWeight();

  const goals = meData?.goals;
  const entitlement = meData?.entitlement ?? { isPro: false };

  const [editingGoals, setEditingGoals] = useState<boolean>(false);
  const [editCal, setEditCal] = useState<string>(String(goals?.dailyCalories ?? 2000));
  const [editPro, setEditPro] = useState<string>(String(goals?.proteinG ?? 150));
  const [editCarb, setEditCarb] = useState<string>(String(goals?.carbsG ?? 250));
  const [editFat, setEditFat] = useState<string>(String(goals?.fatG ?? 65));

  const [showWeightInput, setShowWeightInput] = useState<boolean>(false);
  const [weightInput, setWeightInput] = useState<string>(
    useMetric
      ? String(goals?.currentWeightKg ?? 75)
      : String(Math.round((goals?.currentWeightKg ?? 75) * 2.20462))
  );

  // Reset weight input when goals change or units toggle
  useEffect(() => {
    if (useMetric) {
      setWeightInput(String(goals?.currentWeightKg ?? 75));
    } else {
      setWeightInput(String(Math.round((goals?.currentWeightKg ?? 75) * 2.20462)));
    }
  }, [goals?.currentWeightKg, useMetric]);

  const handleSaveGoals = () => {
    goalsMutation.mutate({
      ...(goals || {}),
      dailyCalories: parseInt(editCal) || 2000,
      proteinG: parseInt(editPro) || 150,
      carbsG: parseInt(editCarb) || 250,
      fatG: parseInt(editFat) || 65,
    } as UserGoals);
    setEditingGoals(false);
    hapticLight();
  };

  const handleLogWeight = () => {
    const w = parseFloat(weightInput);
    if (w > 0) {
      const weightKg = useMetric ? w : w / 2.20462;
      logWeightMutation.mutate(weightKg);
      setShowWeightInput(false);
      hapticLight();
    }
  };

  const handleSignOut = async () => {
    hapticWarning();
    try {
      await logout();
      queryClient.clear();
      signOut();
      router.replace('/auth/sign-in');
    } catch (err) {
      console.error('Logout error:', err);
      // Even if server call fails, proceed with local sign-out
      queryClient.clear();
      signOut();
      router.replace('/auth/sign-in');
    }
  };

  const handlePrivacyPolicy = () => {
    hapticLight();
    const extra = (Constants?.expoConfig?.extra ?? {}) as Record<string, any>;
    const privacyUrl = String(extra.privacyPolicyUrl || process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL || 'https://nova8.dev/privacy/149');
    Linking.openURL(privacyUrl);
  };

  const handleSupport = () => {
    hapticLight();
    Linking.openURL('mailto:support@macr.app');
  };

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* User Card */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff' }}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary }}>{user?.name ?? 'User'}</Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>{user?.email ?? 'user@example.com'}</Text>
            </View>
            {entitlement.isPro && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${colors.carbs}15`, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Crown size={14} color={colors.carbs} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.carbs }}>PRO</Text>
              </View>
            )}
          </View>
        </View>

        {/* Goals Section */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.5, marginBottom: 10 }}>GOALS</Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16 }}>
            {editingGoals ? (
              <View style={{ paddingVertical: 16, gap: 12 }}>
                {[
                  { label: 'Calories', val: editCal, set: setEditCal },
                  { label: 'Protein (g)', val: editPro, set: setEditPro },
                  { label: 'Carbs (g)', val: editCarb, set: setEditCarb },
                  { label: 'Fat (g)', val: editFat, set: setEditFat },
                ].map((f, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textPrimary }}>{f.label}</Text>
                    <TextInput
                      value={f.val}
                      onChangeText={f.set}
                      keyboardType="numeric"
                      autoComplete="off"
                      textContentType="none"
                      autoCorrect={false}
                      spellCheck={false}
                      importantForAutofill="no"
                      selectionColor={colors.primary}
                      cursorColor={colors.primary}
                      style={{ backgroundColor: colors.surfaceElevated, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, fontSize: 15, fontWeight: '700', color: colors.textPrimary, width: 80, textAlign: 'center' }}
                      accessibilityLabel={f.label}
                      testID={`edit-${f.label.toLowerCase().replace(/\s+/g, '-')}`}
                    />
                  </View>
                ))}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  <Pressable onPress={() => setEditingGoals(false)} accessibilityLabel="Cancel editing" testID="cancel-goals" style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: colors.surfaceElevated }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary }}>Cancel</Text>
                  </Pressable>
                  <Pressable onPress={handleSaveGoals} accessibilityLabel="Save goals" testID="save-goals" style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: colors.primary }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Save</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <>
                <SettingRow icon={Target} label="Daily Targets" value={`${goals?.dailyCalories ?? 2000} cal · ${goals?.proteinG ?? 150}P · ${goals?.carbsG ?? 250}C · ${goals?.fatG ?? 65}F`} onPress={() => setEditingGoals(true)} />
                <View style={{ height: 1, backgroundColor: colors.border }} />
                <SettingRow icon={Scale} label="Log Weight" value={`Current: ${useMetric ? `${goals?.currentWeightKg ?? 75} kg` : `${Math.round((goals?.currentWeightKg ?? 75) * 2.20462)} lb`}`} onPress={() => setShowWeightInput(true)} />
              </>
            )}
          </View>
        </View>

        {/* Weight Input */}
        {showWeightInput && (
          <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
            <View style={{ backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 10 }}>Log Today's Weight</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {/* @ts-expect-error - importantForAutofill is iOS-only, blocks autofill yellow overlay */}
                <View importantForAutofill="noExcludeDescendants" style={{ flex: 1 }}>
                  <TextInput
                    value={weightInput}
                    onChangeText={setWeightInput}
                    keyboardType="numeric"
                    autoComplete="off"
                    textContentType="none"
                    autoCorrect={false}
                    spellCheck={false}
                    importantForAutofill="no"
                    selectionColor={colors.primary}
                    cursorColor={colors.primary}
                    placeholder={useMetric ? 'Enter weight in kg' : 'Enter weight in lb'}
                    placeholderTextColor={colors.textSecondary}
                    style={{ flex: 1, backgroundColor: colors.surfaceElevated, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, fontWeight: '700', color: colors.textPrimary }}
                    accessibilityLabel="Weight input"
                    testID="log-weight-input"
                  />
                </View>
                <Pressable onPress={handleLogWeight} accessibilityLabel="Save weight" testID="save-weight" style={{ backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center' }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Save</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* Preferences */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.5, marginBottom: 10 }}>PREFERENCES</Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16 }}>
            <SettingRow
              icon={Ruler}
              label="Units"
              value={useMetric ? 'Metric (kg, cm)' : 'Imperial (lbs, in)'}
              trailing={
                <Switch
                  value={useMetric}
                  onValueChange={() => { hapticLight(); toggleUnits(); }}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  accessibilityLabel="Toggle metric/imperial"
                />
              }
            />
            <View style={{ height: 1, backgroundColor: colors.border }} />
            <SettingRow icon={Bell} label="Notifications" value="Meal reminders" color={colors.carbs} />
          </View>
        </View>

        {/* Account */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.5, marginBottom: 10 }}>ACCOUNT</Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16 }}>
            {!entitlement.isPro && (
              <>
                <SettingRow icon={Crown} label="Upgrade to Pro" onPress={() => router.push('/paywall')} color={colors.carbs} />
                <View style={{ height: 1, backgroundColor: colors.border }} />
              </>
            )}
            <SettingRow icon={LogOut} label="Sign Out" onPress={handleSignOut} color="#E05555" />
            <View style={{ height: 1, backgroundColor: colors.border }} />
            <SettingRow icon={Trash2} label="Delete Account" onPress={() => { hapticWarning(); router.push('/delete-account' as any); }} color="#E05555" />
          </View>
        </View>

        {/* About */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.5, marginBottom: 10 }}>ABOUT</Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16 }}>
            <SettingRow icon={Shield} label="Privacy Policy" onPress={handlePrivacyPolicy} color={colors.fat} />
            <View style={{ height: 1, backgroundColor: colors.border }} />
            <SettingRow icon={Info} label="Terms of Service" onPress={handlePrivacyPolicy} color={colors.fat} />
            <View style={{ height: 1, backgroundColor: colors.border }} />
            <SettingRow icon={Mail} label="Support" value="support@macr.app" onPress={handleSupport} color={colors.protein} />
            <View style={{ height: 1, backgroundColor: colors.border }} />
            <View style={{ paddingVertical: 14, paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>Macr v1.0.0 · Built with Nova8</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
