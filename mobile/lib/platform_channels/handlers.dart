import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:file_picker/file_picker.dart';
import 'dart:convert';
import 'dart:io';

class PlatformChannelHandlers {
  final InAppWebViewController _webViewController;

  PlatformChannelHandlers(this._webViewController);

  void registerHandlers() {
    _webViewController.addJavaScriptHandler(
      handlerName: 'flutterApp',
      callback: (args) {
        if (args.isNotEmpty) {
          final message = args[0];
          print('Message from web app: $message');
          return _handleWebMessage(message);
        }
        return null;
      },
    );
  }

  Future<dynamic> _handleWebMessage(Map<String, dynamic> message) async {
    final type = message['type'];
    switch (type) {
      case 'filePicker':
        return _handleFilePicker();
      case 'clipboard':
        return _handleClipboard(message['data']);
      case 'notification':
        return _handleNotification(message['data']);
      case 'folderPicker':
        return _handleFolderPicker();
      default:
        print('Unknown message type: $type');
        return null;
    }
  }

  Future<Map<String, dynamic>?> _handleFilePicker() async {
    print('File picker requested');
    // TODO: Implement file picker using file_picker package
    return null;
  }

  Future<void> _handleClipboard(String data) async {
    print('Clipboard write requested with data: $data');
    // TODO: Implement clipboard logic using clipboard package
  }

  Future<void> _handleNotification(Map<String, dynamic> data) async {
    print('Notification requested with data: $data');
    // TODO: Implement notification logic using a local notifications package
  }

  Future<Map<String, dynamic>?> _handleFolderPicker() async {
    print('Folder picker requested');
    try {
      String? selectedDirectory = await FilePicker.platform.getDirectoryPath();

      if (selectedDirectory == null) {
        // User canceled the picker
        return null;
      }

      Directory dir = Directory(selectedDirectory);
      List<FileSystemEntity> files = dir.listSync(recursive: true);

      List<Map<String, dynamic>> fileDataList = [];
      String folderName = dir.path.split('/').last;

      for (FileSystemEntity entity in files) {
        if (entity is File) {
          String relativePath = entity.path.substring(dir.path.length + 1);
          bool isBinary = false; // Heuristic, can be improved
          String content;

          try {
            // Attempt to read as UTF-8
            content = await entity.readAsString(encoding: utf8);
          } catch (e) {
            // If UTF-8 fails, assume binary and read as bytes
            isBinary = true;
            List<int> bytes = await entity.readAsBytes();
            content = base64Encode(bytes);
          }

          fileDataList.add({
            'name': entity.path.split('/').last,
            'path': relativePath,
            'content': content,
            'isBinary': isBinary,
          });
        }
      }

      return {
        'folderName': folderName,
        'files': fileDataList,
      };
    } catch (e) {
      print('Error picking folder: $e');
      return null;
    }
  }
}
