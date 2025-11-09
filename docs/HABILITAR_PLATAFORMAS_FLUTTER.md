# Habilitar Plataformas en Proyecto Flutter

## Problema

Cuando intentas ejecutar `flutter run`, aparece:
```
No supported devices connected.
The following devices were found, but are not supported by this project:
Windows (desktop) • windows
Chrome (web)      • chrome
Edge (web)        • edge
```

## Solución Rápida

### Opción 1: Habilitar Web (Recomendado - Más Rápido)

Ejecuta este comando en la carpeta de tu proyecto:

```bash
flutter create . --platforms=web
```

Luego ejecuta:

```bash
flutter run -d chrome
```

### Opción 2: Habilitar Windows Desktop

```bash
flutter create . --platforms=windows
```

Luego ejecuta:

```bash
flutter run -d windows
```

### Opción 3: Habilitar Todas las Plataformas Disponibles

```bash
flutter create . --platforms=web,windows,android,ios
```

Luego ejecuta:

```bash
# Para web
flutter run -d chrome

# Para Windows
flutter run -d windows

# Para Android (si tienes emulador)
flutter run -d android
```

## ¿Qué hace `flutter create .`?

- Genera las carpetas de plataforma necesarias (`web/`, `windows/`, `android/`, `ios/`)
- Crea archivos de configuración específicos de cada plataforma
- **NO sobrescribe** tu código existente en `lib/`
- Solo agrega lo necesario para que Flutter pueda ejecutarse en esas plataformas

## Configuración para Web

Si ejecutas en web, asegúrate de que tu backend Spring Boot tenga CORS habilitado para permitir peticiones desde `http://localhost` (o el puerto que use Flutter web).

### Configurar CORS en Spring Boot

Si tu backend no tiene CORS configurado, agrega esta configuración:

```java
@Configuration
public class CorsConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins("http://localhost:*")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }
}
```

## Configuración para Windows Desktop

Para Windows desktop, puedes usar `localhost` normalmente en `app_config.dart`:

```dart
static const String baseUrl = 'http://localhost:8080/api';
```

## Recomendación

Para desarrollo y pruebas rápidas, **usa web**:

1. Es más rápido de iniciar
2. No requiere emuladores
3. Fácil de depurar con las herramientas del navegador
4. Funciona en cualquier sistema operativo

```bash
# Habilitar web
flutter create . --platforms=web

# Ejecutar en Chrome
flutter run -d chrome
```

## Notas

- `flutter create .` es seguro: no elimina ni modifica tu código en `lib/`
- Puedes habilitar múltiples plataformas a la vez
- Cada plataforma requiere configuración adicional si quieres publicar la app
- Para producción, considera compilar para la plataforma específica

## Solución Completa Paso a Paso

```bash
# 1. Navega a la carpeta del proyecto
cd C:\Users\usuario\Downloads\flutter-project-1762701897204

# 2. Habilitar web
flutter create . --platforms=web

# 3. Verificar que web esté disponible
flutter devices

# 4. Ejecutar en Chrome
flutter run -d chrome
```

¡Listo! Tu aplicación debería abrirse en Chrome.

