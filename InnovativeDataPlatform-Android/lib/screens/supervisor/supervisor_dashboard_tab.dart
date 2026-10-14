import 'dart:async';
import 'package:flutter/material.dart';
import '../../constants/app_theme.dart';
import '../../services/api_service.dart';
import '../../widgets/live_connection_badge.dart';
import '../../widgets/stat_card.dart';

class SupervisorDashboardTab extends StatefulWidget {
  const SupervisorDashboardTab({super.key});

  @override
  State<SupervisorDashboardTab> createState() => _SupervisorDashboardTabState();
}

class _SupervisorDashboardTabState extends State<SupervisorDashboardTab> {
  Timer? _pollTimer;
  bool _isLoading = true;
  bool _isConnected = true;
  Map<String, dynamic>? _dashboardData;
  List<dynamic> _teamMembers = [];
  List<dynamic> _recentFeed = [];

  @override
  void initState() {
    super.initState();
    _fetchDashboard();
    // Poll every 5 seconds for live real-time updates as requested in Section 3
    _pollTimer = Timer.periodic(const Duration(seconds: 5), (_) => _fetchDashboard(silent: true));
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchDashboard({bool silent = false}) async {
    if (!silent) setState(() => _isLoading = true);

    final res = await ApiService.getSupervisorDashboard();

    if (!mounted) return;

    if (res.success && res.data != null) {
      setState(() {
        _isConnected = true;
        _isLoading = false;
        _dashboardData = res.data;
        _teamMembers = res.data!['team_members'] as List<dynamic>? ?? [];
        _recentFeed = res.data!['recent_feed'] as List<dynamic>? ?? [];
      });
    } else {
      setState(() {
        _isConnected = false;
        _isLoading = false;
      });
    }
  }

  void _showMemberSubmissions(Map<String, dynamic> member) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        final memberName = member['full_name'] ?? 'Team Member';
        final memberUserId = member['user_id'] ?? '';
        final memberId = member['id'];

        // Filter recent feed for this member
        final memberSubmissions = _recentFeed.where((item) => item['team_member_id'] == memberId).toList();

        return DraggableScrollableSheet(
          initialChildSize: 0.6,
          maxChildSize: 0.9,
          minChildSize: 0.4,
          expand: false,
          builder: (_, scrollController) {
            return Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            memberName,
                            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                          Text(
                            'User ID: $memberUserId',
                            style: const TextStyle(fontSize: 12, color: AppTheme.slateGray, fontFamily: 'monospace'),
                          ),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const Divider(height: 24),
                  const Text(
                    'Recent Submissions Sent to Website:',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.primary),
                  ),
                  const SizedBox(height: 8),
                  if (memberSubmissions.isEmpty) ...[
                    const Expanded(
                      child: Center(
                        child: Text(
                          'No recent submissions in current feed for this member.',
                          style: TextStyle(color: AppTheme.slateGray, fontSize: 13),
                        ),
                      ),
                    ),
                  ] else ...[
                    Expanded(
                      child: ListView.builder(
                        controller: scrollController,
                        itemCount: memberSubmissions.length,
                        itemBuilder: (_, idx) {
                          final sub = memberSubmissions[idx];
                          final projectTitle = sub['project_title'] ?? 'Survey';
                          final timestamp = sub['server_timestamp'] ?? sub['client_timestamp'] ?? '';
                          final answers = sub['answers'] as Map<String, dynamic>? ?? {};

                          return Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: Padding(
                              padding: const EdgeInsets.all(12.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        projectTitle,
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                      ),
                                      const Text(
                                        '✓ Sent',
                                        style: TextStyle(color: AppTheme.emeraldGreenDark, fontWeight: FontWeight.bold, fontSize: 11),
                                      ),
                                    ],
                                  ),
                                  Text(
                                    timestamp,
                                    style: const TextStyle(fontSize: 11, color: Colors.grey),
                                  ),
                                  const SizedBox(height: 6),
                                  Wrap(
                                    spacing: 6,
                                    runSpacing: 4,
                                    children: answers.entries.take(4).map((e) {
                                      return Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: AppTheme.slateLight,
                                          borderRadius: BorderRadius.circular(4),
                                          border: Border.all(color: AppTheme.borderGray),
                                        ),
                                        child: Text(
                                          '${e.key}: ${e.value}',
                                          style: const TextStyle(fontSize: 11),
                                        ),
                                      );
                                    }).toList(),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    final stats = _dashboardData?['stats'] as Map<String, dynamic>? ?? {};
    final totalTeamMembers = stats['total_team_members'] ?? _teamMembers.length;
    final submissionsToday = stats['submissions_today'] ?? 0;
    final totalSubmissions = stats['total_submissions'] ?? 0;

    return RefreshIndicator(
      onRefresh: () => _fetchDashboard(),
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          LiveConnectionBadge(
            isConnected: _isConnected,
            onRefresh: () => _fetchDashboard(),
          ),

          // Big Summary Cards (Section 5 Tab 1)
          StatCard(
            label: 'Total Team Members',
            value: '$totalTeamMembers',
            subtext: 'Active field enumerators',
            icon: Icons.groups_rounded,
            iconColor: AppTheme.primary,
            iconBgColor: AppTheme.primaryLight,
          ),
          const SizedBox(height: 8),

          StatCard(
            label: "Today's Data Input",
            value: '$submissionsToday',
            subtext: 'Live count across team today',
            icon: Icons.today_rounded,
            iconColor: AppTheme.emeraldGreen,
            iconBgColor: AppTheme.emeraldGreenLight,
          ),
          const SizedBox(height: 8),

          StatCard(
            label: 'Total Data Sent to Website',
            value: '$totalSubmissions',
            subtext: 'All-time team submissions',
            icon: Icons.cloud_done_rounded,
            iconColor: const Color(0xFF7C3AED),
            iconBgColor: const Color(0xFFF5F3FF),
          ),
          const SizedBox(height: 18),

          // Section Title
          const Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Live Team Member Monitoring',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.slateDark,
                ),
              ),
              Text(
                'Tap to inspect',
                style: TextStyle(fontSize: 11, color: AppTheme.slateGray),
              ),
            ],
          ),
          const SizedBox(height: 8),

          if (_teamMembers.isEmpty) ...[
            Card(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  children: [
                    const Icon(Icons.person_add_alt_1_rounded, size: 40, color: Colors.grey),
                    const SizedBox(height: 8),
                    const Text(
                      'No Team Members Added Yet',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Switch to "Manage Team" tab to add enumerators.',
                      style: TextStyle(fontSize: 12, color: AppTheme.slateGray),
                    ),
                  ],
                ),
              ),
            ),
          ] else ...[
            ..._teamMembers.map((tm) {
              final fullName = tm['full_name'] ?? 'Enumerator';
              final userId = tm['user_id'] ?? '';
              final totalSub = tm['total_submissions'] ?? 0;
              final todaySub = tm['submissions_today'] ?? 0;
              final lastActive = tm['last_submission'] ?? 'No submissions yet';

              return Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: InkWell(
                  onTap: () => _showMemberSubmissions(tm as Map<String, dynamic>),
                  borderRadius: BorderRadius.circular(12),
                  child: Padding(
                    padding: const EdgeInsets.all(14.0),
                    child: Row(
                      children: [
                        CircleAvatar(
                          backgroundColor: AppTheme.primaryLight,
                          child: Text(
                            fullName.isNotEmpty ? fullName[0].toUpperCase() : 'T',
                            style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                fullName,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                              ),
                              Text(
                                'ID: $userId',
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: AppTheme.primary,
                                  fontFamily: 'monospace',
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Last: $lastActive',
                                style: const TextStyle(fontSize: 11, color: Colors.grey),
                              ),
                            ],
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              '$totalSub records',
                              style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: AppTheme.slateDark),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppTheme.emeraldGreenLight,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                '+$todaySub today',
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.emeraldGreenDark,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const Icon(Icons.chevron_right_rounded, color: Colors.grey),
                      ],
                    ),
                  ),
                ),
              );
            }),
          ],
        ],
      ),
    );
  }
}
