# Markdown Editor Test

This is a **test document** with a few features.

## Code Highlighting

```javascript
function greet(name) {
  const message = `Hello, ${name}!`;
  console.log(message);
  return message.length > 10;
}
```

```python
def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
```

## Lists & Quote

- Item one
- Item two
  - Nested item

> A blockquote with `inline code`.

| Feature | Status |
|---------|--------|
| Editor  | ✓      |
| Preview | ✓      |

## Math (KaTeX)

Inline math: the quadratic equation $ax^2 + bx + c = 0$ has solutions $x_1$ and $x_2$.

Display math:

$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$

Currency like $5 and $10 stays as plain text.
