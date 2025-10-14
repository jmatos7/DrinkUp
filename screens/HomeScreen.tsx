import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import InteractiveProgressBar from '../components/progressbar';
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
  const [userActivity, setUserActivity] = useState(false);
  const [dailyGoal, setDailyGoal] = useState('Objetivo diário: 2L');
  const [dailyLog, setDailyLog] = useState<DrinkLogItem[]>([]);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const name = await AsyncStorage.getItem('@user_name');
        const age = await AsyncStorage.getItem('@user_age');
        const gender = await AsyncStorage.getItem('@user_gender');
        const activity = await AsyncStorage.getItem('@user_activity');

        if (name) setUserName(name);
        if (age) setUserAge(parseInt(age, 10));
        if (gender) setUserGender(gender);
        if (activity) setUserActivity(activity === 'true');

        // Calcular meta diária
        let baseGoal = 2;
        if (userAge < 18) baseGoal = 1.5; // adolescente/criança
        const extra = activity === 'true' ? 0.5 : 0;
        const totalGoal = baseGoal + extra;
        setDailyGoal(`Objetivo diário: ${totalGoal.toFixed(1)}L`);

        // Carregar log diário
        const savedLog = await AsyncStorage.getItem('@daily_log');
        const today = new Date().toDateString();
        if (savedLog) {
          const parsedLog: DrinkLogItem[] = JSON.parse(savedLog);
          const filteredLog = parsedLog.filter(item => item.time.split(' ')[0] === today);
          setDailyLog(filteredLog);
        }
      } catch (e) {
        console.log('Erro a carregar dados do utilizador:', e);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);


  useEffect(() => {
  (async () => {
    const granted = await requestPermissions();
    if (!granted) return;

    // Cancela notificações antigas antes de criar novas
    await cancelAllNotifications();

    // Exemplo: notificação a cada 2h das 9h às 21h
    const notificationTimes = [
      { hour: 9, minute: 0 },
      { hour: 11, minute: 0 },
      { hour: 13, minute: 0 },
      { hour: 15, minute: 0 },
      { hour: 17, minute: 0 },
      { hour: 19, minute: 0 },
      { hour: 21, minute: 0 },
    ];

    notificationTimes.forEach(time => {
      scheduleNotification(time.hour, time.minute, "Está na hora de beber água! 💧");
    });
  })();
}, []);


  // Callback para registrar cada vez que bebe água
  const handleDrink = async (amount: number) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newLog = [...dailyLog, { time: timeStr, amount }];
    setDailyLog(newLog);
    await AsyncStorage.setItem('@daily_log', JSON.stringify(newLog));
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
              {item.time} - {item.amount}L
            </Text>
          )}
        />
      )}
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
