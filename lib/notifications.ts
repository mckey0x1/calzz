import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Set handler to dictate how incoming notifications should be handled when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Requests permissions and gets the Expo Push Token for this device.
 * @returns The Expo Push Token string or undefined if failed.
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.warn('Notification permission NOT granted!');
    return;
  }

  if (Device.isDevice) {

    try {
      // Must provide projectId if you are using EAS
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      
      if (!projectId) {
         console.warn('Project ID not found. Ensure it is defined in app config.');
      }
      
      token = (await Notifications.getExpoPushTokenAsync({
        projectId,
      })).data;
      
      console.log('Expo Push Token retrieved:', token);
    } catch (e) {
      // console.error('Error fetching Expo Push token:', e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

/**
 * Schedules a local push notification.
 * @param title Title of the notification
 * @param body Body text of the notification
 * @param data Optional data payload
 * @param delaySeconds How many seconds to wait before showing the notification
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data: Record<string, any> = {},
  delaySeconds: number = 2
) {
  const trigger = {
    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
    seconds: Math.max(1, Math.floor(delaySeconds)),
  };

  await Notifications.scheduleNotificationAsync({
    content: ({
      title,
      body,
      data,
      sound: true,
      android: {
        channelId: 'default',
      },
    } as any),
    trigger: trigger as any,
  });
}

export async function sendPushNotification(expoPushToken: string, title: string, body: string, data: any = {}) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data,
  };

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error('Error sending push notification to Expo backend:', error);
  }
}
