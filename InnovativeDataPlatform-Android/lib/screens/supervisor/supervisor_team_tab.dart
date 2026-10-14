import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import '../../constants/app_theme.dart';
import '../../models/user_model.dart';
import '../../services/api_service.dart';
import '../../services/storage_service.dart';
import 'add_team_member_screen.dart';

class SupervisorTeamTab extends StatefulWidget {
  const SupervisorTeamTab({super.key});

  @override
  State<SupervisorTeamTab> createState() => _SupervisorTeamTabState();
}

class _SupervisorTeamTabState extends State<SupervisorTeamTab> {
  bool _isLoading = true;
  List<UserModel> _teamMembers = [];

  @override
  void initState() {
    super.initState();
    _fetchTeamMembers();
  }

  Future<void> _fetchTeamMembers() async {
    setState(() => _isLoading = true);
    final res = await ApiService.getSupervisorTeamMembers();

    if (!mounted) return;

    setState(() {
      _isLoading = false;
      if (res.success && res.data != null) {
        _teamMembers = res.data!;
      }
    });
  }

  void _shareCredentials(UserModel member) {
    final serverUrl = StorageService.getBaseUrl();
    final pass = member.plainPassword ?? 'assigned password';
    final msg = '''
🌟 Innovative Data Platform (Made by Saif)
Team Member Login Credentials
━━━━━━━━━━━━━━━━━━━━━━
👤 Name: ${member.fullName}
🆔 User ID: ${member.userId}
🔑 Password: $pass
🌐 Website: $serverUrl
━━━━━━━━━━━━━━━━━━━━━━
''';

    SharePlus.instance.share(ShareParams(
      text: msg,
      subject: 'Innovative Data Platform Credentials',
    ));
  }

  void _copyCredentials(UserModel member) {
    final serverUrl = StorageService.getBaseUrl();
    final pass = member.plainPassword ?? 'assigned password';
    final msg = '''
🌟 Innovative Data Platform (Made by Saif)
Team Member Login Credentials
👤 Name: ${member.fullName}
🆔 User ID: ${member.userId}
🔑 Password: $pass
🌐 Website: $serverUrl
''';

    Clipboard.setData(ClipboardData(text: msg));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('📋 Credentials copied to clipboard!'),
        backgroundColor: AppTheme.primary,
        duration: Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchTeamMembers,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Big Action Button: + Add New Team Member
                  ElevatedButton.icon(
                    onPressed: () async {
                      final created = await Navigator.of(context).push<bool>(
                        MaterialPageRoute(builder: (_) => const AddTeamMemberScreen()),
                      );
                      if (created == true) {
                        _fetchTeamMembers();
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      minimumSize: const Size.fromHeight(56),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    icon: const Icon(Icons.person_add_alt_1_rounded, size: 24),
                    label: const Text(
                      '+ Add New Team Member',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
                    ),
                  ),
                  const SizedBox(height: 18),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Team Members (${_teamMembers.length})',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.slateDark),
                      ),
                      IconButton(
                        icon: const Icon(Icons.refresh_rounded, size: 20),
                        onPressed: _fetchTeamMembers,
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  if (_teamMembers.isEmpty) ...[
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(32.0),
                        child: Column(
                          children: [
                            const Icon(Icons.group_off_rounded, size: 48, color: Colors.grey),
                            const SizedBox(height: 12),
                            const Text(
                              'No Team Members Found',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Tap the button above to create and send credentials to your enumerators.',
                              textAlign: TextAlign.center,
                              style: TextStyle(fontSize: 13, color: AppTheme.slateGray),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ] else ...[
                    ..._teamMembers.map((tm) {
                      return Card(
                        margin: const EdgeInsets.only(bottom: 10),
                        child: Padding(
                          padding: const EdgeInsets.all(14.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  CircleAvatar(
                                    backgroundColor: AppTheme.primaryLight,
                                    child: Text(
                                      tm.fullName.isNotEmpty ? tm.fullName[0].toUpperCase() : 'T',
                                      style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primary),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          tm.fullName,
                                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                        ),
                                        Text(
                                          'User ID: ${tm.userId}',
                                          style: const TextStyle(
                                            fontFamily: 'monospace',
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                            color: AppTheme.primary,
                                          ),
                                        ),
                                        if (tm.plainPassword != null)
                                          Text(
                                            'Password: ${tm.plainPassword}',
                                            style: const TextStyle(
                                              fontFamily: 'monospace',
                                              fontSize: 12,
                                              color: AppTheme.emeraldGreenDark,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              const Divider(height: 1),
                              const SizedBox(height: 8),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  TextButton.icon(
                                    onPressed: () => _copyCredentials(tm),
                                    icon: const Icon(Icons.copy_rounded, size: 16),
                                    label: const Text('Copy ID & Pass'),
                                  ),
                                  const SizedBox(width: 8),
                                  ElevatedButton.icon(
                                    onPressed: () => _shareCredentials(tm),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppTheme.emeraldGreen,
                                      minimumSize: const Size(120, 38),
                                    ),
                                    icon: const Icon(Icons.share_rounded, size: 16),
                                    label: const Text('Share (SMS/WhatsApp)', style: TextStyle(fontSize: 12)),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    }),
                  ],
                ],
              ),
            ),
    );
  }
}
