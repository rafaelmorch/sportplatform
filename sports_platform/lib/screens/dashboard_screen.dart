// lib/screens/dashboard_screen.dart
// Dashboard V2 (FULL)
// - fl_chart 0.71.0 compatível
// - Linhas curvas (isCurved: true)
// - Legenda no padrão do site (Líder / Média / Você)
// - Ranking entre churrasco e gráfico, com scroll interno e ordenação (Posição / A-Z)
// - Card "Últimas atividades" com 50 mais recentes + toggle Meus / Grupo
// - Ajustes: grid quase imperceptível + eixos X/Y visíveis + medalhas top 3 (CORES reais)

import 'dart:math';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:fl_chart/fl_chart.dart';

// =========================================================
// ENUMS
// =========================================================

enum RangeKey { all, today, d7, d30, m6 }
enum ActivitiesView { mine, group }
enum RankingSort { position, az }

// =========================================================
// SCREEN
// =========================================================

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _supabase = Supabase.instance.client;

  RangeKey _range = RangeKey.d30;
  ActivitiesView _activitiesView = ActivitiesView.group;

  bool _loading = true;
  String? _error;

  String? _currentUserId;

  List<_TrainingGroupOption> _groups = [];
  _TrainingGroupOption? _selectedGroup;

  List<String> _memberUserIds = [];
  final Map<String, String?> _nameByUserId = {};

  List<_GroupActivityRow> _groupActivities = [];
  List<_RankingEntry> _ranking = [];
  List<_EvolutionPoint> _evolution = [];

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  // =========================================================
  // HELPERS
  // =========================================================

  DateTime _now() => DateTime.now();

  DateTime? _rangeStart(RangeKey r) {
    final now = _now();
    switch (r) {
      case RangeKey.all:
        return null;
      case RangeKey.today:
        return DateTime(now.year, now.month, now.day);
      case RangeKey.d7:
        return now.subtract(const Duration(days: 7));
      case RangeKey.d30:
        return now.subtract(const Duration(days: 30));
      case RangeKey.m6:
        return now.subtract(const Duration(days: 180));
    }
  }

  DateTime? _parseDate(String? s) {
    if (s == null) return null;
    try {
      return DateTime.parse(s);
    } catch (_) {
      return null;
    }
  }

  bool _isInRange(DateTime? dt) {
    if (dt == null) return false;
    final start = _rangeStart(_range);
    if (start == null) return true;
    return dt.isAfter(start) || dt.isAtSameMomentAs(start);
  }

  bool _isWalkingType(String? type) {
    final t = (type ?? '').toLowerCase();
    return t.contains('walk') || t.contains('hike') || t.contains('caminhada');
  }

  double _pointsFor(String? type, double minutes) {
    if (minutes <= 0) return 0;
    final rate = _isWalkingType(type) ? 15.0 : 100.0;
    return (minutes / 60.0) * rate;
  }

  String _fmtShortDate(DateTime d) =>
      '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}';

  String _fmtDateTime(DateTime d) {
    final dd = d.day.toString().padLeft(2, '0');
    final mm = d.month.toString().padLeft(2, '0');
    final yy = (d.year % 100).toString().padLeft(2, '0');
    final hh = d.hour.toString().padLeft(2, '0');
    final mi = d.minute.toString().padLeft(2, '0');
    return '$dd/$mm/$yy $hh:$mi';
  }

  // =========================================================
  // BOOTSTRAP
  // =========================================================

  Future<void> _bootstrap() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final user = _supabase.auth.currentUser;
      if (user == null) {
        setState(() {
          _loading = false;
          _error = 'Você precisa estar logado para ver o Dashboard.';
        });
        return;
      }

      _currentUserId = user.id;

      final memberRows = await _supabase
          .from('training_group_members')
          .select('group_id')
          .eq('user_id', user.id);

      final groupIds = (memberRows as List)
          .map((e) => (e['group_id'] as String?)?.trim())
          .whereType<String>()
          .where((s) => s.isNotEmpty)
          .toSet()
          .toList();

      if (groupIds.isNotEmpty) {
        final groupRows = await _supabase
            .from('training_groups')
            .select('id, title')
            .inFilter('id', groupIds);

        _groups = (groupRows as List)
            .map((g) => _TrainingGroupOption(
                  id: (g['id'] as String?) ?? '',
                  title: (g['title'] as String?) ?? 'Grupo',
                ))
            .where((g) => g.id.isNotEmpty)
            .toList();

        _selectedGroup = _groups.isNotEmpty ? _groups.first : null;
      } else {
        _groups = [];
        _selectedGroup = null;
      }

      await _loadSelectedGroupData();

      setState(() => _loading = false);
    } catch (e) {
      setState(() {
        _loading = false;
        _error = e.toString();
      });
    }
  }

  Future<void> _loadSelectedGroupData() async {
    _memberUserIds = [];
    _nameByUserId.clear();
    _groupActivities = [];
    _ranking = [];
    _evolution = [];

    final g = _selectedGroup;
    if (g == null) {
      setState(() {});
      return;
    }

    final members = await _supabase
        .from('training_group_members')
        .select('user_id')
        .eq('group_id', g.id);

    final userIds = (members as List)
        .map((m) => (m['user_id'] as String?)?.trim())
        .whereType<String>()
        .where((s) => s.isNotEmpty)
        .toSet()
        .toList();

    _memberUserIds = userIds;

    if (userIds.isEmpty) {
      setState(() {});
      return;
    }

    final profiles = await _supabase
        .from('profiles')
        .select('id, full_name')
        .inFilter('id', userIds);

    for (final p in (profiles as List)) {
      final id = (p['id'] as String?) ?? '';
      final name = (p['full_name'] as String?);
      if (id.isNotEmpty) _nameByUserId[id] = name;
    }

    var query = _supabase
        .from('user_activities')
        .select('user_id, start_date, type, minutes')
        .inFilter('user_id', userIds);

    final start = _rangeStart(_range);
    if (start != null) {
      query = query.gte('start_date', start.toIso8601String());
    }

    final actRows = await query;

    final rows = (actRows as List)
        .map((r) {
          final uid = (r['user_id'] as String?) ?? '';
          return _GroupActivityRow(
            userId: uid,
            startDate: (r['start_date'] as String?),
            type: (r['type'] as String?),
            minutes: ((r['minutes'] as num?) ?? 0).toDouble(),
            fullName: _nameByUserId[uid],
          );
        })
        .where((a) => _isInRange(_parseDate(a.startDate)))
        .toList();

    rows.sort((a, b) {
      final da = _parseDate(a.startDate);
      final db = _parseDate(b.startDate);
      final ta = da?.millisecondsSinceEpoch ?? 0;
      final tb = db?.millisecondsSinceEpoch ?? 0;
      return tb.compareTo(ta);
    });

    _groupActivities = rows;
    _ranking = _buildRanking(rows);
    _evolution = _buildEvolution(rows, _ranking);

    setState(() {});
  }

  List<_RankingEntry> _buildRanking(List<_GroupActivityRow> acts) {
    final map = <String, _RankingAgg>{};
    for (final uid in _memberUserIds) {
      map[uid] = _RankingAgg(points: 0, hours: 0, name: _nameByUserId[uid]);
    }

    for (final a in acts) {
      map.putIfAbsent(
        a.userId,
        () => _RankingAgg(points: 0, hours: 0, name: _nameByUserId[a.userId]),
      );

      final prev = map[a.userId]!;
      final pts = _pointsFor(a.type, a.minutes);
      final hrs = a.minutes / 60.0;

      map[a.userId] = _RankingAgg(
        points: prev.points + pts,
        hours: prev.hours + hrs,
        name: prev.name ?? a.fullName,
      );
    }

    final entries = map.entries.map((e) {
      final uid = e.key;
      final v = e.value;
      return _RankingEntry(
        userId: uid,
        label: v.name ?? 'Atleta ${uid.substring(0, min(8, uid.length))}',
        totalPoints: v.points.round(),
        totalHours: v.hours,
        isCurrent: uid == _currentUserId,
      );
    }).toList();

    entries.sort((a, b) => b.totalPoints.compareTo(a.totalPoints));
    return entries;
  }

  List<_EvolutionPoint> _buildEvolution(
    List<_GroupActivityRow> acts,
    List<_RankingEntry> ranking,
  ) {
    if (acts.isEmpty) return [];

    final currentId = _currentUserId;
    final leaderId = ranking.isNotEmpty ? ranking.first.userId : null;

    final userMap = <String, double>{};
    final leaderMap = <String, double>{};
    final groupMap = <String, _GroupDayAgg>{};

    for (final a in acts) {
      final dt = _parseDate(a.startDate);
      if (dt == null) continue;
      final key = dt.toIso8601String().substring(0, 10);

      final g = groupMap[key] ??
          _GroupDayAgg(totalMinutes: 0, userIds: <String>{});
      g.totalMinutes += a.minutes;
      g.userIds.add(a.userId);
      groupMap[key] = g;

      if (currentId != null && a.userId == currentId) {
        userMap[key] = (userMap[key] ?? 0) + a.minutes;
      }
      if (leaderId != null && a.userId == leaderId) {
        leaderMap[key] = (leaderMap[key] ?? 0) + a.minutes;
      }
    }

    final keys = <String>{}
      ..addAll(groupMap.keys)
      ..addAll(userMap.keys)
      ..addAll(leaderMap.keys);

    final sorted = keys.toList()..sort();

    return sorted.map((k) {
      final d = DateTime.tryParse(k) ?? DateTime.now();
      final label = _fmtShortDate(d);

      final userMin = userMap[k] ?? 0;
      final leaderMin = leaderMap[k] ?? 0;

      final g = groupMap[k];
      final avg = (g != null && g.userIds.isNotEmpty)
          ? (g.totalMinutes / g.userIds.length.toDouble())
          : 0;

      return _EvolutionPoint(
        dateKey: k,
        label: label,
        userMinutes: double.parse(userMin.toStringAsFixed(1)),
        groupAvgMinutes: double.parse(avg.toStringAsFixed(1)),
        leaderMinutes: double.parse(leaderMin.toStringAsFixed(1)),
      );
    }).toList();
  }

  Future<void> _changeRange(RangeKey r) async {
    setState(() {
      _range = r;
      _loading = true;
      _error = null;
    });

    try {
      await _loadSelectedGroupData();
      setState(() => _loading = false);
    } catch (e) {
      setState(() {
        _loading = false;
        _error = e.toString();
      });
    }
  }

  Future<void> _changeGroup(_TrainingGroupOption? g) async {
    setState(() {
      _selectedGroup = g;
      _loading = true;
      _error = null;
    });

    try {
      await _loadSelectedGroupData();
      setState(() => _loading = false);
    } catch (e) {
      setState(() {
        _loading = false;
        _error = e.toString();
      });
    }
  }

  // =========================================================
  // UI
  // =========================================================

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return _ErrorState(
        message: _error!,
        onRetry: _bootstrap,
      );
    }

    final selected = _selectedGroup;
    final lastPlace = _ranking.isNotEmpty ? _ranking.last : null;

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _Header(
            groups: _groups,
            selectedGroup: selected,
            onChanged: _changeGroup,
            range: _range,
            onRangeChanged: _changeRange,
          ),
          const SizedBox(height: 12),
          if (selected == null)
            const _InfoCard(
              title: "Sem grupos",
              body:
                  "Você ainda não participa de nenhum grupo. Entre em um grupo para ver ranking e evolução.",
            )
          else ...[
            if (lastPlace != null) _MemeCard(lastPlaceName: lastPlace.label),
            if (lastPlace != null) const SizedBox(height: 12),

            _RankingCard(ranking: _ranking),
            const SizedBox(height: 12),

            _EvolutionChart(evolution: _evolution),
            const SizedBox(height: 12),

            _ActivitiesCard(
              activities: _groupActivities,
              view: _activitiesView,
              onToggle: (v) => setState(() => _activitiesView = v),
              currentUserId: _currentUserId,
              parseDate: _parseDate,
              fmtDateTime: _fmtDateTime,
            ),
          ],
        ],
      ),
    );
  }
}

