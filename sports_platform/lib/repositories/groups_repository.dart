import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/group.dart';

class GroupsRepository {
  final _supabase = Supabase.instance.client;

  Future<List<Group>> fetchGroups() async {
    // ⚠️ não seleciona "description" porque não existe no training_groups
    final rows = await _supabase
        .from('training_groups')
        .select('id, title, slug')
        .order('title', ascending: true);

    return (rows as List)
        .map((r) => Group.fromMap(r as Map<String, dynamic>))
        .toList();
  }
}
