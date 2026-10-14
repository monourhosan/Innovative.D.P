import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/user_model.dart';
import '../models/project_model.dart';
import 'storage_service.dart';

class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? error;

  ApiResponse({required this.success, this.data, this.error});
}

class ApiService {
  static String get baseUrl => StorageService.getBaseUrl();

  static Map<String, String> _headers() {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    final token = StorageService.getAuthToken();
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  /// Test Connection to Website (Hits /health)
  static Future<ApiResponse<Map<String, dynamic>>> testConnection([String? customUrl]) async {
    final targetUrl = customUrl ?? baseUrl;
    try {
      final res = await http.get(
        Uri.parse('$targetUrl/health'),
        headers: {'Accept': 'application/json'},
      ).timeout(const Duration(seconds: 6));

      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body) as Map<String, dynamic>;
        return ApiResponse(success: true, data: decoded);
      } else {
        return ApiResponse(success: false, error: 'Server returned HTTP ${res.statusCode}');
      }
    } catch (e) {
      return ApiResponse(success: false, error: 'Could not connect: $e');
    }
  }

  /// 1. Unified Login (POST /api/v1/auth/login)
  static Future<ApiResponse<UserModel>> login(String userId, String password) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/api/v1/auth/login'),
        headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
        body: jsonEncode({
          'user_id': userId.trim(),
          'password': password.trim(),
        }),
      ).timeout(const Duration(seconds: 10));

      final body = jsonDecode(res.body) as Map<String, dynamic>;

      if (res.statusCode == 200 && body['success'] == true) {
        final token = body['token'] as String;
        final user = UserModel.fromJson(body['user'] as Map<String, dynamic>);

        await StorageService.setAuthToken(token);
        await StorageService.setUserProfile(user);

        return ApiResponse(success: true, data: user);
      } else {
        return ApiResponse(
          success: false,
          error: body['error']?.toString() ?? 'Invalid User ID or Password.',
        );
      }
    } catch (e) {
      return ApiResponse(success: false, error: 'Network error: $e');
    }
  }

  /// 2. Supervisor Dashboard (GET /api/v1/supervisor/dashboard)
  static Future<ApiResponse<Map<String, dynamic>>> getSupervisorDashboard() async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/api/v1/supervisor/dashboard'),
        headers: _headers(),
      ).timeout(const Duration(seconds: 8));

      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (res.statusCode == 200 && body['success'] == true) {
        return ApiResponse(success: true, data: body);
      }
      return ApiResponse(success: false, error: body['error']?.toString() ?? 'Failed to load supervisor dashboard');
    } catch (e) {
      return ApiResponse(success: false, error: 'Connection error: $e');
    }
  }

  /// 3. Supervisor Team Members (GET /api/v1/supervisor/team-members)
  static Future<ApiResponse<List<UserModel>>> getSupervisorTeamMembers() async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/api/v1/supervisor/team-members'),
        headers: _headers(),
      ).timeout(const Duration(seconds: 8));

      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (res.statusCode == 200 && body['success'] == true) {
        final list = (body['team_members'] as List<dynamic>? ?? [])
            .map((item) => UserModel.fromJson(item as Map<String, dynamic>))
            .toList();
        return ApiResponse(success: true, data: list);
      }
      return ApiResponse(success: false, error: body['error']?.toString() ?? 'Failed to load team members');
    } catch (e) {
      return ApiResponse(success: false, error: 'Connection error: $e');
    }
  }

  /// 4. Add Team Member (POST /api/v1/supervisor/team-members)
  static Future<ApiResponse<UserModel>> createTeamMember({
    required String fullName,
    required String userId,
    required String password,
  }) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/api/v1/supervisor/team-members'),
        headers: _headers(),
        body: jsonEncode({
          'full_name': fullName.trim(),
          'user_id': userId.trim(),
          'password': password.trim(),
        }),
      ).timeout(const Duration(seconds: 10));

      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (res.statusCode == 201 && body['success'] == true) {
        final member = UserModel.fromJson(body['team_member'] as Map<String, dynamic>);
        return ApiResponse(success: true, data: member);
      }
      return ApiResponse(success: false, error: body['error']?.toString() ?? 'Failed to create team member');
    } catch (e) {
      return ApiResponse(success: false, error: 'Connection error: $e');
    }
  }

  /// 5. Member Projects (GET /api/v1/member/projects)
  static Future<ApiResponse<List<ProjectModel>>> getMemberProjects() async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/api/v1/member/projects'),
        headers: _headers(),
      ).timeout(const Duration(seconds: 8));

      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (res.statusCode == 200 && body['success'] == true) {
        final rawList = body['projects'] as List<dynamic>? ?? [];
        final projects = rawList
            .map((item) => ProjectModel.fromJson(item as Map<String, dynamic>))
            .toList();

        // Cache projects for offline field use
        await StorageService.setCachedProjects(projects);

        return ApiResponse(success: true, data: projects);
      }
      return ApiResponse(success: false, error: body['error']?.toString() ?? 'Failed to load projects');
    } catch (e) {
      // Return cached projects if offline
      final cached = StorageService.getCachedProjects();
      if (cached.isNotEmpty) {
        return ApiResponse(success: true, data: cached);
      }
      return ApiResponse(success: false, error: 'Offline - No cached projects available: $e');
    }
  }

  /// 6. Member Form Submission (POST /api/v1/member/submissions)
  static Future<ApiResponse<int>> submitForm({
    required int projectId,
    required Map<String, dynamic> answers,
    required String clientTimestamp,
  }) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/api/v1/member/submissions'),
        headers: _headers(),
        body: jsonEncode({
          'project_id': projectId,
          'answers_json': answers,
          'client_timestamp': clientTimestamp,
        }),
      ).timeout(const Duration(seconds: 10));

      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if ((res.statusCode == 200 || res.statusCode == 201) && body['success'] == true) {
        return ApiResponse(success: true, data: 1);
      }
      return ApiResponse(success: false, error: body['error']?.toString() ?? 'Submission rejected');
    } catch (e) {
      return ApiResponse(success: false, error: 'Connection failure: $e');
    }
  }

  /// 7. Member Dashboard (GET /api/v1/member/dashboard)
  static Future<ApiResponse<Map<String, dynamic>>> getMemberDashboard() async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/api/v1/member/dashboard'),
        headers: _headers(),
      ).timeout(const Duration(seconds: 8));

      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (res.statusCode == 200 && body['success'] == true) {
        return ApiResponse(success: true, data: body);
      }
      return ApiResponse(success: false, error: body['error']?.toString() ?? 'Failed to load member stats');
    } catch (e) {
      return ApiResponse(success: false, error: 'Connection error: $e');
    }
  }
}
