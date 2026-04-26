import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { colors } from '@/lib/theme';
import { hapticLight } from '@/lib/haptics';
import { localDateKey } from '@/lib/date';

interface DayStripProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  today: string; // YYYY-MM-DD in local time, driven by home's rollover logic
}

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function DayStrip({ selectedDate, onSelectDate, today }: DayStripProps) {
  const days = React.useMemo(() => {
    // Parse `today` as a local-midnight Date so the strip is anchored to
    // the user's wall-clock day, not UTC.
    const [y, m, d] = today.split('-').map(Number);
    const todayDate = new Date(y, m - 1, d);
    const result: { date: string; dayLetter: string; dayNum: number; isToday: boolean; isFuture: boolean }[] = [];
    for (let i = -3; i <= 3; i++) {
      const dd = new Date(todayDate);
      dd.setDate(todayDate.getDate() + i);
      const dateStr = localDateKey(dd);
      result.push({
        date: dateStr,
        dayLetter: DAYS[dd.getDay()],
        dayNum: dd.getDate(),
        isToday: i === 0,
        isFuture: i > 0,
      });
    }
    return result;
  }, [today]);

  return (
    <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 12 }}>
      {days.map((day) => {
        const isSelected = day.date === selectedDate;
        return (
          <Pressable
            key={day.date}
            onPress={() => { hapticLight(); onSelectDate(day.date); }}
            accessibilityLabel={`Select ${day.dayLetter} ${day.dayNum}`}
            testID={`day-${day.date}`}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: 10,
              paddingHorizontal: 4,
              borderRadius: 16,
              backgroundColor: isSelected ? colors.primary : 'transparent',
              opacity: day.isFuture ? 0.4 : 1,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '600', color: isSelected ? '#fff' : colors.textSecondary }}>
              {day.dayLetter}
            </Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: isSelected ? '#fff' : colors.textPrimary, marginTop: 4 }}>
              {day.dayNum}
            </Text>
            {day.isToday && !isSelected && (
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary, marginTop: 4 }} />
            )}
            {day.isToday && isSelected && (
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff', marginTop: 4 }} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
