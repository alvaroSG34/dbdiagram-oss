/**
 * Servicio para exportar diagramas DBML a proyectos Flutter
 * Orientado a Sistemas de Gestión Empresarial
 * Conecta con backend Spring Boot
 */

import JSZip from 'jszip'

export class FlutterExportService {
  constructor() {
    this.appName = 'empresa_manager'
    this.packageName = 'com.dbdiagram.empresa_manager'
    this.flutterVersion = '3.16.0'
  }

  /**
   * Exporta un schema DBML a un proyecto Flutter completo
   * @param {Object} schema - Schema del diagrama DBML
   * @param {Object} options - Opciones de configuración
   * @returns {Promise<Blob>} - Archivo ZIP del proyecto
   */
  async exportToFlutter(schema, options = {}) {
    console.log('🚀 [FLUTTER-EXPORT] Iniciando exportación', { schema, options })

    // Configurar opciones
    this.appName = options.appName || this.appName
    this.packageName = options.packageName || this.packageName

    const zip = new JSZip()

    try {
      // 1. Crear estructura de directorios (Clean Architecture)
      await this.createProjectStructure(zip)

      // 2. Generar archivos de configuración
      await this.generateConfigurationFiles(zip)

      // 3. Generar modelos (Domain Layer)
      await this.generateModels(zip, schema.tables)

      // 4. Generar repositorios (Data Layer)
      await this.generateRepositories(zip, schema.tables)

      // 5. Generar servicios (Data Layer)
      await this.generateServices(zip, schema.tables)

      // 6. Generar providers (Presentation Layer)
      await this.generateProviders(zip, schema.tables)

      // 7. Generar pantallas (Presentation Layer)
      await this.generateScreens(zip, schema.tables)

      // 8. Generar widgets reutilizables
      await this.generateWidgets(zip)

      // 9. Generar configuración de tema
      await this.generateTheme(zip)

      // 10. Generar utilidades
      await this.generateUtils(zip)

      // 11. Generar main.dart y configuración de app
      await this.generateMainFiles(zip, schema.tables)

      // 12. Generar documentación
      await this.generateDocumentation(zip, schema)

      console.log('✅ [FLUTTER-EXPORT] Exportación completada')
      return await zip.generateAsync({ type: 'blob' })
    } catch (error) {
      console.error('❌ [FLUTTER-EXPORT] Error durante la exportación:', error)
      throw error
    }
  }

  /**
   * Crea la estructura de directorios Clean Architecture
   */
  async createProjectStructure(zip) {
    const dirs = [
      'lib',
      'lib/core',
      'lib/core/config',
      'lib/core/constants',
      'lib/core/theme',
      'lib/core/utils',
      'lib/core/widgets',
      'lib/data',
      'lib/data/models',
      'lib/data/repositories',
      'lib/data/services',
      'lib/data/datasources',
      'lib/domain',
      'lib/domain/entities',
      'lib/domain/repositories',
      'lib/presentation',
      'lib/presentation/providers',
      'lib/presentation/screens',
      'lib/presentation/widgets',
      'lib/presentation/widgets/forms',
      'lib/presentation/widgets/cards',
      'lib/presentation/widgets/dialogs',
      'test',
      'test/unit',
      'test/widget',
      'assets',
      'assets/images',
      'assets/icons'
    ]

    dirs.forEach(dir => {
      zip.folder(dir)
    })
  }

  /**
   * Genera archivos de configuración del proyecto
   */
  async generateConfigurationFiles(zip) {
    // pubspec.yaml
    const pubspecYaml = this.generatePubspecYaml()
    zip.file('pubspec.yaml', pubspecYaml)

    // analysis_options.yaml
    const analysisOptions = this.generateAnalysisOptions()
    zip.file('analysis_options.yaml', analysisOptions)

    // .gitignore
    const gitignore = this.generateGitignore()
    zip.file('.gitignore', gitignore)

    // Configuración de backend
    const configFile = this.generateConfigFile()
    zip.file('lib/core/config/app_config.dart', configFile)
  }

  /**
   * Genera modelos de datos (Domain Entities)
   */
  async generateModels(zip, tables) {
    tables.forEach(table => {
      const modelCode = this.generateModelClass(table)
      const fileName = `lib/domain/entities/${this.toSnakeCase(table.name)}.dart`
      zip.file(fileName, modelCode)
    })
  }

  /**
   * Genera repositorios (Data Layer)
   */
  async generateRepositories(zip, tables) {
    tables.forEach(table => {
      const repositoryCode = this.generateRepositoryClass(table)
      const fileName = `lib/data/repositories/${this.toSnakeCase(table.name)}_repository.dart`
      zip.file(fileName, repositoryCode)
    })
  }

  /**
   * Genera servicios de datos (Data Layer)
   */
  async generateServices(zip, tables) {
    tables.forEach(table => {
      const serviceCode = this.generateServiceClass(table)
      const fileName = `lib/data/services/${this.toSnakeCase(table.name)}_service.dart`
      zip.file(fileName, serviceCode)
    })
  }

  /**
   * Genera providers (Presentation Layer - Provider y Riverpod)
   */
  async generateProviders(zip, tables) {
    // Provider de tema
    const themeProvider = this.generateThemeProvider()
    zip.file('lib/presentation/providers/theme_provider.dart', themeProvider)

    // Providers para cada entidad
    tables.forEach(table => {
      // Provider (package:provider)
      const providerCode = this.generateProviderClass(table)
      const providerFile = `lib/presentation/providers/${this.toSnakeCase(table.name)}_provider.dart`
      zip.file(providerFile, providerCode)

      // Riverpod provider
      const riverpodCode = this.generateRiverpodProvider(table)
      const riverpodFile = `lib/presentation/providers/${this.toSnakeCase(table.name)}_riverpod.dart`
      zip.file(riverpodFile, riverpodCode)
    })
  }

  /**
   * Genera pantallas (Presentation Layer)
   */
  async generateScreens(zip, tables) {
    // Main Navigation Screen (con Bottom Navigation Bar)
    const mainNavCode = this.generateMainNavigationScreen(tables)
    zip.file('lib/presentation/screens/main_navigation_screen.dart', mainNavCode)

    // Dashboard
    const dashboardCode = this.generateDashboardScreen(tables)
    zip.file('lib/presentation/screens/dashboard_screen.dart', dashboardCode)

    // Pantallas para cada entidad
    tables.forEach(table => {
      // Lista
      const listCode = this.generateListScreen(table)
      zip.file(`lib/presentation/screens/${this.toSnakeCase(table.name)}_list_screen.dart`, listCode)

      // Formulario (crear/editar)
      const formCode = this.generateFormScreen(table)
      zip.file(`lib/presentation/screens/${this.toSnakeCase(table.name)}_form_screen.dart`, formCode)

      // Detalle
      const detailCode = this.generateDetailScreen(table)
      zip.file(`lib/presentation/screens/${this.toSnakeCase(table.name)}_detail_screen.dart`, detailCode)
    })
  }

  /**
   * Genera widgets reutilizables
   */
  async generateWidgets(zip) {
    // Form fields
    const textFieldWidget = this.generateTextFieldWidget()
    zip.file('lib/presentation/widgets/forms/custom_text_field.dart', textFieldWidget)

    const numberFieldWidget = this.generateNumberFieldWidget()
    zip.file('lib/presentation/widgets/forms/custom_number_field.dart', numberFieldWidget)

    const dateFieldWidget = this.generateDateFieldWidget()
    zip.file('lib/presentation/widgets/forms/custom_date_field.dart', dateFieldWidget)

    const switchWidget = this.generateSwitchWidget()
    zip.file('lib/presentation/widgets/forms/custom_switch.dart', switchWidget)

    // Cards
    const entityCard = this.generateEntityCard()
    zip.file('lib/presentation/widgets/cards/entity_card.dart', entityCard)

    // Dialogs
    const confirmDialog = this.generateConfirmDialog()
    zip.file('lib/presentation/widgets/dialogs/confirm_dialog.dart', confirmDialog)

    // Loading
    const loadingWidget = this.generateLoadingWidget()
    zip.file('lib/presentation/widgets/loading_widget.dart', loadingWidget)

    // Empty state
    const emptyStateWidget = this.generateEmptyStateWidget()
    zip.file('lib/presentation/widgets/empty_state_widget.dart', emptyStateWidget)
  }

  /**
   * Genera configuración de tema
   */
  async generateTheme(zip) {
    const themeCode = this.generateThemeConfig()
    zip.file('lib/core/theme/app_theme.dart', themeCode)

    const colorsCode = this.generateColorsConfig()
    zip.file('lib/core/theme/app_colors.dart', colorsCode)
  }

