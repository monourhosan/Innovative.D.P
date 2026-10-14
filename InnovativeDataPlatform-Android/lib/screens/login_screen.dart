import 'package:flutter/material.dart';
import '../constants/app_theme.dart';
import '../services/api_service.dart';
import '../widgets/branding_banner.dart';
import 'server_settings_dialog.dart';
import 'supervisor/supervisor_home_screen.dart';
import 'member/member_home_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _userIdController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _userIdController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _fillCreds(String userId, String password) {
    setState(() {
      _userIdController.text = userId;
      _passwordController.text = password;
      _errorMessage = null;
    });
  }

  Future<void> _handleLogin() async {
    final userId = _userIdController.text.trim();
    final password = _passwordController.text.trim();

    if (userId.isEmpty || password.isEmpty) {
      setState(() {
        _errorMessage = 'Please enter both User ID and Password.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final res = await ApiService.login(userId, password);

    setState(() {
      _isLoading = false;
    });

    if (!mounted) return;

    if (res.success && res.data != null) {
      final user = res.data!;
      if (user.isSupervisor) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const SupervisorHomeScreen()),
        );
      } else {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const MemberHomeScreen()),
        );
      }
    } else {
      setState(() {
        _errorMessage = res.error ?? 'Invalid credentials. Please verify your User ID and Password.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.slateLight,
      appBar: AppBar(
        title: const Text('Innovative Data Platform'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_rounded),
            tooltip: 'Server Connection Settings',
            onPressed: () => ServerSettingsDialog.show(context),
          ),
        ],
      ),
      body: Column(
        children: [
          const BrandingBanner(),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 420),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const SizedBox(height: 12),
                      Center(
                        child: Container(
                          width: 64,
                          height: 64,
                          decoration: BoxDecoration(
                            color: AppTheme.primaryLight,
                            shape: BoxShape.circle,
                            border: Border.all(color: AppTheme.primary, width: 2),
                          ),
                          child: const Icon(Icons.lock_person_rounded, size: 34, color: AppTheme.primary),
                        ),
                      ),
                      const SizedBox(height: 14),
                      const Center(
                        child: Text(
                          'Unified App Login',
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                            color: AppTheme.slateDark,
                          ),
                        ),
                      ),
                      const Center(
                        child: Text(
                          'Supervisors and Team Members log in below',
                          style: TextStyle(fontSize: 13, color: AppTheme.slateGray),
                        ),
                      ),
                      const SizedBox(height: 24),

                      if (_errorMessage != null) ...[
                        Container(
                          padding: const EdgeInsets.all(12),
                          margin: const EdgeInsets.only(bottom: 16),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEF2F2),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFFFECACA)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.error_outline_rounded, color: Colors.red, size: 20),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  _errorMessage!,
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: Color(0xFF991B1B),
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],

                      // Input 1: User ID
                      TextField(
                        controller: _userIdController,
                        decoration: const InputDecoration(
                          labelText: 'User ID / Username',
                          hintText: 'e.g. SUP-1042 or TM-2001',
                          prefixIcon: Icon(Icons.badge_rounded, color: AppTheme.primary),
                        ),
                        textInputAction: TextInputAction.next,
                      ),
                      const SizedBox(height: 16),

                      // Input 2: Password
                      TextField(
                        controller: _passwordController,
                        obscureText: _obscurePassword,
                        decoration: InputDecoration(
                          labelText: 'Password',
                          hintText: 'Enter your password',
                          prefixIcon: const Icon(Icons.key_rounded, color: AppTheme.primary),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscurePassword ? Icons.visibility_off : Icons.visibility,
                              color: Colors.grey,
                            ),
                            onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                          ),
                        ),
                        textInputAction: TextInputAction.done,
                        onSubmitted: (_) => _handleLogin(),
                      ),
                      const SizedBox(height: 24),

                      // Submit Button
                      ElevatedButton(
                        onPressed: _isLoading ? null : _handleLogin,
                        child: _isLoading
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                              )
                            : const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text('Sign In to Platform'),
                                  SizedBox(width: 8),
                                  Icon(Icons.arrow_forward_rounded, size: 20),
                                ],
                              ),
                      ),
                      const SizedBox(height: 24),

                      // Demo Quick Fill Box
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppTheme.borderGray),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.bolt_rounded, size: 16, color: AppTheme.amber),
                                SizedBox(width: 4),
                                Text(
                                  'One-Tap Demo Credentials:',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.slateDark,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            InkWell(
                              onTap: () => _fillCreds('SUP-1042', 'supervisor123'),
                              borderRadius: BorderRadius.circular(6),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                margin: const EdgeInsets.only(bottom: 6),
                                decoration: BoxDecoration(
                                  color: AppTheme.primaryLight,
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: const Row(
                                  children: [
                                    Expanded(
                                      child: Text('👥 Supervisor: SUP-1042', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                    ),
                                    Text('Tap to Fill', style: TextStyle(fontSize: 11, color: AppTheme.primary)),
                                  ],
                                ),
                              ),
                            ),
                            InkWell(
                              onTap: () => _fillCreds('TM-2001', 'member123'),
                              borderRadius: BorderRadius.circular(6),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                decoration: BoxDecoration(
                                  color: AppTheme.emeraldGreenLight,
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: const Row(
                                  children: [
                                    Expanded(
                                      child: Text('📱 Team Member: TM-2001', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                    ),
                                    Text('Tap to Fill', style: TextStyle(fontSize: 11, color: AppTheme.emeraldGreenDark)),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          const BrandingBanner(isDark: true),
        ],
      ),
    );
  }
}
