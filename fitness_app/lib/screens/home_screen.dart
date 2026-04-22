import 'package:flutter/material.dart';

import '../services/app_state.dart';
import '../widgets/coin_badge.dart';
import 'challenges_screen.dart';
import 'ranking_screen.dart';
import 'shop_screen.dart';

class HomeScreen extends StatelessWidget {
  final AppState state;
  const HomeScreen({super.key, required this.state});

  Color get _bgColor {
    final hex = state.profile?.activeBackground;
    if (hex == null) return const Color(0xFF3949AB);
    return Color(int.parse(hex));
  }

  @override
  Widget build(BuildContext context) {
    final profile = state.profile!;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Fitness-Challenges'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Center(child: CoinBadge(coins: profile.coins)),
          ),
        ],
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [_bgColor, _bgColor.withOpacity(0.4)],
          ),
        ),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _ProfileCard(state: state),
            const SizedBox(height: 20),
            _MenuTile(
              icon: Icons.fitness_center,
              title: 'Deine Fitness-Challenges',
              subtitle: 'Tägliche & wöchentliche Ziele erledigen',
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => ChallengesScreen(state: state),
                ),
              ),
            ),
            _MenuTile(
              icon: Icons.leaderboard,
              title: 'Rangliste',
              subtitle: 'Wie stehst du im Vergleich zu anderen?',
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => RankingScreen(state: state),
                ),
              ),
            ),
            _MenuTile(
              icon: Icons.shopping_bag,
              title: 'Shop',
              subtitle: 'Coins für Hintergründe, Avatare & mehr ausgeben',
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => ShopScreen(state: state),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfileCard extends StatelessWidget {
  final AppState state;
  const _ProfileCard({required this.state});

  @override
  Widget build(BuildContext context) {
    final p = state.profile!;
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            CircleAvatar(
              radius: 28,
              backgroundColor: Colors.indigo.shade100,
              child: Text(
                p.activeAvatar ?? '🙂',
                style: const TextStyle(fontSize: 28),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Hallo, ${p.nickname}!',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${p.totalChallengesCompleted} Challenges abgeschlossen',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  Text(
                    'Aktuelle Serie: ${p.streakDays} Tag${p.streakDays == 1 ? '' : 'e'}',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MenuTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _MenuTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: ListTile(
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        leading: CircleAvatar(
          backgroundColor: Colors.indigo.shade50,
          child: Icon(icon, color: Colors.indigo),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
