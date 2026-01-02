# Lesson 4.19: Migrations

> **Duration**: 30 min | **Section**: D - Python + PostgreSQL

## 🎯 The Problem (3-5 min)

Your app is in production with real users. You need to add a new column to the `users` table.

You can't just:
- Drop the table and recreate it (data would be lost!)
- Manually run ALTER TABLE on production (no record of changes!)
- Let each developer figure it out (inconsistent databases!)

> **Scenario**: Your users table needs a `phone` column. Three developers are working on the app. Production has 10,000 users. How do you add the column everywhere consistently, without losing data?

## 🧪 Try It: The Naive Approach (5-10 min)

```python
# "I'll just modify my SQLAlchemy model!"
class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    name = Column(String)
    email = Column(String)
    phone = Column(String)  # Added this!

# Run the app...
# Nothing happens! The table already exists.
# SQLAlchemy only creates tables if they don't exist.
```

What about manual SQL?

```sql
-- Developer 1 runs this on their machine
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- Developer 2 doesn't know about it
-- Their database is now different!

-- Production? Who knows what state it's in?
```

## 🔍 Under the Hood (10-15 min)

### What Are Migrations?

Migrations are **version control for your database schema**:

```mermaid
flowchart LR
    subgraph MIGRATIONS["Migration History"]
        V1["v1: Create users table"]
        V2["v2: Add email column"]
        V3["v3: Add phone column"]
        V4["v4: Create orders table"]
    end
    
    V1 --> V2 --> V3 --> V4
    
    style V3 fill:#C8E6C9,stroke:#2E7D32
```

Each migration is a Python file with:
- **upgrade()** - Apply the change
- **downgrade()** - Undo the change (rollback)

### Alembic - The Migration Tool

**Alembic** is SQLAlchemy's official migration tool.

```bash
pip install alembic
```

### Setup

```bash
# Initialize Alembic in your project
alembic init alembic

# Creates:
# alembic/
#   env.py          # Configuration
#   versions/       # Migration files go here
# alembic.ini       # Main config file
```

### Configuration

Edit `alembic.ini`:
```ini
# Change this line:
sqlalchemy.url = postgresql://user:pass@localhost:5432/myapp
```

Or better, in `alembic/env.py`:
```python
import os
from myapp.models import Base  # Import your models

# Get URL from environment
config.set_main_option("sqlalchemy.url", os.environ["DATABASE_URL"])

# Set target metadata for autogenerate
target_metadata = Base.metadata
```

### Creating Migrations

```bash
# Auto-generate migration from model changes
alembic revision --autogenerate -m "add phone column to users"
```

This creates `alembic/versions/abc123_add_phone_column_to_users.py`:

```python
"""add phone column to users

Revision ID: abc123
Revises: def456
Create Date: 2024-01-15 10:30:00

"""
from alembic import op
import sqlalchemy as sa

# Revision identifiers
revision = 'abc123'
down_revision = 'def456'
branch_labels = None
depends_on = None

def upgrade():
    # What to do when migrating forward
    op.add_column('users', sa.Column('phone', sa.String(20), nullable=True))

def downgrade():
    # What to do when rolling back
    op.drop_column('users', 'phone')
```

### Running Migrations

```bash
# Apply all pending migrations
alembic upgrade head

# Apply one migration at a time
alembic upgrade +1

# Rollback one migration
alembic downgrade -1

# Rollback to specific version
alembic downgrade abc123

# See current version
alembic current

# See migration history
alembic history
```

```mermaid
flowchart TB
    subgraph VERSIONS["Database Versions"]
        V1["v1 (initial)"]
        V2["v2 (add email)"]
        V3["v3 (add phone)"]
        V4["v4 (add orders)"]
    end
    
    CURRENT["Current: v2"]
    HEAD["Head: v4"]
    
    V1 --> V2 --> V3 --> V4
    CURRENT -.-> V2
    HEAD -.-> V4
    
    CMD["alembic upgrade head"]
    CMD -->|"Runs v3, v4"| V4
    
    style V2 fill:#BBDEFB,stroke:#1565C0
    style V4 fill:#C8E6C9,stroke:#2E7D32
```

### Common Operations

```python
from alembic import op
import sqlalchemy as sa

def upgrade():
    # Add column
    op.add_column('users', sa.Column('phone', sa.String(20)))
    
    # Add column with default
    op.add_column('users', sa.Column('is_verified', sa.Boolean(), 
                                      server_default='false'))
    
    # Create table
    op.create_table(
        'orders',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id')),
        sa.Column('total', sa.Numeric(10, 2)),
    )
    
    # Create index
    op.create_index('idx_users_email', 'users', ['email'])
    
    # Add foreign key
    op.create_foreign_key('fk_orders_user', 'orders', 'users', 
                          ['user_id'], ['id'])
    
    # Rename column
    op.alter_column('users', 'name', new_column_name='full_name')
    
    # Change column type
    op.alter_column('users', 'phone', type_=sa.String(30))

def downgrade():
    # Reverse everything in opposite order
    op.alter_column('users', 'phone', type_=sa.String(20))
    op.alter_column('users', 'full_name', new_column_name='name')
    op.drop_constraint('fk_orders_user', 'orders')
    op.drop_index('idx_users_email')
    op.drop_table('orders')
    op.drop_column('users', 'is_verified')
    op.drop_column('users', 'phone')
```

