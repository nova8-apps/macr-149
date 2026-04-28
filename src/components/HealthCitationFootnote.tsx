import React from 'react';
import { View, Text, Pressable, Linking } from 'react-native';

export function HealthCitationFootnote() {
  const openPubMed = () => {
    Linking.openURL('https://pubmed.ncbi.nlm.nih.gov/2305711/');
  };

  const openDietaryGuidelines = () => {
    Linking.openURL('https://www.dietaryguidelines.gov');
  };

  return (
    <View className="border-t border-white/8 pt-3 mt-2">
      <Text className="text-xs text-gray-400 leading-5">
        Targets calculated using the{' '}
        <Pressable
          onPress={openPubMed}
          accessibilityLabel="Open Mifflin-St Jeor equation citation"
          accessibilityRole="link"
        >
          <Text className="text-xs text-orange-400 underline">
            Mifflin-St Jeor equation
          </Text>
        </Pressable>
        .
      </Text>
      <Text className="text-xs text-gray-400 leading-5 mt-1">
        500 kcal/day deficit and 1.6–2.2 g/kg protein targets are based on{' '}
        <Pressable
          onPress={openDietaryGuidelines}
          accessibilityLabel="Open dietary guidelines citation"
          accessibilityRole="link"
        >
          <Text className="text-xs text-orange-400 underline">
            published dietary guidelines
          </Text>
        </Pressable>
        .
      </Text>
    </View>
  );
}

export default HealthCitationFootnote;
