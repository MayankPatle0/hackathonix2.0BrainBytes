import 'package:flutter/material.dart';
import '../services/supabase_service.dart';
import '../models/memory.dart';
import '../services/backend_service.dart';
import '../config/theme.dart';

class AddScreen extends StatefulWidget {
  const AddScreen({super.key});

  @override
  State<AddScreen> createState() => _AddScreenState();
}

class _AddScreenState extends State<AddScreen> {
  final _formKey = GlobalKey<FormState>();
  final _contentController = TextEditingController();
  final _supabase = SupabaseService();
  final _backend = BackendService();
  bool _isInit = true;
  bool _isLoading = false;
  Memory? _editingMemory;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_isInit) {
      final args = ModalRoute.of(context)?.settings.arguments;
      if (args != null) {
        if (args is String) {
          _contentController.text = args;
        } else if (args is Memory) {
          _editingMemory = args;
          _contentController.text = args.content ?? args.metadata?.summary ?? '';
        }
      }
      _isInit = false;
    }
  }

  @override
  void dispose() {
    _contentController.dispose();
    super.dispose();
  }

  Future<void> _saveMemory() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final content = _contentController.text.trim();
      final userId = _supabase.currentUser!.id;

      if (_editingMemory != null) {
        // Update existing memory
        final currentMeta = _editingMemory!.metadata?.toJson() ?? {};
        currentMeta['content'] = content; // Ensure content is updated in metadata
        // Preserve other fields
        
        await _supabase.updateMemory(_editingMemory!.id, currentMeta);
        
        if (mounted) {
           ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Memory updated successfully!')),
          );
          Navigator.pop(context, true);
        }
      } else {
        // Create new memory via Backend Queue
        final response = await _backend.processMemory(content, userId);

        if (response.containsKey('jobId') || response.containsKey('message')) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Memory sent for AI processing! It will appear shortly.'),
                backgroundColor: AppTheme.primary,
              ),
            );
            Navigator.pop(context, true);
          }
        } else {
          throw Exception('Failed to queue memory processing');
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error saving memory: $e'),
            backgroundColor: AppTheme.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('New Memory'),
        actions: [
          TextButton(
            onPressed: _isLoading ? null : _saveMemory,
            child: _isLoading
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: AppTheme.primary,
                    ),
                  )
                : const Text(
                    'Save',
                    style: TextStyle(
                      color: AppTheme.primary,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Info Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    const Icon(
                      Icons.lightbulb_outline,
                      color: AppTheme.primary,
                      size: 24,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Nexus will automatically generate a title, summary, and tags for your memory',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            
            // Content Field
            TextFormField(
              controller: _contentController,
              decoration: const InputDecoration(
                labelText: 'What do you want to remember?',
                hintText: 'Start typing your memory...',
                alignLabelWithHint: true,
              ),
              maxLines: 15,
              minLines: 5,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter some content';
                }
                if (value.trim().length < 10) {
                  return 'Memory is too short (minimum 10 characters)';
                }
                return null;
              },
            ),
            const SizedBox(height: 24),
            
            // Character Count
            Text(
              '${_contentController.text.length} characters',
              style: Theme.of(context).textTheme.labelSmall,
              textAlign: TextAlign.right,
            ),
          ],
        ),
      ),
    );
  }
}
