import 'dart:convert';

class ChoiceOption {
  final String name;
  final String label;

  ChoiceOption({required this.name, required this.label});

  factory ChoiceOption.fromJson(Map<String, dynamic> json) {
    return ChoiceOption(
      name: json['name']?.toString() ?? '',
      label: json['label']?.toString() ?? json['name']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() => {'name': name, 'label': label};
}

class FormFieldModel {
  final String id;
  final String name;
  final String label;
  final String type; // text, number, select_one, select_multiple, date, gps, textarea, etc.
  final bool required;
  final String hint;
  final List<ChoiceOption> choices;

  FormFieldModel({
    required this.id,
    required this.name,
    required this.label,
    required this.type,
    required this.required,
    required this.hint,
    required this.choices,
  });

  factory FormFieldModel.fromJson(Map<String, dynamic> json) {
    final rawChoices = json['choices'] as List<dynamic>? ?? [];
    return FormFieldModel(
      id: json['id']?.toString() ?? json['name']?.toString() ?? 'field',
      name: json['name']?.toString() ?? json['id']?.toString() ?? 'field',
      label: json['label']?.toString() ?? json['name']?.toString() ?? '',
      type: json['type']?.toString().toLowerCase() ?? 'text',
      required: json['required'] == true || json['required'] == 'yes' || json['required'] == 1,
      hint: json['hint']?.toString() ?? '',
      choices: rawChoices.map((c) => ChoiceOption.fromJson(c as Map<String, dynamic>)).toList(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'label': label,
    'type': type,
    'required': required,
    'hint': hint,
    'choices': choices.map((c) => c.toJson()).toList(),
  };
}

class FormSchemaModel {
  final String mode;
  final String modeLabel;
  final List<FormFieldModel> fields;

  FormSchemaModel({
    required this.mode,
    required this.modeLabel,
    required this.fields,
  });

  factory FormSchemaModel.fromJson(Map<String, dynamic> json) {
    final rawFields = json['fields'] as List<dynamic>? ?? [];
    return FormSchemaModel(
      mode: json['mode']?.toString() ?? 'xlsform',
      modeLabel: json['mode_label']?.toString() ?? 'Form Schema',
      fields: rawFields.map((f) => FormFieldModel.fromJson(f as Map<String, dynamic>)).toList(),
    );
  }

  Map<String, dynamic> toJson() => {
    'mode': mode,
    'mode_label': modeLabel,
    'fields': fields.map((f) => f.toJson()).toList(),
  };
}

class ProjectModel {
  final int id;
  final String title;
  final String description;
  final FormSchemaModel formSchema;
  final int totalSubmissions;

  ProjectModel({
    required this.id,
    required this.title,
    required this.description,
    required this.formSchema,
    this.totalSubmissions = 0,
  });

  factory ProjectModel.fromJson(Map<String, dynamic> json) {
    FormSchemaModel parsedSchema;
    if (json['form_schema'] is Map<String, dynamic>) {
      parsedSchema = FormSchemaModel.fromJson(json['form_schema'] as Map<String, dynamic>);
    } else if (json['form_schema_json'] is String) {
      try {
        final decoded = jsonDecode(json['form_schema_json'] as String) as Map<String, dynamic>;
        parsedSchema = FormSchemaModel.fromJson(decoded);
      } catch (_) {
        parsedSchema = FormSchemaModel(mode: 'unknown', modeLabel: 'Form', fields: []);
      }
    } else {
      parsedSchema = FormSchemaModel(mode: 'unknown', modeLabel: 'Form', fields: []);
    }

    return ProjectModel(
      id: json['id'] as int? ?? 0,
      title: json['title']?.toString() ?? 'Untitled Project',
      description: json['description']?.toString() ?? '',
      formSchema: parsedSchema,
      totalSubmissions: json['total_submissions'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'description': description,
    'form_schema': formSchema.toJson(),
    'total_submissions': totalSubmissions,
  };
}
