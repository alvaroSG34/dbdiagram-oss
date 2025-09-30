/**
 * Servicio para exportar diagramas DBML a proyectos SpringBoot
 */

import JSZip from 'jszip'

export class SpringBootExportService {
  constructor() {
    this.packageName = 'com.example.demo'
    this.artifactId = 'demo'
    this.groupId = 'com.example'
    this.version = '0.0.1-SNAPSHOT'
    this.javaVersion = '17'
    this.springBootVersion = '3.1.0'
  }

  /**
   * Exporta un schema DBML a un proyecto SpringBoot completo
   * @param {Object} schema - Schema del diagrama DBML
   * @param {Object} options - Opciones de configuración
   * @returns {Promise<Blob>} - Archivo ZIP del proyecto
   */
  async exportToSpringBoot(schema, options = {}) {
    console.log('🚀 [SPRINGBOOT-EXPORT] Iniciando exportación', { schema, options })

    // Configurar opciones
    this.packageName = options.packageName || this.packageName
    this.artifactId = options.artifactId || this.artifactId
    this.groupId = options.groupId || this.groupId

    const zip = new JSZip()

    try {
      // 1. Crear estructura de directorios
      await this.createProjectStructure(zip)

      // 2. Generar archivos de configuración
      await this.generateConfigurationFiles(zip)

      // 3. Generar entidades JPA
      await this.generateJpaEntities(zip, schema.tables)

      // 4. Generar repositorios
      await this.generateRepositories(zip, schema.tables)

      // 5. Generar servicios
      await this.generateServices(zip, schema.tables)

      // 6. Generar DTOs
      await this.generateDTOs(zip, schema.tables)

      // 7. Generar controladores REST
      await this.generateControllers(zip, schema.tables)

      // 8. Generar aplicación principal
      await this.generateMainApplication(zip)

      // 9. Generar configuración adicional
      await this.generateConfigClasses(zip)

      // 10. Generar archivos de prueba
      await this.generateTestFiles(zip, schema.tables)

      // 11. Generar documentación
      await this.generateDocumentation(zip, schema)

      console.log('✅ [SPRINGBOOT-EXPORT] Exportación completada')
      return await zip.generateAsync({ type: 'blob' })
    } catch (error) {
      console.error('❌ [SPRINGBOOT-EXPORT] Error durante la exportación:', error)
      throw error
    }
  }

  /**
   * Crea la estructura básica de directorios del proyecto
   */
  async createProjectStructure(zip) {
    const packagePath = this.packageName.replace(/\./g, '/')
    
    // Directorios principales
    const dirs = [
      'src/main/java/' + packagePath,
      'src/main/java/' + packagePath + '/entity',
      'src/main/java/' + packagePath + '/repository',
      'src/main/java/' + packagePath + '/service',
      'src/main/java/' + packagePath + '/dto',
      'src/main/java/' + packagePath + '/controller',
      'src/main/resources',
      'src/test/java/' + packagePath,
      'src/test/resources'
    ]

    // Crear directorios (JSZip los crea automáticamente al agregar archivos)
    dirs.forEach(dir => {
      zip.folder(dir)
    })
  }

  /**
   * Genera archivos de configuración del proyecto
   */
  async generateConfigurationFiles(zip) {
    // pom.xml
    const pomXml = this.generatePomXml()
    zip.file('pom.xml', pomXml)

    // application.properties
    const applicationProperties = this.generateApplicationProperties()
    zip.file('src/main/resources/application.properties', applicationProperties)

    // application.yml (alternativo)
    const applicationYml = this.generateApplicationYml()
    zip.file('src/main/resources/application.yml', applicationYml)
  }

  /**
   * Genera las entidades JPA a partir de las tablas del schema
   */
  async generateJpaEntities(zip, tables) {
    const packagePath = this.packageName.replace(/\./g, '/')
    
    for (const table of tables) {
      const entityCode = this.generateEntityClass(table, tables)
      const fileName = `src/main/java/${packagePath}/entity/${this.capitalize(this.toCamelCase(table.name))}.java`
      zip.file(fileName, entityCode)
    }
  }

