import '../models/user_profile.dart';

class RankingEntry {
  final String nickname;
  final int coins;
  final int challenges;
  final bool isMe;

  const RankingEntry({
    required this.nickname,
    required this.coins,
    required this.challenges,
    this.isMe = false,
  });
}

/// Simuliert eine „globale“ Rangliste mit Pseudo-Usern.
/// In einer echten App käme das aus einem Backend.
class RankingService {
  static final List<RankingEntry> _fakeUsers = [
    const RankingEntry(nickname: 'SportFreak91', coins: 980, challenges: 18),
    const RankingEntry(nickname: 'LauraLäuft', coins: 870, challenges: 15),
    const RankingEntry(nickname: 'BikerBenni', coins: 760, challenges: 14),
    const RankingEntry(nickname: 'YogaYvonne', coins: 690, challenges: 13),
    const RankingEntry(nickname: 'Kniebeugen-König', coins: 640, challenges: 12),
    const RankingEntry(nickname: 'SchwimmSabine', coins: 590, challenges: 11),
    const RankingEntry(nickname: 'TennisTom', coins: 540, challenges: 10),
    const RankingEntry(nickname: 'MarathonMarkus', coins: 500, challenges: 9),
    const RankingEntry(nickname: 'FitFranzi', coins: 460, challenges: 9),
    const RankingEntry(nickname: 'PushUpPaul', coins: 430, challenges: 8),
    const RankingEntry(nickname: 'Cardio-Clara', coins: 400, challenges: 8),
    const RankingEntry(nickname: 'SprintSven', coins: 360, challenges: 7),
    const RankingEntry(nickname: 'TrailTina', coins: 320, challenges: 7),
    const RankingEntry(nickname: 'GymGustav', coins: 280, challenges: 6),
    const RankingEntry(nickname: 'RunnerRita', coins: 250, challenges: 6),
    const RankingEntry(nickname: 'BoulderBea', coins: 210, challenges: 5),
    const RankingEntry(nickname: 'PaddelPeter', coins: 180, challenges: 4),
    const RankingEntry(nickname: 'FußballFrank', coins: 160, challenges: 4),
    const RankingEntry(nickname: 'HikeHanna', coins: 140, challenges: 3),
    const RankingEntry(nickname: 'NewcomerNico', coins: 90, challenges: 2),
  ];

  /// Baut die Rangliste inklusive dem eigenen Profil, sortiert nach Coins,
  /// dann nach abgeschlossenen Challenges.
  List<RankingEntry> buildRanking(UserProfile? me) {
    final list = List<RankingEntry>.from(_fakeUsers);
    if (me != null) {
      list.add(RankingEntry(
        nickname: me.nickname,
        coins: me.coins,
        challenges: me.totalChallengesCompleted,
        isMe: true,
      ));
    }
    list.sort((a, b) {
      final c = b.coins.compareTo(a.coins);
      if (c != 0) return c;
      return b.challenges.compareTo(a.challenges);
    });
    return list;
  }

  int myPosition(List<RankingEntry> ranking) {
    for (var i = 0; i < ranking.length; i++) {
      if (ranking[i].isMe) return i + 1;
    }
    return -1;
  }
}
