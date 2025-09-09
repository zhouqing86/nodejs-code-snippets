import java.lang.management.ManagementFactory;
import java.lang.management.RuntimeMXBean;
import java.util.List;

public class YourTestClass {

    @BeforeEach
    public void setUp() {
        // Print JVM arguments
        RuntimeMXBean runtimeMxBean = ManagementFactory.getRuntimeMXBean();
        List<String> jvmArgs = runtimeMxBean.getInputArguments();
        System.out.println("JVM Arguments: " + jvmArgs);
    }

    @Test
    public void yourTestMethod() {
        // Your test code here
    }
}