  /**
   * Genera los repositorios JPA
   */
  async generateRepositories(zip, tables) {
    const packagePath = this.packageName.replace(/\./g, '/')
    
    for (const table of tables) {
      const repositoryCode = this.generateRepositoryClass(table)
      const fileName = `src/main/java/${packagePath}/repository/${this.capitalize(this.toCamelCase(table.name))}Repository.java`
      zip.file(fileName, repositoryCode)
    }
  }

  /**
   * Genera las clases de servicio
   */
  async generateServices(zip, tables) {
    const packagePath = this.packageName.replace(/\./g, '/')
    
    for (const table of tables) {
      const serviceCode = this.generateServiceClass(table)
      const fileName = `src/main/java/${packagePath}/service/${this.capitalize(this.toCamelCase(table.name))}Service.java`
      zip.file(fileName, serviceCode)
    }
  }

  /**
   * Genera los DTOs (Data Transfer Objects)
   */
  async generateDTOs(zip, tables) {
    const packagePath = this.packageName.replace(/\./g, '/')
    
    for (const table of tables) {
      const dtoCode = this.generateDTOClass(table)
      const fileName = `src/main/java/${packagePath}/dto/${this.capitalize(this.toCamelCase(table.name))}DTO.java`
      zip.file(fileName, dtoCode)
    }
  }

  /**
   * Genera los controladores REST
   */
  async generateControllers(zip, tables) {
    const packagePath = this.packageName.replace(/\./g, '/')
    
    for (const table of tables) {
      const controllerCode = this.generateControllerClass(table)
      const fileName = `src/main/java/${packagePath}/controller/${this.capitalize(this.toCamelCase(table.name))}Controller.java`
      zip.file(fileName, controllerCode)
    }
  }

  /**
   * Genera la clase principal de la aplicación
   */
  async generateMainApplication(zip) {
    const packagePath = this.packageName.replace(/\./g, '/')
    const mainAppCode = this.generateMainApplicationClass()
    zip.file(`src/main/java/${packagePath}/DemoApplication.java`, mainAppCode)
  }

  /**
   * Genera clases de configuración adicionales
   */
  async generateConfigClasses(zip) {
    const packagePath = this.packageName.replace(/\./g, '/')
    
    // Configuración de CORS
    const corsConfigCode = this.generateCorsConfigClass()
    zip.file(`src/main/java/${packagePath}/config/CorsConfig.java`, corsConfigCode)
    
    // Configuración de Swagger/OpenAPI
    const swaggerConfigCode = this.generateSwaggerConfigClass()
    zip.file(`src/main/java/${packagePath}/config/SwaggerConfig.java`, swaggerConfigCode)
  }

  /**
   * Genera archivos de prueba
   */
  async generateTestFiles(zip, tables) {
    const packagePath = this.packageName.replace(/\./g, '/')
    
    // Clase de prueba principal
    const mainTestCode = this.generateMainTestClass()
    zip.file(`src/test/java/${packagePath}/DemoApplicationTests.java`, mainTestCode)

    // Pruebas para cada controlador
    for (const table of tables) {
      const testCode = this.generateControllerTestClass(table)
      const fileName = `src/test/java/${packagePath}/controller/${this.capitalize(this.toCamelCase(table.name))}ControllerTest.java`
      zip.file(fileName, testCode)
    }
  }

  /**
   * Genera documentación del proyecto
   */
  async generateDocumentation(zip, schema) {
    const readme = this.generateReadme(schema)
    zip.file('README.md', readme)

    const postmanCollection = this.generatePostmanCollection(schema.tables)
    zip.file('postman-collection.json', JSON.stringify(postmanCollection, null, 2))
  }

