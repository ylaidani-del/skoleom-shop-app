import { View, Text } from 'react-native'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { useSignOut } from '@/api/user'
import { Button } from '@/components/Button'
import { useUserStore } from '@/store/userStore'

export default function CompteTab() {
  const { t } = useTranslation()
  const user = useUserStore((state) => state.user)
  const { mutate: signOut, isPending } = useSignOut()

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-white">
      <Text>{user?.name ?? 'compte'}</Text>
      <Button title={t('auth.logout')} disabled={isPending} onPress={() => signOut()} />
    </View>
  )
}
