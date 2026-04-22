import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';

export default function ReportsScreen({ navigation }) {
  const [search, setSearch] = useState('');

  // SAMPLE DATA (example reports/posts)
  const [reports] = useState([
    {
      id: '1',
      title: 'Lost iPhone 11',
      location: 'Library 3rd Floor',
      status: 'Pending',
    },
    {
      id: '2',
      title: 'Found Wallet',
      location: 'Cafeteria',
      status: 'Claimed',
    },
    {
      id: '3',
      title: 'Lost ID Card',
      location: 'Gym',
      status: 'Unclaimed',
    },
  ]);

  // FILTER SEARCH
  const filteredReports = reports.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  const openReport = (item) => {
    Alert.alert(
      'Report Details',
      `${item.title}\nLocation: ${item.location}\nStatus: ${item.status}`
    );
  };

  return (
    <View style={styles.container}>

      {/* TITLE */}
      <Text style={styles.title}>Reports</Text>

      {/* SEARCH BAR (CLICKABLE) */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search reports..."
        value={search}
        onChangeText={setSearch}
      />

      {/* ADD POST BUTTON */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => Alert.alert('Add Post', 'Go to Add Post Screen')}
      >
        <Text style={styles.addButtonText}>+ Add Post</Text>
      </TouchableOpacity>

      {/* REPORT LIST */}
      <FlatList
        data={filteredReports}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => openReport(item)}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardText}>
              Location: {item.location}
            </Text>
            <Text style={styles.status}>
              Status: {item.status}
            </Text>
          </TouchableOpacity>
        )}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },

  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  searchBar: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },

  addButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },

  addButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },

  card: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 10,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  cardText: {
    fontSize: 14,
    marginTop: 5,
  },

  status: {
    marginTop: 5,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});