import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import InteractiveProgressBar from '../components/progressbar';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Audio } from 'expo-av';
import { requestPermissions, scheduleNotification, cancelAllNotifications } from '../utils/notifications';

interface DrinkLogItem {
  time: string;
  amount: number;
}



export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userAge, setUserAge] = useState(0);
  const [userGender, setUserGender] = useState('');
  const [userActivity, setUserActivity] = useState('');
  const [dailyGoal, setDailyGoal] = useState(1.5);
  const [dailyLog, setDailyLog] = useState<DrinkLogItem[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  const playCelebrationSound = async () => {
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/celebrations.mp3') // substitui pelo teu ficheiro de som
    );
    await sound.playAsync();
  };


  // Carregar dados do utilizador e log diário
  useEffect(() => {
    const loadData = async () => {
      try {
        const [name, age, gender, activity, savedLog] = await Promise.all([
          AsyncStorage.getItem('@user_name'),
          AsyncStorage.getItem('@user_age'),
          AsyncStorage.getItem('@user_gender'),
          AsyncStorage.getItem('@user_sport'),
          AsyncStorage.getItem('@daily_log')
        ]);

        if (name) setUserName(name);
        if (age) setUserAge(parseInt(age, 10));
        if (gender) setUserGender(gender);
        if (activity) setUserActivity(activity);

        // Calcular meta diária
        const calculateGoal = (gender: string, age: number, activity: string) => {
          let base = gender === 'Feminino' ? 1.6 : 2.0;

          if (age >= 18 && age <= 25) base += 0.5;
          else if (age > 25 && age <= 40) base += 0.3;
          else if (age > 40) base += 0.2;

          if (activity === 'Sim') base += 0.5;

          return parseFloat(base.toFixed(1));
        };
        setDailyGoal(calculateGoal(gender || '', parseInt(age || '0', 10), activity || ''));

        // Carregar log diário
        if (savedLog) {
          const parsedLog: DrinkLogItem[] = JSON.parse(savedLog);
          const today = new Date().toDateString();
          const todayLog = parsedLog.filter(item => new Date().toDateString() === today);
          setDailyLog(todayLog);
        }

      } catch (e) {
        console.log('Erro a carregar dados do utilizador:', e);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Configurar notificações
    (async () => {
      const granted = await requestPermissions();
      if (!granted) return;

      await cancelAllNotifications();
      const notificationTimes = [
        9, 11, 13, 15, 17, 19, 21
      ];
      notificationTimes.forEach(hour => scheduleNotification(hour, 0, 'Está na hora de beber água! 💧'));
    })();
  }, []);

  const handleDrink = async (amount: number) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newLog = [...dailyLog, { time: timeStr, amount }];
    setDailyLog(newLog);

    // Guardar log completo em JSON
    try {
      await AsyncStorage.setItem('@daily_log', JSON.stringify(newLog));
    } catch (e) {
      console.log('Erro a guardar log diário:', e);
    }

    // Confete se atingiu a meta
    const totalLiters = newLog.reduce((sum, item) => sum + item.amount, 0);
    if (totalLiters >= dailyGoal) {
      setShowConfetti(true);
      playCelebrationSound();
      setTimeout(() => setShowConfetti(false), 4000);

    };
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#1976D2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Olá, {userName}!</Text>

      <InteractiveProgressBar
        goal={dailyGoal}
        increment={0.1}
        onDrink={handleDrink}
      />

      <Text style={styles.logTitle}>Histórico diário:</Text>
      {dailyLog.length === 0 ? (
        <Text style={styles.noLog}>Ainda não bebeste água hoje.</Text>
      ) : (
        <FlatList
          data={dailyLog}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <Text style={styles.logItem}>
              {item.time} - {item.amount.toFixed(2)}L
            </Text>
          )}
        />
      )}
      {showConfetti && <ConfettiCannon count={300} origin={{ x: -10, y: 0 }} fadeOut />}

    </View>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E6F0FA' },
  container: { flex: 1, padding: 20, backgroundColor: '#E6F0FA' },
  welcomeText: { fontSize: 24, fontWeight: 'bold', color: '#0D47A1', marginBottom: 20, marginTop: 40 },
  logTitle: { fontSize: 18, fontWeight: 'bold', color: '#0D47A1', marginTop: 20, marginBottom: 8 },
  noLog: { fontSize: 16, color: '#1976D2' },
  logItem: { fontSize: 16, color: '#0D47A1', marginVertical: 2 },
});
