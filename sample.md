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


  
---

## LaTex Examples

Inline formulas：$E = mc^2$

Block-level formulas：
$$
\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}
$$

More complex examples：
$$
\begin{cases}
\nabla \cdot \mathbf{E} = \frac{\rho}{\varepsilon_0} \\[2ex]
\nabla \cdot \mathbf{B} = 0 \\[2ex]
\nabla \times \mathbf{E} = -\frac{\partial \mathbf{B}}{\partial t} \\[2ex]
\nabla \times \mathbf{B} = \mu_0 \mathbf{J} + \mu_0 \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}
\end{cases}
$$