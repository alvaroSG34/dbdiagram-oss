# Exportación a Flutter - Documentación Técnica

## Resumen

El sistema de exportación a Flutter genera una aplicación móvil completa orientada a Sistemas de Gestión Empresarial que se conecta al backend Spring Boot generado desde el mismo diagrama DBML.

---

## Flujo de Exportación

### 1. Punto de Entrada (Frontend)

**Archivo:** `web/src/pages/RoomEditor.vue`

```javascript
const exportToFlutter = async () => {
  // 1. Validación: Verificar que hay tablas en el schema
  if (!schema.value || !schema.value.tables || !schema.value.tables.length) {
    // Mostrar advertencia
    return
  }

  // 2. Llamar al servicio de exportación
  const zipBlob = await flutterExportService.exportToFlutter(schema.value, {
    appName: 'empresa_manager',
    packageName: 'com.dbdiagram.empresa_manager'
  })

  // 3. Descargar el archivo ZIP generado
  const url = window.URL.createObjectURL(zipBlob)
  const a = document.createElement('a')
  a.download = `flutter-project-${Date.now()}.zip`
  a.click()
}
```

**Ubicación en UI:**
- Botón "Exportar a Flutter" en el toolbar del `RoomEditor`
- Color secundario para diferenciarlo del botón de Spring Boot
- Muestra estado de carga durante la generación

---

### 2. Servicio de Exportación

**Archivo:** `web/src/services/flutterExportService.js`

**Clase Principal:** `FlutterExportService`

#### Método Principal: `exportToFlutter(schema, options)`

```javascript
async exportToFlutter(schema, options = {}) {
  // Configurar opciones del proyecto
  this.appName = options.appName || 'empresa_manager'
  this.packageName = options.packageName || 'com.dbdiagram.empresa_manager'

  const zip = new JSZip()

  // Proceso de generación (12 pasos):
  // 1. Estructura Clean Architecture
  // 2. Archivos de configuración (pubspec.yaml, .gitignore)
  // 3. Modelos (Domain Layer)
  // 4. Repositorios (Data Layer)
  // 5. Servicios (Data Layer)
  // 6. Providers (Presentation Layer - Provider y Riverpod)
  // 7. Pantallas (Dashboard, Lista, Formulario, Detalle)
  // 8. Widgets reutilizables
  // 9. Configuración de tema
  // 10. Utilidades (Export, Toast, Date, API)
  // 11. Archivos principales (main.dart, routes)
  // 12. Documentación

  return await zip.generateAsync({ type: 'blob' })
}
```

---

## Estructura del Proyecto Generado (Clean Architecture)

```
flutter-project/
├── pubspec.yaml                    # Dependencias Flutter
├── analysis_options.yaml           # Configuración de linter
├── .gitignore
├── README.md                       # Documentación
│
├── lib/
│   ├── main.dart                   # Punto de entrada
│   │
│   ├── core/                       # Capa Core
│   │   ├── config/
│   │   │   ├── app_config.dart     # Configuración (URL backend)
│   │   │   └── app_routes.dart     # Rutas de navegación
│   │   ├── constants/
│   │   ├── theme/
│   │   │   ├── app_theme.dart      # Tema claro/oscuro
│   │   │   └── app_colors.dart     # Colores de la app
│   │   ├── utils/
│   │   │   ├── export_service.dart # Exportación PDF/Excel
│   │   │   ├── toast_utils.dart    # Mensajes toast
│   │   │   └── date_utils.dart     # Utilidades de fecha
│   │   └── widgets/                # Widgets compartidos
│   │       ├── loading_widget.dart
│   │       └── empty_state_widget.dart
│   │
│   ├── domain/                      # Capa Domain (Entidades)
│   │   └── entities/
│   │       ├── product.dart
│   │       ├── category.dart
│   │       └── ...
│   │
│   ├── data/                        # Capa Data
│   │   ├── models/                  # (Opcional, si se necesitan)
│   │   ├── repositories/
│   │   │   ├── product_repository.dart
│   │   │   └── ...
│   │   ├── services/
│   │   │   ├── product_service.dart # HTTP calls
│   │   │   └── ...
│   │   └── datasources/
│   │       └── api_client.dart      # Cliente HTTP genérico
│   │
│   └── presentation/                # Capa Presentation
│       ├── providers/
│       │   ├── theme_provider.dart
│       │   ├── product_provider.dart      # Provider (package:provider)
│       │   ├── product_riverpod.dart      # Riverpod provider
│       │   └── ...
│       ├── screens/
│       │   ├── dashboard_screen.dart     # Dashboard principal
│       │   ├── product_list_screen.dart   # Lista de productos
│       │   ├── product_form_screen.dart   # Formulario crear/editar
│       │   ├── product_detail_screen.dart # Vista de detalle
│       │   └── ...
│       └── widgets/
│           ├── forms/
│           │   ├── custom_text_field.dart
│           │   ├── custom_number_field.dart
│           │   └── custom_date_field.dart
│           ├── cards/
│           │   └── entity_card.dart
│           └── dialogs/
│               └── confirm_dialog.dart
│
├── test/                            # Tests
│   ├── unit/
│   └── widget/
│
└── assets/                          # Recursos
    ├── images/
    └── icons/
```

