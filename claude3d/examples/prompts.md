# Ejemplos de prompts para Claude3D

Prueba estos con el generador headless:

```bash
python generate.py "una taza de cerámica esmaltada con café sobre una mesa de roble"
python generate.py "un reloj de pulsera de acero inoxidable, primer plano de producto"
python generate.py "una manzana roja con gotas de agua sobre mármol negro"
python generate.py "una copa de vino tinto medio llena, iluminación de estudio"
python generate.py "un dron de cuatro hélices posado sobre cemento, exterior soleado"
python generate.py "un cactus en una maceta de terracota junto a una ventana"
python generate.py "auriculares over-ear de cuero, render publicitario"
python generate.py "una llave antigua de latón oxidado sobre terciopelo"
```

## Consejos

- **Materiales concretos** dan mejores resultados: di "acero cepillado",
  "vidrio esmerilado", "cuero envejecido", no solo "metal".
- **Menciona el contexto/fondo**: "sobre mármol", "junto a una ventana",
  "iluminación de estudio de producto".
- Sube la calidad con `--samples 256` y da más pasadas con `--iterations 4`.
- Guarda dónde quieras con `-o renders/taza.png`.

## Modo en vivo (Blender abierto)

Con Blender abierto y el add-on Claude3D iniciado:

```bash
python generate.py --live "añade una tetera de porcelana junto a la taza"
```

O directamente desde Claude Desktop / Claude Code vía el servidor MCP:

> "Crea una escena con una naranja realista sobre una tabla de madera,
>  ilumínala como fotografía de producto y renderízala."