  /**
   * Genera utilidades
   */
  async generateUtils(zip) {
    // Export service (PDF/Excel)
    const exportService = this.generateExportService()
    zip.file('lib/core/utils/export_service.dart', exportService)

    // Date utils
    const dateUtils = this.generateDateUtils()
    zip.file('lib/core/utils/date_utils.dart', dateUtils)

    // Toast utils
    const toastUtils = this.generateToastUtils()
    zip.file('lib/core/utils/toast_utils.dart', toastUtils)

    // API client
    const apiClient = this.generateApiClient()
    zip.file('lib/data/datasources/api_client.dart', apiClient)
  }

  /**
   * Genera archivos principales
   */
  async generateMainFiles(zip, tables) {
    const mainCode = this.generateMainDart(tables)
    zip.file('lib/main.dart', mainCode)

    const routesCode = this.generateRoutes(tables)
    zip.file('lib/core/config/app_routes.dart', routesCode)
  }

  /**
   * Genera documentación
   */
  async generateDocumentation(zip, schema) {
    const readme = this.generateReadme(schema)
    zip.file('README.md', readme)
  }

  // ============================================
  // GENERADORES DE ARCHIVOS
  // ============================================

  generatePubspecYaml() {
    return `name: ${this.appName}
description: Sistema de Gestión Empresarial generado desde DBML
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter

  # State Management
  provider: ^6.1.1
  flutter_riverpod: ^2.4.9

  # HTTP & API
  http: ^1.1.0
  dio: ^5.4.0

  # UI
  cupertino_icons: ^1.0.6
  flutter_svg: ^2.0.9
  intl: ^0.19.0

  # Storage
  shared_preferences: ^2.2.2

  # Export
  excel: ^2.1.0
  pdf: ^3.10.7
  printing: ^5.12.0
  path_provider: ^2.1.1
  open_file: ^3.3.2

  # Utils
  uuid: ^4.2.1
  equatable: ^2.0.5

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true

  assets:
    - assets/images/
    - assets/icons/
`
  }

  generateAnalysisOptions() {
    return `include: package:flutter_lints/flutter.yaml

linter:
  rules:
    prefer_const_constructors: true
    prefer_const_literals_to_create_immutables: true
    avoid_print: false
`
  }

  generateGitignore() {
    return `# Miscellaneous
*.class
*.log
*.pyc
*.swp
.DS_Store
.atom/
.buildlog/
.history
.svn/
migrate_working_dir/

# IntelliJ related
*.iml
*.ipr
*.iws
.idea/

# The .vscode folder contains launch configuration and tasks you configure in
# VS Code which you may wish to be included in version control, so this line
# is commented out by default.
#.vscode/

# Flutter/Dart/Pub related
**/doc/api/
**/ios/Flutter/.last_build_id
.dart_tool/
.flutter-plugins
.flutter-plugins-dependencies
.packages
.pub-cache/
.pub/
/build/

# Symbolication related
app.*.symbols

# Obfuscation related
app.*.map.json

# Android Studio will place build artifacts here
/android/app/debug
/android/app/profile
/android/app/release
`
  }

  generateConfigFile() {
    return `/// Configuración de la aplicación
/// Edita este archivo para cambiar la URL del backend
class AppConfig {
  // URL del backend Spring Boot
  // Cambia esto según tu configuración
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
`
  }

  generateModelClass(table) {
    const className = this.capitalize(this.toCamelCase(table.name))
    const fileName = this.toSnakeCase(table.name)
    
    // Detectar PK
    const pkField = table.fields.find(f => f.pk) || table.fields[0]
    const pkType = this.getDartType(pkField?.type || 'integer')
    const pkName = pkField ? this.toCamelCase(pkField.name) : 'id'

    let imports = new Set()
    let fields = []
    let fromJsonFields = []
    let toJsonFields = []

    table.fields.forEach(field => {
      const fieldName = this.toCamelCase(field.name)
      const dartType = this.getDartType(field.type)

      fields.push(`  final ${dartType}? ${fieldName};`)
      
      fromJsonFields.push(`${this.generateFromJsonField(field, dartType)}`)
      toJsonFields.push(`${this.generateToJsonField(field, dartType)}`)
    })
    
    // Solo agregar imports si hay campos que los necesiten
    const hasDateTime = table.fields.some(f => this.getDartType(f.type) === 'DateTime')
    if (hasDateTime) {
      // DateTime.parse no requiere intl, pero si usáramos DateFormat sí
      // Por ahora no agregamos intl ya que no lo estamos usando
    }

    const importsList = Array.from(imports).sort()
    const importsSection = importsList.length > 0 
      ? importsList.map(imp => `import '${imp}';`).join('\n') + '\n'
      : ''
    
    return `import 'package:equatable/equatable.dart';
${importsSection}

class ${className} extends Equatable {
${fields.join('\n')}

  const ${className}({
${table.fields.map(f => `    this.${this.toCamelCase(f.name)},`).join('\n')}
  });

  factory ${className}.fromJson(Map<String, dynamic> json) {
    return ${className}(
${fromJsonFields.join(',\n')}
    );
  }

  Map<String, dynamic> toJson() {
    return {
${toJsonFields.join(',\n')}
    };
  }

  ${className} copyWith({
${table.fields.map(f => {
  const fieldName = this.toCamelCase(f.name)
  const dartType = this.getDartType(f.type)
  return `    ${dartType}? ${fieldName},`
}).join('\n')}
  }) {
    return ${className}(
${table.fields.map(f => {
  const fieldName = this.toCamelCase(f.name)
  return `      ${fieldName}: ${fieldName} ?? this.${fieldName},`
}).join('\n')}
    );
  }

  @override
  List<Object?> get props => [
${table.fields.map(f => `    ${this.toCamelCase(f.name)},`).join('\n')}
  ];
}
`
  }

  generateRepositoryClass(table) {
    const className = this.capitalize(this.toCamelCase(table.name))
    const entityName = className
    const serviceName = `${className}Service`
    const fileName = this.toSnakeCase(table.name)

    return `import '../../domain/entities/${fileName}.dart';
import '../services/${fileName}_service.dart';

class ${className}Repository {
  final ${serviceName} _service;

  ${className}Repository(this._service);

  Future<List<${entityName}>> getAll() async {
    try {
      return await _service.getAll();
    } catch (e) {
      rethrow;
    }
  }

  Future<${entityName}?> getById(int id) async {
    try {
      return await _service.getById(id);
    } catch (e) {
      rethrow;
    }
  }

  Future<${entityName}> create(${entityName} entity) async {
    try {
      return await _service.create(entity);
    } catch (e) {
      rethrow;
    }
  }

  Future<${entityName}> update(int id, ${entityName} entity) async {
    try {
      return await _service.update(id, entity);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> delete(int id) async {
    try {
      await _service.delete(id);
    } catch (e) {
      rethrow;
    }
  }
}
`
  }