---

## Componentes Generados

### 1. Entidades (Domain Layer)

**Características:**
- Clases Dart inmutables con `Equatable`
- Métodos `fromJson` y `toJson` para serialización
- Método `copyWith` para actualizaciones inmutables
- Mapeo automático de tipos DBML → Dart

**Ejemplo generado:**
```dart
class Product extends Equatable {
  final int? id;
  final String? name;
  final double? price;
  final String? description;
  final DateTime? createdAt;

  const Product({
    this.id,
    this.name,
    this.price,
    this.description,
    this.createdAt,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'] != null ? (json['id'] as num).toInt() : null,
      name: json['name'] as String?,
      price: json['price'] != null ? (json['price'] as num).toDouble() : null,
      description: json['description'] as String?,
      createdAt: json['created_at'] != null 
        ? DateTime.parse(json['created_at'] as String) 
        : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'price': price,
      'description': description,
      'created_at': createdAt?.toIso8601String(),
    };
  }

  Product copyWith({...}) { ... }

  @override
  List<Object?> get props => [id, name, price, description, createdAt];
}
```

**Mapeo de Tipos DBML → Dart:**
- `int`, `integer`, `bigint` → `int`
- `varchar`, `text`, `char` → `String`
- `boolean`, `bool` → `bool`
- `timestamp`, `datetime`, `date` → `DateTime`
- `decimal`, `numeric`, `float`, `double`, `money` → `double`

---

### 2. Repositorios (Data Layer)

**Características:**
- Abstracción sobre los servicios
- Manejo de errores centralizado
- Interfaz consistente para todas las entidades

**Ejemplo:**
```dart
class ProductRepository {
  final ProductService _service;

  ProductRepository(this._service);

  Future<List<Product>> getAll() async {
    try {
      return await _service.getAll();
    } catch (e) {
      rethrow;
    }
  }

  Future<Product> create(Product entity) async {
    try {
      return await _service.create(entity);
    } catch (e) {
      rethrow;
    }
  }
}
```

---

### 3. Servicios (Data Layer)

**Características:**
- Llamadas HTTP usando `package:http`
- Integración con backend Spring Boot
- Manejo de errores con Toast messages
- Timeout configurable

**Ejemplo:**
```dart
class ProductService {
  final String baseUrl = '${AppConfig.baseUrl}/products';

  Future<List<Product>> getAll() async {
    final response = await http.get(
      Uri.parse(baseUrl),
      headers: {'Content-Type': 'application/json'},
    ).timeout(Duration(seconds: AppConfig.requestTimeout));

    if (response.statusCode == 200) {
      final List<dynamic> jsonList = json.decode(response.body);
      return jsonList.map((json) => Product.fromJson(json)).toList();
    } else {
      ToastUtils.showError('Error al obtener datos');
      throw Exception('Failed to load products');
    }
  }
}
```

---

### 4. Providers (Presentation Layer)

#### Provider (package:provider)

**Características:**
- `ChangeNotifier` para gestión de estado
- Métodos CRUD con notificación de cambios
- Estado de carga y errores

**Ejemplo:**
```dart
class ProductProvider with ChangeNotifier {
  final ProductRepository _repository;

  List<Product> _items = [];
  bool _isLoading = false;
  String? _error;

  List<Product> get items => _items;
  bool get isLoading => _isLoading;

  Future<void> loadAll() async {
    _isLoading = true;
    notifyListeners();

    try {
      _items = await _repository.getAll();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
```

#### Riverpod Provider

**Características:**
- Providers reactivos con `flutter_riverpod`
- `FutureProvider` para datos asíncronos
- `StateNotifier` para operaciones CRUD