// =========================================================
// WIDGETS
// =========================================================

class _Header extends StatelessWidget {
  final List<_TrainingGroupOption> groups;
  final _TrainingGroupOption? selectedGroup;
  final Future<void> Function(_TrainingGroupOption?) onChanged;

  final RangeKey range;
  final Future<void> Function(RangeKey) onRangeChanged;

  const _Header({
    required this.groups,
    required this.selectedGroup,
    required this.onChanged,
    required this.range,
    required this.onRangeChanged,
  });

  String _rangeLabel(RangeKey r) {
    switch (r) {
      case RangeKey.all:
        return 'Tudo';
      case RangeKey.today:
        return 'Hoje';
      case RangeKey.d7:
        return '7 dias';
      case RangeKey.d30:
        return '30 dias';
      case RangeKey.m6:
        return '6 meses';
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.dividerColor.withOpacity(0.2)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Dashboard de Performance",
            style: theme.textTheme.titleLarge
                ?.copyWith(fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 6),
          Text(
            "Ranking do grupo, meme do churrasco, gráfico e últimas atividades.",
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurface.withOpacity(0.7),
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              const Icon(Icons.groups),
              const SizedBox(width: 8),
              Expanded(
                child: DropdownButtonFormField<_TrainingGroupOption>(
                  value: selectedGroup,
                  isDense: true,
                  isExpanded: true,
                  decoration: const InputDecoration(
                    labelText: "Grupo",
                    border: OutlineInputBorder(),
                  ),
                  items: groups
                      .map((g) => DropdownMenuItem(
                            value: g,
                            child: Text(
                              g.title,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ))
                      .toList(),
                  onChanged: (g) => onChanged(g),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: RangeKey.values.map((r) {
              final active = r == range;
              return ChoiceChip(
                label: Text(_rangeLabel(r)),
                selected: active,
                onSelected: (_) => onRangeChanged(r),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

class _MemeCard extends StatelessWidget {
  final String lastPlaceName;
  const _MemeCard({required this.lastPlaceName});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.red.withOpacity(0.4)),
        color: Colors.red.withOpacity(0.06),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Quem vai pagar o próximo churrasco?",
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: Colors.red.shade700,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  lastPlaceName,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  "Último colocado no ranking do período.",
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurface.withOpacity(0.7),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Container(
            width: 54,
            height: 54,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: Colors.red.withOpacity(0.7), width: 2),
            ),
            child: const Text("🥩", style: TextStyle(fontSize: 26)),
          ),
        ],
      ),
    );
  }
}

class _RankingCard extends StatefulWidget {
  final List<_RankingEntry> ranking;
  const _RankingCard({required this.ranking});

  @override
  State<_RankingCard> createState() => _RankingCardState();
}

class _RankingCardState extends State<_RankingCard> {
  RankingSort _sort = RankingSort.position;

  // ✅ cores "reais" de medalha
  static const Color _gold = Color(0xFFFFD700);
  static const Color _silver = Color(0xFFC0C0C0);
  static const Color _bronze = Color(0xFFCD7F32);

  Widget _leadingForPos({
    required int realPos,
    required bool isCurrent,
    required Color currentPrimary,
  }) {
    if (realPos == 1) {
      return Icon(Icons.emoji_events, color: _gold, size: 22);
    }
    if (realPos == 2) {
      return Icon(Icons.emoji_events, color: _silver, size: 22);
    }
    if (realPos == 3) {
      return Icon(Icons.emoji_events, color: _bronze, size: 22);
    }

    // fallback: número
    return Text(
      "#$realPos",
      style: TextStyle(
        fontWeight: FontWeight.w900,
        color: isCurrent ? currentPrimary : null,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final List<_RankingEntry> list = List.of(widget.ranking);

    if (_sort == RankingSort.az) {
      list.sort((a, b) => a.label.toLowerCase().compareTo(b.label.toLowerCase()));
    }

    return Container(
      height: 420,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.dividerColor.withOpacity(0.2)),
        color: theme.colorScheme.surface,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Ranking do grupo",
            style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 6),
          Text(
            "Pontos: atividades (exceto caminhada) = 100 pts/h, caminhada = 15 pts/h.",
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurface.withOpacity(0.7),
            ),
          ),
          const SizedBox(height: 10),

          Row(
            children: [
              ChoiceChip(
                label: const Text("Posição"),
                selected: _sort == RankingSort.position,
                onSelected: (_) => setState(() => _sort = RankingSort.position),
              ),
              const SizedBox(width: 8),
              ChoiceChip(
                label: const Text("A–Z"),
                selected: _sort == RankingSort.az,
                onSelected: (_) => setState(() => _sort = RankingSort.az),
              ),
            ],
          ),

          const SizedBox(height: 10),

          Expanded(
            child: list.isEmpty
                ? Text(
                    "Nenhuma atividade encontrada nesse período.",
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurface.withOpacity(0.7),
                    ),
                  )
                : ListView.separated(
                    itemCount: list.length,
                    separatorBuilder: (_, __) =>
                        Divider(color: theme.dividerColor.withOpacity(0.25)),
                    itemBuilder: (context, i) {
                      final r = list[i];

                      // posição REAL (por pontos) mesmo em A–Z
                      final realPos =
                          widget.ranking.indexWhere((x) => x.userId == r.userId) + 1;

                      final leadingBg = r.isCurrent
                          ? theme.colorScheme.primary.withOpacity(0.12)
                          : theme.colorScheme.onSurface.withOpacity(0.06);

                      return ListTile(
                        dense: true,
                        contentPadding: EdgeInsets.zero,
                        leading: CircleAvatar(
                          backgroundColor: leadingBg,
                          child: _leadingForPos(
                            realPos: realPos,
                            isCurrent: r.isCurrent,
                            currentPrimary: theme.colorScheme.primary,
                          ),
                        ),
                        title: Text(
                          r.label,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontWeight: r.isCurrent ? FontWeight.w900 : FontWeight.w700,
                          ),
                        ),
                        subtitle: r.isCurrent
                            ? Text(
                                "Você",
                                style: TextStyle(
                                  color: theme.colorScheme.primary,
                                  fontWeight: FontWeight.w800,
                                ),
                              )
                            : null,
                        trailing: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              "${r.totalPoints} pts",
                              style: const TextStyle(fontWeight: FontWeight.w900),
                            ),
                            Text(
                              "${r.totalHours.toStringAsFixed(1)} h",
                              style: TextStyle(
                                color: theme.colorScheme.onSurface.withOpacity(0.7),
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

class _EvolutionChart extends StatelessWidget {
  final List<_EvolutionPoint> evolution;
  const _EvolutionChart({required this.evolution});

  static const Color _orange = Color(0xFFF97316);
  static const Color _blue = Color(0xFF60A5FA);
  static const Color _green = Color(0xFF4ADE80);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (evolution.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          color: theme.colorScheme.surface,
          border: Border.all(color: theme.dividerColor.withOpacity(0.2)),
        ),
        child: Text(
          "Sem dados suficientes para montar a evolução nesse período.",
          style: theme.textTheme.bodyMedium?.copyWith(
            color: theme.colorScheme.onSurface.withOpacity(0.7),
          ),
        ),
      );
    }

    final leader = evolution.map((e) => e.leaderMinutes).toList();
    final avg = evolution.map((e) => e.groupAvgMinutes).toList();
    final me = evolution.map((e) => e.userMinutes).toList();

    final topYNum = evolution
        .map((e) => max(e.userMinutes, max(e.groupAvgMinutes, e.leaderMinutes)))
        .reduce(max);

    final maxY = (topYNum + 10).toDouble();

    final xCount = evolution.length;
    final xInterval = max(1, (xCount / 6).floor());
    final yInterval = max(10.0, (maxY / 4.0));

    final axisTextStyle = theme.textTheme.labelSmall?.copyWith(
      color: theme.colorScheme.onSurface.withOpacity(0.65),
      fontWeight: FontWeight.w700,
    );

    final gridColor = theme.colorScheme.onSurface.withOpacity(0.06);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.dividerColor.withOpacity(0.2)),
        color: theme.colorScheme.surface,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Evolução (minutos por dia)",
            style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 6),
          Text(
            "Você x Média do grupo x Líder — por dia (linhas sinuosas).",
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurface.withOpacity(0.7),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 280,
            child: LineChart(
              LineChartData(
                maxY: maxY,
                minY: 0,
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: true,
                  drawHorizontalLine: true,
                  horizontalInterval: yInterval,
                  verticalInterval: xInterval.toDouble(),
                  getDrawingHorizontalLine: (_) => FlLine(
                    color: gridColor,
                    strokeWidth: 1,
                  ),
                  getDrawingVerticalLine: (_) => FlLine(
                    color: gridColor,
                    strokeWidth: 1,
                  ),
                ),
                titlesData: FlTitlesData(
                  show: true,
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 38,
                      interval: yInterval,
                      getTitlesWidget: (value, meta) {
                        return Padding(
                          padding: const EdgeInsets.only(right: 6),
                          child: Text(value.toStringAsFixed(0), style: axisTextStyle),
                        );
                      },
                    ),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 26,
                      interval: xInterval.toDouble(),
                      getTitlesWidget: (value, meta) {
                        final idx = value.round();
                        if (idx < 0 || idx >= evolution.length) {
                          return const SizedBox.shrink();
                        }
                        if (idx % xInterval != 0 && idx != evolution.length - 1) {
                          return const SizedBox.shrink();
                        }
                        return Padding(
                          padding: const EdgeInsets.only(top: 6),
                          child: Text(evolution[idx].label, style: axisTextStyle),
                        );
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(
                  show: true,
                  border: Border(
                    left: BorderSide(color: theme.colorScheme.onSurface.withOpacity(0.12)),
                    bottom: BorderSide(color: theme.colorScheme.onSurface.withOpacity(0.12)),
                    top: BorderSide.none,
                    right: BorderSide.none,
                  ),
                ),
                lineTouchData: LineTouchData(
                  enabled: true,
                  touchTooltipData: LineTouchTooltipData(
                    getTooltipColor: (touchedSpot) => const Color(0xFF020617),
                    tooltipRoundedRadius: 10,
                  ),
                ),
                lineBarsData: [
                  _line(_orange, leader),
                  _line(_blue, avg),
                  _line(_green, me),
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),
          const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _LegendDot(color: _orange, label: "Líder do ranking"),
              SizedBox(width: 12),
              _LegendDot(color: _blue, label: "Média do grupo"),
              SizedBox(width: 12),
              _LegendDot(color: _green, label: "Você"),
            ],
          ),
        ],
      ),
    );
  }

  LineChartBarData _line(Color c, List<double> values) {
    return LineChartBarData(
      spots: values.asMap().entries.map((e) => FlSpot(e.key.toDouble(), e.value)).toList(),
      isCurved: true,
      curveSmoothness: 0.25,
      color: c,
      barWidth: 3,
      dotData: FlDotData(show: false),
      belowBarData: BarAreaData(show: false),
    );
  }
}

class _LegendDot extends StatelessWidget {
  final Color color;
  final String label;
  const _LegendDot({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 6),
        Text(label, style: const TextStyle(fontSize: 12)),
      ],
    );
  }
}