  /**
   * Genera el archivo pom.xml
   */
  generatePomXml() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>${this.springBootVersion}</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
    <groupId>${this.groupId}</groupId>
    <artifactId>${this.artifactId}</artifactId>
    <version>${this.version}</version>
    <name>${this.artifactId}</name>
    <description>Generated Spring Boot project from DBML diagram</description>
    <properties>
        <java.version>${this.javaVersion}</java.version>
        <mysql.version>8.0.33</mysql.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>\${mysql.version}</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
            <version>2.1.0</version>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>`
  }

  /**
   * Genera application.properties
   */
  generateApplicationProperties() {
    return `# Database Configuration (H2 for development)
spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
spring.datasource.driverClassName=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=password
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect

# JPA Configuration
spring.jpa.hibernate.ddl-auto=create-drop
spring.jpa.show-sql=true
spring.jpa.format-sql=true
spring.jpa.properties.hibernate.format_sql=true

# H2 Console (for development)
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console
spring.h2.console.settings.web-allow-others=true

# Server Configuration
server.port=8080
server.servlet.context-path=/

# Logging Configuration
logging.level.org.springframework.web=DEBUG
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.type.descriptor.sql.BasicBinder=TRACE

# CORS Configuration
spring.web.cors.allowed-origins=*
spring.web.cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
spring.web.cors.allowed-headers=*`
  }

  /**
   * Genera application.yml
   */
  generateApplicationYml() {
    return `spring:
  datasource:
    url: jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
    driverClassName: org.h2.Driver
    username: sa
    password: password
  jpa:
    database-platform: org.hibernate.dialect.H2Dialect
    hibernate:
      ddl-auto: create-drop
    show-sql: true
    format-sql: true
    properties:
      hibernate:
        format_sql: true
  h2:
    console:
      enabled: true
      path: /h2-console
      settings:
        web-allow-others: true
  web:
    cors:
      allowed-origins: "*"
      allowed-methods: "GET,POST,PUT,DELETE,OPTIONS"
      allowed-headers: "*"

server:
  port: 8080
  servlet:
    context-path: /

logging:
  level:
    org.springframework.web: DEBUG
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE`
  }

  /**
   * Genera una clase de entidad JPA
   */
  generateEntityClass(table, allTables) {
    console.log('🔍 [SPRINGBOOT-EXPORT] Generando entidad para tabla:', table.name)
    console.log('🔍 [SPRINGBOOT-EXPORT] Estructura de la tabla:', table)
    
    const className = this.capitalize(this.toCamelCase(table.name))
    const packagePath = this.packageName

    // Determinar qué imports necesitamos basado en los tipos de campos
    const neededImports = new Set([
      'jakarta.persistence.*',
      'jakarta.validation.constraints.*'
    ])

    // Analizar tipos de campos para determinar imports adicionales
    table.fields.forEach(field => {
      const javaType = this.getJavaType(field.type)
      if (javaType === 'LocalDateTime') {
        neededImports.add('java.time.LocalDateTime')
      } else if (javaType === 'LocalDate') {
        neededImports.add('java.time.LocalDate')
      } else if (javaType === 'BigDecimal') {
        neededImports.add('java.math.BigDecimal')
      } else if (javaType === 'List') {
        neededImports.add('java.util.List')
      }
    })

    const importsList = Array.from(neededImports).sort()

    let code = `package ${packagePath}.entity;

${importsList.map(imp => `import ${imp};`).join('\n')}

@Entity
@Table(name = "${table.name}")
public class ${className} {

`

    // Verificar si hay campo de clave primaria
    const hasPrimaryKey = table.fields.some(field => field.pk)
    
    // Si no hay PK, agregar un ID automático
    if (!hasPrimaryKey) {
      console.log('⚠️ [SPRINGBOOT-EXPORT] Tabla sin PK detectada, agregando ID automático')
      code += `    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

`
    }

    // Generar campos
    table.fields.forEach(field => {
      console.log('🔍 [SPRINGBOOT-EXPORT] Procesando campo:', field.name, 'tipo:', field.type)
      const fieldName = this.toCamelCase(field.name)
      const javaType = this.getJavaType(field.type)
      
      // Anotaciones del campo
      let annotations = []
      
      if (field.pk) {
        annotations.push('    @Id')
        if (javaType === 'Integer' || javaType === 'Long') {
          annotations.push('    @GeneratedValue(strategy = GenerationType.IDENTITY)')
        }
      }
      
      annotations.push(`    @Column(name = "${field.name}"${field.not_null ? ', nullable = false' : ''})`)
      
      if (field.not_null && !field.pk) {
        annotations.push('    @NotNull')
      }
      
      const fieldTypeString = this.getFieldTypeString(field.type)
      if (javaType === 'String' && fieldTypeString.includes('varchar')) {
        const length = fieldTypeString.match(/\((\d+)\)/)?.[1] || '255'
        annotations.push(`    @Size(max = ${length})`)
      }

      code += annotations.join('\n') + '\n'
      code += `    private ${javaType} ${fieldName};\n\n`
    })

    // Constructor vacío
    code += `    public ${className}() {}\n\n`

    // Getters y Setters para ID automático si fue agregado
    if (!hasPrimaryKey) {
      code += `    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

`
    }

    // Getters y Setters
    table.fields.forEach(field => {
      const fieldName = this.toCamelCase(field.name)
      const javaType = this.getJavaType(field.type)
      const capitalizedFieldName = this.capitalize(fieldName)

      code += `    public ${javaType} get${capitalizedFieldName}() {
        return ${fieldName};
    }

