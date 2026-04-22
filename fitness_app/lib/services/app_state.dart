import 'package:flutter/foundation.dart';

import '../models/challenge.dart';
import '../models/shop_item.dart';
import '../models/user_profile.dart';
import 'storage_service.dart';

/// Zentrale App-Logik: Lädt/Speichert Profil + Challenges,
/// führt Tagesupdates durch, verwaltet Coins und Shop-Käufe.
class AppState extends ChangeNotifier {
  final StorageService _storage = StorageService();

  UserProfile? _profile;
  List<Challenge> _challenges = [];
  bool _loading = true;

  UserProfile? get profile => _profile;
  List<Challenge> get challenges => _challenges;
  bool get loading => _loading;

  /// Anzahl erlaubter aktiver Challenges: Basis 3 + gekaufte Slots.
  int get allowedActiveSlots =>
      3 + (_profile?.extraChallengeSlots ?? 0);

  Future<void> init() async {
    _profile = await _storage.loadProfile();
    _challenges = await _storage.loadChallenges();
    _loading = false;
    notifyListeners();
  }

  Future<void> createProfile(String nickname) async {
    _profile = UserProfile(nickname: nickname);
    await _storage.saveProfile(_profile!);
    notifyListeners();
  }

  Future<void> resetAll() async {
    await _storage.reset();
    _profile = null;
    _challenges = await _storage.loadChallenges();
    notifyListeners();
  }

  /// Trägt Fortschritt für eine Challenge am aktuellen Tag ein.
  /// Zählt Coins, Tagesstreak und markiert Challenge als abgeschlossen.
  Future<void> logProgress(Challenge challenge, double amount) async {
    if (_profile == null) return;
    if (amount <= 0) return;

    final idx = _challenges.indexWhere((c) => c.id == challenge.id);
    if (idx == -1) return;

    final today = _todayIndex(challenge);
    if (today == null) return; // Challenge fertig oder außerhalb.

    final updated = List<double>.from(challenge.dailyProgress);
    final goalToday = challenge.goalForDay(today + 1);
    final wasCompleteBefore = updated[today] >= goalToday - 1e-9;
    updated[today] += amount;

    final newChallenge = challenge.copyWith(dailyProgress: updated);
    _challenges[idx] = newChallenge;

    // Coin-Logik
    var earned = 0;
    final isCompleteNow = updated[today] >= goalToday - 1e-9;
    if (!wasCompleteBefore && isCompleteNow) {
      earned += newChallenge.coinsPerDay;
    }
    if (!challenge.isCompleted && newChallenge.isCompleted) {
      earned += newChallenge.coinsOnComplete;
      _profile!.totalChallengesCompleted += 1;
    }

    // Streak updaten (nur wenn Tagesziel erreicht wurde)
    if (!wasCompleteBefore && isCompleteNow) {
      earned += _updateStreak();
    }
    _profile!.coins += earned;

    await _storage.saveChallenges(_challenges);
    await _storage.saveProfile(_profile!);
    notifyListeners();
  }

  /// Liefert den Index des „heutigen“ Tages innerhalb der Challenge.
  /// Wir interpretieren „heute“ als den ersten Tag, der noch nicht
  /// erledigt wurde (vereinfachte Sichtweise, ohne Kalender-Startdatum).
  int? _todayIndex(Challenge c) {
    for (var i = 0; i < c.dailyProgress.length; i++) {
      if (c.dailyProgress[i] < c.goalForDay(i + 1) - 1e-9) return i;
    }
    return null;
  }

  /// Aktualisiert die Streak-Tage. Bonus: 7 Tage in Folge = +30 Coins.
  int _updateStreak() {
    final now = DateTime.now();
    final today = '${now.year}-${_two(now.month)}-${_two(now.day)}';
    final last = _profile!.lastActiveDate;

    if (last == today) {
      // heute schon gezählt
      return 0;
    }

    if (last != null) {
      final diff = _daysBetween(last, today);
      if (diff == 1) {
        _profile!.streakDays += 1;
      } else {
        _profile!.streakDays = 1;
      }
    } else {
      _profile!.streakDays = 1;
    }
    _profile!.lastActiveDate = today;

    var bonus = 0;
    if (_profile!.streakDays > 0 && _profile!.streakDays % 7 == 0) {
      bonus = 30;
    }
    return bonus;
  }

  static String _two(int n) => n.toString().padLeft(2, '0');

  static int _daysBetween(String a, String b) {
    final da = DateTime.parse(a);
    final db = DateTime.parse(b);
    return db.difference(da).inDays;
  }

  /// Kauf eines Shop-Items. Zieht Coins ab, speichert Profil.
  /// Liefert null bei Erfolg, sonst Fehlermeldung.
  Future<String?> buyItem(ShopItem item) async {
    if (_profile == null) return 'Kein Profil.';
    if (_profile!.purchasedItems.contains(item.id) &&
        item.type != ShopItemType.slot) {
      return 'Bereits gekauft.';
    }
    if (_profile!.coins < item.price) {
      return 'Nicht genug Coins.';
    }
    _profile!.coins -= item.price;
    _profile!.purchasedItems.add(item.id);

    switch (item.type) {
      case ShopItemType.background:
        _profile!.activeBackground = item.payload;
        break;
      case ShopItemType.avatar:
        _profile!.activeAvatar = item.payload;
        break;
      case ShopItemType.slot:
        _profile!.extraChallengeSlots += 1;
        break;
    }

    await _storage.saveProfile(_profile!);
    notifyListeners();
    return null;
  }

  /// Hintergrund aktiv setzen (falls bereits gekauft).
  Future<void> equipBackground(String? hex) async {
    if (_profile == null) return;
    _profile!.activeBackground = hex;
    await _storage.saveProfile(_profile!);
    notifyListeners();
  }

  Future<void> equipAvatar(String? emoji) async {
    if (_profile == null) return;
    _profile!.activeAvatar = emoji;
    await _storage.saveProfile(_profile!);
    notifyListeners();
  }
}
