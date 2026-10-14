import 'package:flutter_test/flutter_test.dart';
import 'package:innovativedata/main.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('Innovative Data Platform App smoke test', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});
    await tester.pumpWidget(const InnovativeDataApp());
    // Allow splash timer to complete
    await tester.pumpAndSettle();
    expect(find.byType(InnovativeDataApp), findsOneWidget);
  });
}
