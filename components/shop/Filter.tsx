import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { useCategories } from '@/api/product';
import { PALETTES } from '@/constants/theme';
import { useFilterStore, type SortOption } from '@/store/filterStore';
import { useThemeStore } from '@/store/themeStore';

const SORT_SEQUENCE: SortOption[] = ['reco', 'price-asc', 'price-desc', 'newest'];

const SEARCH_DEBOUNCE_MS = 350;

export function Filter() {
  const { t } = useTranslation();
  const palette = PALETTES[useThemeStore((state) => state.mode)];

  const search = useFilterStore((state) => state.search);
  const setSearch = useFilterStore((state) => state.setSearch);
  const selectedCategory = useFilterStore((state) => state.getCategory());
  const setCategory = useFilterStore((state) => state.setCategory);
  const onSaleOnly = useFilterStore((state) => state.onSaleOnly);
  const toggleOnSale = useFilterStore((state) => state.toggleOnSale);
  const sort = useFilterStore((state) => state.sort);
  const setSort = useFilterStore((state) => state.setSort);

  const { data: categories } = useCategories();

  const [searchInput, setSearchInput] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    []
  );

  const onChangeSearch = (value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(value), SEARCH_DEBOUNCE_MS);
  };

  const cycleSort = () => {
    const nextIndex = (SORT_SEQUENCE.indexOf(sort) + 1) % SORT_SEQUENCE.length;
    setSort(SORT_SEQUENCE[nextIndex]);
  };

  const sortLabels: Record<SortOption, string> = {
    reco: t('catalogue.sort.reco'),
    'price-asc': t('catalogue.sort.priceAsc'),
    'price-desc': t('catalogue.sort.priceDesc'),
    newest: t('catalogue.sort.newest'),
  };

  const chips = [{ slug: 'all', name: t('catalogue.categoryAll') }, ...(categories ?? [])];

  return (
    <View className="gap-3 px-4 pt-3">
      <View className="h-11 flex-row items-center gap-2 rounded-xl border border-app-border-2 bg-app-surface px-3.5">
        <Ionicons name="search" size={17} color={palette.fg3} />
        <TextInput
          value={searchInput}
          onChangeText={onChangeSearch}
          placeholder={t('catalogue.searchPlaceholder')}
          placeholderTextColor={palette.fg3}
          className="flex-1 text-[13px] text-app-fg"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 pr-4">
        {chips.map((chip) => {
          const active = selectedCategory === chip.slug;
          return (
            <Pressable
              key={chip.slug}
              onPress={() => setCategory(chip.slug === 'all' ? '' : chip.slug)}
              className={`h-[34px] justify-center rounded-full border px-3.5 ${
                active ? 'border-transparent bg-app-inv' : 'border-app-border-2 bg-app-surface'
              }`}>
              <Text
                className={`text-[12.5px] font-medium ${active ? 'text-app-inv-fg' : 'text-app-fg-2'}`}>
                {chip.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View className="flex-row items-center justify-between gap-2.5">
        <Pressable
          onPress={toggleOnSale}
          className={`h-8 flex-row items-center gap-1.5 rounded-full border px-3 ${
            onSaleOnly ? 'border-transparent bg-app-inv' : 'border-app-border-2 bg-app-surface'
          }`}>
          <Ionicons name="pricetag" size={13} color={onSaleOnly ? palette.invFg : palette.fg2} />
          <Text
            className={`text-[12px] font-medium ${onSaleOnly ? 'text-app-inv-fg' : 'text-app-fg-2'}`}>
            {t('catalogue.onSale')}
          </Text>
        </Pressable>

        <Pressable
          onPress={cycleSort}
          className="h-8 flex-row items-center gap-1.5 rounded-full border border-app-border-2 bg-app-surface px-3">
          <Ionicons name="swap-vertical" size={13} color={palette.fg2} />
          <Text className="text-[12px] font-medium text-app-fg-2">{sortLabels[sort]}</Text>
        </Pressable>
      </View>
    </View>
  );
}
