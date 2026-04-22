import 'dart:convert';
import 'sport.dart';

/// Eine Fitness-Challenge läuft über mehrere Tage (Standard: 7).
/// Für jeden Tag berechnen wir das Tagesziel dynamisch, z. B.
/// Tag 1: baseGoal, Tag n: baseGoal * (1 + dailyGrowth)^(n-1).
class Challenge {
  final String id;
  final String title;
  final String description;
  final Sport sport;
  final double baseGoal;
  final double dailyGrowth;
  final int durationDays;
  final int coinsPerDay;
  final int coinsOnComplete;

  /// Pro Tag gespeicherter Fortschritt (tatsächlich erbrachte Leistung).
  final List<double> dailyProgress;

  Challenge({
    required this.id,
    required this.title,
    required this.description,
    required this.sport,
    required this.baseGoal,
    this.dailyGrowth = 0.0,
    this.durationDays = 7,
    this.coinsPerDay = 10,
    this.coinsOnComplete = 50,
    List<double>? dailyProgress,
  }) : dailyProgress =
            dailyProgress ?? List<double>.filled(durationDays, 0.0);

  /// Ziel für einen bestimmten Tag (1-basiert).
  double goalForDay(int day) {
    if (day < 1) return baseGoal;
    return baseGoal * _pow(1 + dailyGrowth, day - 1);
  }

  /// Summe aller Tagesziele über die gesamte Woche.
  double get totalGoal {
    double sum = 0;
    for (var i = 1; i <= durationDays; i++) {
      sum += goalForDay(i);
    }
    return sum;
  }

  /// Summe aller bisher erbrachten Leistungen.
  double get totalProgress =>
      dailyProgress.fold(0.0, (a, b) => a + b);

  /// Wie viele Tage die Zielmenge erreicht wurde.
  int get daysCompleted {
    var count = 0;
    for (var i = 0; i < dailyProgress.length; i++) {
      if (dailyProgress[i] >= goalForDay(i + 1) - 1e-9) count++;
    }
    return count;
  }

  bool get isCompleted => daysCompleted >= durationDays;

  double get progressPercent {
    if (totalGoal == 0) return 0;
    return (totalProgress / totalGoal).clamp(0.0, 1.0);
  }

  Challenge copyWith({List<double>? dailyProgress}) => Challenge(
        id: id,
        title: title,
        description: description,
        sport: sport,
        baseGoal: baseGoal,
        dailyGrowth: dailyGrowth,
        durationDays: durationDays,
        coinsPerDay: coinsPerDay,
        coinsOnComplete: coinsOnComplete,
        dailyProgress: dailyProgress ?? List<double>.from(this.dailyProgress),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'description': description,
        'sport': sport.name,
        'baseGoal': baseGoal,
        'dailyGrowth': dailyGrowth,
        'durationDays': durationDays,
        'coinsPerDay': coinsPerDay,
        'coinsOnComplete': coinsOnComplete,
        'dailyProgress': dailyProgress,
      };

  factory Challenge.fromJson(Map<String, dynamic> j) => Challenge(
        id: j['id'] as String,
        title: j['title'] as String,
        description: j['description'] as String,
        sport: Sport.values.firstWhere((s) => s.name == j['sport']),
        baseGoal: (j['baseGoal'] as num).toDouble(),
        dailyGrowth: (j['dailyGrowth'] as num).toDouble(),
        durationDays: j['durationDays'] as int,
        coinsPerDay: j['coinsPerDay'] as int,
        coinsOnComplete: j['coinsOnComplete'] as int,
        dailyProgress: (j['dailyProgress'] as List)
            .map((e) => (e as num).toDouble())
            .toList(),
      );

  static String encodeList(List<Challenge> list) =>
      jsonEncode(list.map((c) => c.toJson()).toList());

  static List<Challenge> decodeList(String raw) =>
      (jsonDecode(raw) as List)
          .map((e) => Challenge.fromJson(e as Map<String, dynamic>))
          .toList();

  static double _pow(double base, int exp) {
    double r = 1;
    for (var i = 0; i < exp; i++) {
      r *= base;
    }
    return r;
  }
}
