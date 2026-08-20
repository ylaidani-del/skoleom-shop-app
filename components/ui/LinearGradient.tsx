import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { cssInterop } from 'nativewind';

export const LinearGradient = cssInterop(ExpoLinearGradient, { className: 'style' });
