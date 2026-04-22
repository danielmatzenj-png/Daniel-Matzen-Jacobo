import 'package:shared_preferences/shared_preferences.dart';

import '../models/challenge.dart';
import '../models/user_profile.dart';
import 'default_challenges.dart';

/// Kleine Hülle um SharedPreferences für Profil und Challenges.
class StorageService {
  static const _kProfile = 'fitness_profile_v1';
  static const _kChallenges = 'fitness_challenges_v1';

  Future<UserProfile?> loadProfile() async {
    final p = await SharedPreferences.getInstance();
    final raw = p.getString(_kProfile);
    if (raw == null) return null;
    return UserProfile.decode(raw);
  }

  Future<void> saveProfile(UserProfile profile) async {
    final p = await SharedPreferences.getInstance();
    await p.setString(_kProfile, profile.encode());
  }

  Future<List<Challenge>> loadChallenges() async {
    final p = await SharedPreferences.getInstance();
    final raw = p.getString(_kChallenges);
    if (raw == null) {
      final defaults = buildDefaultChallenges();
      await p.setString(_kChallenges, Challenge.encodeList(defaults));
      return defaults;
    }
    return Challenge.decodeList(raw);
  }

  Future<void> saveChallenges(List<Challenge> challenges) async {
    final p = await SharedPreferences.getInstance();
    await p.setString(_kChallenges, Challenge.encodeList(challenges));
  }

  Future<void> reset() async {
    final p = await SharedPreferences.getInstance();
    await p.remove(_kProfile);
    await p.remove(_kChallenges);
  }
}
