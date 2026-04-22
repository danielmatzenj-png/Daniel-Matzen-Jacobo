import 'package:flutter/material.dart';

import '../models/challenge.dart';
import '../models/sport.dart';
import '../services/app_state.dart';
import '../widgets/coin_badge.dart';

class ChallengesScreen extends StatefulWidget {
  final AppState state;
  const ChallengesScreen({super.key, required this.state});

  @override
  State<ChallengesScreen> createState() => _ChallengesScreenState();
}

class _ChallengesScreenState extends State<ChallengesScreen> {
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
    final challenges = widget.state.challenges;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Challenges'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Center(
              child: CoinBadge(coins: widget.state.profile!.coins),
            ),
          ),
        ],
      ),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: challenges.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (ctx, i) => _ChallengeCard(
          challenge: challenges[i],
          onLog: (amount) =>
              widget.state.logProgress(challenges[i], amount),
        ),
      ),
    );
  }
}

class _ChallengeCard extends StatelessWidget {
  final Challenge challenge;
  final Future<void> Function(double amount) onLog;

  const _ChallengeCard({required this.challenge, required this.onLog});

  int get _currentDay {
    for (var i = 0; i < challenge.dailyProgress.length; i++) {
      if (challenge.dailyProgress[i] <
          challenge.goalForDay(i + 1) - 1e-9) {
        return i + 1;
      }
    }
    return challenge.durationDays;
  }

  @override
  Widget build(BuildContext context) {
    final goalToday = challenge.goalForDay(_currentDay);
    final doneToday = challenge.isCompleted
        ? goalToday
        : challenge.dailyProgress[_currentDay - 1];
    final unit = challenge.sport.unit;

    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(challenge.sport.emoji,
                    style: const TextStyle(fontSize: 28)),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(challenge.title,
                          style: Theme.of(context).textTheme.titleMedium),
                      Text(challenge.sport.label,
                          style: Theme.of(context).textTheme.bodySmall),
                    ],
                  ),
                ),
                if (challenge.isCompleted)
                  const Chip(
                    label: Text('Abgeschlossen'),
                    backgroundColor: Color(0xFFC8E6C9),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(challenge.description),
            const SizedBox(height: 12),
            LinearProgressIndicator(
              value: challenge.progressPercent,
              minHeight: 8,
              backgroundColor: Colors.grey.shade200,
            ),
            const SizedBox(height: 6),
            Text(
              'Gesamt: ${_fmt(challenge.totalProgress)} / ${_fmt(challenge.totalGoal)} $unit '
              '(${challenge.daysCompleted}/${challenge.durationDays} Tage)',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 12),
            if (!challenge.isCompleted) ...[
              Text(
                'Heute (Tag $_currentDay): '
                '${_fmt(doneToday)} / ${_fmt(goalToday)} $unit',
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.edit),
                      label: const Text('Menge eintragen'),
                      onPressed: () => _askCustomAmount(context, unit),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: FilledButton.icon(
                      icon: const Icon(Icons.check_circle),
                      label: const Text('Heute erledigt'),
                      onPressed: () async {
                        final remaining =
                            (goalToday - doneToday).clamp(0.0, goalToday);
                        await onLog(remaining > 0 ? remaining : goalToday);
                      },
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _askCustomAmount(BuildContext context, String unit) async {
    final ctrl = TextEditingController();
    final amount = await showDialog<double>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Menge eintragen ($unit)'),
        content: TextField(
          controller: ctrl,
          keyboardType:
              const TextInputType.numberWithOptions(decimal: true),
          decoration: InputDecoration(hintText: 'z.B. 1.5 $unit'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Abbrechen'),
          ),
          FilledButton(
            onPressed: () {
              final v = double.tryParse(ctrl.text.replaceAll(',', '.'));
              Navigator.pop(ctx, v);
            },
            child: const Text('Eintragen'),
          ),
        ],
      ),
    );
    if (amount != null && amount > 0) {
      await onLog(amount);
    }
  }

  String _fmt(double v) {
    if (v == v.roundToDouble()) return v.toStringAsFixed(0);
    return v.toStringAsFixed(1);
  }
}
