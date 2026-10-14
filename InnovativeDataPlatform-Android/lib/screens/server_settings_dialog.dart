import 'package:flutter/material.dart';
import '../constants/app_theme.dart';
import '../services/storage_service.dart';
import '../services/api_service.dart';

class ServerSettingsDialog extends StatefulWidget {
  const ServerSettingsDialog({super.key});

  static Future<void> show(BuildContext context) {
    return showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const ServerSettingsDialog(),
    );
  }

  @override
  State<ServerSettingsDialog> createState() => _ServerSettingsDialogState();
}

class _ServerSettingsDialogState extends State<ServerSettingsDialog> {
  late final TextEditingController _urlController;
  bool _isTesting = false;
  String? _testResult;
  bool _isSuccess = false;

  @override
  void initState() {
    super.initState();
    _urlController = TextEditingController(text: StorageService.getBaseUrl());
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  Future<void> _testConnection() async {
    setState(() {
      _isTesting = true;
      _testResult = null;
    });

    final testUrl = _urlController.text.trim();
    final res = await ApiService.testConnection(testUrl);

    setState(() {
      _isTesting = false;
      _isSuccess = res.success;
      if (res.success && res.data != null) {
        final platform = res.data!['platform'] ?? 'Innovative Data Platform';
        final author = res.data!['author'] ?? 'Made by Saif';
        _testResult = '✅ Connected successfully!\n$platform — $author';
      } else {
        _testResult = '❌ Connection failed: ${res.error ?? 'Unknown error'}';
      }
    });
  }

  Future<void> _saveAndClose() async {
    final cleanUrl = _urlController.text.trim();
    if (cleanUrl.isNotEmpty) {
      await StorageService.setBaseUrl(cleanUrl);
    }
    if (mounted) Navigator.of(context).pop();
  }

  void _applyPreset(String presetUrl) {
    setState(() {
      _urlController.text = presetUrl;
      _testResult = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: const Row(
        children: [
          Icon(Icons.settings_rounded, color: AppTheme.primary),
          SizedBox(width: 8),
          Text(
            'Server Connection Settings',
            style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
          ),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Specify your Wasmer.io website or local API endpoint:',
              style: TextStyle(fontSize: 13, color: AppTheme.slateGray),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _urlController,
              decoration: const InputDecoration(
                labelText: 'Website Server URL',
                hintText: 'https://your-domain.wasmer.app',
                prefixIcon: Icon(Icons.link_rounded),
              ),
              keyboardType: TextInputType.url,
            ),
            const SizedBox(height: 12),
            const Text(
              'Quick Presets:',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.slateGray),
            ),
            const SizedBox(height: 6),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                ActionChip(
                  label: const Text('☁️ Wasmer.io Cloud', style: TextStyle(fontSize: 11)),
                  onPressed: () => _applyPreset('https://innovative-data-platform.wasmer.app'),
                ),
                ActionChip(
                  label: const Text('📱 Android Emulator (10.0.2.2)', style: TextStyle(fontSize: 11)),
                  onPressed: () => _applyPreset('http://10.0.2.2:3000'),
                ),
                ActionChip(
                  label: const Text('💻 Localhost (3000)', style: TextStyle(fontSize: 11)),
                  onPressed: () => _applyPreset('http://localhost:3000'),
                ),
              ],
            ),
            const SizedBox(height: 14),
            OutlinedButton.icon(
              onPressed: _isTesting ? null : _testConnection,
              icon: _isTesting
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.wifi_tethering_rounded, size: 18),
              label: Text(_isTesting ? 'Testing Connection...' : 'Test Connection to Website'),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(44),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
            if (_testResult != null) ...[
              const SizedBox(height: 10),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: _isSuccess ? AppTheme.emeraldGreenLight : const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: _isSuccess ? const Color(0xFFA7F3D0) : const Color(0xFFFECACA),
                  ),
                ),
                child: Text(
                  _testResult!,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: _isSuccess ? const Color(0xFF065F46) : const Color(0xFF991B1B),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: _saveAndClose,
          style: ElevatedButton.styleFrom(
            minimumSize: const Size(100, 42),
            backgroundColor: AppTheme.primary,
          ),
          child: const Text('Save & Apply'),
        ),
      ],
    );
  }
}