class _ActivitiesCard extends StatelessWidget {
  final List<_GroupActivityRow> activities;
  final ActivitiesView view;
  final ValueChanged<ActivitiesView> onToggle;
  final String? currentUserId;

  final DateTime? Function(String?) parseDate;
  final String Function(DateTime) fmtDateTime;

  const _ActivitiesCard({
    required this.activities,
    required this.view,
    required this.onToggle,
    required this.currentUserId,
    required this.parseDate,
    required this.fmtDateTime,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final filtered = view == ActivitiesView.mine
        ? activities.where((a) => a.userId == currentUserId).toList()
        : activities;

    filtered.sort((a, b) {
      final da = parseDate(a.startDate);
      final db = parseDate(b.startDate);
      final ta = da?.millisecondsSinceEpoch ?? 0;
      final tb = db?.millisecondsSinceEpoch ?? 0;
      return tb.compareTo(ta);
    });

    final list = filtered.take(50).toList();

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.dividerColor.withOpacity(0.2)),
        color: theme.colorScheme.surface,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Últimas atividades (dentro do período selecionado)",
            style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 6),
          Text(
            "As 50 atividades mais recentes do grupo/usuário selecionado.",
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurface.withOpacity(0.7),
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              ChoiceChip(
                label: const Text("Treinos do grupo"),
                selected: view == ActivitiesView.group,
                onSelected: (_) => onToggle(ActivitiesView.group),
              ),
              const SizedBox(width: 8),
              ChoiceChip(
                label: const Text("Meus treinos"),
                selected: view == ActivitiesView.mine,
                onSelected: (_) => onToggle(ActivitiesView.mine),
              ),
            ],
          ),
          const SizedBox(height: 10),
          if (list.isEmpty)
            Text(
              "Nenhuma atividade encontrada nesse período.",
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurface.withOpacity(0.7),
              ),
            )
          else
            Column(
              children: list.map((a) {
                final dt = parseDate(a.startDate);
                final when = dt == null ? "-" : fmtDateTime(dt);

                return ListTile(
                  dense: true,
                  contentPadding: EdgeInsets.zero,
                  title: Text(
                    a.fullName ?? "Atleta",
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                  subtitle: Text("${a.type ?? "-"} • $when"),
                  trailing: Text(
                    "${a.minutes.toStringAsFixed(0)} min",
                    style: const TextStyle(fontWeight: FontWeight.w900),
                  ),
                );
              }).toList(),
            ),
        ],
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final String title;
  final String body;
  const _InfoCard({required this.title, required this.body});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.dividerColor.withOpacity(0.2)),
        color: theme.colorScheme.surface,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900)),
          const SizedBox(height: 6),
          Text(
            body,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurface.withOpacity(0.7),
            ),
          ),
        ],
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  final String message;
  final Future<void> Function() onRetry;

  const _ErrorState({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              "Erro no Dashboard",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 10),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 14),
            ElevatedButton.icon(
              onPressed: () => onRetry(),
              icon: const Icon(Icons.refresh),
              label: const Text("Tentar de novo"),
            ),
          ],
        ),
      ),
    );
  }
}

