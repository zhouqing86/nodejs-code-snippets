To perform a performance test on your Kotlin and Spring API that handles file template base64 and data to generate an Excel file, and to measure CPU and memory usage when the `dryRun` parameter is enabled, you can follow these steps. The goal is to capture CPU and memory metrics before and after the Excel generation logic, but before the response is sent back. Below is a comprehensive approach to achieve this.

### Steps to Implement Performance Testing with CPU and Memory Metrics

#### 1. **Understand the Requirements**
- **API Behavior**: The API accepts a base64-encoded file template and data, processes them to generate an Excel file, and returns a response.
- **Dry Run Mode**: When `dryRun` is enabled (e.g., via a query parameter or request body flag), the API should:
  - Record CPU and memory usage before processing the request.
  - Process the Excel generation logic.
  - Record CPU and memory usage after generation but before sending the response.
  - Optionally, return these metrics in the response for analysis.

#### 2. **Set Up Metrics Collection**
To measure CPU and memory usage in a Spring application, you can use the Java Management Extensions (JMX) API or libraries like **Micrometer** for monitoring. Below, we’ll use `java.lang.management` to capture CPU and memory metrics, as it’s lightweight and built into the JDK.

#### 3. **Modify the API to Capture Metrics**
You’ll need to modify your API endpoint to capture metrics when `dryRun` is enabled. Here’s an example implementation:

```kotlin
import org.springframework.web.bind.annotation.*
import java.lang.management.ManagementFactory
import java.lang.management.OperatingSystemMXBean
import com.sun.management.UnixOperatingSystemMXBean
import java.lang.Runtime
import org.apache.poi.ss.usermodel.Workbook
import org.apache.poi.xssf.usermodel.XSSFWorkbook
import java.util.Base64

@RestController
@RequestMapping("/api")
class ExcelController {

    data class PerformanceMetrics(
        val startCpuTime: Long,
        val endCpuTime: Long,
        val startMemory: Long,
        val endMemory: Long
    )

    data class ApiResponse(
        val excelFile: String?, // Base64 encoded Excel file
        val metrics: PerformanceMetrics? // Only populated in dryRun mode
    )

    @PostMapping("/generate-excel")
    fun generateExcel(
        @RequestParam("dryRun") dryRun: Boolean = false,
        @RequestBody request: ExcelRequest // Assume this contains base64 template and data
    ): ApiResponse {
        // Initialize metrics
        var startCpuTime: Long = 0
        var endCpuTime: Long = 0
        var startMemory: Long = 0
        var endMemory: Long = 0

        // Get MXBeans for CPU and memory
        val osBean = ManagementFactory.getOperatingSystemMXBean()
        val runtime = Runtime.getRuntime()

        // Capture metrics before processing (if dryRun is enabled)
        if (dryRun) {
            startCpuTime = getCpuTime(osBean)
            startMemory = runtime.totalMemory() - runtime.freeMemory()
        }

        // Simulate or perform Excel generation
        val workbook = generateExcelFile(request.template, request.data)

        // Capture metrics after processing but before response (if dryRun is enabled)
        if (dryRun) {
            endCpuTime = getCpuTime(osBean)
            endMemory = runtime.totalMemory() - runtime.freeMemory()
        }

        // Convert workbook to base64 (or skip in dryRun if not needed)
        val excelBase64 = if (!dryRun) {
            workbook.use {
                val byteArrayOutputStream = java.io.ByteArrayOutputStream()
                it.write(byteArrayOutputStream)
                Base64.getEncoder().encodeToString(byteArrayOutputStream.toByteArray())
            }
        } else {
            null
        }

        // Return response with metrics if dryRun
        return ApiResponse(
            excelFile = excelBase64,
            metrics = if (dryRun) PerformanceMetrics(startCpuTime, endCpuTime, startMemory, endMemory) else null
        )
    }

    // Helper function to get CPU time
    private fun getCpuTime(osBean: OperatingSystemMXBean): Long {
        return if (osBean is UnixOperatingSystemMXBean) {
            osBean.processCpuTime
        } else {
            -1 // CPU time not available on this platform
        }
    }

    // Placeholder for Excel generation logic
    private fun generateExcelFile(base64Template: String, data: Map<String, Any>): Workbook {
        // Decode base64 template
        val templateBytes = Base64.getDecoder().decode(base64Template)
        val workbook = XSSFWorkbook(java.io.ByteArrayInputStream(templateBytes))

        // Apply data to workbook (implement your logic here)
        // Example: workbook.getSheetAt(0).createRow(0).createCell(0).setCellValue(data["key"].toString())

        return workbook
    }

    data class ExcelRequest(
        val template: String, // Base64 encoded template
        val data: Map<String, Any> // Data to populate the Excel
    )
}
```

#### Explanation of the Code
- **Metrics Collection**:
  - **CPU Time**: Uses `UnixOperatingSystemMXBean.processCpuTime` to get the CPU time consumed by the JVM process (in nanoseconds). Note that this is only available on Unix-like systems. For Windows, you may need a library like **Sigar** or rely on other metrics.
  - **Memory Usage**: Uses `Runtime.getRuntime()` to calculate used memory (`totalMemory - freeMemory`).
