import React, { useState, useRef } from 'react';
import { View, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ArrowLeft, Camera, ScanBarcode, FileText, Image as ImageIcon, CheckCircle } from 'lucide-react-native';
import { colors } from '@/lib/theme';
import { hapticMedium } from '@/lib/haptics';
import { useAppStore } from '@/lib/store';
import * as ImagePicker from 'expo-image-picker';

const CHIPS = [
  { icon: Camera, label: 'Scan food', active: true },
  { icon: ScanBarcode, label: 'Barcode', route: '/capture/barcode' },
  { icon: FileText, label: 'Food label', route: '/capture/food-label' },
  { icon: ImageIcon, label: 'Library', route: '/capture/library' },
];

export default function CaptureScreen() {
  const [step] = useState<number>(1);
  const setPendingMeal = useAppStore(s => s.setPendingMeal);

  const handleCapture = async () => {
    hapticMedium();

    if (Platform.OS === 'web') {
      // On web, use image picker instead of camera
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        // Pass base64 for vision API analysis
        setPendingMeal({
          name: 'Analyzing...',
          photoUrl: result.assets[0].uri,
          imageBase64: result.assets[0].base64 ?? undefined,
          eatenAt: new Date().toISOString(),
        } as any);
        router.push('/capture/analyzing');
      }
      return;
    }

    // On native, use camera
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') return;

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setPendingMeal({
          name: 'Analyzing...',
          photoUrl: result.assets[0].uri,
          imageBase64: result.assets[0].base64 ?? undefined,
          eatenAt: new Date().toISOString(),
        } as any);
        router.push('/capture/analyzing');
      }
    } catch (e) {
      // Fallback: go straight to review with demo data
      setPendingMeal({
        name: 'Scanned Meal',
        totalCalories: 520,
        proteinG: 38,
        carbsG: 45,
        fatG: 18,
        items: [
          { id: '1', name: 'Protein', calories: 280, proteinG: 35, carbsG: 2, fatG: 8, quantity: 200, unit: 'g' },
          { id: '2', name: 'Carbs Side', calories: 160, proteinG: 3, carbsG: 35, fatG: 1, quantity: 150, unit: 'g' },
          { id: '3', name: 'Vegetables', calories: 80, proteinG: 0, carbsG: 8, fatG: 9, quantity: 100, unit: 'g' },
        ],
        eatenAt: new Date().toISOString(),
      });
      router.push('/capture/analyzing');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Top bar */}
      <View style={{ paddingTop: 56, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          testID="capture-back"
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowLeft size={20} color="#fff" />
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
          <CheckCircle size={14} color={colors.protein} />
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff', marginLeft: 6 }}>{step}/3</Text>
        </View>
      </View>

      {/* Camera viewfinder area */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{
          width: 280, height: 280, borderRadius: 24,
          borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)',
          borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
        }}>
          <Camera size={48} color="rgba(255,255,255,0.5)" />
          <Text style={{ fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginTop: 12 }}>Point at your meal</Text>
        </View>
      </View>

      {/* Chips */}
      <View style={{ paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
          {CHIPS.map((chip, i) => (
            <Pressable
              key={i}
              onPress={() => {
                hapticMedium();
                if (chip.route) router.push(chip.route as any);
              }}
              accessibilityLabel={chip.label}
              testID={`chip-${chip.label.toLowerCase().replace(/\s+/g, '-')}`}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                backgroundColor: chip.active ? colors.primary : 'rgba(255,255,255,0.15)',
                borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10,
              }}
            >
              <chip.icon size={16} color="#fff" />
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>{chip.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Capture button */}
      <View style={{ alignItems: 'center', paddingBottom: 40 }}>
        <Pressable
          onPress={handleCapture}
          accessibilityLabel="Capture photo"
          testID="capture-button"
          style={{
            width: 72, height: 72, borderRadius: 36,
            backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
            borderWidth: 4, borderColor: 'rgba(255,255,255,0.4)',
          }}
        >
          <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: colors.primary }} />
        </Pressable>
      </View>
    </View>
  );
}
