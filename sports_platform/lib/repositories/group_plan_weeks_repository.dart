import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/group_plan_week.dart';

class GroupPlanWeeksRepository {
  final _supabase = Supabase.instance.client;

  Future<List<GroupPlanWeek>> fetchWeeksByPlanId(String planId) async {
    final rows = await _supabase
        .from('training_group_weeks')
        .select('*')
        .eq('plan_id', planId)
        .order('week_number', ascending: true);

    return (rows as List)
        .map((r) => GroupPlanWeek.fromMap(r as Map<String, dynamic>))
        .toList();
  }

  Future<List<GroupPlanWeek>> fetchWeeksByGroupId(String groupId) async {
    final rows = await _supabase
        .from('training_group_weeks')
        .select('*')
        .eq('group_id', groupId)
        .order('week_number', ascending: true);

    return (rows as List)
        .map((r) => GroupPlanWeek.fromMap(r as Map<String, dynamic>))
        .toList();
  }
}