  generateServiceClass(table) {
    const className = this.capitalize(this.toCamelCase(table.name))
    const entityName = className
    const fileName = this.toSnakeCase(table.name)
    const resourceName = table.name.toLowerCase()

    // Construir el código Dart de forma segura para evitar problemas con template strings
    const appConfigBaseUrl = 'AppConfig.baseUrl'
    const appConfigTimeout = 'AppConfig.requestTimeout'

    return `import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../core/config/app_config.dart';
import '../../core/utils/toast_utils.dart';
import '../../domain/entities/${fileName}.dart';

class ${className}Service {
  String get baseUrl => ${appConfigBaseUrl} + '/${resourceName}';

  Future<List<${entityName}>> getAll() async {
    try {
      final response = await http.get(
        Uri.parse(baseUrl),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: ${appConfigTimeout}));

      if (response.statusCode == 200) {
        final List<dynamic> jsonList = json.decode(response.body);
        return jsonList.map((json) => ${entityName}.fromJson(json)).toList();
      } else {
        ToastUtils.showError('Error al obtener datos: \${response.statusCode}');
        throw Exception('Failed to load ${resourceName}');
      }
    } catch (e) {
      ToastUtils.showError('Error de conexión: \${e.toString()}');
      rethrow;
    }
  }

  Future<${entityName}?> getById(int id) async {
    try {
      final response = await http.get(
        Uri.parse('\$baseUrl/\$id'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: ${appConfigTimeout}));

      if (response.statusCode == 200) {
        return ${entityName}.fromJson(json.decode(response.body));
      } else if (response.statusCode == 404) {
        return null;
      } else {
        ToastUtils.showError('Error al obtener el registro');
        throw Exception('Failed to load ${resourceName}');
      }
    } catch (e) {
      ToastUtils.showError('Error de conexión: \${e.toString()}');
      rethrow;
    }
  }

  Future<${entityName}> create(${entityName} entity) async {
    try {
      final response = await http.post(
        Uri.parse(baseUrl),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(entity.toJson()),
      ).timeout(const Duration(seconds: ${appConfigTimeout}));

      if (response.statusCode == 200 || response.statusCode == 201) {
        ToastUtils.showSuccess('Registro creado exitosamente');
        return ${entityName}.fromJson(json.decode(response.body));
      } else {
        ToastUtils.showError('Error al crear el registro');
        throw Exception('Failed to create ${resourceName}');
      }
    } catch (e) {
      ToastUtils.showError('Error de conexión: \${e.toString()}');
      rethrow;
    }
  }

  Future<${entityName}> update(int id, ${entityName} entity) async {
    try {
      final response = await http.put(
        Uri.parse('\$baseUrl/\$id'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(entity.toJson()),
      ).timeout(const Duration(seconds: ${appConfigTimeout}));

      if (response.statusCode == 200) {
        ToastUtils.showSuccess('Registro actualizado exitosamente');
        return ${entityName}.fromJson(json.decode(response.body));
      } else {
        ToastUtils.showError('Error al actualizar el registro');
        throw Exception('Failed to update ${resourceName}');
      }
    } catch (e) {
      ToastUtils.showError('Error de conexión: \${e.toString()}');
      rethrow;
    }
  }

  Future<void> delete(int id) async {
    try {
      final response = await http.delete(
        Uri.parse('\$baseUrl/\$id'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: ${appConfigTimeout}));

      if (response.statusCode == 200 || response.statusCode == 204) {
        ToastUtils.showSuccess('Registro eliminado exitosamente');
      } else {
        ToastUtils.showError('Error al eliminar el registro');
        throw Exception('Failed to delete ${resourceName}');
      }
    } catch (e) {
      ToastUtils.showError('Error de conexión: \${e.toString()}');
      rethrow;
    }
  }
}
`
  }

  // Helper para generar import de foundation.dart evitando conflictos de nombres
  getFoundationImport(className) {
    // Lista de nombres que entran en conflicto con clases de Flutter foundation.dart
    const flutterConflictNames = ['Category']
    
    if (flutterConflictNames.includes(className)) {
      return `import 'package:flutter/foundation.dart' hide ${className};`
    }
    
    return `import 'package:flutter/foundation.dart';`
  }

  generateProviderClass(table) {
    const className = this.capitalize(this.toCamelCase(table.name))
    const fileName = this.toSnakeCase(table.name)
    // Detectar PK para usar el nombre correcto
    const pkField = table.fields.find(f => f.pk) || table.fields[0]
    const pkName = pkField ? this.toCamelCase(pkField.name) : 'id'
    const pkType = this.getDartType(pkField?.type || 'integer')

    return `${this.getFoundationImport(className)}
import '../../domain/entities/${fileName}.dart';
import '../../data/repositories/${fileName}_repository.dart';

// Nota: Este provider usa el paquete 'provider'
// Para usar Riverpod, importa el archivo ${fileName}_riverpod.dart

class ${className}Provider with ChangeNotifier {
  final ${className}Repository _repository;

  ${className}Provider(this._repository);

  List<${className}> _items = [];
  List<${className}> _filteredItems = [];
  bool _isLoading = false;
  String? _error;
  String _searchQuery = '';
  String? _sortField;
  bool _sortAscending = true;

  List<${className}> get items {
    if (_searchQuery.isEmpty && _sortField == null) {
      return _items;
    }
    return _filteredItems;
  }
  bool get isLoading => _isLoading;
  String? get error => _error;
  String get searchQuery => _searchQuery;
  String? get sortField => _sortField;
  bool get sortAscending => _sortAscending;

  Future<void> loadAll() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _items = await _repository.getAll();
      _applyFilters();
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void setSearchQuery(String query) {
    _searchQuery = query.toLowerCase();
    _applyFilters();
    notifyListeners();
  }

  void setSortField(String? field) {
    if (_sortField == field) {
      _sortAscending = !_sortAscending;
    } else {
      _sortField = field;
      _sortAscending = true;
    }
    _applyFilters();
    notifyListeners();
  }

  void _applyFilters() {
    List<${className}> filtered = List.from(_items);

    // Aplicar búsqueda
    if (_searchQuery.isNotEmpty) {
      filtered = filtered.where((item) {
        ${this.generateSearchFilterCode(table)}
      }).toList();
    }

    // Aplicar ordenamiento
    if (_sortField != null) {
      filtered.sort((a, b) {
        ${this.generateSortLogicCode(table)}
      });
    }

    _filteredItems = filtered;
  }

  Future<void> create(${className} item) async {
    try {
      final created = await _repository.create(item);
      _items.add(created);
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  Future<void> update(${pkType} id, ${className} item) async {
    try {
      final updated = await _repository.update(id, item);
      final index = _items.indexWhere((i) => i.${pkName} == id);
      if (index != -1) {
        _items[index] = updated;
        _applyFilters();
        notifyListeners();
      }
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  Future<void> delete(${pkType} id) async {
    try {
      await _repository.delete(id);
      _items.removeWhere((i) => i.${pkName} == id);
      _applyFilters();
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  ${className}? getById(${pkType} id) {
    try {
      return _items.firstWhere((item) => item.${pkName} == id);
    } catch (e) {
      return null;
    }
  }
}
`
  }

  generateRiverpodProvider(table) {
    const className = this.capitalize(this.toCamelCase(table.name))
    const fileName = this.toSnakeCase(table.name)
    const providerName = this.toCamelCase(table.name) // Para nombres de providers en camelCase
    // Detectar PK para usar el nombre correcto
    const pkField = table.fields.find(f => f.pk) || table.fields[0]
    const pkName = pkField ? this.toCamelCase(pkField.name) : 'id'
    const pkType = this.getDartType(pkField?.type || 'integer')

    return `import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/entities/${fileName}.dart';
import '../../data/repositories/${fileName}_repository.dart';
import '../../data/services/${fileName}_service.dart';

// Repository Provider
final ${providerName}RepositoryProvider = Provider<${className}Repository>((ref) {
  return ${className}Repository(${className}Service());
});

// State Provider para la lista
final ${providerName}ListProvider = FutureProvider<List<${className}>>((ref) async {
  final repository = ref.watch(${providerName}RepositoryProvider);
  return await repository.getAll();
});

// State Provider para un item específico
final ${providerName}Provider = FutureProvider.family<${className}?, ${pkType}>((ref, id) async {
  final repository = ref.watch(${providerName}RepositoryProvider);
  return await repository.getById(id);
});

// Notifier Provider para operaciones CRUD
class ${className}Notifier extends StateNotifier<AsyncValue<List<${className}>>> {
  final ${className}Repository _repository;

  ${className}Notifier(this._repository) : super(const AsyncValue.loading()) {
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

  Future<void> create(${className} item) async {
    try {
      final created = await _repository.create(item);
      final currentData = state.value ?? [];
      state = AsyncValue.data([...currentData, created]);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }

  Future<void> update(${pkType} id, ${className} item) async {
    try {
      final updated = await _repository.update(id, item);
      final currentData = state.value ?? [];
      final index = currentData.indexWhere((i) => i.${pkName} == id);
      if (index != -1) {
        currentData[index] = updated;
        state = AsyncValue.data([...currentData]);
      }
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }

  Future<void> delete(${pkType} id) async {
    try {
      await _repository.delete(id);
      final currentData = state.value ?? [];
      state = AsyncValue.data(currentData.where((i) => i.${pkName} != id).toList());
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }
}

final ${providerName}NotifierProvider = StateNotifierProvider<${className}Notifier, AsyncValue<List<${className}>>>((ref) {
  final repository = ref.watch(${providerName}RepositoryProvider);
  return ${className}Notifier(repository);
});
`
  }

  generateThemeProvider() {
    return `import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ThemeProvider with ChangeNotifier {
  bool _isDarkMode = false;
  static const String _themeKey = 'theme_mode';

  bool get isDarkMode => _isDarkMode;
  ThemeMode get themeMode => _isDarkMode ? ThemeMode.dark : ThemeMode.light;

  ThemeProvider() {
    _loadTheme();
  }

  Future<void> _loadTheme() async {
    final prefs = await SharedPreferences.getInstance();
    _isDarkMode = prefs.getBool(_themeKey) ?? false;
    notifyListeners();
  }

  Future<void> toggleTheme() async {
    _isDarkMode = !_isDarkMode;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_themeKey, _isDarkMode);
    notifyListeners();
  }

  Future<void> setTheme(bool isDark) async {
    _isDarkMode = isDark;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_themeKey, _isDarkMode);
    notifyListeners();
  }
}
`
  }

