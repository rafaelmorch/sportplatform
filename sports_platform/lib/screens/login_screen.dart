import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _supabase = Supabase.instance.client;

  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();

  bool _loading = false;
  bool _isSignup = false; // false = login, true = criar conta

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  void _toast(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg)),
    );
  }

  String? _validateEmail(String v) {
    final s = v.trim();
    if (s.isEmpty) return "Email obrigatório";
    if (!s.contains("@")) return "Email inválido";
    return null;
  }

  String? _validatePass(String v) {
    if (v.trim().isEmpty) return "Senha obrigatória";
    if (v.trim().length < 6) return "Senha precisa ter pelo menos 6 caracteres";
    return null;
  }

  Future<void> _submit() async {
    final email = _emailCtrl.text.trim();
    final pass = _passCtrl.text;

    final emailErr = _validateEmail(email);
    final passErr = _validatePass(pass);

    if (emailErr != null) return _toast(emailErr);
    if (passErr != null) return _toast(passErr);

    setState(() => _loading = true);

    try {
      if (_isSignup) {
        await _supabase.auth.signUp(
          email: email,
          password: pass,
        );

        // Dependendo da config do Supabase, pode pedir confirmação por email.
        // Se confirmar não for obrigatório, o AuthGate já leva pro AppShell.
        _toast("Conta criada. Se pedir confirmação, verifique seu email.");
      } else {
        await _supabase.auth.signInWithPassword(
          email: email,
          password: pass,
        );

        // ✅ NÃO navega pra lugar nenhum.
        // O AuthGate no main.dart detecta a sessão e abre o AppShell.
      }
    } on AuthException catch (e) {
      _toast(e.message);
    } catch (e) {
      _toast("Erro: $e");
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                const SizedBox(height: 14),
                Row(
                  children: [
                    CircleAvatar(
                      radius: 22,
                      backgroundColor: theme.colorScheme.primary.withOpacity(0.12),
                      child: Icon(
                        Icons.sports_martial_arts,
                        color: theme.colorScheme.primary,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Sports Platform",
                            style: theme.textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _isSignup ? "Crie sua conta" : "Faça login",
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: theme.colorScheme.onSurface.withOpacity(0.7),
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 18),

                Container(
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
                    children: [
                      TextField(
                        controller: _emailCtrl,
                        keyboardType: TextInputType.emailAddress,
                        textInputAction: TextInputAction.next,
                        decoration: const InputDecoration(
                          labelText: "Email",
                          border: OutlineInputBorder(),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _passCtrl,
                        obscureText: true,
                        textInputAction: TextInputAction.done,
                        onSubmitted: (_) => _loading ? null : _submit(),
                        decoration: const InputDecoration(
                          labelText: "Senha",
                          border: OutlineInputBorder(),
                        ),
                      ),
                      const SizedBox(height: 14),

                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _loading ? null : _submit,
                          child: _loading
                              ? const SizedBox(
                                  height: 18,
                                  width: 18,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : Text(_isSignup ? "Criar conta" : "Entrar"),
                        ),
                      ),

                      const SizedBox(height: 10),

                      TextButton(
                        onPressed: _loading
                            ? null
                            : () => setState(() => _isSignup = !_isSignup),
                        child: Text(
                          _isSignup
                              ? "Já tem conta? Entrar"
                              : "Não tem conta? Criar agora",
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 12),
                Text(
                  "Obs: se sua política do Supabase exigir confirmação por email, você precisa confirmar antes de entrar.",
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurface.withOpacity(0.65),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