- **Dry Run Logic**: Metrics are only collected if `dryRun` is `true`. The `PerformanceMetrics` data class holds the start and end values for CPU and memory.
- **Excel Generation**: The `generateExcelFile` function is a placeholder. Replace it with your actual logic to process the base64 template and data into an Excel file using a library like **Apache POI**.
- **Response**: The `ApiResponse` includes the base64-encoded Excel file (if not in dryRun) and the performance metrics (if in dryRun).

#### 4. **Dependencies**
Ensure you have the necessary dependencies in your `build.gradle.kts` (or `pom.xml` if using Maven):

```kotlin
dependencies {
    implementation("org.apache.poi:poi:5.3.0")
    implementation("org.apache.poi:poi-ooxml:5.3.0")
    implementation("org.springframework.boot:spring-boot-starter-web")
}
```

#### 5. **Running Performance Tests**
To test the API’s performance, you can use tools like **Apache JMeter**, **Gatling**, or **k6**. Here’s how to set up a basic test with JMeter:

1. **Install JMeter**: Download and install Apache JMeter.
2. **Create a Test Plan**:
   - Add a **Thread Group** to simulate multiple users (e.g., 10, 50, 100 users).
   - Add an **HTTP Request** sampler:
     - **Method**: POST
     - **URL**: `http://localhost:8080/api/generate-excel?dryRun=true`
     - **Body**: JSON payload with `template` (base64 string) and `data`.
   - Add a **Listener** (e.g., View Results Tree, Summary Report) to analyze response times and metrics.
3. **Run the Test**: Execute the test plan and monitor the response. The `metrics` field in the response will include CPU and memory usage for each request.

#### 6. **Analyzing Results**
- **CPU Usage**: Calculate the difference (`endCpuTime - startCpuTime`) to get the CPU time consumed (in nanoseconds). Convert to milliseconds or seconds for readability.
- **Memory Usage**: Calculate `endMemory - startMemory` to get the memory consumed (in bytes). Convert to MB for clarity.
- **Response Time**: Use JMeter’s reports to analyze the API’s response time under load.
- **Bottlenecks**: Look for high CPU or memory usage spikes, which may indicate inefficient Excel generation logic (e.g., large loops or excessive object creation).

#### 7. **Optimizations (If Needed)**
If the performance test reveals issues, consider:
- **Asynchronous Processing**: Use Spring’s `@Async` or a message queue (e.g., RabbitMQ, Kafka) for heavy Excel generation tasks.
- **Caching**: Cache the template parsing if the same base64 template is reused frequently.
- **Memory Management**: Use streaming APIs in Apache POI (`SXSSFWorkbook`) for large Excel files to reduce memory usage.
- **Profiling**: Use tools like **VisualVM** or **YourKit** to profile the application and identify bottlenecks.

#### 8. **Limitations and Notes**
- **CPU Time on Windows**: The `processCpuTime` metric may not be available on Windows. Consider using a library like **Sigar** or Micrometer with Prometheus for cross-platform metrics.
- **Dry Run Overhead**: Measuring metrics adds slight overhead. Ensure this is acceptable for your use case.
- **Scalability**: For high-concurrency scenarios, test with realistic user loads and consider distributed testing with JMeter.
- **Security**: Validate the base64 template to prevent malicious input (e.g., corrupted files or XXE attacks when parsing XML-based Excel files).

#### 9. **Sample JMeter Test Script**
Here’s a basic JMeter `.jmx` file snippet for testing:

```xml
<ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="Thread Group" enabled="true">
  <stringProp name="ThreadGroup.num_threads">10</stringProp>
  <stringProp name="ThreadGroup.ramp_time">10</stringProp>
  <boolProp name="ThreadGroup.scheduler">false</boolProp>
  <elementProp name="HTTP Request" elementType="HTTPSamplerProxy">
    <stringProp name="HTTPSampler.path">/api/generate-excel?dryRun=true</stringProp>
    <stringProp name="HTTPSampler.method">POST</stringProp>
    <stringProp name="HTTPSampler.domain">localhost</stringProp>
    <stringProp name="HTTPSampler.port">8080</stringProp>
    <stringProp name="HTTPSampler.protocol">http</stringProp>
    <elementProp name="HTTPsampler.Arguments" elementType="Arguments">
      <collectionProp name="Arguments.arguments">
        <elementProp name="template" elementType="HTTPArgument">
          <stringProp name="Argument.name">template</stringProp>
          <stringProp name="Argument.value">[Your Base64 Template]</stringProp>
        </elementProp>
        <elementProp name="data" elementType="HTTPArgument">
          <stringProp name="Argument.name">data</stringProp>
          <stringProp name="Argument.value">{ "key": "value" }</stringProp>
        </elementProp>
      </collectionProp>
    </elementProp>
  </elementProp>
</ThreadGroup>
```

Replace `[Your Base64 Template]` with a valid base64-encoded Excel template.

#### 10. **Sample Response (Dry Run)**
When calling the API with `dryRun=true`, you might get:

```json
{
  "excelFile": null,
  "metrics": {
    "startCpuTime": 123456789,
    "endCpuTime": 134567890,
    "startMemory": 104857600,
    "endMemory": 209715200
  }
}
```

- **CPU Time Difference**: `(134567890 - 123456789) / 1_000_000 = ~11.11 ms`
- **Memory Difference**: `(209715200 - 104857600) / 1024 / 1024 = ~100 MB`

This approach provides a robust way to measure performance while keeping the implementation straightforward. If you need help with specific parts (e.g., JMeter setup, Excel generation logic, or additional metrics), let me know!
