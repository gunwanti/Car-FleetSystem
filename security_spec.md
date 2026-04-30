# Security Specification - FleetStream Car Delivery System

## Data Invariants
1. An order must always have an origin and destination.
2. Only an admin can assign a driver to an order.
3. A driver can only update the status of an order assigned to them.
4. A driver cannot update the customer information or car details of an order.
5. All timestamps must be server-generated.

## The Dirty Dozen Payloads (Rejection Targets)
1. **Identity Theft**: Update `driverId` on an order as a non-admin.
2. **Status Skipping**: Move order from `pending` to `delivered` directly.
3. **Price Manipulation**: Change the `price` of an order after creation.
4. **Driver Impersonation**: Update another driver's location.
5. **Admin Escallation**: Setting `role: 'admin'` in the `users` collection.
6. **Shadow Fields**: Adding `isVerified: true` to a user profile.
7. **Invalid IDs**: Using a 2KB string as a `projectId`.
8. **Time Travel**: Providing a client-side `createdAt` timestamp.
9. **Orphaned Writes**: Creating an order for a driver that doesn't exist.
10. **PII Leak**: Reading all user profiles as an unauthenticated user.
11. **State Poisoning**: Setting order status to "something_random".
12. **Location Spoofing**: Updating a driver location to a non-numeric value.
