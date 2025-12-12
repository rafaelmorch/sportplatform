import 'package:supabase_flutter/supabase_flutter.dart';

class GroupMembershipRepository {
  final _supabase = Supabase.instance.client;

  /// training_group_members: (group_id, user_id)
  Future<bool> isMember({
    required String groupId,
    required String userId,
  }) async {
    final row = await _supabase
        .from('training_group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .maybeSingle();

    return row != null;
  }

  Future<void> join({
    required String groupId,
    required String userId,
  }) async {
    await _supabase.from('training_group_members').insert({
      'group_id': groupId,
      'user_id': userId,
    });
  }

  Future<void> leave({
    required String groupId,
    required String userId,
  }) async {
    await _supabase
        .from('training_group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);
  }
}