// =========================================================
// MODELS
// =========================================================

class _TrainingGroupOption {
  final String id;
  final String title;

  _TrainingGroupOption({
    required this.id,
    required this.title,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is _TrainingGroupOption && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;
}

class _GroupActivityRow {
  final String userId;
  final String? startDate;
  final String? type;
  final double minutes;
  final String? fullName;

  _GroupActivityRow({
    required this.userId,
    required this.startDate,
    required this.type,
    required this.minutes,
    required this.fullName,
  });
}

class _RankingEntry {
  final String userId;
  final String label;
  final int totalPoints;
  final double totalHours;
  final bool isCurrent;

  _RankingEntry({
    required this.userId,
    required this.label,
    required this.totalPoints,
    required this.totalHours,
    required this.isCurrent,
  });
}

class _RankingAgg {
  final double points;
  final double hours;
  final String? name;

  _RankingAgg({
    required this.points,
    required this.hours,
    required this.name,
  });
}

class _EvolutionPoint {
  final String dateKey;
  final String label;
  final double userMinutes;
  final double groupAvgMinutes;
  final double leaderMinutes;

  _EvolutionPoint({
    required this.dateKey,
    required this.label,
    required this.userMinutes,
    required this.groupAvgMinutes,
    required this.leaderMinutes,
  });
}

class _GroupDayAgg {
  double totalMinutes;
  Set<String> userIds;

  _GroupDayAgg({required this.totalMinutes, required this.userIds});
}
