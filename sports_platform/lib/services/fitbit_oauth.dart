import 'dart:convert';
import 'package:flutter_appauth/flutter_appauth.dart';

class FitbitOAuth {
  // ⚠️ NÃO coloque o CLIENT_SECRET no app.
  // Use somente o CLIENT_ID no app. O secret vai ficar na Edge Function.

  static const FlutterAppAuth _appAuth = FlutterAppAuth();

  // Ajuste esses 2 valores para o que você vai cadastrar no Fitbit Dev:
  // - redirectUrl: custom scheme do app (recomendado)
  // Exemplo: sportsplatform://fitbit/callback
  //
  // IMPORTANTE:
  // Você PRECISA cadastrar esse redirect no app do Fitbit (portal).
  static const String fitbitClientId = String.fromEnvironment(
    'FITBIT_CLIENT_ID',
    defaultValue: '23TN3S',
  );

  static const String redirectUrl = String.fromEnvironment(
    'FITBIT_REDIRECT_URL_APP',
    defaultValue: 'sportsplatform://fitbit/callback',
  );

  // Fitbit endpoints
  static const String authorizationEndpoint =
      'https://www.fitbit.com/oauth2/authorize';
  static const String tokenEndpoint = 'https://api.fitbit.com/oauth2/token';

  // Escopos típicos (ajustamos depois conforme seu plano)
  static const List<String> scopes = <String>[
    'activity',
    'heartrate',
    'profile',
  ];

  /// Abre o login do Fitbit e retorna o "authorization code"
  /// para a gente trocar por tokens NO BACKEND (Edge Function).
  static Future<String> authorizeAndGetCode() async {
    final request = AuthorizationTokenRequest(
      fitbitClientId,
      redirectUrl,
      serviceConfiguration: const AuthorizationServiceConfiguration(
        authorizationEndpoint: authorizationEndpoint,
        tokenEndpoint: tokenEndpoint,
      ),

      // A gente só quer o code aqui.
      // (O token exchange vai acontecer na Edge Function com o client_secret.)
      scopes: scopes,

      // Fitbit aceita PKCE nesse fluxo.
      // No Android, prefira true.
      preferEphemeralSession: true,
    );

    final result = await _appAuth.authorize(request);

    if (result == null || result.authorizationCode == null) {
      throw Exception('Fitbit: login cancelado ou sem authorization code.');
    }

    return result.authorizationCode!;
  }

  /// Ajuda: Fitbit exige state? o plugin já faz PKCE/state por baixo.
  static String prettyScopes() => scopes.join(' ');
}
