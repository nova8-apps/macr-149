import React, { useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { X, Star, Shield, Sparkles, Check } from 'lucide-react-native';
import { PillButton } from '@/components/PillButton';
import { useEntitlementMutation } from '@/lib/api-hooks';
import { colors } from '@/lib/theme';
import { hapticMedium, hapticSuccess } from '@/lib/haptics';

const FEATURES = [
  { icon: Sparkles, label: 'Unlimited AI food scans' },
  { icon: Star, label: 'Detailed macro breakdowns' },
  { icon: Shield, label: 'Barcode & label scanning' },
  { icon: Check, label: 'Advanced progress analytics' },
];

export default function PaywallScreen() {
  const [freeTrial, setFreeTrial] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const entitlementMutation = useEntitlementMutation();

  const badgeScale = useSharedValue(1);
  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: badgeScale.value }] }));

  const handlePurchase = async () => {
    setLoading(true);
    hapticMedium();
    await new Promise(r => setTimeout(r, 1200));
    entitlementMutation.mutate(
      { isPro: true, productId: 'yearly_pro' },
      {
        onSuccess: () => {
          hapticSuccess();
          setLoading(false);
          router.replace('/(tabs)/home');
        },
        onError: () => {
          setLoading(false);
        },
      }
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 24, paddingTop: 56 }}>
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Close paywall"
            testID="close-paywall"
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={18} color={colors.textSecondary} />
          </Pressable>

          <View style={{ alignItems: 'center', marginTop: 24 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary, letterSpacing: 1 }}>YOUR ONE-TIME OFFER</Text>
          </View>

          <Animated.View style={[badgeStyle, {
            marginTop: 20, borderRadius: 24, overflow: 'hidden',
            backgroundColor: colors.primary, padding: 28, alignItems: 'center',
          }]}>
            <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
              {[1, 2, 3].map(i => <Star key={i} size={14} color="#FFD700" fill="#FFD700" />)}
            </View>
            <Text style={{ fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: -1 }}>80% OFF</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>FOREVER</Text>
          </Animated.View>

          <View style={{ marginTop: 28 }}>
            {FEATURES.map((f, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${colors.primary}12`, alignItems: 'center', justifyContent: 'center' }}>
                  <f.icon size={20} color={colors.primary} />
                </View>
                <Text style={{ fontSize: 15, fontWeight: '500', color: colors.textPrimary, flex: 1 }}>{f.label}</Text>
              </View>
            ))}
          </View>

          <View style={{
            backgroundColor: colors.surface, borderRadius: 20, padding: 20,
            borderWidth: 2, borderColor: colors.primary, marginTop: 12,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>Yearly Plan</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <Text style={{ fontSize: 14, color: colors.textSecondary, textDecorationLine: 'line-through' }}>$9.99/mo</Text>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: colors.primary }}>$1.99/mo</Text>
                </View>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>$23.88 billed annually</Text>
              </View>
              <View style={{ backgroundColor: `${colors.primary}15`, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>BEST VALUE</Text>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, backgroundColor: colors.surfaceElevated, borderRadius: 16, padding: 16 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>Free Trial (3 days)</Text>
            <Pressable
              onPress={() => { hapticMedium(); setFreeTrial(!freeTrial); }}
              accessibilityLabel="Toggle free trial"
              testID="free-trial-toggle"
              style={{
                width: 52, height: 30, borderRadius: 15,
                backgroundColor: freeTrial ? colors.protein : colors.border,
                justifyContent: 'center',
                paddingHorizontal: 2,
              }}
            >
              <View style={{
                width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff',
                marginLeft: freeTrial ? 22 : 2,
              }} />
            </Pressable>
          </View>

          <View style={{ marginTop: 28 }}>
            <PillButton
              title={freeTrial ? 'Start Free Trial' : 'Subscribe Now'}
              onPress={handlePurchase}
              loading={loading}
              fullWidth
            />
          </View>

          <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 16 }}>
            No Commitment — Cancel Anytime
          </Text>

          <Pressable
            onPress={() => { hapticMedium(); }}
            accessibilityLabel="Restore purchases"
            testID="restore-purchases"
            style={{ marginTop: 20, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>Restore Purchases</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
