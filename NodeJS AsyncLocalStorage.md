The `continuation-local-storage` (CLS) module was historically used in Node.js to maintain context across asynchronous calls, similar to Java's `ThreadLocal`. However, it has been deprecated since Node.js introduced `AsyncLocalStorage` in the `async_hooks` module, which is now the recommended approach. Since you’re asking for alternatives to `continuation-local-storage`, I’ll assume you want other ways to achieve context propagation in Node.js, either because you’re working in an environment where `AsyncLocalStorage` isn’t ideal or you need a different approach. Below, I’ll outline alternatives to `continuation-local-storage` for maintaining request-scoped variables in a Node.js Express application.

### 1. **AsyncLocalStorage (Native, Recommended)**
   Although you might be looking for alternatives to `continuation-local-storage`, it’s worth noting that `AsyncLocalStorage` is its direct successor and the modern standard in Node.js.

   **Why it’s a good alternative**:
   - Built into Node.js (no external dependencies).
   - Designed for async context propagation.
   - Actively maintained and supported.

   **Example** (from previous response, for completeness):
   ```javascript
   const { AsyncLocalStorage } = require('async_hooks');
   const express = require('express');
   const app = express();

   const asyncLocalStorage = new AsyncLocalStorage();

   app.use((req, res, next) => {
       asyncLocalStorage.run(new Map(), () => {
           asyncLocalStorage.getStore().set('userId', `user-${Math.random().toString(36).slice(2)}`);
           next();
       });
   });

   app.get('/test', async (req, res) => {
       const store = asyncLocalStorage.getStore();
       await new Promise(resolve => setTimeout(resolve, 100));
       res.json({ userId: store.get('userId') });
   });

   app.listen(3000, () => console.log('Server running on port 3000'));
   ```

   **When to use**:
   - Use in Node.js 12.17.0+ (stable in 14+).
   - Ideal for most modern applications needing request-scoped context.

   **Drawbacks**:
   - Requires understanding of async context.
   - May not work well with older libraries that break async hooks.

### 2. **Express Request Locals (`req.locals`)**
   Express provides `req.locals` (or `res.locals`) as a simple way to store request-scoped data without external dependencies. This is a lightweight alternative for basic use cases.

   **Why it’s a good alternative**:
   - Built into Express, no additional packages needed.
   - Simple to use for request-scoped variables.
   - No async context management required.

   **Example**:
   ```javascript
   const express = require('express');
   const app = express();

   app.use((req, res, next) => {
       req.locals = req.locals || {};
       req.locals.userId = `user-${Math.random().toString(36).slice(2)}`;
       next();
   });

   app.get('/test', async (req, res) => {
       await new Promise(resolve => setTimeout(resolve, 100));
       res.json({ userId: req.locals.userId });
   });

   app.listen(3000, () => console.log('Server running on port 3000'));
   ```

   **When to use**:
   - Simple applications where variables only need to be passed within a single request.
   - When you don’t need complex async context propagation.

   **Drawbacks**:
   - Doesn’t automatically propagate through deep async call chains (e.g., external libraries or complex async flows).
   - Manual management of `req.locals` can become cumbersome in large apps.

### 3. **cls-hooked**
   `cls-hooked` is a fork of `continuation-local-storage` that uses `async_hooks` under the hood, making it compatible with newer Node.js versions. It’s a direct alternative if you prefer the CLS API but need something maintained.

   **Why it’s a good alternative**:
   - Familiar API for `continuation-local-storage` users.
   - Works with modern Node.js versions.
   - Supports async context propagation.

   **Installation**:
   ```bash
   npm install cls-hooked
   ```

   **Example**:
   ```javascript
   const express = require('express');
   const { createNamespace } = require('cls-hooked');
   const app = express();

   const session = createNamespace('my-session');

   app.use((req, res, next) => {
       session.run(() => {
           session.set('userId', `user-${Math.random().toString(36).slice(2)}`);
           next();
       });
   });

   app.get('/test', async (req, res) => {
       await new Promise(resolve => setTimeout(resolve, 100));
       const userId = session.get('userId');
       res.json({ userId });
   });

   app.listen(3000, () => console.log('Server running on port 3000'));
   ```

   **When to use**:
   - If you’re migrating from `continuation-local-storage` and want a similar API.
   - When you need CLS-style context management but can’t use the deprecated module.

   **Drawbacks**:
   - External dependency, less lightweight than `AsyncLocalStorage`.
   - Still relies on `async_hooks`, so it’s not fundamentally different from `AsyncLocalStorage`.