  generateDashboardScreen(tables) {
    const tableCards = tables.map(table => {
      const className = this.capitalize(this.toCamelCase(table.name))
      const fileName = this.toSnakeCase(table.name)
      const displayName = this.formatDisplayName(table.name)
      return `          _buildEntityCard(
            context,
            '${displayName}',
            '${table.fields.length} campos',
            Icons.table_chart,
            () => Navigator.pushNamed(context, '/${fileName}'),
          ),`
    }).join('\n')

    // Generar resumen de estadísticas
    const statsCards = tables.slice(0, 4).map((table, index) => {
      const displayName = this.formatDisplayName(table.name)
      return `          _buildStatCard(
            context,
            '${displayName}',
            '0',
            Icons.${index === 0 ? 'inventory' : index === 1 ? 'people' : index === 2 ? 'shopping_cart' : 'assessment'},
            Colors.${index === 0 ? 'blue' : index === 1 ? 'green' : index === 2 ? 'orange' : 'purple'},
          ),`
    }).join('\n')

    return `import 'package:flutter/material.dart';
import '../widgets/cards/entity_card.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Resumen',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              childAspectRatio: 1.5,
              children: [
${statsCards}
              ],
            ),
            const SizedBox(height: 32),
            const Text(
              'Entidades',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              children: [
${tableCards}
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEntityCard(
    BuildContext context,
    String title,
    String subtitle,
    IconData icon,
    VoidCallback onTap,
  ) {
    return EntityCard(
      title: title,
      subtitle: subtitle,
      icon: icon,
      onTap: onTap,
    );
  }

  Widget _buildStatCard(
    BuildContext context,
    String title,
    String value,
    IconData icon,
    Color color,
  ) {
    return Card(
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: LinearGradient(
            colors: [
              color.withOpacity(0.1),
              color.withOpacity(0.05),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 28),
            ),
            const SizedBox(height: 16),
            Text(
              value,
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: color,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              title,
              style: TextStyle(
                fontSize: 13,
                color: Colors.grey.shade600,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
`
  }

  generateListScreen(table) {
    const className = this.capitalize(this.toCamelCase(table.name))
    const fileName = this.toSnakeCase(table.name)
    const displayName = this.formatDisplayName(table.name)
    const pkField = table.fields.find(f => f.pk) || table.fields[0]
    const pkFieldName = this.toCamelCase(pkField.name)
    // Usar getFieldTypeString para obtener el tipo como string de forma segura
    const displayField = table.fields.find(f => {
      if (f.pk) return false
      const fieldType = this.getFieldTypeString(f.type)
      return fieldType && (fieldType.includes('varchar') || fieldType.includes('text'))
    }) || table.fields[1] || pkField
    const displayFieldName = this.toCamelCase(displayField.name)

    return `import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../domain/entities/${fileName}.dart';
import '../../presentation/providers/${fileName}_provider.dart';
import '../widgets/loading_widget.dart';
import '../widgets/empty_state_widget.dart';
import '../widgets/cards/entity_card.dart';
import '${fileName}_form_screen.dart';
import '${fileName}_detail_screen.dart';
import '../../core/utils/export_service.dart';

class ${className}ListScreen extends StatefulWidget {
  const ${className}ListScreen({super.key});

  @override
  State<${className}ListScreen> createState() => _${className}ListScreenState();
}

class _${className}ListScreenState extends State<${className}ListScreen> {
  @override
  void initState() {
    super.initState();
    // Cargar datos cuando se abre la pantalla
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = Provider.of<${className}Provider>(context, listen: false);
      if (provider.items.isEmpty && !provider.isLoading) {
        provider.loadAll();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('${displayName}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.download),
            onPressed: () => _exportData(),
            tooltip: 'Exportar datos',
          ),
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _navigateToForm(),
            tooltip: 'Agregar nuevo',
          ),
        ],
      ),
      body: Consumer<${className}Provider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const LoadingWidget();
          }

          if (provider.error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 64, color: Colors.red),
                  const SizedBox(height: 16),
                  Text('Error: \${provider.error}'),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => provider.loadAll(),
                    child: const Text('Reintentar'),
                  ),
                ],
              ),
            );
          }

          if (provider.items.isEmpty) {
            return EmptyStateWidget(
              message: 'No hay registros de ${displayName.toLowerCase()}',
              onAction: () => _navigateToForm(),
              actionLabel: 'Agregar primero',
            );
          }

          return RefreshIndicator(
            onRefresh: () => provider.loadAll(),
            child: ListView.builder(
              itemCount: provider.items.length,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              itemBuilder: (context, index) {
                final item = provider.items[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: InkWell(
                    onTap: () => _navigateToDetail(item),
                    borderRadius: BorderRadius.circular(16),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          // Avatar/Icon circular
                          Container(
                            width: 56,
                            height: 56,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  Theme.of(context).colorScheme.primary,
                                  Theme.of(context).colorScheme.primary.withOpacity(0.7),
                                ],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(
                              Icons.person,
                              color: Colors.white,
                              size: 28,
                            ),
                          ),
                          const SizedBox(width: 16),
                          // Contenido
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.${displayFieldName}?.toString() ?? 'Sin nombre',
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                    letterSpacing: 0.2,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    Icon(
                                      Icons.tag,
                                      size: 14,
                                      color: Colors.grey.shade600,
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      'ID: \${item.${pkFieldName}}',
                                      style: TextStyle(
                                        fontSize: 13,
                                        color: Colors.grey.shade600,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          // Botones de acción
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              IconButton(
                                icon: Icon(
                                  Icons.edit_outlined,
                                  color: Theme.of(context).colorScheme.primary,
                                ),
                                onPressed: () => _navigateToEdit(item),
                                tooltip: 'Editar',
                                style: IconButton.styleFrom(
                                  backgroundColor: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                                  padding: const EdgeInsets.all(8),
                                ),
                              ),
                              const SizedBox(width: 4),
                              IconButton(
                                icon: const Icon(Icons.delete_outline, color: Colors.red),
                                onPressed: () => _confirmDelete(provider, item),
                                tooltip: 'Eliminar',
                                style: IconButton.styleFrom(
                                  backgroundColor: Colors.red.withOpacity(0.1),
                                  padding: const EdgeInsets.all(8),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        heroTag: 'fab_${fileName}',
        onPressed: () => _navigateToForm(),
        icon: const Icon(Icons.add_rounded),
        label: const Text('Agregar', style: TextStyle(fontWeight: FontWeight.w600)),
      ),
    );
  }

  void _navigateToForm() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const ${className}FormScreen(),
      ),
    );
  }

  void _navigateToEdit(${className} item) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ${className}FormScreen(item: item),
      ),
    );
  }

  void _navigateToDetail(${className} item) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ${className}DetailScreen(item: item),
      ),
    );
  }

  void _confirmDelete(${className}Provider provider, ${className} item) {
    final itemId = item.${pkFieldName};
    if (itemId == null) return;
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmar eliminación'),
        content: const Text('¿Está seguro de eliminar este registro?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () {
              provider.delete(itemId);
              Navigator.pop(context);
            },
            child: const Text('Eliminar', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  Future<void> _exportData() async {
    final provider = Provider.of<${className}Provider>(context, listen: false);
    try {
      await ExportService.exportToExcel(provider.items, '${displayName}');
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Datos exportados exitosamente')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al exportar: \${e.toString()}')),
        );
      }
    }
  }
}
`
  }

