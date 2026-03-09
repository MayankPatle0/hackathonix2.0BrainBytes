import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/constants.dart';
import '../models/memory.dart';

class SupabaseService {
  static final SupabaseService _instance = SupabaseService._internal();
  factory SupabaseService() => _instance;
  SupabaseService._internal();

  late final SupabaseClient _client;
  
  SupabaseClient get client => _client;
  User? get currentUser => _client.auth.currentUser;
  bool get isAuthenticated => currentUser != null;
  String? get accessToken => _client.auth.currentSession?.accessToken;

  Future<void> initialize() async {
    await Supabase.initialize(
      url: AppConstants.supabaseUrl,
      anonKey: AppConstants.supabaseAnonKey,
    );
    _client = Supabase.instance.client;
  }

  // Authentication
  Future<AuthResponse> signUp(String email, String password) async {
    return await _client.auth.signUp(
      email: email,
      password: password,
    );
  }

  Future<AuthResponse> signIn(String email, String password) async {
    return await _client.auth.signInWithPassword(
      email: email,
      password: password,
    );
  }

  Future<void> signOut() async {
    await _client.auth.signOut();
  }

  // Memory Operations
  Future<List<Memory>> fetchMemories() async {
    try {
      final response = await _client
          .from('retain_auth_memory')
          .select()
          .order('created_at', ascending: false);
      
      return (response as List).map((json) {
        if (json['user_id'] == null && currentUser != null) {
          json['user_id'] = currentUser!.id;
        }
        return Memory.fromJson(json);
      }).toList();
    } catch (e) {
      print('Error fetching memories: $e');
      return [];
    }
  }

  Future<List<Memory>> fetchMemoriesByIds(List<String> ids) async {
    if (ids.isEmpty) return [];
    try {
      final response = await _client
          .from('retain_auth_memory')
          .select()
          .filter('id', 'in', ids)
          .order('created_at', ascending: false);
      
      return (response as List).map((json) {
        if (json['user_id'] == null && currentUser != null) {
          json['user_id'] = currentUser!.id;
        }
        return Memory.fromJson(json);
      }).toList();
    } catch (e) {
      print('Error fetching memories by IDs: $e');
      return [];
    }
  }

  // NOTE: For creating memories, we should ideally send to the Backend Queue 
  // so the AI Worker can process it and insert into retain_auth_memory.
  // Direct insertion into 'retain_auth_memory' might bypass AI analysis if we do it here.
  // However, for now, let's keep basic insertion if needed, or better, 
  // rely on the BackendService for "creating" memories via analysis.
  
  Future<Memory?> createMemory(String content, {Map<String, dynamic>? metadata}) async {
    // OLD LOGIC: Insert into 'memories'. 
    // NEW LOGIC: We should probably just return null or throw because 
    // the Add Screen should use BackendService to "Ask/Process" memory.
    // But if we MUST support offline save:
    
    // For now, let's revert to inserting into 'memories' (if it exists) 
    // OR 'retain_auth_memory' if we construct the metadata manually.
    // But honestly, the React Native app uses 'retain_auth_memory'.
    
    final response = await _client
        .from('retain_auth_memory')
        .insert({
          'user_id': currentUser!.id,
          'metadata': {
            'content': content, // fallback
            ...?metadata // spread existing metadata
          }
        })
        .select()
        .single();
    
    return Memory.fromJson(response);
  }

  Future<void> updateMemory(String id, Map<String, dynamic> metadata) async {
    // We replace the entire metadata with the new merged map provided by the UI
    await _client
        .from('retain_auth_memory')
        .update({'metadata': metadata})
        .eq('id', id);
  }

  Future<void> deleteMemory(String id) async {
    await _client
        .from('retain_auth_memory')
        .delete()
        .eq('id', id);
  }

  Future<void> toggleFavorite(String id, Map<String, dynamic> currentMetadata) async {
    final newMetadata = Map<String, dynamic>.from(currentMetadata);
    newMetadata['favorite'] = !(newMetadata['favorite'] ?? false);
    
    await _client
        .from('retain_auth_memory')
        .update({'metadata': newMetadata})
        .eq('id', id);
  }

  // Listen to auth state changes
  Stream<AuthState> get authStateChanges => _client.auth.onAuthStateChange;
}
