import 'package:flutter/material.dart';
import '../../constants/app_theme.dart';
import '../../models/user_model.dart';
import '../../services/storage_service.dart';
import '../../widgets/branding_banner.dart';
import '../login_screen.dart';
import 'member_collect_tab.dart';
import 'member_dashboard_tab.dart';

class MemberHomeScreen extends StatefulWidget {
  const MemberHomeScreen({super.key});

  @override
  State<MemberHomeScreen> createState() => _MemberHomeScreenState();
}

class _MemberHomeScreenState extends State<MemberHomeScreen> {
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
        content: const Text('Are you sure you want to sign out of the Team Member workspace?'),
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
    final memberName = _currentUser?.fullName ?? 'Enumerator';

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Innovative Data Platform', style: TextStyle(fontSize: 16)),
            Text(
              'Team Member: $memberName',
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
                MemberCollectTab(),
                MemberDashboardTab(),
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
            icon: Icon(Icons.assignment_add),
            selectedIcon: Icon(Icons.assignment_add, color: AppTheme.primary),
            label: 'Collect Data',
          ),
          NavigationDestination(
            icon: Icon(Icons.insights_rounded),
            selectedIcon: Icon(Icons.insights_rounded, color: AppTheme.primary),
            label: 'My Live Dashboard',
          ),
        ],
      ),
    );
  }
}
