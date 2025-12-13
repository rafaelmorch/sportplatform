import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../services/integrations_service.dart';
import 'login_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _supabase = Supabase.instance.client;
  final _integrations = IntegrationsService();

  bool _loading = true;
  bool _stravaConnected = false;
  bool _fitbitConnected = false;

  String? get _userId => _supabase.auth.currentUser?.id;

  @override
  void initState() {
    super.initState();
    _loadStatuses();
  }

  Future<void> _loadStatuses() async {
    setState(() => _loading = true);
    try {
      final strava = await _integrations.hasStravaConnected();
      final fitbit = await _integrations.hasFitbitConnected();
      setState(() {
        _stravaConnected = strava;
        _fitbitConnected = fitbit;
      });
    } catch (e) {
      // não trava a tela; só mostra como desconectado
      setState(() {
        _stravaConnected = false;
        _fitbitConnected = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Erro ao carregar integrações: $e")),
        );
      }
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<bool> _ensureLoggedIn() async {
    if (_userId != null) return true;

    final result = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );

    return result == true && _userId != null;
  }

  Future<void> _openConnectUrl(String provider) async {
    final logged = await _ensureLoggedIn();
    if (!logged) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Você precisa logar para conectar.")),
        );
      }
      return;
    }

    // IMPORTANTE:
    // Opção A: o app abre o site e passa state=userId
    final uid = _userId!;
    final siteBase = "https://sportsplatform.app";

    // Ajuste os paths conforme seu site:
    // Strava normalmente: /api/strava/connect
    // Fitbit normalmente: /api/fitbit/connect
    final path = provider == "strava"
        ? "/api/strava/connect"
        : "/api/fitbit/connect";

    final uri = Uri.parse("$siteBase$path?state=$uid");

    final ok = await launchUrl(
      uri,
      mode: LaunchMode.externalApplication,
    );

    if (!ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Não consegui abrir o navegador: $uri")),
      );
      return;
    }

    // Quando o usuário voltar pro app, ele toca em "Refresh"
    // (ou você pode fazer isso em didChangeAppLifecycleState, mas vamos simples)
  }

  Future<void> _logout() async {
    await _supabase.auth.signOut();
    if (!mounted) return;

    // volta pro login para não ficar tela branca/confuso
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (_) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _ProfileHeader(
            name: _userId == null ? "Guest" : "Logged in",
            subtitle: _userId == null ? "Please login" : "Supabase user",
          ),
          const SizedBox(height: 16),

          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _loading ? null : _loadStatuses,
                  icon: const Icon(Icons.refresh),
                  label: const Text("Refresh"),
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),
          _SectionTitle(title: "Integrations"),
          const SizedBox(height: 10),

          _IntegrationCard(
            title: "Strava",
            subtitle: _stravaConnected ? "Connected ✅" : "Not connected",
            icon: Icons.directions_run,
            buttonLabel: _stravaConnected ? "Reconnect" : "Connect",
            onPressed: () => _openConnectUrl("strava"),
            disabled: _loading,
          ),

          const SizedBox(height: 12),

          _IntegrationCard(
            title: "Fitbit",
            subtitle: _fitbitConnected ? "Connected ✅" : "Not connected",
            icon: Icons.favorite,
            buttonLabel: _fitbitConnected ? "Reconnect" : "Connect",
            onPressed: () => _openConnectUrl("fitbit"),
            disabled: _loading,
          ),

          const SizedBox(height: 16),
          _SectionTitle(title: "Settings"),
          const SizedBox(height: 10),

          _SettingsTile(
            title: "Account",
            subtitle: "Profile, email, password",
            icon: Icons.person_outline,
          ),
          const SizedBox(height: 10),
          _SettingsTile(
            title: "Notifications",
            subtitle: "Push, reminders, challenges",
            icon: Icons.notifications_none,
          ),
          const SizedBox(height: 10),
          _SettingsTile(
            title: "Privacy",
            subtitle: "Data permissions and visibility",
            icon: Icons.lock_outline,
          ),

          const SizedBox(height: 24),

          OutlinedButton.icon(
            onPressed: _logout,
            icon: const Icon(Icons.logout),
            label: const Text("Logout"),
          ),
        ],
      ),
    );
  }
}

/* ===========================
   UI COMPONENTS
=========================== */

class _ProfileHeader extends StatelessWidget {
  final String name;
  final String subtitle;

  const _ProfileHeader({
    required this.name,
    required this.subtitle,
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
      child: Row(
        children: [
          CircleAvatar(
            radius: 26,
            backgroundColor: theme.colorScheme.primary.withOpacity(0.12),
            child: Icon(
              Icons.person,
              color: theme.colorScheme.primary,
              size: 28,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurface.withOpacity(0.7),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle({required this.title});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Text(
      title,
      style: theme.textTheme.titleMedium?.copyWith(
        fontWeight: FontWeight.w800,
      ),
    );
  }
}

class _IntegrationCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final String buttonLabel;
  final VoidCallback onPressed;
  final bool disabled;

  const _IntegrationCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.buttonLabel,
    required this.onPressed,
    required this.disabled,
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
      child: Row(
        children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: theme.colorScheme.primary.withOpacity(0.12),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: theme.colorScheme.primary),
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
                  subtitle,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurface.withOpacity(0.7),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          ElevatedButton(
            onPressed: disabled ? null : onPressed,
            child: Text(buttonLabel),
          ),
        ],
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;

  const _SettingsTile({
    required this.title,
    required this.subtitle,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: () {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("$title (next step)")),
        );
      },
      child: Container(
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
        child: Row(
          children: [
            Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                color: theme.colorScheme.primary.withOpacity(0.12),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: theme.colorScheme.primary),
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
                    subtitle,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurface.withOpacity(0.7),
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.chevron_right,
              color: theme.colorScheme.onSurface.withOpacity(0.5),
            ),
          ],
        ),
      ),
    );
  }
}