**Ejemplo:**
```dart
final productListProvider = FutureProvider<List<Product>>((ref) async {
  final repository = ref.watch(productRepositoryProvider);
  return await repository.getAll();
});

class ProductNotifier extends StateNotifier<AsyncValue<List<Product>>> {
  final ProductRepository _repository;

  ProductNotifier(this._repository) : super(const AsyncValue.loading()) {
    loadAll();
  }

  Future<void> loadAll() async {
    state = const AsyncValue.loading();
    try {
      final items = await _repository.getAll();
      state = AsyncValue.data(items);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }
}
```

---

### 5. Pantallas (Presentation Layer)

#### Dashboard Screen

**Características:**
- Grid con cards para cada entidad
- Navegación a listas de cada entidad
- Iconos y resumen de información

#### List Screen

**Características:**
- Lista scrollable con `ListView.builder`
- Pull-to-refresh
- Botones de acción (editar, eliminar)
- Botón de exportar (PDF/Excel)
- FAB para crear nuevo registro
- Manejo de estados: loading, error, empty

#### Form Screen

**Características:**
- Formulario con validación
- Campos dinámicos según tipo de dato
- Modo crear/editar
- Botón de guardar con loading

#### Detail Screen

**Características:**
- Vista de solo lectura
- Muestra todos los campos del registro
- Formato legible

---

### 6. Widgets Reutilizables

#### Form Fields

- **CustomTextField**: Campo de texto con validación
- **CustomNumberField**: Campo numérico (int/double)
- **CustomDateField**: Selector de fecha con DatePicker

#### Cards

- **EntityCard**: Card para mostrar entidades en dashboard

#### Dialogs

- **ConfirmDialog**: Diálogo de confirmación genérico

#### Utilities

- **LoadingWidget**: Indicador de carga
- **EmptyStateWidget**: Estado vacío con acción

---

### 7. Configuración de Tema

**Archivo:** `lib/core/theme/app_theme.dart`

**Características:**
- Tema claro y oscuro
- Material Design 3
- Colores personalizables
- Soporte para cambio dinámico de tema

**Provider de Tema:**
- `ThemeProvider` con `ChangeNotifier`
- Persistencia en `SharedPreferences`
- Cambio dinámico sin reiniciar app

---

### 8. Utilidades

#### Export Service

**Características:**
- Exportación a Excel usando `package:excel`
- Exportación a PDF usando `package:pdf` y `package:printing`
- Abre archivos generados automáticamente

**Uso:**
```dart
await ExportService.exportToExcel(items, 'Productos');
await ExportService.exportToPdf(items, 'Productos', title: 'Lista de Productos');
```

#### Toast Utils

**Características:**
- Mensajes toast con `SnackBar`
- Tipos: success, error, info, warning
- Integrado con `ScaffoldMessenger`

#### Date Utils

**Características:**
- Formateo de fechas con `package:intl`
- Parsing de strings a DateTime
- Formatos predefinidos

#### API Client

**Características:**
- Cliente HTTP genérico
- Métodos: GET, POST, PUT, DELETE
- Timeout configurable
- Headers estándar

---

### 9. Configuración

#### App Config

**Archivo:** `lib/core/config/app_config.dart`

```dart
class AppConfig {
  // URL del backend Spring Boot
  static const String baseUrl = 'http://localhost:8080/api';
  
  // Timeout para peticiones HTTP (en segundos)
  static const int requestTimeout = 30;
  
  // Configuración de exportación
  static const bool enableExport = true;
  
  // Configuración de paginación
  static const int defaultPageSize = 20;
  
  // Configuración de tema
  static const bool defaultDarkMode = false;
}
```

**Nota:** El usuario debe editar este archivo para cambiar la URL del backend.

---

## Dependencias Principales

### State Management
- `provider: ^6.1.1` - Provider pattern
- `flutter_riverpod: ^2.4.9` - Riverpod (alternativa)

### HTTP & API
- `http: ^1.1.0` - Cliente HTTP
- `dio: ^5.4.0` - Cliente HTTP avanzado (opcional)

### UI
- `cupertino_icons: ^1.0.6` - Iconos iOS
- `flutter_svg: ^2.0.9` - SVG support
- `intl: ^0.18.1` - Internacionalización y formateo

### Forms & Validation
- `flutter_form_builder: ^9.1.1` - Formularios avanzados
- `form_builder_validators: ^9.1.0` - Validadores

### Storage
- `shared_preferences: ^2.2.2` - Almacenamiento local

### Export
- `excel: ^2.1.0` - Generación de Excel
- `pdf: ^3.10.7` - Generación de PDF
- `printing: ^5.12.0` - Impresión y preview de PDF
- `path_provider: ^2.1.1` - Rutas de archivos