### 4. **Domain (Deprecated, Not Recommended)**
   Node.js’s `domain` module was historically used for context propagation but is now deprecated. It’s mentioned here for completeness but should be avoided in new code.

   **Why it’s not recommended**:
   - Deprecated in Node.js 12+.
   - Error-prone and lacks support for modern async patterns.
   - Replaced by `AsyncLocalStorage`.

   **Example** (for reference only):
   ```javascript
   const domain = require('domain');
   const express = require('express');
   const app = express();

   app.use((req, res, next) => {
       const d = domain.create();
       d.run(() => {
           d.userId = `user-${Math.random().toString(36).slice(2)}`;
           next();
       });
   });

   app.get('/test', async (req, res) => {
       await new Promise(resolve => setTimeout(resolve, 100));
       res.json({ userId: domain.active.userId });
   });

   app.listen(3000, () => console.log('Server running on port 3000'));
   ```

   **When to use**:
   - Only in legacy applications stuck on very old Node.js versions.
   - Migrate to `AsyncLocalStorage` or `cls-hooked` as soon as possible.

   **Drawbacks**:
   - Deprecated and unsupported.
   - Poor handling of modern async patterns (e.g., promises).

### 5. **Custom Middleware with Request Context**
   For very simple use cases, you can create a custom middleware to propagate context manually by attaching it to the request object and passing it through your application.

   **Why it’s a good alternative**:
   - No external dependencies.
   - Full control over context management.
   - Works well for small applications.

   **Example**:
   ```javascript
   const express = require('express');
   const app = express();

   // Custom context object
   app.use((req, res, next) => {
       req.context = {
           userId: `user-${Math.random().toString(36).slice(2)}`,
           set: (key, value) => { req.context[key] = value; },
           get: (key) => req.context[key]
       };
       next();
   });

   // Example middleware using context
   const asyncMiddleware = async (req, res, next) => {
       await new Promise(resolve => setTimeout(resolve, 100));
       req.context.set('processed', true);
       next();
   };

   app.get('/test', asyncMiddleware, (req, res) => {
       res.json({
           userId: req.context.get('userId'),
           processed: req.context.get('processed')
       });
   });

   app.listen(3000, () => console.log('Server running on port 3000'));
   ```

   **When to use**:
   - Small applications with straightforward request flows.
   - When you want to avoid `async_hooks`-based solutions.

   **Drawbacks**:
   - Requires manual passing of `req` or `context` to all functions.
   - Doesn’t automatically propagate through external libraries or complex async chains.

### Recommendations
- **Preferred Choice**: Use `AsyncLocalStorage` unless you have a specific reason not to. It’s native, well-supported, and designed for this purpose.
- **If CLS API is needed**: Use `cls-hooked` for a familiar API with modern Node.js compatibility.
- **For simple cases**: Use `req.locals` or a custom context object for lightweight solutions.
- **Avoid**: `continuation-local-storage` and `domain` due to deprecation.

### Additional Notes
- **Performance**: `AsyncLocalStorage` and `cls-hooked` have minimal overhead but can impact performance in hot paths if overused.
- **Compatibility**: Ensure all libraries in your stack support `async_hooks` if using `AsyncLocalStorage` or `cls-hooked`.
- **Testing**: Test thoroughly with async operations (e.g., database calls, timers) to ensure context propagation works as expected.

If you have a specific use case, legacy constraints, or need help integrating one of these approaches, let me know, and I can tailor the solution further!
