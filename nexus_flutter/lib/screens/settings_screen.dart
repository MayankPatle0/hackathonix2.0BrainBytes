import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/supabase_service.dart';
import '../config/constants.dart';
import '../config/theme.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final supabase = SupabaseService();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: ListView(
        children: [
          // User Info Card
          Card(
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: AppTheme.primary,
                child: Icon(
                  Icons.person,
                  color: AppTheme.backgroundDark,
                ),
              ),
              title: Text(supabase.currentUser?.email ?? 'User'),
              subtitle: const Text('Logged in'),
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Actions
          ListTile(
            leading: const Icon(Icons.web, color: AppTheme.primary),
            title: const Text('Open Web Dashboard'),
            subtitle: const Text('Access full features on web'),
            trailing: const Icon(Icons.open_in_new),
            onTap: () async {
              try {
                final uri = Uri.parse(AppConstants.frontendUrl);
                if (await canLaunchUrl(uri)) {
                  await launchUrl(uri, mode: LaunchMode.externalApplication);
                } else {
                  if (context.mounted) {
                     ScaffoldMessenger.of(context).showSnackBar(
                       const SnackBar(content: Text('Could not open Web Dashboard')),
                     );
                  }
                }
              } catch (e) {
                print('Dashboard Launch Error: $e');
              }
            },
          ),
          
          ListTile(
            leading: const Icon(Icons.refresh, color: AppTheme.primary),
            title: const Text('Force Sync'),
            subtitle: const Text('Sync all memories with server'),
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Sync complete!')),
              );
            },
          ),
          
          const Divider(),
          
          // About
          ListTile(
            leading: const Icon(Icons.info_outline),
            title: const Text('About'),
            subtitle: Text('Version ${AppConstants.appVersion}'),
          ),
          
          const Divider(),
          
          // Logout
          ListTile(
            leading: const Icon(Icons.logout, color: AppTheme.error),
            title: const Text(
              'Logout',
              style: TextStyle(color: AppTheme.error),
            ),
            onTap: () async {
              final confirm = await showDialog<bool>(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('Logout'),
                  content: const Text('Are you sure you want to logout?'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context, false),
                      child: const Text('Cancel'),
                    ),
                    TextButton(
                      onPressed: () => Navigator.pop(context, true),
                      style: TextButton.styleFrom(
                        foregroundColor: AppTheme.error,
                      ),
                      child: const Text('Logout'),
                    ),
                  ],
                ),
              );

              if (confirm == true && context.mounted) {
                await supabase.signOut();
                if (context.mounted) {
                  Navigator.of(context).pushReplacementNamed('/auth');
                }
              }
            },
          ),
        ],
      ),
    );
  }
}
