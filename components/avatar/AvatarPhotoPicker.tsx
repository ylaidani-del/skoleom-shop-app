import { Ionicons } from '@expo/vector-icons';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, Text, View } from 'react-native';

import { PALETTES } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';
import { pickAvatarPhoto, type AvatarPhoto, type AvatarPhotoSource } from '@/utils/avatarPhoto';

interface AvatarPhotoPickerProps {
  /** Photo picked in this session, not saved server-side yet. */
  photo: AvatarPhoto | null;
  /** Avatar already generated server-side, shown while no new photo is picked. */
  currentUrl?: string | null;
  onPick: (photo: AvatarPhoto) => void;
  /** `dark` sits on the brand-black onboarding card, `surface` on a light one. */
  tone?: 'dark' | 'surface';
  /** `column` stacks a large preview above the buttons, `row` puts it beside them. */
  layout?: 'row' | 'column';
  previewClassName?: string;
  /** Extra actions rendered under the source buttons (e.g. "remove avatar"). */
  children?: ReactNode;
}

export function AvatarPhotoPicker({
  photo,
  currentUrl,
  onPick,
  tone = 'surface',
  layout = 'row',
  previewClassName = 'h-16 w-16 rounded-xl',
  children,
}: AvatarPhotoPickerProps) {
  const { t } = useTranslation();
  const palette = PALETTES[useThemeStore((state) => state.mode)];

  const dark = tone === 'dark';
  const previewUri = photo?.uri ?? currentUrl ?? null;

  const pick = (source: AvatarPhotoSource) => async () => {
    const picked = await pickAvatarPhoto(source);
    if (picked) onPick(picked);
  };

  const buttonClassName = `flex-1 flex-row items-center justify-center gap-1.5 rounded-full border px-3 py-2 active:opacity-80 ${
    dark ? 'border-white/25 bg-white/10' : 'border-app-border bg-app-surface-2'
  }`;
  const labelClassName = `text-[12px] font-medium ${dark ? 'text-white' : 'text-app-fg'}`;
  const iconColor = dark ? '#dbea18' : palette.fg2;

  return (
    <View className={layout === 'row' ? 'flex-row items-center gap-3' : 'gap-3'}>
      <Pressable
        onPress={pick('library')}
        accessibilityRole="button"
        accessibilityLabel={t('avatar.chooseFromGallery')}
        className={`items-center justify-center overflow-hidden active:opacity-80 ${
          dark ? 'bg-white/10' : 'bg-app-fill'
        } ${previewClassName}`}>
        {previewUri ? (
          <Image source={{ uri: previewUri }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <Ionicons
            name="person-outline"
            size={layout === 'column' ? 30 : 22}
            color={dark ? '#dbea18' : palette.fg3}
          />
        )}
      </Pressable>

      <View className={layout === 'row' ? 'flex-1 gap-2' : 'gap-2'}>
        <View className="flex-row gap-2">
          <Pressable
            onPress={pick('camera')}
            accessibilityRole="button"
            className={buttonClassName}>
            <Ionicons name="camera-outline" size={14} color={iconColor} />
            <Text className={labelClassName}>{t('avatar.takePhoto')}</Text>
          </Pressable>
          <Pressable
            onPress={pick('library')}
            accessibilityRole="button"
            className={buttonClassName}>
            <Ionicons name="images-outline" size={14} color={iconColor} />
            <Text className={labelClassName}>{t('avatar.chooseFromGallery')}</Text>
          </Pressable>
        </View>
        {children}
      </View>
    </View>
  );
}
