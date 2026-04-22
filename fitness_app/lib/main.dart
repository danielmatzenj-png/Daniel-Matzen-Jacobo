import 'package:flutter/material.dart';

import 'screens/home_screen.dart';
import 'screens/onboarding_screen.dart';
import 'services/app_state.dart';

void main() {
  runApp(const FitnessApp());
}

class FitnessApp extends StatefulWidget {
  const FitnessApp({super.key});

  @override
  State<FitnessApp> createState() => _FitnessAppState();
}

class _FitnessAppState extends State<FitnessApp> {
  final AppState _state = AppState();

  @override
  void initState() {
    super.initState();
    _state.addListener(() => setState(() {}));
    _state.init();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Fitness-Challenge',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),
        useMaterial3: true,
      ),
      home: _buildHome(),
    );
  }

  Widget _buildHome() {
    if (_state.loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }
    if (_state.profile == null) {
      return OnboardingScreen(state: _state);
    }
    return HomeScreen(state: _state);
  }
}
