import 'dart:async';
import 'package:flutter/material.dart';
import '../models/memory.dart';
import '../services/supabase_service.dart';
import '../services/backend_service.dart';
import '../config/theme.dart';
import '../widgets/memory_card.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _supabase = SupabaseService();
  final _backend = BackendService();
  
  // Feed State
  List<Memory> _memories = [];
  bool _isLoading = true;
  String? _selectedTag;

  // Search State
  final _searchController = TextEditingController();
  List<Memory> _searchResults = [];
  bool _isSearching = false;
  bool _isSearchLoading = false;
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _loadMemories();
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onSearchChanged() {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 600), () {
      _performSearch();
    });
  }

  Future<void> _performSearch() async {
    final query = _searchController.text.trim();
    if (query.isEmpty) {
      if (mounted) setState(() {
        _isSearching = false;
        _searchResults = [];
      });
      return;
    }

    setState(() {
      _isSearching = true;
      _isSearchLoading = true;
    });

    try {
      final userId = _supabase.currentUser?.id;
      if (userId == null) return;

      // Use Backend for Semantic Search (Hints, Emotions, Keywords)
      final results = await _backend.searchMemories(query, userId);

      if (mounted) {
        setState(() {
          _searchResults = results;
          _isSearchLoading = false;
        });
      }
    } catch (e) {
      print('Search Error: $e');
      if (mounted) {
        setState(() {
          _isSearchLoading = false;
          _searchResults = [];
        });
      }
    }
  }

  Future<void> _loadMemories() async {
    setState(() => _isLoading = true);
    try {
      final memories = await _supabase.fetchMemories();
      setState(() {
        _memories = memories;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading memories: $e')),
        );
      }
    }
  }

  Future<void> _handleRefresh() async {
    await _loadMemories();
  }

  Future<void> _toggleFavorite(Memory memory) async {
    try {
      await _supabase.toggleFavorite(
        memory.id,
        memory.metadata?.toJson() ?? {},
      );
      await _loadMemories(); // Reload to get updated data
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  Future<void> _deleteMemory(Memory memory) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Memory'),
        content: const Text('Are you sure you want to delete this memory?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: AppTheme.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        await _supabase.deleteMemory(memory.id);
        await _loadMemories();
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error deleting memory: $e')),
          );
        }
      }
    }
  }

  List<Memory> get _filteredMemories {
    if (_selectedTag == null) return _memories;
    return _memories.where((m) {
      final keywords = m.metadata?.keywords ?? [];
      return keywords.contains(_selectedTag);
    }).toList();
  }

  Set<String> get _allTags {
    final tags = <String>{};
    for (final memory in _memories) {
      if (memory.metadata?.keywords != null) {
        tags.addAll(memory.metadata!.keywords!);
      }
    }
    return tags;
  }

  Future<void> _editMemory(Memory memory) async {
    final result = await Navigator.pushNamed(
      context, 
      '/add', 
      arguments: memory,
    );
    if (result == true) {
      await _loadMemories();
    }
  }

  @override
  Widget build(BuildContext context) {
    // Determine which list to show
    final displayMemories = _isSearching ? _searchResults : _filteredMemories;
    final isListLoading = _isSearching ? _isSearchLoading : _isLoading;

    return Scaffold(
      appBar: AppBar(
        title: _isSearching
            ? TextField(
                controller: _searchController,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'Search hints, emotions...',
                  border: InputBorder.none,
                  hintStyle: const TextStyle(color: Colors.white70),
                  suffixIcon: _searchController.text.isNotEmpty 
                    ? IconButton(
                        icon: const Icon(Icons.clear, color: Colors.white),
                        onPressed: () {
                          _searchController.clear();
                          setState(() {
                             _searchResults = [];
                             _isSearching = false; // Optional: keep search bar but clear results? User wants "Search Engine", better to keep bar open.
                             // Actually, let's keep it simple.
                          });
                        },
                      )
                    : null,
                ),
                autofocus: true,
              )
            : Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Nexus'),
                  Text(
                    'AI MEMORY BANK',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: AppTheme.primary,
                          letterSpacing: 1.5,
                        ),
                  ),
                ],
              ),
        actions: [
          IconButton(
            icon: Icon(_isSearching ? Icons.close : Icons.search),
            onPressed: () {
              setState(() {
                if (_isSearching) {
                  _isSearching = false;
                  _searchController.clear();
                  _searchResults = [];
                } else {
                  _isSearching = true;
                }
              });
            },
          ),
          if (!_isSearching)
            IconButton(
              icon: const Icon(Icons.account_circle_outlined),
              onPressed: () {
                 Navigator.pushNamed(context, '/settings');
              },
            ),
        ],
      ),
      body: Column(
        children: [
          // Tag Filters (Only show when NOT searching)
          if (!_isSearching && _allTags.isNotEmpty)
            SizedBox(
              height: 50,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  FilterChip(
                    label: const Text('All'),
                    selected: _selectedTag == null,
                    onSelected: (_) => setState(() => _selectedTag = null),
                  ),
                  const SizedBox(width: 8),
                  ..._allTags.map((tag) => Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: FilterChip(
                          label: Text(tag),
                          selected: _selectedTag == tag,
                          onSelected: (_) => setState(() => _selectedTag = tag),
                        ),
                      )),
                ],
              ),
            ),

          // Memory List (Feed or Search Results)
          Expanded(
            child: isListLoading
                ? const Center(child: CircularProgressIndicator())
                : displayMemories.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              _isSearching ? Icons.search_off : Icons.lightbulb_outline,
                              size: 64,
                              color: AppTheme.textMuted,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              _isSearching 
                                ? 'No results found' 
                                : 'No memories yet',
                              style: Theme.of(context).textTheme.headlineMedium,
                            ),
                            if (!_isSearching) ...[
                              const SizedBox(height: 8),
                              Text(
                                'Tap + to create your first memory',
                                style: Theme.of(context).textTheme.bodyMedium,
                              ),
                            ],
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _handleRefresh,
                        child: ListView.builder(
                          itemCount: displayMemories.length,
                          padding: const EdgeInsets.only(bottom: 80),
                          itemBuilder: (context, index) {
                            final memory = displayMemories[index];
                            return MemoryCard(
                              memory: memory,
                              onTap: () {
                                showModalBottomSheet(
                                  context: context,
                                  isScrollControlled: true,
                                  builder: (context) => _buildDetailModal(memory),
                                );
                              },
                              onFavorite: () => _toggleFavorite(memory),
                              onEdit: () => _editMemory(memory),
                              onDelete: () => _deleteMemory(memory),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          final result = await Navigator.pushNamed(context, '/add');
          if (result == true) {
            await _loadMemories();
          }
        },
        backgroundColor: AppTheme.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildDetailModal(Memory memory) {
    return Container(
      decoration: const BoxDecoration(
        color: AppTheme.cardBackground,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  memory.metadata?.title ?? 'Memory',
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (memory.metadata?.summary != null) ...[
            Text(
              'Summary',
              style: Theme.of(context).textTheme.labelSmall,
            ),
            const SizedBox(height: 8),
            Text(memory.metadata!.summary!),
            const SizedBox(height: 16),
          ],
          Text(
            'Content',
            style: Theme.of(context).textTheme.labelSmall,
          ),
          const SizedBox(height: 8),
          Text(memory.content ?? 'No content'),
          const SizedBox(height: 16),
          if (memory.metadata?.keywords != null &&
              memory.metadata!.keywords!.isNotEmpty) ...[
            Text(
              'Tags',
              style: Theme.of(context).textTheme.labelSmall,
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: memory.metadata!.keywords!
                  .map((keyword) => Chip(
                        label: Text(keyword),
                        backgroundColor: AppTheme.cardHighlight,
                      ))
                  .toList(),
            ),
          ],
        ],
      ),
    );
  }
}
