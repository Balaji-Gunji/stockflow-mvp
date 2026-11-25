
## Live Deployment

**Live Application:** https://balaji-gunji.alwaysdata.net

**GitHub Repository:** https://github.com/Balaji-Gunji/stockflow-mvp

### Hosting Configuration

- Hosting Platform: Alwaysdata
- Runtime: Node.js 22
- Database: Persistent SQLite
- Environment: Production
- HTTPS: Enabled
- Hosting Plan: Free

### Production Testing

The deployed application has been manually tested for:

- User registration and login
- Product creation, editing and deletion
- Product search by name and SKU
- Dashboard inventory statistics
- Low-stock indicators
- Multi-tenant data isolation
- Duplicate SKUs across different organizations
- Database persistence after server restart

### How to Test

1. Open the live application.
2. Register a new organization.
3. Log in using the registered credentials.
4. Add, edit, search and delete products.
5. View inventory statistics on the dashboard.
6. Configure the default low-stock threshold in Settings.
