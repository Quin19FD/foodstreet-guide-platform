---
description: Run E2E test with Playwright MCP for the current task
---

Run comprehensive E2E test using Playwright MCP for the task just completed.

## 🧪 E2E Testing Checklist

### 1. Navigate to Page
```javascript
browser_navigate("http://localhost:3000")
```
Or specific page:
```javascript
browser_navigate("http://localhost:3000/scan")
```

### 2. Check Page Structure
```javascript
browser_snapshot()
```
- Verify accessibility tree
- Check semantic HTML structure
- Confirm interactive elements are present

### 3. Take Screenshot
```javascript
browser_take_screenshot({
  filename: "test-result.png",
  type: "png"
})
```
- For visual verification
- Save as evidence
- Use descriptive filename

### 4. Check Console Errors
```javascript
browser_console_messages({level: "error"})
```
- Look for JavaScript errors
- Check for network errors
- Verify no console warnings

### 5. Check Network Requests (if applicable)
```javascript
browser_network_requests({includeStatic: false})
```
- Verify API calls are made
- Check response codes
- Validate request payloads

### 6. Test Specific Functionality

#### For Buttons/Links:
```javascript
browser_click(element, ref)
```

#### For Forms:
```javascript
browser_fill_form({
  fields: [
    {name: "Email", type: "textbox", ref: "email-ref", value: "test@example.com"},
    {name: "Password", type: "textbox", ref: "password-ref", value: "password123"}
  ]
})
```

#### For Typing:
```javascript
browser_type({ref: "input-ref", text: "Hello World"})
```

#### For Dropdowns:
```javascript
browser_select_option({ref: "select-ref", values: ["Option 1"]})
```

### 7. Verify Results
```javascript
browser_evaluate(() => {
  // Custom JavaScript to verify state
  return {
    title: document.title,
    url: window.location.href,
    elementCount: document.querySelectorAll('.target-class').length
  }
})
```

## 📋 Test Scenarios

### Testing a New Page
1. Navigate to the page
2. Check page title
3. Verify main elements present
4. Take screenshot
5. Check console errors
6. Test navigation links
7. Test interactive elements

### Testing a Form
1. Navigate to form page
2. Fill in valid data
3. Submit form
4. Verify success/error message
5. Check console for errors
6. Take screenshots of each step

### Testing API Integration
1. Navigate to page
2. Trigger API call
3. Check network requests
4. Verify response
5. Verify UI updates correctly
6. Check console errors

### Testing Responsive Design
1. Resize browser: `browser_resize({width: 375, height: 667})`
2. Take screenshot
3. Resize again: `browser_resize({width: 1920, height: 1080})`
4. Take screenshot
5. Compare layouts

## 🚨 Error Handling

### If Console Errors Found:
1. Note the error message
2. Find the root cause
3. Fix the code
4. Re-run the test

### If Element Not Found:
1. Check if page loaded correctly
2. Verify selector is correct
3. Check if timing issue (need to wait)
4. Use `browser_wait_for` if needed

### If Test Fails:
1. Document what failed
2. Take screenshot of failure state
3. Check console for errors
4. Fix the issue
5. Re-test from the beginning

## ✅ Success Criteria

Test passes when:
- [ ] Page loads without errors
- [ ] All elements are present and visible
- [ ] Console has no errors
- [ ] Functionality works as expected
- [ ] Screenshot shows correct state
- [ ] Network requests return expected data

## 💡 Tips

1. **Always take screenshots** - They provide evidence of the test
2. **Check console first** - Errors often appear there before UI issues
3. **Use snapshots for debugging** - They show the full accessibility tree
4. **Test real user flows** - Not just individual components
5. **Test error cases** - Not just happy paths

## 🔧 Common Commands

```javascript
// Navigate and wait
browser_navigate("http://localhost:3000")
browser_wait_for({time: 2}) // wait 2 seconds

// Get page info
browser_evaluate(() => document.title)
browser_evaluate(() => window.location.href)

// Check for specific element
browser_snapshot() // look for your element in the tree

// Take full page screenshot
browser_take_screenshot({filename: "full-page.png", fullPage: true})
```

Remember: **If you don't test it, it doesn't work.**