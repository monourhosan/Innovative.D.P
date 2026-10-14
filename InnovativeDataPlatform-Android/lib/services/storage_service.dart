import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';
import '../models/project_model.dart';
import '../models/submission_model.dart';
import '../constants/app_theme.dart';

class StorageService {
  static const String _keyBaseUrl = 'key_base_url';
  static const String _keyAuthToken = 'key_auth_token';
  static const String _keyUserProfile = 'key_user_profile';
  static const String _keyOfflineQueue = 'key_offline_queue';
  static const String _keyCachedProjects = 'key_cached_projects';

  static SharedPreferences? _prefs;

  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  // Base URL (Configurable Server Settings)
  static String getBaseUrl() {
    return _prefs?.getString(_keyBaseUrl) ?? AppTheme.defaultServerUrl;
  }

  static Future<void> setBaseUrl(String url) async {
    String cleanUrl = url.trim();
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.substring(0, cleanUrl.length - 1);
    }
    await _prefs?.setString(_keyBaseUrl, cleanUrl);
  }

  // Auth Token
  static String? getAuthToken() {
    return _prefs?.getString(_keyAuthToken);
  }

  static Future<void> setAuthToken(String token) async {
    await _prefs?.setString(_keyAuthToken, token);
  }

  // User Profile
  static UserModel? getUserProfile() {
    final raw = _prefs?.getString(_keyUserProfile);
    if (raw == null) return null;
    try {
      final map = jsonDecode(raw) as Map<String, dynamic>;
      return UserModel.fromJson(map);
    } catch (_) {
      return null;
    }
  }

  static Future<void> setUserProfile(UserModel user) async {
    await _prefs?.setString(_keyUserProfile, jsonEncode(user.toJson()));
  }

  // Offline Submissions Queue
  static List<SubmissionModel> getOfflineQueue() {
    final rawList = _prefs?.getStringList(_keyOfflineQueue) ?? [];
    return rawList.map((item) {
      try {
        final map = jsonDecode(item) as Map<String, dynamic>;
        return SubmissionModel.fromJson(map);
      } catch (_) {
        return null;
      }
    }).whereType<SubmissionModel>().toList();
  }

  static Future<void> addOfflineSubmission(SubmissionModel submission) async {
    final currentList = _prefs?.getStringList(_keyOfflineQueue) ?? [];
    currentList.add(jsonEncode(submission.toJson()));
    await _prefs?.setStringList(_keyOfflineQueue, currentList);
  }

  static Future<void> removeOfflineSubmission(int index) async {
    final currentList = _prefs?.getStringList(_keyOfflineQueue) ?? [];
    if (index >= 0 && index < currentList.length) {
      currentList.removeAt(index);
      await _prefs?.setStringList(_keyOfflineQueue, currentList);
    }
  }

  static Future<void> clearOfflineQueue() async {
    await _prefs?.remove(_keyOfflineQueue);
  }

  // Cached Projects (Offline-First Forms)
  static List<ProjectModel> getCachedProjects() {
    final rawList = _prefs?.getStringList(_keyCachedProjects) ?? [];
    return rawList.map((item) {
      try {
        final map = jsonDecode(item) as Map<String, dynamic>;
        return ProjectModel.fromJson(map);
      } catch (_) {
        return null;
      }
    }).whereType<ProjectModel>().toList();
  }

  static Future<void> setCachedProjects(List<ProjectModel> projects) async {
    final serialized = projects.map((p) => jsonEncode(p.toJson())).toList();
    await _prefs?.setStringList(_keyCachedProjects, serialized);
  }

  // Clear Session on Logout
  static Future<void> clearSession() async {
    await _prefs?.remove(_keyAuthToken);
    await _prefs?.remove(_keyUserProfile);
  }
}
