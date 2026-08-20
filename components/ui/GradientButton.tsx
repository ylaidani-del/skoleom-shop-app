import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, type PressableProps } from 'react-native';

import { LinearGradient } from '@/components/ui/LinearGradient';

interface GradientButtonProps extends Omit<PressableProps, 'className'> {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  className?: string;
}

export function GradientButton({
  label,
  icon,
  disabled,
  className = '',
  ...pressableProps
}: GradientButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      {...pressableProps}
      className={`flex-row items-center justify-center gap-1.5 overflow-hidden rounded-xl active:opacity-90 ${
        disabled ? 'opacity-40' : ''
      } ${className}`}>
      <LinearGradient
        colors={['#4bdd2c', '#dbea18']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />
      {icon && <Ionicons name={icon} size={16} color="#1a1a1a" />}
      <Text className="py-3.5 text-[14px] font-semibold text-brand-black">{label}</Text>
    </Pressable>
  );
}
