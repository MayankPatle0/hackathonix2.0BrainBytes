import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/constants.dart';
import '../services/supabase_service.dart';
import '../models/memory.dart';

class BackendService {
  static final BackendService _instance = BackendService._internal();
  factory BackendService() => _instance;
  BackendService._internal();

  final String _baseUrl = AppConstants.backendApiUrl;

  // Ask Nexus AI Chat
  Future<String> askNexus(String question, String userId) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/ask_nexus'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $userId',
        },
        body: jsonEncode({
          'question': question,
          'user_id': userId,
        }),
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['answer'] ?? 'No response from Nexus';
      } else {
        throw Exception('Failed to get response: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // Search memories via Semantic SQL Generation
  Future<List<Memory>> searchMemories(String query, String userId) async {
    try {
      final token = SupabaseService().accessToken;
      if (token == null) return [];

      // 1. Get Memory IDs from Backend (NLP -> SQL)
      // Note: Backend might use '/searchNLPSql' or just '/search' depending on final server code.
      // Based on mistral_server.js seen, it is '/searchNLPSql'.
      // If '/search' exists and returns IDs, we adapt.
      // We will try '/searchNLPSql' as it definitely exists in the server code we saw.
      
      final response = await http.post(
        Uri.parse('$_baseUrl/searchNLPSql'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'query': query,
          'user_id': userId,
        }),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final ids = List<String>.from(data['ids'] ?? []);
        
        if (ids.isEmpty) return [];

        // 2. Fetch full memory objects from Supabase using IDs
        return await SupabaseService().fetchMemoriesByIds(ids);
      } else {
        print('Search failed: ${response.statusCode}');
        return [];
      }
    } catch (e) {
      print('Search Network Error: $e');
      return [];
    }
  }

  // Process new memory (metadata generation)
  Future<Map<String, dynamic>> processMemory(String content, String userId) async {
    try {
      final token = SupabaseService().accessToken;
      if (token == null) {
         print('No access token available for saving memory.');
         return {};
      }

      final response = await http.post(
        Uri.parse('$_baseUrl/receive_data?source=M'),
        headers: {
          'Content-Type': 'text/plain', 
          'Authorization': 'Bearer $token', // Corrected: Send JWT, not UID
        },
        body: content, 
      ).timeout(const Duration(seconds: 45)); 

      if (response.statusCode == 200 || response.statusCode == 202) {
        return jsonDecode(response.body);
      } else {
        print('Backend Error: ${response.statusCode} - ${response.body}');
        return {};
      }
    } catch (e) {
      print('Network Error in processMemory: $e');
      return {};
    }
  }
}
