import 'dart:async';
import 'package:flutter/material.dart';
import 'package:share_handler/share_handler.dart';
import '../services/backend_service.dart';
import '../services/supabase_service.dart';
import 'package:flutter/services.dart';

class SharingService {
  static final SharingService _instance = SharingService._internal();
  factory SharingService() => _instance;
  SharingService._internal();

  StreamSubscription? _streamSubscription;

  Future<void> initialize(GlobalKey<NavigatorState> navigatorKey) async {
    final handler = ShareHandlerPlatform.instance;

    // 1. Handle initial shared content (if app launched via share)
    try {
      final initialMedia = await handler.getInitialSharedMedia();
      if (initialMedia != null && initialMedia.content != null && initialMedia.content!.isNotEmpty) {
        // Wait for navigator to be ready
        int retries = 0;
        while (navigatorKey.currentState == null && retries < 10) {
          await Future.delayed(const Duration(milliseconds: 500));
          retries++;
        }
        
        if (navigatorKey.currentState != null) {
           _handleSharedContent(initialMedia.content!, navigatorKey);
        }
      }
    } catch (e) {
      print("Error getting initial share: $e");
    }

    // 2. Listen for new shared content while app is running
    _streamSubscription = handler.sharedMediaStream.listen((SharedMedia media) {
      if (media.content != null && media.content!.isNotEmpty) {
        _handleSharedContent(media.content!, navigatorKey);
      }
    });
  }

  void _handleSharedContent(String content, GlobalKey<NavigatorState> navigatorKey) async {
    print("Shared content received: $content");

    final context = navigatorKey.currentState?.context;
    if (context == null) return;

    // Show loading dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => const Center(
        child: Card(
          child: Padding(
            padding: EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircularProgressIndicator(),
                SizedBox(height: 16),
                Text("Saving to Nexus..."),
              ],
            ),
          ),
        ),
      ),
    );

    try {
      final userId = SupabaseService().currentUser?.id;
      if (userId != null) {
        // Send directly to backend
        final result = await BackendService().processMemory(content, userId);
        
        // Close loading dialog
        if (navigatorKey.currentState?.canPop() ?? false) {
           navigatorKey.currentState?.pop();
        }

        if (result.isNotEmpty) {
           ScaffoldMessenger.of(context).showSnackBar(
             const SnackBar(content: Text('Memory saved successfully!')),
           );
           
           // If app was launched via share, close it to return to source app
           // We use a small delay to let the user see the toast
           Future.delayed(const Duration(seconds: 2), () {
             SystemNavigator.pop();
           });
        } else {
           // Error case
           ScaffoldMessenger.of(context).showSnackBar(
             const SnackBar(content: Text('Failed to save memory. Please try again.')),
           );
           // Navigate to Add Screen for manual retry if auto-save failed
           navigatorKey.currentState?.pushNamed('/add', arguments: content);
        }
      } else {
         // Not logged in
         if (navigatorKey.currentState?.canPop() ?? false) {
           navigatorKey.currentState?.pop();
        }
         ScaffoldMessenger.of(context).showSnackBar(
           const SnackBar(content: Text('Please login to save memory')),
         );
      }
    } catch (e) {
      print("Share Error: $e");
      if (navigatorKey.currentState?.canPop() ?? false) {
         navigatorKey.currentState?.pop();
      }
      navigatorKey.currentState?.pushNamed('/add', arguments: content);
    }
  }

  void dispose() {
    _streamSubscription?.cancel();
  }
}
