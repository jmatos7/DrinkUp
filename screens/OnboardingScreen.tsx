import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';

export default function OnboardingScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Masculino' | 'Feminino' | ''>('');
  const [sport, setSport] = useState<'Sim' | 'Não' | ''>('');
  const [loading, setLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  // Verifica se já existem dados guardados
  useEffect(() => {
    const checkUserData = async () => {
      try {
        const savedName = await AsyncStorage.getItem('@user_name');
        const savedAge = await AsyncStorage.getItem('@user_age');
        const savedGender = await AsyncStorage.getItem('@user_gender');
        const savedSport = await AsyncStorage.getItem('@user_sport');

        if (savedName && savedAge && savedGender && savedSport) {
          navigation.replace('Home');
          return;
        }

        setLoading(false);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: false,
        }).start();
      } catch (e) {
        console.log('Erro a ler AsyncStorage:', e);
        setLoading(false);
      }
    };
    checkUserData();
  }, [navigation]);

  const handleGenderPress = (g: 'Masculino' | 'Feminino') => {
    setGender(g);
  };

  const handleSportPress = (s: 'Sim' | 'Não') => {
    setSport(s);
  };

  const handleNext = async () => {
    const ageNum = parseInt(age, 10);

    if (!name.trim()) {
      Alert.alert('Erro', 'Por favor, insere o teu nome.');
      return;
    }
    if (!age || isNaN(ageNum) || ageNum < 0) {
      Alert.alert('Erro', 'Por favor, insere uma idade válida.');
      return;
    }
    if (!gender) {
      Alert.alert('Erro', 'Por favor, escolhe o teu sexo.');
      return;
    }
    if (!sport) {
      Alert.alert('Erro', 'Por favor, indica se praticas desporto.');
      return;
    }

    try {
      await AsyncStorage.setItem('@user_name', name);
      await AsyncStorage.setItem('@user_age', ageNum.toString());
      await AsyncStorage.setItem('@user_gender', gender);
      await AsyncStorage.setItem('@user_sport', sport);
    } catch (e) {
      console.log('Erro a guardar dados:', e);
    }

    navigation.replace('Home');
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={{ fontSize: 16, color: '#0D47A1' }}>A carregar...</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.title}>Bem-vindo ao DrinkUp!</Text>

      {/* Nome */}
      <Text style={styles.label}>Nome:</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: João"
        value={name}
        onChangeText={setName}
      />

      {/* Idade */}
      <Text style={styles.label}>Idade:</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="Ex: 25"
        value={age}
        onChangeText={setAge}
      />

      {/* Sexo */}
      <Text style={styles.label}>Sexo:</Text>
      <View style={styles.genderContainer}>
          <TouchableOpacity
            style={[styles.genderButton, gender === 'Masculino' && styles.genderSelected]}
            onPress={() => handleGenderPress('Masculino')}
          >
            <FontAwesome5 name="male" size={24} color={gender === 'Masculino' ? '#fff' : '#0D47A1'} />
            <Text style={[styles.genderText, gender === 'Masculino' && { color: '#fff' }]}>Masculino</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderButton, gender === 'Feminino' && styles.genderSelected]}
            onPress={() => handleGenderPress('Feminino')}
          >
            <FontAwesome5 name="female" size={24} color={gender === 'Feminino' ? '#fff' : '#0D47A1'} />
            <Text style={[styles.genderText, gender === 'Feminino' && { color: '#fff' }]}>Feminino</Text>
          </TouchableOpacity>
      </View>

      {/* Pratica Desporto */}
      <Text style={styles.label}>Praticas desporto?</Text>
      <View style={styles.genderContainer}>
          <TouchableOpacity
            style={[styles.genderButton, sport === 'Sim' && styles.genderSelected]}
            onPress={() => handleSportPress('Sim')}
          >
            <Text style={[styles.genderText, sport === 'Sim' && { color: '#fff' }]}>Sim</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderButton, sport === 'Não' && styles.genderSelected]}
            onPress={() => handleSportPress('Não')}
          >
            <Text style={[styles.genderText, sport === 'Não' && { color: '#fff' }]}>Não</Text>
          </TouchableOpacity>
      </View>

      {/* Continuar */}
      <TouchableOpacity onPress={handleNext} activeOpacity={0.9} style={{ width: '100%' }}>
        <LinearGradient colors={['#1976D2', '#42A5F5']} style={styles.continueButton}>
          <Text style={styles.continueText}>Continuar</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E6F0FA' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#E6F0FA' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 40, color: '#0D47A1' },
  label: { alignSelf: 'flex-start', marginBottom: 8, fontSize: 16, color: '#1A237E' },
  input: {
    borderWidth: 1,
    borderColor: '#90CAF9',
    width: '100%',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  genderContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 30 },
  genderButton: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#BBDEFB',
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  genderSelected: { backgroundColor: '#0D47A1' },
  genderText: { fontWeight: 'bold', fontSize: 16, color: '#0D47A1' },
  continueButton: { width: '100%', padding: 15, borderRadius: 12, alignItems: 'center' },
  continueText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
