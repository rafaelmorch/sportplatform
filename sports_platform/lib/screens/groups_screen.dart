import 'package:flutter/material.dart';

import './models/group.dart';
import './repositories/groups_repository.dart';
import 'group_details_screen.dart';

class GroupsScreen extends StatefulWidget {
  const GroupsScreen({super.key});

  @override
  State<GroupsScreen> createState() => _GroupsScreenState();
}

class _GroupsScreenState extends State<GroupsScreen> {
  final GroupsRepository _repo = GroupsRepository();
  late Future<List<Group>> _future;

  @override
  void initState() {
    super.initState();
    _future = _repo.fetchGroups();
  }

  void _reload() {
    setState(() {
      _future = _repo.fetchGroups();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF020617), // ✅ igual ao site
      body: SafeArea(
        child: FutureBuilder<List<Group>>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }

            if (snapshot.hasError) {
              return _ErrorState(
                message: snapshot.error.toString(),
                onRetry: _reload,
              );
            }

            final groups = snapshot.data ?? [];

            return ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 90), // espaço p/ bottom bar se existir
              children: [
                _Header(onReload: _reload),
                const SizedBox(height: 14),

                if (groups.isEmpty)
                  const _EmptyState()
                else
                  ...groups.map(
                    (group) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _GroupCard(
                        group: group,
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => GroupDetailsScreen(group: group),
                            ),
                          );
                        },
                      ),
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
   UI COMPONENTS
=========================== */

class _Header extends StatelessWidget {
  final VoidCallback onReload;
  const _Header({required this.onReload});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // "Comunidades"
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              "COMUNIDADES",
              style: TextStyle(
                fontSize: 11,
                letterSpacing: 2.2,
                fontWeight: FontWeight.w700,
                color: Color(0xFF64748B),
              ),
            ),
            IconButton(
              onPressed: onReload,
              icon: const Icon(Icons.refresh, color: Color(0xFF94A3B8)),
              tooltip: "Recarregar",
            )
          ],
        ),

        const SizedBox(height: 6),

        const Text(
          "Grupos de treino",
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w800,
            color: Color(0xFFE5E7EB),
          ),
        ),

        const SizedBox(height: 6),

        const Text(
          "Escolha um grupo que combine com o seu momento e acompanhe sua evolução junto com outros atletas.",
          style: TextStyle(
            fontSize: 13,
            color: Color(0xFF9CA3AF),
            height: 1.35,
          ),
        ),
      ],
    );
  }
}

class _GroupCard extends StatelessWidget {
  final Group group;
  final VoidCallback onTap;

  const _GroupCard({required this.group, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final title = group.title;
    final subtitle = group.description.isEmpty
        ? "Plano de 12 semanas pensado para este grupo."
        : group.description;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFF94A3B8).withOpacity(0.35)),
          gradient: const RadialGradient(
            center: Alignment.topLeft,
            radius: 2.2,
            colors: [
              Color(0xFF020617),
              Color(0xFF020617),
              Color(0xFF000000),
            ],
            stops: [0.0, 0.5, 1.0],
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Título + Tag azul
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFFE5E7EB),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        subtitle,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 13,
                          color: Color(0xFF9CA3AF),
                          height: 1.25,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: const Color(0xFF38BDF8).withOpacity(0.5)),
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        Color(0xFF082F49),
                        Color(0xFF0C4A6E),
                      ],
                    ),
                  ),
                  child: const Text(
                    "Grupo ativo",
                    style: TextStyle(
                      fontSize: 11,
                      color: Color(0xFFE0F2FE),
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Rodapé "Ver detalhes"
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: const [
                Text(
                  "Plano de 12 semanas pensado para este grupo.",
                  style: TextStyle(
                    fontSize: 12,
                    color: Color(0xFF60A5FA), // azul (no lugar do verde)
                  ),
                ),
                Text(
                  "Ver detalhes",
                  style: TextStyle(
                    fontSize: 12,
                    color: Color(0xFF93C5FD),
                    decoration: TextDecoration.underline,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFF94A3B8).withOpacity(0.35)),
        gradient: const RadialGradient(
          center: Alignment.topLeft,
          radius: 2.2,
          colors: [
            Color(0xFF020617),
            Color(0xFF020617),
            Color(0xFF000000),
          ],
          stops: [0.0, 0.5, 1.0],
        ),
      ),
      child: const Text(
        "Nenhum grupo encontrado no momento.",
        style: TextStyle(color: Color(0xFF9CA3AF)),
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
              "Falha ao carregar grupos",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFFE5E7EB)),
            ),
            const SizedBox(height: 10),
            Text(message, textAlign: TextAlign.center, style: const TextStyle(color: Color(0xFF9CA3AF))),
            const SizedBox(height: 14),
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text("Tentar de novo"),
            ),
          ],
        ),
      ),
    );
  }
}
