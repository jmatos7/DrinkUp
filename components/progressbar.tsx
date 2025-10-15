import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

interface ProgressBarProps {
  goal: number;
  increment?: number; // em litros
  onDrink?: (amount: number) => void;
}

export default function InteractiveProgressBar({ goal, increment = 0.2, onDrink }: ProgressBarProps) {
  const [currentLiters, setCurrentLiters] = useState(0);
  const widthAnim = useRef(new Animated.Value(0)).current;

  // Carregar progresso do AsyncStorage
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const savedProgress = await AsyncStorage.getItem('@daily_progress');
        if (savedProgress) {
          const liters = JSON.parse(savedProgress);
          setCurrentLiters(liters);
        }
      } catch (e) {
        console.log('Erro a carregar progresso:', e);
      }
    };
    loadProgress();
  }, []);

  // Atualizar animação quando currentLiters muda
  useEffect(() => {
    const progress = Math.min(currentLiters / goal, 1);
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentLiters, goal]);

  const handleDrink = async () => {
    const newLiters = Math.min(currentLiters + increment, goal);
    setCurrentLiters(newLiters);

    onDrink?.(increment);

    try {
      await AsyncStorage.setItem('@daily_progress', JSON.stringify(newLiters));
    } catch (e) {
      console.log('Erro a guardar progresso:', e);
    }
  };

  const litersRemaining = Math.max(goal - currentLiters, 0).toFixed(1);
  const progressColor = currentLiters >= goal ? ['#4CAF50', '#81C784'] : ['#1976D2', '#42A5F5'];

  return (
    <View style={styles.wrapper}>
      <Text style={styles.goalText}>Meta diária: {goal}L</Text>
      <Text style={styles.remainingText}>
        {currentLiters >= goal ? 'Meta alcançada! 🎉' : `Faltam ${litersRemaining}L para a meta`}
      </Text>
      <Text style={styles.progressPercent}>{((currentLiters / goal) * 100).toFixed(0)}%</Text>
      <View style={styles.container}>
        <Animated.View
          style={{
            width: widthAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
            height: '100%',
            borderRadius: 20,
            overflow: 'hidden',
          }}
        >
          <LinearGradient
            colors={progressColor}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        </Animated.View>

        {currentLiters < goal && (
          <TouchableOpacity
            style={styles.buttonOverlay}
            activeOpacity={0.7}
            onPress={handleDrink}
          >
            <Text style={styles.buttonText}>Beber {increment}L</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%', marginVertical: 20 },
  goalText: { fontSize: 18, color: '#0D47A1', fontWeight: 'bold', marginBottom: 4, textAlign: 'center' },
  remainingText: { fontSize: 14, color: '#1976D2', fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  progressPercent: { fontSize: 16, color: '#1976D2', fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  container: { width: '100%', height: 50, backgroundColor: '#BBDEFB', borderRadius: 25, overflow: 'hidden', justifyContent: 'center' },
  buttonOverlay: { position: 'absolute', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#0D47A1', fontWeight: 'bold', fontSize: 16 },
});
