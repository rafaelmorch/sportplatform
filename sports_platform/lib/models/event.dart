class Event {
  final String id;
  final String title;
  final String? dateText;
  final String? location;
  final String? badge;

  const Event({
    required this.id,
    required this.title,
    this.dateText,
    this.location,
    this.badge,
  });

  factory Event.fromMap(Map<String, dynamic> map) {
    String readString(String key) => (map[key] ?? '').toString();

    return Event(
      id: readString('id').isNotEmpty ? readString('id') : readString('event_id'),
      title: readString('title').isNotEmpty ? readString('title') : readString('name'),
      dateText: map['date_text']?.toString() ?? map['date']?.toString() ?? map['start_date']?.toString(),
      location: map['location']?.toString(),
      badge: map['badge']?.toString() ?? map['type']?.toString(),
    );
  }
}
