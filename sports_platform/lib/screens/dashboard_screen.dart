import 'dart:math';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

enum RangeKey { all, today, d7, d30, m6 }

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _supabase = Supabase.instance.client;

  RangeKey _range = RangeKey.d30;

  bool _loading = true;
  String? _error;

  // current user
  String? _currentUserId;

  // grupos do usuário (AGORA via training_groups)
  List<_TrainingGroupOption> _groups = [];
  _TrainingGroupOption? _selectedGroup;

  // membros do grupo selecionado
  List<String> _memberUserIds = [];

  // profiles
  final Map<String, String?> _nameByUserId = {};

  // atividades do grupo (user_activities)
  List<_GroupActivityRow> _groupActivities = [];

  // ranking
  List<_RankingEntry> _ranking = [];

  // evolução diária
  List<_EvolutionPoint> _evolution = [];

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  // -----------------------------
  // Helpers
  // -----------------------------

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

  bool _isInRange(DateTime? dt, RangeKey r) {
    if (r == RangeKey.all) return true;
    if (dt == null) return false;

    final start = _rangeStart(r);
    if (start == null) return true;

    if (r == RangeKey.today) {
      final now = _now();
      final d0 = DateTime(now.year, now.month, now.day);
      final d1 = d0.add(const Duration(days: 1));
      return dt.isAtSameMomentAs(d0) || (dt.isAfter(d0) && dt.isBefore(d1));
    }

    return dt.isAfter(start) || dt.isAtSameMomentAs(start);
  }

  bool _isWalkingType(String? type) {
    final t = (type ?? '').toLowerCase();
    return t.contains('walk') || t.contains('hike') || t.contains('caminhada');
  }

  double _pointsFor(String? type, double minutes) {
    if (minutes <= 0) return 0;
    final hours = minutes / 60.0;
    final rate = _isWalkingType(type) ? 15.0 : 100.0;
    return hours * rate;
  }

  DateTime? _parseDate(String? s) {
    if (s == null) return null;
    try {
      return DateTime.parse(s);
    } catch (_) {
      return null;
    }
  }

  String _fmtShortDate(DateTime d) {
    final dd = d.day.toString().padLeft(2, '0');
    final mm = d.month.toString().padLeft(2, '0');
    return '$dd/$mm';
  }

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

  // -----------------------------
  // Bootstrap / Loading
  // -----------------------------

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

      // ✅ 1) quais grupos (group_id) esse usuário participa? (training_group_members)
      final memberRows = await _supabase
          .from('training_group_members')
          .select('group_id')
          .eq('user_id', user.id);

      final groupIds = (memberRows as List)
          .map((r) => (r['group_id'] as String?)?.trim())
          .whereType<String>()
          .where((s) => s.isNotEmpty)
          .toSet()
          .toList();

      // ✅ 2) buscar dados do grupo em training_groups (id, title)
      List<_TrainingGroupOption> groups = [];
      if (groupIds.isNotEmpty) {
        final groupRows = await _supabase
            .from('training_groups')
            .select('id, title')
            .inFilter('id', groupIds);

        groups = (groupRows as List).map((r) {
          final id = (r['id'] as String?) ?? '';
          final title = (r['title'] as String?) ?? 'Grupo';
          return _TrainingGroupOption(
            id: id,
            title: title,
          );
        }).where((g) => g.id.isNotEmpty).toList();
      }

      _groups = groups;
      _selectedGroup = groups.isNotEmpty ? groups.first : null;

      // ✅ 3) carregar tudo do grupo selecionado
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

    // ✅ membros do grupo (training_group_members por group_id)
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

    // profiles para nomes
    final profiles = await _supabase
        .from('profiles')
        .select('id, full_name')
        .inFilter('id', userIds);

    for (final p in (profiles as List)) {
      final id = (p['id'] as String?) ?? '';
      final name = (p['full_name'] as String?);
      if (id.isNotEmpty) _nameByUserId[id] = name;
    }

    // user_activities (filtra por membros)
    final start = _rangeStart(_range);

    var query = _supabase
        .from('user_activities')
        .select('user_id, start_date, type, minutes')
        .inFilter('user_id', userIds);

    if (start != null) {
      query = query.gte('start_date', start.toIso8601String());
    }

    final actRows = await query;

    final rows = (actRows as List).map((r) {
      final uid = (r['user_id'] as String?) ?? '';
      return _GroupActivityRow(
        userId: uid,
        startDate: (r['start_date'] as String?),
        type: (r['type'] as String?),
        minutes: ((r['minutes'] as num?) ?? 0).toDouble(),
        fullName: _nameByUserId[uid],
      );
    }).toList();

    final filtered = rows.where((a) {
      final dt = _parseDate(a.startDate);
      return _isInRange(dt, _range);
    }).toList();

    _groupActivities = filtered;

    _ranking = _buildRanking(filtered);
    _evolution = _buildEvolution(filtered, _ranking);

    setState(() {});
  }

  List<_RankingEntry> _buildRanking(List<_GroupActivityRow> acts) {
    if (acts.isEmpty) return [];

    final map = <String, _RankingAgg>{};

    for (final a in acts) {
      final id = a.userId;
      if (id.isEmpty) continue;

      final pts = _pointsFor(a.type, a.minutes);
      final hours = a.minutes / 60.0;

      final prev = map[id];
      if (prev == null) {
        map[id] = _RankingAgg(
          points: pts,
          hours: hours,
          name: a.fullName ?? _nameByUserId[id],
        );
      } else {
        map[id] = _RankingAgg(
          points: prev.points + pts,
          hours: prev.hours + hours,
          name: (a.fullName ?? prev.name),
        );
      }
    }

    final entries = map.entries.map((e) {
      final uid = e.key;
      final v = e.value;
      return _RankingEntry(
        userId: uid,
        label: v.name ?? 'Atleta ${uid.substring(0, min(8, uid.length))}',
        totalPoints: v.points.round(),
        totalHours: v.hours,
        isCurrent: _currentUserId == uid,
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
      final key = dt.toIso8601String().substring(0, 10); // YYYY-MM-DD

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

    final allKeys = <String>{}
      ..addAll(groupMap.keys)
      ..addAll(userMap.keys)
      ..addAll(leaderMap.keys);

    final keys = allKeys.toList()..sort();

    return keys.map((k) {
      final d = DateTime.tryParse(k) ?? DateTime.now();
      final label = _fmtShortDate(d);

      final userMin = userMap[k] ?? 0;
      final leaderMin = leaderMap[k] ?? 0;

      final g = groupMap[k];
      final avg = (g != null && g.userIds.isNotEmpty)
          ? (g.totalMinutes / g.userIds.length)
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
    final _RankingEntry? myEntry = _ranking.where((r) => r.isCurrent).isEmpty
        ? null
        : _ranking.firstWhere((r) => r.isCurrent);

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _HeaderCard(
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
            _StatsRow(
              groupTitle: selected.title,
              rangeLabel: _rangeLabel(_range),
              totalMembers: _memberUserIds.length,
              myEntry: myEntry,
            ),
            const SizedBox(height: 12),
            if (lastPlace != null) _MemeCard(lastPlaceName: lastPlace.label),
            if (lastPlace != null) const SizedBox(height: 12),
            _RankingCard(ranking: _ranking),
            const SizedBox(height: 12),
            _EvolutionCard(evolution: _evolution),
          ],
        ],
      ),
    );
  }
}

/* =========================================================
   Widgets
========================================================= */

class _HeaderCard extends StatelessWidget {
  final List<_TrainingGroupOption> groups;
  final _TrainingGroupOption? selectedGroup;
  final Future<void> Function(_TrainingGroupOption?) onChanged;

  final RangeKey range;
  final Future<void> Function(RangeKey) onRangeChanged;

  const _HeaderCard({
    required this.groups,
    required this.selectedGroup,
    required this.onChanged,
    required this.range,
    required this.onRangeChanged,
  });

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
            "Dashboard",
            style: theme.textTheme.titleLarge
                ?.copyWith(fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 6),
          Text(
            "Ranking do grupo, meme do churrasco e evolução diária (minutos).",
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurface.withOpacity(0.7),
            ),
          ),
          const SizedBox(height: 14),

          // Grupo selector (AGORA: training_groups)
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

          // Range chips
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _RangeChip(
                label: "Tudo",
                active: range == RangeKey.all,
                onTap: () => onRangeChanged(RangeKey.all),
              ),
              _RangeChip(
                label: "Hoje",
                active: range == RangeKey.today,
                onTap: () => onRangeChanged(RangeKey.today),
              ),
              _RangeChip(
                label: "7 dias",
                active: range == RangeKey.d7,
                onTap: () => onRangeChanged(RangeKey.d7),
              ),
              _RangeChip(
                label: "30 dias",
                active: range == RangeKey.d30,
                onTap: () => onRangeChanged(RangeKey.d30),
              ),
              _RangeChip(
                label: "6 meses",
                active: range == RangeKey.m6,
                onTap: () => onRangeChanged(RangeKey.m6),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _RangeChip extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;

  const _RangeChip({
    required this.label,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
            color: active
                ? theme.colorScheme.primary.withOpacity(0.8)
                : theme.dividerColor.withOpacity(0.5),
          ),
          color: active ? theme.colorScheme.primary.withOpacity(0.08) : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            fontWeight: FontWeight.w800,
            color: active ? theme.colorScheme.primary : null,
          ),
        ),
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  final String groupTitle;
  final String rangeLabel;
  final int totalMembers;
  final _RankingEntry? myEntry;

  const _StatsRow({
    required this.groupTitle,
    required this.rangeLabel,
    required this.totalMembers,
    required this.myEntry,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _MiniStat(
            title: "Grupo",
            value: groupTitle,
            icon: Icons.tag,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _MiniStat(
            title: "Período",
            value: rangeLabel,
            icon: Icons.date_range,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _MiniStat(
            title: "Membros",
            value: "$totalMembers",
            icon: Icons.people,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _MiniStat(
            title: "Sua posição",
            value: myEntry == null ? "-" : "Você",
            icon: Icons.emoji_events,
            subtitle: myEntry == null ? null : "${myEntry!.totalPoints} pts",
          ),
        ),
      ],
    );
  }
}

class _MiniStat extends StatelessWidget {
  final String title;
  final String value;
  final String? subtitle;
  final IconData icon;

  const _MiniStat({
    required this.title,
    required this.value,
    required this.icon,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: theme.dividerColor.withOpacity(0.2)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: theme.colorScheme.onSurface.withOpacity(0.65),
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w900,
                  ),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    subtitle!,
                    style: theme.textTheme.labelMedium?.copyWith(
                      color: theme.colorScheme.onSurface.withOpacity(0.7),
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ]
              ],
            ),
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

class _RankingCard extends StatelessWidget {
  final List<_RankingEntry> ranking;
  const _RankingCard({required this.ranking});

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
          const SizedBox(height: 12),
          if (ranking.isEmpty)
            Text(
              "Nenhuma atividade encontrada nesse período.",
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurface.withOpacity(0.7),
              ),
            )
          else
            ListView.separated(
              physics: const NeverScrollableScrollPhysics(),
              shrinkWrap: true,
              itemCount: ranking.length,
              separatorBuilder: (_, __) =>
                  Divider(color: theme.dividerColor.withOpacity(0.25)),
              itemBuilder: (context, i) {
                final r = ranking[i];
                return ListTile(
                  dense: true,
                  contentPadding: EdgeInsets.zero,
                  leading: CircleAvatar(
                    backgroundColor: r.isCurrent
                        ? theme.colorScheme.primary.withOpacity(0.12)
                        : theme.colorScheme.onSurface.withOpacity(0.06),
                    child: Text(
                      "#${i + 1}",
                      style: TextStyle(
                        fontWeight: FontWeight.w900,
                        color: r.isCurrent ? theme.colorScheme.primary : null,
                      ),
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
        ],
      ),
    );
  }
}

class _EvolutionCard extends StatelessWidget {
  final List<_EvolutionPoint> evolution;
  const _EvolutionCard({required this.evolution});

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
          Text(
            "Evolução (minutos por dia)",
            style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 6),
          Text(
            "Você x Média do grupo x Líder — por dia (MVP sem gráfico).",
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurface.withOpacity(0.7),
            ),
          ),
          const SizedBox(height: 12),
          if (evolution.isEmpty)
            Text(
              "Sem dados suficientes para montar a evolução nesse período.",
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurface.withOpacity(0.7),
              ),
            )
          else
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: DataTable(
                columns: const [
                  DataColumn(label: Text("Dia")),
                  DataColumn(label: Text("Você (min)")),
                  DataColumn(label: Text("Média (min)")),
                  DataColumn(label: Text("Líder (min)")),
                ],
                rows: evolution.map((e) {
                  return DataRow(
                    cells: [
                      DataCell(Text(e.label)),
                      DataCell(Text(e.userMinutes.toStringAsFixed(1))),
                      DataCell(Text(e.groupAvgMinutes.toStringAsFixed(1))),
                      DataCell(Text(e.leaderMinutes.toStringAsFixed(1))),
                    ],
                  );
                }).toList(),
              ),
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
              style: theme.textTheme.titleMedium
                  ?.copyWith(fontWeight: FontWeight.w900)),
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

/* =========================================================
   Models internos do Dashboard
========================================================= */

class _TrainingGroupOption {
  final String id; // training_groups.id
  final String title;

  _TrainingGroupOption({
    required this.id,
    required this.title,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is _TrainingGroupOption &&
          runtimeType == other.runtimeType &&
          id == other.id;

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
  final String dateKey; // YYYY-MM-DD
  final String label; // dd/mm
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
