# Firebase Functions CORS Best Practices for Localhost

## Research Summary

Based on Firebase documentation and community best practices, here are the recommended approaches for handling CORS when calling Firebase Functions from localhost:

## 1. Firebase Functions v2 Built-in CORS (Recommended)

Firebase Functions v2 has built-in CORS support that automatically handles:
- Preflight OPTIONS requests
- CORS headers
- Origin validation

### For Development (localhost):
```javascript
const { onRequest } = require("firebase-functions/v2/https");

exports.myFunction = onRequest(
  {
    cors: true, // Allows all origins including localhost
  },
  async (req, res) => {
    // Your function logic
    res.json({ message: "Hello" });
  }
);
```

### For Production:
```javascript
exports.myFunction = onRequest(
  {
    cors: [
      "https://yourdomain.com",
      "https://www.yourdomain.com",
    ],
  },
  async (req, res) => {
    // Your function logic
    res.json({ message: "Hello" });
  }
);
```

## 2. Key Points

### ✅ DO:
- Use `cors: true` for development (allows localhost automatically)
- Use `cors: [array]` for production with specific origins
- Let Firebase Functions v2 handle CORS automatically - no manual headers needed
- The `cors` option automatically handles OPTIONS preflight requests

### ❌ DON'T:
- Manually set CORS headers when using `cors: true` (can cause conflicts)
- Use `Access-Control-Allow-Origin: "*"` with credentials
- Mix manual CORS handling with built-in `cors` option

## 3. Current Implementation Analysis

Our current code has:
- ✅ `cors: true` in function config (correct)
- ✅ OPTIONS request handling (redundant but harmless)
- ⚠️ Manual `setCorsHeaders()` function (potentially conflicting)

### Recommendation:
Since Firebase Functions v2 with `cors: true` handles everything automatically, we can simplify by removing the manual CORS header setting. The `cors: true` option:
- Automatically allows localhost during development
- Handles OPTIONS preflight requests
- Sets appropriate CORS headers

## 4. Alternative: Environment-Based CORS

For better security, you can use environment-based configuration:

```javascript
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      "https://skymessage.chatjp2.app",
      "https://ask-sky-message.web.app",
    ]
  : true; // Allow all in development (includes localhost)

exports.myFunction = onRequest(
  {
    cors: allowedOrigins,
  },
  async (req, res) => {
    // Function logic
  }
);
```

## 5. Testing Locally

### Option A: Deploy and Test
- Deploy functions with `cors: true`
- Test from localhost - should work automatically

### Option B: Use Firebase Emulators (Recommended for Development)
```bash
firebase emulators:start
```
- Functions run locally on same origin
- No CORS issues
- Faster development cycle

## 6. Troubleshooting

If CORS errors persist:
1. Ensure `cors: true` is set in function config
2. Remove any manual CORS header setting
3. Check that you're using Firebase Functions v2 (`firebase-functions/v2/https`)
4. Verify the function is deployed (not just local)
5. Check browser console for specific error messages

## 7. Security Considerations

- **Development**: `cors: true` is fine for localhost testing
- **Production**: Always specify exact origins in an array
- Never use `Access-Control-Allow-Origin: "*"` with `Access-Control-Allow-Credentials: true`

## References

- [Firebase Functions HTTP Events Documentation](https://firebase.google.com/docs/functions/http-events)
- [Firebase Functions CORS Configuration](https://firebase.google.com/docs/functions/http-events#cors)
- Firebase Functions v2 automatically handles CORS when `cors: true` is set

