import '../models/challenge.dart';
import '../models/sport.dart';

/// Standard-Katalog an verfügbaren Challenges.
/// Jede Challenge läuft 7 Tage.
List<Challenge> buildDefaultChallenges() => [
      Challenge(
        id: 'bike_week1',
        title: 'Rad – Woche 1',
        description: '1 km pro Tag – insgesamt 7 km in der Woche.',
        sport: Sport.radfahren,
        baseGoal: 1.0,
        dailyGrowth: 0.0,
      ),
      Challenge(
        id: 'bike_week2',
        title: 'Rad – Woche 2 (+10% täglich)',
        description: 'Startet mit 1 km, jeden Tag 10% mehr.',
        sport: Sport.radfahren,
        baseGoal: 1.0,
        dailyGrowth: 0.10,
      ),
      Challenge(
        id: 'run_basic',
        title: 'Lauf-Einstieg',
        description: '2 km Laufen/Gehen pro Tag.',
        sport: Sport.laufen,
        baseGoal: 2.0,
        dailyGrowth: 0.0,
      ),
      Challenge(
        id: 'swim_basic',
        title: 'Schwimm-Challenge',
        description: '200 Schwimmzüge pro Tag.',
        sport: Sport.schwimmen,
        baseGoal: 200,
      ),
      Challenge(
        id: 'gym_pushups',
        title: 'Push-Up-Challenge',
        description: '20 Push-Ups pro Tag, steigert sich leicht.',
        sport: Sport.gym,
        baseGoal: 20,
        dailyGrowth: 0.05,
      ),
      Challenge(
        id: 'gym_squats',
        title: 'Kniebeugen-Woche',
        description: '30 Kniebeugen pro Tag.',
        sport: Sport.gym,
        baseGoal: 30,
      ),
      Challenge(
        id: 'yoga_daily',
        title: 'Tägliches Yoga',
        description: '15 Minuten Yoga am Tag.',
        sport: Sport.yoga,
        baseGoal: 15,
      ),
      Challenge(
        id: 'tennis_week',
        title: 'Tennis – Schläger-Woche',
        description: '100 Tennisschläge pro Tag.',
        sport: Sport.tennis,
        baseGoal: 100,
      ),
    ];
