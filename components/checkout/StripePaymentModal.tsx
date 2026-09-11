import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';

import { PALETTES } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';

interface StripePaymentModalProps {
  visible: boolean;
  url: string;
  successUrlPrefix: string;
  onSuccess: () => void;
  onClose: () => void;
}

// The Stripe checkout page (`/api/payment/popup`) is a full HTML page built to
// be opened as a browser popup, not embedded — but loading it in a WebView
// keeps the whole payment step inside the app instead of handing the user
// off to an external browser tab with no way back. On success it navigates
// to `/api/payment/success`; we intercept that navigation instead of letting
// it load, since we show our own native success screen.
export function StripePaymentModal({
  visible,
  url,
  successUrlPrefix,
  onSuccess,
  onClose,
}: StripePaymentModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const palette = PALETTES[useThemeStore((state) => state.mode)];
  // Derived from comparing `url` to the last-loaded URL rather than reset via
  // an effect: React Native's <Modal> keeps its children mounted even while
  // hidden, so a fresh checkout URL must show the spinner again, and this
  // comparison naturally does that without needing to sync state on a prop change.
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const loading = !!url && url !== loadedUrl;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View className="flex-1 bg-app-bg" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center justify-between px-4 pb-2 pt-2">
          <Text className="text-[15px] font-semibold text-app-fg">
            {t('checkout.paymentTitle')}
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            className="h-9 w-9 items-center justify-center rounded-full bg-app-fill">
            <Ionicons name="close" size={18} color={palette.fg} />
          </Pressable>
        </View>

        <View className="flex-1">
          {!!url && (
            <WebView
              source={{ uri: url }}
              onLoadEnd={() => setLoadedUrl(url)}
              onShouldStartLoadWithRequest={(request: ShouldStartLoadRequest) => {
                if (request.url.startsWith(successUrlPrefix)) {
                  onSuccess();
                  return false;
                }
                return true;
              }}
              startInLoadingState={false}
            />
          )}
          {loading && (
            <View className="absolute inset-0 items-center justify-center bg-app-bg">
              <ActivityIndicator color={palette.fg} />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
