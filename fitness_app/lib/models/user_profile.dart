import 'dart:convert';

/// Lokales Nutzerprofil – kein echtes Login, nur SharedPreferences.
class UserProfile {
  String nickname;
  int coins;
  int totalChallengesCompleted;
  int streakDays;

  /// ISO-Datumstring (YYYY-MM-DD) des letzten Tages mit Aktivität.
  String? lastActiveDate;

  /// Gekaufte Shop-Item-IDs.
  List<String> purchasedItems;

  /// Aktiver Hintergrund (hex-Farbe) und Avatar (Emoji).
  String? activeBackground;
  String? activeAvatar;

  /// Wie viele zusätzliche Slots gekauft wurden (0..n).
  int extraChallengeSlots;

  UserProfile({
    required this.nickname,
    this.coins = 0,
    this.totalChallengesCompleted = 0,
    this.streakDays = 0,
    this.lastActiveDate,
    List<String>? purchasedItems,
    this.activeBackground,
    this.activeAvatar,
    this.extraChallengeSlots = 0,
  }) : purchasedItems = purchasedItems ?? [];

  Map<String, dynamic> toJson() => {
        'nickname': nickname,
        'coins': coins,
        'totalChallengesCompleted': totalChallengesCompleted,
        'streakDays': streakDays,
        'lastActiveDate': lastActiveDate,
        'purchasedItems': purchasedItems,
        'activeBackground': activeBackground,
        'activeAvatar': activeAvatar,
        'extraChallengeSlots': extraChallengeSlots,
      };

  factory UserProfile.fromJson(Map<String, dynamic> j) => UserProfile(
        nickname: j['nickname'] as String,
        coins: j['coins'] as int? ?? 0,
        totalChallengesCompleted: j['totalChallengesCompleted'] as int? ?? 0,
        streakDays: j['streakDays'] as int? ?? 0,
        lastActiveDate: j['lastActiveDate'] as String?,
        purchasedItems:
            (j['purchasedItems'] as List?)?.map((e) => e as String).toList() ??
                [],
        activeBackground: j['activeBackground'] as String?,
        activeAvatar: j['activeAvatar'] as String?,
        extraChallengeSlots: j['extraChallengeSlots'] as int? ?? 0,
      );

  String encode() => jsonEncode(toJson());

  static UserProfile decode(String raw) =>
      UserProfile.fromJson(jsonDecode(raw) as Map<String, dynamic>);
}
