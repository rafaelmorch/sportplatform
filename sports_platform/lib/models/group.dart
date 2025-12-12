class Group {
  final String id; // training_groups.id pode vir int
  final String slug;
  final String title;
  final String description;

  Group({
    required this.id,
    required this.slug,
    required this.title,
    required this.description,
  });

  static String _asString(dynamic v) {
    if (v == null) return '';
    return v.toString();
  }

  static String _asStringFallback(dynamic v, String fallback) {
    final s = (v == null) ? '' : v.toString().trim();
    return s.isEmpty ? fallback : s;
  }

  factory Group.fromMap(Map<String, dynamic> map) {
    final id = _asString(map['id']);
    final title = _asStringFallback(map['title'], 'Group');

    // se não existir, fica vazio
    final description = (map['description'] == null)
        ? ''
        : map['description'].toString();

    // se não existir slug, usa id
    final slug = _asStringFallback(map['slug'], id);

    return Group(
      id: id,
      slug: slug,
      title: title,
      description: description,
    );
  }
}