  generateFormScreen(table) {
    const className = this.capitalize(this.toCamelCase(table.name))
    const fileName = this.toSnakeCase(table.name)
    const displayName = this.formatDisplayName(table.name)
    const pkField = table.fields.find(f => f.pk) || table.fields[0]
    const pkFieldName = this.toCamelCase(pkField.name)

    const formFields = table.fields
      .filter(f => {
        // Excluir PKs auto-incrementales
        if (f.pk && f.increment) return false
        // Excluir campos de auditoría (created_at, updated_at, etc.)
        const fieldNameLower = f.name.toLowerCase()
        if (fieldNameLower === 'created_at' || fieldNameLower === 'updated_at' || 
            fieldNameLower === 'createdat' || fieldNameLower === 'updatedat') {
          return false
        }
        return true
      })
      .map(field => {
        const fieldName = this.toCamelCase(field.name)
        const fieldDisplayName = this.formatDisplayName(field.name)
        const dartType = this.getDartType(field.type)
        const isRequired = field.not_null === true

        if (dartType === 'DateTime') {
          return `          CustomDateField(
            label: '${fieldDisplayName}',
            value: _item?.${fieldName},
            onChanged: (value) => setState(() => _item = (_item ?? ${className}()).copyWith(${fieldName}: value)),
            required: ${isRequired},
          ),`
        } else if (dartType === 'bool') {
          return `          CustomSwitch(
            label: '${fieldDisplayName}',
            value: _item?.${fieldName} ?? false,
            onChanged: (value) => setState(() => _item = (_item ?? ${className}()).copyWith(${fieldName}: value)),
            required: ${isRequired},
          ),`
        } else if (dartType === 'int' || dartType === 'double') {
          return `          CustomNumberField(
            label: '${fieldDisplayName}',
            value: _item?.${fieldName}?.toString() ?? '',
            onChanged: (value) => setState(() => _item = (_item ?? ${className}()).copyWith(${fieldName}: ${dartType}.tryParse(value))),
            required: ${isRequired},
            isDecimal: ${dartType === 'double'},
          ),`
        } else {
          return `          CustomTextField(
            label: '${fieldDisplayName}',
            value: _item?.${fieldName} ?? '',
            onChanged: (value) => setState(() => _item = (_item ?? ${className}()).copyWith(${fieldName}: value)),
            required: ${isRequired},
          ),`
        }
      }).join('\n')

    return `import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../domain/entities/${fileName}.dart';
import '../../presentation/providers/${fileName}_provider.dart';
import '../widgets/forms/custom_text_field.dart';
import '../widgets/forms/custom_number_field.dart';
import '../widgets/forms/custom_date_field.dart';
import '../widgets/forms/custom_switch.dart';
import '../../core/utils/toast_utils.dart';

class ${className}FormScreen extends StatefulWidget {
  final ${className}? item;

  const ${className}FormScreen({super.key, this.item});

  @override
  State<${className}FormScreen> createState() => _${className}FormScreenState();
}

class _${className}FormScreenState extends State<${className}FormScreen> {
  ${className}? _item;
  final _formKey = GlobalKey<FormState>();
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _item = widget.item ?? ${className}();
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.item != null;

    return Scaffold(
      appBar: AppBar(
        title: Text(isEditing ? 'Editar ${displayName}' : 'Nuevo ${displayName}'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            // Header decorativo
            Container(
              padding: const EdgeInsets.all(20),
              margin: const EdgeInsets.only(bottom: 24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Theme.of(context).colorScheme.primary.withOpacity(0.1),
                    Theme.of(context).colorScheme.primary.withOpacity(0.05),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  Icon(
                    isEditing ? Icons.edit_rounded : Icons.add_circle_rounded,
                    color: Theme.of(context).colorScheme.primary,
                    size: 32,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          isEditing ? 'Editar ${displayName}' : 'Nuevo ${displayName}',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          isEditing ? 'Modifica los datos del registro' : 'Completa los campos requeridos',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
${formFields}
            const SizedBox(height: 32),
            // Botón de guardar mejorado
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton.icon(
                onPressed: _isSaving ? null : _save,
                icon: _isSaving
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : Icon(isEditing ? Icons.check_circle_rounded : Icons.save_rounded),
                label: Text(
                  _isSaving
                      ? 'Guardando...'
                      : (isEditing ? 'Actualizar' : 'Guardar'),
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  elevation: 2,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Future<void> _save() async {
    if (_formKey.currentState!.validate()) {
      if (_item == null) {
        _item = ${className}();
      }
      
      setState(() => _isSaving = true);

      try {
        final provider = Provider.of<${className}Provider>(context, listen: false);
        
        if (widget.item != null) {
          final itemId = widget.item!.${pkFieldName};
          if (itemId != null) {
            await provider.update(itemId, _item!);
          }
        } else {
          await provider.create(_item!);
        }

        if (mounted) {
          Navigator.pop(context);
          ToastUtils.show(context, widget.item != null ? 'Actualizado exitosamente' : 'Creado exitosamente');
        }
      } catch (e) {
        if (mounted) {
          ToastUtils.show(context, 'Error al guardar: \${e.toString()}', isError: true);
        }
      } finally {
        if (mounted) {
          setState(() => _isSaving = false);
        }
      }
    }
  }
}
`
  }

  generateMainNavigationScreen(tables) {
    const screens = tables.slice(0, 5).map((table, index) => {
      const className = this.capitalize(this.toCamelCase(table.name))
      const fileName = this.toSnakeCase(table.name)
      if (index === 0) {
        return `        const DashboardScreen(),`
      }
      return `        const ${className}ListScreen(),`
    }).join('\n')

    const navItems = tables.slice(0, 5).map((table, index) => {
      const displayName = this.formatDisplayName(table.name)
      return `          BottomNavigationBarItem(
            icon: Icon(Icons.${index === 0 ? 'dashboard' : index === 1 ? 'inventory' : index === 2 ? 'people' : index === 3 ? 'shopping_cart' : 'assessment'}),
            label: '${displayName.length > 12 ? displayName.substring(0, 12) + '...' : displayName}',
          ),`
    }).join('\n')

    const imports = tables.slice(0, 5).map((table, index) => {
      if (index === 0) return ''
      const className = this.capitalize(this.toCamelCase(table.name))
      const fileName = this.toSnakeCase(table.name)
      return `import '${fileName}_list_screen.dart';`
    }).filter(imp => imp).join('\n')

    return `import 'package:flutter/material.dart';
import 'dashboard_screen.dart';
${imports}

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
${screens}
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        type: BottomNavigationBarType.fixed,
        items: [
${navItems}
        ],
      ),
    );
  }
}
`
  }

  generateDetailScreen(table) {
    const className = this.capitalize(this.toCamelCase(table.name))
    const fileName = this.toSnakeCase(table.name)
    const displayName = this.formatDisplayName(table.name)

    const detailFields = table.fields.map(field => {
      const fieldName = this.toCamelCase(field.name)
      const fieldDisplayName = this.formatDisplayName(field.name)
      return `            _buildDetailRow('${fieldDisplayName}', item.${fieldName}?.toString() ?? 'N/A'),`
    }).join('\n')

    return `import 'package:flutter/material.dart';
import '../../domain/entities/${fileName}.dart';

class ${className}DetailScreen extends StatelessWidget {
  final ${className} item;

  const ${className}DetailScreen({super.key, required this.item});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Detalle de ${displayName}'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
${detailFields}
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(
            child: Text(value),
          ),
        ],
      ),
    );
  }
}
`
  }

  // Continuará en la siguiente parte debido a la longitud...
  // Generaré los widgets, tema, utilidades y archivos restantes

  generateTextFieldWidget() {
    return `import 'package:flutter/material.dart';

class CustomTextField extends StatelessWidget {
  final String label;
  final String value;
  final ValueChanged<String> onChanged;
  final bool required;
  final int? maxLines;
  final TextInputType? keyboardType;

  const CustomTextField({
    super.key,
    required this.label,
    required this.value,
    required this.onChanged,
    this.required = false,
    this.maxLines = 1,
    this.keyboardType,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      initialValue: value,
      onChanged: onChanged,
      decoration: InputDecoration(
        labelText: label + (required ? ' *' : ''),
        border: const OutlineInputBorder(),
      ),
      maxLines: maxLines,
      keyboardType: keyboardType,
      validator: (value) {
        if (required && (value == null || value.isEmpty)) {
          return 'Este campo es requerido';
        }
        return null;
      },
    );
  }
}
`
  }

  generateNumberFieldWidget() {
    return `import 'package:flutter/material.dart';

class CustomNumberField extends StatelessWidget {
  final String label;
  final String value;
  final ValueChanged<String> onChanged;
  final bool required;
  final bool isDecimal;

  const CustomNumberField({
    super.key,
    required this.label,
    required this.value,
    required this.onChanged,
    this.required = false,
    this.isDecimal = false,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      initialValue: value,
      onChanged: onChanged,
      decoration: InputDecoration(
        labelText: label + (required ? ' *' : ''),
        border: const OutlineInputBorder(),
      ),
      keyboardType: isDecimal ? TextInputType.numberWithOptions(decimal: true) : TextInputType.number,
      validator: (value) {
        if (required && (value == null || value.isEmpty)) {
          return 'Este campo es requerido';
        }
        if (value != null && value.isNotEmpty) {
          if (isDecimal) {
            if (double.tryParse(value) == null) {
              return 'Ingrese un número válido';
            }
          } else {
            if (int.tryParse(value) == null) {
              return 'Ingrese un número entero válido';
            }
          }
        }
        return null;
      },
    );
  }
}
`
  }

