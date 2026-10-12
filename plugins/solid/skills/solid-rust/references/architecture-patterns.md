---
name: Architecture Patterns (Modular MANDATORY)
applies-to: "**/*.rs"
description: Modular MANDATORY architecture, src/modules/[feature]/ structure, mod.rs patterns for Rust projects
when-to-use: Project structure, organizing code, defining boundaries between features, following Rust conventions
keywords: [architecture, modules, mod.rs, modular, feature structure, src/modules, organization]
priority: high
related: [single-responsibility.md, dependency-inversion.md, interface-segregation.md]
---

# Architecture Patterns for Rust

## Mandatory Modular Structure

**RULE: Every feature lives in `src/modules/[feature]/`**

This enables:
- Clear feature boundaries
- Independent testing
- Easy onboarding
- Reduced cognitive load
- Reusable modules

---

## Standard Module Layout

```
src/
├── main.rs                        # Application entry
├── lib.rs                         # Library exports
├── core/                          # Shared abstractions
│   ├── mod.rs
│   ├── error.rs                   # Shared error types
│   ├── traits.rs                  # Cross-module traits
│   └── config.rs                  # Configuration
│
├── modules/
│   ├── user/
│   │   ├── mod.rs                 # Feature re-exports
│   │   ├── handler.rs             # HTTP endpoints
│   │   ├── service.rs             # Business logic
│   │   ├── repository.rs          # Data access
│   │   ├── model.rs               # Domain entities
│   │   ├── error.rs               # User-specific errors
│   │   ├── traits.rs              # User-specific traits
│   │   ├── dto.rs                 # Transfer objects
│   │   └── tests/
│   │       ├── mod.rs
│   │       ├── unit.rs            # Unit tests
│   │       └── integration.rs      # Integration tests
│   │
│   ├── product/
│   │   ├── mod.rs
│   │   ├── handler.rs
│   │   ├── service.rs
│   │   └── ...
│   │
│   └── order/
│       ├── mod.rs
│       ├── handler.rs
│       ├── service.rs
│       └── ...
│
└── infra/                         # Infrastructure
    ├── mod.rs
    ├── database.rs                # DB setup
    ├── server.rs                  # HTTP server
    └── middleware.rs              # Middleware setup
```

---

## mod.rs Pattern (Module Re-exports)

### Clear Public API

```rust
// src/modules/user/mod.rs
// Re-export only what's public

pub use self::handler::{create_user, get_user, update_user};
pub use self::service::UserService;
pub use self::model::User;
pub use self::error::UserError;
pub use self::traits::UserRepository;

mod handler;
mod service;
mod repository;
mod model;
mod error;
mod traits;

#[cfg(test)]
mod tests;
```

**Result:** Clear public surface
```rust
// In main.rs
use modules::user::{UserService, User, UserRepository};  // Only what's exported
```

---

### Hidden Implementation Details

```rust
// These are private to the module
mod repository {
    pub struct PgUserRepository { /* ... */ }
    // Won't be re-exported, stays internal
}

pub use self::service::UserService;
// But UserService can use PgUserRepository internally
```

---

## File Size Rules (MANDATORY)

**Every file stays within the hook ceiling `FUSE_SOLID_MAX_LINES`.** Split well before it, as soon as a file mixes responsibilities.

| File | When to Split |
|------|---------------|
| handler.rs | Several endpoints or concerns: create a `handlers/` subdir |
| service.rs | Several concerns: move methods to separate impls |
| repository.rs | Several data sources: create traits/ with dedicated files |
| mod.rs | Re-exports only |

---

## Handler Split Strategy

```
// Before: one handler.rs mixing several endpoints
user/
└── handler.rs  ❌ MIXED RESPONSIBILITIES

// After: one file per endpoint
user/
├── mod.rs
└── handlers/
    ├── mod.rs         (re-exports)
    ├── create.rs      (create_user)
    ├── update.rs      (update_user)
    └── list.rs        (list_users)
```

**handlers/mod.rs:**
```rust
pub use self::create::create_user;
pub use self::update::update_user;
pub use self::list::list_users;

mod create;
mod update;
mod list;
```

---

## Service Split Strategy

```
// Before: one service.rs mixing several concerns
user/
└── service.rs  ❌ MIXED RESPONSIBILITIES

// After: split concerns
user/
├── service.rs           (core UserService)
├── email_service.rs     (email methods)
└── validation_service.rs (validation)
```

**Composition in mod.rs:**
```rust
pub use self::service::UserService;

mod service;
mod email_service;
mod validation_service;

// UserService internally uses both
```

---

## Traits Organization

### Option 1: Single traits.rs (Small modules)

```rust
// src/modules/user/traits.rs
#[async_trait]
pub trait UserRepository: Send + Sync {
    async fn find(&self, id: u64) -> Result<User>;
    async fn save(&self, user: &User) -> Result<()>;
}

#[async_trait]
pub trait UserWriter: Send + Sync {
    async fn create(&self, input: CreateUserInput) -> Result<User>;
}
```

### Option 2: Separate trait files (Large modules)

