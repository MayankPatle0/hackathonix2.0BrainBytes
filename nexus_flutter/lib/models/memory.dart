class Memory {
  final String id;
  final String userId;
  final String? content;
  final DateTime createdAt;
  final MemoryMetadata? metadata;
 
  Memory({
    required this.id,
    required this.userId,
    this.content,
    required this.createdAt,
    this.metadata,
  });

  factory Memory.fromJson(Map<String, dynamic> json) {
    final metadata = json['metadata'] != null
        ? MemoryMetadata.fromJson(json['metadata'])
        : null;

    // In retain_auth_memory, content might be in metadata fields or missing
    final String? content = json['content'] ?? metadata?.summary ?? metadata?.title;

    return Memory(
      id: json['id'].toString(),
      userId: json['user_id'] ?? '',
      content: content,
      createdAt: DateTime.parse(json['created_at']),
      metadata: metadata,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'content': content,
      'created_at': createdAt.toIso8601String(),
      'metadata': metadata?.toJson(),
    };
  }
}

class MemoryMetadata {
  final String? title;
  final String? summary;
  final List<String>? keywords;
  final bool? favorite;
  final String? category;

  MemoryMetadata({
    this.title,
    this.summary,
    this.keywords,
    this.favorite,
    this.category,
  });

  factory MemoryMetadata.fromJson(Map<String, dynamic> json) {
    return MemoryMetadata(
      title: json['title'],
      summary: json['summary'],
      keywords: json['keywords'] != null
          ? List<String>.from(json['keywords'])
          : null,
      favorite: json['favorite'],
      category: json['category'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'summary': summary,
      'keywords': keywords,
      'favorite': favorite,
      'category': category,
    };
  }
}
