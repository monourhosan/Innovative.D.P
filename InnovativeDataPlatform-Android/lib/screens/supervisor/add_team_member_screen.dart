import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import '../../constants/app_theme.dart';
import '../../models/user_model.dart';
import '../../services/api_service.dart';
import '../../services/storage_service.dart';

class AddTeamMemberScreen extends StatefulWidget {
  const AddTeamMemberScreen({super.key});

  @override
  State<AddTeamMemberScreen> createState() => _AddTeamMemberScreenState();
}

class _AddTeamMemberScreenState extends State<AddTeamMemberScreen> {
  final _fullNameController = TextEditingController();
  final _userIdController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _autoGenerateUserId();
    _autoGeneratePassword();
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _userIdController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _autoGenerateUserId() {
    final rand = 100 + Random().nextInt(900);
    setState(() {
      _userIdController.text = 'TM-$rand';
    });
  }

  void _autoGeneratePassword() {
    final rand = 1000 + Random().nextInt(9000);
    setState(() {
      _passwordController.text = 'pass$rand';
    });
  }

  Future<void> _handleCreate() async {
    final fullName = _fullNameController.text.trim();
    final userId = _userIdController.text.trim();
    final password = _passwordController.text.trim();

    if (fullName.isEmpty || userId.isEmpty || password.isEmpty) {
      setState(() {
        _errorMessage = 'All fields are required to create a team member account.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final res = await ApiService.createTeamMember(
      fullName: fullName,
      userId: userId,
      password: password,
    );

    setState(() {
      _isLoading = false;
    });

    if (!mounted) return;

    if (res.success && res.data != null) {
      _showCredentialSharingDialog(res.data!, password);
    } else {
      setState(() {
        _errorMessage = res.error ?? 'Failed to create team member.';
      });
    }
  }

  void _showCredentialSharingDialog(UserModel member, String rawPassword) {
    final serverUrl = StorageService.getBaseUrl();
    final shareMessage = '''
🌟 Innovative Data Platform (Made by Saif)
Team Member Login Credentials
━━━━━━━━━━━━━━━━━━━━━━
👤 Name: ${member.fullName}
🆔 User ID: ${member.userId}
🔑 Password: $rawPassword
🌐 Website: $serverUrl
━━━━━━━━━━━━━━━━━━━━━━
Log in using the Innovative Data Platform Android App to start data collection.
''';

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Row(
            children: [
              Icon(Icons.check_circle_rounded, color: AppTheme.emeraldGreen, size: 28),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Team Member Created!',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Share these login details with your Team Member so they can begin field data collection:',
                style: TextStyle(fontSize: 13, color: AppTheme.slateGray),
              ),
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppTheme.slateLight,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppTheme.borderGray),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('👤 Name: ${member.fullName}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    const SizedBox(height: 6),
                    Text('🆔 User ID: ${member.userId}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: AppTheme.primary, fontFamily: 'monospace')),
                    const SizedBox(height: 6),
                    Text('🔑 Password: $rawPassword', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: AppTheme.emeraldGreenDark, fontFamily: 'monospace')),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Button 1: Copy Credentials
              OutlinedButton.icon(
                onPressed: () {
                  Clipboard.setData(ClipboardData(text: shareMessage));
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('📋 Credentials copied to clipboard!'),
                      backgroundColor: AppTheme.primary,
                      duration: Duration(seconds: 2),
                    ),
                  );
                },
                icon: const Icon(Icons.copy_rounded, size: 18),
                label: const Text('Copy ID & Password'),
              ),
              const SizedBox(height: 8),

              // Button 2: Share via WhatsApp / SMS
              ElevatedButton.icon(
                onPressed: () {
                  SharePlus.instance.share(ShareParams(
                    text: shareMessage,
                    subject: 'Innovative Data Platform Credentials',
                  ));
                },
                style: ElevatedButton.styleFrom(backgroundColor: AppTheme.emeraldGreen),
                icon: const Icon(Icons.share_rounded, size: 18),
                label: const Text('Share via WhatsApp / SMS'),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(ctx).pop(); // Close dialog
                Navigator.of(context).pop(true); // Return to list and refresh
              },
              child: const Text('Done & Return to Team List', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Add New Team Member'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Create Enumerator Account',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppTheme.slateDark),
            ),
            const SizedBox(height: 4),
            const Text(
              'This user will be linked under your supervision on the website database.',
              style: TextStyle(fontSize: 13, color: AppTheme.slateGray),
            ),
            const SizedBox(height: 20),

            if (_errorMessage != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFFECACA)),
                ),
                child: Text(
                  _errorMessage!,
                  style: const TextStyle(fontSize: 12, color: Color(0xFF991B1B), fontWeight: FontWeight.bold),
                ),
              ),
            ],

            // 1. Team Member Full Name
            TextField(
              controller: _fullNameController,
              decoration: const InputDecoration(
                labelText: '1. Team Member Full Name',
                hintText: 'e.g. Rahim Ahmed',
                prefixIcon: Icon(Icons.person_rounded),
              ),
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: 16),

            // 2. User ID with Auto-Generate
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _userIdController,
                    decoration: const InputDecoration(
                      labelText: '2. User ID (Login Username)',
                      hintText: 'e.g. TM-205',
                      prefixIcon: Icon(Icons.badge_rounded),
                    ),
                    textInputAction: TextInputAction.next,
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filledTonal(
                  tooltip: 'Auto-Generate ID',
                  onPressed: _autoGenerateUserId,
                  icon: const Icon(Icons.auto_awesome_rounded),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // 3. Password with Auto-Generate
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _passwordController,
                    decoration: const InputDecoration(
                      labelText: '3. Password',
                      hintText: 'e.g. pass4829',
                      prefixIcon: Icon(Icons.key_rounded),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filledTonal(
                  tooltip: 'Auto-Generate Password',
                  onPressed: _autoGeneratePassword,
                  icon: const Icon(Icons.refresh_rounded),
                ),
              ],
            ),
            const SizedBox(height: 28),

            // Save Button
            ElevatedButton(
              onPressed: _isLoading ? null : _handleCreate,
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
              child: _isLoading
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                    )
                  : const Text('Create Account & Save to Website'),
            ),
          ],
        ),
      ),
    );
  }
}
