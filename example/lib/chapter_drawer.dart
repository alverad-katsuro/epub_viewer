import 'package:flutter_epub_viewer/flutter_epub_viewer.dart';
import 'package:flutter/material.dart';

class ChapterDrawer extends StatefulWidget {
  const ChapterDrawer({super.key, required this.controller});

  final EpubController controller;

  @override
  State<ChapterDrawer> createState() => _ChapterDrawerState();
}

class _ChapterDrawerState extends State<ChapterDrawer> {
  late List<EpubChapter> chapters;

  @override
  void initState() {
    chapters = widget.controller.getChapters();
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Drawer(
        child: ListView.builder(
            itemCount: chapters.length,
            itemBuilder: (context, index) {
              return AnimatedSwitcher(
                duration: const Duration(milliseconds: 250),
                transitionBuilder:
                    (Widget child, Animation<double> animation) =>
                        FadeTransition(opacity: animation, child: child),
                child: _buildTocList(chapters[index]),
              );
            }));
  }

  /// Transforma a lista de capítulos em uma lista de widgets (ListTile/ExpansionTile).
  Widget _buildTocList(EpubChapter chapter) {
    if (chapter.subitems.isEmpty) {
      return ListTile(
        title: Text(chapter.title),
        onTap: () {
          widget.controller.display(cfi: chapter.href);
          Navigator.pop(context);
        },
      );
    } else {
      return ExpansionTile(
        title: Text(
          chapter.title.trim(),
        ),
        shape: const Border(
          top: BorderSide.none,
          bottom: BorderSide.none,
        ),
        // Mapeia cada subcapítulo para um ListTile.
        children: chapter.subitems.map((subChapter) {
          return _buildTocList(subChapter);
        }).toList(),
      );
    }
  }
}
