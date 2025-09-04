import 'package:json_annotation/json_annotation.dart';

class EpubHrefConverter implements JsonConverter<String, String> {
  const EpubHrefConverter();

  @override
  String fromJson(String object) => object.replaceAll("../", "");

  @override
  String toJson(String object) => object.replaceAll("../", "");
}