### Utils
- `uuid: ^4.2.1` - Generación de UUIDs
- `equatable: ^2.0.5` - Comparación de objetos

---

## Flujo de Uso

### 1. Exportar Backend Spring Boot

1. Crear/editar diagrama DBML en la aplicación
2. Hacer clic en "Exportar a SpringBoot"
3. Descargar y extraer el ZIP
4. Ejecutar el backend:
   ```bash
   cd springboot-project
   mvn spring-boot:run
   ```
5. Verificar que el backend esté en `http://localhost:8080`

### 2. Exportar Frontend Flutter

1. Con el mismo diagrama DBML, hacer clic en "Exportar a Flutter"
2. Descargar y extraer el ZIP
3. Configurar la URL del backend en `lib/core/config/app_config.dart`
4. Instalar dependencias:
   ```bash
   cd flutter-project
   flutter pub get
   ```
5. Ejecutar la app:
   ```bash
   flutter run
   ```

### 3. Usar la Aplicación

1. **Dashboard**: Ver resumen de todas las entidades
2. **Navegación**: Usar Bottom Navigation Bar para cambiar entre secciones
3. **CRUD**: Crear, leer, actualizar y eliminar registros
4. **Exportar**: Exportar datos a PDF o Excel desde las pantallas de lista
5. **Tema**: Cambiar entre tema claro/oscuro desde la configuración

---

## Características Implementadas

✅ **Clean Architecture**: Separación clara de capas (Domain, Data, Presentation)  
✅ **Bottom Navigation Bar**: Navegación principal  
✅ **Dashboard**: Resumen de entidades  
✅ **CRUD Completo**: Para todas las entidades generadas  
✅ **Tema Claro/Oscuro**: Con persistencia  
✅ **Exportación PDF/Excel**: Desde pantallas de lista  
✅ **Provider y Riverpod**: Ambos disponibles  
✅ **Validación de Formularios**: Campos requeridos y tipos  
✅ **Manejo de Errores**: Con toast messages  
✅ **Loading States**: Indicadores de carga  
✅ **Empty States**: Mensajes cuando no hay datos  
✅ **Pull to Refresh**: Actualizar listas  
✅ **Configuración Editable**: Archivo de configuración para URL del backend  

---

## Limitaciones Actuales

1. **Relaciones entre entidades:**
   - No se generan pantallas para relaciones complejas
   - Solo CRUD básico por entidad

2. **Búsqueda y Filtros:**
   - No se generan búsquedas avanzadas automáticamente
   - Solo listado completo

3. **Paginación:**
   - No se implementa paginación automática
   - Carga todos los registros

4. **Autenticación:**
   - No se incluye (según requisitos)

5. **Imágenes:**
   - No se manejan campos de imagen automáticamente

---

## Mejoras Sugeridas

### Corto Plazo
1. **Búsqueda básica**: Agregar campo de búsqueda en listas
2. **Paginación**: Implementar paginación en el backend y frontend
3. **Filtros**: Filtros básicos por campos comunes

### Mediano Plazo
1. **Relaciones**: Mostrar relaciones entre entidades
2. **Gráficos**: Dashboard con gráficos usando `fl_chart`
3. **Notificaciones**: Notificaciones push (opcional)

### Largo Plazo
1. **Offline Mode**: Sincronización offline con `hive` o `sqflite`
2. **Multi-idioma**: Internacionalización completa
3. **Temas personalizados**: Múltiples temas de color

---

## Notas Importantes

1. **Orden de Exportación:**
   - Primero exportar Spring Boot
   - Levantar el backend
   - Luego exportar Flutter
   - Configurar URL en `app_config.dart`

2. **URL del Backend:**
   - Por defecto: `http://localhost:8080/api`
   - Para dispositivos físicos: Usar IP de la máquina (ej: `http://192.168.1.100:8080/api`)
   - Para producción: Cambiar a URL del servidor

3. **CORS:**
   - El backend Spring Boot debe tener CORS configurado
   - Ya está incluido en el proyecto Spring Boot generado

4. **Versión de Flutter:**
   - Requiere Flutter SDK >= 3.0.0
   - Probado con Flutter 3.16.0+

---

## Conclusión

El sistema de exportación a Flutter genera una aplicación móvil completa y funcional que se conecta directamente al backend Spring Boot. La aplicación sigue Clean Architecture, incluye todas las funcionalidades solicitadas y está lista para usar después de configurar la URL del backend.

El código generado es limpio, bien estructurado y fácil de extender para agregar funcionalidades personalizadas.

