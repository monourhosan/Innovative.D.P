import 'dart:convert';

class SubmissionModel {
  final int? id;
  final int projectId;
  final String projectTitle;
  final Map<String, dynamic> answers;
  final String clientTimestamp;
  final String? serverTimestamp;
  final bool isOfflineQueue;
  final String? teamMemberName;
  final String? teamMemberUserId;
  final String? supervisorName;

  SubmissionModel({
    this.id,
    required this.projectId,
    required this.projectTitle,
    required this.answers,
    required this.clientTimestamp,
    this.serverTimestamp,
    this.isOfflineQueue = false,
    this.teamMemberName,
    this.teamMemberUserId,
    this.supervisorName,
  });

  factory SubmissionModel.fromJson(Map<String, dynamic> json) {
    Map<String, dynamic> parsedAnswers = {};
    if (json['answers'] is Map<String, dynamic>) {
      parsedAnswers = json['answers'] as Map<String, dynamic>;
    } else if (json['answers_json'] is String) {
      try {
        parsedAnswers = jsonDecode(json['answers_json'] as String) as Map<String, dynamic>;
      } catch (_) {
        parsedAnswers = {};
      }
    } else if (json['answers_json'] is Map<String, dynamic>) {
      parsedAnswers = json['answers_json'] as Map<String, dynamic>;
    }

    return SubmissionModel(
      id: json['id'] as int?,
      projectId: json['project_id'] as int? ?? 0,
      projectTitle: json['project_title']?.toString() ?? 'Survey Submission',
      answers: parsedAnswers,
      clientTimestamp: json['client_timestamp']?.toString() ?? DateTime.now().toIso8601String(),
      serverTimestamp: json['server_timestamp']?.toString(),
      isOfflineQueue: json['is_offline_queue'] == true,
      teamMemberName: json['team_member_name']?.toString(),
      teamMemberUserId: json['team_member_user_id']?.toString(),
      supervisorName: json['supervisor_name']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'project_id': projectId,
    'project_title': projectTitle,
    'answers': answers,
    'client_timestamp': clientTimestamp,
    'server_timestamp': serverTimestamp,
    'is_offline_queue': isOfflineQueue,
    'team_member_name': teamMemberName,
    'team_member_user_id': teamMemberUserId,
    'supervisor_name': supervisorName,
  };
}