    public void set${capitalizedFieldName}(${javaType} ${fieldName}) {
        this.${fieldName} = ${fieldName};
    }

`
    })

    code += '}'
    return code
  }

  /**
   * Genera una clase Repository
   */
  generateRepositoryClass(table) {
    const className = this.capitalize(this.toCamelCase(table.name))
    const packagePath = this.packageName
    
    const pkField = table.fields.find(f => f.pk)
    const pkType = pkField ? this.getJavaType(pkField.type) : 'Long'
    
    // Si no hay PK explícita, usar Long como tipo por defecto
    const finalPkType = pkField ? pkType : 'Long'

    return `package ${packagePath}.repository;

import ${packagePath}.entity.${className};
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ${className}Repository extends JpaRepository<${className}, ${finalPkType}> {
}`
  }

  /**
   * Genera una clase Service
   */
  generateServiceClass(table) {
    const className = this.capitalize(this.toCamelCase(table.name))
    const packagePath = this.packageName
    
    const pkField = table.fields.find(f => f.pk)
    const pkType = pkField ? this.getJavaType(pkField.type) : 'Long'
    
    // Si no hay PK explícita, usar Long como tipo por defecto
    const finalPkType = pkField ? pkType : 'Long'

    return `package ${packagePath}.service;

import ${packagePath}.entity.${className};
import ${packagePath}.repository.${className}Repository;
import ${packagePath}.dto.${className}DTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ${className}Service {

    @Autowired
    private ${className}Repository repository;

    public List<${className}> findAll() {
        return repository.findAll();
    }

    public Optional<${className}> findById(${finalPkType} id) {
        return repository.findById(id);
    }

    public ${className} save(${className} entity) {
        return repository.save(entity);
    }

    public void deleteById(${finalPkType} id) {
        repository.deleteById(id);
    }

    public ${className} update(${finalPkType} id, ${className}DTO dto) {
        ${className} entity = repository.findById(id)
            .orElseThrow(() -> new RuntimeException("${className} not found with id: " + id));
        
        // Update fields from DTO
        ${this.generateUpdateFields(table)}
        
        return repository.save(entity);
    }
}`
  }

  /**
   * Genera campos de actualización para el servicio
   */
  generateUpdateFields(table) {
    return table.fields
      .filter(field => !field.pk)
      .map(field => {
        const fieldName = this.toCamelCase(field.name)
        const capitalizedFieldName = this.capitalize(fieldName)
        return `        entity.set${capitalizedFieldName}(dto.get${capitalizedFieldName}());`
      })
      .join('\n        ')
  }

  /**
   * Genera una clase DTO
   */
  generateDTOClass(table) {
    const className = this.capitalize(this.toCamelCase(table.name))
    const packagePath = this.packageName

    // Determinar qué imports necesitamos basado en los tipos de campos
    const neededImports = new Set([
      'jakarta.validation.constraints.*'
    ])

    // Analizar tipos de campos para determinar imports adicionales
    table.fields
      .filter(field => !field.pk || !field.increment)
      .forEach(field => {
        const javaType = this.getJavaType(field.type)
        if (javaType === 'LocalDateTime') {
          neededImports.add('java.time.LocalDateTime')
        } else if (javaType === 'LocalDate') {
          neededImports.add('java.time.LocalDate')
        } else if (javaType === 'BigDecimal') {
          neededImports.add('java.math.BigDecimal')
        } else if (javaType === 'List') {
          neededImports.add('java.util.List')
        }
      })

    const importsList = Array.from(neededImports).sort()

    let code = `package ${packagePath}.dto;

${importsList.map(imp => `import ${imp};`).join('\n')}

public class ${className}DTO {

`

    // Generar campos (excluyendo campos autogenerados como ID)
    table.fields
      .filter(field => !field.pk || !field.increment)
      .forEach(field => {
        const fieldName = this.toCamelCase(field.name)
        const javaType = this.getJavaType(field.type)
        
        if (field.not_null) {
          code += '    @NotNull\n'
        }
        
        const fieldTypeString = this.getFieldTypeString(field.type)
        if (javaType === 'String' && fieldTypeString.includes('varchar')) {
          const length = fieldTypeString.match(/\((\d+)\)/)?.[1] || '255'
          code += `    @Size(max = ${length})\n`
        }

        code += `    private ${javaType} ${fieldName};\n\n`
      })

    // Constructor vacío
    code += `    public ${className}DTO() {}\n\n`

    // Getters y Setters
    table.fields
      .filter(field => !field.pk || !field.increment)
      .forEach(field => {
        const fieldName = this.toCamelCase(field.name)
        const javaType = this.getJavaType(field.type)
        const capitalizedFieldName = this.capitalize(fieldName)

        code += `    public ${javaType} get${capitalizedFieldName}() {
        return ${fieldName};
    }

