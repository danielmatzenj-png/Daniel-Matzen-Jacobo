import 'package:flutter/material.dart';

import '../models/shop_item.dart';
import '../services/app_state.dart';
import '../widgets/coin_badge.dart';

class ShopScreen extends StatefulWidget {
  final AppState state;
  const ShopScreen({super.key, required this.state});

  @override
  State<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends State<ShopScreen> {
  @override
  void initState() {
    super.initState();
    widget.state.addListener(_onChange);
  }

  @override
  void dispose() {
    widget.state.removeListener(_onChange);
    super.dispose();
  }

  void _onChange() => setState(() {});

  @override
  Widget build(BuildContext context) {
    final profile = widget.state.profile!;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Shop'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Center(child: CoinBadge(coins: profile.coins)),
          ),
        ],
      ),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: kShopCatalog.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (ctx, i) {
          final item = kShopCatalog[i];
          final owned = profile.purchasedItems.contains(item.id) &&
              item.type != ShopItemType.slot;
          return _ShopItemCard(
            item: item,
            owned: owned,
            canAfford: profile.coins >= item.price,
            active: _isActive(item),
            onBuy: () => _buy(item),
            onEquip: () => _equip(item),
          );
        },
      ),
    );
  }

  bool _isActive(ShopItem item) {
    final p = widget.state.profile!;
    if (item.type == ShopItemType.background) {
      return p.activeBackground == item.payload;
    }
    if (item.type == ShopItemType.avatar) {
      return p.activeAvatar == item.payload;
    }
    return false;
  }

  Future<void> _buy(ShopItem item) async {
    final error = await widget.state.buyItem(item);
    if (!mounted) return;
    final msg = error ?? 'Gekauft: ${item.name}';
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg)),
    );
  }

  Future<void> _equip(ShopItem item) async {
    if (item.type == ShopItemType.background) {
      await widget.state.equipBackground(item.payload);
    } else if (item.type == ShopItemType.avatar) {
      await widget.state.equipAvatar(item.payload);
    }
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Aktiv: ${item.name}')),
    );
  }
}

class _ShopItemCard extends StatelessWidget {
  final ShopItem item;
  final bool owned;
  final bool canAfford;
  final bool active;
  final VoidCallback onBuy;
  final VoidCallback onEquip;

  const _ShopItemCard({
    required this.item,
    required this.owned,
    required this.canAfford,
    required this.active,
    required this.onBuy,
    required this.onEquip,
  });

  @override
  Widget build(BuildContext context) {
    final leading = _leadingWidget();
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            leading,
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(item.name,
                      style: const TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 2),
                  Text(item.description,
                      style: Theme.of(context).textTheme.bodySmall),
                  const SizedBox(height: 6),
                  Text('${item.price} 🪙',
                      style: const TextStyle(fontWeight: FontWeight.bold)),
                ],
              ),
            ),
            const SizedBox(width: 8),
            _buildAction(),
          ],
        ),
      ),
    );
  }

  Widget _leadingWidget() {
    switch (item.type) {
      case ShopItemType.background:
        return Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            color: Color(int.parse(item.payload)),
            borderRadius: BorderRadius.circular(10),
          ),
        );
      case ShopItemType.avatar:
        return CircleAvatar(
          radius: 28,
          backgroundColor: Colors.indigo.shade50,
          child: Text(item.payload, style: const TextStyle(fontSize: 26)),
        );
      case ShopItemType.slot:
        return const CircleAvatar(
          radius: 28,
          backgroundColor: Color(0xFFE0F7FA),
          child: Icon(Icons.add, color: Colors.teal),
        );
    }
  }

  Widget _buildAction() {
    if (active) {
      return const Chip(
        label: Text('Aktiv'),
        backgroundColor: Color(0xFFC8E6C9),
      );
    }
    if (owned) {
      return FilledButton.tonal(
        onPressed: onEquip,
        child: const Text('Anlegen'),
      );
    }
    return FilledButton(
      onPressed: canAfford ? onBuy : null,
      child: const Text('Kaufen'),
    );
  }
}
