const TESTABLE_SLUGS = new Set([
  'maillot',
  'sous-vetements',
  'survetement',
  'robe',
  'jumpsuit',
  'crop-top',
  'blazer',
  'polos-chemises',
  'veste',
  't-shirts',
  'costume',
  'hoodie',
  'jacket',
  'chaussures',
  'sport',
]);

// Comma-separated slug list for the `categories` query param, so the
// wardrobe list can be filtered server-side instead of over-fetching
// non-clothing pages and filtering them out client-side.
export const TESTABLE_SLUGS_PARAM = [...TESTABLE_SLUGS].join(',');

export default TESTABLE_SLUGS;