```
user/
├── traits/
│   ├── mod.rs          (re-exports)
│   ├── repository.rs   (UserRepository)
│   ├── writer.rs       (UserWriter)
│   └── validator.rs    (UserValidator)
└── mod.rs
```

**traits/mod.rs:**
```rust
pub use self::repository::UserRepository;
pub use self::writer::UserWriter;
pub use self::validator::UserValidator;

mod repository;
mod writer;
mod validator;
```

---

## Repository Pattern (Data Access)

```
user/
├── repository/
│   ├── mod.rs          (trait + re-exports)
│   ├── pg.rs           (PostgreSQL impl)
│   ├── mock.rs         (Mock impl for testing)
│   └── sqlite.rs       (SQLite impl, optional)
└── mod.rs
```

**repository/mod.rs:**
```rust
pub use self::pg::PgUserRepository;
pub use self::mock::MockUserRepository;

pub mod pg;
pub mod mock;
pub mod sqlite;

// Trait might live in parent traits.rs
pub use crate::modules::user::traits::UserRepository;
```

---

## Cross-Module Traits

Use `src/core/traits.rs` for traits used across multiple modules:

```rust
// src/core/traits.rs

/// Trait used by multiple modules: user, order, product
#[async_trait]
pub trait Auditable: Send + Sync {
    async fn log_change(&self, entity_id: u64, change: &str) -> Result<()>;
}

// Each module implements for its domain
// src/modules/user/mod.rs
#[async_trait]
impl Auditable for User {
    async fn log_change(&self, entity_id: u64, change: &str) -> Result<()> {
        // User-specific logging
    }
}
```

---

## HTTP Router Structure

```rust
// src/infra/server.rs

pub fn create_router() -> Router {
    Router::new()
        .nest("/api/users", user_routes())
        .nest("/api/products", product_routes())
        .nest("/api/orders", order_routes())
}

fn user_routes() -> Router {
    Router::new()
        .route("/", get(list_users).post(create_user))
        .route("/:id", get(get_user).put(update_user).delete(delete_user))
}

fn product_routes() -> Router {
    // Similar structure
}
```

Each module exports its handlers:
```rust
// src/modules/user/mod.rs
pub use self::handler::{list_users, create_user, get_user, update_user, delete_user};
```

---

## Configuration & Initialization

```rust
// src/core/config.rs
pub struct Config {
    pub database_url: String,
    pub server_port: u16,
}

impl Config {
    pub fn from_env() -> Self {
        Self {
            database_url: std::env::var("DATABASE_URL").unwrap(),
            server_port: std::env::var("PORT").unwrap().parse().unwrap(),
        }
    }
}

// src/infra/database.rs
pub async fn init_db(config: &Config) -> Result<PgPool> {
    PgPoolOptions::new()
        .connect(&config.database_url)
        .await
}

// src/main.rs
#[tokio::main]
async fn main() {
    let config = Config::from_env();
    let db = init_db(&config).await.unwrap();
    let router = create_router(db);

    Server::bind(&"0.0.0.0:8080".parse().unwrap())
        .serve(router.into_make_service())
        .await
        .unwrap();
}
```

---

## Testing Structure

```
src/modules/user/
├── tests/
│   ├── mod.rs
│   ├── unit/                    # Fast, no I/O
│   │   ├── service_tests.rs
│   │   └── validation_tests.rs
│   └── integration/             # With container
│       ├── handler_tests.rs
│       └── workflow_tests.rs
└── ... (other files)
```

**tests/mod.rs:**
```rust
#[cfg(test)]
mod unit;

#[cfg(test)]
mod integration;
```

---

## Forbidden Patterns

❌ **Flat structure (wrong):**
```
src/
├── user_handler.rs
├── user_service.rs
├── user_repository.rs
├── product_handler.rs
├── product_service.rs
└── ... (chaos)
```

✓ **Modular structure (correct):**
```
src/modules/
├── user/
│   ├── handler.rs
│   ├── service.rs
│   └── repository.rs
└── product/
    ├── handler.rs
    ├── service.rs
    └── repository.rs
```

❌ **mod.rs with implementation (wrong):**
```rust
// src/modules/user/mod.rs
impl UserService {
    pub fn get_user(...) { /* 100 lines */ }  // Implementation in mod.rs!
}
```

✓ **mod.rs for re-exports only (correct):**
```rust
// src/modules/user/mod.rs
pub use self::service::UserService;
mod service;

// Implementation in separate file
```

---

## Common File Size Splits

| Original File | Split Into |
|---|---|
| handler.rs | handlers/create.rs, handlers/list.rs, handlers/update.rs |
| service.rs | service.rs (core), email_svc.rs, validation_svc.rs |
| repository.rs | repository/mod.rs (trait), repository/pg.rs, repository/mock.rs |

---

## Library vs Binary

**lib.rs** - For reusable module exports:
```rust
pub mod core;
pub mod modules;
pub use modules::user;
pub use modules::product;
```

**main.rs** - For application setup:
```rust
use my_app::{core::Config, modules, infra};

#[tokio::main]
async fn main() {
    let config = Config::from_env();
    let router = infra::create_router(config).await;
    // Start server...
}
```

This keeps library reusable, and only main.rs ties everything together.
