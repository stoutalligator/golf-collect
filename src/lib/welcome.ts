/** First-run welcome: shown once per account on this phone. */
import AsyncStorage from '@react-native-async-storage/async-storage';

const key = (userId: string) => `gk.welcome.${userId}`;

/** Resolves true when storage can't be read, so a broken store never traps someone in the welcome. */
export const welcomeSeen = (userId: string) => AsyncStorage.getItem(key(userId)).then((v) => v === 'done').catch(() => true);
export const markWelcomeSeen = (userId: string) => AsyncStorage.setItem(key(userId), 'done').catch(() => {});
