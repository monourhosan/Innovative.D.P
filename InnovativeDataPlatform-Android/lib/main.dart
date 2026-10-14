import 'package:flutter/material.dart';
import 'constants/app_theme.dart';
import 'services/storage_service.dart';
import 'screens/splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await StorageService.init();
  runApp(const InnovativeDataApp());
}

class InnovativeDataApp extends StatelessWidget {
  const InnovativeDataApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: AppTheme.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const SplashScreen(),
    );
  }
}
