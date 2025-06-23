import { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/constants';

export default function CourseModules() {
  const { id } = useLocalSearchParams();
  const [modules, setModules] = useState([]);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/course-modules/${id}`)
      .then(res => setModules(res.data))
      .catch(() => setModules([]));
  }, [id]);

  return (
    <View>
      <Text>Modules</Text>
      <FlatList
        data={modules}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View><Text>{item.title}</Text></View>
        )}
      />
    </View>
  );
}