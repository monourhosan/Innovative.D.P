class UserModel {
  final int id;
  final String userId;
  final String fullName;
  final String role; // 'SUPERVISOR' or 'TEAM_MEMBER' or 'ADMIN'
  final int? supervisorId;
  final String? plainPassword;

  UserModel({
    required this.id,
    required this.userId,
    required this.fullName,
    required this.role,
    this.supervisorId,
    this.plainPassword,
  });

  bool get isSupervisor => role.toUpperCase() == 'SUPERVISOR';
  bool get isTeamMember => role.toUpperCase() == 'TEAM_MEMBER';
  bool get isAdmin => role.toUpperCase() == 'ADMIN';

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as int? ?? 0,
      userId: json['user_id'] as String? ?? '',
      fullName: json['full_name'] as String? ?? '',
      role: (json['role'] as String? ?? 'TEAM_MEMBER').toUpperCase(),
      supervisorId: json['supervisor_id'] as int? ?? json['created_by'] as int?,
      plainPassword: json['plain_password'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'full_name': fullName,
      'role': role,
      'supervisor_id': supervisorId,
      'plain_password': plainPassword,
    };
  }
}
