import React, { useState, useRef } from 'react';
import { View, Pressable, Platform, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Text } from '@/components/ui/text';
import { ArrowLeft, Camera, Image as ImageIcon, CheckCircle, PenLine, RotateCcw, Zap, ZapOff } from 'lucide-react-native';
import { colors } from '@/lib/theme';
import { hapticMedium } from '@/lib/haptics';
import { useAppStore } from '@/lib/store';
import * as FileSystem from 'expo-file-system';

const CHIPS = [
  { icon: Camera, label: 'Take Photo', active: true },
  { icon: ImageIcon, label: 'Library', route: '/capture/library' },
  { icon: PenLine, label: 'Manual Entry', route: '/capture/food-label' },
];

export default function CaptureScreen() {
  const [step] = useState<number>(1);
  const setPendingMeal = useAppStore(s => s.setPendingMeal);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [isFocused, setIsFocused] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // Only mount camera when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      setIsFocused(true);
      return () => {
        setIsFocused(false);
      };
    }, [])
  );

  const handleCapture = async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    hapticMedium();

    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.85, base64: false });
      if (!photo?.uri) {
        console.warn('[capture] no photo URI');
        setIsCapturing(false);
        return;
      }

      // Convert to base64 for vision API
      const imageBase64 = await FileSystem.readAsStringAsync(photo.uri, { encoding: FileSystem.EncodingType.Base64 });

      setPendingMeal({
        name: 'Analyzing...',
        photoUrl: photo.uri,
        imageBase64,
        eatenAt: new Date().toISOString(),
      } as any);

      router.push('/capture/analyzing');
    } catch (e) {
      console.error('[capture] camera error:', e);
      setIsCapturing(false);
    }
  };

  const toggleFacing = () => {
    hapticMedium();
    setFacing(f => f === 'back' ? 'front' : 'back');
  };

  const toggleFlash = () => {
    hapticMedium();
    setFlash(f => f === 'off' ? 'on' : 'off');
  };

  // Permission gate
  if (!permission) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#fff', textAlign: 'center' }}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
        <Camera size={64} color="rgba(255,255,255,0.5)" />
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#fff', marginTop: 20, textAlign: 'center' }}>Camera access needed</Text>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 8, textAlign: 'center' }}>To scan your meals, we need permission to use your camera</Text>
        <Pressable
          onPress={requestPermission}
          accessibilityLabel="Grant camera permission"
          testID="request-camera-permission"
          style={{
            backgroundColor: colors.primary,
            borderRadius: 999,
            paddingHorizontal: 24,
            paddingVertical: 14,
            marginTop: 32,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>Allow Camera</Text>
        </Pressable>
        <Pressable
          onPress={() => router.back()}
          style={{ marginTop: 16, paddingVertical: 12 }}
          accessibilityLabel="Go back"
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.6)' }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Live camera feed */}
      {isFocused && Platform.OS !== 'web' && (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          flash={flash}
        />
      )}

      {/* Web fallback or when not focused */}
      {(!isFocused || Platform.OS === 'web') && (
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
      )}

      {/* Top bar */}
      <View style={{ paddingTop: 56, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          testID="capture-back"
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={20} color="#fff" />
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable
            onPress={toggleFlash}
            accessibilityLabel={`Toggle flash ${flash === 'on' ? 'off' : 'on'}`}
            testID="toggle-flash"
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {flash === 'on' ? <Zap size={20} color="#fff" /> : <ZapOff size={20} color="#fff" />}
          </Pressable>
          <Pressable
            onPress={toggleFacing}
            accessibilityLabel="Flip camera"
            testID="flip-camera"
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <RotateCcw size={20} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* Chips */}
      <View style={{ position: 'absolute', bottom: 140, left: 0, right: 0, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
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
      <View style={{ position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' }}>
        <Pressable
          onPress={handleCapture}
          disabled={isCapturing}
          accessibilityLabel="Capture photo"
          testID="capture-button"
          style={{
            width: 72, height: 72, borderRadius: 36,
            backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
            borderWidth: 4, borderColor: 'rgba(255,255,255,0.4)',
            opacity: isCapturing ? 0.6 : 1,
          }}
        >
          <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: colors.primary }} />
        </Pressable>
      </View>
    </View>
  );
}
