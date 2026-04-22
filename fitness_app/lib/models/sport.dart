enum Sport {
  radfahren,
  laufen,
  schwimmen,
  gym,
  yoga,
  tennis,
}

extension SportInfo on Sport {
  String get label {
    switch (this) {
      case Sport.radfahren:
        return 'Radfahren';
      case Sport.laufen:
        return 'Laufen / Gehen';
      case Sport.schwimmen:
        return 'Schwimmen';
      case Sport.gym:
        return 'Gym';
      case Sport.yoga:
        return 'Yoga';
      case Sport.tennis:
        return 'Tennis';
    }
  }

  String get emoji {
    switch (this) {
      case Sport.radfahren:
        return '🚴';
      case Sport.laufen:
        return '🏃';
      case Sport.schwimmen:
        return '🏊';
      case Sport.gym:
        return '💪';
      case Sport.yoga:
        return '🧘';
      case Sport.tennis:
        return '🎾';
    }
  }

  String get unit {
    switch (this) {
      case Sport.radfahren:
      case Sport.laufen:
        return 'km';
      case Sport.schwimmen:
        return 'Züge';
      case Sport.gym:
        return 'Wdh.';
      case Sport.yoga:
        return 'Min';
      case Sport.tennis:
        return 'Schläge';
    }
  }
}
