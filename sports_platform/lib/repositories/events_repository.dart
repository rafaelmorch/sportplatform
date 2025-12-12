import '../models/event.dart';
import '../services/supabase_service.dart';

class EventsRepository {
  /// ✅ Ajuste aqui se sua tabela tiver outro nome:
  static const String tableName = 'events';

  Future<List<Event>> fetchEvents() async {
    final res = await SupabaseService.client
        .from(tableName)
        .select()
        .order('created_at', ascending: false);

    if (res is List) {
      return res.map((e) => Event.fromMap(Map<String, dynamic>.from(e))).toList();
    }

    return const [];
  }
}
