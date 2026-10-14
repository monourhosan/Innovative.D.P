import 'dart:async';
import '../models/submission_model.dart';
import 'api_service.dart';
import 'storage_service.dart';

class SyncResult {
  final int totalAttempted;
  final int totalSuccess;
  final int totalFailed;
  final String message;

  SyncResult({
    required this.totalAttempted,
    required this.totalSuccess,
    required this.totalFailed,
    required this.message,
  });
}

class OfflineSyncService {
  static bool _isSyncing = false;

  /// Submit form: Tries online first. If failed/offline, queues locally.
  static Future<Map<String, dynamic>> submitWithOfflineFallback({
    required int projectId,
    required String projectTitle,
    required Map<String, dynamic> answers,
  }) async {
    final clientTimestamp = DateTime.now().toIso8601String();

    // 1. Try sending directly to server
    final apiRes = await ApiService.submitForm(
      projectId: projectId,
      answers: answers,
      clientTimestamp: clientTimestamp,
    );

    if (apiRes.success) {
      return {
        'status': 'ONLINE_SUCCESS',
        'message': 'Data Sent to Website Successfully!',
      };
    }

    // 2. Offline fallback: Save in local phone queue
    final offlineSubmission = SubmissionModel(
      projectId: projectId,
      projectTitle: projectTitle,
      answers: answers,
      clientTimestamp: clientTimestamp,
      isOfflineQueue: true,
    );

    await StorageService.addOfflineSubmission(offlineSubmission);

    return {
      'status': 'OFFLINE_QUEUED',
      'message': 'Saved on Phone — Will Auto-Send to Website When Online',
    };
  }

  /// Synchronize all offline queued submissions to the website
  static Future<SyncResult> syncQueuedSubmissions() async {
    if (_isSyncing) {
      return SyncResult(
        totalAttempted: 0,
        totalSuccess: 0,
        totalFailed: 0,
        message: 'Sync already in progress...',
      );
    }

    _isSyncing = true;
    final queue = StorageService.getOfflineQueue();

    if (queue.isEmpty) {
      _isSyncing = false;
      return SyncResult(
        totalAttempted: 0,
        totalSuccess: 0,
        totalFailed: 0,
        message: 'No offline records waiting to sync.',
      );
    }

    int successCount = 0;
    int failedCount = 0;
    final remainingQueue = <SubmissionModel>[];

    for (final item in queue) {
      final res = await ApiService.submitForm(
        projectId: item.projectId,
        answers: item.answers,
        clientTimestamp: item.clientTimestamp,
      );

      if (res.success) {
        successCount++;
      } else {
        failedCount++;
        remainingQueue.add(item);
      }
    }

    // Update queue with only remaining failed items
    await StorageService.clearOfflineQueue();
    for (final item in remainingQueue) {
      await StorageService.addOfflineSubmission(item);
    }

    _isSyncing = false;

    return SyncResult(
      totalAttempted: queue.length,
      totalSuccess: successCount,
      totalFailed: failedCount,
      message: successCount > 0
          ? 'Synced $successCount records to website!'
          : 'Could not sync. Check internet connection.',
    );
  }
}
