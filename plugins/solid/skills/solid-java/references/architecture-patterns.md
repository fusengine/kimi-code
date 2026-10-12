---
name: architecture-patterns
applies-to: "**/*.java, **/*.kt"
description: Modular architecture for Java projects - modules/[feature]/ structure, import rules
when-to-use: project structure, module organization, layer separation
keywords: architecture, modules, structure, layered, modular, imports
priority: critical
related: single-responsibility.md, dependency-inversion.md
---

# Modular Architecture Patterns

**MANDATORY:** All Java projects use `modules/[feature]/` structure. Flat `src/` prohibited.

## Project Structure

```
src/main/java/com/yourapp/
├── modules/
│   ├── core/                    # Shared code (cross-feature)
│   │   ├── interfaces/
│   │   ├── services/
│   │   ├── models/
│   │   └── exceptions/
│   ├── product/                 # Feature module
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── interfaces/
│   │   ├── models/
│   │   ├── exceptions/
│   │   └── config/
│   ├── order/
│   └── payment/
```

## Layer Responsibilities

| Layer | Job | Details |
|-------|-----|---------|
| Controller | Parse request → service → response | No business logic |
| Service | Business logic, orchestration, transactions | No HTTP concerns |
| Repository | Data access with JPA | No business logic |
| Interface | Contract definition | One per file, full Javadoc |
| Model | Entities and DTOs | DTOs as `record` |

Every file stays within `FUSE_SOLID_MAX_LINES`.

## Import Rules (CRITICAL)

### ✅ ALLOWED
```java
// Within feature module
import com.yourapp.modules.product.services.ProductService;
import com.yourapp.modules.product.interfaces.ProductRepository;

// From core (shared)
import com.yourapp.modules.core.interfaces.Entity;
import com.yourapp.modules.core.exceptions.DomainException;

// Spring & libraries
import org.springframework.stereotype.Service;
```

### ❌ FORBIDDEN
```java
// Cross-module concrete classes (breaks modularity)
import com.yourapp.modules.order.services.OrderService;  // Use interface!
import com.yourapp.modules.payment.repositories.StripePaymentRepo; // Interface!

// Circular imports
// product.OrderService → order.ProductService → product.OrderService

// Internal implementation details
import com.yourapp.modules.auth.utils.PasswordHasher; // Should be in interfaces/
```

## Configuration Pattern

Each module has optional `config/` for Spring beans:

```java
@Configuration
public class ProductConfig {
    @Bean ProductValidator productValidator() {
        return new ProductValidatorImpl();
    }
}
```

## Cross-Module Communication

```java
// ✅ GOOD: Depends on interface
@Service
public class OrderService {
    private final ProductRepository productRepo; // Interface!
    public OrderService(ProductRepository repo) { this.productRepo = repo; }
}

// ❌ BAD: Depends on concrete service
@Service
public class OrderService {
    @Autowired private ProductService service; // Tight coupling!
}
```

## Refactoring Checklist

- [ ] All code in `modules/[feature]/`—no flat `src/`
- [ ] Controllers thin, no business logic
- [ ] Every file within `FUSE_SOLID_MAX_LINES`
- [ ] Interfaces small and focused, in `interfaces/` directory
- [ ] DTOs as `record` (Java 16+)
- [ ] Shared code in `modules/core/`
- [ ] No cross-module concrete imports
- [ ] No circular dependencies
- [ ] Each file has ONE responsibility
