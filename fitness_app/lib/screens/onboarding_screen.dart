import 'package:flutter/material.dart';

import '../services/app_state.dart';

/// Einmaliger Start-Screen: Nutzer legt seinen Nicknamen fest.
class OnboardingScreen extends StatefulWidget {
  final AppState state;
  const OnboardingScreen({super.key, required this.state});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _ctrl = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Icon(Icons.fitness_center,
                  size: 72, color: Colors.indigo),
              const SizedBox(height: 16),
              Text(
                'Willkommen bei Fit-Challenge!',
                style: Theme.of(context).textTheme.headlineSmall,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              const Text(
                'Wähle deinen Nicknamen, um loszulegen.',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              TextField(
                controller: _ctrl,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(
                  labelText: 'Nickname',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              FilledButton.icon(
                icon: const Icon(Icons.play_arrow),
                label: const Text('Los geht’s'),
                onPressed: () async {
                  final name = _ctrl.text.trim();
                  if (name.isEmpty) return;
                  await widget.state.createProfile(name);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
