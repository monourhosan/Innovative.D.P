import 'dart:async';
import 'package:flutter/material.dart';
import '../../constants/app_theme.dart';
import '../../models/submission_model.dart';
import '../../services/api_service.dart';
import '../../services/offline_sync_service.dart';
import '../../services/storage_service.dart';
import '../../widgets/live_connection_badge.dart';
import '../../widgets/stat_card.dart';

class MemberDashboardTab extends StatefulWidget {
  const MemberDashboardTab({super.key});

  @override
  State<MemberDashboardTab> createState() => _MemberDashboardTabState();
}

class _MemberDashboardTabState extends State<MemberDashboardTab> {
  Timer? _pollTimer;
  bool _isLoading = true;
  bool _isConnected = true;
  bool _isSyncing = false;
  int _todayCount = 0;
  int _totalCount = 0;
  List<dynamic> _recentSubmissions = [];
  List<SubmissionModel> _offlineQueue = [];

  @override
  void initState() {
    super.initState();
    _refreshStats();
    // Poll every 5 seconds for live real-time sync
    _pollTimer = Timer.periodic(const Duration(seconds: 5), (_) => _refreshStats(silent: true));
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  Future<void> _refreshStats({bool silent = false}) async {
    if (!silent) setState(() => _isLoading = true);

    // Refresh offline queue
    _offlineQueue = StorageService.getOfflineQueue();

    // Auto-sync offline queue if we have items
    if (_offlineQueue.isNotEmpty && !_isSyncing) {
      _autoSyncOfflineQueue();
    }

    final res = await ApiService.getMemberDashboard();

    if (!mounted) return;

    if (res.success && res.data != null) {
      final stats = res.data!['stats'] as Map<String, dynamic>? ?? {};
      setState(() {
        _isConnected = true;
        _isLoading = false;
        _todayCount = stats['today_count'] as int? ?? 0;
        _totalCount = stats['total_count'] as int? ?? 0;
        _recentSubmissions = res.data!['recent_submissions'] as List<dynamic>? ?? [];
      });
    } else {
      setState(() {
        _isConnected = false;
        _isLoading = false;
      });
    }
  }

  Future<void> _autoSyncOfflineQueue() async {
    final result = await OfflineSyncService.syncQueuedSubmissions();
    if (result.totalSuccess > 0 && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('⚡ Auto-Synced ${result.totalSuccess} offline forms to website!'),
          backgroundColor: AppTheme.emeraldGreenDark,
          duration: const Duration(seconds: 2),
        ),
      );
    }
    if (mounted) {
      setState(() {
        _offlineQueue = StorageService.getOfflineQueue();
      });
    }
  }

  Future<void> _manualSyncNow() async {
    setState(() => _isSyncing = true);
    final result = await OfflineSyncService.syncQueuedSubmissions();
    setState(() => _isSyncing = false);

    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(result.message),
        backgroundColor: result.totalSuccess > 0 ? AppTheme.emeraldGreenDark : Colors.orange,
      ),
    );

    _refreshStats();
  }

  void _showSubmissionDetails(Map<String, dynamic> sub) {
    final projectTitle = sub['project_title'] ?? 'Form Submission';
    final timestamp = sub['server_timestamp'] ?? sub['client_timestamp'] ?? '';
    final answers = sub['answers'] as Map<String, dynamic>? ?? {};

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(projectTitle, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text(timestamp, style: const TextStyle(fontSize: 11, color: Colors.grey)),
          ],
        ),
        content: SizedBox(
          width: double.maxFinite,
          child: ListView(
            shrinkWrap: true,
            children: answers.entries.map((e) {
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                margin: const EdgeInsets.only(bottom: 6),
                decoration: BoxDecoration(
                  color: AppTheme.slateLight,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: AppTheme.borderGray),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      e.key,
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.primary),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      e.value.toString(),
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return RefreshIndicator(
      onRefresh: () => _refreshStats(),
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          LiveConnectionBadge(
            isConnected: _isConnected,
            onRefresh: () => _refreshStats(),
          ),

          // 1. Today's Data Input
          StatCard(
            label: 'My Data Input Today',
            value: '$_todayCount',
            subtext: 'Live count synced with website',
            icon: Icons.today_rounded,
            iconColor: AppTheme.emeraldGreen,
            iconBgColor: AppTheme.emeraldGreenLight,
          ),
          const SizedBox(height: 8),

          // 2. Total Data Sent
          StatCard(
            label: 'My Total Data Sent to Website',
            value: '$_totalCount',
            subtext: 'Verified records in database',
            icon: Icons.cloud_done_rounded,
            iconColor: AppTheme.primary,
            iconBgColor: AppTheme.primaryLight,
          ),
          const SizedBox(height: 8),

          // 3. Waiting to Sync (Offline Queue)
          StatCard(
            label: 'Waiting to Sync (Offline)',
            value: '${_offlineQueue.length}',
            subtext: _offlineQueue.isEmpty ? 'All forms uploaded' : 'Will auto-sync when online',
            icon: Icons.offline_pin_rounded,
            iconColor: _offlineQueue.isEmpty ? AppTheme.slateGray : AppTheme.amber,
            iconBgColor: _offlineQueue.isEmpty ? const Color(0xFFF1F5F9) : AppTheme.amberLight,
          ),

          if (_offlineQueue.isNotEmpty) ...[
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: _isSyncing ? null : _manualSyncNow,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.amber,
                minimumSize: const Size.fromHeight(48),
              ),
              icon: _isSyncing
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Icon(Icons.sync_rounded),
              label: Text(_isSyncing ? 'Syncing to Website...' : 'Sync ${_offlineQueue.length} Offline Records Now'),
            ),
          ],
          const SizedBox(height: 20),

          const Text(
            'My Recent Submissions',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AppTheme.slateDark,
            ),
          ),
          const SizedBox(height: 8),

          if (_recentSubmissions.isEmpty) ...[
            Card(
              child: Padding(
                padding: const EdgeInsets.all(28.0),
                child: Column(
                  children: [
                    const Icon(Icons.history_rounded, size: 40, color: Colors.grey),
                    const SizedBox(height: 8),
                    const Text('No Submissions Yet', style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    const Text(
                      'Go to the "Collect Data" tab to start your first survey entry.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 12, color: AppTheme.slateGray),
                    ),
                  ],
                ),
              ),
            ),
          ] else ...[
            ..._recentSubmissions.map((sub) {
              final projectTitle = sub['project_title'] ?? 'Survey';
              final timestamp = sub['server_timestamp'] ?? sub['client_timestamp'] ?? '';

              return Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppTheme.emeraldGreenLight,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.check_rounded, color: AppTheme.emeraldGreen, size: 20),
                  ),
                  title: Text(
                    projectTitle,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  subtitle: Text(
                    timestamp,
                    style: const TextStyle(fontSize: 11, color: Colors.grey),
                  ),
                  trailing: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Sent to Website',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.emeraldGreenDark,
                        ),
                      ),
                      SizedBox(width: 4),
                      Icon(Icons.chevron_right, size: 18, color: Colors.grey),
                    ],
                  ),
                  onTap: () => _showSubmissionDetails(sub as Map<String, dynamic>),
                ),
              );
            }),
          ],
        ],
      ),
    );
  }
}
