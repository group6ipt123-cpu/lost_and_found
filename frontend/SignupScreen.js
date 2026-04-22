import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student'); // 👈 ROLE ADDED

  const handleSignup = async () => {
    if (!email || !password) {
      alert('Fill all fields');
      return;
    }

    await AsyncStorage.setItem(
      'user',
      JSON.stringify({ email, password, role }) // 👈 SAVE ROLE
    );

    alert(`Account Created as ${role.toUpperCase()}!`);
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      {/* ROLE SWITCH */}
      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={[styles.roleBtn, role === 'student' && styles.activeRole]}
          onPress={() => setRole('student')}
        >
          <Text style={styles.roleText}>Student</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleBtn, role === 'admin' && styles.activeRole]}
          onPress={() => setRole('admin')}
        >
          <Text style={styles.roleText}>Admin</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleSignup}>
        <Text style={styles.buttonText}>Sign Up as {role}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },

  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },

  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },

  roleBtn: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginHorizontal: 5,
    borderRadius: 8,
    width: 100,
    alignItems: 'center',
  },

  activeRole: {
    backgroundColor: '#007AFF',
  },

  roleText: {
    fontWeight: 'bold',
    color: 'black',
  },

  input: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
  },

  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
  },

  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },

  link: {
    marginTop: 10,
    textAlign: 'center',
    color: '#007AFF',
  },
});