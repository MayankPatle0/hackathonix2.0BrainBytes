import 'package:flutter/material.dart';
import 'dart:async';
import '../models/memory.dart';
import '../services/supabase_service.dart';
import '../services/backend_service.dart';
import '../config/theme.dart';
import '../widgets/memory_card.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _searchController = TextEditingController();
  final _supabase = SupabaseService();
  final _backend = BackendService();
  List<Memory> _allMemories = [];
  List<Memory> _filteredMemories = [];
  Timer? _debounce;
  bool _isLoading = true;

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
    _debounce = Timer(const Duration(milliseconds: 500), () {
      _performSearch();
    });
  }

  Future<void> _loadMemories() async {
    setState(() => _isLoading = true);
    try {
      final memories = await _supabase.fetchMemories();
      setState(() {
        _allMemories = memories;
        _filteredMemories = memories;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _performSearch() async {
    final query = _searchController.text.toLowerCase().trim();
    
    if (query.isEmpty) {
      if (mounted) setState(() => _filteredMemories = _allMemories);
      return;
    }

    setState(() => _isLoading = true);

    try {
      final userId = _supabase.currentUser?.id;
      if (userId == null) return;

      // Use Semantic Search via Backend
      final results = await _backend.searchMemories(query, userId);

      if (mounted) {
        setState(() {
          _filteredMemories = results;
          _isLoading = false;
        });
      }
    } catch (e) {
      print('Search Error: $e');
      // Fallback to local search if backend fails
      if (mounted) {
        setState(() {
          _filteredMemories = _allMemories.where((memory) {
            final title = memory.metadata?.title?.toLowerCase() ?? '';
            final summary = memory.metadata?.summary?.toLowerCase() ?? '';
            final content = memory.content?.toLowerCase() ?? '';
            final keywords = memory.metadata?.keywords?.join(' ').toLowerCase() ?? '';
            
            return title.contains(query) ||
                summary.contains(query) ||
                content.contains(query) ||
                keywords.contains(query);
          }).toList();
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Search'),
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search memories...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                        },
                      )
                    : null,
              ),
              autofocus: true,
            ),
          ),
          
          // Results
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _filteredMemories.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.search_off,
                              size: 64,
                              color: AppTheme.textMuted,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              _searchController.text.isEmpty
                                  ? 'Start typing to search'
                                  : 'No results found',
                              style: Theme.of(context).textTheme.headlineMedium,
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        itemCount: _filteredMemories.length,
                        itemBuilder: (context, index) {
                          final memory = _filteredMemories[index];
                          return MemoryCard(
                            memory: memory,
                            onTap: () {
                              showModalBottomSheet(
                                context: context,
                                isScrollControlled: true,
                                builder: (context) => _buildDetailModal(memory),
                              );
                            },
                            onFavorite: () async {
                              await _supabase.toggleFavorite(
                                memory.id,
                                memory.metadata?.toJson() ?? {},
                              );
                              await _loadMemories();
                              _performSearch(); // Re-filter
                            },
                            onEdit: () async {
                              final result = await Navigator.pushNamed(
                                context, 
                                '/add', 
                                arguments: memory,
                              );
                              if (result == true) {
                                await _loadMemories();
                              }
                            },
                            onDelete: () async {
                              await _supabase.deleteMemory(memory.id);
                              await _loadMemories();
                              _performSearch(); // Re-filter
                            },
                          );
                        },
                      ),
          ),
        ],
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
        ],
      ),
    );
  }
}
