import 'package:flutter/material.dart';
import '../constants/app_theme.dart';

class StatCard extends StatelessWidget {
  final String label;
  final String value;
  final String? subtext;
  final IconData icon;
  final Color iconColor;
  final Color iconBgColor;

  const StatCard({
    super.key,
    required this.label,
    required this.value,
    this.subtext,
    required this.icon,
    this.iconColor = AppTheme.primary,
    this.iconBgColor = AppTheme.primaryLight,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: iconBgColor,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: iconColor, size: 26),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.slateGray,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    value,
                    style: const TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                      color: AppTheme.slateDark,
                      letterSpacing: -0.5,
                    ),
                  ),
                  if (subtext != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      subtext!,
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.emeraldGreenDark,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
