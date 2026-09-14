import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { PALETTES } from '@/constants/theme';
import { type Measurements } from '@/store/measurementsStore';
import { useThemeStore } from '@/store/themeStore';

/** Starting point when neither this device nor the avatar has measurements yet. */
export const DEFAULT_MEASUREMENTS: Measurements = {
  height: 170,
  weight: 70,
  chest: 95,
  waist: 80,
  footLength: 26,
};

const MEASUREMENT_FIELDS: {
  key: keyof Measurements;
  label: string;
  unit: string;
  min: number;
  max: number;
  step?: number;
}[] = [
  { key: 'height', label: 'essayage.heightLabel', unit: 'cm', min: 140, max: 210 },
  { key: 'weight', label: 'essayage.weightLabel', unit: 'kg', min: 35, max: 150 },
  { key: 'chest', label: 'essayage.chestLabel', unit: 'cm', min: 60, max: 140 },
  { key: 'waist', label: 'essayage.waistLabel', unit: 'cm', min: 50, max: 130 },
  { key: 'footLength', label: 'essayage.footLabel', unit: 'cm', min: 20, max: 32, step: 0.5 },
];

/**
 * Clamps a value into a field's range: measurements can arrive from the server
 * or an older build outside the slider bounds, and the native slider would
 * otherwise pin the thumb at an edge while reporting the original value.
 */
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

interface MeasurementSliderProps {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step?: number;
  dark: boolean;
  onValueChange: (value: number) => void;
}

function MeasurementSlider({
  label,
  value,
  unit,
  min,
  max,
  step = 1,
  dark,
  onValueChange,
}: MeasurementSliderProps) {
  const palette = PALETTES[useThemeStore((state) => state.mode)];
  return (
    <View className="gap-1.5">
      <View className="flex-row items-center justify-between">
        <Text className={`text-[12px] font-medium ${dark ? 'text-white/65' : 'text-app-fg-2'}`}>
          {label}
        </Text>
        <Text className={`text-[12.5px] font-semibold ${dark ? 'text-white' : 'text-app-fg'}`}>
          {step < 1 ? value.toFixed(1) : Math.round(value)} {unit}
        </Text>
      </View>
      <Slider
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={clamp(value, min, max)}
        onValueChange={onValueChange}
        minimumTrackTintColor={dark ? '#dbea18' : palette.fg}
        maximumTrackTintColor={dark ? 'rgba(255,255,255,0.2)' : palette.border}
        thumbTintColor={dark ? '#dbea18' : palette.fg}
      />
    </View>
  );
}

interface MeasurementSlidersProps {
  measurements: Measurements;
  onChange: (measurements: Measurements) => void;
  /** `dark` sits on the brand-black onboarding card, `surface` on a light one. */
  tone?: 'dark' | 'surface';
}

export function MeasurementSliders({
  measurements,
  onChange,
  tone = 'surface',
}: MeasurementSlidersProps) {
  const { t } = useTranslation();
  return (
    <View className="gap-3.5">
      {MEASUREMENT_FIELDS.map((field) => (
        <MeasurementSlider
          key={field.key}
          label={t(field.label)}
          unit={field.unit}
          min={field.min}
          max={field.max}
          step={field.step}
          dark={tone === 'dark'}
          value={measurements[field.key]}
          onValueChange={(value) => onChange({ ...measurements, [field.key]: value })}
        />
      ))}
    </View>
  );
}
