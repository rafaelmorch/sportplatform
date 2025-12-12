import 'package:flutter/material.dart';

import 'package:sports_platform/screens/dashboard_screen.dart';
import 'package:sports_platform/screens/groups_screen.dart';
import 'package:sports_platform/screens/events_screen.dart';
import 'package:sports_platform/screens/profile_screen.dart';

class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    DashboardScreen(),
    GroupsScreen(),
    EventsScreen(),
    ProfileScreen(),
  ];

  String get _title {
    switch (_currentIndex) {
      case 0:
        return "Dashboard";
      case 1:
        return "Groups";
      case 2:
        return "Events";
      case 3:
        return "Profile";
      default:
        return "Sports Platform";
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_title),
        centerTitle: true,
      ),
      body: _screens[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: Colors.blue,
        unselectedItemColor: Colors.grey,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: "Dashboard",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.groups),
            label: "Groups",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.emoji_events),
            label: "Events",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: "Profile",
          ),
        ],
      ),
    );
  }
}