    public void set${capitalizedFieldName}(${javaType} ${fieldName}) {
        this.${fieldName} = ${fieldName};
    }

`
      })

    code += '}'
    return code
  }

  /**
   * Genera una clase Controller REST
   */
  generateControllerClass(table) {
    const className = this.capitalize(this.toCamelCase(table.name))
    const packagePath = this.packageName
    const resourceName = table.name.toLowerCase()
    
    const pkField = table.fields.find(f => f.pk)
    const pkType = pkField ? this.getJavaType(pkField.type) : 'Long'
    
    // Si no hay PK explícita, usar Long como tipo por defecto
    const finalPkType = pkField ? pkType : 'Long'

    return `package ${packagePath}.controller;

import ${packagePath}.entity.${className};
import ${packagePath}.service.${className}Service;
import ${packagePath}.dto.${className}DTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/${resourceName}")
@CrossOrigin(origins = "*")
public class ${className}Controller {

    @Autowired
    private ${className}Service service;

    @GetMapping
    public List<${className}> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<${className}> getById(@PathVariable ${finalPkType} id) {
        return service.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ${className} create(@Valid @RequestBody ${className}DTO dto) {
        ${className} entity = new ${className}();
        ${this.generateDTOToEntityMapping(table)}
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public ResponseEntity<${className}> update(@PathVariable ${finalPkType} id, @Valid @RequestBody ${className}DTO dto) {
        try {
            ${className} updated = service.update(id, dto);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable ${finalPkType} id) {
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}`
  }

  /**
   * Genera mapeo de DTO a Entity
   */
  generateDTOToEntityMapping(table) {
    return table.fields
      .filter(field => !field.pk || !field.increment)
      .map(field => {
        const fieldName = this.toCamelCase(field.name)
        const capitalizedFieldName = this.capitalize(fieldName)
        return `        entity.set${capitalizedFieldName}(dto.get${capitalizedFieldName}());`
      })
      .join('\n        ')
  }

  /**
   * Genera la clase principal de la aplicación
   */
  generateMainApplicationClass() {
    const packagePath = this.packageName

    return `package ${packagePath};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}`
  }

  /**
   * Genera la clase de configuración CORS
   */
  generateCorsConfigClass() {
    const packagePath = this.packageName

    return `package ${packagePath}.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(false);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(false);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}`
  }

  /**
   * Genera la clase de configuración Swagger/OpenAPI
   */
  generateSwaggerConfigClass() {
    const packagePath = this.packageName

    return `package ${packagePath}.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Generated Spring Boot API")
                        .description("API generada automáticamente desde un diagrama DBML")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("DBDiagram Generator")
                                .email("generated@dbdiagram.io")));
    }
}`
  }

  /**
   * Genera la clase de prueba principal
   */
  generateMainTestClass() {
    const packagePath = this.packageName

    return `package ${packagePath};

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class DemoApplicationTests {

    @Test
    void contextLoads() {
    }
}`
  }

  /**
   * Genera clase de prueba para controlador
   */
  generateControllerTestClass(table) {
    const className = this.capitalize(this.toCamelCase(table.name))
    const packagePath = this.packageName
    const resourceName = table.name.toLowerCase()
    
    // Obtener el tipo correcto del ID
    const pkField = table.fields.find(f => f.pk)
    const pkType = pkField ? this.getJavaType(pkField.type) : 'Long'
    const pkValue = pkType === 'Integer' ? '1' : '1L'

    return `package ${packagePath}.controller;

import ${packagePath}.entity.${className};
import ${packagePath}.service.${className}Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import java.util.Arrays;
import java.util.Optional;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(${className}Controller.class)
public class ${className}ControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ${className}Service service;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void testGetAll() throws Exception {
        ${className} entity = new ${className}();
        when(service.findAll()).thenReturn(Arrays.asList(entity));

