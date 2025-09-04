import 'dart:ui';

extension ColorToHex on Color {
  /// Converte a [Color] para uma string hexadecimal no formato #RRGGBB.
  /// Se [includeAlpha] for true, o formato será #AARRGGBB.
  String toHex({bool includeAlpha = false}) {
    // Converte o valor inteiro da cor para uma string hexadecimal.
    // padLeft garante que a string tenha sempre 8 caracteres (AARRGGBB).
    final String hex = toARGB32().toRadixString(16).padLeft(8, '0');

    // Se a opacidade (alpha) deve ser incluída, retorna a string completa.
    if (includeAlpha) {
      return '#$hex';
    }

    // Caso contrário, remove os dois primeiros caracteres (o canal alpha).
    return '#${hex.substring(2)}';
  }
}
