import { useEffect, useState } from 'react';
import { View, Text, Button, FlatList } from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

export default function AdminPanel() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/admin-check`)
      .then(res => setRequests(res.data.data || []));
  }, []);

  const approve = (email, courseId) => {
    axios.post(`${API_BASE_URL}/api/admin-approve`, { email, courseId })
      .then(() => alert('Approved'));
  };

  return (
    <View>
      <Text>Pending Approvals</Text>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View>
            <Text>{item.name} - {item.courseName}</Text>
            <Button title="Approve" onPress={() => approve(item.email, item.courseId)} />
          </View>
        )}
      />
    </View>
  );
}