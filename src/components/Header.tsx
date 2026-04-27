import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/lib/theme';

export function Header({ name }: { name?: string }) {
  const hour = new Date().getHours();
  let greeting = 'Good night';
  if (hour >= 5 && hour < 12) greeting = 'Good morning';
  else if (hour >= 12 && hour < 18) greeting = 'Good afternoon';

  const fullGreeting = name ? `${greeting}, ${name}` : greeting;

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={styles.header}>
      <Text style={styles.greeting}>{fullGreeting}</Text>
      <Text style={styles.date}>{dateStr}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.bg,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});