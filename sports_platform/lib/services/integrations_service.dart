import 'package:supabase_flutter/supabase_flutter.dart';

class IntegrationsService {
  final SupabaseClient _supabase = Supabase.instance.client;

  String? currentUserId() => _supabase.auth.currentUser?.id;

  Future<bool> hasStravaConnected() async {
    final userId = currentUserId();
    if (userId == null) return false;

    final rows = await _supabase
        .from('strava_tokens')
        .select('user_id')
        .eq('user_id', userId)
        .limit(1);

    return (rows as List).isNotEmpty;
  }

  Future<bool> hasFitbitConnected() async {
    final userId = currentUserId();
    if (userId == null) return false;

    final rows = await _supabase
        .from('fitbit_tokens')
        .select('user_id')
        .eq('user_id', userId)
        .limit(1);

    return (rows as List).isNotEmpty;
  }
}