  generateDateFieldWidget() {
    return `import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class CustomDateField extends StatelessWidget {
  final String label;
  final DateTime? value;
  final ValueChanged<DateTime?> onChanged;
  final bool required;

  const CustomDateField({
    super.key,
    required this.label,
    required this.value,
    required this.onChanged,
    this.required = false,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      readOnly: true,
      initialValue: value != null ? DateFormat('yyyy-MM-dd').format(value!) : '',
      decoration: InputDecoration(
        labelText: label + (required ? ' *' : ''),
        border: const OutlineInputBorder(),
        suffixIcon: const Icon(Icons.calendar_today),
      ),
      onTap: () async {
        final picked = await showDatePicker(
          context: context,
          initialDate: value ?? DateTime.now(),
          firstDate: DateTime(2000),
          lastDate: DateTime(2100),
        );
        if (picked != null) {
          onChanged(picked);
        }
      },
      validator: (value) {
        if (required && (value == null || value.isEmpty)) {
          return 'Este campo es requerido';
        }
        return null;
      },
    );
  }
}
`
  }

  generateSwitchWidget() {
    return `import 'package:flutter/material.dart';

class CustomSwitch extends StatelessWidget {
  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;
  final bool required;

  const CustomSwitch({
    super.key,
    required this.label,
    required this.value,
    required this.onChanged,
    this.required = false,
  });

  @override
  Widget build(BuildContext context) {
    return SwitchListTile(
      title: Text(label + (required ? ' *' : '')),
      value: value,
      onChanged: onChanged,
      subtitle: required && !value
          ? const Text(
              'Este campo es requerido',
              style: TextStyle(color: Colors.red, fontSize: 12),
            )
          : null,
    );
  }
}
`
  }

  generateEntityCard() {
    return `import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

class EntityCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback onTap;

  const EntityCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Icono con gradiente de fondo
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppColors.primary,
                      AppColors.primaryDark,
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withOpacity(0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Icon(
                  icon,
                  size: 32,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.2,
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 6),
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.grey.shade600,
                  fontWeight: FontWeight.w500,
                ),
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
`
  }

  generateConfirmDialog() {
    return `import 'package:flutter/material.dart';

class ConfirmDialog extends StatelessWidget {
  final String title;
  final String message;
  final VoidCallback onConfirm;

  const ConfirmDialog({
    super.key,
    required this.title,
    required this.message,
    required this.onConfirm,
  });

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(title),
      content: Text(message),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancelar'),
        ),
        TextButton(
          onPressed: () {
            Navigator.pop(context);
            onConfirm();
          },
          child: const Text('Confirmar'),
        ),
      ],
    );
  }

  static Future<bool?> show(
    BuildContext context, {
    required String title,
    required String message,
  }) {
    return showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Confirmar'),
          ),
        ],
      ),
    );
  }
}
`
  }

  generateLoadingWidget() {
    return `import 'package:flutter/material.dart';

class LoadingWidget extends StatelessWidget {
  const LoadingWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: CircularProgressIndicator(),
    );
  }
}
`
  }

  generateEmptyStateWidget() {
    return `import 'package:flutter/material.dart';

class EmptyStateWidget extends StatelessWidget {
  final String message;
  final VoidCallback? onAction;
  final String? actionLabel;

  const EmptyStateWidget({
    super.key,
    required this.message,
    this.onAction,
    this.actionLabel,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.inbox_outlined,
                size: 64,
                color: Colors.grey.shade400,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              message,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.grey.shade700,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'No hay elementos para mostrar',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade500,
              ),
              textAlign: TextAlign.center,
            ),
            if (onAction != null) ...[
              const SizedBox(height: 32),
              ElevatedButton.icon(
                onPressed: onAction,
                icon: const Icon(Icons.add_rounded),
                label: Text(
                  actionLabel ?? 'Agregar',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
`
  }

  generateThemeConfig() {
    return `import 'package:flutter/material.dart';
import 'app_colors.dart';

class AppTheme {
  static ThemeData get lightTheme {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: AppColors.primary,
      brightness: Brightness.light,
      primary: AppColors.primary,
      secondary: AppColors.secondary,
      error: AppColors.error,
      surface: AppColors.surface,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      
      // AppBar moderno con gradiente
      appBarTheme: AppBarTheme(
        centerTitle: true,
        elevation: 0,
        scrolledUnderElevation: 1,
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        shadowColor: Colors.black.withOpacity(0.1),
        titleTextStyle: const TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: Colors.white,
          letterSpacing: 0.5,
        ),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      
      // Cards elegantes con sombras suaves
      cardTheme: CardTheme(
        elevation: 0,
        shadowColor: Colors.black.withOpacity(0.08),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        color: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
      ),
      
      // Input fields modernos
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surfaceVariant,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300, width: 1.5),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300, width: 1.5),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.error, width: 1.5),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.error, width: 2),
        ),
        labelStyle: TextStyle(
          color: AppColors.onSurfaceVariant,
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
        hintStyle: TextStyle(
          color: Colors.grey.shade400,
          fontSize: 14,
        ),
      ),
      
      // Botones elevados modernos
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
          ),
        ),
      ),
      
      // FAB moderno
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        elevation: 4,
        highlightElevation: 8,
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
      
      // Scaffold background
      scaffoldBackgroundColor: AppColors.background,
      
      // Text theme mejorado
      textTheme: TextTheme(
        headlineLarge: TextStyle(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: AppColors.onSurface,
          letterSpacing: -0.5,
        ),
        titleLarge: TextStyle(
          fontSize: 22,
          fontWeight: FontWeight.w600,
          color: AppColors.onSurface,
        ),
        bodyLarge: TextStyle(
          fontSize: 16,
          color: AppColors.onSurface,
        ),
        bodyMedium: TextStyle(
          fontSize: 14,
          color: AppColors.onSurfaceVariant,
        ),
      ),
    );
  }

  static ThemeData get darkTheme {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: AppColors.primary,
      brightness: Brightness.dark,
      primary: AppColors.primaryLight,
      secondary: AppColors.secondary,
      error: AppColors.error,
      surface: const Color(0xFF1E293B),
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      
      appBarTheme: AppBarTheme(
        centerTitle: true,
        elevation: 0,
        scrolledUnderElevation: 1,
        backgroundColor: const Color(0xFF1E293B),
        foregroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        titleTextStyle: const TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: Colors.white,
          letterSpacing: 0.5,
        ),
      ),
      
      cardTheme: CardTheme(
        elevation: 0,
        shadowColor: Colors.black.withOpacity(0.3),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        color: const Color(0xFF1E293B),
        surfaceTintColor: Colors.transparent,
      ),
      
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFF0F172A),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade700, width: 1.5),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade700, width: 1.5),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primaryLight, width: 2),
        ),
      ),
      
      scaffoldBackgroundColor: const Color(0xFF0F172A),
    );
  }
}
`
  }

  generateColorsConfig() {
    return `import 'package:flutter/material.dart';

class AppColors {
  // Colores principales modernos
  static const Color primary = Color(0xFF6366F1); // Indigo vibrante
  static const Color primaryDark = Color(0xFF4F46E5);
  static const Color primaryLight = Color(0xFF818CF8);
  
  // Colores secundarios
  static const Color secondary = Color(0xFF8B5CF6); // Purple
  static const Color accent = Color(0xFF06B6D4); // Cyan
  
  // Colores de estado
  static const Color error = Color(0xFFEF4444); // Rojo moderno
  static const Color success = Color(0xFF10B981); // Verde esmeralda
  static const Color warning = Color(0xFFF59E0B); // Amber
  static const Color info = Color(0xFF3B82F6); // Blue
  
  // Colores neutros
  static const Color background = Color(0xFFF8FAFC);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceVariant = Color(0xFFF1F5F9);
  static const Color onSurface = Color(0xFF1E293B);
  static const Color onSurfaceVariant = Color(0xFF64748B);
  
  // Gradientes
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primary, primaryDark],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient secondaryGradient = LinearGradient(
    colors: [secondary, primary],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
`
  }

