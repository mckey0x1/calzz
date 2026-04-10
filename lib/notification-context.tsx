import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import * as Notifications from "expo-notifications";
import { registerForPushNotificationsAsync, scheduleLocalNotification, sendPushNotification } from "./notifications";
import { useAuth } from "./auth-context";

interface NotificationContextValue {
  expoPushToken: string;
  scheduleNotification: (title: string, body: string, data?: any, delaySeconds?: number) => Promise<void>;
  sendPush: (title: string, body: string, data?: any) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue>({
  expoPushToken: "",
  scheduleNotification: async () => {},
  sendPush: async () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { syncUserPushToken, user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState("");
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function initNotifications() {
      if (expoPushToken) return; // Already have a token

      const token = await registerForPushNotificationsAsync();
      if (token && isMounted) {
        setExpoPushToken(token);
        if (user?.uid) {
          syncUserPushToken(token);
        }
      }
    }

    initNotifications();

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log("Notification received:", notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("Notification tapped:", response);
    });

    return () => {
      isMounted = false;
      if (notificationListener.current) notificationListener.current.remove();
      if (responseListener.current) responseListener.current.remove();
    };
  }, [user?.uid, syncUserPushToken]); // Re-run when user signs in so we can sync the token to their specific profile

  const scheduleNotification = async (title: string, body: string, data: any = {}, delaySeconds: number = 2) => {
    await scheduleLocalNotification(title, body, data, delaySeconds);
  };

  const sendPush = async (title: string, body: string, data: any = {}) => {
    if (expoPushToken) {
      await sendPushNotification(expoPushToken, title, body, data);
    } else {
      console.warn("Cannot send push notification: Expo push token is missing.");
    }
  };

  return (
    <NotificationContext.Provider value={{ expoPushToken, scheduleNotification, sendPush }}>
      {children}
    </NotificationContext.Provider>
  );
}
