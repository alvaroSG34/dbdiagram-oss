# Guía de Ejecución - Proyecto Flutter

## 📋 Prerequisitos

Antes de ejecutar la aplicación Flutter, asegúrate de tener:

1. **Flutter SDK instalado** (versión 3.0.0 o superior)
2. **Backend Spring Boot ejecutándose** en `http://localhost:8080`
3. **Un dispositivo o emulador** configurado (Android/iOS/Web)

---

## 🚀 Pasos para Ejecutar el Proyecto

### Paso 1: Descomprimir el Archivo ZIP

1. Extrae el contenido del archivo `flutter-project-*.zip` en una carpeta de tu elección
2. Abre una terminal en la carpeta del proyecto descomprimido

### Paso 2: Verificar la Instalación de Flutter

Verifica que Flutter esté correctamente instalado:

```bash
flutter --version
```

Deberías ver algo como:
```
Flutter 3.16.0 • channel stable • https://github.com/flutter/flutter.git
```

Si no tienes Flutter instalado, descárgalo desde: https://flutter.dev/docs/get-started/install

### Paso 3: Verificar Dependencias de Flutter

Verifica que todas las herramientas estén instaladas:

```bash
flutter doctor
```

Esto te mostrará el estado de:
- Flutter SDK
- Android toolchain
- Xcode (para iOS, solo en macOS)
- Chrome (para web)
- Android Studio / VS Code

### Paso 4: Instalar Dependencias del Proyecto

Navega a la carpeta del proyecto y ejecuta:

```bash
cd ruta/al/proyecto/flutter
flutter pub get
```

Esto instalará todas las dependencias definidas en `pubspec.yaml`:
- `provider` - Gestión de estado
- `http` - Peticiones HTTP
- `equatable` - Comparación de objetos
- `intl` - Formateo de fechas
- `excel` - Exportación a Excel
- `pdf` - Exportación a PDF
- Y más...

### Paso 5: Configurar la URL del Backend

**⚠️ IMPORTANTE:** Antes de ejecutar la app, asegúrate de que el backend Spring Boot esté corriendo.

1. Abre el archivo `lib/core/config/app_config.dart`
2. Verifica o modifica la URL del backend:

```dart
class AppConfig {
  // URL del backend Spring Boot
  // Cambia esto según tu configuración
  static const String baseUrl = 'http://localhost:8080/api';
  
  // Timeout para peticiones HTTP (en segundos)
  static const int requestTimeout = 30;
  
  // ... otras configuraciones
}
```

**Notas:**
- Si usas un emulador Android, usa `http://10.0.2.2:8080/api` en lugar de `localhost`
- Si usas un dispositivo físico, usa la IP local de tu computadora (ej: `http://192.168.1.100:8080/api`)
- Si usas iOS Simulator, puedes usar `localhost` normalmente
- Si usas web, usa `localhost` o la IP de tu máquina

### Paso 6: Verificar que el Backend Esté Ejecutándose

Asegúrate de que el backend Spring Boot esté corriendo:

1. El backend debe estar en `http://localhost:8080`
2. Puedes verificar con: `curl http://localhost:8080/api/health` (si existe el endpoint)
3. O simplemente abre `http://localhost:8080` en tu navegador

### Paso 7: Ejecutar la Aplicación

#### Opción A: Ejecutar en un Dispositivo/Emulador

1. Lista los dispositivos disponibles:
   ```bash
   flutter devices
   ```

2. Ejecuta la aplicación:
   ```bash
   flutter run
   ```

   O especifica un dispositivo:
   ```bash
   flutter run -d <device-id>
   ```

#### Opción B: Ejecutar en Web

```bash
flutter run -d chrome
```

#### Opción C: Ejecutar en Android

```bash
flutter run -d android
```

#### Opción D: Ejecutar en iOS (solo macOS)

```bash
flutter run -d ios
```

---

## 🔧 Configuración Adicional

### Para Android Emulator

Si usas el emulador de Android, cambia la URL en `app_config.dart`:

```dart
static const String baseUrl = 'http://10.0.2.2:8080/api';
```

