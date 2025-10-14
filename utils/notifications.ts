import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Pedir permissão para receber notificações
export async function requestPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

// Agendar notificação diária
export async function scheduleNotification(hour: number, minute: number, message: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "DrinkUp Lembrete 💧",
      body: message,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: {
      type: 'calendar',
      hour,
      minute,
      repeats: true,
    } as Notifications.CalendarTriggerInput,
  });
}


// Cancelar todas notificações
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
