import { View, Text, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function Home() {
  const router = useRouter();
  return (
    <View>
      <Text>Welcome to Sankalp App</Text>
      <Button title="Login" onPress={() => router.push('/login')} />
      <Button title="Register" onPress={() => router.push('/register')} />
    </View>
  );
}