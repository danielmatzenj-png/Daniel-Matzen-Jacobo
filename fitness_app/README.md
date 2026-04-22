# Fit-Challenge – Einfache Fitness-App (Flutter, Deutsch)

Eine kleine mobile App, die wöchentliche Fitness-Challenges für verschiedene
Sportarten anbietet, Coins vergibt, eine Rangliste zeigt und einen In-App-Shop
enthält. Die gesamte UI ist auf Deutsch.

## Funktionen

- **Challenges** in den Sportarten Radfahren, Laufen/Gehen, Schwimmen, Gym
  (Push-Ups, Kniebeugen), Yoga und Tennis.
  - Jede Challenge läuft standardmäßig **7 Tage**.
  - Tagesziele können konstant sein (z. B. „1 km Rad pro Tag“) oder
    progressiv wachsen (z. B. +10 % pro Tag).
- **Fortschritt**: Nutzer tragen pro Tag ein, wie viel sie geschafft haben.
  Per Button „Heute erledigt“ wird direkt das heutige Tagesziel verbucht;
  alternativ kann eine eigene Menge eingetragen werden.
- **Coins**:
  - 10 Coins pro erfülltem Tagesziel.
  - 50 Coins zusätzlich für eine komplett abgeschlossene Challenge.
  - 30 Coins Bonus für jede 7-Tage-Aktivitäts-Serie.
- **Rangliste** (lokal simuliert) mit 20 Pseudo-Nutzern plus deinem Profil.
  Sortierung: Coins → abgeschlossene Challenges. Die App zeigt deinen Platz.
- **Shop** mit:
  - Hintergrund-Farben (10–15 Coins).
  - Avataren (20–40 Coins).
  - Extra-Challenge-Slot (30 Coins).
  Gekaufte Hintergründe/Avatare lassen sich per „Anlegen“ aktiv schalten.
- **Lokale Persistenz** über `shared_preferences` (kein Login, kein Backend).

## Projektstruktur

```
fitness_app/
├── pubspec.yaml
├── lib/
│   ├── main.dart                      # App-Einstieg, Theme, Routing
│   ├── models/
│   │   ├── challenge.dart             # Challenge-Modell inkl. JSON
│   │   ├── shop_item.dart             # Shop-Katalog
│   │   ├── sport.dart                 # Sportarten (Enum + Helfer)
│   │   └── user_profile.dart          # Nutzerprofil
│   ├── services/
│   │   ├── app_state.dart             # Zentrale Zustands-/Coin-Logik
│   │   ├── default_challenges.dart    # Standard-Challenge-Katalog
│   │   ├── ranking_service.dart       # Rangliste mit Pseudo-Usern
│   │   └── storage_service.dart       # SharedPreferences-Wrapper
│   ├── screens/
│   │   ├── onboarding_screen.dart     # Nickname anlegen
│   │   ├── home_screen.dart           # Startbildschirm
│   │   ├── challenges_screen.dart     # Challenge-Liste + Fortschritt
│   │   ├── ranking_screen.dart        # Rangliste
│   │   └── shop_screen.dart           # Shop
│   └── widgets/
│       └── coin_badge.dart            # Wiederverwendbares Coin-Badge
```

## Einrichtung

1. **Flutter installieren** (einmalig):
   https://docs.flutter.dev/get-started/install
   Prüfe die Installation:
   ```bash
   flutter --version
   flutter doctor
   ```

2. **Projekt vorbereiten** – dieser Ordner enthält nur die `lib/`-Quellen und
   `pubspec.yaml`. Plattform-Ordner (`android/`, `ios/`, …) erzeugt Flutter:
   ```bash
   cd fitness_app
   flutter create .
   flutter pub get
   ```
   `flutter create .` legt die Plattformordner an, ohne bestehende Dateien
   unter `lib/` zu überschreiben.

3. **App starten**:

   - **Android-Emulator / physisches Gerät**
     ```bash
     flutter emulators --launch <emulator_id>   # optional
     flutter run
     ```
   - **iOS-Simulator** (nur macOS)
     ```bash
     open -a Simulator
     flutter run
     ```
   - **Web (zum schnellen Testen)**
     ```bash
     flutter run -d chrome
     ```

4. **Zurücksetzen**: Daten liegen lokal in `SharedPreferences`. Zum Reset
   einfach die App-Daten im Emulator löschen oder ein Reset-Feature
   ergänzen (`StorageService.reset()` ist bereits vorhanden).

## Wie teste ich die Funktionen?

1. **Nickname** beim ersten Start eingeben.
2. **Challenges** öffnen, bei der Rad-Woche-1-Challenge auf
   *„Heute erledigt“* tippen → Coins werden gutgeschrieben, Fortschritt
   aktualisiert, Tageszahl steigt.
3. Mehrmals wiederholen → nach 7 erfolgreichen Tagen ist die Challenge
   *abgeschlossen*, weitere 50 Coins werden addiert.
4. Im **Shop** einen Hintergrund kaufen → Home-Screen zeigt die neue Farbe.
5. In der **Rangliste** erscheint dein Eintrag an der Position, die zu
   deinen Coins passt.

## Anpassungen

- Neue Challenges: `lib/services/default_challenges.dart` erweitern.
- Neue Shop-Items: `lib/models/shop_item.dart` → `kShopCatalog`.
- Coin-Logik: `lib/services/app_state.dart` (`logProgress`, `_updateStreak`).
