import 'package:flutter/material.dart';

import '../services/app_state.dart';
import '../services/ranking_service.dart';
import '../widgets/coin_badge.dart';

class RankingScreen extends StatefulWidget {
  final AppState state;
  const RankingScreen({super.key, required this.state});

  @override
  State<RankingScreen> createState() => _RankingScreenState();
}

class _RankingScreenState extends State<RankingScreen> {
  final _service = RankingService();

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
    final ranking = _service.buildRanking(widget.state.profile);
    final myPos = _service.myPosition(ranking);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Rangliste'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Center(
              child: CoinBadge(coins: widget.state.profile!.coins),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          if (myPos > 0)
            Container(
              width: double.infinity,
              color: Colors.indigo.shade50,
              padding: const EdgeInsets.all(16),
              child: Text(
                'Du bist auf Platz $myPos 🎉',
                style: Theme.of(context).textTheme.titleMedium,
                textAlign: TextAlign.center,
              ),
            ),
          Expanded(
            child: ListView.separated(
              itemCount: ranking.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (ctx, i) {
                final e = ranking[i];
                return Container(
                  color: e.isMe ? Colors.amber.shade50 : null,
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: _medalColor(i),
                      child: Text('${i + 1}',
                          style:
                              const TextStyle(fontWeight: FontWeight.bold)),
                    ),
                    title: Text(
                      e.nickname + (e.isMe ? '  (Du)' : ''),
                      style: TextStyle(
                        fontWeight:
                            e.isMe ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                    subtitle:
                        Text('${e.challenges} Challenges abgeschlossen'),
                    trailing: Text(
                      '${e.coins} 🪙',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Color _medalColor(int i) {
    switch (i) {
      case 0:
        return Colors.amber;
      case 1:
        return Colors.grey.shade400;
      case 2:
        return Colors.brown.shade300;
      default:
        return Colors.indigo.shade100;
    }
  }
}
