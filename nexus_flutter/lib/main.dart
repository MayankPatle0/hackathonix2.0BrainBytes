import 'package:flutter/material.dart';
import 'config/theme.dart';
import 'services/supabase_service.dart';
import 'screens/auth_screen.dart';
import 'screens/home_screen.dart';
import 'screens/add_screen.dart';
import 'screens/search_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/chat_screen.dart';

import 'services/sharing_service.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Supabase
  await SupabaseService().initialize();

  // Initialize Sharing Service
  SharingService().initialize(navigatorKey);
  
  runApp(const NexusApp());
}

class NexusApp extends StatelessWidget {
  const NexusApp({super.key});

  @override
  Widget build(BuildContext context) {
    final supabase = SupabaseService();
    
    return MaterialApp(
      navigatorKey: navigatorKey,
      title: 'Nexus',
      theme: AppTheme.darkTheme,
      debugShowCheckedModeBanner: false,
      
      // Initial route based on auth state
      home: supabase.isAuthenticated 
          ? const MainNavigation()
          : const AuthScreen(),
      
      // Named routes
      routes: {
        '/auth': (context) => const AuthScreen(),
        '/home': (context) => const MainNavigation(),
        '/add': (context) => const AddScreen(),
        '/search': (context) => const SearchScreen(),
        '/chat': (context) => const ChatScreen(),
        '/settings': (context) => const SettingsScreen(),
      },
    );
  }
}

class MainNavigation extends StatefulWidget {
  const MainNavigation({super.key});

  @override
  State<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  int _currentIndex = 0;
  
  final List<Widget> _screens = const [
    HomeScreen(),
    ChatScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        selectedItemColor: AppTheme.primary,
        unselectedItemColor: AppTheme.textMuted,
        backgroundColor: AppTheme.cardBackground,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.chat_bubble_outline),
            activeIcon: Icon(Icons.chat_bubble),
            label: 'Chat',
          ),
        ],
      ),
    );
  }
}
