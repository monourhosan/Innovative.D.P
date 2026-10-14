import 'package:flutter/material.dart';
import '../constants/app_theme.dart';

class LiveConnectionBadge extends StatelessWidget {
  final bool isConnected;
  final VoidCallback? onRefresh;

  const LiveConnectionBadge({
    super.key,
    this.isConnected = true,
    this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: isConnected ? AppTheme.emeraldGreenLight : const Color(0xFFFEF2F2),
        borderRadius: BorderRadius.circular(30),
        border: Border.all(
          color: isConnected ? const Color(0xFFA7F3D0) : const Color(0xFFFECACA),
          width: 1.5,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isConnected ? AppTheme.emeraldGreen : Colors.red,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            isConnected
                ? 'CONNECTED TO WEBSITE — LIVE UPDATES ON'
                : 'OFFLINE MODE — QUEUED LOCALLY',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.4,
              color: isConnected ? const Color(0xFF065F46) : const Color(0xFF991B1B),
            ),
          ),
          if (onRefresh != null) ...[
            const SizedBox(width: 8),
            GestureDetector(
              onTap: onRefresh,
              child: const Icon(
                Icons.refresh,
                size: 14,
                color: Color(0xFF065F46),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