        mockMvc.perform(get("/api/${resourceName}"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    @Test
    public void testGetById() throws Exception {
        ${className} entity = new ${className}();
        when(service.findById(${pkValue})).thenReturn(Optional.of(entity));

        mockMvc.perform(get("/api/${resourceName}/1"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }
}`
  }

  /**
   * Genera README.md
   */
  generateReadme(schema) {
    const tablesList = schema.tables.map(table => `- ${this.capitalize(this.toCamelCase(table.name))}`).join('\n')
    
    return `# Generated Spring Boot Project

Este proyecto fue generado automáticamente a partir de un diagrama DBML.

## Entidades Generadas

${tablesList}

## Cómo ejecutar

1. Importar el proyecto en tu IDE favorito (IntelliJ IDEA, Eclipse, VS Code)
2. Ejecutar el archivo \`DemoApplication.java\`
3. La aplicación estará disponible en \`http://localhost:8080\`

## Documentación API

- **Swagger UI**: \`http://localhost:8080/swagger-ui.html\`
- **OpenAPI JSON**: \`http://localhost:8080/v3/api-docs\`

## Base de Datos

Por defecto, el proyecto usa H2 (base de datos en memoria) para facilitar las pruebas.
Puedes acceder a la consola H2 en: \`http://localhost:8080/h2-console\`

- URL: \`jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE\`
- Usuario: \`sa\`
- Contraseña: \`password\`

## Endpoints API

${schema.tables.map(table => {
  const resourceName = table.name.toLowerCase()
  const className = this.capitalize(this.toCamelCase(table.name))
  return `### ${className}
- GET \`/api/${resourceName}\` - Obtener todos
- GET \`/api/${resourceName}/{id}\` - Obtener por ID
- POST \`/api/${resourceName}\` - Crear nuevo
- PUT \`/api/${resourceName}/{id}\` - Actualizar
- DELETE \`/api/${resourceName}/{id}\` - Eliminar`
}).join('\n\n')}

## Probar con Postman

Importa el archivo \`postman-collection.json\` incluido en este proyecto para probar todos los endpoints.

## Tecnologías Utilizadas

- Spring Boot ${this.springBootVersion}
- Spring Data JPA
- Spring Web
- H2 Database
- Bean Validation
- JUnit 5`
  }

