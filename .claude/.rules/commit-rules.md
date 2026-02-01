# Commit Rules

## Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

## Types

- `feat`: New feature
- `fix`: Bug fix
- `chore`: Maintenance task
- `done`: Completed task/feature
- `refactor`: Code refactoring
- `docs`: Documentation
- `style`: Code style (formatting)
- `test`: Tests
- `perf`: Performance

## Scopes

- `auth` - Authentication & authorization
- `poi` - Points of Interest (gian hàng)
- `location` - GPS & location services
- `payment` - Payment gateway integration
- `order` - Order management
- `district` - District/area management
- `tts` - Text-to-Speech service
- `media` - Media storage & processing
- `analytics` - Analytics & reporting
- `qr` - QR code generation & scanning
- `web` - General web app features
- `admin` - Admin dashboard features

## Examples

```
feat(web): add QR scanner component
fix(payment): handle VNPay callback error
done(auth): implement JWT refresh flow
chore(deps): upgrade Next.js to 15.1.4
refactor(poi): extract POI card to separate component
docs(readme): update setup instructions
```

## Rules

1. Use lowercase for type and scope
2. Use imperative mood for subject ("add" not "added" or "adds")
3. Limit subject line to 72 characters
4. Use body for "what" and "why"
5. Use footer for breaking changes and references
