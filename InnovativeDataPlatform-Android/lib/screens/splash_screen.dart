import 'package:flutter/material.dart';
import '../constants/app_theme.dart';
import '../services/storage_service.dart';
import 'login_screen.dart';
import 'supervisor/supervisor_home_screen.dart';
import 'member/member_home_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkExistingSession();
  }

  Future<void> _checkExistingSession() async {
    await Future.delayed(const Duration(milliseconds: 1400));
    if (!mounted) return;

    final token = StorageService.getAuthToken();
    final user = StorageService.getUserProfile();

    if (token != null && user != null) {
      if (user.isSupervisor) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const SupervisorHomeScreen()),
        );
        return;
      } else if (user.isTeamMember) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const MemberHomeScreen()),
        );
        return;
      }
    }

    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.slateDark,
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 88,
                height: 88,
                decoration: BoxDecoration(
                  color: AppTheme.primary,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.primary.withValues(alpha: 0.4),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.hub_rounded,
                  size: 48,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                AppTheme.appName,
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  color: Colors.white,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.emeraldGreen.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppTheme.emeraldGreen.withValues(alpha: 0.4)),
                ),
                child: const Text(
                  AppTheme.appAuthor,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF38BDF8),
                  ),
                ),
              ),
              const SizedBox(height: 36),
              const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  valueColor: AlwaysStoppedAnimation<Color>(AppTheme.emeraldGreen),
                ),
              ),
              const SizedBox(height: 48),
              const Text(
                'Connected to Wasmer.io Cloud',
                style: TextStyle(fontSize: 12, color: Colors.white54),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
