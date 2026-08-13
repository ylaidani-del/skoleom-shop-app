import { View, Text } from 'react-native'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/Button'
import { useAuth } from '@/core/auth/AuthProvider'

export default function CompteTab() {
  const { t } = useTranslation()
  const { signOut } = useAuth()

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-white">
      <Text>compte</Text>
      <Button title={t('auth.logout')} onPress={signOut} />
    </View>
  )
}