  /**
   * Genera colección de Postman
   */
  generatePostmanCollection(tables) {
    const collection = {
      info: {
        name: "Generated Spring Boot API",
        description: "Collection generated from DBML diagram",
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
      },
      item: []
    }

    tables.forEach(table => {
      const className = this.capitalize(this.toCamelCase(table.name))
      const resourceName = table.name.toLowerCase()
      
      const folderItem = {
        name: className,
        item: [
          {
            name: `Get All ${className}`,
            request: {
              method: "GET",
              header: [],
              url: {
                raw: "{{baseUrl}}/api/" + resourceName,
                host: ["{{baseUrl}}"],
                path: ["api", resourceName]
              }
            }
          },
          {
            name: `Get ${className} by ID`,
            request: {
              method: "GET",
              header: [],
              url: {
                raw: "{{baseUrl}}/api/" + resourceName + "/1",
                host: ["{{baseUrl}}"],
                path: ["api", resourceName, "1"]
              }
            }
          },
          {
            name: `Create ${className}`,
            request: {
              method: "POST",
              header: [
                {
                  key: "Content-Type",
                  value: "application/json"
                }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify(this.generateSampleDTO(table), null, 2)
              },
              url: {
                raw: "{{baseUrl}}/api/" + resourceName,
                host: ["{{baseUrl}}"],
                path: ["api", resourceName]
              }
            }
          },
          {
            name: `Update ${className}`,
            request: {
              method: "PUT",
              header: [
                {
                  key: "Content-Type",
                  value: "application/json"
                }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify(this.generateSampleDTO(table), null, 2)
              },
              url: {
                raw: "{{baseUrl}}/api/" + resourceName + "/1",
                host: ["{{baseUrl}}"],
                path: ["api", resourceName, "1"]
              }
            }
          },
          {
            name: `Delete ${className}`,
            request: {
              method: "DELETE",
              header: [],
              url: {
                raw: "{{baseUrl}}/api/" + resourceName + "/1",
                host: ["{{baseUrl}}"],
                path: ["api", resourceName, "1"]
              }
            }
          }
        ]
      }
      
      collection.item.push(folderItem)
    })

    // Agregar variables de entorno
    collection.variable = [
      {
        key: "baseUrl",
        value: "http://localhost:8080",
        type: "string"
      }
    ]

    return collection
  }

  /**
   * Genera DTO de ejemplo para Postman
   */
  generateSampleDTO(table) {
    const dto = {}
    
    table.fields
      .filter(field => !field.pk || !field.increment)
      .forEach(field => {
        const fieldName = this.toCamelCase(field.name)
        const javaType = this.getJavaType(field.type)
        
        switch (javaType) {
          case 'String':
            dto[fieldName] = 'example_' + fieldName
            break
          case 'Integer':
            dto[fieldName] = 1
            break
          case 'Long':
            dto[fieldName] = 1
            break
          case 'Boolean':
            dto[fieldName] = true
            break
          case 'LocalDateTime':
            dto[fieldName] = '2023-01-01T00:00:00'
            break
          case 'LocalDate':
            dto[fieldName] = '2023-01-01'
            break
          case 'BigDecimal':
            dto[fieldName] = 10.50
            break
          case 'Double':
            dto[fieldName] = 10.5
            break
          default:
            dto[fieldName] = 'example_value'
        }
      })
    
    return dto
  }

  /**
   * Utilidades para nombres y conversiones
   */
  
  /**
   * Extrae de forma segura el tipo de un campo DBML
   */
  getFieldTypeString(fieldType) {
    if (!fieldType) {
      return 'varchar(255)'
    }
    
    if (typeof fieldType === 'string') {
      return fieldType
    }
    
    if (typeof fieldType === 'object') {
      if (fieldType.type_name) {
        return fieldType.type_name
      }
      if (fieldType.name) {
        return fieldType.name
      }
      if (fieldType.type) {
        return fieldType.type
      }
    }
    
    console.warn('⚠️ Tipo de campo no reconocido:', fieldType, 'usando varchar(255) por defecto')
    return 'varchar(255)'
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

  getJavaType(dbmlType) {
    const typeMap = {
      'int': 'Integer',
      'integer': 'Integer',
      'bigint': 'Long',
      'varchar': 'String',
      'text': 'String',
      'char': 'String',
      'boolean': 'Boolean',
      'bool': 'Boolean',
      'timestamp': 'LocalDateTime',
      'datetime': 'LocalDateTime',
      'date': 'LocalDate',
      'decimal': 'BigDecimal',
      'numeric': 'BigDecimal',
      'float': 'Double',
      'double': 'Double',
      'real': 'Double',
      'money': 'BigDecimal',
      'currency': 'BigDecimal'
    }
    
    const typeString = this.getFieldTypeString(dbmlType)
    const baseType = typeString.toLowerCase().split('(')[0].trim()
    
    // Manejar casos especiales
    if (baseType.includes('timestamp') || baseType.includes('datetime')) {
      return 'LocalDateTime'
    }
    if (baseType.includes('date') && !baseType.includes('datetime')) {
      return 'LocalDate'
    }
    if (baseType.includes('decimal') || baseType.includes('numeric') || baseType.includes('money')) {
      return 'BigDecimal'
    }
    
    return typeMap[baseType] || 'String'
  }
}

// Singleton para uso global
export const springBootExportService = new SpringBootExportService()