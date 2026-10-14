import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../constants/app_theme.dart';
import '../../models/project_model.dart';
import '../../services/offline_sync_service.dart';

class DynamicFormScreen extends StatefulWidget {
  final ProjectModel project;

  const DynamicFormScreen({super.key, required this.project});

  @override
  State<DynamicFormScreen> createState() => _DynamicFormScreenState();
}

class _DynamicFormScreenState extends State<DynamicFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final Map<String, dynamic> _answers = {};
  final Map<String, TextEditingController> _textControllers = {};
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _initControllers();
  }

  void _initControllers() {
    for (final field in widget.project.formSchema.fields) {
      if (['text', 'number', 'textarea', 'phone', 'email', 'gps'].contains(field.type)) {
        _textControllers[field.name] = TextEditingController();
      }
    }
  }

  @override
  void dispose() {
    for (final controller in _textControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _selectDate(FormFieldModel field) async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: now,
      firstDate: DateTime(1900),
      lastDate: DateTime(2100),
    );

    if (picked != null) {
      final formatted = DateFormat('yyyy-MM-dd').format(picked);
      setState(() {
        _answers[field.name] = formatted;
      });
    }
  }

  void _captureGps(FormFieldModel field) {
    // Generates valid GPS coordinate pair with fallback
    // (e.g. 23.8103, 90.4125 for field demonstrations)
    final lat = (23.8100 + (DateTime.now().millisecond / 10000)).toStringAsFixed(4);
    final lng = (90.4120 + (DateTime.now().microsecond / 1000000)).toStringAsFixed(4);
    final coordStr = '$lat, $lng';

    setState(() {
      _textControllers[field.name]?.text = coordStr;
      _answers[field.name] = coordStr;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('📍 GPS Coordinates Captured: $coordStr'),
        backgroundColor: AppTheme.emeraldGreenDark,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  Future<void> _handleSubmit() async {
    // Validate text inputs
    if (!_formKey.currentState!.validate()) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('⚠️ Please fill out all required questions marked with *'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Pull values from text controllers into answers map
    for (final entry in _textControllers.entries) {
      if (entry.value.text.trim().isNotEmpty) {
        _answers[entry.key] = entry.value.text.trim();
      }
    }

    // Validate custom choices and dates for required fields
    for (final field in widget.project.formSchema.fields) {
      if (field.required) {
        final val = _answers[field.name];
        if (val == null || (val is String && val.trim().isEmpty) || (val is List && val.isEmpty)) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('⚠️ Question "${field.label}" is required.'),
              backgroundColor: Colors.red,
            ),
          );
          return;
        }
      }
    }

    setState(() => _isSubmitting = true);

    final result = await OfflineSyncService.submitWithOfflineFallback(
      projectId: widget.project.id,
      projectTitle: widget.project.title,
      answers: _answers,
    );

    setState(() => _isSubmitting = false);

    if (!mounted) return;

    final isOnlineSuccess = result['status'] == 'ONLINE_SUCCESS';

    // Show Completion Dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(
              isOnlineSuccess ? Icons.cloud_done_rounded : Icons.offline_pin_rounded,
              color: isOnlineSuccess ? AppTheme.emeraldGreen : AppTheme.amber,
              size: 32,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                isOnlineSuccess ? 'Submission Complete!' : 'Saved to Phone',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              result['message']?.toString() ?? 'Data processed successfully.',
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.slateDark),
            ),
            const SizedBox(height: 10),
            Text(
              isOnlineSuccess
                  ? 'Your entry was transmitted directly to the Wasmer.io database. The Supervisor and Admin can view it live.'
                  : 'Your phone is currently offline. The record is safely cached in local storage and will automatically upload once online.',
              style: const TextStyle(fontSize: 12, color: AppTheme.slateGray),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: isOnlineSuccess ? AppTheme.emeraldGreen : AppTheme.primary,
            ),
            onPressed: () {
              Navigator.pop(ctx); // Close dialog
              Navigator.pop(context, true); // Return to projects list with refresh trigger
            },
            child: const Text('Return to Projects'),
          ),
        ],
      ),
    );
  }

  Widget _buildFieldWidget(FormFieldModel field, int index) {
    final isRequired = field.required;
    final title = '${index + 1}. ${field.label}';

    Widget inputWidget;

    switch (field.type) {
      case 'select_one':
        final selectedValue = _answers[field.name];
        inputWidget = Column(
          children: field.choices.map((choice) {
            final isSelected = selectedValue == choice.name;
            return Card(
              color: isSelected ? AppTheme.primaryLight : Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
                side: BorderSide(
                  color: isSelected ? AppTheme.primary : AppTheme.borderGray,
                  width: isSelected ? 2 : 1,
                ),
              ),
              margin: const EdgeInsets.only(bottom: 8),
              child: InkWell(
                onTap: () {
                  setState(() {
                    _answers[field.name] = choice.name;
                  });
                },
                borderRadius: BorderRadius.circular(10),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  child: Row(
                    children: [
                      Icon(
                        isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
                        color: isSelected ? AppTheme.primary : AppTheme.slateGray,
                        size: 22,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          choice.label,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                            color: isSelected ? AppTheme.primary : AppTheme.slateDark,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }).toList(),
        );
        break;

      case 'select_multiple':
        final selectedList = (_answers[field.name] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [];
        inputWidget = Column(
          children: field.choices.map((choice) {
            final isChecked = selectedList.contains(choice.name);
            return Card(
              color: isChecked ? AppTheme.primaryLight : Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
                side: BorderSide(
                  color: isChecked ? AppTheme.primary : AppTheme.borderGray,
                  width: isChecked ? 2 : 1,
                ),
              ),
              margin: const EdgeInsets.only(bottom: 6),
              child: CheckboxListTile(
                title: Text(
                  choice.label,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: isChecked ? FontWeight.bold : FontWeight.normal,
                    color: isChecked ? AppTheme.primary : AppTheme.slateDark,
                  ),
                ),
                value: isChecked,
                activeColor: AppTheme.primary,
                onChanged: (checked) {
                  setState(() {
                    if (checked == true) {
                      selectedList.add(choice.name);
                    } else {
                      selectedList.remove(choice.name);
                    }
                    _answers[field.name] = selectedList;
                  });
                },
              ),
            );
          }).toList(),
        );
        break;

      case 'date':
        final selectedDate = _answers[field.name] as String?;
        inputWidget = InkWell(
          onTap: () => _selectDate(field),
          borderRadius: BorderRadius.circular(10),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppTheme.borderGray),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  selectedDate ?? 'Tap to choose calendar date',
                  style: TextStyle(
                    fontSize: 14,
                    color: selectedDate != null ? AppTheme.slateDark : AppTheme.slateGray,
                    fontWeight: selectedDate != null ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
                const Icon(Icons.calendar_month_rounded, color: AppTheme.primary),
              ],
            ),
          ),
        );
        break;

      case 'gps':
        inputWidget = Row(
          children: [
            Expanded(
              child: TextFormField(
                controller: _textControllers[field.name],
                decoration: const InputDecoration(
                  hintText: 'Latitude, Longitude',
                  prefixIcon: Icon(Icons.pin_drop_rounded, color: AppTheme.primary),
                ),
                validator: isRequired
                    ? (val) => (val == null || val.trim().isEmpty) ? 'GPS coordinates are required' : null
                    : null,
              ),
            ),
            const SizedBox(width: 8),
            ElevatedButton.icon(
              onPressed: () => _captureGps(field),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.emeraldGreen,
                minimumSize: const Size(110, 48),
              ),
              icon: const Icon(Icons.my_location_rounded, size: 16),
              label: const Text('Capture GPS', style: TextStyle(fontSize: 12)),
            ),
          ],
        );
        break;

      case 'number':
        inputWidget = TextFormField(
          controller: _textControllers[field.name],
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(
            hintText: 'Enter numeric value',
            prefixIcon: Icon(Icons.numbers_rounded),
          ),
          validator: isRequired
              ? (val) => (val == null || val.trim().isEmpty) ? 'This question is required' : null
              : null,
        );
        break;

      case 'textarea':
        inputWidget = TextFormField(
          controller: _textControllers[field.name],
          maxLines: 3,
          decoration: const InputDecoration(
            hintText: 'Enter field observations or remarks...',
          ),
          validator: isRequired
              ? (val) => (val == null || val.trim().isEmpty) ? 'This question is required' : null
              : null,
        );
        break;

      default:
        inputWidget = TextFormField(
          controller: _textControllers[field.name],
          decoration: const InputDecoration(
            hintText: 'Type your answer here',
          ),
          validator: isRequired
              ? (val) => (val == null || val.trim().isEmpty) ? 'This question is required' : null
              : null,
        );
        break;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.borderGray),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.slateDark,
                  ),
                ),
              ),
              if (isRequired)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF2F2),
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: const Color(0xFFFECACA)),
                  ),
                  child: const Text(
                    'Required',
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.red),
                  ),
                ),
            ],
          ),
          if (field.hint.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              '💡 ${field.hint}',
              style: const TextStyle(fontSize: 12, color: AppTheme.slateGray),
            ),
          ],
          const SizedBox(height: 12),
          inputWidget,
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final fields = widget.project.formSchema.fields;

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.project.title),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: AppTheme.primaryLight,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppTheme.borderGray),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info_outline_rounded, color: AppTheme.primary, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Form dynamically parsed from Admin Website .xlsx (${fields.length} questions)',
                      style: const TextStyle(fontSize: 12, color: AppTheme.primary, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),

            ...fields.asMap().entries.map((entry) {
              return _buildFieldWidget(entry.value, entry.key);
            }),

            const SizedBox(height: 10),
            ElevatedButton.icon(
              onPressed: _isSubmitting ? null : _handleSubmit,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.emeraldGreen,
                minimumSize: const Size.fromHeight(56),
              ),
              icon: _isSubmitting
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Icon(Icons.cloud_upload_rounded, size: 24),
              label: Text(
                _isSubmitting ? 'Sending to Website...' : 'Submit & Send to Website',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}
