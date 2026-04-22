enum ShopItemType { background, avatar, slot }

class ShopItem {
  final String id;
  final String name;
  final String description;
  final int price;
  final ShopItemType type;

  /// Für Avatare ein Emoji, für Hintergründe ein Farbwert (als hex int),
  /// für Slots bleibt es leer.
  final String payload;

  const ShopItem({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.type,
    this.payload = '',
  });
}

const List<ShopItem> kShopCatalog = [
  ShopItem(
    id: 'bg_sunset',
    name: 'Hintergrund „Sonnenuntergang“',
    description: 'Warmer, orange-roter Farbverlauf.',
    price: 10,
    type: ShopItemType.background,
    payload: '0xFFFF7043',
  ),
  ShopItem(
    id: 'bg_ocean',
    name: 'Hintergrund „Ozean“',
    description: 'Frischer, blauer Farbverlauf.',
    price: 10,
    type: ShopItemType.background,
    payload: '0xFF0288D1',
  ),
  ShopItem(
    id: 'bg_forest',
    name: 'Hintergrund „Wald“',
    description: 'Beruhigendes Grün.',
    price: 15,
    type: ShopItemType.background,
    payload: '0xFF2E7D32',
  ),
  ShopItem(
    id: 'avatar_runner',
    name: 'Avatar „Läufer“',
    description: 'Für sportliche Typen.',
    price: 20,
    type: ShopItemType.avatar,
    payload: '🏃',
  ),
  ShopItem(
    id: 'avatar_cyclist',
    name: 'Avatar „Radfahrer“',
    description: 'Volle Fahrt voraus!',
    price: 20,
    type: ShopItemType.avatar,
    payload: '🚴',
  ),
  ShopItem(
    id: 'avatar_champion',
    name: 'Avatar „Champion“',
    description: 'Nur für echte Sieger.',
    price: 40,
    type: ShopItemType.avatar,
    payload: '🏆',
  ),
  ShopItem(
    id: 'slot_extra',
    name: 'Extra-Challenge-Slot',
    description: 'Eine zusätzliche parallele Challenge.',
    price: 30,
    type: ShopItemType.slot,
  ),
];
