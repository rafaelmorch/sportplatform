import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'navigation/app_shell.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Carrega o .env
  await dotenv.load(fileName: ".env");

  // Inicializa o Supabase (já deixa pronto)
  await Supabase.initialize(
    url: dotenv.env['SUPABASE_URL']!,
    anonKey: dotenv.env['SUPABASE_ANON_KEY']!,
  );

  runApp(const SportsPlatformApp());
}

class SportsPlatformApp extends StatelessWidget {
  const SportsPlatformApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: "Sports Platform",
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorSchemeSeed: Colors.blue,
      ),
      home: const AppShell(),
    );
  }
}
