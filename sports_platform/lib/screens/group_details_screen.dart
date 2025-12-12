import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/group.dart';
import '../models/group_plan_week.dart';
import '../repositories/group_plan_weeks_repository.dart';
import '../repositories/group_membership_repository.dart';
import 'login_screen.dart';

class GroupDetailsScreen extends StatefulWidget {
  final Group group;

  const GroupDetailsScreen({super.key, required this.group});

  @override
  State<GroupDetailsScreen> createState() => _GroupDetailsScreenState();
}

class _GroupDetailsScreenState extends State<GroupDetailsScreen> {
  final _weeksRepo = GroupPlanWeeksRepository();
  final _membershipRepo = GroupMembershipRepository();

  late Future<List<GroupPlanWeek>> _weeksFuture;

  bool _membershipLoading = true;
  bool _isMember = false;

  @override
  void initState() {
    super.initState();

    // ✅ AGORA: weeks por group_id (training_group_weeks)
    _weeksFuture = _weeksRepo.fetchWeeksByGroupId(widget.group.id);

    _loadMembership();
  }

  String? _currentUserId() {
    final user = Supabase.instance.client.auth.currentUser;
    return user?.id;
  }

  Future<void> _loadMembership() async {
    final userId = _currentUserId();

    if (userId == null) {
      setState(() {
        _membershipLoading = false;
        _isMember = false;
      });
      return;
    }

    setState(() => _membershipLoading = true);

    try {
      final isMember = await _membershipRepo.isMember(
        groupId: widget.group.id,
        userId: userId,
      );

      setState(() {
        _isMember = isMember;
        _membershipLoading = false;
      });
    } catch (e) {
      setState(() => _membershipLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Erro ao verificar membership: $e")),
        );
      }
    }
  }

  Future<bool> _ensureLoggedIn() async {
    final userId = _currentUserId();
    if (userId != null) return true;

    final result = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );

    return result == true && _currentUserId() != null;
  }

  Future<void> _toggleMembership() async {
    final logged = await _ensureLoggedIn();
    if (!logged) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Login cancelado.")),
      );
      return;
    }

    final userId = _currentUserId();
    if (userId == null) return;

    setState(() => _membershipLoading = true);

    try {
      if (_isMember) {
        await _membershipRepo.leave(groupId: widget.group.id, userId: userId);
      } else {
        await _membershipRepo.join(groupId: widget.group.id, userId: userId);
      }

      await _loadMembership();
    } catch (e) {
      setState(() => _membershipLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Erro ao atualizar membership: $e")),
        );
      }
    }
  }

  void _reloadWeeks() {
    setState(() {
      _weeksFuture = _weeksRepo.fetchWeeksByGroupId(widget.group.id);
    });
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.group.title;

    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: [
          IconButton(onPressed: _reloadWeeks, icon: const Icon(Icons.refresh)),
        ],
      ),
      body: SafeArea(
        child: FutureBuilder<List<GroupPlanWeek>>(
          future: _weeksFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }

            if (snapshot.hasError) {
              return _ErrorState(
                message: snapshot.error.toString(),
                onRetry: _reloadWeeks,
              );
            }

            final weeks = snapshot.data ?? const [];

            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _GroupHeaderCard(
                  title: title,
                  subtitle: widget.group.description,
                  membershipLoading: _membershipLoading,
                  isMember: _isMember,
                  onToggleMembership: _toggleMembership,
                ),
                const SizedBox(height: 16),
                Text(
                  "Plano (weeks)",
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: 10),
                if (weeks.isEmpty)
                  _EmptyState(onReload: _reloadWeeks)
                else
                  ...weeks.map(
                    (w) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _WeekCard(week: w),
                    ),
                  ),
              ],
            );
          },
        ),
      ),
    );
  }
}

/* ===========================
   UI
=========================== */

class _GroupHeaderCard extends StatelessWidget {
  final String title;
  final String subtitle;

  final bool membershipLoading;
  final bool isMember;
  final VoidCallback onToggleMembership;

  const _GroupHeaderCard({
    required this.title,
    required this.subtitle,
    required this.membershipLoading,
    required this.isMember,
    required this.onToggleMembership,
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
          Row(
            children: [
              CircleAvatar(
                radius: 22,
                backgroundColor: theme.colorScheme.primary.withOpacity(0.12),
                child: Icon(Icons.groups, color: theme.colorScheme.primary),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle.isEmpty ? "Sem descrição" : subtitle,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurface.withOpacity(0.7),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              _MembershipChip(
                loading: membershipLoading,
                isMember: isMember,
              ),
              const Spacer(),
              OutlinedButton(
                onPressed: membershipLoading ? null : onToggleMembership,
                child: Text(isMember ? "Sair do grupo" : "Participar"),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MembershipChip extends StatelessWidget {
  final bool loading;
  final bool isMember;

  const _MembershipChip({required this.loading, required this.isMember});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (loading) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: theme.colorScheme.primary.withOpacity(0.08),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Row(
          children: [
            SizedBox(
              width: 14,
              height: 14,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: theme.colorScheme.primary,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              "Carregando...",
              style: TextStyle(
                color: theme.colorScheme.primary,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: isMember
            ? Colors.green.withOpacity(0.12)
            : theme.colorScheme.onSurface.withOpacity(0.06),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        isMember ? "Você está no grupo" : "Você não está no grupo",
        style: TextStyle(
          color: isMember
              ? Colors.green
              : theme.colorScheme.onSurface.withOpacity(0.7),
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class _WeekCard extends StatelessWidget {
  final GroupPlanWeek week;
  const _WeekCard({required this.week});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final focus = (week.focus == null || week.focus!.trim().isEmpty)
        ? null
        : week.focus!.trim();

    final desc = (week.description == null || week.description!.trim().isEmpty)
        ? null
        : week.description!.trim();

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
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: theme.colorScheme.primary.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  "Week ${week.weekNumber}",
                  style: TextStyle(
                    color: theme.colorScheme.primary,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  week.title,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
          if (focus != null) ...[
            const SizedBox(height: 10),
            Text(
              "Focus: $focus",
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurface.withOpacity(0.8),
              ),
            ),
          ],
          if (desc != null) ...[
            const SizedBox(height: 8),
            Text(
              desc,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurface.withOpacity(0.7),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final VoidCallback onReload;
  const _EmptyState({required this.onReload});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              "No weeks found",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            const Text(
              "This group has no weeks yet in training_group_weeks.",
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: onReload,
              icon: const Icon(Icons.refresh),
              label: const Text("Reload"),
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

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
              "Failed to load weeks",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text("Try again"),
            ),
          ],
        ),
      ),
    );
  }
}
