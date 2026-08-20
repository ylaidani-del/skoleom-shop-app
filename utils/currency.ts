export const formatPrice = (value: number, locale: string = 'fr-FR'): string =>
  new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(value);
