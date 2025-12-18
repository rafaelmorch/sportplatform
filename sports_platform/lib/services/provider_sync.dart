import 'dart:convert';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:http/http.dart' as http;

class ProviderSync {
  // Produção (site/API no Vercel)
  static const String _baseUrl = 'https://sportsplatform.app';

  /// provider: 'strava' ou 'fitbit'
  /// chama:
  /// - https://sportsplatform.app/api/strava/import
  /// - https://sportsplatform.app/api/fitbit/import
  static Future<Map<String, dynamic>> sync(String provider) async {
    final supabase = Supabase.instance.client;
    final session = supabase.auth.currentSession;

    if (session == null) {
      return {
        'ok': false,
        'error': 'Sem sessão no app. Faça login novamente.',
      };
    }

    final accessToken = session.accessToken;
    final url = Uri.parse('$_baseUrl/api/$provider/import');

    try {
      final res = await http.post(
        url,
        headers: {
          'Authorization': 'Bearer $accessToken',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: jsonEncode({}),
      );

      // tenta interpretar JSON; se não for JSON, devolve texto
      dynamic payload;
      try {
        payload = jsonDecode(res.body.isEmpty ? '{}' : res.body);
      } catch (_) {
        payload = {'raw': res.body};
      }

      final ok = res.statusCode >= 200 && res.statusCode < 300;

      return {
        'ok': ok,
        'status': res.statusCode,
        'data': payload,
      };
    } catch (e) {
      return {
        'ok': false,
        'error': e.toString(),
      };
    }
  }
}
