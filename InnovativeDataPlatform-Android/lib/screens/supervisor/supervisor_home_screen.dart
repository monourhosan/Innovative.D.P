import 'package:flutter/material.dart';
import '../../constants/app_theme.dart';
import '../../models/user_model.dart';
import '../../services/storage_service.dart';
import '../../widgets/branding_banner.dart';
import '../login_screen.dart';
import 'supervisor_dashboard_tab.dart';
import 'supervisor_team_tab.dart';

class SupervisorHomeScreen extends StatefulWidget {
  const SupervisorHomeScreen({super.key});

  @override
  State<SupervisorHomeScreen> createState() => _SupervisorHomeScreenState();
}

class _SupervisorHomeScreenState extends State<SupervisorHomeScreen> {
  int _currentIndex = 0;
  UserModel? _currentUser;

  @override
  void initState() {
    super.initState();
    _currentUser = StorageService.getUserProfile();
  }

  void _handleLogout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Log Out?'),
        content: const Text('Are you sure you want to sign out of the Supervisor workspace?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Log Out'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await StorageService.clearSession();
      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final supName = _currentUser?.fullName ?? 'Supervisor';

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Innovative Data Platform', style: TextStyle(fontSize: 16)),
            Text(
              'Supervisor: $supName',
              style: const TextStyle(fontSize: 12, color: Color(0xFF93C5FD), fontWeight: FontWeight.normal),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            tooltip: 'Log Out',
            onPressed: _handleLogout,
          ),
        ],
      ),
      body: Column(
        children: [
          const BrandingBanner(),
          Expanded(
            child: IndexedStack(
              index: _currentIndex,
              children: const [
                SupervisorDashboardTab(),
                SupervisorTeamTab(),
              ],
            ),
          ),
          const BrandingBanner(isDark: true),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) => setState(() => _currentIndex = index),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_rounded),
            selectedIcon: Icon(Icons.dashboard_rounded, color: AppTheme.primary),
            label: 'Live Dashboard',
          ),
          NavigationDestination(
            icon: Icon(Icons.group_rounded),
            selectedIcon: Icon(Icons.group_rounded, color: AppTheme.primary),
            label: 'Manage Team',
          ),
        ],
      ),
    );
  }
}
