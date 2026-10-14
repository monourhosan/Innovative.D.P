import 'package:flutter/material.dart';
import '../constants/app_theme.dart';

class BrandingBanner extends StatelessWidget {
  final bool isDark;
  final bool compact;

  const BrandingBanner({
    super.key,
    this.isDark = false,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    if (compact) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E293B) : const Color(0xFFEFF6FF),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isDark ? const Color(0xFF334155) : const Color(0xFFBFDBFE),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              '🌐 Innovative Data Platform',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1E40AF),
              ),
            ),
            const Text(
              ' • ',
              style: TextStyle(fontSize: 11, color: Colors.grey),
            ),
            Text(
              'Made by Saif for Innovative Research & Consultancy Ltd.',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w800,
                color: isDark ? const Color(0xFF38BDF8) : const Color(0xFF0284C7),
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
      color: isDark ? AppTheme.slateDark : const Color(0xFFEFF6FF),
      child: const Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.hub_rounded, size: 14, color: AppTheme.primary),
          SizedBox(width: 6),
          Text(
            'Innovative Data Platform',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: AppTheme.primary,
            ),
          ),
          Text(
            ' — ',
            style: TextStyle(fontSize: 12, color: Colors.grey),
          ),
          Text(
            'Made by Saif for Innovative Research & Consultancy Ltd.',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w900,
              color: Color(0xFF0284C7),
            ),
          ),
        ],
      ),
    );
  }
}
