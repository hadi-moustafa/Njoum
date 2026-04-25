import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, FontWeight } from '../constants/theme';

export default function NotFound() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🌙</Text>
      <Text style={styles.title}>الصفحة غير موجودة</Text>
      <Pressable onPress={() => router.replace('/(tabs)')} style={styles.button}>
        <Text style={styles.buttonText}>العودة للرئيسية</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, alignItems:'center', justifyContent:'center', backgroundColor: Colors.background, gap: Spacing.md },
  emoji:     { fontSize: 48 },
  title:     { fontSize: FontSize.xl, fontWeight: FontWeight.semibold, color: Colors.text },
  button:    { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, borderRadius: 20 },
  buttonText:{ color: '#fff', fontWeight: FontWeight.semibold, fontSize: FontSize.md },
});
