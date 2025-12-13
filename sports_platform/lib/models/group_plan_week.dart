class GroupPlanWeek {
  // no banco: training_group_weeks.id = bigint -> int
  final int id;

  // no banco: group_id = uuid (string)
  final String groupId;

  final int weekNumber;

  // no banco: focus text
  final String? focus;

  // no banco: summary text
  final String? summary;

  // no banco: mileage_hint text
  final String? mileageHint;

  // no banco: key_workouts text
  final String? keyWorkouts;

  GroupPlanWeek({
    required this.id,
    required this.groupId,
    required this.weekNumber,
    required this.focus,
    required this.summary,
    required this.mileageHint,
    required this.keyWorkouts,
  });

  /// Helpers pra evitar TypeError (int vs String etc)
  static int _asInt(dynamic v, {int fallback = 0}) {
    if (v == null) return fallback;
    if (v is int) return v;
    if (v is num) return v.toInt();
    return int.tryParse(v.toString()) ?? fallback;
  }

  static String _asString(dynamic v, {String fallback = ''}) {
    if (v == null) return fallback;
    if (v is String) return v;
    return v.toString();
  }

  static String? _asNullableString(dynamic v) {
    if (v == null) return null;
    final s = v.toString().trim();
    return s.isEmpty ? null : s;
  }

  factory GroupPlanWeek.fromMap(Map<String, dynamic> map) {
    return GroupPlanWeek(
      id: _asInt(map['id']),
      groupId: _asString(map['group_id']),
      weekNumber: _asInt(map['week_number']),
      focus: _asNullableString(map['focus']),
      summary: _asNullableString(map['summary']),
      mileageHint: _asNullableString(map['mileage_hint']),
      keyWorkouts: _asNullableString(map['key_workouts']),
    );
  }

  // ✅ Compatibilidade com sua UI atual (se ela ainda usa week.title / week.description)
  String get title => focus ?? 'Week $weekNumber';
  String get description =>
      summary ?? mileageHint ?? keyWorkouts ?? '';
}
