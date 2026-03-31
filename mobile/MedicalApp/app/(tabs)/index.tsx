import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.textStyle}>Real là bố mấy thằng nhóc Mu thế này thì chết liền đó!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textStyle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32', // Màu xanh lá cho tươi tắn
  }
});