  generateExportService() {
    return `import 'dart:io';
import 'package:excel/excel.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:path_provider/path_provider.dart';
import 'package:open_file/open_file.dart';
import 'package:flutter/services.dart';

class ExportService {
  /// Exporta una lista de entidades a Excel
  static Future<void> exportToExcel<T>(
    List<T> items,
    String fileName, {
    Map<String, String Function(T)>? fieldMappers,
  }) async {
    try {
      final excel = Excel.createExcel();
      excel.delete('Sheet1');
      final sheet = excel['Datos'];

      if (items.isEmpty) {
        throw Exception('No hay datos para exportar');
      }

      // Si hay mappers personalizados, usarlos
      if (fieldMappers != null && fieldMappers.isNotEmpty) {
        final headers = fieldMappers.keys.toList();
        sheet.appendRow(headers);

        for (final item in items) {
          final row = headers.map((header) => fieldMappers[header]!(item)).toList();
          sheet.appendRow(row);
        }
      } else {
        // Exportación genérica usando toJson si está disponible
        if (items.first is Map) {
          final firstItem = items.first as Map;
          final headers = firstItem.keys.toList();
          sheet.appendRow(headers.map((h) => h.toString()).toList());

          for (final item in items) {
            final map = item as Map;
            final row = headers.map((h) => map[h]?.toString() ?? '').toList();
            sheet.appendRow(row);
          }
        }
      }

      final fileBytes = excel.save();
      if (fileBytes != null) {
        final directory = await getApplicationDocumentsDirectory();
        final file = File('\${directory.path}/\${fileName}_\${DateTime.now().millisecondsSinceEpoch}.xlsx');
        await file.writeAsBytes(fileBytes);
        await OpenFile.open(file.path);
      }
    } catch (e) {
      throw Exception('Error al exportar a Excel: \${e.toString()}');
    }
  }

  /// Exporta una lista de entidades a PDF
  static Future<void> exportToPdf<T>(
    List<T> items,
    String fileName, {
    Map<String, String Function(T)>? fieldMappers,
    String? title,
  }) async {
    try {
      final pdf = pw.Document();

      pdf.addPage(
        pw.MultiPage(
          pageFormat: PdfPageFormat.a4,
          margin: const pw.EdgeInsets.all(32),
          build: (pw.Context context) {
            return [
              if (title != null)
                pw.Header(
                  level: 0,
                  child: pw.Text(
                    title,
                    style: pw.TextStyle(fontSize: 24, fontWeight: pw.FontWeight.bold),
                  ),
                ),
              pw.SizedBox(height: 20),
              pw.Table(
                border: pw.TableBorder.all(),
                children: _buildPdfTableRows(items, fieldMappers),
              ),
            ];
          },
        ),
      );

      await Printing.layoutPdf(
        onLayout: (PdfPageFormat format) async => pdf.save(),
      );
    } catch (e) {
      throw Exception('Error al exportar a PDF: \${e.toString()}');
    }
  }

  static List<pw.TableRow> _buildPdfTableRows<T>(
    List<T> items,
    Map<String, String Function(T)>? fieldMappers,
  ) {
    if (items.isEmpty) {
      return [
        pw.TableRow(
          children: [
            pw.Padding(
              padding: const pw.EdgeInsets.all(8),
              child: pw.Text('No hay datos para exportar'),
            ),
          ],
        ),
      ];
    }

    final rows = <pw.TableRow>[];

    if (fieldMappers != null && fieldMappers.isNotEmpty) {
      // Headers
      final headers = fieldMappers.keys.toList();
      rows.add(
        pw.TableRow(
          children: headers.map(
            (header) => pw.Padding(
              padding: const pw.EdgeInsets.all(8),
              child: pw.Text(
                header,
                style: pw.TextStyle(fontWeight: pw.FontWeight.bold),
              ),
            ),
          ).toList(),
        ),
      );

      // Data rows
      for (final item in items) {
        rows.add(
          pw.TableRow(
            children: headers.map(
              (header) => pw.Padding(
                padding: const pw.EdgeInsets.all(8),
                child: pw.Text(fieldMappers[header]!(item)),
              ),
            ).toList(),
          ),
        );
      }
    }

    return rows;
  }
}
`
  }

  generateDateUtils() {
    return `import 'package:intl/intl.dart';

class DateUtils {
  static String formatDate(DateTime? date, {String format = 'yyyy-MM-dd'}) {
    if (date == null) return '';
    return DateFormat(format).format(date);
  }

  static String formatDateTime(DateTime? dateTime) {
    if (dateTime == null) return '';
    return DateFormat('yyyy-MM-dd HH:mm:ss').format(dateTime);
  }

  static DateTime? parseDate(String? dateString) {
    if (dateString == null || dateString.isEmpty) return null;
    try {
      return DateFormat('yyyy-MM-dd').parse(dateString);
    } catch (e) {
      return null;
    }
  }

  static DateTime? parseDateTime(String? dateTimeString) {
    if (dateTimeString == null || dateTimeString.isEmpty) return null;
    try {
      return DateFormat('yyyy-MM-dd HH:mm:ss').parse(dateTimeString);
    } catch (e) {
      return null;
    }
  }
}
`
  }

  generateToastUtils() {
    return `import 'package:flutter/material.dart';

class ToastUtils {
  // Nota: Los métodos showSuccess, showError, etc. requieren contexto
  // Para usar estos métodos sin contexto, usa ToastUtils.show(context, message)
  
  static void showSuccess(String message) {
    // Este método requiere contexto, usar show() en su lugar
    // Se mantiene para compatibilidad pero no hace nada sin contexto
  }

  static void showError(String message) {
    // Este método requiere contexto, usar show() en su lugar
    // Se mantiene para compatibilidad pero no hace nada sin contexto
  }

  static void showInfo(String message) {
    // Este método requiere contexto, usar show() en su lugar
    // Se mantiene para compatibilidad pero no hace nada sin contexto
  }

  static void showWarning(String message) {
    // Este método requiere contexto, usar show() en su lugar
    // Se mantiene para compatibilidad pero no hace nada sin contexto
  }

  static void show(BuildContext context, String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red : Colors.green,
        duration: const Duration(seconds: 3),
      ),
    );
  }
}
`
  }

  generateApiClient() {
    // Construir el código Dart de forma segura para evitar problemas con template strings
    const appConfigBaseUrl = 'AppConfig.baseUrl'
    const appConfigTimeout = 'AppConfig.requestTimeout'

    return `import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../core/config/app_config.dart';

class ApiClient {
  static Future<http.Response> get(String endpoint) async {
    return await http.get(
      Uri.parse(${appConfigBaseUrl} + '/' + endpoint),
      headers: {'Content-Type': 'application/json'},
    ).timeout(const Duration(seconds: ${appConfigTimeout}));
  }

  static Future<http.Response> post(String endpoint, Map<String, dynamic> data) async {
    return await http.post(
      Uri.parse(${appConfigBaseUrl} + '/' + endpoint),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(data),
    ).timeout(const Duration(seconds: ${appConfigTimeout}));
  }

  static Future<http.Response> put(String endpoint, Map<String, dynamic> data) async {
    return await http.put(
      Uri.parse(${appConfigBaseUrl} + '/' + endpoint),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(data),
    ).timeout(const Duration(seconds: ${appConfigTimeout}));
  }

  static Future<http.Response> delete(String endpoint) async {
    return await http.delete(
      Uri.parse(${appConfigBaseUrl} + '/' + endpoint),
      headers: {'Content-Type': 'application/json'},
    ).timeout(const Duration(seconds: ${appConfigTimeout}));
  }
}
`
  }

  generateMainDart(tables) {
    const tableRoutes = tables.map(table => {
      const fileName = this.toSnakeCase(table.name)
      const className = this.capitalize(this.toCamelCase(table.name))
      return `        '/${fileName}': (context) => const ${className}ListScreen(),`
    }).join('\n')

    // Generar items para Bottom Navigation Bar (máximo 5)
    const bottomNavItems = tables.slice(0, 5).map((table, index) => {
      const displayName = this.formatDisplayName(table.name)
      const fileName = this.toSnakeCase(table.name)
      return `          BottomNavigationBarItem(
            icon: Icon(Icons.${index === 0 ? 'dashboard' : index === 1 ? 'inventory' : index === 2 ? 'people' : index === 3 ? 'shopping_cart' : 'assessment'}),
            label: '${displayName.length > 10 ? displayName.substring(0, 10) + '...' : displayName}',
          ),`
    }).join('\n')

    const tableProviders = tables.map(table => {
      const className = this.capitalize(this.toCamelCase(table.name))
      const fileName = this.toSnakeCase(table.name)
      return `        ChangeNotifierProvider(
          create: (_) => ${className}Provider(
            ${className}Repository(
              ${className}Service(),
            ),
          ),
        ),`
    }).join('\n')

    return `import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/theme/app_theme.dart';
import 'presentation/providers/theme_provider.dart';
${tables.map(table => {
  const className = this.capitalize(this.toCamelCase(table.name))
  const fileName = this.toSnakeCase(table.name)
  return `import 'data/repositories/${fileName}_repository.dart';
import 'data/services/${fileName}_service.dart';
import 'presentation/providers/${fileName}_provider.dart';
import 'presentation/screens/${fileName}_list_screen.dart';`
}).join('\n')}
import 'presentation/screens/dashboard_screen.dart';
import 'presentation/screens/main_navigation_screen.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
${tableProviders}
      ],
      child: Consumer<ThemeProvider>(
        builder: (context, themeProvider, child) {
          return MaterialApp(
            title: 'Sistema de Gestión Empresarial',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: themeProvider.themeMode,
            home: const MainNavigationScreen(),
            routes: {
${tableRoutes}
            },
          );
        },
      ),
    );
  }
}
`
  }

