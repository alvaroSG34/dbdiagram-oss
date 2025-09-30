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

      // 9. Generar archivos de prueba
      await this.generateTestFiles(zip, schema.tables)

      // 10. Generar documentación
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
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
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
    return `# Database Configuration
spring.datasource.url=jdbc:h2:mem:testdb
spring.datasource.driverClassName=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=password
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect

# JPA Configuration
spring.jpa.hibernate.ddl-auto=create-drop
spring.jpa.show-sql=true
spring.jpa.format-sql=true

# H2 Console (for development)
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console

# Server Configuration
server.port=8080`
  }

  /**
   * Genera application.yml
   */
  generateApplicationYml() {
    return `spring:
  datasource:
    url: jdbc:h2:mem:testdb
    driverClassName: org.h2.Driver
    username: sa
    password: password
  jpa:
    database-platform: org.hibernate.dialect.H2Dialect
    hibernate:
      ddl-auto: create-drop
    show-sql: true
    format-sql: true
  h2:
    console:
      enabled: true
      path: /h2-console

server:
  port: 8080`
  }

  /**
   * Genera una clase de entidad JPA
   */
  generateEntityClass(table, allTables) {
    console.log('🔍 [SPRINGBOOT-EXPORT] Generando entidad para tabla:', table.name)
    console.log('🔍 [SPRINGBOOT-EXPORT] Estructura de la tabla:', table)
    
    const className = this.capitalize(this.toCamelCase(table.name))
    const packagePath = this.packageName

    let imports = new Set([
      'javax.persistence.*',
      'javax.validation.constraints.*',
      'java.time.LocalDateTime'
    ])

    let code = `package ${packagePath}.entity;

import javax.persistence.*;
import javax.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "${table.name}")
public class ${className} {

`

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

    return `package ${packagePath}.repository;

import ${packagePath}.entity.${className};
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ${className}Repository extends JpaRepository<${className}, ${pkType}> {
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

    public Optional<${className}> findById(${pkType} id) {
        return repository.findById(id);
    }

    public ${className} save(${className} entity) {
        return repository.save(entity);
    }

    public void deleteById(${pkType} id) {
        repository.deleteById(id);
    }

    public ${className} update(${pkType} id, ${className}DTO dto) {
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

    let code = `package ${packagePath}.dto;

import javax.validation.constraints.*;

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

    return `package ${packagePath}.controller;

import ${packagePath}.entity.${className};
import ${packagePath}.service.${className}Service;
import ${packagePath}.dto.${className}DTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import javax.validation.Valid;
import java.util.List;

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
    public ResponseEntity<${className}> getById(@PathVariable ${pkType} id) {
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
    public ResponseEntity<${className}> update(@PathVariable ${pkType} id, @Valid @RequestBody ${className}DTO dto) {
        try {
            ${className} updated = service.update(id, dto);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable ${pkType} id) {
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
        when(service.findById(1L)).thenReturn(Optional.of(entity));

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

## Base de Datos

Por defecto, el proyecto usa H2 (base de datos en memoria) para facilitar las pruebas.
Puedes acceder a la consola H2 en: \`http://localhost:8080/h2-console\`

- URL: \`jdbc:h2:mem:testdb\`
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
      'boolean': 'Boolean',
      'timestamp': 'LocalDateTime',
      'date': 'LocalDate',
      'decimal': 'BigDecimal',
      'float': 'Double',
      'double': 'Double'
    }
    
    const typeString = this.getFieldTypeString(dbmlType)
    const baseType = typeString.toLowerCase().split('(')[0]
    return typeMap[baseType] || 'String'
  }
}

// Singleton para uso global
export const springBootExportService = new SpringBootExportService()