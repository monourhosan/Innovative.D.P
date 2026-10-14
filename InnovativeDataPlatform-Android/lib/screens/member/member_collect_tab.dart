import 'package:flutter/material.dart';
import '../../constants/app_theme.dart';
import '../../models/project_model.dart';
import '../../services/api_service.dart';
import '../../widgets/live_connection_badge.dart';
import 'dynamic_form_screen.dart';

class MemberCollectTab extends StatefulWidget {
  const MemberCollectTab({super.key});

  @override
  State<MemberCollectTab> createState() => _MemberCollectTabState();
}

class _MemberCollectTabState extends State<MemberCollectTab> {
  bool _isLoading = true;
  bool _isConnected = true;
  List<ProjectModel> _projects = [];

  @override
  void initState() {
    super.initState();
    _fetchProjects();
  }

  Future<void> _fetchProjects() async {
    setState(() => _isLoading = true);
    final res = await ApiService.getMemberProjects();

    if (!mounted) return;

    setState(() {
      _isLoading = false;
      _isConnected = res.success;
      if (res.data != null) {
        _projects = res.data!;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchProjects,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  LiveConnectionBadge(
                    isConnected: _isConnected,
                    onRefresh: _fetchProjects,
                  ),

                  const Text(
                    'Step 1: Select Survey Project',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: AppTheme.slateDark,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Projects assigned to your Supervisor by the Admin on the website.',
                    style: TextStyle(fontSize: 13, color: AppTheme.slateGray),
                  ),
                  const SizedBox(height: 16),

                  if (_projects.isEmpty) ...[
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(32.0),
                        child: Column(
                          children: [
                            const Icon(Icons.assignment_late_outlined, size: 48, color: Colors.grey),
                            const SizedBox(height: 12),
                            const Text(
                              'No Active Projects Assigned',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 6),
                            const Text(
                              'Please contact your Supervisor to assign you to an active .xlsx project.',
                              textAlign: TextAlign.center,
                              style: TextStyle(fontSize: 13, color: AppTheme.slateGray),
                            ),
                            const SizedBox(height: 16),
                            OutlinedButton.icon(
                              onPressed: _fetchProjects,
                              icon: const Icon(Icons.refresh_rounded),
                              label: const Text('Check for New Projects'),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ] else ...[
                    ..._projects.map((proj) {
                      final questionCount = proj.formSchema.fields.length;
                      return Card(
                        margin: const EdgeInsets.only(bottom: 14),
                        child: Padding(
                          padding: const EdgeInsets.all(18.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: AppTheme.primaryLight,
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: const Icon(Icons.assignment_rounded, color: AppTheme.primary, size: 24),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          proj.title,
                                          style: const TextStyle(
                                            fontSize: 16,
                                            fontWeight: FontWeight.bold,
                                            color: AppTheme.slateDark,
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          '$questionCount Questions • ${proj.formSchema.modeLabel}',
                                          style: const TextStyle(fontSize: 12, color: AppTheme.primary, fontWeight: FontWeight.bold),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              if (proj.description.isNotEmpty) ...[
                                const SizedBox(height: 12),
                                Text(
                                  proj.description,
                                  style: const TextStyle(fontSize: 13, color: AppTheme.slateGray),
                                ),
                              ],
                              const SizedBox(height: 16),
                              ElevatedButton.icon(
                                onPressed: () async {
                                  final submitted = await Navigator.of(context).push<bool>(
                                    MaterialPageRoute(builder: (_) => DynamicFormScreen(project: proj)),
                                  );
                                  if (submitted == true) {
                                    _fetchProjects();
                                  }
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppTheme.primary,
                                  minimumSize: const Size.fromHeight(48),
                                ),
                                icon: const Icon(Icons.edit_note_rounded, size: 20),
                                label: const Text('Start Data Input'),
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