  generateRoutes(tables) {
    return `// Rutas de la aplicación
class AppRoutes {
  static const String home = '/';
  static const String dashboard = '/';
${tables.map(table => {
  const fileName = this.toSnakeCase(table.name)
  return `  static const String ${fileName} = '/${fileName}';`
}).join('\n')}
}
`
  }

  generateReadme(schema) {
    const tablesList = schema.tables.map(table => `- ${this.capitalize(this.toCamelCase(table.name))}`).join('\n')
    
    return `# Sistema de Gestión Empresarial - Flutter

Aplicación Flutter generada automáticamente desde un diagrama DBML.

## Entidades Generadas

${tablesList}

## Requisitos

- Flutter SDK >= 3.0.0
- Dart SDK >= 3.0.0
- Backend Spring Boot ejecutándose en \`http://localhost:8080\`

## Instalación

1. Asegúrate de tener Flutter instalado:
   \`\`\`bash
   flutter --version
   \`\`\`

2. Instala las dependencias:
   \`\`\`bash
   flutter pub get
   \`\`\`

3. Configura la URL del backend en \`lib/core/config/app_config.dart\`

4. Ejecuta la aplicación:
   \`\`\`bash
   flutter run
   \`\`\`

## Configuración del Backend

1. Primero, exporta y ejecuta el proyecto Spring Boot
2. Asegúrate de que el backend esté corriendo en \`http://localhost:8080\`
3. Edita \`lib/core/config/app_config.dart\` si tu backend está en otra URL

## Estructura del Proyecto

El proyecto sigue Clean Architecture:

- \`lib/domain/\` - Entidades y lógica de dominio
- \`lib/data/\` - Repositorios, servicios y fuentes de datos
- \`lib/presentation/\` - Pantallas, widgets y providers
- \`lib/core/\` - Configuración, tema y utilidades

## Características

- ✅ CRUD completo para todas las entidades
- ✅ Dashboard con resumen
- ✅ Tema claro/oscuro
- ✅ Exportación a PDF y Excel
- ✅ Bottom Navigation Bar
- ✅ Gestión de estado con Provider y Riverpod
- ✅ Validación de formularios
- ✅ Manejo de errores

## Exportación de Datos

Puedes exportar los datos de cualquier entidad a:
- Excel (.xlsx)
- PDF

Usa el botón de exportar en la pantalla de lista de cada entidad.

## Tema

La aplicación soporta tema claro y oscuro. Puedes cambiar el tema desde la configuración.

## Notas

- Esta aplicación se conecta al backend Spring Boot generado desde el mismo diagrama DBML
- Asegúrate de que el backend esté ejecutándose antes de usar la app
- Los endpoints del backend deben seguir el formato: \`/api/{resource}\`
`
  }

  // ============================================
  // UTILIDADES
  // ============================================

  getDartType(dbmlType) {
    const typeMap = {
      'int': 'int',
      'integer': 'int',
      'bigint': 'int',
      'varchar': 'String',
      'text': 'String',
      'char': 'String',
      'boolean': 'bool',
      'bool': 'bool',
      'timestamp': 'DateTime',
      'datetime': 'DateTime',
      'date': 'DateTime',
      'decimal': 'double',
      'numeric': 'double',
      'float': 'double',
      'double': 'double',
      'real': 'double',
      'money': 'double',
      'currency': 'double'
    }
    
    const typeString = this.getFieldTypeString(dbmlType)
    const baseType = typeString.toLowerCase().split('(')[0].trim()
    
    if (baseType.includes('timestamp') || baseType.includes('datetime') || baseType.includes('date')) {
      return 'DateTime'
    }
    if (baseType.includes('decimal') || baseType.includes('numeric') || baseType.includes('money') || baseType.includes('float') || baseType.includes('double')) {
      return 'double'
    }
    
    return typeMap[baseType] || 'String'
  }

  getFieldTypeString(fieldType) {
    if (!fieldType) return 'varchar(255)'
    if (typeof fieldType === 'string') return fieldType
    if (typeof fieldType === 'object') {
      if (fieldType.type_name) return fieldType.type_name
      if (fieldType.name) return fieldType.name
      if (fieldType.type) return fieldType.type
    }
    return 'varchar(255)'
  }

  generateFromJsonField(field, dartType) {
    const fieldName = this.toCamelCase(field.name)
    const jsonKey = fieldName // Usar camelCase para coincidir con Spring Boot DTOs
    if (dartType === 'DateTime') {
      return `      ${fieldName}: json['${jsonKey}'] != null ? DateTime.parse(json['${jsonKey}'] as String) : null`
    } else if (dartType === 'int') {
      return `      ${fieldName}: json['${jsonKey}'] != null ? (json['${jsonKey}'] as num).toInt() : null`
    } else if (dartType === 'double') {
      return `      ${fieldName}: json['${jsonKey}'] != null ? (json['${jsonKey}'] as num).toDouble() : null`
    } else if (dartType === 'bool') {
      return `      ${fieldName}: json['${jsonKey}'] as bool?`
    } else {
      return `      ${fieldName}: json['${jsonKey}'] as String?`
    }
  }

  generateToJsonField(field, dartType) {
    const fieldName = this.toCamelCase(field.name)
    const jsonKey = fieldName // Usar camelCase para coincidir con Spring Boot DTOs
    if (dartType === 'DateTime') {
      return `      '${jsonKey}': ${fieldName}?.toIso8601String()`
    } else {
      return `      '${jsonKey}': ${fieldName}`
    }
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  toCamelCase(str) {
    return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
  }

  toSnakeCase(str) {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')
  }

  formatDisplayName(str) {
    return str
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  generateSearchFilterCode(table) {
    // Generar código de filtro de búsqueda que busque en campos de texto
    const textFields = table.fields.filter(f => {
      const fieldType = this.getFieldTypeString(f.type)
      return fieldType && (fieldType.includes('varchar') || fieldType.includes('text') || fieldType.includes('char'))
    })
    
    if (textFields.length === 0) {
      // Si no hay campos de texto, buscar en el primer campo
      const firstField = table.fields[0]
      const fieldName = this.toCamelCase(firstField.name)
      return `return (item.${fieldName}?.toString().toLowerCase().contains(_searchQuery) ?? false);`
    }
    
    // Buscar en todos los campos de texto
    const searchConditions = textFields.map(f => {
      const fieldName = this.toCamelCase(f.name)
      return `(item.${fieldName}?.toString().toLowerCase().contains(_searchQuery) ?? false)`
    }).join(' || ')
    
    return `return ${searchConditions};`
  }

  generateSortLogicCode(table) {
    // Generar código de lógica de ordenamiento basada en el campo seleccionado
    const sortableFields = table.fields.filter(f => {
      const dartType = this.getDartType(f.type)
      return ['String', 'int', 'double', 'DateTime'].includes(dartType)
    })
    
    if (sortableFields.length === 0) {
      return 'return 0;'
    }
    
    // Generar casos para cada campo ordenable
    const cases = sortableFields.map(f => {
      const fieldName = this.toCamelCase(f.name)
      const dartType = this.getDartType(f.type)
      
      if (dartType === 'String') {
        return `case '${fieldName}':
          final aVal = a.${fieldName}?.toString().toLowerCase() ?? '';
          final bVal = b.${fieldName}?.toString().toLowerCase() ?? '';
          return _sortAscending ? aVal.compareTo(bVal) : bVal.compareTo(aVal);`
      } else if (dartType === 'int' || dartType === 'double') {
        return `case '${fieldName}':
          final aVal = a.${fieldName} ?? 0;
          final bVal = b.${fieldName} ?? 0;
          return _sortAscending ? aVal.compareTo(bVal) : bVal.compareTo(aVal);`
      } else if (dartType === 'DateTime') {
        return `case '${fieldName}':
          final aVal = a.${fieldName} ?? DateTime(1970);
          final bVal = b.${fieldName} ?? DateTime(1970);
          return _sortAscending ? aVal.compareTo(bVal) : bVal.compareTo(aVal);`
      }
      return ''
    }).filter(c => c).join('\n          ')
    
    return `switch (_sortField) {
          ${cases}
          default:
            return 0;
        }`
  }
}

// Singleton para uso global
export const flutterExportService = new FlutterExportService()

