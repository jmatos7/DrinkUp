import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

interface ProgressBarProps {
    goal?: string;
    initialProgress?: number; // 0 a 1
    increment?: number;
    onDrink?: (amount: number) => void; // quanto aumenta a cada clique
}

export default function InteractiveProgressBar({
    goal = '',
    initialProgress = 0,
    increment = 0.1,
    onDrink, // <- adiciona isto
}: ProgressBarProps) {
    const [progress, setProgress] = useState(initialProgress);
    const widthAnim = useRef(new Animated.Value(initialProgress)).current;

    // Carregar progresso do AsyncStorage e reset diário
    useEffect(() => {
        const loadProgress = async () => {
            try {
                const savedProgress = await AsyncStorage.getItem('@daily_progress');
                const savedDate = await AsyncStorage.getItem('@progress_date');
                const today = new Date().toDateString();

                if (savedProgress && savedDate === today) {
                    setProgress(parseFloat(savedProgress));
                } else {
                    setProgress(0);
                    await AsyncStorage.setItem('@daily_progress', '0');
                    await AsyncStorage.setItem('@progress_date', today);
                }
            } catch (e) {
                console.log('Erro a carregar progresso:', e);
            }
        };
        loadProgress();
    }, []);

    // Atualiza animação quando progress muda
    useEffect(() => {
        Animated.timing(widthAnim, {
            toValue: progress,
            duration: 500,
            useNativeDriver: false,
        }).start();
    }, [progress]);

    const handleDrink = async () => {
        const newProgress = Math.min(progress + increment, 1);
        setProgress(newProgress);

        const today = new Date().toDateString();
        try {
            await AsyncStorage.setItem('@daily_progress', newProgress.toString());
            await AsyncStorage.setItem('@progress_date', today);

            // calcular litros reais bebidos
            const dailyGoalLiters = 2; // ou passar como prop
            const drankLiters = increment * dailyGoalLiters;

            onDrink?.(drankLiters); // passa o valor real em litros
        } catch (e) {
            console.log('Erro a guardar progresso:', e);
        }
    };


    return (
        <View style={styles.wrapper}>
            <Text style={styles.goalText}>{goal}</Text>
            <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
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
                        colors={['#1976D2', '#42A5F5']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ flex: 1 }}
                    />
                </Animated.View>

                {progress < 1 && (
                    <TouchableOpacity
                        style={styles.buttonOverlay}
                        activeOpacity={0.7}
                        onPress={handleDrink}
                    >
                        <Text style={styles.buttonText}>Beber 200ml</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
        marginVertical: 20,
    },
    goalText: {
        fontSize: 18,
        color: '#0D47A1',
        fontWeight: 'bold',
        marginBottom: 4,
        textAlign: 'center',
    },
    progressPercent: {
        fontSize: 16,
        color: '#1976D2',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    container: {
        width: '100%',
        height: 50,
        backgroundColor: '#BBDEFB',
        borderRadius: 25,
        overflow: 'hidden',
        justifyContent: 'center',
    },
    buttonOverlay: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#0D47A1',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
