import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Set up handling behavior when the app is running in the foreground (only on mobile)
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// Zomato/Swiggy-style creative daily reminder notification templates
const REMINDER_COPY = [
  {
    title: "Where did the money go today? 💸",
    body: "Don't let your cash do a vanishing act. Take 10 seconds to log today's expenses!"
  },
  {
    title: "Psst... forgot something? 🤫",
    body: "Your wallet is waiting! Log your transactions now to keep your daily spend limit accurate."
  },
  {
    title: "Wallet: 'I'm feeling ignored...' 🥲",
    body: "Be a good friend. Feed me today's expenses so I can calculate your safe-to-spend limit."
  },
  {
    title: "Keep the budget streak alive! 🔥",
    body: "You're doing amazing. Log today's spends to update your streak!"
  },
  {
    title: "Did you buy another coffee today? ☕",
    body: "Or a tasty treat? Log it in SpenWyse and stay in control of your budget!"
  }
];

export async function requestNotificationPermissions() {
  if (Platform.OS === 'web') return false;
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (error) {
    console.log('Error requesting notification permissions:', error);
    return false;
  }
}

export async function scheduleDailyReminder(hour = 20, minute = 0) {
  if (Platform.OS === 'web') return;
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('Notification permission not granted, skipping reminder scheduling');
      return;
    }

    // Cancel existing scheduled notifications to prevent duplicate stacking
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Pick a random Swiggy/Zomato style reminder
    const randomIndex = Math.floor(Math.random() * REMINDER_COPY.length);
    const content = REMINDER_COPY[randomIndex];

    await Notifications.scheduleNotificationAsync({
      content: {
        title: content.title,
        body: content.body,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
    console.log(`Daily reminder scheduled successfully for ${hour}:${minute.toString().padStart(2, '0')}`);
  } catch (error) {
    console.log('Error scheduling daily reminder:', error);
  }
}

export async function triggerDailyLimitExceeded(spentToday: number, dailyLimit: number) {
  if (Platform.OS === 'web') return;
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    const diff = Math.floor(spentToday - dailyLimit);
    const messages = [
      {
        title: "Control, Uday, control! 😱",
        body: `You crossed today's safe limit by ₹${diff.toLocaleString()}. Let's take it easy on the wallet now!`
      },
      {
        title: "Wallet: 'I'm tired, boss...' 🥲",
        body: `You just blew past today's spend limit by ₹${diff.toLocaleString()}. Time for a budget detox?`
      },
      {
        title: "Budget has left the chat 💀",
        body: `You are ₹${diff.toLocaleString()} over your daily safe-to-spend limit. Time to lock that card!`
      }
    ];

    const randomMsg = messages[Math.floor(Math.random() * messages.length)];

    await Notifications.scheduleNotificationAsync({
      content: {
        title: randomMsg.title,
        body: randomMsg.body,
        sound: true,
      },
      trigger: null, // trigger immediately
    });
  } catch (error) {
    console.log('Error triggering daily limit exceeded notification:', error);
  }
}

export async function triggerBudgetWarning(spentThisMonth: number, monthlyIncome: number) {
  if (Platform.OS === 'web') return;
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    const percent = Math.round((spentThisMonth / monthlyIncome) * 100);
    const messages = [
      {
        title: "Danger Zone ahead! 🚨",
        body: `You've used ${percent}% of your monthly income (₹${spentThisMonth.toLocaleString()} spent). Time to cook at home?`
      },
      {
        title: "Account balance: 'Send help!' 🆘",
        body: `You are at ${percent}% of your monthly budget. Proceed with extreme caution!`
      }
    ];

    const randomMsg = messages[Math.floor(Math.random() * messages.length)];

    await Notifications.scheduleNotificationAsync({
      content: {
        title: randomMsg.title,
        body: randomMsg.body,
        sound: true,
      },
      trigger: null, // trigger immediately
    });
  } catch (error) {
    console.log('Error triggering budget warning notification:', error);
  }
}