## 💥 Where It Breaks (3-5 min)

### Data Migrations

Schema changes are easy. What about data changes?

```python
def upgrade():
    # Add column
    op.add_column('users', sa.Column('full_name', sa.String(200)))
    
    # Migrate data (need to use SQL or bind)
    connection = op.get_bind()
    connection.execute(
        "UPDATE users SET full_name = first_name || ' ' || last_name"
    )
    
    # Now safe to drop old columns
    op.drop_column('users', 'first_name')
    op.drop_column('users', 'last_name')
```

### NOT NULL on Existing Tables

```python
def upgrade():
    # ❌ This fails if existing rows have NULL!
    op.add_column('users', sa.Column('phone', sa.String(20), nullable=False))
    
    # ✅ Three-step process:
    # 1. Add as nullable
    op.add_column('users', sa.Column('phone', sa.String(20), nullable=True))
    
    # 2. Backfill existing rows
    op.execute("UPDATE users SET phone = 'unknown' WHERE phone IS NULL")
    
    # 3. Add NOT NULL constraint
    op.alter_column('users', 'phone', nullable=False)
```

### Large Tables

```python
# ❌ Adding index on huge table locks it!
op.create_index('idx_users_email', 'users', ['email'])

# ✅ Use CONCURRENTLY (PostgreSQL-specific)
op.execute("CREATE INDEX CONCURRENTLY idx_users_email ON users (email)")
```

## ✅ The Fix (10-15 min)

### Production Workflow

```mermaid
flowchart TB
    DEV["1. Developer changes model"]
    GEN["2. alembic revision --autogenerate"]
    REVIEW["3. Review generated migration"]
    TEST["4. Test on staging"]
    DEPLOY["5. Deploy code + run migrations"]
    
    DEV --> GEN --> REVIEW --> TEST --> DEPLOY
    
    style REVIEW fill:#FFE0B2,stroke:#EF6C00
```

### Best Practices

```python
# alembic/env.py

def run_migrations_online():
    """Run migrations with a transaction per migration."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,  # Detect column type changes
            compare_server_default=True,  # Detect default changes
        )

        with context.begin_transaction():
            context.run_migrations()
```

### Deployment Script

```bash
#!/bin/bash
# deploy.sh

set -e  # Exit on error

echo "Running database migrations..."
alembic upgrade head

echo "Starting application..."
python -m uvicorn app:app --host 0.0.0.0 --port 8000
```

### Docker Integration

```dockerfile
# Dockerfile
FROM python:3.11

WORKDIR /app
COPY . .
RUN pip install -r requirements.txt

# Run migrations before starting app
CMD ["sh", "-c", "alembic upgrade head && python -m uvicorn app:app --host 0.0.0.0 --port 8000"]
```

### CI/CD Check

```yaml
# .github/workflows/test.yml
- name: Check for missing migrations
  run: |
    alembic revision --autogenerate -m "test" --sql
    git diff --exit-code  # Fail if migration would be generated
```

## 🎯 Practice

1. Set up Alembic in a project:
```bash
pip install alembic sqlalchemy psycopg2-binary
alembic init alembic
```

2. Create initial migration for a User model
3. Add an `is_verified` column (boolean, default false)
4. Add a `verified_at` column (timestamp, nullable)
5. Test upgrade and downgrade

## 🔑 Key Takeaways

- **Migrations are version control for database schemas**
- **Alembic** is SQLAlchemy's migration tool
- **Always review** auto-generated migrations before running
- **Test on staging** before production
- **Three-step process** for NOT NULL on existing tables
- **Use CONCURRENTLY** for indexes on large tables
- **Keep migrations small** and reversible

## ❓ Common Questions

| Question | Answer |
|----------|--------|
| "Autogenerate vs manual?" | Autogenerate catches most changes; always review and adjust |
| "Can I edit migration after running?" | Only if you haven't pushed to shared environments |
| "What if migration fails halfway?" | Each migration runs in a transaction; it rolls back |
| "How to handle conflicts?" | Merge like code; may need to adjust `down_revision` |

## 📚 Further Reading

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [Alembic Tutorial](https://alembic.sqlalchemy.org/en/latest/tutorial.html)
- [Zero-Downtime Migrations](https://www.braintreepayments.com/blog/safe-operations-for-high-volume-postgresql/)

---

**Next Lesson**: [4.20 PostgreSQL Q&A](./Lesson-04-20-PostgreSQL-QA.md) - ORM vs raw SQL, transactions, common patterns