`10.0.2.2` es la dirección especial que el emulador de Android usa para referirse al `localhost` de la máquina host.

### Para Dispositivo Físico

1. Encuentra la IP local de tu computadora:
   - Windows: `ipconfig` (busca "IPv4 Address")
   - macOS/Linux: `ifconfig` o `ip addr`

2. Actualiza `app_config.dart`:
   ```dart
   static const String baseUrl = 'http://192.168.1.100:8080/api'; // Tu IP local
   ```

3. Asegúrate de que el dispositivo y la computadora estén en la misma red WiFi

### Para Web

Si ejecutas en web, puedes usar `localhost` normalmente, pero asegúrate de que CORS esté configurado en el backend Spring Boot para permitir peticiones desde `http://localhost` (o el puerto que uses para Flutter web).

---

## 🐛 Solución de Problemas

### Error: "Unable to find package"

```bash
flutter clean
flutter pub get
```

### Error: "Connection refused" o "Failed host lookup"

1. Verifica que el backend esté ejecutándose
2. Verifica la URL en `app_config.dart`
3. Si usas emulador Android, asegúrate de usar `10.0.2.2` en lugar de `localhost`
4. Si usas dispositivo físico, verifica que estén en la misma red

### Error: "No devices found"

1. Ejecuta `flutter devices` para ver dispositivos disponibles
2. Para Android: Inicia un emulador desde Android Studio
3. Para iOS: Abre el Simulator desde Xcode
4. Para web: Asegúrate de tener Chrome instalado

### Error al compilar

```bash
flutter clean
flutter pub get
flutter run
```

### La app no se conecta al backend

1. Verifica que el backend esté corriendo: `http://localhost:8080`
2. Verifica la URL en `lib/core/config/app_config.dart`
3. Revisa los logs del backend para ver si hay peticiones entrantes
4. Verifica que CORS esté configurado en el backend (si usas web)

---

## 📱 Características de la Aplicación

Una vez que la app esté ejecutándose, tendrás acceso a:

- **Dashboard**: Resumen con estadísticas de las entidades
- **Navegación**: Bottom Navigation Bar con acceso a las entidades principales
- **CRUD**: Crear, leer, actualizar y eliminar registros
- **Exportación**: Exportar datos a PDF o Excel
- **Tema**: Cambiar entre tema claro y oscuro
- **Validación**: Formularios con validación
- **Manejo de errores**: Mensajes toast para feedback al usuario

---

## 🎯 Flujo Recomendado

1. **Primero**: Exporta y ejecuta el backend Spring Boot
2. **Segundo**: Verifica que el backend esté corriendo en `http://localhost:8080`
3. **Tercero**: Exporta el proyecto Flutter
4. **Cuarto**: Descomprime y configura la URL del backend
5. **Quinto**: Ejecuta `flutter pub get`
6. **Sexto**: Ejecuta `flutter run`

---

## 📚 Recursos Adicionales

- [Documentación de Flutter](https://flutter.dev/docs)
- [Documentación de Provider](https://pub.dev/packages/provider)
- [Documentación de HTTP](https://pub.dev/packages/http)
- [Clean Architecture en Flutter](https://resocoder.com/flutter-clean-architecture-tdd)

---

## ✅ Checklist de Ejecución

- [ ] Flutter SDK instalado y configurado
- [ ] Backend Spring Boot ejecutándose
- [ ] Proyecto Flutter descomprimido
- [ ] Dependencias instaladas (`flutter pub get`)
- [ ] URL del backend configurada en `app_config.dart`
- [ ] Dispositivo/emulador disponible
- [ ] Aplicación ejecutándose (`flutter run`)

---

## 🆘 Soporte

Si encuentras problemas:

1. Revisa los logs de la aplicación
2. Revisa los logs del backend
3. Verifica la configuración de red
4. Consulta la documentación de Flutter
5. Revisa el README.md del proyecto generado

---

¡Listo! Tu aplicación Flutter debería estar ejecutándose y conectada al backend Spring Boot. 🚀

